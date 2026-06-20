'use client'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { formatDuration } from '@/lib/api'

function ScoreArrow({ score }) {
  const color = score>=80?'#60ffaa':score>=65?'#aaff00':score>=50?'#ffe060':score>=35?'#ffaa44':'#ff4466'
  return (
    <div className="flex flex-col items-center justify-center px-1 flex-shrink-0 select-none">
      <span className="font-pixel" style={{ fontSize:5, color }}>{score}%</span>
      <span style={{ color, fontSize:12, lineHeight:1 }}>▶</span>
    </div>
  )
}

function TimelineItem({ item, index, onRemove, pairScore }) {
  const color = item.color||'#ff6ed8'
  return (
    <div className="flex items-stretch">
      <Reorder.Item value={item}
        whileDrag={{ scale:1.04, zIndex:20, boxShadow:`0 0 20px ${color}88`, filter:'brightness(1.2)' }}
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        style={{ minWidth:140, background:`${color}0d`, border:`1px solid ${color}55` }}>

        <div className="font-pixel flex-shrink-0 w-5 h-5 flex items-center justify-center border"
          style={{ fontSize:6, color, borderColor:`${color}66` }}>{index+1}</div>

        <div className="flex-1 min-w-0">
          <div className="font-pixel truncate" style={{ fontSize:6, color, textShadow:`0 0 4px ${color}88` }}>
            {item.name}
          </div>
          <div className="font-mono truncate" style={{ fontSize:10, color:'rgba(220,180,255,0.4)', marginTop:2 }}>
            {item.bpm} BPM · {item.key}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span style={{ color:'rgba(180,80,180,0.3)', fontSize:11 }}>⠿</span>
          <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onRemove(index)}
            className="font-mono transition-colors hover:text-red-400"
            style={{ fontSize:14, color:'rgba(180,80,180,0.4)', lineHeight:1 }}>×</button>
        </div>
      </Reorder.Item>
      {pairScore!==undefined && <ScoreArrow score={pairScore} />}
    </div>
  )
}

export default function Timeline({ queue=[], onReorder, onRemove, pairScores=[] }) {
  const total = queue.reduce((s,t)=>s+(t.duration||240),0)
  return (
    <div className="pixel-panel p-3 mb-3"
      style={{ border:'2px solid rgba(255,224,96,0.25)', borderTopColor:'rgba(255,224,96,0.5)' }}>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel" style={{ fontSize:8, color:'#ffe060', textShadow:'0 0 8px #ffe060' }}>
          MIX SEQUENCE
        </h3>
        <div className="flex items-center gap-3">
          {queue.length>0 && (
            <span className="font-mono" style={{ fontSize:10, color:'rgba(220,180,255,0.35)' }}>
              {queue.length} TRK · {formatDuration(total)}
            </span>
          )}
          <span className="font-pixel" style={{ fontSize:5, color:'rgba(200,150,255,0.25)' }}>⠿ DRAG TO REORDER</span>
        </div>
      </div>

      {queue.length===0 ? (
        <div className="flex items-center justify-center font-mono"
          style={{ minHeight:72, border:'2px dashed rgba(150,50,180,0.25)', color:'rgba(150,50,180,0.3)', fontSize:11 }}>
          ← ADD TRACKS FROM THE LIBRARY BELOW
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-2">
            <Reorder.Group axis="x" values={queue} onReorder={onReorder}
              className="flex items-stretch" style={{ minWidth:'max-content' }}>
              {queue.map((item,idx) => (
                <TimelineItem key={item._qid} item={item} index={idx} onRemove={onRemove}
                  pairScore={idx<queue.length-1&&pairScores[idx]?pairScores[idx].overall_score:undefined} />
              ))}
            </Reorder.Group>
          </div>
          <div className="flex gap-px mt-2" style={{ height:4 }}>
            {queue.map(t=>(
              <div key={t._qid} style={{ flex:t.duration||240, background:t.color, boxShadow:`0 0 4px ${t.color}` }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
