from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os, shutil, uuid

from mock_tracks import MOCK_TRACKS
from compatibility import check_compatibility, check_sequence
from sequence import optimize_sequence
from mixer import AudioMixer, OUTPUT_DIR

app = FastAPI(title="Pixel DJ Mixer API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "audio")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ── Models ────────────────────────────────────────────────────────────────────

class Track(BaseModel):
    id: str
    name: str
    artist: str = "UNKNOWN"
    bpm: float
    key: str
    energy: float
    danceability: float = 0.8
    loudness: float = -5.0
    duration: int = 240
    genre: str = "ELECTRONIC"
    color: str = "#ff6ed8"
    file_path: Optional[str] = None

class CompatibilityRequest(BaseModel):
    tracks: List[Track]

class MixRequest(BaseModel):
    tracks: List[Track]
    effects: List[str] = []
    transition_type: str = "crossfade"

class LocalTrackRequest(BaseModel):
    file_path: str
    name: Optional[str] = None
    artist: Optional[str] = "LOCAL ARTIST"
    genre: Optional[str] = "ELECTRONIC"
    color: Optional[str] = "#ff6ed8"

class LinkAudioRequest(BaseModel):
    track_id: str
    file_path: str   # absolute path already on the server (after upload)


# ── Fast audio analysis (pydub only — no librosa, returns instantly) ──────────

def fast_analyze(file_path: str) -> dict:
    """Quick analysis using pydub. Returns in under 1 second."""
    try:
        from pydub import AudioSegment
        audio    = AudioSegment.from_file(file_path)
        duration = int(len(audio) / 1000)
        dbfs     = audio.dBFS
        energy   = round(min(1.0, max(0.0, (dbfs + 50) / 50)), 3)
        return {
            "bpm": 128.0,
            "key": "Am",
            "energy": energy,
            "danceability": 0.85,
            "loudness": round(dbfs, 1),
            "duration": duration,
            "analyzer": "pydub_fast",
        }
    except Exception as e:
        return {
            "bpm": 128.0, "key": "Am", "energy": 0.8,
            "danceability": 0.85, "loudness": -6.0, "duration": 240,
            "analyzer": "fallback", "error": str(e),
        }


def slow_analyze_and_update(track_id: str, file_path: str):
    """
    Runs librosa analysis in the background after upload completes.
    Updates the track in MOCK_TRACKS when done.
    """
    try:
        from beat_analyzer import analyze_audio
        features = analyze_audio(file_path)
        for t in MOCK_TRACKS:
            if t["id"] == track_id:
                t.update(features)
                break
    except Exception:
        pass  # librosa not installed — that's fine


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "PIXEL DJ MIXER API ONLINE", "version": "1.0.0"}


@app.get("/tracks")
def get_tracks(search: str = ""):
    tracks = MOCK_TRACKS
    if search:
        q = search.lower()
        tracks = [t for t in tracks if
                  q in t["name"].lower() or
                  q in t["artist"].lower() or
                  q in t["genre"].lower()]
    return {"tracks": tracks, "total": len(tracks)}


