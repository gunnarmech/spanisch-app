import { cleanup, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

const photos = vi.hoisted(() => ({ missing: new Set<string>() }));
vi.mock('../../src/ui/photos', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/ui/photos')>();
  return { ...real, photoFor: (id: string) => (photos.missing.has(id) ? null : real.photoFor(id) ?? real.allPhotos[1]) };
});

import { headerPhoto, photoFor } from '../../src/ui/photos';
import { Home } from '../../src/ui/Home';
import { fakeApp, situation } from './fixtures';

afterEach(() => {
  cleanup();
  photos.missing.clear();
});

const noop = () => {};
const home = (app = fakeApp()) => (
  <Home app={app} onStart={noop} onDiagnose={noop} onSettings={noop} onProgress={noop} onPlacement={noop} />
);

describe('Startseite', () => {
  // Muss der erste Render in dieser Datei bleiben: das Flag gilt je App-Start.
  it('spielt den Eintritt nur beim ersten Rendern', () => {
    const first = render(home());
    expect(first.container.querySelector('section.hero')?.getAttribute('data-enter')).toBe('');
    cleanup();
    const second = render(home());
    expect(second.container.querySelector('section.hero')?.getAttribute('data-enter')).toBe('off');
  });

  it('zeigt das Kopffoto mit seinem Alt-Text', () => {
    const { container } = render(home());
    const img = container.querySelector('section.hero img[data-enter-media]');
    expect(img?.getAttribute('alt')).toBe(headerPhoto.alt);
  });

  it('zeigt je Situation das Foto mit Alt-Text aus photoFor', () => {
    const { container } = render(home());
    const img = container.querySelector('button.situation img');
    expect(img?.getAttribute('alt')).toBe(photoFor(situation.id)?.alt);
  });

  it('lässt bei fehlendem Foto das Bild weg und markiert die Zeile', () => {
    photos.missing.add(situation.id);
    const { container } = render(home());
    const row = container.querySelector('button.situation');
    expect(row?.querySelector('img')).toBeNull();
    expect(row?.classList.contains('situation--ohne-bild')).toBe(true);
  });

  it('lässt den Eintritt beim Laden der Daten stehen', async () => {
    vi.resetModules(); // frisches Modul-Flag, als wäre es ein neuer App-Start
    const { Home: Fresh } = await import('../../src/ui/Home');
    const page = (app: ReturnType<typeof fakeApp> | null) => (
      <Fresh app={app} onStart={noop} onDiagnose={noop} onSettings={noop} onProgress={noop} onPlacement={noop} />
    );
    const view = render(page(null));
    expect(view.container.querySelector('section.hero')?.getAttribute('data-enter')).toBe('');
    view.rerender(page(fakeApp()));
    expect(view.container.querySelector('section.hero')?.getAttribute('data-enter')).toBe('');
  });

  it('setzt die Prozentzahl in ein num-Element', () => {
    const { container } = render(home());
    const num = container.querySelector('button.situation .num');
    expect(num?.textContent).toMatch(/^\d+$/);
  });
});
