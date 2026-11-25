import { retrievability, type CardState } from './state';
import { tokens } from '../content/validate';
import type { Situation, WordItem } from '../content/types';

const KNOWN_THRESHOLD = 0.8;

function isSure(s: CardState | undefined, now: number): boolean {
  return !!s && (s.known || retrievability(s, now) > KNOWN_THRESHOLD);
}

/**
 * Anteil der Dialog-Tokens (je Vorkommen), deren Wort-Item sicher bekannt ist (0 bis 1).
 * Wort-Items zählen aus allen übergebenen Situationen (all, Standard nur s), da Dialoge frühere Wörter nutzen.
 * Lernstände zu Karten, die es nicht mehr gibt, werden nie nachgeschlagen und stören nicht.
 * Ohne Dialog oder ohne Tokens ist das Ergebnis 0.
 */
export function situationCoverage(
  s: Situation,
  states: Map<string, CardState>,
  now: number,
  all: Situation[] = [s],
): number {
  const sure = new Set<string>();
  for (const sit of all) {
    for (const item of sit.items) {
      if (item.kind !== 'word' && item.kind !== 'phrase') continue;
      if (!isSure(states.get(item.id), now)) continue;
      for (const f of (item as WordItem).forms) for (const t of tokens(f)) sure.add(t);
    }
  }

  let total = 0;
  let hit = 0;
  for (const item of s.items) {
    if (item.kind !== 'dialog') continue;
    for (const line of item.lines) {
      for (const t of tokens(line.es)) {
        total++;
        if (sure.has(t)) hit++;
      }
    }
  }
  return total === 0 ? 0 : hit / total;
}
