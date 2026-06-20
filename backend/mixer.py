import os
import uuid
import time


OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fx")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


class AudioMixer:
    def mix(self, tracks: list, effects: list, transition_type: str) -> dict:
        ensure_output_dir()
        try:
            return self._mix_real(tracks, effects, transition_type)
        except Exception as e:
            return self._mix_simulated(tracks, effects, transition_type, reason=str(e))

    # ── Real pydub mix ──────────────────────────────────────────────────────
    def _mix_real(self, tracks: list, effects: list, transition_type: str) -> dict:
        from pydub import AudioSegment
        from pydub.effects import normalize

        valid = [t for t in tracks if t.get("file_path") and os.path.exists(t["file_path"])]
        if not valid:
            raise FileNotFoundError("No valid audio files provided")

        crossfade_ms = {"crossfade": 3000, "cut": 0, "long_blend": 6000, "fx_transition": 2000}.get(
            transition_type, 3000
        )

        mixed: AudioSegment = None
        for i, track in enumerate(valid):
            seg = AudioSegment.from_file(track["file_path"])
            seg = normalize(seg)
            seg = self._apply_effects(seg, effects)
            if mixed is None:
                mixed = seg
            else:
                if crossfade_ms > 0:
                    mixed = mixed.append(seg, crossfade=min(crossfade_ms, len(mixed) // 2))
                else:
                    mixed = mixed + seg

        filename = f"mix_{uuid.uuid4().hex[:8]}.mp3"
        out_path = os.path.join(OUTPUT_DIR, filename)
        mixed.export(out_path, format="mp3", bitrate="192k")

        return {
            "success": True,
            "filename": filename,
            "duration": round(len(mixed) / 1000),
            "tracks_mixed": len(valid),
            "simulated": False,
            "effects_applied": effects,
            "transition_type": transition_type,
            "message": f"Mix complete! {len(valid)} tracks blended.",
        }

    def _apply_effects(self, segment, effects: list):
        from pydub import AudioSegment

        for fx_name in effects:
            fx_path = os.path.join(ASSETS_DIR, f"{fx_name}.wav")
            if os.path.exists(fx_path):
                try:
                    fx = AudioSegment.from_file(fx_path)
                    if len(segment) > len(fx) + 1000:
                        pos = len(segment) // 4
                        segment = segment.overlay(fx, position=pos)
                except Exception:
                    pass
        return segment

    # ── Simulated mix (no audio files needed) ───────────────────────────────
    def _mix_simulated(self, tracks: list, effects: list, transition_type: str, reason: str = "") -> dict:
        time.sleep(0.8)  # Simulate processing
        total_duration = sum(t.get("duration", 240) for t in tracks)
        # Remove crossfade time from total
        crossfade_s = {"crossfade": 3, "long_blend": 6, "fx_transition": 2, "cut": 0}.get(
            transition_type, 3
        )
        mixed_duration = max(30, total_duration - crossfade_s * max(0, len(tracks) - 1))
        filename = f"mix_demo_{uuid.uuid4().hex[:8]}.mp3"

        return {
            "success": True,
            "filename": filename,
            "duration": mixed_duration,
            "tracks_mixed": len(tracks),
            "simulated": True,
            "effects_applied": effects,
            "transition_type": transition_type,
            "message": (
                f"DEMO MODE — {len(tracks)} tracks queued. "
                "Place real MP3/WAV files in the /audio folder and set file_path to export a real mix."
            ),
            "demo_note": reason,
        }
