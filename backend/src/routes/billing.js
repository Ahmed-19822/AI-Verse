import { Router } from 'express'
import { stripe, PRICE_IDS } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// POST /api/billing/checkout  { plan: 'premium' | 'pro' }
// Creates (or reuses) a Stripe customer for this user, then a Checkout session.
router.post('/checkout', requireAuth, async (req, res) => {
  const { plan } = req.body
  if (!PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Unknown plan' })
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single()

    let customerId = existing?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { supabase_user_id: req.user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancelled`,
      metadata: { supabase_user_id: req.user.id, plan },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('checkout error', err)
    res.status(500).json({ error: 'Could not start checkout' })
  }
})

// POST /api/billing/portal — opens the Stripe-hosted billing portal
// (manage payment method, view invoices, cancel subscription)
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single()

    if (!sub?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account yet' })
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/premium`,
    })

    res.json({ url: portal.url })
  } catch (err) {
    console.error('portal error', err)
    res.status(500).json({ error: 'Could not open billing portal' })
  }
})

export default router
