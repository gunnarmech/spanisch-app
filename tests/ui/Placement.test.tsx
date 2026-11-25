import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const audio = vi.hoisted(() => ({
  loadManifest: vi.fn(async (): Promise<Record<string, unknown>> => ({})),
  audioUrl: vi.fn((): string | null => null),
  play: vi.fn(async () => {}),
}));
vi.mock('../../src/media/audio', () => audio);

import type { Situation, WordItem } from '../../src/content/types';
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

describe('placementItems', () => {
  it('sortiert nach freqRank, Items ohne Rang danach in Dateireihenfolge, ohne Dialoge', () => {
    expect(placementItems([ranked]).map((p) => p.item.id)).toEqual(['w-a', 'w-b', 'w-c', 'w-d']);
  });

  it('nimmt höchstens 40', () => {
    const many: Situation = {
      id: 's3',
      order: 3,
      title: 'viele',
      items: Array.from({ length: 60 }, (_, i) => word(`w${i}`, `p${i}`, `d${i}`, i + 1)),
    };
    expect(placementItems([many])).toHaveLength(40);
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

  it('erscheint nicht, wenn placementDone gesetzt ist oder es schon Ereignisse gibt', () => {
    const settings = { device: 'd', retention: 0.9, voiceSpeedNew: 'slow' as const };
    const done = fakeApp({ settings: { ...settings, placementDone: true } });
    const { container, rerender } = render(<PlacementOffer app={done} onStart={noop} />);
    expect(container.textContent).toBe('');
    rerender(<PlacementOffer app={fakeApp({ heard: new Map([['d-1', 1]]) })} onStart={noop} />);
    expect(container.textContent).toBe('');
  });
});
