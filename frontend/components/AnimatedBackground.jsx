'use client'
import { useEffect, useState, useRef } from 'react'

// ─── Cat colour palettes ─────────────────────────────────────────────────────
const CAT_PALETTES = [
  { body:'#f4a460', dark:'#c8762a', belly:'#fde8c8', eye:'#2a1a0a', nose:'#ff9999' },
  { body:'#aaaaaa', dark:'#555555', belly:'#eeeeee', eye:'#1a1a2e', nose:'#ffaaaa' },
  { body:'#222222', dark:'#111111', belly:'#555555', eye:'#ffd700', nose:'#ff6699' },
  { body:'#f5deb3', dark:'#c8a870', belly:'#fffaf0', eye:'#336644', nose:'#ffb3b3' },
  { body:'#c0508c', dark:'#80205c', belly:'#f0c0d8', eye:'#1a0a2e', nose:'#ff99cc' },
  { body:'#6080f0', dark:'#3050c0', belly:'#c0d0ff', eye:'#0a0a2a', nose:'#ffccee' },
]

// ─── Pixel cat (12×10 grid, each cell = s px) ────────────────────────────────
function PixelCat({ pal, flipped, frame, size = 4 }) {
  const s = size
  // 0=transparent 1=body 2=dark 3=eye 4=nose 5=belly
  const ROWS = [
    [0,1,1,0,0,0,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,3,1,1,1,1,1,3,1,0,0],
    [0,1,1,1,4,1,1,4,1,1,0,0],
    [0,1,5,5,5,5,5,5,5,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0],
    frame === 0
      ? [0,0,1,1,0,0,0,1,1,0,0,0]
      : [0,0,0,1,1,0,1,1,0,0,0,0],
    frame === 0
      ? [0,0,1,1,0,0,0,1,1,0,0,0]
      : [0,0,0,1,1,0,1,1,0,0,0,0],
  ]
  const fill = { 1: pal.body, 2: pal.dark, 3: pal.eye, 4: pal.nose, 5: pal.belly }
  const W = 12 * s, H = 8 * s
  return (
    <svg width={W} height={H} style={{ imageRendering:'pixelated', overflow:'visible',
      transform: flipped ? 'scaleX(-1)' : 'none', display:'block' }}>
      {ROWS.map((row, ri) =>
        row.map((cell, ci) =>
          cell > 0 ? <rect key={`${ri}-${ci}`} x={ci*s} y={ri*s} width={s} height={s} fill={fill[cell]||pal.body} /> : null
        )
      )}
    </svg>
  )
}

// ─── Single walking cat actor ─────────────────────────────────────────────────
function CatActor({ palette, baseSpeed, yPct, startDelay, scale, startDir }) {
  const [pos, setPos]       = useState(startDir > 0 ? -80 : (typeof window!=='undefined'?window.innerWidth:1400)+80)
  const [flipped, setFlipped] = useState(startDir < 0)
  const [frame, setFrame]   = useState(0)
  const [hovered, setHovered] = useState(false)
  const posRef   = useRef(pos)
  const dirRef   = useRef(startDir)
  const rafRef   = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const screenW = window.innerWidth

    // Walking animation frame toggle
    frameRef.current = setInterval(() => setFrame(f => 1 - f), 200)

    const move = () => {
      posRef.current += dirRef.current * baseSpeed * 0.016
      if (posRef.current > screenW + 100) {
        dirRef.current = -1
        setFlipped(true)
      }
      if (posRef.current < -100) {
        dirRef.current = 1
        setFlipped(false)
      }
      setPos(posRef.current)
      rafRef.current = requestAnimationFrame(move)
    }

    const timer = setTimeout(() => { rafRef.current = requestAnimationFrame(move) }, startDelay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
      clearInterval(frameRef.current)
    }
  }, [baseSpeed, startDelay])

  const handleClick = () => {
    window.dispatchEvent(new Event('catclick'))
    setHovered(false)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: pos,
        top: `${yPct}%`,
        transform: `scale(${hovered ? scale * 1.3 : scale})`,
        transformOrigin: 'bottom center',
        cursor: 'pointer',
        transition: 'transform 0.15s',
        filter: hovered
          ? `drop-shadow(0 0 8px rgba(255,200,100,0.9))`
          : `drop-shadow(0 3px 0 rgba(0,0,0,0.2))`,
        zIndex: 3,
      }}
    >
      <PixelCat pal={palette} flipped={flipped} frame={frame} size={4} />
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,5,60,0.92)',
          border: '1px solid rgba(255,110,216,0.6)',
          padding: '3px 6px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 6,
          color: '#ff6ed8',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          🐱 CLICK ME!
        </div>
      )}
    </div>
  )
}

