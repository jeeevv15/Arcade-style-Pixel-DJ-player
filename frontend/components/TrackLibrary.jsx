'use client'
import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const GENRES = ['ALL','TECHNO','HOUSE','TRANCE','DRUM & BASS','CHILL','DEEP HOUSE','PROGRESSIVE']

function EnergyBar({ value, color }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 h-1 overflow-hidden"
        style={{ background:'rgba(180,80,180,0.15)' }}>
        <div className="h-full transition-all duration-300"
          style={{ width:`${value*100}%`, background:color }} />
      </div>
      <span className="font-mono" style={{ fontSize:10, color, minWidth:14 }}>
        {Math.round(value*10)}
      </span>
    </div>
  )
}

function LinkAudioButton({ track, onLinked }) {
  const inputRef  = useRef(null)
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(!!track.file_path)
  const [error, setError]   = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('track_id', track.id)
      const res = await fetch(`${API}/tracks/link-audio?track_id=${encodeURIComponent(track.id)}`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to link')
      setDone(true)
      onLinked(data.track)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  return (
    <div className="mt-1">
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.flac,.ogg,.m4a"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="arcade-btn w-full py-1 text-center"
        style={{
          fontSize: 5,
          color:       done ? '#60ffaa' : '#ffaa44',
          borderColor: done ? 'rgba(96,255,170,0.5)' : 'rgba(255,170,68,0.4)',
          background:  done ? 'rgba(96,255,170,0.08)' : 'rgba(255,170,68,0.06)',
        }}
      >
        {busy ? '⏳ UPLOADING...' : done ? '✓ AUDIO LINKED' : '📁 LINK AUDIO FILE'}
      </button>
      {error && (
        <p className="font-mono mt-1 text-center"
          style={{ fontSize:9, color:'#ff4466' }}>
          ✗ {error}
        </p>
      )}
    </div>
  )
}

export default function TrackLibrary({ tracks=[], onAddToQueue, onLoadDeckA, onLoadDeckB, onTrackUpdated }) {
  const [search,  setSearch]  = useState('')
  const [genre,   setGenre]   = useState('ALL')
  const [sortBy,  setSortBy]  = useState('name')
  const [hovered, setHovered] = useState(null)

  const filtered = useMemo(() => {
    let r = [...tracks]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
      )
    }
    if (genre !== 'ALL') r = r.filter(t => t.genre === genre)
    r.sort((a,b) =>
      sortBy==='bpm'    ? a.bpm - b.bpm :
      sortBy==='energy' ? b.energy - a.energy :
      a.name.localeCompare(b.name)
    )
    return r
  }, [tracks, search, genre, sortBy])

  return (
    <div className="pixel-panel p-4"
      style={{ border:'2px solid rgba(192,50,138,0.35)', borderTopColor:'rgba(255,110,216,0.5)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel"
          style={{ fontSize:9, color:'#ff6ed8', textShadow:'0 0 10px #ff6ed8' }}>
          TRACK LIBRARY
        </h2>
        <span className="font-mono"
          style={{ fontSize:10, color:'rgba(255,200,255,0.35)' }}>
          {filtered.length}/{tracks.length} TRACKS
        </span>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth:180 }}>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono"
            style={{ color:'rgba(255,110,216,0.4)', fontSize:12 }}>▷</span>
          <input
            type="text"
            placeholder="SEARCH TRACKS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-6 pr-3 py-2 font-mono text-sm focus:outline-none"
            style={{ background:'rgba(10,2,30,0.7)',
              border:'1px solid rgba(180,80,180,0.35)',
              color:'#e0c0ff', caretColor:'#ff6ed8' }}
          />
        </div>

        {/* Genre filters */}
        <div className="flex flex-wrap gap-1">
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)} className="arcade-btn px-2 py-1"
              style={{
                color:       genre===g ? '#ff6ed8' : 'rgba(180,80,180,0.4)',
                borderColor: genre===g ? 'rgba(255,110,216,0.6)' : 'rgba(150,50,180,0.25)',
                background:  genre===g ? 'rgba(255,110,216,0.1)' : 'transparent',
                fontSize: 6,
              }}>
              {g}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 items-center">
          <span className="font-mono" style={{ fontSize:10, color:'rgba(255,200,255,0.3)' }}>
            SORT:
          </span>
          {['name','bpm','energy'].map(s => (
            <button key={s} onClick={() => setSortBy(s)} className="arcade-btn px-2 py-1"
              style={{
                color:       sortBy===s ? '#ffe060' : 'rgba(180,80,180,0.4)',
                borderColor: sortBy===s ? 'rgba(255,224,96,0.6)' : 'rgba(150,50,180,0.25)',
                fontSize: 6,
              }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Track grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        <AnimatePresence>
          {filtered.map((track, idx) => (
            <motion.div
              key={track.id}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ delay: idx * 0.02 }}
              className="track-card p-3"
              style={{ '--track-color': track.color }}
              onMouseEnter={() => setHovered(track.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Has-audio indicator */}
              {track.file_path && (
                <div className="absolute top-2 right-2"
                  style={{ width:6, height:6, borderRadius:'50%',
                    background:'#60ffaa', boxShadow:'0 0 6px #60ffaa' }} />
              )}

              {/* Name */}
              <div className="font-pixel truncate mb-1"
                style={{ fontSize:7, color:track.color,
                  textShadow:`0 0 6px ${track.color}88`, paddingRight:12 }}>
                {track.name}
              </div>
              <div className="font-mono mb-2"
                style={{ fontSize:10, color:'rgba(220,180,255,0.5)' }}>
                {track.artist}
              </div>

              {/* Stats */}
              <div className="flex justify-between font-mono mb-2"
                style={{ fontSize:10, color:'rgba(200,150,255,0.5)' }}>
                <span style={{ color:track.color }}>{track.bpm} BPM</span>
                <span>{track.key}</span>
                <span>{formatDuration(track.duration)}</span>
              </div>

              {/* Genre badge */}
              <div className="mb-2">
                <span className="font-pixel border px-1 py-px"
                  style={{ fontSize:5, color:track.color, borderColor:`${track.color}44` }}>
                  {track.genre}
                </span>
              </div>

              {/* Energy */}
              <div className="mb-2">
                <div className="font-mono mb-1"
                  style={{ fontSize:9, color:'rgba(200,150,255,0.4)' }}>ENERGY</div>
                <EnergyBar value={track.energy} color={track.color} />
              </div>

              {/* Link audio button — always visible */}
              <LinkAudioButton
                track={track}
                onLinked={(updated) => onTrackUpdated?.(updated)}
              />

              {/* Hover action buttons */}
              <AnimatePresence>
                {hovered === track.id && (
                  <motion.div
                    initial={{ opacity:0, y:4 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0 }}
                    className="flex gap-1 mt-2"
                  >
                    <button
                      onClick={() => onAddToQueue(track)}
                      className="flex-1 arcade-btn py-1 text-center"
                      style={{ color:'#ff6ed8', borderColor:'rgba(255,110,216,0.4)', fontSize:6 }}>
                      + QUEUE
                    </button>
                    <button
                      onClick={() => onLoadDeckA(track)}
                      className="arcade-btn py-1 px-1"
                      style={{ color:'#ff6ed8', borderColor:'rgba(255,110,216,0.4)', fontSize:6 }}
                      title="Load to Deck A">
                      A
                    </button>
                    <button
                      onClick={() => onLoadDeckB(track)}
                      className="arcade-btn py-1 px-1"
                      style={{ color:'#ffaa44', borderColor:'rgba(255,170,68,0.4)', fontSize:6 }}
                      title="Load to Deck B">
                      B
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 font-mono"
          style={{ color:'rgba(180,80,180,0.35)' }}>
          NO TRACKS FOUND
        </div>
      )}
    </div>
  )
}