import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { loadSituations } from '../../src/content/load';
import { allPhotos, headerPhoto, photoFor } from '../../src/ui/photos';

const base = import.meta.env.BASE_URL;

function fileOf(src: string): string {
  expect(src.startsWith(`${base}photos/`)).toBe(true);
  return path.join(process.cwd(), 'public', src.slice(base.length));
}

test('jede Situation aus content hat ein Foto mit deutschem Alt-Text', () => {
  for (const s of loadSituations()) {
    const photo = photoFor(s.id);
    expect(photo, s.id).not.toBeNull();
    expect(photo!.alt.length).toBeGreaterThan(10);
  }
});

test('Café liefert ein Foto, eine unbekannte Situation null', () => {
  const cafe = loadSituations().find((s) => s.title.toLowerCase().includes('caf'));
  expect(cafe).toBeTruthy();
  expect(photoFor(cafe!.id)?.alt).toBeTruthy();
  expect(photoFor('gibt-es-nicht')).toBeNull();
});

test('jedes Foto hat Urheber, Lizenz und Seite, und alle Dateien liegen in public/photos', () => {
  expect(allPhotos).toContain(headerPhoto);
  expect(allPhotos.length).toBe(5);
  for (const p of allPhotos) {
    expect(p.author).not.toBe('');
    expect(p.license).not.toBe('');
    expect(p.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by(-sa)?\/\d\.\d\/deed\.de$/);
    expect(p.edit).toContain('zugeschnitten');
    expect(p.page.startsWith('https://commons.wikimedia.org/wiki/File:')).toBe(true);
    expect(existsSync(fileOf(p.src)), p.src).toBe(true);
    for (const part of (p.srcset ?? '').split(',').filter(Boolean)) {
      expect(existsSync(fileOf(part.trim().split(' ')[0])), part).toBe(true);
    }
    expect(p.width).toBeGreaterThan(0);
    expect(p.height).toBeGreaterThan(0);
  }
});

test('das Kopffoto bietet 800 und 1280 Pixel an', () => {
  expect(headerPhoto.srcset).toMatch(/kopf-800\.webp 800w/);
  expect(headerPhoto.srcset).toMatch(/kopf-1280\.webp 1280w/);
});
