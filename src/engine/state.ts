import { createEmptyCard, fsrs, generatorParameters, State, type Card, type Grade } from 'ts-fsrs';
import type { GradeResult } from './grade';

/** 0 Erstkontakt plus Auswahl, 1 Hören zu Bedeutung, 2 Deutsch zu Spanisch tippen, 3 Sprechen, 4 Hören unter Druck. */
export type Stage = 0 | 1 | 2 | 3 | 4;

export type ReviewEvent =
  | { id: string; cardId: string; ts: number; device: string; kind: 'review'; rating: 1 | 2 | 3 | 4; stage: Stage }
  | { id: string; cardId: string; ts: number; device: string; kind: 'known' }
  /** Dialog angehört (cardId = Dialog-id). Dialoge sind keine Karten, das Ereignis ändert keinen Lernstand. */
  | { id: string; cardId: string; ts: number; device: string; kind: 'heard' };

/**
 * Lernstand einer Karte. `consolidated` heißt gefestigt: bekannt markiert oder mindestens eine verteilte
 * erfolgreiche Wiederholung (Rating 2 bis 4, mindestens CONSOLIDATE_MS nach dem vorherigen review) ohne Rating 1 danach.
 */
export type CardState = { card: Card; stage: Stage; known: boolean; consolidated: boolean; lastTs: number };

/** Mindestabstand zweier Bewertungen, damit die zweite als verteilte Wiederholung zählt (20 Stunden). */
export const CONSOLIDATE_MS = 20 * 3_600_000;

const MAX_TS = 8.64e15;

/** Prüft ein Ereignis vollständig (auch Wertebereiche), damit kaputte Daten das Abspielen nie zum Werfen bringen. */
export function validEvent(x: unknown): x is ReviewEvent {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as Record<string, unknown>;
  if (typeof e.id !== 'string' || e.id === '' || typeof e.cardId !== 'string' || e.cardId === '') return false;
  if (typeof e.ts !== 'number' || !Number.isFinite(e.ts) || Math.abs(e.ts) > MAX_TS) return false;
  if (e.kind === 'known' || e.kind === 'heard') return true;
  return e.kind === 'review' && Number.isInteger(e.rating) && (e.rating as number) >= 1 && (e.rating as number) <= 4 && Number.isInteger(e.stage) && (e.stage as number) >= 0 && (e.stage as number) <= 4;
}

const DAY_MS = 86_400_000;
const KNOWN_DAYS = 60;
const DEFAULT_RETENTION = 0.9;

function scheduler(retention: number) {
  // Ohne Fuzz, damit das Abspielen deterministisch ist.
  return fsrs(generatorParameters({ request_retention: retention, enable_fuzz: false }));
}

function clampStage(n: number): Stage {
  return Math.max(0, Math.min(4, n)) as Stage;
}

function applyKnown(ts: number): CardState {
  const card: Card = {
    ...createEmptyCard(new Date(ts)),
    state: State.Review,
    stability: KNOWN_DAYS,
    difficulty: 5,
    scheduled_days: KNOWN_DAYS,
    reps: 1,
    due: new Date(ts + KNOWN_DAYS * DAY_MS),
    last_review: new Date(ts),
  };
  return { card, stage: 4, known: true, consolidated: true, lastTs: ts };
}

/**
 * Spielt das Ereignisprotokoll ab. Sortiert nach ts, dann id; doppelte ids zählen einmal;
 * Ereignisse zu unbekannten Karten und ungültige Ereignisse werden ignoriert. Das Ergebnis hängt nicht von der Eingabereihenfolge ab.
 */
export function replay(
  events: ReviewEvent[],
  validCardIds: Set<string>,
  retention?: number,
): Map<string, CardState> {
  const f = scheduler(retention ?? DEFAULT_RETENTION);
  // Ungültige Einträge (z. B. aus schon beschädigten Protokollen) werden übersprungen, statt zu werfen.
  const sorted = events.filter(validEvent).sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const seen = new Set<string>();
  const states = new Map<string, CardState>();
  // Zeitpunkt des letzten review je Karte (known-Ereignisse zählen nicht).
  const lastReviewTs = new Map<string, number>();

  for (const e of sorted) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.kind === 'heard' || !validCardIds.has(e.cardId)) continue;

    if (e.kind === 'known') {
      states.set(e.cardId, applyKnown(e.ts));
      continue;
    }

    const prev = states.get(e.cardId);
    const card = prev?.card ?? createEmptyCard(new Date(e.ts));
    const next = f.next(card, new Date(e.ts), e.rating as Grade).card;
    let stage = clampStage((prev?.stage ?? 0) + (e.rating >= 3 ? 1 : e.rating === 1 ? -1 : 0));
    let known = prev?.known ?? false;
    if (known && e.rating === 1) {
      known = false;
      stage = 2;
    }
    let consolidated = prev?.consolidated ?? false;
    const lastReview = lastReviewTs.get(e.cardId);
    if (e.rating === 1) consolidated = false;
    else if (lastReview !== undefined && e.ts - lastReview >= CONSOLIDATE_MS) consolidated = true;
    lastReviewTs.set(e.cardId, e.ts);
    states.set(e.cardId, { card: next, stage, known, consolidated, lastTs: e.ts });
  }
  return states;
}

/** Spätester Zeitpunkt, an dem ein Dialog angehört wurde, je Dialog-id. Doppelte ids zählen einmal. */
export function dialogsHeard(events: ReviewEvent[]): Map<string, number> {
  const heard = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== 'heard') continue;
    heard.set(e.cardId, Math.max(heard.get(e.cardId) ?? 0, e.ts));
  }
  return heard;
}

/** Abrufwahrscheinlichkeit zum Zeitpunkt now (Millisekunden). Neue Karten ohne Wiederholung liefern 0. */
export function retrievability(s: CardState, now: number): number {
  return scheduler(DEFAULT_RETENTION).retrievability(s.card, new Date(now));
}

export function ratingFor(
  verdict: GradeResult['verdict'],
  ms: number,
  stage: Stage,
  usedHint: boolean,
): 1 | 2 | 3 | 4 {
  if (verdict === 'wrong') return 1;
  if (verdict === 'accent' || verdict === 'typo' || usedHint || ms > 15000) return 2;
  if (stage >= 3 && ms < 4000) return 4;
  return 3;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export function newEvent(
  partial: DistributiveOmit<ReviewEvent, 'id' | 'ts' | 'device'>,
  device: string,
  now: number = Date.now(),
): ReviewEvent {
  return { ...partial, id: crypto.randomUUID(), ts: now, device } as ReviewEvent;
}

