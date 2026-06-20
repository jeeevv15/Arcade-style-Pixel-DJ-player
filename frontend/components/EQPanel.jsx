'use client'
import { useState, useRef, useCallback } from 'react'

function Knob({ label, value, onChange, color='#ff6ed8', min=-12, max=12 }) {
  const dragging = useRef(false), startY = useRef(0), startVal = useRef(0)
  const pct = (value-min)/(max-min)
  const deg = pct*270-135

  const onDown = useCallback(e => {
    dragging.current=true; startY.current=e.clientY; startVal.current=value
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [value])

  const onMove = useCallback(e => {
    if (!dragging.current) return
    const delta = ((startY.current-e.clientY)/120)*(max-min)
    onChange(Math.round(Math.max(min,Math.min(max,startVal.current+delta))*10)/10)
  }, [min, max, onChange])

  const onUp = () => { dragging.current=false }

  const ticks = Array.from({length:9},(_,i) => {
    const a=(i/8)*270-135, rad=(a*Math.PI)/180, r1=22, r2=27
    return { x1:30+r1*Math.sin(rad), y1:30-r1*Math.cos(rad), x2:30+r2*Math.sin(rad), y2:30-r2*Math.cos(rad), on:pct>=i/8-0.01 }
  })

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={60} height={62} style={{ cursor:'ns-resize', overflow:'visible' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onDoubleClick={()=>onChange(0)}>
        {ticks.map((t,i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.on?color:'rgba(150,50,180,0.3)'} strokeWidth={t.on?1.5:1} strokeLinecap="square" />
        ))}
        <circle cx={30} cy={30} r={18} fill="rgba(15,2,40,0.8)"
          stroke={color} strokeWidth={1.5} style={{ filter:`drop-shadow(0 0 6px ${color}55)` }} />
        <line x1={30} y1={30}
          x2={30+13*Math.sin((deg*Math.PI)/180)}
          y2={30-13*Math.cos((deg*Math.PI)/180)}
          stroke={color} strokeWidth={2.5} strokeLinecap="square" style={{ filter:`drop-shadow(0 0 3px ${color})` }} />
        <circle cx={30} cy={30} r={3} fill={color} style={{ filter:`drop-shadow(0 0 3px ${color})` }} />
        <text x={30} y={56} textAnchor="middle" fill={color} fontSize={7} fontFamily="'Press Start 2P',monospace">
          {value>0?`+${value}`:value}
        </text>
      </svg>
      <span className="font-pixel" style={{ fontSize:5, color:'rgba(200,150,255,0.5)' }}>{label}</span>
    </div>
  )
}

export default function EQPanel() {
  const [bass,setBass]     = useState(0)
  const [mid,setMid]       = useState(0)
  const [treble,setTreble] = useState(0)
  const [gain,setGain]     = useState(0)

  return (
    <div className="pixel-panel p-3 mb-3" style={{ border:'2px solid rgba(180,80,255,0.3)', borderTopColor:'rgba(192,96,255,0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel" style={{ fontSize:7, color:'#c060ff', textShadow:'0 0 8px #c060ff' }}>3-BAND EQ</h3>
        <button onClick={()=>{setBass(0);setMid(0);setTreble(0);setGain(0)}}
          className="arcade-btn px-2 py-px"
          style={{ color:'rgba(200,150,255,0.4)', borderColor:'rgba(150,50,180,0.3)', fontSize:5 }}>
          RESET
        </button>
      </div>
      <div className="flex justify-around items-start">
        <Knob label="BASS"   value={bass}   onChange={setBass}   color="#ff4466" />
        <Knob label="MID"    value={mid}    onChange={setMid}    color="#ffe060" />
        <Knob label="TREBLE" value={treble} onChange={setTreble} color="#ff6ed8" />
        <Knob label="GAIN"   value={gain}   onChange={setGain}   color="#60ffaa" min={-6} max={6} />
      </div>
      {/* EQ curve preview */}
      <div className="mt-2 flex items-end gap-px" style={{ height:18 }}>
        {[bass,bass*0.6,mid*0.4,mid,mid*0.6,treble*0.4,treble,treble*0.6,treble*0.2].map((v,i)=>{
          const h=Math.max(2,Math.min(18,9+v*0.65))
          const cs=['#ff4466','#ff6622','#ff9900','#ffe060','#aaff44','#60ffaa','#ff6ed8','#c060ff','#60d8ff']
          return <div key={i} className="flex-1 transition-all duration-300"
            style={{ height:h, background:cs[i], opacity:0.75 }} />
        })}
      </div>
    </div>
  )
}
