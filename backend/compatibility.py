from typing import List, Dict

# Camelot Wheel mapping for harmonic mixing
CAMELOT_WHEEL = {
    "Cm": "5A", "C#m": "12A", "Dbm": "12A", "Dm": "7A", "D#m": "2A",
    "Ebm": "2A", "Em": "9A", "Fm": "4A", "F#m": "11A", "Gbm": "11A",
    "Gm": "6A", "G#m": "1A", "Abm": "1A", "Am": "8A", "A#m": "3A",
    "Bbm": "3A", "Bm": "10A",
    "C": "8B", "C#": "3B", "Db": "3B", "D": "10B", "D#": "5B",
    "Eb": "5B", "E": "12B", "F": "7B", "F#": "2B", "Gb": "2B",
    "G": "9B", "G#": "4B", "Ab": "4B", "A": "11B", "A#": "6B",
    "Bb": "6B", "B": "1B"
}


def get_camelot(key: str):
    camelot = CAMELOT_WHEEL.get(key, "8A")
    return int(camelot[:-1]), camelot[-1]


def check_key_compatibility(key1: str, key2: str) -> float:
    if key1 == key2:
        return 1.0
    n1, l1 = get_camelot(key1)
    n2, l2 = get_camelot(key2)
    # Same letter (both major or both minor) — adjacent on wheel
    if l1 == l2:
        diff = min(abs(n1 - n2), 12 - abs(n1 - n2))
        scores = {0: 1.0, 1: 0.85, 2: 0.55, 3: 0.35}
        return scores.get(diff, 0.15)
    else:
        # Relative major/minor (same number, different letter) = compatible
        if n1 == n2:
            return 0.75
        diff = min(abs(n1 - n2), 12 - abs(n1 - n2))
        return 0.4 if diff <= 1 else 0.2


def check_bpm_compatibility(bpm1: float, bpm2: float) -> float:
    diff = abs(bpm1 - bpm2)
    # Check harmonic BPM (double/half time)
    ratio = max(bpm1, bpm2) / min(bpm1, bpm2)
    harmonic_bonus = 0.15 if abs(ratio - 2.0) < 0.05 else 0.0
    if diff == 0:
        return 1.0
    elif diff <= 2:
        return min(1.0, 0.95 + harmonic_bonus)
    elif diff <= 5:
        return min(1.0, 0.82 + harmonic_bonus)
    elif diff <= 8:
        return min(1.0, 0.68 + harmonic_bonus)
    elif diff <= 12:
        return min(1.0, 0.50 + harmonic_bonus)
    elif diff <= 20:
        return min(1.0, 0.30 + harmonic_bonus)
    return max(0.1, harmonic_bonus)


def check_energy_compatibility(e1: float, e2: float) -> float:
    diff = abs(e1 - e2)
    if diff <= 0.05:
        return 1.0
    elif diff <= 0.15:
        return 0.85
    elif diff <= 0.25:
        return 0.68
    elif diff <= 0.35:
        return 0.50
    elif diff <= 0.50:
        return 0.30
    return 0.15


def get_transition_suggestion(bpm_s: float, key_s: float, energy_s: float) -> str:
    if bpm_s >= 0.85 and key_s >= 0.75:
        return "DIRECT CUT"
    elif bpm_s >= 0.65 and key_s >= 0.55:
        return "CROSSFADE"
    elif energy_s >= 0.70:
        return "FX TRANSITION"
    elif bpm_s >= 0.50:
        return "LONG BLEND"
    else:
        return "SCRATCH BREAK"


def check_compatibility(t1: dict, t2: dict) -> dict:
    key_s = check_key_compatibility(t1["key"], t2["key"])
    bpm_s = check_bpm_compatibility(t1["bpm"], t2["bpm"])
    energy_s = check_energy_compatibility(t1["energy"], t2["energy"])

    overall = key_s * 0.40 + bpm_s * 0.40 + energy_s * 0.20
    pct = round(overall * 100)

    if pct >= 80:
        rating = "PERFECT MIX"
        badge_color = "#00ff00"
    elif pct >= 65:
        rating = "GOOD MIX"
        badge_color = "#aaff00"
    elif pct >= 50:
        rating = "DECENT MIX"
        badge_color = "#ffff00"
    elif pct >= 35:
        rating = "RISKY MIX"
        badge_color = "#ff8800"
    else:
        rating = "CLASH!"
        badge_color = "#ff0044"

    return {
        "key_score": round(key_s * 100),
        "bpm_score": round(bpm_s * 100),
        "energy_score": round(energy_s * 100),
        "overall_score": pct,
        "rating": rating,
        "badge_color": badge_color,
        "bpm_diff": round(abs(t1["bpm"] - t2["bpm"]), 1),
        "transition": get_transition_suggestion(bpm_s, key_s, energy_s),
    }


def check_sequence(tracks: list) -> dict:
    if len(tracks) < 2:
        return {"error": "Need at least 2 tracks", "pair_scores": [], "sequence_score": 0}

    pair_scores = []
    for i in range(len(tracks) - 1):
        score = check_compatibility(tracks[i], tracks[i + 1])
        pair_scores.append({
            "from_track": tracks[i]["name"],
            "to_track": tracks[i + 1]["name"],
            "from_id": tracks[i]["id"],
            "to_id": tracks[i + 1]["id"],
            **score,
        })

    avg = sum(p["overall_score"] for p in pair_scores) / len(pair_scores)
    total_duration = sum(t.get("duration", 240) for t in tracks)
    minutes = total_duration // 60
    seconds = total_duration % 60

    return {
        "pair_scores": pair_scores,
        "sequence_score": round(avg),
        "total_duration": total_duration,
        "duration_display": f"{minutes}:{seconds:02d}",
        "track_count": len(tracks),
    }
