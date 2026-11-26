import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const audio = vi.hoisted(() => ({
  loadManifest: vi.fn(async (): Promise<Record<string, unknown>> => ({})),
  audioUrl: vi.fn((): string | null => null),
  play: vi.fn(async () => {}),
}));
vi.mock('../../src/media/audio', () => audio);

import type { Situation, WordItem } from '../../src/content/types';
import type { CardState } from '../../src/engine/state';
import { Placement, PlacementOffer, placementItems } from '../../src/ui/Placement';
import { fakeApp } from './fixtures';

const noop = () => {};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 25, 10, 0, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const word = (id: string, es: string, de: string, freqRank?: number): WordItem => ({
  id,
  kind: 'word',
  es,
  de,
  forms: [es],
  examples: [],
  freqRank,
});

const ranked: Situation = {
  id: 's2',
  order: 2,
  title: 'Rang',
  items: [
    word('w-c', 'casa', 'Haus'),
    word('w-b', 'bien', 'gut', 20),
    { id: 'd-x', kind: 'dialog', title: 'x', lines: [] },
    word('w-a', 'agua', 'Wasser', 5),
    word('w-d', 'dos', 'zwei'),
  ],
};

const many = (n: number): Situation => ({
  id: 's3',
  order: 3,
  title: 'viele',
  items: Array.from({ length: n }, (_, i) => word(`w${i}`, `p${i}`, `d${String(i).padStart(3, '0')}`, i + 1)),
});

/** Beantwortet die aktuelle Frage (Spanisch steht im Text, Deutsch ist `d` plus die gleiche Nummer) und geht weiter. */
function answer(right: boolean) {
  const n = Number(screen.getByText(/^p\d+$/).textContent!.slice(1));
  const rightDe = `d${String(n).padStart(3, '0')}`;
  const options = screen.getAllByRole('button', { name: /^\d/ });
  const pick = options.find((b) => (b.textContent ?? '').includes(rightDe) === right)!;
  fireEvent.click(pick);
  fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
}

describe('placementItems', () => {
  it('sortiert nach freqRank, Items ohne Rang danach in Dateireihenfolge, ohne Dialoge', () => {
    expect(placementItems([ranked], new Map()).map((p) => p.item.id)).toEqual(['w-a', 'w-b', 'w-c', 'w-d']);
  });

  it('bietet nur Items ohne Lernstand an', () => {
    const states = new Map([['w-a', {} as CardState]]);
    expect(placementItems([ranked], states).map((p) => p.item.id)).toEqual(['w-b', 'w-c', 'w-d']);
  });

  it('ohne Chile-Ebene und ohne produce false', () => {
    const chile: Situation = { id: '09-chile', order: 9, title: 'Chile', items: [word('w-ch', 'fome', 'langweilig', 1)] };
    const only: Situation = {
      id: 's5',
      order: 5,
      title: 'nur verstehen',
      items: [{ ...word('w-v', 'weon', 'Kerl', 2), produce: false }, word('w-ok', 'bien', 'gut', 3)],
    };
    expect(placementItems([chile, only], new Map()).map((p) => p.item.id)).toEqual(['w-ok']);
  });

  it('höchstens 150', () => {
    expect(placementItems([many(200)], new Map())).toHaveLength(150);
    expect(placementItems([many(200)], new Map(), 10)).toHaveLength(10);
  });
});

describe('Placement', () => {
  it('richtige schnelle Antwort erzeugt known, falsche nichts', () => {
    const app = fakeApp();
    render(<Placement app={app} onFinish={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /hallo/ }));
    expect(app.record).toHaveBeenCalledWith({ kind: 'known', cardId: 'w-hola' });
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: /hallo/ }));
    expect(app.record).toHaveBeenCalledTimes(1);
  });

  it('richtige, aber langsame Antwort erzeugt nichts', () => {
    const app = fakeApp();
    render(<Placement app={app} onFinish={noop} />);
    vi.setSystemTime(new Date(2026, 10, 25, 10, 0, 5));
    fireEvent.click(screen.getByRole('button', { name: /hallo/ }));
    expect(app.record).not.toHaveBeenCalled();
  });

  it('Abbruch setzt placementDone und ruft onFinish ohne Ereignis', async () => {
    const app = fakeApp();
    const onFinish = vi.fn();
    render(<Placement app={app} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole('button', { name: 'Beenden' }));
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(app.updateSettings).toHaveBeenCalledWith({ placementDone: true });
    expect(app.record).not.toHaveBeenCalled();
  });

  it('nach der letzten Frage ist die Einstufung beendet', async () => {
    const app = fakeApp();
    const onFinish = vi.fn();
    render(<Placement app={app} onFinish={onFinish} />);
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /^\d/ })[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    }
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(app.updateSettings).toHaveBeenCalledWith({ placementDone: true });
  });

  it('mit Ton wird der Text nicht gezeigt, nur der Hörknopf', async () => {
    audio.loadManifest.mockResolvedValue({ 'w-hola': [{ voice: 'cl-f', speed: 'slow' }] });
    audio.audioUrl.mockReturnValue('/a.mp3');
    render(<Placement app={fakeApp()} onFinish={noop} />);
    await screen.findByRole('button', { name: 'Anhören' });
    expect(screen.queryByText('hola')).toBeNull();
    audio.loadManifest.mockResolvedValue({});
    audio.audioUrl.mockReturnValue(null);
  });
});

