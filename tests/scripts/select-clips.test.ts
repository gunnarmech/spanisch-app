// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { cleanText, clipFromSource, selectCandidates } from '../../scripts/select_clips';

const forms = new Set(['hola', 'me', 'gusta', 'mucho', 'el', 'café', 'tranquilo', 'va', 'a', 'estar', 'todo', 'bien']);
const ids = new Set<string>();

describe('select_clips', () => {
  test('ID und Geschlecht aus der Datei-ID', () => {
    expect(clipFromSource('clf_09334_01278378087')).toEqual({ id: 'clip-09334-01278378087', gender: 'f' });
    expect(clipFromSource('clm_1_2')).toEqual({ id: 'clip-1-2', gender: 'm' });
    expect(clipFromSource('xx_1_2')).toBeNull();
  });

  test('Text wird von Leerzeichen vor Satzzeichen befreit', () => {
    expect(cleanText(' Está  muy cansado ?')).toBe('Está muy cansado?');
  });

  test('filtert nach Deckung und Länge, entfernt Dubletten, wechselt f und m ab', () => {
    const rows = [
      { source: 'clf_1_1', text: 'Me gusta mucho el café' },
      { source: 'clm_2_2', text: 'Me gusta mucho el café' },
      { source: 'clf_3_3', text: 'Tranquilo va a estar todo bien' },
      { source: 'clm_4_4', text: 'Tranquilo va a estar todo bien' },
      { source: 'clf_5_5', text: 'Hola' }, // zu kurz
      { source: 'clf_6_6', text: 'Me gusta mucho la política internacional actual' }, // Deckung
    ];
    const out = selectCandidates(rows, ids, forms);
    expect(out.map((c) => c.es)).toEqual(['Me gusta mucho el café', 'Tranquilo va a estar todo bien']);
    expect(out.map((c) => c.gender).sort()).toEqual(['f', 'm']);
  });
});
