const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API error')
  }
  return res.json()
}

// ── Tracks ──────────────────────────────────────────────────
export async function fetchTracks(search = '') {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiFetch(`/tracks${qs}`)
}

// ── Compatibility ────────────────────────────────────────────
export async function checkPairCompatibility(trackA, trackB) {
  return apiFetch('/compatibility/pair', {
    method: 'POST',
    body: JSON.stringify({ tracks: [trackA, trackB] }),
  })
}

export async function checkSequenceCompatibility(tracks) {
  return apiFetch('/compatibility/sequence', {
    method: 'POST',
    body: JSON.stringify({ tracks }),
  })
}

// ── Sequence optimizer ───────────────────────────────────────
export async function optimizeSequence(tracks) {
  return apiFetch('/sequence/optimize', {
    method: 'POST',
    body: JSON.stringify({ tracks }),
  })
}

// ── Mix ──────────────────────────────────────────────────────
export async function createMix(tracks, effects = [], transitionType = 'crossfade') {
  return apiFetch('/mix', {
    method: 'POST',
    body: JSON.stringify({ tracks, effects, transition_type: transitionType }),
  })
}

// ── Helpers ──────────────────────────────────────────────────
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function scoreColor(score) {
  if (score >= 80) return '#00ff44'
  if (score >= 65) return '#aaff00'
  if (score >= 50) return '#ffff00'
  if (score >= 35) return '#ff8800'
  return '#ff0044'
}

export function scoreLabel(score) {
  if (score >= 80) return 'PERFECT'
  if (score >= 65) return 'GOOD'
  if (score >= 50) return 'DECENT'
  if (score >= 35) return 'RISKY'
  return 'CLASH'
}
