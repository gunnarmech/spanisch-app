import { describe, expect, test } from 'vitest';
import { validateClips, validateSituation } from '../../src/content/validate';

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

describe('Inhaltsformat nur verstehen', () => {
  test('grammar ohne Übung ist Fehler', () => {
    const s = base();
    s.items.push({ id: 'g-1', kind: 'grammar', title: 'G', explanation: 'x', examples: [], exercises: [] });
    expect(validateSituation(s, new Set()).some((e) => e.includes('exercises ungültig'))).toBe(true);
  });

  test('produce: true ist Fehler, produce: false gültig', () => {
    const s = base();
    s.items[0].produce = true;
    expect(validateSituation(s, new Set()).some((e) => e.includes('produce'))).toBe(true);
    s.items[0].produce = false;
    expect(validateSituation(s, new Set())).toEqual([]);
    s.items.push({ id: 'sent-1', kind: 'sentence', es: 'hola', de: 'hallo', produce: true });
    expect(validateSituation(s, new Set()).some((e) => e.includes('produce'))).toBe(true);
  });
});

describe('validateClips', () => {
  const forms = new Set(['hola', 'mesa', 'casa', 'amigo', 'bueno', 'dia', 'vamos', 'ahora', 'tengo', 'un']);
  const clip = (over: Record<string, unknown> = {}) => ({
    id: 'clip-09334-01278378087',
    es: 'hola mesa casa amigo bueno dia vamos ahora tengo un',
    de: 'x',
    gender: 'f',
    source: 'clf_09334_01278378087',
    ...over,
  });
  const run = (clips: unknown[], ids = new Set<string>()) => validateClips({ clips }, ids, forms);

  test('gültiger Clip ohne Fehler', () => {
    expect(run([clip()])).toEqual([]);
  });
  test('Deckung 0.8 abgelehnt, 0.9 angenommen', () => {
    const nine = 'hola mesa casa amigo bueno dia vamos ahora tengo';
    expect(run([clip({ es: `${nine} zzz` })])).toEqual([]);
    const eight = 'hola mesa casa amigo bueno dia vamos ahora';
    expect(run([clip({ es: `${eight} zzz yyy` })]).length).toBeGreaterThan(0);
  });
  test('Eigenname mitten im Satz zählt nicht', () => {
    expect(run([clip({ es: 'hola mesa casa Valparaíso amigo bueno dia vamos' })])).toEqual([]);
  });
  test('2 Tokens abgelehnt', () => {
    expect(run([clip({ es: 'hola mesa' })]).length).toBeGreaterThan(0);
  });
  test('ID-Kollision mit Item-ID gemeldet', () => {
    expect(run([clip()], new Set(['clip-09334-01278378087'])).some((e) => e.includes('clip-09334-01278378087'))).toBe(true);
  });
  test('doppelte Clip-ID gemeldet', () => {
    expect(run([clip(), clip()]).some((e) => e.includes('doppelte'))).toBe(true);
  });
  test('Peninsularismus und gender', () => {
    expect(run([clip({ es: 'hola mesa casa amigo coche bueno dia vamos' })]).some((e) => e.includes('Peninsularismus'))).toBe(true);
    expect(run([clip({ gender: 'x' })].map((c) => c)).some((e) => e.includes('gender'))).toBe(true);
  });
});
