import { describe, expect, test } from 'vitest';
import { isSure, situationCoverage } from '../../src/engine/coverage';
import { replay, type ReviewEvent } from '../../src/engine/state';
import type { Situation } from '../../src/content/types';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 25, 10, 0, 0);

const situation: Situation = {
  id: 's',
  order: 1,
  title: 'S',
  items: [
    { id: 'w-hola', kind: 'word', es: 'hola', de: 'hallo', forms: ['hola'], examples: [] },
    { id: 'w-mesa', kind: 'word', es: 'mesa', de: 'Tisch', forms: ['mesa'], examples: [] },
    {
      id: 'd',
      kind: 'dialog',
      title: 'D',
      lines: [
        { speaker: 'A', es: 'Hola', de: 'Hallo' },
        { speaker: 'B', es: 'Mesa', de: 'Tisch' },
      ],
    },
  ],
};

function known(id: string, cardId: string): ReviewEvent {
  return { id, cardId, ts: T0, device: 'd', kind: 'known' };
}

function rev(id: string, cardId: string, ts: number, rating: 1 | 2 | 3 | 4): ReviewEvent {
  return { id, cardId, ts, device: 'd', kind: 'review', rating, stage: 0 };
}

describe('situationCoverage', () => {
  test('Abdeckung 0.5 wenn Hälfte bekannt', () => {
    const states = replay([known('1', 'w-hola')], new Set(['w-hola', 'w-mesa']));
    expect(situationCoverage(situation, states, T0 + 1000)).toBe(0.5);
  });

  test('Abdeckung 0 ohne Lernstand und 1 bei allem bekannt', () => {
    expect(situationCoverage(situation, new Map(), T0)).toBe(0);
    const states = replay([known('1', 'w-hola'), known('2', 'w-mesa')], new Set(['w-hola', 'w-mesa']));
    expect(situationCoverage(situation, states, T0 + 1000)).toBe(1);
  });

  test('frisch gelernte Karte mit hoher Abrufwahrscheinlichkeit zählt', () => {
    const ev: ReviewEvent = { id: '1', cardId: 'w-hola', ts: T0, device: 'd', kind: 'review', rating: 4, stage: 0 };
    const ev2: ReviewEvent = { ...ev, id: '2', ts: T0 + DAY };
    const states = replay([ev, ev2], new Set(['w-hola']));
    expect(situationCoverage(situation, states, T0 + DAY + 1000)).toBe(0.5);
  });

  test('entfernte ID im Lernstand bricht nichts', () => {
    const states = replay([known('1', 'w-hola'), known('2', 'w-alt')], new Set(['w-hola', 'w-alt']));
    expect(situationCoverage(situation, states, T0 + 1000)).toBe(0.5);
  });

  test('Situation ohne Dialog liefert 0', () => {
    expect(situationCoverage({ ...situation, items: [situation.items[0]] }, new Map(), T0)).toBe(0);
  });

  test('Wort aus anderer Situation zählt, wenn all übergeben wird', () => {
    const earlier: Situation = { id: 'e', order: 0, title: 'E', items: [situation.items[0]] };
    const later: Situation = { ...situation, id: 'l', items: [situation.items[1], situation.items[2]] };
    const states = replay([known('1', 'w-hola'), known('2', 'w-mesa')], new Set(['w-hola', 'w-mesa']));
    expect(situationCoverage(later, states, T0 + 1000)).toBe(0.5);
    expect(situationCoverage(later, states, T0 + 1000, [earlier, later])).toBe(1);
  });

  test('isSure: direkt nach einer Bewertung nicht sicher', () => {
    const s = replay([rev('1', 'w-hola', T0, 3)], new Set(['w-hola'])).get('w-hola')!;
    expect(isSure(s, T0 + 60_000)).toBe(false);
  });

  test('isSure: nach verteilter Wiederholung sicher, solange R über 0,8', () => {
    const s = replay([rev('1', 'w-hola', T0, 3), rev('2', 'w-hola', T0 + DAY, 3)], new Set(['w-hola'])).get('w-hola')!;
    expect(isSure(s, T0 + DAY + 60_000)).toBe(true);
    expect(isSure(s, T0 + 400 * DAY)).toBe(false);
  });

  test('situationCoverage ändert sich durch eine einzelne Bewertung nicht', () => {
    const ids = new Set(['w-hola', 'w-mesa']);
    const vorher = situationCoverage(situation, replay([], ids), T0 + 1000);
    const nachher = situationCoverage(situation, replay([rev('1', 'w-hola', T0, 3)], ids), T0 + 1000);
    expect(vorher).toBe(0);
    expect(nachher).toBe(0);
  });
});

