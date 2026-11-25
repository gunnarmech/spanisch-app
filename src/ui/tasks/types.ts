import type { GradeResult } from '../../engine/grade';
import type { Task } from '../../engine/round';
import type { Item } from '../../content/types';

export type TaskResult =
  | { verdict: GradeResult['verdict']; ms: number; usedHint: boolean }
  | { known: true };

export type TaskProps = { task: Task; item: Item; onDone(result: TaskResult): void };

/** Spanisch, Deutsch und akzeptierte Varianten für Wort, Wendung und Satz. */
export function textOf(item: Item): { es: string; de: string; accept: string[] } | null {
  if (item.kind === 'word' || item.kind === 'phrase' || item.kind === 'sentence') {
    return { es: item.es, de: item.de, accept: item.accept ?? [] };
  }
  return null;
}
