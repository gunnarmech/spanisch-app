import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/preact';
import type { ChileClip, Situation } from '../../src/content/types';
import { replay } from '../../src/engine/state';
import { validCardIds } from '../../src/ui/useAppState';
import { Round } from '../../src/ui/Round';
import { fakeApp } from './fixtures';

vi.mock('../../src/media/audio', async (orig) => ({
  ...(await orig<typeof import('../../src/media/audio')>()),
  prefetchSituations: vi.fn(async () => {}),
  loadManifest: vi.fn(async () => ({})),
}));
import { loadManifest, prefetchSituations, type Manifest } from '../../src/media/audio';

afterEach(cleanup);

it('lädt beim Start einer Runde die Töne der Situation vor', async () => {
  render(<Round app={fakeApp()} onExit={() => {}} onAgain={() => {}} />);
  await screen.findByText('Neu');
  expect(prefetchSituations).toHaveBeenCalledWith(['s1']);
});

describe('Chile-Aufnahmen in der Runde', () => {
  const chileSituation: Situation = {
    id: '01-grundlagen',
    order: 1,
    title: 'Grundlagen',
    items: [
      { id: 'w-hola', kind: 'word', es: 'hola', de: 'hallo', forms: ['hola'], examples: [] },
      { id: 'w-mesa', kind: 'word', es: 'mesa', de: 'Tisch', forms: ['mesa'], examples: [] },
      { id: 'd-1', kind: 'dialog', title: 'Gruß', lines: [{ speaker: 'A', es: 'hola', de: 'Hallo' }] },
    ],
  };
  const unlockedStates = () =>
    replay([{ id: 'k1', cardId: 'w-hola', ts: Date.now(), device: 'd', kind: 'known' }], validCardIds([chileSituation]));
  const clips: ChileClip[] = [{ id: 'c-hola', es: 'hola', de: 'hallo da', gender: 'f', source: 's' }];

  it('chile-echt wird vorab geladen, sobald freigeschaltet', async () => {
    vi.mocked(prefetchSituations).mockClear();
    render(
      <Round
        app={fakeApp({ situations: [chileSituation], states: unlockedStates(), clips })}
        onExit={() => {}}
        onAgain={() => {}}
      />,
    );
    await waitFor(() => expect(prefetchSituations).toHaveBeenCalled());
    expect(vi.mocked(prefetchSituations).mock.calls[0][0]).toContain('chile-echt');
  });

  it('nicht vorab geladen, solange gesperrt', async () => {
    vi.mocked(prefetchSituations).mockClear();
    render(<Round app={fakeApp({ clips })} onExit={() => {}} onAgain={() => {}} />);
    await screen.findByText('Neu');
    expect(vi.mocked(prefetchSituations).mock.calls[0][0]).not.toContain('chile-echt');
  });

  /** Überspringen: Einführung des neuen Wortes per "kann ich schon" überspringen, dann kommt die Aufnahme dran. */
  const roundToClip = async (app: ReturnType<typeof fakeApp>) => {
    render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'kann ich schon' }));
  };

  it('Clip ohne Manifest-Eintrag wird übersprungen, Runde geht weiter', async () => {
    const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
    await roundToClip(app);
    // Der Dialog rückt nach, ein Clip ohne Ton wird nicht gehört.
    expect(await screen.findByText('Gruß')).toBeTruthy();
    expect(screen.queryByText('Chile hören')).toBeNull();
    expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'heard' }));
  });

  it('Clip mit Eintrag, aber offline und nicht im Cache, wird übersprungen', async () => {
    vi.mocked(loadManifest).mockImplementation(async (id: string): Promise<Manifest> =>
      id === 'chile-echt' ? { 'c-hola': [{ voice: 'cl-f', speed: 'normal' }] } : {},
    );
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    vi.stubGlobal('caches', { open: async () => ({ match: async () => undefined }) });
    try {
      const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
      await roundToClip(app);
      expect(await screen.findByText('Gruß')).toBeTruthy();
      expect(screen.queryByText('Chile hören')).toBeNull();
      expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'heard' }));
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      vi.mocked(loadManifest).mockImplementation(async () => ({}));
    }
  });

  it('Clip offline, aber im Cache, wird gezeigt', async () => {
    vi.mocked(loadManifest).mockImplementation(async (id: string): Promise<Manifest> =>
      id === 'chile-echt' ? { 'c-hola': [{ voice: 'cl-f', speed: 'normal' }] } : {},
    );
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    vi.stubGlobal('caches', { open: async () => ({ match: async () => ({}) }) });
    try {
      const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
      await roundToClip(app);
      expect(await screen.findByText('Chile hören')).toBeTruthy();
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      vi.mocked(loadManifest).mockImplementation(async () => ({}));
    }
  });

  it('Clip mit Manifest-Eintrag wird gezeigt, die Antwort schreibt heard', async () => {
    vi.mocked(loadManifest).mockImplementation(async (id: string): Promise<Manifest> =>
      id === 'chile-echt' ? { 'c-hola': [{ voice: 'cl-f', speed: 'normal' }] } : {},
    );
    const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
    render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
    // Zuerst kommt die Einführung des neuen Wortes, die Aufnahme steht am Ende der Runde.
    fireEvent.click(await screen.findByRole('button', { name: 'kann ich schon' }));
    expect(await screen.findByText('Chile hören')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /hallo da/ }));
    await waitFor(() => expect(app.record).toHaveBeenCalledWith({ kind: 'heard', cardId: 'c-hola' }));
    expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'review' }));
    vi.mocked(loadManifest).mockImplementation(async () => ({}));
  });

  describe('Lade- und Wiedergabefehler bei onLine', () => {
    const withManifest = () =>
      vi.mocked(loadManifest).mockImplementation(async (id: string): Promise<Manifest> =>
        id === 'chile-echt' ? { 'c-hola': [{ voice: 'cl-f', speed: 'normal' }] } : {},
      );
    const failWith = (err: Error) =>
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.reject(err));
    const cleanUp = () => {
      vi.restoreAllMocks();
      vi.mocked(loadManifest).mockImplementation(async () => ({}));
    };

    it('404 (Quelle nicht unterstützt): Aufgabe wird übersprungen, kein heard, Dialog rückt nach', async () => {
      withManifest();
      expect(navigator.onLine).toBe(true);
      failWith(new DOMException('no supported sources', 'NotSupportedError'));
      try {
        const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
        render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
        fireEvent.click(await screen.findByRole('button', { name: 'kann ich schon' }));
        expect(await screen.findByText('Gruß')).toBeTruthy();
        expect(screen.queryByText('Chile hören')).toBeNull();
        expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'heard', cardId: 'c-hola' }));
      } finally {
        cleanUp();
      }
    });

    it('Netzwerkfehler: Aufgabe wird übersprungen, kein heard', async () => {
      withManifest();
      failWith(new DOMException('network', 'NetworkError'));
      try {
        // Kein Dialog als Ersatz: die Runde geht zu Ende.
        const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', Date.now()]]) });
        render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
        fireEvent.click(await screen.findByRole('button', { name: 'kann ich schon' }));
        await waitFor(() => expect(screen.queryByText('Chile hören')).toBeNull());
        expect(await screen.findByText('Runde geschafft.')).toBeTruthy();
        expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'heard' }));
      } finally {
        cleanUp();
      }
    });

    it('verweigerter Autoplay (NotAllowedError) ist kein Ladefehler: die Aufgabe bleibt', async () => {
      withManifest();
      failWith(new DOMException('blocked', 'NotAllowedError'));
      try {
        const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
        render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
        fireEvent.click(await screen.findByRole('button', { name: 'kann ich schon' }));
        expect(await screen.findByText('Chile hören')).toBeTruthy();
        await new Promise((r) => setTimeout(r, 20));
        expect(screen.getByText('Chile hören')).toBeTruthy();
      } finally {
        cleanUp();
      }
    });
  });
});
