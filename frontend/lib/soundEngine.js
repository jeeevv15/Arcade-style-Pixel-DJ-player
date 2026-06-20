/**
 * soundEngine.js
 * Pure Web Audio API sound synthesizer — no audio files required.
 * Synthesizes kick, snare, scratch, gong, filter sweep, reverb, flanger, echo,
 * plus UI click sounds. Call init() once on first user interaction.
 */

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function master(gain = 0.5) {
  const ac = getCtx()
  const g = ac.createGain()
  g.gain.value = gain
  g.connect(ac.destination)
  return g
}

function noise(ac, dur) {
  const bufLen = ac.sampleRate * dur
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

export function playKick(vol = 0.8) {
  const ac = getCtx(), now = ac.currentTime
  const osc = ac.createOscillator()
  const env = ac.createGain()
  const out = master(vol)
  osc.frequency.setValueAtTime(160, now)
  osc.frequency.exponentialRampToValueAtTime(22, now + 0.4)
  env.gain.setValueAtTime(1, now)
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  osc.connect(env); env.connect(out)
  osc.start(now); osc.stop(now + 0.5)
}

export function playSnare(vol = 0.7) {
  const ac = getCtx(), now = ac.currentTime
  const ns  = noise(ac, 0.25)
  const bf  = ac.createBiquadFilter()
  bf.type = 'bandpass'; bf.frequency.value = 2400; bf.Q.value = 0.8
  const env = ac.createGain()
  env.gain.setValueAtTime(0.9, now)
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
  const out = master(vol)
  ns.connect(bf); bf.connect(env); env.connect(out)
  ns.start(now); ns.stop(now + 0.25)
  const osc = ac.createOscillator()
  const env2 = ac.createGain()
  osc.frequency.value = 200
  env2.gain.setValueAtTime(0.5, now)
  env2.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.connect(env2); env2.connect(out)
  osc.start(now); osc.stop(now + 0.1)
}

export function playScratch(vol = 0.6) {
  const ac = getCtx(), now = ac.currentTime
  const osc = ac.createOscillator()
  const env = ac.createGain()
  const out = master(vol)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(800, now)
  osc.frequency.linearRampToValueAtTime(200, now + 0.08)
  osc.frequency.linearRampToValueAtTime(700, now + 0.16)
  osc.frequency.linearRampToValueAtTime(150, now + 0.22)
  osc.frequency.linearRampToValueAtTime(500, now + 0.28)
  env.gain.setValueAtTime(0, now)
  env.gain.linearRampToValueAtTime(0.8, now + 0.02)
  env.gain.setValueAtTime(0.8, now + 0.26)
  env.gain.linearRampToValueAtTime(0, now + 0.32)
  osc.connect(env); env.connect(out)
  osc.start(now); osc.stop(now + 0.35)
}

export function playGong(vol = 0.55) {
  const ac = getCtx(), now = ac.currentTime
  const freqs = [180, 360.9, 541.3, 722.1]
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const out = master(vol * (1 - i * 0.18))
    osc.frequency.value = f
    env.gain.setValueAtTime(i === 0 ? 1 : 0.5, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + 1.8 - i * 0.3)
    osc.connect(env); env.connect(out)
    osc.start(now); osc.stop(now + 2)
  })
}

export function playFilter(vol = 0.5) {
  const ac = getCtx(), now = ac.currentTime
  const ns  = noise(ac, 0.6)
  const bf  = ac.createBiquadFilter()
  bf.type = 'bandpass'
  bf.frequency.setValueAtTime(200, now)
  bf.frequency.exponentialRampToValueAtTime(8000, now + 0.5)
  bf.Q.value = 6
  const env = ac.createGain()
  env.gain.setValueAtTime(0.7, now)
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  const out = master(vol)
  ns.connect(bf); bf.connect(env); env.connect(out)
  ns.start(now); ns.stop(now + 0.65)
}

export function playReverb(vol = 0.4) {
  const ac = getCtx(), now = ac.currentTime
  const osc = ac.createOscillator()
  const env = ac.createGain()
  const out = master(vol)
  osc.frequency.value = 440
  osc.type = 'sine'
  env.gain.setValueAtTime(0.7, now)
  env.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
  osc.connect(env)
  ;[0.03, 0.07, 0.12, 0.19].forEach(d => {
    const del = ac.createDelay(0.5)
    del.delayTime.value = d
    const dg = ac.createGain()
    dg.gain.value = 0.25
    env.connect(del); del.connect(dg); dg.connect(out)
  })
  env.connect(out)
  osc.start(now); osc.stop(now + 1.6)
}

export function playFlanger(vol = 0.5) {
  const ac = getCtx(), now = ac.currentTime
  const ns  = noise(ac, 0.4)
  const del = ac.createDelay(0.02)
  del.delayTime.value = 0.005
  const lfo = ac.createOscillator()
  const lfog = ac.createGain()
  lfo.frequency.value = 8
  lfog.gain.value = 0.004
  lfo.connect(lfog); lfog.connect(del.delayTime)
  const env = ac.createGain()
  env.gain.setValueAtTime(0.7, now)
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
  const out = master(vol)
  ns.connect(del); del.connect(env); ns.connect(env); env.connect(out)
  lfo.start(now); ns.start(now); lfo.stop(now + 0.5); ns.stop(now + 0.45)
}

export function playEcho(vol = 0.5) {
  const ac = getCtx(), now = ac.currentTime
  const osc = ac.createOscillator()
  osc.frequency.value = 660
  osc.type = 'square'
  const out = master(vol)
  ;[0, 0.25, 0.5, 0.75].forEach((t, i) => {
    const env = ac.createGain()
    env.gain.setValueAtTime(0, now + t)
    env.gain.linearRampToValueAtTime(0.6 / (i + 1), now + t + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18)
    osc.connect(env); env.connect(out)
  })
  osc.start(now); osc.stop(now + 1)
}

export function playClick(freq = 1200, dur = 0.04, vol = 0.18) {
  try {
    const ac = getCtx(), now = ac.currentTime
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const out = master(vol)
    osc.frequency.value = freq
    env.gain.setValueAtTime(1, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + dur)
    osc.connect(env); env.connect(out)
    osc.start(now); osc.stop(now + dur + 0.01)
  } catch (_) {}
}

export function playSuccess() {
  const ac = getCtx(), now = ac.currentTime
  ;[523, 659, 784].forEach((f, i) => {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const out = master(0.2)
    osc.frequency.value = f
    const t = now + i * 0.1
    env.gain.setValueAtTime(0.7, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(env); env.connect(out)
    osc.start(t); osc.stop(t + 0.18)
  })
}

export function playError() {
  const ac = getCtx(), now = ac.currentTime
  ;[220, 180].forEach((f, i) => {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const out = master(0.2)
    osc.type = 'sawtooth'
    osc.frequency.value = f
    const t = now + i * 0.12
    env.gain.setValueAtTime(0.6, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(env); env.connect(out)
    osc.start(t); osc.stop(t + 0.14)
  })
}

export const FX_SOUNDS = {
  kick:    playKick,
  snare:   playSnare,
  scratch: playScratch,
  gong:    playGong,
  filter:  playFilter,
  reverb:  playReverb,
  flanger: playFlanger,
  echo:    playEcho,
}

export function initAudio() {
  try { getCtx() } catch (_) {}
}