@app.post("/tracks/upload")
async def upload_track(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = "",
    artist: str = "UNKNOWN",
    genre: str = "ELECTRONIC",
    color: str = "#ff6ed8",
):
    """
    Upload an audio file from the browser.
    Returns immediately with fast analysis.
    Librosa deep-analysis runs in the background and updates the track.
    """
    allowed = {".mp3", ".wav", ".flac", ".ogg", ".m4a"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}. Use mp3, wav, flac, ogg or m4a.")

    uid       = uuid.uuid4().hex[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{uid}{ext}")

    # Save file
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Fast analysis (instant)
    features = fast_analyze(save_path)

    track_name = (name or os.path.splitext(file.filename)[0]).upper()[:20]
    track = {
        "id":        f"upload_{uid}",
        "name":      track_name,
        "artist":    artist.upper(),
        "genre":     genre.upper(),
        "color":     color,
        "file_path": save_path,
        **features,
    }
    MOCK_TRACKS.append(track)

    # Kick off slow librosa analysis in background — updates track when done
    background_tasks.add_task(slow_analyze_and_update, track["id"], save_path)

    return {"success": True, "track": track, "note": "BPM/key analysis running in background"}


@app.post("/tracks/analyze-local")
def analyze_local_track(req: LocalTrackRequest):
    """Point to a file already on this machine by absolute path."""
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")

    features = fast_analyze(req.file_path)
    name     = req.name or os.path.splitext(os.path.basename(req.file_path))[0].upper()
    track = {
        "id":        f"local_{uuid.uuid4().hex[:6]}",
        "name":      name[:20].upper(),
        "artist":    (req.artist or "LOCAL").upper(),
        "genre":     (req.genre or "ELECTRONIC").upper(),
        "color":     req.color or "#ff6ed8",
        "file_path": req.file_path,
        **features,
    }
    MOCK_TRACKS.append(track)
    return {"success": True, "track": track}


@app.post("/tracks/link-audio")
async def link_audio_to_track(
    background_tasks: BackgroundTasks,
    track_id: str = "",
    file: UploadFile = File(...),
):
    """
    Upload a file and attach it to an EXISTING track by ID.
    This is how you give audio to the 10 built-in demo tracks.
    """
    allowed = {".mp3", ".wav", ".flac", ".ogg", ".m4a"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    uid       = uuid.uuid4().hex[:8]
    save_path = os.path.join(UPLOAD_DIR, f"linked_{uid}{ext}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Find existing track and attach file
    target = None
    for t in MOCK_TRACKS:
        if t["id"] == track_id:
            t["file_path"] = save_path
            target = t
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Track {track_id} not found")

    # Update duration from the real file
    features = fast_analyze(save_path)
    target["duration"] = features["duration"]
    target["loudness"] = features["loudness"]

    # Background deep analysis
    background_tasks.add_task(slow_analyze_and_update, track_id, save_path)

    return {"success": True, "track": target,
            "note": "Audio linked! BPM/key analysis running in background."}


@app.post("/compatibility/pair")
def pair_compatibility(request: CompatibilityRequest):
    tracks = [t.dict() for t in request.tracks]
    if len(tracks) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tracks")
    return check_compatibility(tracks[0], tracks[1])


@app.post("/compatibility/sequence")
def sequence_compatibility(request: CompatibilityRequest):
    tracks = [t.dict() for t in request.tracks]
    if len(tracks) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tracks")
    return check_sequence(tracks)


@app.post("/sequence/optimize")
def optimize(request: CompatibilityRequest):
    tracks = [t.dict() for t in request.tracks]
    return optimize_sequence(tracks)


@app.post("/mix")
def create_mix(request: MixRequest):
    tracks = [t.dict() for t in request.tracks]
    if not tracks:
        raise HTTPException(status_code=400, detail="No tracks provided")
    return AudioMixer().mix(tracks, request.effects, request.transition_type)


@app.get("/download/{filename}")
def download_mix(filename: str):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(OUTPUT_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404,
            detail="Mix file not found. In demo mode no real file is generated.")
    return FileResponse(file_path, media_type="audio/mpeg", filename=safe_name,
                        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'})


@app.get("/audio-file")
def stream_audio_file(path: str):
    """Stream a local audio file to the browser for deck preview."""
    safe = os.path.realpath(path)
    allowed_dirs = [
        os.path.realpath(UPLOAD_DIR),
        os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "audio")),
    ]
    if not any(safe.startswith(d) for d in allowed_dirs):
        raise HTTPException(status_code=403,
            detail="Access denied: file is outside the allowed audio directory")
    if not os.path.exists(safe):
        raise HTTPException(status_code=404, detail="File not found")

    ext = os.path.splitext(safe)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg", ".wav": "audio/wav",
        ".flac": "audio/flac", ".ogg": "audio/ogg", ".m4a": "audio/mp4",
    }
    return FileResponse(safe,
        media_type=media_types.get(ext, "audio/mpeg"),
        headers={"Accept-Ranges": "bytes", "Cache-Control": "no-cache"})


@app.get("/health")
def health():
    try:
        import librosa; librosa_ok = True
    except ImportError:
        librosa_ok = False
    try:
        from pydub import AudioSegment; pydub_ok = True
    except ImportError:
        pydub_ok = False
    return {
        "status": "ok",
        "librosa": librosa_ok,
        "pydub": pydub_ok,
        "tracks_loaded": len(MOCK_TRACKS),
        "output_dir": OUTPUT_DIR,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)