import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const speech = vi.hoisted(() => ({
  speechSupported: vi.fn(() => true),
  recognize: vi.fn(async (): Promise<string | null> => null),
  recordClip: vi.fn(async (): Promise<Blob | null> => null),
}));
vi.mock('../../src/media/speech', () => speech);
const audio = vi.hoisted(() => ({
  loadManifest: vi.fn(async () => ({ 'w-hola': [{ voice: 'cl-m', speed: 'normal' }] })),
  audioUrl: vi.fn((): string | null => '/spanisch-app/audio/01-grundlagen/w-hola-cl-m-normal.mp3'),
}));
vi.mock('../../src/media/audio', () => audio);

import { Diagnose } from '../../src/ui/Diagnose';

const rows = ['Spracherkennung', 'Anzeige als App', 'Ton-Test', 'Mikrofon-Test', 'Erkennungs-Test', 'Speicher'];

function stubAudio(play: () => Promise<void>) {
  vi.stubGlobal(
    'Audio',
    class {
      play = play;
      constructor(public src: string) {}
    },
  );
}

beforeEach(() => {
  speech.speechSupported.mockReturnValue(true);
  speech.recognize.mockResolvedValue(null);
  speech.recordClip.mockResolvedValue(null);
  stubAudio(async () => {});
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }));
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { estimate: async () => ({ usage: 5 * 1024 * 1024, quota: 100 * 1024 * 1024 }) },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const row = (label: string) => screen.getByText(label).closest('li') as HTMLElement;

describe('Diagnose', () => {
  it('zeigt alle sechs Prüfzeilen', async () => {
    render(<Diagnose onBack={() => {}} />);
    for (const label of rows) expect(screen.getByText(label)).toBeTruthy();
    await waitFor(() => expect(row('Speicher').textContent).toContain('5 MB von 100 MB'));
  });

  it('zeigt Spracherkennung und Anzeigemodus', () => {
    speech.speechSupported.mockReturnValue(false);
    render(<Diagnose onBack={() => {}} />);
    expect(row('Spracherkennung').textContent).toContain('nein');
    expect(row('Anzeige als App').textContent).toContain('nein');
  });

  it('erkennt den Standalone-Modus', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    render(<Diagnose onBack={() => {}} />);
    expect(row('Anzeige als App').textContent).toContain('ja');
  });

  it('Speicher unbekannt ohne storage.estimate', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
    render(<Diagnose onBack={() => {}} />);
    await waitFor(() => expect(row('Speicher').textContent).toContain('unbekannt'));
  });

  it('Ton-Test zeigt läuft', async () => {
    render(<Diagnose onBack={() => {}} />);
    fireEvent.click(within('Ton-Test'));
    await waitFor(() => expect(row('Ton-Test').textContent).toContain('läuft'));
  });

  it('Ton-Test zeigt den Fehlernamen', async () => {
    stubAudio(async () => {
      throw new DOMException('blocked', 'NotAllowedError');
    });
    render(<Diagnose onBack={() => {}} />);
    fireEvent.click(within('Ton-Test'));
    await waitFor(() => expect(row('Ton-Test').textContent).toContain('NotAllowedError'));
  });

  it('Mikrofon-Test zeigt Größe oder nicht verfügbar', async () => {
    speech.recordClip.mockResolvedValue(new Blob([new Uint8Array(3072)]));
    render(<Diagnose onBack={() => {}} />);
    fireEvent.click(within('Mikrofon-Test'));
    await waitFor(() => expect(row('Mikrofon-Test').textContent).toContain('ok, 3 KB'));
    expect(speech.recordClip).toHaveBeenCalledWith(2000);

    speech.recordClip.mockResolvedValue(null);
    fireEvent.click(within('Mikrofon-Test'));
    await waitFor(() => expect(row('Mikrofon-Test').textContent).toContain('nicht verfügbar'));
  });

  it('Erkennungs-Test zeigt Text oder keine Erkennung', async () => {
    speech.recognize.mockResolvedValue('hola');
    render(<Diagnose onBack={() => {}} />);
    fireEvent.click(within('Erkennungs-Test'));
    await waitFor(() => expect(row('Erkennungs-Test').textContent).toContain('hola'));

    speech.recognize.mockResolvedValue(null);
    fireEvent.click(within('Erkennungs-Test'));
    await waitFor(() => expect(row('Erkennungs-Test').textContent).toContain('keine Erkennung'));
  });

  it('färbt nach Ergebnis, nicht nach Text: erkanntes "nein" bleibt neutral', async () => {
    speech.recognize.mockResolvedValue('nein');
    render(<Diagnose onBack={() => {}} />);
    const result = (label: string) => row(label).querySelector('.result') as HTMLElement;
    fireEvent.click(within('Erkennungs-Test'));
    await waitFor(() => expect(result('Erkennungs-Test').textContent).toBe('nein'));
    expect(result('Erkennungs-Test').className).not.toContain('bad');
    expect(result('Erkennungs-Test').className).not.toContain('good');

    speech.recognize.mockResolvedValue(null);
    fireEvent.click(within('Erkennungs-Test'));
    await waitFor(() => expect(result('Erkennungs-Test').className).toContain('bad'));

    fireEvent.click(within('Ton-Test'));
    await waitFor(() => expect(result('Ton-Test').className).toContain('good'));
    expect(result('Spracherkennung').className).toContain('good');
  });

  it('Zurück ruft onBack', () => {
    const onBack = vi.fn();
    render(<Diagnose onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(onBack).toHaveBeenCalled();
  });
});

function within(label: string): HTMLElement {
  return row(label).querySelector('button') as HTMLElement;
}
