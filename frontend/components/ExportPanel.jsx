'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function MixProgressBar({ active }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (!active) { setPct(0); return }
    setPct(5)
    const id = setInterval(() => setPct(p => p>=90 ? 90 : p+Math.random()*9), 280)
    return () => clearInterval(id)
  }, [active])
  if (!active && pct===0) return null
  return (
    <div className="mt-3">
      <div className="flex justify-between font-mono mb-1" style={{ fontSize:10, color:'rgba(200,150,255,0.5)' }}>
        <span>RENDERING MIX...</span>
        <span style={{ color:'#ff6ed8' }}>{Math.round(pct)}%</span>
      </div>
      <div className="relative overflow-hidden" style={{ height:8, background:'rgba(30,5,60,0.6)', border:'1px solid rgba(180,80,180,0.3)' }}>
        <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.25 }}
          style={{ height:'100%', background:'linear-gradient(to right,#ff6ed8,#c060ff,#ffaa44)',
                   boxShadow:'0 0 8px rgba(255,110,216,0.6)' }} />
      </div>
      <div className="flex gap-px mt-1">
        {Array(24).fill(0).map((_,i) => (
          <div key={i} style={{ flex:1, height:3, transition:'background 0.2s',
            background: i<pct/4.2 ? '#ff6ed8' : 'rgba(100,20,120,0.3)' }} />
        ))}
      </div>
    </div>
  )
}

export default function ExportPanel({ onMix, onCheckCompatibility, onOptimizeSequence, onClearQueue, isMixing, mixResult, queueLength }) {
  const canMix   = queueLength>=1 && !isMixing
  const canCheck = queueLength>=2 && !isMixing

  return (
    <div className="pixel-panel p-3 mb-3" style={{ border:'2px solid rgba(96,255,170,0.25)', borderTopColor:'rgba(96,255,170,0.5)' }}>
      <h3 className="font-pixel mb-3" style={{ fontSize:8, color:'#60ffaa', textShadow:'0 0 8px #60ffaa' }}>
        CONTROLS
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <button onClick={onCheckCompatibility} disabled={!canCheck} className="arcade-btn py-2"
          style={{ fontSize:6, color:canCheck?'#ffe060':'rgba(150,80,150,0.3)',
                   borderColor:canCheck?'rgba(255,224,96,0.5)':'rgba(120,50,120,0.2)' }}>
          ◈ ANALYSE
        </button>
        <button onClick={onOptimizeSequence} disabled={!canCheck} className="arcade-btn py-2"
          style={{ fontSize:6, color:canCheck?'#c060ff':'rgba(150,80,150,0.3)',
                   borderColor:canCheck?'rgba(192,96,255,0.5)':'rgba(120,50,120,0.2)' }}>
          ★ OPTIMISE
        </button>
        <button onClick={onClearQueue} disabled={!queueLength||isMixing} className="arcade-btn py-2"
          style={{ fontSize:6, color:queueLength?'#ff4466':'rgba(150,80,150,0.3)',
                   borderColor:queueLength?'rgba(255,68,102,0.5)':'rgba(120,50,120,0.2)' }}>
          ✕ CLEAR
        </button>
      </div>

      <motion.button onClick={onMix} disabled={!canMix}
        whileTap={canMix?{scale:0.97}:{}}
        className="w-full arcade-btn py-3"
        style={{ fontSize:11, color:canMix?'#60ffaa':'rgba(150,80,150,0.3)',
                 borderColor:canMix?'rgba(96,255,170,0.7)':'rgba(120,50,120,0.2)',
                 background:canMix?'rgba(96,255,170,0.07)':'transparent',
                 boxShadow:canMix&&!isMixing?'0 0 20px rgba(96,255,170,0.2)':'none' }}>
        {isMixing ? <span className="animate-blink">● MIXING...</span> : '▶▶ RENDER MIX'}
      </motion.button>

      <MixProgressBar active={isMixing} />

      <AnimatePresence>
        {mixResult && !isMixing && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mt-3 p-3 border"
            style={{ borderColor:mixResult.simulated?'rgba(255,170,68,0.4)':'rgba(96,255,170,0.4)',
                     background:mixResult.simulated?'rgba(255,170,68,0.05)':'rgba(96,255,170,0.05)' }}>

            <div className="font-pixel mb-2" style={{ fontSize:7,
              color:mixResult.simulated?'#ffaa44':'#60ffaa',
              textShadow:`0 0 6px ${mixResult.simulated?'#ffaa44':'#60ffaa'}` }}>
              {mixResult.simulated?'◉ DEMO MODE':'✓ MIX COMPLETE'}
            </div>

            <p className="font-mono mb-2" style={{ fontSize:10, color:'rgba(200,150,255,0.6)' }}>{mixResult.message}</p>

            <div className="flex gap-4 mb-3 font-mono" style={{ fontSize:10, color:'rgba(200,150,255,0.4)' }}>
              <span>TRACKS <span style={{ color:'#e0c0ff' }}>{mixResult.tracks_mixed}</span></span>
              <span>TIME <span style={{ color:'#e0c0ff' }}>{Math.floor(mixResult.duration/60)}:{String(mixResult.duration%60).padStart(2,'0')}</span></span>
            </div>

            {!mixResult.simulated && (
              <a href={`${API}/download/${mixResult.filename}`} download={mixResult.filename}
                className="arcade-btn block text-center py-2"
                style={{ color:'#60ffaa', borderColor:'rgba(96,255,170,0.6)', background:'rgba(96,255,170,0.08)', fontSize:8 }}>
                ↓ DOWNLOAD MIX
              </a>
            )}

            {mixResult.effects_applied?.length>0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {mixResult.effects_applied.map(fx => (
                  <span key={fx} className="font-pixel border px-1"
                    style={{ fontSize:5, color:'#ff6ed8', borderColor:'rgba(255,110,216,0.3)' }}>
                    {fx.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
