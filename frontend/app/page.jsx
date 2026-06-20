'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import DJDeck from '@/components/DJDeck'
import TrackLibrary from '@/components/TrackLibrary'
import Timeline from '@/components/Timeline'
import EffectsPanel from '@/components/EffectsPanel'
import MixScore from '@/components/MixScore'
import ExportPanel from '@/components/ExportPanel'
import Visualizer from '@/components/Visualizer'
import AddTrackModal from '@/components/AddTrackModal'
import EQPanel from '@/components/EQPanel'
import {
  fetchTracks, checkSequenceCompatibility, optimizeSequence, createMix,
} from '@/lib/api'

// Dynamic import so canvas/rAF only runs client-side
const AnimatedBackground = dynamic(() => import('@/components/AnimatedBackground'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DEMO_TRACKS = [
  { id:'1',  name:'NEON RUSH',      artist:'CYBERBEAT',  bpm:128, key:'Am',  energy:0.85, danceability:0.92, loudness:-5.2, duration:240, genre:'TECHNO',      color:'#ff6ed8' },
  { id:'2',  name:'PIXEL STORM',    artist:'RETROWAVE',  bpm:130, key:'Cm',  energy:0.92, danceability:0.88, loudness:-4.8, duration:210, genre:'HOUSE',       color:'#ffaa44' },
  { id:'3',  name:'DARK CIRCUIT',   artist:'SYNTHPUNK',  bpm:135, key:'Dm',  energy:0.78, danceability:0.75, loudness:-6.1, duration:195, genre:'TECHNO',      color:'#c060ff' },
  { id:'4',  name:'ARCADE WAVE',    artist:'8BITDJ',     bpm:126, key:'Am',  energy:0.81, danceability:0.94, loudness:-5.5, duration:225, genre:'TRANCE',      color:'#ffe060' },
  { id:'5',  name:'LASER GRID',     artist:'NEURODRIVE', bpm:140, key:'Em',  energy:0.95, danceability:0.82, loudness:-4.2, duration:180, genre:'DRUM & BASS', color:'#ff6ed8' },
  { id:'6',  name:'CHROME HORIZON', artist:'VAPORSYNTH', bpm:110, key:'F#m', energy:0.65, danceability:0.88, loudness:-7.3, duration:260, genre:'CHILL',       color:'#60ffaa' },
  { id:'7',  name:'QUANTUM BASS',   artist:'DEEPCORE',   bpm:124, key:'Gm',  energy:0.88, danceability:0.90, loudness:-4.9, duration:230, genre:'DEEP HOUSE',  color:'#c060ff' },
  { id:'8',  name:'SYNTH PHOENIX',  artist:'ELECTRIX',   bpm:128, key:'Am',  energy:0.87, danceability:0.91, loudness:-5.0, duration:215, genre:'HOUSE',       color:'#ffaa44' },
  { id:'9',  name:'BINARY SUNSET',  artist:'DATAPULSE',  bpm:120, key:'C',   energy:0.72, danceability:0.85, loudness:-6.5, duration:250, genre:'PROGRESSIVE', color:'#60d8ff' },
  { id:'10', name:'VOLTAGE DROP',   artist:'TECHNOFORM', bpm:132, key:'Fm',  energy:0.93, danceability:0.79, loudness:-4.5, duration:200, genre:'TECHNO',      color:'#ff4466' },
]

// ─── Sub components ──────────────────────────────────────────────────────────
function Cursor() {
  return <span className="animate-blink" style={{ color: '#ff6ed8' }}>_</span>
}

function PixelClock() {
  const [time, setTime] = useState('--:--:--')
  useEffect(() => {
    const t = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    t(); const id = setInterval(t, 1000); return () => clearInterval(id)
  }, [])
  return <span className="font-pixel" style={{ fontSize: 8, color: '#ff6ed8', textShadow: '0 0 8px #ff6ed8' }}>{time}</span>
}

function Crossfader({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between font-mono" style={{ fontSize: 10 }}>
        <span style={{ color: '#ff6ed8' }}>◀ DECK A</span>
        <span style={{ color: 'rgba(255,200,255,0.5)' }}>CROSSFADER</span>
        <span style={{ color: '#ffaa44' }}>DECK B ▶</span>
      </div>
      <div className="relative w-full h-5 flex items-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1.5 rounded-none"
            style={{ background:'linear-gradient(to right,#ff6ed855,#2d0a6e55 50%,#ffaa4455)' }} />
        </div>
        <input type="range" min="0" max="100" value={value} onChange={e=>onChange(Number(e.target.value))}
          className="relative w-full appearance-none cursor-pointer bg-transparent" style={{ height:20 }} />
      </div>
    </div>
  )
}

function Toast({ message, type='info' }) {
  const cfg = {
    info:    { color:'#ff6ed8', border:'rgba(255,110,216,0.35)', bg:'rgba(45,10,110,0.9)' },
    success: { color:'#60ffaa', border:'rgba(96,255,170,0.35)',  bg:'rgba(45,10,110,0.9)' },
    error:   { color:'#ff4466', border:'rgba(255,68,102,0.35)',  bg:'rgba(45,10,110,0.9)' },
    warning: { color:'#ffaa44', border:'rgba(255,170,68,0.35)',  bg:'rgba(45,10,110,0.9)' },
  }[type]
  return (
    <motion.div
      initial={{ opacity:0, y:24, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }} exit={{ opacity:0, y:-8, x:'-50%' }}
      className="fixed bottom-8 left-1/2 z-[200] px-5 py-2 font-mono text-sm pixel-panel"
      style={{ border:`1px solid ${cfg.border}`, color:cfg.color, background:cfg.bg,
               minWidth:280, textAlign:'center', boxShadow:`0 0 24px ${cfg.border}` }}>
      {message}
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DJMixerPage() {
  const [tracks, setTracks]         = useState([])
  const [queue, setQueue]           = useState([])
  const [deckA, setDeckA]           = useState(null)
  const [deckB, setDeckB]           = useState(null)
  const [playingA, setPlayingA]     = useState(false)
  const [playingB, setPlayingB]     = useState(false)
  const [activeEffects, setActiveEffects] = useState([])
  const [transitionType, setTransitionType] = useState('crossfade')
  const [compatibility, setCompatibility] = useState(null)
  const [mixResult, setMixResult]   = useState(null)
  const [isMixing, setIsMixing]     = useState(false)
  const [isBusy, setIsBusy]         = useState(false)
  const [crossfader, setCrossfader] = useState(50)
  const [toast, setToast]           = useState(null)
  const [apiOnline, setApiOnline]   = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/health`).then(r=>r.ok&&r.json()).then(d=>d&&setApiOnline(true)).catch(()=>setApiOnline(false))
  }, [])

  useEffect(() => {
    fetchTracks()
      .then(d => setTracks(d.tracks || []))
      .catch(() => { setTracks(DEMO_TRACKS); showToast('API OFFLINE — DEMO MODE','warning') })
  }, [])

  const showToast = useCallback((message, type='info') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const addToQueue = useCallback((track) => {
    const item = { ...track, _qid:`${track.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
    setQueue(prev => [...prev, item])
    setCompatibility(null)
    showToast(`${track.name} → QUEUE`, 'success')
  }, [showToast])

  const removeFromQueue = useCallback((index) => {
    setQueue(prev => prev.filter((_,i) => i !== index))
    setCompatibility(null); setMixResult(null)
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([]); setCompatibility(null); setMixResult(null)
    showToast('QUEUE CLEARED','info')
  }, [showToast])

  const loadDeckA = useCallback((t) => { setDeckA(t); setPlayingA(false); showToast(`${t.name} → DECK A`,'info') }, [showToast])
  const loadDeckB = useCallback((t) => { setDeckB(t); setPlayingB(false); showToast(`${t.name} → DECK B`,'info') }, [showToast])

  const toggleEffect = useCallback((fx) =>
    setActiveEffects(prev => prev.includes(fx) ? prev.filter(e=>e!==fx) : [...prev,fx]), [])

  const handleCheck = useCallback(async () => {
    if (queue.length < 2) return showToast('NEED AT LEAST 2 TRACKS','warning')
    setIsBusy(true)
    try {
      const r = await checkSequenceCompatibility(queue)
      setCompatibility(r)
      const s = r.sequence_score
      showToast(`SEQUENCE SCORE: ${s}%`, s>=65?'success':s>=40?'warning':'error')
    } catch { showToast('API ERROR — IS BACKEND RUNNING?','error') }
    finally { setIsBusy(false) }
  }, [queue, showToast])

  const handleOptimize = useCallback(async () => {
    if (queue.length < 2) return showToast('NEED AT LEAST 2 TRACKS','warning')
    setIsBusy(true)
    try {
      const r = await optimizeSequence(queue)
      const reordered = r.optimized.map(t => ({
        ...t, _qid:`${t.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`
      }))
      setQueue(reordered); setCompatibility(null)
      showToast(r.improved?`OPTIMISED! +${r.gain}% GAIN`:'ALREADY OPTIMAL', r.improved?'success':'info')
    } catch { showToast('API ERROR','error') }
    finally { setIsBusy(false) }
  }, [queue, showToast])

  const handleMix = useCallback(async () => {
    if (!queue.length) return showToast('ADD TRACKS TO MIX','warning')
    setIsMixing(true); setMixResult(null)
    try {
      const r = await createMix(queue, activeEffects, transitionType)
      setMixResult(r)
      showToast(r.simulated?'DEMO MIX RENDERED':'✓ MIX READY!','success')
    } catch { showToast('MIX FAILED — CHECK BACKEND','error') }
    finally { setIsMixing(false) }
  }, [queue, activeEffects, transitionType, showToast])

 const handleTrackAdded = useCallback((t) => {
  setTracks(prev => [t, ...prev])
  showToast(`${t.name} ADDED TO LIBRARY`, 'success')
  setShowAddModal(false)
  // Re-fetch so any background analysis updates show up after a delay
  setTimeout(() => {
    fetchTracks().then(d => setTracks(d.tracks || [])).catch(() => {})
  }, 3000)
}, [showToast])

  const isActive = playingA || playingB || isMixing

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      {/* Animated background — fixed, full-screen */}
      <AnimatedBackground />

      {/* All content on top */}
      <div style={{ position:'relative', zIndex:10 }}>

        {/* ═══ HEADER ════════════════════════════════════════ */}
        <header style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 20px',
          background:'rgba(20,5,50,0.75)',
          borderBottom:'2px solid rgba(192,50,138,0.5)',
          backdropFilter:'blur(12px)',
          position:'sticky', top:0, zIndex:100,
        }}>
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{
                width:8, height:8, borderRadius:'50%',
                background: apiOnline ? '#60ffaa' : '#ff4466',
                boxShadow: `0 0 8px ${apiOnline ? '#60ffaa':'#ff4466'}`,
                animation:'pulseNeon 1.5s ease-in-out infinite',
              }} />
              <span className="font-mono" style={{ fontSize:10, color:'rgba(255,200,255,0.55)' }}>
                {apiOnline ? 'API ONLINE' : 'DEMO MODE'}
              </span>
            </div>
            <button onClick={() => setShowAddModal(true)} className="arcade-btn"
              style={{ color:'#ffaa44', borderColor:'rgba(255,170,68,0.5)', fontSize:7 }}>
              + ADD TRACK
            </button>
          </div>

          {/* Centre title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <h1 className="font-pixel animate-header-glow" style={{
              fontSize:18, color:'#ff6ed8', letterSpacing:5,
            }}>
              PIXEL DJ<Cursor />
            </h1>
            <div className="font-pixel" style={{ fontSize:5, color:'#ffaa44', letterSpacing:4, marginTop:3,
              textShadow:'0 0 6px #ffaa44' }}>
              ARCADE MIXER v1.0
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            <div className="text-right font-mono" style={{ fontSize:10, color:'rgba(255,200,255,0.4)' }}>
              <div>QUEUE <span style={{ color:'#ffe060' }}>{queue.length}</span></div>
              <div>FX <span style={{ color:'#ff6ed8' }}>{activeEffects.length}</span></div>
            </div>
            <PixelClock />
          </div>
        </header>

        {/* ═══ MIXER SURFACE ══════════════════════════════════ */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'230px 1fr 230px',
          gap:12, padding:'12px 12px 0',
          alignItems:'start',
        }}>
          {/* DECK A */}
          <DJDeck deck="A" track={deckA} playing={playingA}
            onPlayToggle={() => { if(deckA) setPlayingA(p=>!p) }} />

          {/* CENTRE */}
          <div>
            {/* Visualiser */}
            <div className="pixel-panel p-2 mb-3 animate-panel-pulse" style={{ border:'1px solid rgba(192,50,138,0.4)' }}>
              <Visualizer active={isActive} color="#ff6ed8" barCount={56} height={56} />
            </div>

            {/* Crossfader */}
            <div className="pixel-panel px-4 py-3 mb-3" style={{ border:'1px solid rgba(192,50,138,0.3)' }}>
              <Crossfader value={crossfader} onChange={setCrossfader} />
            </div>

            <EQPanel />
            <Timeline queue={queue} onReorder={setQueue} onRemove={removeFromQueue}
              pairScores={compatibility?.pair_scores||[]} />
            <EffectsPanel activeEffects={activeEffects} onToggle={toggleEffect}
              transitionType={transitionType} onTransitionChange={setTransitionType} />
            <AnimatePresence>{compatibility && <MixScore score={compatibility} />}</AnimatePresence>
            <ExportPanel onMix={handleMix} onCheckCompatibility={handleCheck}
              onOptimizeSequence={handleOptimize} onClearQueue={clearQueue}
              isMixing={isMixing||isBusy} mixResult={mixResult} queueLength={queue.length} />
          </div>

          {/* DECK B */}
          <DJDeck deck="B" track={deckB} playing={playingB}
            onPlayToggle={() => { if(deckB) setPlayingB(p=>!p) }} />
        </div>

        {/* ═══ TRACK LIBRARY ════════════════════════════════ */}
        <div style={{ padding:'12px' }}>
          <TrackLibrary
           tracks={tracks}
          onAddToQueue={addToQueue}
          onLoadDeckA={loadDeckA}
          onLoadDeckB={loadDeckB}
          onTrackUpdated={(updated) => {
          setTracks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
          showToast(`AUDIO LINKED TO ${updated.name}`, 'success')
         }}
        />
        </div>

        {/* ═══ CAT SIGHTING COUNTER ═══════════════════════ */}
        <CatCounter />

      </div>

      {/* Modals / toasts */}
      <AnimatePresence>{showAddModal && (
        <AddTrackModal onClose={()=>setShowAddModal(false)} onTrackAdded={handleTrackAdded} />
      )}</AnimatePresence>
      <AnimatePresence>{toast && <Toast key={toast.id} message={toast.message} type={toast.type} />}</AnimatePresence>
    </div>
  )
}

// ─── Easter-egg cat counter ──────────────────────────────────────────────────
function CatCounter() {
  const [count, setCount] = useState(0)
  const [show, setShow]   = useState(false)
  useEffect(() => {
    const inc = () => { setCount(c => c+1); setShow(true); setTimeout(()=>setShow(false), 2000) }
    window.addEventListener('catclick', inc)
    return () => window.removeEventListener('catclick', inc)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
          style={{
            position:'fixed', bottom:24, right:24, zIndex:50,
            background:'rgba(30,5,60,0.9)', border:'2px solid rgba(255,110,216,0.5)',
            padding:'8px 14px', backdropFilter:'blur(8px)',
          }}>
          <span className="font-pixel" style={{ fontSize:7, color:'#ff6ed8' }}>
            🐱 × {count} CATS SPOTTED!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
