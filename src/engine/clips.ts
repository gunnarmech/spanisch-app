import { seenTokenShare, situationCoverage } from './coverage';
import type { CardState } from './state';
import type { ChileClip, Situation } from '../content/types';

/** Pseudo-Situations-ID für Audio und Task der echten Chile-Aufnahmen. */
export const CHILE_SITUATION = 'chile-echt';

const UNLOCK_SITUATION = '01-grundlagen';
const UNLOCK_COVERAGE = 0.5;
const CLIP_SEEN_SHARE = 0.8;
const CLIP_REPEAT_MS = 3 * 86_400_000;

/** Frei ab der Hälfte der Grundlagen-Dialogwörter; ohne die Situation nie. */
export function chileUnlocked(situations: Situation[], states: Map<string, CardState>, now: number): boolean {
  const s = situations.find((x) => x.id === UNLOCK_SITUATION);
  return !!s && situationCoverage(s, states, now, situations) >= UNLOCK_COVERAGE;
}

/** Gleiches Maß wie bei Dialogen: Anteil der Tokens, deren Wort-Item einen Lernstand hat. */
export function clipShare(clip: ChileClip, situations: Situation[], states: Map<string, CardState>): number {
  return seenTokenShare([clip.es], situations, states);
}

/** Zuerst nie gehörte (höchster Anteil, Gleichstand Dateireihenfolge), sonst der am längsten zurückliegende nach 3 Tagen. */
export function chooseClip(
  clips: ChileClip[],
  situations: Situation[],
  states: Map<string, CardState>,
  heard: Map<string, number>,
  now: number,
): ChileClip | undefined {
  const eligible = clips
    .map((c) => ({ c, share: clipShare(c, situations, states) }))
    .filter((x) => x.share >= CLIP_SEEN_SHARE);
  let best: { c: ChileClip; share: number } | undefined;
  for (const x of eligible) {
    if (!heard.has(x.c.id)) {
      if (!best || x.share > best.share) best = x;
    }
  }
  if (best) return best.c;
  const oldest = eligible.map((x) => x.c).sort((a, b) => heard.get(a.id)! - heard.get(b.id)!)[0];
  return oldest && now - heard.get(oldest.id)! >= CLIP_REPEAT_MS ? oldest : undefined;
}
