import { describe, expect, test } from 'vitest';
import { validateSituation } from '../../src/content/validate';

function word(id: string, es: string, forms: string[]) {
  return { id, kind: 'word', es, de: 'x', forms, examples: [{ es: 'a', de: 'b' }] };
}

function base(): any {
  return {
    id: 'test',
    order: 1,
    title: 'Test',
    items: [
      word('w-hola', 'hola', ['hola']),
      word('w-mesa', 'mesa', ['mesa']),
      {
        id: 'd-1',
        kind: 'dialog',
        title: 'Dialog',
        lines: [
          { speaker: 'A', es: 'Hola', de: 'Hallo' },
          { speaker: 'B', es: 'Hola', de: 'Hallo' },
          { speaker: 'A', es: 'Mesa', de: 'Tisch' },
          { speaker: 'B', es: 'Mesa', de: 'Tisch' },
        ],
      },
    ],
  };
}

describe('validateSituation', () => {
  test('gültige Situation ohne Fehler', () => {
    expect(validateSituation(base(), new Set())).toEqual([]);
  });

  test('doppelte ID wird gemeldet', () => {
    const errors = validateSituation(base(), new Set(['w-hola']));
    expect(errors.some((e) => e.includes('w-hola'))).toBe(true);
  });

  test('doppelte ID innerhalb einer Situation wird gemeldet', () => {
    const s = base();
    s.items.push(word('w-mesa', 'mesa', ['mesa']));
    expect(validateSituation(s, new Set()).some((e) => e.includes('w-mesa'))).toBe(true);
  });

  test('Dialogwort ohne Wort-Item wird gemeldet', () => {
    const s = base();
    s.items[2].lines[0].es = 'Hola, ¿dónde?';
    const errors = validateSituation(s, new Set());
    expect(errors.some((e) => e.includes('dónde'))).toBe(true);
  });

  test('Dialogwort aus fremder Situation zählt über knownForms', () => {
    const s = base();
    s.items[2].lines[0].es = 'Hola, ¿dónde?';
    expect(validateSituation(s, new Set(), new Set(['hola', 'mesa', 'dónde']))).toEqual([]);
  });

  test('Peninsularismus wird gemeldet', () => {
    const s = base();
    s.items[0].examples = [{ es: '¿Tenéis mesa?', de: 'Habt ihr einen Tisch?' }];
    const errors = validateSituation(s, new Set());
    expect(errors.some((e) => e.includes('teneis'))).toBe(true);
  });

  test('nos ist kein Treffer für os', () => {
    const s = base();
    s.items[0].examples = [{ es: 'Nos vemos', de: 'Bis bald' }];
    expect(validateSituation(s, new Set())).toEqual([]);
  });

  test('ungültige ID-Form wird gemeldet', () => {
    const s = base();
    s.items[0].id = 'W Hola';
    expect(validateSituation(s, new Set()).length).toBeGreaterThan(0);
  });

  test('Pflichtfeld fehlt', () => {
    const s = base();
    delete s.items[1].de;
    expect(validateSituation(s, new Set()).some((e) => e.includes('w-mesa'))).toBe(true);
  });

  test('Dialog mit zu wenigen Zeilen', () => {
    const s = base();
    s.items[2].lines = s.items[2].lines.slice(0, 3);
    expect(validateSituation(s, new Set()).length).toBeGreaterThan(0);
  });

  test('Grammatik-Erklärung über 600 Zeichen', () => {
    const s = base();
    s.items.push({
      id: 'g-1',
      kind: 'grammar',
      title: 'G',
      explanation: 'x'.repeat(601),
      examples: [{ es: 'a', de: 'b' }],
      exercises: [{ de: 'a', es: 'b' }],
    });
    expect(validateSituation(s, new Set()).some((e) => e.includes('g-1'))).toBe(true);
  });

  test('pair.options muss es enthalten und 2 bis 4 Einträge haben', () => {
    const s = base();
    s.items.push({ id: 'p-1', kind: 'pair', es: 'hola', options: ['hola', 'hora'] });
    expect(validateSituation(s, new Set())).toEqual([]);
    s.items[3] = { id: 'p-1', kind: 'pair', es: 'hola', options: ['hora', 'sola'] };
    expect(validateSituation(s, new Set()).some((e) => e.includes('p-1'))).toBe(true);
    s.items[3] = { id: 'p-1', kind: 'pair', es: 'hola', options: ['hola'] };
    expect(validateSituation(s, new Set()).some((e) => e.includes('p-1'))).toBe(true);
  });

  test('kein Objekt als Situation', () => {
    expect(validateSituation(null, new Set()).length).toBeGreaterThan(0);
  });
});
