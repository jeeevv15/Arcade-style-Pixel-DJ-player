"""
beat_analyzer.py
Analyze real audio files using librosa to extract BPM, key, and energy.
Used when a user uploads/points to a real MP3 or WAV file.
"""
import os
from typing import Optional


def analyze_audio(file_path: str) -> dict:
    """
    Analyze an audio file and return its musical features.
    Falls back to pydub-only analysis if librosa is unavailable.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        return _analyze_with_librosa(file_path)
    except ImportError:
        return _analyze_basic(file_path)


def _analyze_with_librosa(file_path: str) -> dict:
    import librosa
    import numpy as np

    y, sr = librosa.load(file_path, sr=None, mono=True, duration=120)  # analyse first 2 min

    # ── BPM ─────────────────────────────────────────────────
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(round(tempo, 1))

    # ── Energy (RMS) ─────────────────────────────────────────
    rms = librosa.feature.rms(y=y)[0]
    energy = float(np.clip(np.mean(rms) * 10, 0.0, 1.0))

    # ── Key detection via chroma ──────────────────────────────
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)
    pitch_idx = int(np.argmax(chroma_mean))

    notes_major  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    notes_minor  = ['Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm']

    # Simple major/minor heuristic via third
    third_idx = (pitch_idx + 3) % 12
    fourth_idx = (pitch_idx + 4) % 12
    is_minor = chroma_mean[third_idx] > chroma_mean[fourth_idx]
    key = notes_minor[pitch_idx] if is_minor else notes_major[pitch_idx]

    # ── Loudness (dBFS approx) ───────────────────────────────
    loudness = float(round(librosa.amplitude_to_db(np.mean(rms)), 1))

    # ── Danceability (beat strength consistency) ─────────────
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    danceability = float(np.clip(np.std(onset_env) / (np.mean(onset_env) + 1e-6), 0.0, 1.0))

    # ── Duration ─────────────────────────────────────────────
    duration = int(librosa.get_duration(y=y, sr=sr))

    return {
        "bpm": bpm,
        "key": key,
        "energy": round(energy, 3),
        "danceability": round(danceability, 3),
        "loudness": loudness,
        "duration": duration,
        "analyzer": "librosa",
    }


def _analyze_basic(file_path: str) -> dict:
    """Fallback: use pydub to get duration & estimate energy from volume."""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(file_path)
        duration = int(len(audio) / 1000)
        dbfs = audio.dBFS
        # Rough energy from loudness (normalised 0-1)
        energy = round(min(1.0, max(0.0, (dbfs + 50) / 50)), 3)
        return {
            "bpm": 128.0,        # unknown — default
            "key": "Am",         # unknown — default
            "energy": energy,
            "danceability": 0.8,
            "loudness": round(dbfs, 1),
            "duration": duration,
            "analyzer": "pydub_basic",
        }
    except Exception as e:
        return {
            "bpm": 128.0,
            "key": "Am",
            "energy": 0.8,
            "danceability": 0.8,
            "loudness": -6.0,
            "duration": 240,
            "analyzer": "fallback",
            "error": str(e),
        }


if __name__ == "__main__":
    import sys, json
    if len(sys.argv) < 2:
        print("Usage: python beat_analyzer.py <audio_file>")
        sys.exit(1)
    result = analyze_audio(sys.argv[1])
    print(json.dumps(result, indent=2))