describe('Placement in Blöcken', () => {
  const big = () => fakeApp({ situations: [many(100)] });

  it('nach 30 Fragen Zwischenstand mit weiter und aufhören', () => {
    render(<Placement app={big()} onFinish={noop} />);
    for (let i = 0; i < 30; i++) answer(true);
    expect(screen.getByRole('heading', { name: 'Zwischenstand' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'weiter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'aufhören' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'weiter' }));
    expect(screen.queryByRole('heading', { name: 'Zwischenstand' })).toBeNull();
    expect(screen.getByText('Was bedeutet das?')).toBeTruthy();
  });

  it('weniger als ein Viertel richtig im Block beendet den Test', async () => {
    const onFinish = vi.fn();
    const app = big();
    render(<Placement app={app} onFinish={onFinish} />);
    for (let i = 0; i < 30; i++) answer(i < 7);
    expect(screen.getByText('Hier reicht es. Der Rest kommt beim normalen Lernen.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'weiter' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'fertig' }));
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(app.updateSettings).toHaveBeenCalledWith({ placementDone: true });
  });

  it('genau ein Viertel richtig lässt den Test weiterlaufen', () => {
    render(<Placement app={big()} onFinish={noop} />);
    for (let i = 0; i < 30; i++) answer(i < 8);
    expect(screen.getByRole('button', { name: 'weiter' })).toBeTruthy();
  });

  it('aufhören behält bisherige known-Ereignisse', async () => {
    const onFinish = vi.fn();
    const app = big();
    render(<Placement app={app} onFinish={onFinish} />);
    for (let i = 0; i < 30; i++) answer(true);
    fireEvent.click(screen.getByRole('button', { name: 'aufhören' }));
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(app.record).toHaveBeenCalledTimes(30);
    expect(app.updateSettings).toHaveBeenCalledWith({ placementDone: true });
  });

  it('kein Text "von" mit Zahlen im Einstufungsbildschirm', () => {
    const { container } = render(<Placement app={big()} onFinish={noop} />);
    expect(container.textContent).not.toMatch(/\d+\s*von\s*\d+/);
    expect(container.textContent).not.toMatch(/Frage\s*\d/);
    for (let i = 0; i < 30; i++) answer(true);
    expect(container.textContent).not.toMatch(/\d+\s*von\s*\d+/);
    expect(container.textContent).not.toMatch(/\d/);
  });
});

describe('PlacementOffer', () => {
  it('Überspringen erzeugt kein Ereignis und merkt sich das', () => {
    const app = fakeApp();
    render(<PlacementOffer app={app} onStart={noop} />);
    fireEvent.click(screen.getByRole('button', { name: 'überspringen' }));
    expect(app.updateSettings).toHaveBeenCalledWith({ placementDone: true });
    expect(app.record).not.toHaveBeenCalled();
  });

  it('"kurz einstufen" startet die Einstufung', () => {
    const onStart = vi.fn();
    render(<PlacementOffer app={fakeApp()} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: 'kurz einstufen' }));
    expect(onStart).toHaveBeenCalled();
  });

  it('nennt Blöcke im Angebotstext', () => {
    render(<PlacementOffer app={fakeApp()} onStart={noop} />);
    expect(
      screen.getByText('Mit kurzen Fragen in Blöcken merkt sich die App, was du schon kannst, und fragt es später nicht mehr als Neues ab.'),
    ).toBeTruthy();
  });

  it('erscheint nicht, wenn placementDone gesetzt ist oder es schon Ereignisse gibt', () => {
    const settings = { device: 'd', retention: 0.9, voiceSpeedNew: 'slow' as const };
    const done = fakeApp({ settings: { ...settings, placementDone: true } });
    const { container, rerender } = render(<PlacementOffer app={done} onStart={noop} />);
    expect(container.textContent).toBe('');
    rerender(<PlacementOffer app={fakeApp({ heard: new Map([['d-1', 1]]) })} onStart={noop} />);
    expect(container.textContent).toBe('');
  });
});
