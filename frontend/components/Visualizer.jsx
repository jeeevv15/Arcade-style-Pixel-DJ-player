'use client'
import { useEffect, useState } from 'react'

export default function Visualizer({ active=false, color='#ff6ed8', barCount=32, height=48 }) {
  const [bars, setBars] = useState(Array(barCount).fill(0.08))
  useEffect(() => {
    const id = setInterval(() =>
      setBars(prev => prev.map(old => {
        const target = active ? Math.random()*0.88+0.1 : Math.random()*0.1+0.04
        return old + (target - old) * 0.42
      }))
    , 75)
    return () => clearInterval(id)
  }, [active, barCount])

  return (
    <div className="flex items-end gap-px w-full" style={{ height }}>
      {bars.map((h, i) => {
        const warm = `hsl(${300 - (i/barCount)*200}, 90%, 65%)`
        return (
          <div key={i} className="flex-1" style={{
            height:`${Math.max(3,h*100)}%`,
            background: active ? warm : color,
            boxShadow: h>0.7 ? `0 0 5px ${warm}` : 'none',
            opacity: active ? 1 : 0.25,
            transition:'height 0.07s ease',
          }} />
        )
      })}
    </div>
  )
}
