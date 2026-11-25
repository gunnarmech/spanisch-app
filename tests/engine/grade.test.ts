import { describe, expect, test } from 'vitest';
import { gradeSpoken, gradeTyped, normalize } from '../../src/engine/grade';

describe('gradeTyped', () => {
  test('Satzzeichen und Gross/Klein egal', () =>
    expect(gradeTyped('donde esta el bano', ['¿Dónde está el baño?']).verdict).toBe('accent'));
  test('exakt', () => expect(gradeTyped('¿Dónde está el baño?', ['¿Dónde está el baño?']).verdict).toBe('correct'));
  test('ohne ¿ trotzdem correct', () => expect(gradeTyped('dónde está el baño', ['¿Dónde está el baño?']).verdict).toBe('correct'));
  test('ein Tippfehler', () => expect(gradeTyped('¿Dónde está el bañp?', ['¿Dónde está el baño?']).verdict).toBe('typo'));
  test('zwei Fehler sind falsch', () => expect(gradeTyped('donde esta al bamp', ['¿Dónde está el baño?']).verdict).toBe('wrong'));
  test('Alternative Form', () =>
    expect(gradeTyped('la cuenta por favor', ['La cuenta, por favor.', 'Me trae la cuenta']).verdict).toBe('correct'));
  test('leere Eingabe ist falsch', () => expect(gradeTyped('   ', ['hola']).verdict).toBe('wrong'));
  test('kurze Woerter erlauben keinen Tippfehler', () => expect(gradeTyped('sa', ['sí']).verdict).toBe('wrong'));
  test('marks zeigen abweichende Stellen der Zielform', () => {
    expect(gradeTyped('¿Dónde está el bañp?', ['¿Dónde está el baño?']).marks).toEqual([{ index: 17, length: 1 }]);
    expect(gradeTyped('donde esta el bano', ['¿Dónde está el baño?']).marks).toEqual([
      { index: 1, length: 1 },
      { index: 9, length: 1 },
      { index: 16, length: 1 },
    ]);
    expect(gradeTyped('dónde está el baño', ['¿Dónde está el baño?']).marks).toEqual([]);
  });
});

describe('gradeSpoken', () => {
  test('Sprechen tolerant', () => expect(gradeSpoken('donde esta el baño', '¿Dónde está el baño?').ok).toBe(true));
  test('Sprechen fehlendes Inhaltswort', () =>
    expect(gradeSpoken('donde esta', '¿Dónde está el baño?')).toEqual({ ok: false, missing: ['baño'] }));
  test('ein fehlendes Wort bei fuenf erlaubt', () =>
    expect(gradeSpoken('quiero una mesa para dos', 'Quiero una mesa para dos personas')).toEqual({ ok: true, missing: ['personas'] }));
});

test('normalize', () => expect(normalize('  ¡Hola,   Qué TAL?! ')).toBe('hola qué tal'));
