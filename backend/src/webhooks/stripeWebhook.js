import { Router } from 'express'
import express from 'express'
import { stripe } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const router = Router()

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_PREMIUM]: 'premium',
  [process.env.STRIPE_PRICE_PRO]: 'pro',
}

// IMPORTANT: this route must receive the *raw* body (not JSON-parsed) for
// Stripe's signature verification to work. It's mounted with express.raw()
// in index.js, before the global express.json() middleware.
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan
        if (userId && plan) {
          await upsertSubscription({
            userId,
            plan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            status: 'active',
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const priceId = sub.items.data[0]?.price?.id
        const plan = PRICE_TO_PLAN[priceId] || 'free'
        const userId = await findUserIdByCustomer(sub.customer)
        if (userId) {
          await upsertSubscription({
            userId,
            plan,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            status: sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status,
            endDate: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = await findUserIdByCustomer(sub.customer)
        if (userId) {
          // Subscription ended — downgrade to free. Never trust the frontend for this.
          await upsertSubscription({
            userId,
            plan: 'free',
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            status: 'cancelled',
            endDate: new Date().toISOString(),
          })
        }
        break
      }

      default:
        // Unhandled event types are fine to ignore.
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error', err)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

async function findUserIdByCustomer(stripeCustomerId) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()
  return data?.user_id
}

async function upsertSubscription({ userId, plan, stripeCustomerId, stripeSubscriptionId, status, endDate }) {
  await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status,
      start_date: new Date().toISOString(),
      end_date: endDate ?? null,
    },
    { onConflict: 'user_id' }
  )

  // Keep profiles in sync so the UI (which reads profile.premium_plan) reflects
  // the real plan. Only "active" subscriptions count as premium/pro for display.
  const effectivePlan = status === 'active' ? plan : 'free'
  await supabaseAdmin
    .from('profiles')
    .update({ premium_plan: effectivePlan, is_premium: effectivePlan !== 'free' })
    .eq('id', userId)
}

export default router
