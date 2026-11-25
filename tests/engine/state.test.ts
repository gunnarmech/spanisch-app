import { describe, expect, test } from 'vitest';
import { State } from 'ts-fsrs';
import { dialogsHeard, newEvent, ratingFor, replay, retrievability, type ReviewEvent, type Stage } from '../../src/engine/state';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 25, 10, 0, 0);
const valid = new Set(['a', 'b']);

function review(id: string, cardId: string, ts: number, rating: 1 | 2 | 3 | 4, stage: Stage = 0): ReviewEvent {
  return { id, cardId, ts, device: 'd1', kind: 'review', rating, stage };
}

describe('replay', () => {
  test('neue Karte nach Good auf Stufe 1 und später fällig', () => {
    const s = replay([review('1', 'a', T0, 3)], valid).get('a')!;
    expect(s.stage).toBe(1);
    expect(s.card.due.getTime()).toBeGreaterThan(T0);
    expect(s.lastTs).toBe(T0);
  });

  test('Again senkt Stufe nicht unter 0', () => {
    const s = replay([review('1', 'a', T0, 1)], valid).get('a')!;
    expect(s.stage).toBe(0);
  });

  test('Again senkt Stufe um 1, Hard lässt sie', () => {
    const ev = [review('1', 'a', T0, 3), review('2', 'a', T0 + DAY, 3), review('3', 'a', T0 + 2 * DAY, 2)];
    expect(replay(ev, valid).get('a')!.stage).toBe(2);
    expect(replay([...ev, review('4', 'a', T0 + 3 * DAY, 1)], valid).get('a')!.stage).toBe(1);
  });

  test('Stufe maximal 4', () => {
    const ev = Array.from({ length: 7 }, (_, i) => review(`e${i}`, 'a', T0 + i * DAY, 4));
    expect(replay(ev, valid).get('a')!.stage).toBe(4);
  });

  test('doppelte Ereignis-IDs zählen einmal', () => {
    const e = review('1', 'a', T0, 3);
    expect(replay([e, e], valid)).toEqual(replay([e], valid));
    expect(replay([e, { ...e }], valid)).toEqual(replay([e], valid));
  });

  test('Reihenfolge der Eingabe egal', () => {
    const sorted = [
      review('1', 'a', T0, 3),
      review('2', 'b', T0, 4),
      review('3', 'a', T0 + DAY, 1),
      review('4', 'a', T0 + 2 * DAY, 3),
      { id: '5', cardId: 'b', ts: T0 + 3 * DAY, device: 'd2', kind: 'known' } as ReviewEvent,
      review('6', 'a', T0 + 2 * DAY, 2),
    ];
    const shuffled = [sorted[3], sorted[5], sorted[0], sorted[4], sorted[2], sorted[1], sorted[0]];
    expect(replay(shuffled, valid)).toEqual(replay(sorted, valid));
  });

  test('gleiche ts: Reihenfolge nach id', () => {
    const x = review('x', 'a', T0, 1);
    const y = review('y', 'a', T0, 3);
    expect(replay([y, x], valid)).toEqual(replay([x, y], valid));
  });

  test('überspringt ungültige Ereignisse, statt zu werfen', () => {
    const bad = [
      { id: 'b1', cardId: 'a', ts: T0, device: 'd', kind: 'review', rating: 9, stage: 1 },
      { id: 'b2', cardId: 'a', ts: T0, device: 'd', kind: 'review', rating: 3, stage: 7 },
      { id: 'b3', cardId: 'a', ts: T0, device: 'd', kind: 'review', stage: 1 },
      { id: 'b4', cardId: 'a', ts: NaN, device: 'd', kind: 'review', rating: 3, stage: 1 },
      { id: 'b5', cardId: 'a', ts: 1e300, device: 'd', kind: 'known' },
    ] as unknown as ReviewEvent[];
    const good = review('g', 'a', T0 + 1, 3);
    expect(replay([...bad, good], valid)).toEqual(replay([good], valid));
  });

  test('unbekannte cardId wird ignoriert', () => {
    const m = replay([review('1', 'zzz', T0, 3)], valid);
    expect(m.has('zzz')).toBe(false);
    expect(m.size).toBe(0);
  });

  test('known setzt Stufe 4 und Fälligkeit +60 Tage', () => {
    const s = replay([{ id: 'k', cardId: 'a', ts: T0, device: 'd', kind: 'known' }], valid).get('a')!;
    expect(s.stage).toBe(4);
    expect(s.known).toBe(true);
    expect(s.card.state).toBe(State.Review);
    expect(s.card.stability).toBe(60);
    expect(s.card.due.getTime()).toBe(T0 + 60 * DAY);
  });

  test('Again nach known hebt known auf, Stufe 2', () => {
    const s = replay(
      [{ id: 'k', cardId: 'a', ts: T0, device: 'd', kind: 'known' }, review('r', 'a', T0 + DAY, 1)],
      valid,
    ).get('a')!;
    expect(s.known).toBe(false);
    expect(s.stage).toBe(2);
  });

  test('Good nach known behält known', () => {
    const s = replay(
      [{ id: 'k', cardId: 'a', ts: T0, device: 'd', kind: 'known' }, review('r', 'a', T0 + DAY, 3)],
      valid,
    ).get('a')!;
    expect(s.known).toBe(true);
    expect(s.stage).toBe(4);
  });
});

