# 🎛️ Pixel DJ Mixer

> A full-stack retro arcade-style AI DJ mixer — mix tracks, analyse harmonic compatibility via the Camelot wheel, optimise your set sequence, apply FX, and export your mix.

<img width="942" height="392" alt="Screenshot 2026-06-21 050749" src="https://github.com/user-attachments/assets/0f80cd15-0a66-415f-9a9f-6e84a2a5c74f" />
<img width="954" height="403" alt="Screenshot 2026-06-21 050817" src="https://github.com/user-attachments/assets/d99a29c9-5f90-4328-9c5b-9bc7ca519fc4" />

---

## ✨ Features

- **Camelot Wheel Compatibility Scoring** — harmonic key matching with BPM and energy analysis
- **Set Sequence Optimiser** — exhaustive/greedy algorithm to find the best track order
- **DJ Decks A/B** — spinning vinyl UI with crossfader and transition controls
- **3-Band EQ** — rotary knobs per deck
- **FX Panel** — overlay WAV samples (kick, snare, scratch, reverb, etc.)
- **Drag-to-Reorder Timeline** — powered by `@dnd-kit/sortable`
- **Real Audio Support** — BPM and key auto-detection via librosa for MP3/WAV/FLAC
- **Demo Mode** — works out of the box with 10 built-in mock tracks, no audio files needed
- **Mix Export** — render and download your mix via pydub

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- ffmpeg (for MP3 support — `brew install ffmpeg` / `choco install ffmpeg`)

### 1. Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/pixel-dj-mixer.git
cd pixel-dj-mixer
chmod +x setup.sh start.sh
./setup.sh
```

### 2. Run
```bash
./start.sh
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Manual Start (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate      # Windows: venv\Scripts\activate
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🗂️ Project Structure

```
pixel-dj-mixer/
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
│   │   ├── page.jsx          # Main DJ mixer page (all state lives here)
│   │   ├── layout.jsx        # Root layout + fonts
│   │   └── globals.css       # Neon / CRT / pixel styles
│   ├── components/
│   │   ├── DJDeck.jsx        # Spinning vinyl deck A/B
│   │   ├── TrackLibrary.jsx  # Searchable track grid
│   │   ├── Timeline.jsx      # Drag-to-reorder mix sequence
│   │   ├── EffectsPanel.jsx  # LED FX buttons + transition selector
│   │   ├── EQPanel.jsx       # 3-band EQ with rotary knobs
│   │   ├── MixScore.jsx      # SVG ring compatibility score display
│   │   ├── ExportPanel.jsx   # Mix / analyse / export controls
│   │   ├── AddTrackModal.jsx # Add local files, upload, or manual entry
│   │   └── Visualizer.jsx    # Animated spectrum bars
│   └── lib/api.js            # All fetch calls to backend
│
├── audio/                    # Drop your MP3/WAV files here
├── assets/fx/                # Drop FX samples here
├── setup.sh
└── start.sh
```

---

## 🎵 Using Real Audio Files

The app runs in **demo mode** with no audio files required. To mix real tracks:

**Option A — Local file path**
`+ ADD TRACK → LOCAL PATH` → paste the absolute path, e.g. `/Users/you/Music/track.mp3`
BPM and key are auto-detected via librosa.

**Option B — Upload directly**
`+ ADD TRACK → UPLOAD FILE` → choose any MP3 / WAV / FLAC.

**Option C — Manual entry**
`+ ADD TRACK → MANUAL ENTRY` → fill in BPM, key, energy yourself.

---

## 🎚️ Adding FX Samples

Drop WAV files with these exact names into `assets/fx/`:

```
kick.wav  snare.wav  scratch.wav  gong.wav
filter.wav  reverb.wav  flanger.wav  echo.wav
```

Enable buttons in the FX panel and they'll be layered into the rendered mix.

---

## 📊 Compatibility Scoring

Tracks are scored across three axes:

| Axis | Weight | Method |
|------|--------|--------|
| Key | 40% | Camelot wheel (harmonic mixing) |
| BPM | 40% | BPM delta + harmonic doubling detection |
| Energy | 20% | RMS energy delta |

| Score | Rating |
|-------|--------|
| 80–100 | ✅ Perfect Mix |
| 65–79 | 🟢 Good Mix |
| 50–64 | 🟡 Decent Mix |
| 35–49 | 🟠 Risky Mix |
| 0–34 | 🔴 Clash! |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tracks` | List all tracks (supports `?search=`) |
| POST | `/tracks/analyze-local` | Analyse a local file by path |
| POST | `/tracks/upload` | Upload an audio file |
| POST | `/compatibility/pair` | Score two tracks |
| POST | `/compatibility/sequence` | Score a full sequence |
| POST | `/sequence/optimize` | Reorder tracks for best flow |
| POST | `/mix` | Render the mix |
| GET | `/download/{filename}` | Download rendered mix |
| GET | `/health` | Check librosa/pydub status |

Full interactive docs at **http://localhost:8000/docs**

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Drag & Drop | @dnd-kit/sortable |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Audio Analysis | librosa, numpy |
| Audio Mixing | pydub |
| Compatibility | Camelot wheel algorithm |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `librosa` install fails | `pip install librosa --no-deps && pip install soundfile` |
| `pydub` can't read MP3 | Install ffmpeg: `brew install ffmpeg` / `choco install ffmpeg` |
| Port 3000 in use | Edit `frontend/package.json`: `"dev": "next dev -p 3001"` |
| Port 8000 in use | Edit `backend/main.py` last line: `port=8001` |
| API OFFLINE shown | Start the backend first, then refresh the frontend |

---

*Built with 🎛️ neon, pixels, and way too much caffeine.*