// ─── Pixel cloud ─────────────────────────────────────────────────────────────
function PixelCloud({ speed, yPct, startX, scale }) {
  const [x, setX] = useState(startX)
  const xRef = useRef(startX)
  useEffect(() => {
    let raf
    const tick = () => {
      xRef.current += speed * 0.016
      if (xRef.current > (window.innerWidth + 220)) xRef.current = -220
      setX(xRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  // Pixel cloud: rows of 12px squares
  const blocks = [
    [2,0],[3,0],[4,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
  ]
  const shade = [
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
  ]
  const shadeSet = new Set(shade.map(([cx,cy])=>`${cx},${cy}`))

  return (
    <div style={{ position:'absolute', left:x, top:`${yPct}%`,
      transform:`scale(${scale})`, transformOrigin:'top left',
      imageRendering:'pixelated', zIndex:1, pointerEvents:'none' }}>
      <svg width={8*12} height={6*8} style={{ imageRendering:'pixelated', overflow:'visible' }}>
        {blocks.map(([cx,cy],i) => (
          <rect key={i} x={cx*12} y={cy*8} width={12} height={8}
            fill={shadeSet.has(`${cx},${cy}`) ? '#b8cce4' : cy<=1 ? '#eef4ff' : '#d8eaf8'} />
        ))}
      </svg>
    </div>
  )
}

// ─── Twinkling star ───────────────────────────────────────────────────────────
function PixelStar({ x, y, delay, size = 6 }) {
  return (
    <div style={{ position:'absolute', left:`${x}%`, top:`${y}%`,
      width:size, height:size, zIndex:1, pointerEvents:'none',
      animation:`sparkle ${1.2+Math.random()*1.5}s ease-in-out ${delay}s infinite` }}>
      <svg width={size} height={size} viewBox="0 0 8 8">
        <rect x={3} y={0} width={2} height={2} fill="white" opacity={0.9} />
        <rect x={3} y={6} width={2} height={2} fill="white" opacity={0.9} />
        <rect x={0} y={3} width={2} height={2} fill="white" opacity={0.9} />
        <rect x={6} y={3} width={2} height={2} fill="white" opacity={0.9} />
        <rect x={3} y={3} width={2} height={2} fill="white" />
      </svg>
    </div>
  )
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CATS = [
  { palette:CAT_PALETTES[0], baseSpeed:55, yPct:74, startDelay:0,    scale:1.1,  startDir:1  },
  { palette:CAT_PALETTES[1], baseSpeed:35, yPct:79, startDelay:2200, scale:0.88, startDir:-1 },
  { palette:CAT_PALETTES[2], baseSpeed:68, yPct:71, startDelay:4800, scale:1.2,  startDir:1  },
  { palette:CAT_PALETTES[3], baseSpeed:42, yPct:82, startDelay:1000, scale:0.82, startDir:1  },
  { palette:CAT_PALETTES[4], baseSpeed:50, yPct:76, startDelay:3500, scale:1.0,  startDir:-1 },
  { palette:CAT_PALETTES[5], baseSpeed:30, yPct:85, startDelay:6200, scale:0.75, startDir:1  },
]

const CLOUDS = [
  { speed:16, yPct:4,  startX:100,  scale:1.2 },
  { speed:11, yPct:10, startX:600,  scale:0.8 },
  { speed:20, yPct:7,  startX:200,  scale:1.5 },
  { speed:14, yPct:16, startX:900,  scale:1.0 },
  { speed:9,  yPct:20, startX:400,  scale:0.9 },
  { speed:23, yPct:13, startX:1100, scale:0.7 },
  { speed:13, yPct:26, startX:700,  scale:1.1 },
]

const STARS = [
  {x:8,y:14,delay:0},{x:22,y:8,delay:0.4},{x:35,y:22,delay:0.9},{x:55,y:6,delay:1.3},
  {x:70,y:17,delay:0.6},{x:84,y:11,delay:1.9},{x:14,y:32,delay:1.1},{x:46,y:38,delay:0.3},
  {x:62,y:45,delay:1.5},{x:91,y:27,delay:0.8},{x:4,y:48,delay:1.7},{x:78,y:52,delay:0.2},
  {x:30,y:58,delay:2.1},{x:93,y:62,delay:0.7},{x:50,y:28,delay:1.0},{x:18,y:55,delay:1.6},
]

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex:0 }}>
      {/* Sky gradient – purple → magenta → orange → peach (matching reference image) */}
      <div style={{
        position:'absolute', inset:0,
        background:`linear-gradient(180deg,
          #1e0545 0%,
          #3d0d80 8%,
          #6a1498 16%,
          #a02890 26%,
          #c8387a 36%,
          #e05848 48%,
          #f07832 60%,
          #f5a838 72%,
          #f8c868 84%,
          #fbe8a8 94%,
          #fdf4d0 100%)`,
      }} />

      {/* Dither/halftone overlay for pixel art texture */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle,rgba(0,0,0,0.05) 1px,transparent 1px)',
        backgroundSize:'4px 4px',
        pointerEvents:'none',
      }} />

      {/* Stars */}
      {STARS.map((s,i) => <PixelStar key={i} {...s} size={i%4===0?10:6} />)}

      {/* Clouds */}
      {CLOUDS.map((c,i) => <PixelCloud key={i} {...c} />)}

      {/* Cats – walk along the "ground" area of the page */}
      {CATS.map((cat,i) => <CatActor key={i} {...cat} />)}

      {/* Soft ground haze */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:120,
        background:'linear-gradient(to bottom,transparent,rgba(250,230,150,0.18))',
        pointerEvents:'none',
      }} />
    </div>
  )
}
