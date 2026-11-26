import { cleanup, fireEvent, render } from '@testing-library/preact';
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

  it('zeigt je Situation das Vorschaubild als Schmuck (alt leer), der Nachweis bleibt in photos.ts', () => {
    const { container } = render(home());
    const img = container.querySelector('li.situation img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(photoFor(situation.id)?.alt.length).toBeGreaterThan(0);
  });

  it('Zeile ist der li, der h3 umschließt nur den Knopf mit dem Namen', () => {
    const { container } = render(home());
    const row = container.querySelector('li.situation')!;
    const h3 = row.querySelector('h3')!;
    expect(h3.querySelector('img')).toBeNull();
    expect(h3.children).toHaveLength(1);
    const button = h3.querySelector('button.situation-link')!;
    expect(button.textContent).toBe(situation.title);
    expect(row.querySelector('img')?.parentElement?.parentElement).toBe(row);
  });

  it('Klick auf den Knopf startet die Situation', () => {
    const onStart = vi.fn();
    const { container } = render(<Home app={fakeApp()} onStart={onStart} onDiagnose={noop} onSettings={noop} />);
    fireEvent.click(container.querySelector('li.situation button')!);
    expect(onStart).toHaveBeenCalledWith(situation.id);
  });

  it('der Knopf nennt den Satz zur Zeile als Beschreibung', () => {
    const { container } = render(home());
    const button = container.querySelector('li.situation button')!;
    const id = button.getAttribute('aria-describedby')!;
    expect(container.querySelector(`#${id}`)?.textContent).toMatch(/Dialoge/);
  });

  it('lässt bei fehlendem Foto das Bild weg und markiert die Zeile', () => {
    photos.missing.add(situation.id);
    const { container } = render(home());
    const row = container.querySelector('li.situation');
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
    const num = container.querySelector('li.situation .num');
    expect(num?.textContent).toMatch(/^\d+$/);
  });
});
