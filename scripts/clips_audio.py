#!/usr/bin/env python
"""Wandelt die Aufnahmen aus content/chile-hoeren.json in mp3 um.

Aufruf: python scripts/clips_audio.py --slr71 <ordner> [--only-missing]
Quelle: <ordner>/es_cl_female.zip und es_cl_male.zip (OpenSLR SLR71, CC BY-SA 4.0).
Nur die benoetigten WAV-Dateien werden in einen Temp-Ordner entpackt, nie ins Repository.
Ausgabe: public/audio/chile-echt/<clip-id>-cl-<f|m>-normal.mp3 und manifest.json
(Hash = sha1 der Quell-WAV plus Filterkette, damit --only-missing Aenderungen erkennt).
Filter: Stille an Anfang und Ende entfernen, Lautheit normalisieren, mono, 64 kbit/s.
"""
import argparse
import contextlib
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ROOT / "content" / "chile-hoeren.json"
OUT = ROOT / "public" / "audio" / "chile-echt"

ZIPS = {"f": "es_cl_female.zip", "m": "es_cl_male.zip"}
MIN_SECONDS = 0.5
MAX_SECONDS = 12.0

# Stille vorn entfernen, Stream umdrehen, hinten genauso, zurueckdrehen; dann Lautheit.
FILTER = (
    "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,"
    "areverse,"
    "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,"
    "areverse,"
    "loudnorm=I=-16:TP=-1.5:LRA=11,"
    "aresample=24000"
)


def voice_of(gender: str) -> str:
    return f"cl-{gender}"


def mp3_name(clip_id: str, gender: str) -> str:
    return f"{clip_id}-{voice_of(gender)}-normal.mp3"


def source_hash(wav: bytes) -> str:
    return hashlib.sha1(wav + FILTER.encode("utf-8")).hexdigest()


def duration_seconds(ffmpeg: str, mp3: Path) -> float:
    r = subprocess.run([ffmpeg, "-hide_banner", "-i", str(mp3)], capture_output=True, text=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", r.stderr)
    if not m:
        raise RuntimeError(f"Dauer von {mp3.name} nicht lesbar")
    return int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])


def convert(ffmpeg: str, wav: Path, mp3: Path) -> None:
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
           "-af", FILTER, "-ac", "1", "-b:a", "64k", str(mp3)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg fehlgeschlagen fuer {wav.name}: {r.stderr.strip()}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slr71", required=True, help="Ordner mit es_cl_female.zip und es_cl_male.zip")
    ap.add_argument("--only-missing", action="store_true", help="vorhandene, unveraenderte Dateien nicht neu wandeln")
    args = ap.parse_args()

    slr = Path(args.slr71)
    clips = json.loads(CLIPS.read_text(encoding="utf-8"))["clips"]
    for name in ZIPS.values():
        if not (slr / name).exists():
            print(f"{slr / name} fehlt", file=sys.stderr)
            return 1

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    old = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    manifest: dict = {}
    problems = []
    converted = skipped = 0
    durations = []

    with contextlib.ExitStack() as stack:
        zips = {g: stack.enter_context(zipfile.ZipFile(slr / name)) for g, name in ZIPS.items()}
        tmpdir = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix="slr71-")))
        for c in clips:
            g = c["gender"]
            member = c["source"] + ".wav"
            try:
                wav = zips[g].read(member)
            except KeyError:
                print(f"{member} fehlt in {slr / ZIPS[g]} (Clip {c['id']})", file=sys.stderr)
                return 1
            h = source_hash(wav)
            target = OUT / mp3_name(c["id"], g)
            prev = next((e for e in old.get(c["id"], []) if e["voice"] == voice_of(g) and e["speed"] == "normal"), None)
            if not (args.only_missing and target.exists() and prev and prev["hash"] == h):
                src = tmpdir / member
                src.write_bytes(wav)
                convert(ffmpeg, src, target)
                src.unlink()
                converted += 1
            else:
                skipped += 1
            d = duration_seconds(ffmpeg, target)
            durations.append(d)
            if d < MIN_SECONDS or d > MAX_SECONDS:
                problems.append(f"{target.name}: {d:.2f} s ausserhalb {MIN_SECONDS} bis {MAX_SECONDS}")
            manifest[c["id"]] = [{"voice": voice_of(g), "speed": "normal", "hash": h}]

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    wanted = {mp3_name(c["id"], c["gender"]) for c in clips}
    for p in OUT.glob("*.mp3"):
        if p.name not in wanted:
            p.unlink()
            print(f"entfernt: {p.name}")

    total = sum(p.stat().st_size for p in OUT.glob("*.mp3"))
    print(f"{converted} gewandelt, {skipped} uebersprungen; Dauer {min(durations):.2f} bis {max(durations):.2f} s, "
          f"Summe {total / 1e6:.1f} MB")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
