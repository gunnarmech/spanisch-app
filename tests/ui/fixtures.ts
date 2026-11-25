import { vi } from 'vitest';
import type { Situation } from '../../src/content/types';
import type { AppState } from '../../src/ui/useAppState';

export const situation: Situation = {
  id: 's1',
  order: 1,
  title: 'Grundlagen',
  items: [
    { id: 'w-hola', kind: 'word', es: 'hola', de: 'hallo', forms: ['hola'], examples: [{ es: 'Hola.', de: 'Hallo.' }] },
    {
      id: 'w-adios',
      kind: 'word',
      es: 'adiós',
      de: 'auf Wiedersehen',
      forms: ['adiós'],
      examples: [{ es: 'Adiós.', de: 'Tschüss.' }],
    },
    { id: 'd-1', kind: 'dialog', title: 'Gruß', lines: [{ speaker: 'A', es: 'Hola', de: 'Hallo' }] },
  ],
};

export function fakeApp(over: Partial<AppState> = {}): AppState & { record: ReturnType<typeof vi.fn> } {
  return {
    situations: [situation],
    states: new Map(),
    heard: new Map(),
    settings: { device: 'test', retention: 0.9, voiceSpeedNew: 'slow' },
    record: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
    report: vi.fn(async () => {}),
    ...over,
  } as AppState & { record: ReturnType<typeof vi.fn> };
}