describe('retrievability', () => {
  test('known direkt nach Markierung hoch, sinkt mit der Zeit', () => {
    const s = replay([{ id: 'k', cardId: 'a', ts: T0, device: 'd', kind: 'known' }], valid).get('a')!;
    const r0 = retrievability(s, T0);
    const r60 = retrievability(s, T0 + 60 * DAY);
    expect(r0).toBeGreaterThan(0.99);
    expect(r60).toBeLessThan(r0);
    expect(r60).toBeCloseTo(0.9, 1);
  });

  test('neue Karte ohne Wiederholung hat 0', () => {
    const s = replay([review('1', 'a', T0, 1)], valid).get('a')!;
    expect(retrievability(s, T0 + DAY)).toBeLessThanOrEqual(1);
  });
});

describe('ratingFor', () => {
  test('Regeln', () => {
    expect(ratingFor('wrong', 1000, 2, false)).toBe(1);
    expect(ratingFor('typo', 1000, 2, false)).toBe(2);
    expect(ratingFor('accent', 1000, 4, false)).toBe(2);
    expect(ratingFor('correct', 20000, 2, false)).toBe(2);
    expect(ratingFor('correct', 3000, 2, true)).toBe(2);
    expect(ratingFor('correct', 3000, 3, false)).toBe(4);
    expect(ratingFor('correct', 3000, 2, false)).toBe(3);
    expect(ratingFor('correct', 5000, 3, false)).toBe(3);
  });
});

describe('newEvent', () => {
  test('vergibt id, ts und device', () => {
    const e = newEvent({ cardId: 'a', kind: 'known' }, 'dev', 123);
    expect(e.ts).toBe(123);
    expect(e.device).toBe('dev');
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(newEvent({ cardId: 'a', kind: 'known' }, 'dev').id).not.toBe(e.id);
  });
});

describe('heard', () => {
  const heard = (id: string, cardId: string, ts: number): ReviewEvent => ({ id, cardId, ts, device: 'd', kind: 'heard' });

  test('replay ignoriert heard-Ereignisse', () => {
    const states = replay([heard('h1', 'a', T0)], valid);
    expect(states.size).toBe(0);
  });

  test('dialogsHeard behält den spätesten Zeitpunkt', () => {
    const m = dialogsHeard([heard('h1', 'd1', T0), heard('h2', 'd1', T0 + DAY), heard('h3', 'd1', T0 - DAY), heard('h4', 'd2', T0)]);
    expect(m.get('d1')).toBe(T0 + DAY);
    expect(m.get('d2')).toBe(T0);
    expect(m.size).toBe(2);
  });

  test('newEvent nimmt heard an', () => {
    expect(newEvent({ cardId: 'd1', kind: 'heard' }, 'dev', 5).kind).toBe('heard');
  });
});
