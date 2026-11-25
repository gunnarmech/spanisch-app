import { describe, expect, test } from 'vitest';
import { situationCoverage } from '../../src/engine/coverage';
import { replay, type ReviewEvent } from '../../src/engine/state';
import type { Situation } from '../../src/content/types';

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
    const states = replay([ev], new Set(['w-hola']));
    expect(situationCoverage(situation, states, T0 + 1000)).toBe(0.5);
  });

  test('entfernte ID im Lernstand bricht nichts', () => {
    const states = replay([known('1', 'w-hola'), known('2', 'w-alt')], new Set(['w-hola', 'w-alt']));
    expect(situationCoverage(situation, states, T0 + 1000)).toBe(0.5);
  });

  test('Situation ohne Dialog liefert 0', () => {
    expect(situationCoverage({ ...situation, items: [situation.items[0]] }, new Map(), T0)).toBe(0);
  });
});
