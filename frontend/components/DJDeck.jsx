'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playClick } from '@/lib/soundEngine'

const DECK_CFG = {
  A: { color:'#ff6ed8', glow:'rgba(255,110,216,0.4)' },
  B: { color:'#ffaa44', glow:'rgba(255,170,68,0.4)'  },
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function VUMeter({ playing, color }) {
  const [bars, setBars] = useState(Array(14).fill(0.06))
  useEffect(() => {
    const id = setInterval(() =>
      setBars(playing
        ? Array(14).fill(0).map(() => Math.random() * 0.85 + 0.12)
        : Array(14).fill(0.06)
      ), 90)
    return () => clearInterval(id)
  }, [playing])
  return (
    <div className="flex items-end gap-px" style={{ height:28, width:'100%' }}>
      {bars.map((h, i) => (
        <div key={i} className="flex-1 transition-all duration-75"
          style={{ height:`${h*100}%`,
            background:`linear-gradient(to top,${color},#ffe060 70%,#ff4466)`,
            boxShadow: h > 0.75 ? `0 0 4px ${color}` : 'none',
            opacity: playing ? 1 : 0.2 }} />
      ))}
    </div>
  )
}

function VinylRecord({ track, playing, color }) {
  return (
    <div className="relative" style={{ width:160, height:160, flexShrink:0 }}>
      <div className={`w-full h-full rounded-full ${playing ? 'animate-spin-slow' : ''}`}
        style={{
          background:`radial-gradient(circle at center,#1a0535 0 26%,transparent 26%),
            repeating-conic-gradient(#0f0220 0deg 5deg,#1e0840 5deg 10deg)`,
          boxShadow: playing ? `0 0 0 2px #3d1a6e,0 0 32px ${color}66` : '0 0 0 2px #2d0a6e',
          transition:'box-shadow 0.6s',
        }}>
        <div className="absolute top-1/2 left-1/2 rounded-full flex items-center justify-center text-center"
          style={{ width:'32%', height:'32%', transform:'translate(-50%,-50%)',
            background: track ? `radial-gradient(circle,${color}44,${color}11)` : '#1a0535',
            border:`1px solid ${color}55` }}>
          {track && (
            <div className="font-pixel p-1"
              style={{ fontSize:4, color, textShadow:`0 0 4px ${color}`, lineHeight:1.6 }}>
              {track.name.split(' ').slice(0,2).join('\n')}
            </div>
          )}
        </div>
        <div className="absolute bg-black rounded-full"
          style={{ width:'5%', height:'5%', top:'47.5%', left:'47.5%', zIndex:2 }} />
      </div>
      {playing && (
        <motion.div className="absolute"
          style={{ top:'4%', right:'-12%', width:'38%', height:'52%', transformOrigin:'90% 8%' }}
          initial={{ rotate:-18 }} animate={{ rotate:6 }}
          transition={{ duration:2.5, repeat:Infinity, repeatType:'reverse', ease:'easeInOut' }}>
          <div style={{ width:2, height:'90%',
            background:`linear-gradient(to bottom,#5a1090,${color})`,
            boxShadow:`0 0 5px ${color}`, marginLeft:'auto' }} />
          <div style={{ width:6, height:6, borderRadius:'50%', background:color,
            boxShadow:`0 0 10px ${color}`, marginLeft:'auto', marginTop:-3 }} />
        </motion.div>
      )}
    </div>
  )
}

function AudioPreview({ track, color }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [error,     setError]     = useState(false)

  const audioUrl = track?.file_path
    ? `${API}/audio-file?path=${encodeURIComponent(track.file_path)}`
    : null

  useEffect(() => {
    setIsPlaying(false); setProgress(0); setDuration(0); setError(false)
  }, [track?.id])

  const togglePlay = () => {
    if (!audioRef.current) return
    playClick()
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => setError(true))
      setIsPlaying(true)
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1))
  }

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  if (!audioUrl) return null

  return (
    <div className="mt-2 p-2 border"
      style={{ borderColor:`${color}33`, background:'rgba(10,2,30,0.5)' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0) }}
        onError={() => setError(true)}
      />
      {error ? (
        <p className="font-mono text-center" style={{ fontSize:9, color:'#ff4466' }}>
          ⚠ Cannot preview — mix will still work.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="arcade-btn px-2 py-1 flex-shrink-0"
            style={{ color, borderColor:`${color}66`, fontSize:8 }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div className="flex-1 relative cursor-pointer" style={{ height:8 }}
            onClick={handleSeek}>
            <div className="absolute inset-0"
              style={{ background:'rgba(150,50,180,0.2)' }} />
            <div className="absolute inset-y-0 left-0 transition-all duration-100"
              style={{ width:`${progress*100}%`, background:color,
                boxShadow:`0 0 4px ${color}` }} />
          </div>
          <span className="font-mono flex-shrink-0"
            style={{ fontSize:9, color:'rgba(200,150,255,0.5)', minWidth:32 }}>
            {duration
              ? `${Math.floor(duration/60)}:${String(Math.floor(duration%60)).padStart(2,'0')}`
              : '--:--'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function DJDeck({ deck, track, playing, onPlayToggle }) {
  const { color, glow } = DECK_CFG[deck]
  return (
    <div className="pixel-panel p-4 flex flex-col gap-3"
      style={{ border:`2px solid ${color}66`,
               boxShadow:`0 0 20px ${glow}, 0 8px 32px rgba(0,0,0,0.5)`,
               animation:'panelPulse 3s ease-in-out infinite' }}>

      <div className="flex items-center justify-between">
        <span className="font-pixel"
          style={{ fontSize:9, color, textShadow:`0 0 10px ${color}` }}>
          DECK {deck}
        </span>
        <div className="flex items-center gap-2">
          <div className="rounded-full"
            style={{ width:8, height:8,
              background: playing ? color : 'rgba(255,200,255,0.15)',
              boxShadow: playing ? `0 0 8px ${color}` : 'none',
              animation: playing ? 'pulseNeon 1s ease-in-out infinite' : 'none' }} />
          <span className="font-mono"
            style={{ fontSize:10, color:'rgba(255,200,255,0.35)' }}>
            {playing ? 'LIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <VinylRecord track={track} playing={playing} color={color} />
      </div>

      <div className="border p-2"
        style={{ borderColor:`${color}33`, background:'rgba(10,2,30,0.7)', minHeight:60 }}>
        <AnimatePresence mode="wait">
          {track ? (
            <motion.div key={track.id}
              initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div className="font-pixel truncate"
                style={{ fontSize:7, color:track.color||color,
                  textShadow:`0 0 6px ${track.color||color}88` }}>
                {track.name}
              </div>
              <div className="font-mono mt-1"
                style={{ fontSize:11, color:'rgba(220,180,255,0.5)' }}>
                {track.artist}
              </div>
              <div className="flex gap-3 mt-2 font-mono" style={{ fontSize:10 }}>
                <span style={{ color }}>{track.bpm} BPM</span>
                <span style={{ color:'rgba(255,200,255,0.4)' }}>{track.key}</span>
                <span style={{ color:'rgba(255,200,255,0.3)' }}>{track.genre}</span>
              </div>
              <AudioPreview track={track} color={color} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex items-center justify-center font-mono"
              style={{ fontSize:10, color:'rgba(150,80,180,0.4)', minHeight:50 }}>
              — NO TRACK LOADED —
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <div className="font-mono mb-1"
          style={{ fontSize:9, color:'rgba(255,200,255,0.3)' }}>LEVEL</div>
        <VUMeter playing={playing} color={color} />
      </div>

      <div className="text-center font-pixel"
        style={{ fontSize:20, color, textShadow:`0 0 16px ${color}` }}>
        {track ? track.bpm.toFixed(1) : '---'}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { playClick(); onPlayToggle() }}
          disabled={!track}
          className="flex-1 arcade-btn py-2"
          style={{ color, borderColor:`${color}88`,
            background: playing ? `${color}22` : 'transparent',
            boxShadow: playing ? `0 0 12px ${color}66` : 'none', fontSize:8 }}>
          {playing ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button onClick={() => playClick(600)} className="arcade-btn px-3"
          style={{ color:'rgba(255,200,255,0.25)',
            borderColor:'rgba(180,80,180,0.2)', fontSize:9 }}>
          ◀◀
        </button>
      </div>

      <div>
        <div className="flex justify-between font-mono mb-1"
          style={{ fontSize:9, color:'rgba(255,200,255,0.3)' }}>
          <span>PITCH</span>
          <span style={{ color }}>±0.0%</span>
        </div>
        <input type="range" min="-8" max="8" step="0.1" defaultValue="0"
          onChange={() => playClick(1000, 0.02)}
          className="w-full cursor-pointer"
          style={{ accentColor:color, height:4 }} />
      </div>
    </div>
  )
}