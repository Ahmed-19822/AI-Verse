import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, PaperPlaneRight, Sparkle, Trash, Microphone, SpeakerHigh } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { apiFetch } from '../lib/api.js'
import { toast } from '../lib/toast.js'

export default function AIHub() {
  const { user } = useAuth()
  const [characters, setCharacters] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const { profile } = useAuth()

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setDraft(d => d + (d ? ' ' : '') + text);
      }
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = (e) => {
        console.error(e); setListening(false); toast.error('Microphone error');
      }
    }
  }, [])

  const toggleListen = () => {
    if (profile?.premium_plan !== 'pro') {
      toast.error('Voice AI requires Pro plan.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      if (!recognitionRef.current) { toast.error('Browser does not support Voice AI'); return; }
      recognitionRef.current?.start()
      setListening(true)
    }
  }

  const speak = (text) => {
    if (profile?.premium_plan !== 'pro') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 1.1;
      window.speechSynthesis.speak(msg);
    }
  }

  // Load all characters (no RLS filter needed — policy handles it)
  useEffect(() => {
    supabase.from('ai_characters').select('*').order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('characters error:', error); toast.error('Could not load characters') }
        setCharacters(data || [])
        setLoading(false)
      })
  }, [])

  // Load message history when character changes
  useEffect(() => {
    if (!active || !user?.id) return
    setLoadingMsgs(true)
    supabase.from('ai_messages').select('*')
      .eq('user_id', user.id)
      .eq('character_id', active.id)
      .order('created_at')
      .limit(50)
      .then(({ data }) => { setMessages(data || []); setLoadingMsgs(false) })
  }, [active?.id, user?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !active || sending) return

    const text = draft.trim()
    setDraft('')
    const tempId = 'temp-' + Date.now()
    setMessages((m) => [...m, { id: tempId, role: 'user', content: text }])
    setSending(true)

    try {
      const json = await apiFetch('/api/ai/message', {
        method: 'POST',
        body: JSON.stringify({ characterId: active.id, message: text })
      })

      setMessages((m) => [...m, { id: 'reply-' + Date.now(), role: 'assistant', content: json.reply }])
      
      if (profile?.premium_plan === 'pro') {
        speak(json.reply)
      }
    } catch (err) {
      toast.error(err.message)
      // Remove the optimistic user message on failure
      setMessages((m) => m.filter((msg) => msg.id !== tempId))
      setDraft(text)
    } finally {
      setSending(false)
    }
  }

  const clearHistory = async () => {
    if (!active || !user?.id) return
    await supabase.from('ai_messages').delete().eq('user_id', user.id).eq('character_id', active.id)
    setMessages([])
    toast.success('Chat history cleared')
  }

  return (
    <section className="pt-6 md:pt-10 px-4 pb-4 max-w-7xl mx-auto flex-1 flex flex-col w-full min-h-0">
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 glass-card p-3 flex flex-col">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <h2 className="font-display text-lg">AI Hub</h2>
            <Link to="/ai-creator" className="h-8 w-8 flex items-center justify-center rounded-lg glass hover:border-cyan/50 transition-colors" title="Create AI">
              <Plus size={16} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {loading && <p className="text-xs text-mute px-3 py-2 text-center">Loading characters…</p>}
            {!loading && characters.length === 0 && <p className="text-xs text-mute px-3 py-2 text-center">No characters found.</p>}

            {characters.map((c) => (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors ${active?.id === c.id ? 'bg-violet/20 border border-violet/40' : 'hover:bg-white/5'}`}>
                <Sparkle size={16} className="text-cyan shrink-0" weight="duotone" />
                <span className="truncate">{c.name}</span>
                {!c.is_default && <span className="text-[10px] text-violet ml-auto">Custom</span>}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 glass-card flex flex-col min-h-0">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-mute gap-3">
              <Sparkle size={40} className="opacity-30" weight="duotone" />
              <p className="text-sm">Pick a mind to talk to</p>
              <p className="text-xs opacity-60">Choose a character from the left sidebar</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center">
                    <Sparkle size={16} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{active.name}</p>
                    <p className="text-xs text-mute">{active.role}</p>
                  </div>
                </div>
                <button onClick={clearHistory} className="text-mute hover:text-magenta p-2 rounded-lg glass hover:border-magenta/30 transition-colors" title="Clear history">
                  <Trash size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingMsgs && <p className="text-center text-mute text-sm">Loading history…</p>}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="text-center text-mute mt-10">
                    <p className="text-sm">Start a conversation with {active.name}</p>
                    <p className="text-xs mt-1 opacity-60">{active.personality}</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {m.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center shrink-0">
                        <Sparkle size={12} weight="fill" className="text-white" />
                      </div>
                    )}
                    <div className="group relative">
                      <div className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-violet/30 border border-violet/40 rounded-br-sm' : 'glass rounded-bl-sm'}`}>
                        {m.content}
                      </div>
                      {m.role === 'assistant' && profile?.premium_plan === 'pro' && (
                        <button onClick={() => speak(m.content)} className="absolute -top-3 -right-3 h-6 w-6 bg-surface border border-line rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan">
                          <SpeakerHigh size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex items-end gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center shrink-0">
                      <Sparkle size={12} weight="fill" className="text-white" />
                    </div>
                    <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-mute animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-mute animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-mute animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex items-center gap-2 p-4 border-t border-line">
                <button type="button" onClick={toggleListen} className={`h-11 w-11 flex items-center justify-center rounded-xl transition-colors ${listening ? 'bg-magenta/20 text-magenta border border-magenta/40 animate-pulse' : 'glass text-mute hover:text-cyan'}`} title="Voice Dictation (Pro)">
                  <Microphone size={18} weight={listening ? "fill" : "regular"} />
                </button>
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${active.name}…`}
                  disabled={sending}
                  className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-mute/60 disabled:opacity-50" />
                <button type="submit" disabled={!draft.trim() || sending}
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet hover:bg-violet-bright transition-colors disabled:opacity-40">
                  <PaperPlaneRight size={18} weight="fill" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
