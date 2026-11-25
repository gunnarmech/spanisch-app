import type { Situation } from './types';

/** Alle Situationen aus content/situations, sortiert nach order. Gültigkeit prüft npm run check:content. */
export function loadSituations(): Situation[] {
  const modules = import.meta.glob('/content/situations/*.json', { eager: true, import: 'default' }) as Record<
    string,
    Situation
  >;
  return Object.values(modules).sort((a, b) => a.order - b.order);
}
