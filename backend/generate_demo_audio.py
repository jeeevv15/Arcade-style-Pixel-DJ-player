"""
generate_demo_audio.py
Generates 10 short demo WAV tracks using numpy — no internet needed.
Run once:  python generate_demo_audio.py
Places files in ../audio/ and prints the curl commands to register them.
"""
import numpy as np, wave, os

SAMPLE_RATE = 44100
DURATION    = 30   # seconds per track
OUT_DIR     = os.path.join(os.path.dirname(__file__), "..", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

def write_wav(path, samples):
    samples = np.clip(samples, -1, 1)
    data = (samples * 32767).astype(np.int16)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(data.tobytes())

def kick_drum(t, bpm):
    out = np.zeros_like(t)
    for b in np.arange(0, DURATION, 60/bpm):
        mask = (t >= b) & (t < b + 0.25)
        loc  = t[mask] - b
        out[mask] += np.sin(2*np.pi * 160*np.exp(-25*loc) * loc) * np.exp(-18*loc) * 0.8
    return out

def hi_hat(t, bpm, div=4):
    noise = np.random.uniform(-1, 1, len(t))
    out   = np.zeros_like(t)
    for b in np.arange(0, DURATION, 60/bpm/div):
        mask = (t >= b) & (t < b + 0.04)
        loc  = t[mask] - b
        out[mask] += noise[mask] * np.exp(-80*loc) * 0.3
    return out

def bass_line(t, root, bpm):
    out   = np.zeros_like(t)
    freqs = [root, root*1.5, root*0.75, root*2]
    step  = 60/bpm*2
    for i, b in enumerate(np.arange(0, DURATION, step)):
        mask = (t >= b) & (t < b + step*0.8)
        loc  = t[mask] - b
        f    = freqs[i % 4]
        wave = (np.sin(2*np.pi*f*loc) +
                0.5*np.sin(2*np.pi*2*f*loc) +
                0.25*np.sin(2*np.pi*3*f*loc))
        out[mask] += wave * np.exp(-3*loc) * 0.35
    return out

def synth_lead(t, root, bpm):
    notes = [root, root*1.19, root*1.33, root*1.5, root*1.78, root*2.0]
    out   = np.zeros_like(t)
    step  = 60/bpm*0.5
    for i, b in enumerate(np.arange(0, DURATION, step)):
        if i % 3 != 0: continue
        mask = (t >= b) & (t < b + step*1.8)
        loc  = t[mask] - b
        f    = notes[i % len(notes)]
        out[mask] += np.sin(2*np.pi*f*loc) * np.exp(-4*loc) * (1-np.exp(-80*loc)) * 0.22
    return out

def pad(t, root):
    out = np.zeros_like(t)
    for factor in [1.0, 1.26, 1.5, 2.0]:
        lfo  = 0.5 + 0.5*np.sin(2*np.pi*0.4*t)
        out += np.sin(2*np.pi*root*factor*t) * lfo * 0.1
    return out

TRACKS = [
    dict(id="1",  name="NEON RUSH",      bpm=128, root=220,  layers=["kick","hat4","bass","lead"]),
    dict(id="2",  name="PIXEL STORM",    bpm=130, root=196,  layers=["kick","hat8","bass","pad"]),
    dict(id="3",  name="DARK CIRCUIT",   bpm=135, root=174,  layers=["kick","hat4","bass"]),
    dict(id="4",  name="ARCADE WAVE",    bpm=126, root=261,  layers=["kick","hat4","bass","lead","pad"]),
    dict(id="5",  name="LASER GRID",     bpm=140, root=146,  layers=["kick","hat8","bass"]),
    dict(id="6",  name="CHROME HORIZON", bpm=110, root=293,  layers=["hat4","bass","pad"]),
    dict(id="7",  name="QUANTUM BASS",   bpm=124, root=183,  layers=["kick","hat4","bass","pad"]),
    dict(id="8",  name="SYNTH PHOENIX",  bpm=128, root=246,  layers=["kick","hat4","bass","lead"]),
    dict(id="9",  name="BINARY SUNSET",  bpm=120, root=277,  layers=["kick","hat4","bass","pad"]),
    dict(id="10", name="VOLTAGE DROP",   bpm=132, root=164,  layers=["kick","hat8","bass","lead"]),
]

t = np.linspace(0, DURATION, SAMPLE_RATE * DURATION, endpoint=False)
generated = []

print("Generating demo tracks...\n")
for track in TRACKS:
    mix = np.zeros(len(t))
    for layer in track["layers"]:
        if   layer == "kick": mix += kick_drum(t, track["bpm"])
        elif layer == "hat4": mix += hi_hat(t, track["bpm"], 4)
        elif layer == "hat8": mix += hi_hat(t, track["bpm"], 8)
        elif layer == "bass": mix += bass_line(t, track["root"], track["bpm"])
        elif layer == "lead": mix += synth_lead(t, track["root"]*2, track["bpm"])
        elif layer == "pad":  mix += pad(t, track["root"])

    mix += np.random.uniform(-1, 1, len(t)) * 0.006
    peak = np.max(np.abs(mix))
    if peak > 0: mix = mix / peak * 0.88

    fname = f"demo_{track['id']}_{track['name'].lower().replace(' ','_')}.wav"
    fpath = os.path.join(OUT_DIR, fname)
    write_wav(fpath, mix)
    generated.append({"name": track["name"], "path": fpath})
    print(f"  ✓ {fname}")

print(f"\n✓ All {len(generated)} tracks written to {OUT_DIR}")
print("\nNow register them with the running API:\n")
for g in generated:
    print(f'curl -s -X POST http://localhost:8000/tracks/analyze-local \\')
    print(f'  -H "Content-Type: application/json" \\')
    print(f'  -d \'{{"file_path":"{g["path"]}","name":"{g["name"]}"}}\' | python3 -m json.tool')
    print()