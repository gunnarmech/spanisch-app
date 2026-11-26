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

  it('Clip ohne Manifest-Eintrag wird übersprungen, Runde geht weiter', async () => {
    // loadManifest liefert im Test nichts: die Clip-Aufgabe darf nicht hängen bleiben
    const app = fakeApp({ situations: [chileSituation], states: unlockedStates(), clips, heard: new Map([['d-1', 1]]) });
    render(<Round app={app} onExit={() => {}} onAgain={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Runde beenden' }) ).toBeTruthy());
    await waitFor(() => expect(screen.queryByText('Chile hören')).toBeNull());
    expect(app.record).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'heard' }));
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
});
