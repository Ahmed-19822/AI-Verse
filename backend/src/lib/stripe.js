import Stripe from 'stripe'
import 'dotenv/config'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const PRICE_IDS = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
  pro: process.env.STRIPE_PRICE_PRO,
}
