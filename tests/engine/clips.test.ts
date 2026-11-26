import { describe, expect, test } from 'vitest';
import { CHILE_SITUATION, chileUnlocked, chooseClip, clipShare } from '../../src/engine/clips';
import { replay, type ReviewEvent } from '../../src/engine/state';
import type { ChileClip, Item, Situation } from '../../src/content/types';

const T0 = Date.UTC(2026, 10, 25, 10, 0, 0);
const DAY = 86_400_000;

const word = (id: string, es: string): Item => ({ id, kind: 'word', es, de: es, forms: [es], examples: [] });
const known = (n: number, cardId: string): ReviewEvent => ({ id: `k${n}`, cardId, ts: T0, device: 'd', kind: 'known' });
const clip = (id: string, es: string): ChileClip => ({ id, es, de: '', gender: 'f', source: 's' });

const grundlagen: Situation = {
  id: '01-grundlagen',
  order: 1,
  title: 'Grundlagen',
  items: [
    word('w-hola', 'hola'),
    word('w-mesa', 'mesa'),
    { id: 'd', kind: 'dialog', title: 'D', lines: [{ speaker: 'A', es: 'hola mesa', de: '' }] },
  ],
};
const ids = new Set(['w-hola', 'w-mesa']);
const statesOf = (cards: string[]) => replay(cards.map((c, i) => known(i, c)), ids);

describe('chileUnlocked', () => {
  test('gesperrt unter 50 % Grundlagen', () => {
    expect(chileUnlocked([grundlagen], statesOf([]), T0 + 1000)).toBe(false);
  });
  test('frei ab 50 %', () => {
    expect(chileUnlocked([grundlagen], statesOf(['w-hola']), T0 + 1000)).toBe(true);
  });
  test('false ohne die Situation', () => {
    expect(chileUnlocked([{ ...grundlagen, id: 'x' }], statesOf(['w-hola']), T0)).toBe(false);
  });
  test('Pseudo-Situation', () => expect(CHILE_SITUATION).toBe('chile-echt'));
});

describe('chooseClip', () => {
  const sits = [grundlagen];
  const states = statesOf(['w-hola', 'w-mesa']);
  const NOW = T0 + 10 * DAY;

  test('kein Clip unter 0.8 Anteil', () => {
    const c = clip('c1', 'hola mesa luz sol pan');
    expect(clipShare(c, sits, states)).toBeCloseTo(0.4);
    expect(chooseClip([c], sits, states, new Map(), NOW)).toBeUndefined();
  });
  test('nie gehörter vor gehörtem', () => {
    const clips = [clip('c1', 'hola mesa'), clip('c2', 'mesa hola')];
    expect(chooseClip(clips, sits, states, new Map([['c1', NOW - 20 * DAY]]), NOW)?.id).toBe('c2');
  });
  test('höchster Anteil zuerst, Gleichstand nach Dateireihenfolge', () => {
    const clips = [clip('c1', 'hola mesa mesa hola luz'), clip('c2', 'hola mesa'), clip('c3', 'mesa hola')];
    expect(chooseClip(clips, sits, states, new Map(), NOW)?.id).toBe('c2');
  });
  test('gehörter erst nach 3 Tagen wieder', () => {
    const clips = [clip('c1', 'hola mesa'), clip('c2', 'mesa hola')];
    const recent = new Map([['c1', NOW - 2 * DAY], ['c2', NOW - 1 * DAY]]);
    expect(chooseClip(clips, sits, states, recent, NOW)).toBeUndefined();
    const old = new Map([['c1', NOW - 4 * DAY], ['c2', NOW - 5 * DAY]]);
    expect(chooseClip(clips, sits, states, old, NOW)?.id).toBe('c2');
  });
});
