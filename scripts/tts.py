#!/usr/bin/env python
"""Erzeugt die Audiodateien je Situation mit edge-tts.

Aufruf: python scripts/tts.py [--situation ID] [--only-missing]
Ausgabe: public/audio/<situationId>/<key>-<voice>-<speed>.mp3 und manifest.json
Schluessel: Item-ID; Dialogzeile <dialogId>-<n>; Beispiel <itemId>-ex<n>;
Grammatikuebung <grammarId>-<n>; Paaroption <pairId>-opt<n> (n zaehlt ab 1).
"""
import argparse
import asyncio
import hashlib
import json
import sys
from dataclasses import dataclass, replace
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "situations"
AUDIO = ROOT / "public" / "audio"

VOICES = {
    "cl-f": "es-CL-CatalinaNeural",
    "cl-m": "es-CL-LorenzoNeural",
    "mx-f": "es-MX-DaliaNeural",
    "mx-m": "es-MX-JorgeNeural",
    "co-f": "es-CO-SalomeNeural",
    "co-m": "es-CO-GonzaloNeural",
}
VOICE_ORDER = list(VOICES)
RATES = {"slow": "-25%", "normal": "+0%", "fast": "+15%"}

# Reihum gewaehlt: Chile wechselt die Stimme, die zweite Stimme kommt aus mx und co.
CL_CYCLE = ["cl-f", "cl-m"]
OTHER_CYCLE = ["mx-f", "co-m", "mx-m", "co-f"]
DIALOG_B_CYCLE = ["mx-m", "co-m"]

MAX_PARALLEL = 4


@dataclass(frozen=True)
class Job:
    key: str
    text: str
    voice: str
    speed: str

    @property
    def relpath(self) -> str:
        return f"{self.key}-{self.voice}-{self.speed}.mp3"

    @property
    def hash(self) -> str:
        return text_hash(self.text, self.voice, self.speed)


def text_hash(text: str, voice: str, speed: str) -> str:
    return hashlib.sha1((text + voice + speed).encode("utf-8")).hexdigest()


class _Rotation:
    def __init__(self):
        self.n = 0

    def next_pair(self):
        pair = (CL_CYCLE[self.n % len(CL_CYCLE)], OTHER_CYCLE[self.n % len(OTHER_CYCLE)])
        self.n += 1
        return pair


def _two_voices(key, text, speeds, rot, fast_chile=False):
    cl, other = rot.next_pair()
    jobs = []
    for speed in speeds:
        jobs.append(Job(key, text, cl, speed))
        jobs.append(Job(key, text, other, speed))
    if fast_chile:
        jobs.append(Job(key, text, cl, "fast"))
    return jobs


def plan(situation: dict) -> list[Job]:
    """Reine Planung ohne Netz: welche Dateien zu welchem Text gehoeren."""
    rot = _Rotation()
    jobs: list[Job] = []
    dialog_count = 0
    for item in situation["items"]:
        kind, iid = item["kind"], item["id"]
        if kind in ("word", "phrase"):
            jobs += _two_voices(iid, item["es"], ("normal", "slow"), rot)
            for n, ex in enumerate(item.get("examples", []), 1):
                jobs += _two_voices(f"{iid}-ex{n}", ex["es"], ("normal", "slow"), rot)
        elif kind == "sentence":
            jobs += _two_voices(iid, item["es"], ("normal", "slow"), rot, fast_chile=True)
        elif kind == "dialog":
            b_voice = DIALOG_B_CYCLE[dialog_count % len(DIALOG_B_CYCLE)]
            dialog_count += 1
            for n, line in enumerate(item["lines"], 1):
                voice = "cl-f" if line["speaker"] == "A" else b_voice
                for speed in ("normal", "fast"):
                    jobs.append(Job(f"{iid}-{n}", line["es"], voice, speed))
        elif kind == "grammar":
            for n, ex in enumerate(item.get("examples", []), 1):
                jobs += _two_voices(f"{iid}-ex{n}", ex["es"], ("normal", "slow"), rot)
            for n, ex in enumerate(item.get("exercises", []), 1):
                jobs += _two_voices(f"{iid}-{n}", ex["es"], ("normal", "slow"), rot)
        elif kind == "pair":
            jobs += _two_voices(iid, item["es"], ("normal",), rot)
            for n, opt in enumerate(item["options"], 1):
                jobs += _two_voices(f"{iid}-opt{n}", opt, ("normal",), rot)
    return jobs


