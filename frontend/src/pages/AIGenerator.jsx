import { useState } from 'react'
import { Sparkle, Image as ImageIcon, DownloadSimple, ShareNetwork } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from '../lib/toast.js'
import { apiFetch } from '../lib/api.js'
import { motion } from 'framer-motion'

export default function AIGenerator() {
  const { profile } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [history, setHistory] = useState([])

  // Only allow Pro users
  if (profile?.premium_plan !== 'pro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ImageIcon size={48} className="text-magenta mb-4 opacity-50" />
        <h2 className="text-2xl font-display mb-2">AI Image Generator</h2>
        <p className="text-mute mb-6 max-w-sm">This feature is exclusive to the Pro plan. Upgrade to unlock unlimited AI image generation.</p>
      </div>
    )
  }

  const generate = async (e) => {
    e?.preventDefault()
    if (!prompt.trim() || generating) return
    
    setGenerating(true)
    try {
      const { url } = await apiFetch('/api/ai/image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() })
      })
      
      // We load the image into a hidden Image object to wait for it to finish generating
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      setImageUrl(url)
      setHistory(prev => [{ url, prompt: prompt.trim() }, ...prev].slice(0, 10))
      toast.success('Image generated!')
    } catch (err) {
      toast.error(err.message || 'Failed to generate image. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `aiverse-gen-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      toast.error('Failed to download image')
    }
  }

  return (
    <section className="px-6 pt-10 pb-20 max-w-5xl mx-auto min-h-screen flex flex-col">
      <div className="mb-8">
        <p className="label-eyebrow mb-2 text-magenta">Pro Feature</p>
        <h1 className="font-display text-4xl tracking-tight">AI Imagine</h1>
      </div>

      <div className="glass-card p-6 mb-8">
        <form onSubmit={generate} className="flex flex-col md:flex-row gap-4">
          <input 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic cyberpunk city with flying cars, neon lights, 8k resolution, photorealistic..."
            className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-mute/60"
          />
          <button 
            type="submit" 
            disabled={!prompt.trim() || generating} 
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap bg-magenta shadow-[0_0_24px_rgba(255,60,172,0.45)] hover:shadow-[0_0_36px_rgba(255,60,172,0.7)] hover:bg-[#FF1A5A] disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">Generating...</span>
            ) : (
              <><Sparkle weight="fill" /> Generate</>
            )}
          </button>
        </form>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        {/* Main generation area */}
        <div className="flex-[2] glass-card flex flex-col items-center justify-center min-h-[400px] p-4 relative overflow-hidden group">
          {imageUrl ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col">
              <img src={imageUrl} alt="Generated" className="w-full h-full object-contain rounded-lg" />
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => downloadImage(imageUrl)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-magenta transition-colors backdrop-blur-md">
                  <DownloadSimple size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-mute flex flex-col items-center gap-3">
              <ImageIcon size={48} className="opacity-20" />
              <p>Enter a prompt to generate an image</p>
            </div>
          )}
          
          {generating && (
            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="h-12 w-12 rounded-full border-4 border-magenta border-t-transparent animate-spin mb-4" />
              <p className="text-magenta font-mono uppercase tracking-widest text-sm">Synthesizing</p>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="flex-1 glass-card p-4 flex flex-col">
          <h3 className="font-display text-lg mb-4 px-2">Recent</h3>
          <div className="flex-1 overflow-y-auto space-y-3 px-2">
            {history.length === 0 ? (
              <p className="text-xs text-mute text-center py-10">No recent generations</p>
            ) : (
              history.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setImageUrl(item.url)}
                  className="w-full text-left flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <img src={item.url} alt="History" className="h-16 w-16 object-cover rounded-md border border-line group-hover:border-magenta/50" />
                  <p className="text-xs text-mute line-clamp-3 leading-relaxed flex-1">{item.prompt}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
