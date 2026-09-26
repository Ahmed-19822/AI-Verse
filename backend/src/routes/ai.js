import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const FREE_DAILY_LIMIT = 20
const FREE_CHARACTER_LIMIT = 3

// POST /api/ai/message
router.post('/message', requireAuth, async (req, res) => {
  const { characterId, message } = req.body
  if (!characterId || !message?.trim()) {
    return res.status(400).json({ error: 'characterId and message are required' })
  }

  // Check plan
  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('plan, status').eq('user_id', req.user.id).single()
  const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free'

  // Free tier daily limit
  if (plan === 'free') {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const { count } = await supabaseAdmin.from('ai_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id).gte('created_at', startOfDay.toISOString())
    if ((count ?? 0) >= FREE_DAILY_LIMIT) {
      return res.status(403).json({ error: `Free plan: ${FREE_DAILY_LIMIT} AI messages/day. Upgrade to Premium for unlimited.` })
    }
  }

  // Get character
  const { data: character, error: charErr } = await supabaseAdmin
    .from('ai_characters').select('*').eq('id', characterId).single()
  if (charErr || !character) {
    console.error('character lookup error:', charErr)
    return res.status(404).json({ error: 'Character not found' })
  }

  // Get conversation history (last 10 exchanges)
  const { data: history } = await supabaseAdmin.from('ai_messages')
    .select('role, content').eq('user_id', req.user.id).eq('character_id', characterId)
    .order('created_at', { ascending: false }).limit(20)
  const historyMessages = (history || []).reverse().map((m) => ({ role: m.role, content: m.content }))

  // Get memory for premium users
  let memoryContext = ''
  if (plan !== 'free') {
    const { data: memories } = await supabaseAdmin.from('ai_memory')
      .select('content').eq('user_id', req.user.id).eq('character_id', characterId)
      .order('created_at', { ascending: false }).limit(10)
    if (memories?.length) {
      memoryContext = `\n\nWhat you remember about this user:\n${memories.map((m) => m.content).join('\n')}`
    }
  }

  // Call Anthropic
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are ${character.name}. Role: ${character.role}. Personality: ${character.personality}. Speaking style: ${character.speaking_style}. Stay in character always.${memoryContext}`,
        messages: [...historyMessages, { role: 'user', content: message }],
      }),
    })

    const aiData = await anthropicRes.json()
    if (!anthropicRes.ok) {
      console.error('Anthropic error:', aiData)
      return res.status(500).json({ error: 'AI service error: ' + (aiData.error?.message || 'unknown') })
    }

    const replyText = aiData.content?.find((b) => b.type === 'text')?.text || ''

    // Store both messages
    await supabaseAdmin.from('ai_messages').insert([
      { user_id: req.user.id, character_id: characterId, role: 'user', content: message },
      { user_id: req.user.id, character_id: characterId, role: 'assistant', content: replyText },
    ])

    res.json({ reply: replyText })
  } catch (err) {
    console.error('AI message error:', err)
    res.status(500).json({ error: 'AI did not respond — try again' })
  }
})

// POST /api/ai/characters — create custom AI (with plan limit)
router.post('/characters', requireAuth, async (req, res) => {
  const { name, role, personality, speaking_style, is_public } = req.body
  if (!name || !role || !personality || !speaking_style) {
    return res.status(400).json({ error: 'All fields required' })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('plan, status').eq('user_id', req.user.id).single()
  const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free'

  if (plan === 'free') {
    const { count } = await supabaseAdmin.from('ai_characters')
      .select('id', { count: 'exact', head: true }).eq('owner_id', req.user.id)
    if ((count ?? 0) >= FREE_CHARACTER_LIMIT) {
      return res.status(403).json({ error: `Free plan: max ${FREE_CHARACTER_LIMIT} custom characters. Upgrade to Premium.` })
    }
  }

  // Publishing to the marketplace is a Pro perk — never trust the client's is_public flag.
  const canPublish = plan === 'pro'

  const { data, error } = await supabaseAdmin.from('ai_characters')
    .insert({ owner_id: req.user.id, name, role, personality, speaking_style, is_default: false, is_public: canPublish && !!is_public })
    .select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ character: data })
})

// POST /api/ai/characters/:id/clone — add a public marketplace character to your own hub
router.post('/characters/:id/clone', requireAuth, async (req, res) => {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('plan, status').eq('user_id', req.user.id).single()
  const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free'

  if (plan === 'free') {
    const { count } = await supabaseAdmin.from('ai_characters')
      .select('id', { count: 'exact', head: true }).eq('owner_id', req.user.id)
    if ((count ?? 0) >= FREE_CHARACTER_LIMIT) {
      return res.status(403).json({ error: `Free plan: max ${FREE_CHARACTER_LIMIT} custom characters. Upgrade to Premium.` })
    }
  }

  const { data: source, error: sourceErr } = await supabaseAdmin
    .from('ai_characters').select('*').eq('id', req.params.id).eq('is_public', true).single()
  if (sourceErr || !source) return res.status(404).json({ error: 'Character not found or not public' })

  const { data, error } = await supabaseAdmin.from('ai_characters')
    .insert({
      owner_id: req.user.id, name: source.name, role: source.role,
      personality: source.personality, speaking_style: source.speaking_style,
      avatar_url: source.avatar_url, is_default: false, is_public: false,
    })
    .select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ character: data })
})

// POST /api/ai/image — Pro-only AI image generation.
// Plan is re-checked here (never trust the client-side gate in AIGenerator.jsx).
router.post('/image', requireAuth, async (req, res) => {
  const { prompt } = req.body
  if (!prompt?.trim()) return res.status(400).json({ error: 'A prompt is required' })

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('plan, status').eq('user_id', req.user.id).single()
  const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free'

  if (plan !== 'pro') {
    return res.status(403).json({ error: 'AI image generation is a Pro plan feature.' })
  }

  const seed = Math.floor(Math.random() * 1_000_000_000)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=1024&height=1024&nologo=true&seed=${seed}`
  res.json({ url })
})

export default router
