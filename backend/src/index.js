import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import billingRoutes from './routes/billing.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import statusRoutes from './routes/status.js'
import stripeWebhook from './webhooks/stripeWebhook.js'

const app = express()

const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}))

// Stripe webhook needs raw body — before express.json()
app.use('/api/billing/webhook', stripeWebhook)

app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

app.use('/api/billing', billingRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/status', statusRoutes)

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }))

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`✅ AIverse API running on :${port}`))
