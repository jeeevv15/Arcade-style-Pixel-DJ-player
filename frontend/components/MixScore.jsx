'use client'
import { motion } from 'framer-motion'
import { scoreColor } from '@/lib/api'

function ScoreRing({ score, size=80, label, color }) {
  const r = (size-8)/2
  const circ = 2*Math.PI*r
  const offset = circ-(score/100)*circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(100,20,120,0.4)" strokeWidth={5} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="square" strokeDasharray={circ}
          initial={{ strokeDashoffset:circ }} animate={{ strokeDashoffset:offset }}
          transition={{ duration:0.8, ease:'easeOut' }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 4px ${color})` }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size<65?11:14} fontFamily="'Press Start 2P',monospace">{score}</text>
      </svg>
      <span className="font-mono" style={{ fontSize:9, color:'rgba(220,180,255,0.5)' }}>{label}</span>
    </div>
  )
}

function PairRow({ pair }) {
  const color = scoreColor(pair.overall_score)
  return (
    <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
      className="flex items-center gap-2 py-1 border-b" style={{ borderColor:'rgba(150,50,180,0.2)' }}>
      <div className="font-pixel truncate flex-1" style={{ fontSize:6, color:'rgba(220,180,255,0.5)' }}>{pair.from_track}</div>
      <span className="font-mono" style={{ fontSize:10, color:'rgba(180,80,180,0.4)' }}>→</span>
      <div className="font-pixel truncate flex-1" style={{ fontSize:6, color:'rgba(220,180,255,0.5)' }}>{pair.to_track}</div>
      <div className="font-pixel flex-shrink-0 border px-1 py-px"
        style={{ fontSize:6, color, borderColor:`${color}44` }}>{pair.overall_score}%</div>
      <div className="font-pixel flex-shrink-0" style={{ fontSize:5, color:'rgba(180,80,180,0.4)' }}>{pair.transition}</div>
    </motion.div>
  )
}

export default function MixScore({ score }) {
  if (!score) return null
  const seqColor = scoreColor(score.sequence_score)
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="pixel-panel p-3 mb-3"
      style={{ border:`2px solid ${seqColor}55`, boxShadow:`0 0 16px ${seqColor}22` }}>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel" style={{ fontSize:8, color:seqColor, textShadow:`0 0 8px ${seqColor}` }}>
          MIX ANALYSIS
        </h3>
        <div className="font-pixel border px-2 py-1"
          style={{ fontSize:7, color:seqColor, borderColor:`${seqColor}88`, background:`${seqColor}11` }}>
          {score.sequence_score>=80?'PERFECT':score.sequence_score>=65?'GOOD':score.sequence_score>=50?'DECENT':score.sequence_score>=35?'RISKY':'CLASH!'}
        </div>
      </div>

      <div className="flex justify-around mb-4">
        <ScoreRing score={score.sequence_score} size={80} color={seqColor} label="OVERALL" />
        {score.pair_scores?.[0] && <>
          <ScoreRing score={score.pair_scores[0].bpm_score}    size={60} color="#ff6ed8" label="BPM" />
          <ScoreRing score={score.pair_scores[0].key_score}    size={60} color="#c060ff" label="KEY" />
          <ScoreRing score={score.pair_scores[0].energy_score} size={60} color="#ffaa44" label="ENERGY" />
        </>}
      </div>

      {score.pair_scores?.length > 0 && (
        <div>
          <div className="font-mono mb-1" style={{ fontSize:10, color:'rgba(200,150,255,0.4)' }}>PAIR BREAKDOWN</div>
          {score.pair_scores.map((p,i) => <PairRow key={i} pair={p} />)}
        </div>
      )}

      {score.duration_display && (
        <div className="flex justify-between mt-3 pt-2 border-t" style={{ borderColor:'rgba(150,50,180,0.2)' }}>
          <span className="font-mono" style={{ fontSize:10, color:'rgba(200,150,255,0.4)' }}>TOTAL DURATION</span>
          <span className="font-pixel glow-pink" style={{ fontSize:9 }}>{score.duration_display}</span>
        </div>
      )}
    </motion.div>
  )
}
