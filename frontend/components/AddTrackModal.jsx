'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'
const COLORS=['#ff6ed8','#ffaa44','#c060ff','#ffe060','#60ffaa','#ff4466','#60d8ff','#f07540','#ff00aa','#00aaff']
const GENRES=['TECHNO','HOUSE','TRANCE','DRUM & BASS','CHILL','DEEP HOUSE','PROGRESSIVE','AMBIENT']

export default function AddTrackModal({ onClose, onTrackAdded }) {
  const [tab,setTab]=useState('path')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [form,setForm]=useState({ file_path:'',name:'',artist:'',genre:'TECHNO',color:'#ff6ed8',bpm:128,key:'Am',energy:0.8 })
  const [file,setFile]=useState(null)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const inp = {
    background:'rgba(10,2,30,0.8)', border:'1px solid rgba(180,80,180,0.4)',
    color:'#e0c0ff', padding:'6px 8px', fontFamily:'Share Tech Mono,monospace', fontSize:12, width:'100%', outline:'none',
  }

  async function submitPath() {
    if (!form.file_path.trim()) return setError('Enter a file path')
    setBusy(true); setError('')
    try {
      const res = await fetch(`${API}/tracks/analyze-local`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({file_path:form.file_path,name:form.name,artist:form.artist,genre:form.genre,color:form.color})})
      const d=await res.json()
      if (!res.ok) throw new Error(d.detail||'Failed')
      onTrackAdded(d.track)
    } catch(e){setError(e.message)} finally{setBusy(false)}
  }

  async function submitUpload() {
    if (!file) return setError('Select a file first')
    setBusy(true); setError('')
    try {
      const fd=new FormData(); fd.append('file',file)
      fd.append('name',form.name||file.name.replace(/\.[^.]+$/,''))
      fd.append('artist',form.artist||'UNKNOWN'); fd.append('genre',form.genre)
      const res=await fetch(`${API}/tracks/upload`,{method:'POST',body:fd})
      const d=await res.json()
      if (!res.ok) throw new Error(d.detail||'Upload failed')
      onTrackAdded(d.track)
    } catch(e){setError(e.message)} finally{setBusy(false)}
  }

  function submitManual() {
    if (!form.name.trim()) return setError('Track name required')
    onTrackAdded({ id:`manual_${Date.now()}`, name:form.name.toUpperCase(),
      artist:(form.artist||'UNKNOWN').toUpperCase(), bpm:Number(form.bpm)||128,
      key:form.key||'Am', energy:Number(form.energy)||0.8, danceability:0.85,
      loudness:-5.5, duration:240, genre:form.genre, color:form.color, file_path:null })
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{background:'rgba(10,2,30,0.88)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9}}
        className="pixel-panel p-5 w-full max-w-lg"
        style={{border:'2px solid rgba(255,170,68,0.5)',boxShadow:'0 0 40px rgba(255,170,68,0.15)'}}>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel" style={{fontSize:10,color:'#ffaa44',textShadow:'0 0 8px #ffaa44'}}>+ ADD TRACK</h2>
          <button onClick={onClose} className="font-mono hover:text-white" style={{fontSize:20,color:'rgba(200,150,255,0.4)'}}>×</button>
        </div>

        <div className="flex gap-1 mb-4">
          {[['path','LOCAL PATH'],['upload','UPLOAD'],['manual','MANUAL']].map(([id,lbl])=>(
            <button key={id} onClick={()=>{setTab(id);setError('')}} className="arcade-btn flex-1 py-1"
              style={{fontSize:6,color:tab===id?'#ffaa44':'rgba(180,80,180,0.4)',
                borderColor:tab===id?'rgba(255,170,68,0.5)':'rgba(150,50,180,0.25)',
                background:tab===id?'rgba(255,170,68,0.08)':'transparent'}}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>TRACK NAME</label>
            <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="MY TRACK" />
          </div>
          <div>
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>ARTIST</label>
            <input style={inp} value={form.artist} onChange={e=>set('artist',e.target.value)} placeholder="ARTIST" />
          </div>
          <div>
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>GENRE</label>
            <select style={inp} value={form.genre} onChange={e=>set('genre',e.target.value)}>
              {GENRES.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>COLOUR</label>
            <div className="flex flex-wrap gap-1 pt-1">
              {COLORS.map(c=>(
                <div key={c} onClick={()=>set('color',c)} style={{width:16,height:16,background:c,cursor:'pointer',
                  boxShadow:form.color===c?`0 0 8px ${c}`:'none',
                  outline:form.color===c?`2px solid ${c}`:'2px solid transparent'}} />
              ))}
            </div>
          </div>
        </div>

        {tab==='path'&&(
          <div className="mb-3">
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>ABSOLUTE FILE PATH</label>
            <input style={inp} value={form.file_path} onChange={e=>set('file_path',e.target.value)}
              placeholder="/Users/you/Music/track.mp3" />
            <p className="font-mono mt-1" style={{fontSize:10,color:'rgba(180,80,180,0.45)'}}>
              Full path to MP3/WAV. Backend auto-detects BPM &amp; key.
            </p>
          </div>
        )}
        {tab==='upload'&&(
          <div className="mb-3">
            <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>SELECT AUDIO FILE</label>
            <input type="file" accept=".mp3,.wav,.flac,.ogg,.m4a" onChange={e=>setFile(e.target.files?.[0]||null)} style={{...inp,cursor:'pointer'}} />
            {file&&<p className="font-mono mt-1" style={{fontSize:10,color:'#60ffaa'}}>✓ {file.name}</p>}
          </div>
        )}
        {tab==='manual'&&(
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>BPM</label>
              <input type="number" style={inp} value={form.bpm} onChange={e=>set('bpm',e.target.value)} min={60} max={200}/>
            </div>
            <div>
              <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>KEY</label>
              <select style={inp} value={form.key} onChange={e=>set('key',e.target.value)}>
                {['Am','Cm','Dm','Em','Fm','Gm','C','D','E','F','G','A'].map(k=><option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="font-pixel block mb-1" style={{fontSize:6,color:'rgba(200,150,255,0.5)'}}>ENERGY</label>
              <input type="number" step="0.01" style={inp} value={form.energy} onChange={e=>set('energy',e.target.value)} min={0} max={1}/>
            </div>
          </div>
        )}

        {error&&<p className="font-mono mb-3 px-2 py-1 border" style={{fontSize:11,color:'#ff4466',borderColor:'rgba(255,68,102,0.3)'}}>✗ {error}</p>}

        <button disabled={busy} className="arcade-btn w-full py-2"
          onClick={tab==='path'?submitPath:tab==='upload'?submitUpload:submitManual}
          style={{color:'#ffaa44',borderColor:'rgba(255,170,68,0.6)',background:'rgba(255,170,68,0.08)',fontSize:8}}>
          {busy?'⏳ ANALYSING...':'+ ADD TO LIBRARY'}
        </button>
      </motion.div>
    </motion.div>
  )
}