def manifest_from_jobs(jobs: list[Job]) -> dict:
    manifest: dict = {}
    for j in jobs:
        entries = manifest.setdefault(j.key, [])
        if any(e["voice"] == j.voice and e["speed"] == j.speed for e in entries):
            continue
        entries.append({"voice": j.voice, "speed": j.speed, "hash": j.hash})
    return manifest


def only_missing(jobs: list[Job], manifest: dict, existing: set[str]) -> list[Job]:
    """Jobs, deren Datei fehlt oder deren Text-Hash im Manifest nicht passt."""
    todo = []
    for j in jobs:
        entry = next(
            (e for e in manifest.get(j.key, []) if e["voice"] == j.voice and e["speed"] == j.speed),
            None,
        )
        if entry is None or entry.get("hash") != j.hash or j.relpath not in existing:
            todo.append(j)
    return todo


def stale_files(manifest: dict, existing: set[str]) -> set[str]:
    wanted = {
        f"{key}-{e['voice']}-{e['speed']}.mp3" for key, entries in manifest.items() for e in entries
    }
    return {f for f in existing if f not in wanted}


def fallback_voices(voice: str) -> list[str]:
    """Ersatz aus derselben Laenderliste, danach die uebrigen Stimmen der Reihe nach."""
    country = voice.split("-")[0]
    same = [v for v in VOICE_ORDER if v.startswith(country + "-") and v != voice]
    start = VOICE_ORDER.index(voice)
    rest = [v for v in VOICE_ORDER[start + 1:] + VOICE_ORDER[:start] if not v.startswith(country + "-")]
    return same + rest


async def _synthesize(text: str, voice: str, speed: str, path: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, VOICES[voice], rate=RATES[speed])
    tmp = path.with_suffix(".part")
    try:
        await communicate.save(str(tmp))
        if tmp.stat().st_size == 0:
            raise RuntimeError("leere Audiodatei")
        tmp.replace(path)
    finally:
        tmp.unlink(missing_ok=True)


async def _render(job: Job, out: Path, taken: set, sem: asyncio.Semaphore):
    """Erzeugt die Datei, bei Fehler mit Ersatzstimme. Gibt den tatsaechlich erzeugten Job zurueck oder None."""
    for voice in [job.voice] + fallback_voices(job.voice):
        if voice != job.voice and (job.key, voice, job.speed) in taken:
            continue
        candidate = replace(job, voice=voice)
        for _ in range(2):
            try:
                async with sem:
                    await _synthesize(job.text, voice, job.speed, out / candidate.relpath)
                if voice != job.voice:
                    print(f"  Ersatzstimme {voice} fuer {job.key} ({job.speed})")
                return candidate
            except Exception as exc:  # Netz oder Dienst: zweiter Versuch, dann naechste Stimme
                print(f"  Fehler {voice} {job.key} {job.speed}: {exc}", file=sys.stderr)
    return None


async def run_situation(situation: dict, only_missing_flag: bool) -> bool:
    sid = situation["id"]
    out = AUDIO / sid
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.json"
    old = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    existing = {p.name for p in out.glob("*.mp3")}

    jobs = plan(situation)
    todo = only_missing(jobs, old, existing) if only_missing_flag else list(jobs)
    todo_set = set(todo)
    final = [j for j in jobs if j not in todo_set]
    taken = {(j.key, j.voice, j.speed) for j in jobs}
    print(f"{sid}: {len(jobs)} Dateien geplant, {len(todo)} zu erzeugen")

    sem = asyncio.Semaphore(MAX_PARALLEL)
    results = await asyncio.gather(*(_render(j, out, taken, sem) for j in todo))
    failed = [j for j, r in zip(todo, results) if r is None]
    final += [r for r in results if r is not None]

    manifest = manifest_from_jobs(final)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if failed:
        print(f"{len(failed)} Dateien fehlgeschlagen, nichts geloescht", file=sys.stderr)
        return False
    for name in stale_files(manifest, {p.name for p in out.glob("*.mp3")}):
        (out / name).unlink()
        print(f"  entfernt: {name}")
    return True


def load_situations(only: str | None) -> list[dict]:
    situations = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(CONTENT.glob("*.json"))]
    if only:
        situations = [s for s in situations if s["id"] == only]
        if not situations:
            sys.exit(f"Situation {only} nicht gefunden")
    return situations


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--situation")
    ap.add_argument("--only-missing", action="store_true")
    args = ap.parse_args()
    ok = True
    for s in load_situations(args.situation):
        ok = asyncio.run(run_situation(s, args.only_missing)) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
