// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import type { Item, Situation } from '../../src/content/types';

const contentDir = 'content/situations';
const audioDir = 'public/audio';

/** Schlüssel wie in scripts/tts.py: Item-ID, Beispiele, Dialogzeilen, Übungen, Paaroptionen. */
function keysOf(item: Item): string[] {
  switch (item.kind) {
    case 'word':
    case 'phrase':
      return [item.id, ...item.examples.map((_, n) => `${item.id}-ex${n + 1}`)];
    case 'sentence':
      return [item.id];
    case 'dialog':
      return item.lines.map((_, n) => `${item.id}-${n + 1}`);
    case 'grammar':
      return [
        ...item.examples.map((_, n) => `${item.id}-ex${n + 1}`),
        ...item.exercises.map((_, n) => `${item.id}-${n + 1}`),
      ];
    case 'pair':
      return [item.id, ...item.options.map((_, n) => `${item.id}-opt${n + 1}`)];
  }
}

const files = readdirSync(contentDir).filter((f) => f.endsWith('.json')).sort();

describe('Audio-Manifest', () => {
  test('es gibt Situationsdateien', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const situation = JSON.parse(readFileSync(join(contentDir, file), 'utf8')) as Situation;

    test(`${situation.id}: jeder Schlüssel hat einen Manifest-Eintrag mit vorhandener Datei`, () => {
      const manifestPath = join(audioDir, situation.id, 'manifest.json');
      expect(existsSync(manifestPath), `${manifestPath} fehlt`).toBe(true);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { voice: string; speed: string }[]>;
      const missing: string[] = [];
      for (const item of situation.items) {
        for (const key of keysOf(item)) {
          const entries = manifest[key];
          if (!entries || entries.length === 0) {
            missing.push(key);
            continue;
          }
          for (const e of entries) {
            if (!existsSync(join(audioDir, situation.id, `${key}-${e.voice}-${e.speed}.mp3`))) {
              missing.push(`${key}-${e.voice}-${e.speed}.mp3`);
            }
          }
        }
      }
      expect(missing).toEqual([]);
    });
  }
});

describe('Audio-Cache', () => {
  const manifests = readdirSync(audioDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(audioDir, d.name, 'manifest.json')))
    .map((d) => JSON.parse(readFileSync(join(audioDir, d.name, 'manifest.json'), 'utf8')) as Record<string, unknown[]>);

  test('Dateien aller Manifeste belegen höchstens 80 % von maxEntries', () => {
    const cfg = readFileSync('vite.config.ts', 'utf8');
    const max = Number(/maxEntries:\s*(\d+)/.exec(cfg)?.[1]);
    expect(max).toBeGreaterThan(0);
    const files = manifests.reduce((n, m) => n + Object.values(m).reduce((k, e) => k + e.length, 0), 0);
    expect(files).toBeLessThanOrEqual(max * 0.8);
  });

  const clipFile = 'content/chile-hoeren.json';
  test.skipIf(!existsSync(clipFile))('jeder Clip aus content/chile-hoeren.json hat Eintrag und Datei in chile-echt', () => {
    const { clips } = JSON.parse(readFileSync(clipFile, 'utf8')) as { clips: { id: string }[] };
    const dir = join(audioDir, 'chile-echt');
    const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Record<string, { voice: string; speed: string }[]>;
    const missing: string[] = [];
    for (const c of clips) {
      const entries = manifest[c.id] ?? [];
      if (entries.length === 0) missing.push(c.id);
      for (const e of entries) {
        if (!existsSync(join(dir, `${c.id}-${e.voice}-${e.speed}.mp3`))) missing.push(`${c.id}-${e.voice}-${e.speed}.mp3`);
      }
    }
    expect(missing).toEqual([]);
  });
});
