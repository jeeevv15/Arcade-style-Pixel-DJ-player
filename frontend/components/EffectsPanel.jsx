'use client'
import { motion } from 'framer-motion'
import { FX_SOUNDS, playClick } from '@/lib/soundEngine'

const EFFECTS = [
  { id:'kick',    label:'KICK',    color:'#ff4466', icon:'🥁', desc:'808 Kick' },
  { id:'snare',   label:'SNARE',   color:'#ffaa44', icon:'🪘', desc:'Snare Hit' },
  { id:'scratch', label:'SCRATCH', color:'#ffe060', icon:'💿', desc:'Vinyl Scratch' },
  { id:'gong',    label:'GONG',    color:'#60ffaa', icon:'🔔', desc:'Gong Strike' },
  { id:'filter',  label:'FILTER',  color:'#ff6ed8', icon:'🎛', desc:'Filter Sweep' },
  { id:'reverb',  label:'REVERB',  color:'#c060ff', icon:'🌊', desc:'Hall Reverb' },
  { id:'flanger', label:'FLANGE',  color:'#60d8ff', icon:'〰', desc:'Flanger' },
  { id:'echo',    label:'ECHO',    color:'#ffaa44', icon:'↩', desc:'Echo Repeats' },
]

const TRANSITIONS = [
  { id:'crossfade',     label:'XFADE',   color:'#ff6ed8' },
  { id:'cut',           label:'CUT',     color:'#ff4466' },
  { id:'long_blend',    label:'BLEND',   color:'#60ffaa' },
  { id:'fx_transition', label:'FX TRANS',color:'#ffaa44' },
]

export default function EffectsPanel({ activeEffects=[], onToggle, transitionType, onTransitionChange }) {
  const handleFX = (fx) => {
    FX_SOUNDS[fx.id]?.()
    onToggle(fx.id)
  }

  return (
    <div className="pixel-panel p-3 mb-3"
      style={{ border:'2px solid rgba(192,96,255,0.35)', borderTopColor:'rgba(192,96,255,0.7)' }}>

      <h3 className="font-pixel mb-3" style={{ fontSize:8, color:'#c060ff', textShadow:'0 0 8px #c060ff' }}>
        SOUND FX
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {EFFECTS.map(fx => {
          const on = activeEffects.includes(fx.id)
          return (
            <motion.button
              key={fx.id}
              onClick={() => handleFX(fx)}
              whileTap={{ scale:0.88, y:2 }}
              title={fx.desc}
              className="arcade-btn flex flex-col items-center py-2 gap-1 relative"
              style={{
                color: fx.color,
                borderColor: on ? fx.color : 'rgba(150,50,180,0.3)',
                background: on ? `${fx.color}22` : 'rgba(15,2,35,0.6)',
                boxShadow: on ? `0 0 12px ${fx.color}77, inset 0 0 10px ${fx.color}15, 0 4px 0 rgba(0,0,0,0.4)` : '0 4px 0 rgba(0,0,0,0.4)',
                fontSize: 6,
                transition: 'all 0.08s',
              }}
            >
              <div className="absolute top-1.5 right-1.5 rounded-full"
                style={{ width:5, height:5,
                  background: on ? fx.color : 'rgba(180,80,180,0.2)',
                  boxShadow: on ? `0 0 6px ${fx.color}` : 'none',
                  transition: 'all 0.1s' }} />
              <span style={{ fontSize:16 }}>{fx.icon}</span>
              <span className="font-pixel" style={{ fontSize:5 }}>{fx.label}</span>
            </motion.button>
          )
        })}
      </div>

      <h3 className="font-pixel mb-2" style={{ fontSize:6, color:'rgba(255,200,255,0.35)' }}>TRANSITION TYPE</h3>
      <div className="grid grid-cols-4 gap-1">
        {TRANSITIONS.map(t => {
          const on = transitionType === t.id
          return (
            <button key={t.id}
              onClick={() => { playClick(800, 0.05); onTransitionChange(t.id) }}
              className="arcade-btn py-1"
              style={{
                color: on ? t.color : 'rgba(180,80,180,0.4)',
                borderColor: on ? `${t.color}88` : 'rgba(150,50,180,0.25)',
                background: on ? `${t.color}18` : 'transparent',
                boxShadow: on ? `0 0 8px ${t.color}55` : 'none',
                fontSize: 5,
              }}>
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}