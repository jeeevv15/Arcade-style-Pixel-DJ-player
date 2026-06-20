# 🎛 PIXEL DJ MIXER

A full-stack retro arcade-style AI DJ mixer web app. Mix tracks, analyse compatibility using the Camelot wheel, optimise your set sequence, apply FX, and export your mix.

```
┌─────────────────────────────────────────────────┐
│  PIXEL DJ MIXER  —  ARCADE v1.0                 │
│  Frontend: Next.js 14  ·  Backend: FastAPI       │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. First-time setup
```bash
cd pixel-dj-proj
chmod +x setup.sh start.sh
./setup.sh
```

### 2. Run the app
```bash
./start.sh
```
- **Frontend** → http://localhost:3000  
- **Backend API** → http://localhost:8000  
- **API docs** → http://localhost:8000/docs  

### 3. Manual start (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate          # Windows
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Project Structure

```
pixel-dj-proj/
├── backend/
│   ├── main.py            # FastAPI app — all routes
│   ├── compatibility.py   # Camelot wheel key + BPM + energy scoring
│   ├── sequence.py        # Sequence optimiser (exhaustive / greedy)
│   ├── mixer.py           # pydub audio mixing engine + demo fallback
│   ├── beat_analyzer.py   # librosa BPM / key detection for real files
│   ├── mock_tracks.py     # 10 built-in demo tracks
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.jsx       # Main DJ mixer page (all state lives here)
│   │   ├── layout.jsx     # Root layout + fonts
│   │   └── globals.css    # Neon / CRT / pixel styles
│   ├── components/
│   │   ├── DJDeck.jsx     # Spinning vinyl deck A/B
│   │   ├── TrackLibrary.jsx  # Searchable track grid
│   │   ├── Timeline.jsx   # Drag-to-reorder mix sequence
│   │   ├── EffectsPanel.jsx  # LED FX buttons + transition selector
│   │   ├── EQPanel.jsx    # 3-band EQ with rotary knobs
│   │   ├── MixScore.jsx   # SVG ring compatibility score display
│   │   ├── ExportPanel.jsx   # Mix / analyse / export controls
│   │   ├── AddTrackModal.jsx # Add local files, upload, or manual entry
│   │   └── Visualizer.jsx    # Animated spectrum bars
│   └── lib/api.js         # All fetch calls to backend
│
├── audio/                 # Drop your MP3/WAV files here
├── assets/fx/             # Drop FX samples here (kick.wav, snare.wav …)
├── setup.sh               # Installs everything
└── start.sh               # Starts both servers
```

---

## Using Real Audio Files

The app works in **demo mode** with no audio files.  
To mix real tracks:

### Option A — Point to a local file path
Click **+ ADD TRACK** → **LOCAL PATH** → paste the full absolute path, e.g.:
```
/Users/you/Music/my_track.mp3
```
The backend auto-detects BPM and key with librosa.

### Option B — Upload directly
Click **+ ADD TRACK** → **UPLOAD FILE** → choose any MP3/WAV/FLAC.

### Option C — Manual entry
Click **+ ADD TRACK** → **MANUAL ENTRY** → fill in BPM, key, energy.

---

## Adding FX Samples
Drop WAV files named exactly into `assets/fx/`:
```
assets/fx/
  kick.wav
  snare.wav
  scratch.wav
  gong.wav
  filter.wav
  reverb.wav
  flanger.wav
  echo.wav
```
Enable buttons in the FX panel and they'll be overlaid into the mix.

---

## Compatibility System

Tracks are scored on three axes:

| Axis | Weight | Method |
|------|--------|--------|
| **Key** | 40% | Camelot wheel (harmonic mixing) |
| **BPM** | 40% | BPM difference + harmonic doubling |
| **Energy** | 20% | RMS energy delta |

| Score | Rating |
|-------|--------|
| 80–100 | ✅ PERFECT MIX |
| 65–79  | 🟢 GOOD MIX   |
| 50–64  | 🟡 DECENT MIX |
| 35–49  | 🟠 RISKY MIX  |
| 0–34   | 🔴 CLASH!     |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tracks` | List all tracks (supports `?search=`) |
| POST | `/tracks/analyze-local` | Analyse a local file by path |
| POST | `/tracks/upload` | Upload audio file |
| POST | `/compatibility/pair` | Score two tracks |
| POST | `/compatibility/sequence` | Score a full sequence |
| POST | `/sequence/optimize` | Reorder for best flow |
| POST | `/mix` | Render the mix |
| GET | `/download/{filename}` | Download rendered mix |
| GET | `/health` | Check librosa/pydub status |

Full interactive docs: **http://localhost:8000/docs**

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Drag & drop | @dnd-kit/sortable |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Audio analysis | librosa, numpy |
| Audio mixing | pydub |
| Compatibility | Camelot wheel algorithm |

---

## Troubleshooting

**`librosa` install fails** — try: `pip install librosa --no-deps && pip install soundfile`  
**`pydub` can't read MP3** — install ffmpeg: `brew install ffmpeg` / `choco install ffmpeg`  
**Port 3000 in use** — edit `frontend/package.json` dev script: `next dev -p 3001`  
**Port 8000 in use** — edit `backend/main.py` last line: `port=8001`  
**API OFFLINE shown** — start the backend first, then refresh the frontend

---

*Built with 🎛 neon and pixels.*
