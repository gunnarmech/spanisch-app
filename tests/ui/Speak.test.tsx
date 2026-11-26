import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '../../src/content/types';
import type { Task } from '../../src/engine/round';

const speech = vi.hoisted(() => ({
  speechSupported: vi.fn(() => false),
  recognize: vi.fn(async (): Promise<string | null> => null),
  recordClip: vi.fn(async (): Promise<Blob | null> => null),
  recordingSupported: vi.fn(() => false),
}));
vi.mock('../../src/media/speech', () => speech);
vi.mock('../../src/media/audio', () => ({
  play: vi.fn(async () => {}),
  playSequence: vi.fn(async () => {}),
  audioUrl: vi.fn(() => null),
}));

import { play, playSequence } from '../../src/media/audio';
import { RoundEnvContext } from '../../src/ui/tasks/env';
import { Speak } from '../../src/ui/tasks/Speak';

const task: Task = { cardId: 'p-bano', itemId: 'p-bano', situationId: 's1', form: 'speak', isNew: false };
const item = {
  id: 'p-bano',
  kind: 'phrase',
  es: '¿Dónde está el baño?',
  de: 'Wo ist die Toilette?',
  forms: ['¿Dónde está el baño?'],
  examples: [],
} as unknown as Item;

beforeEach(() => {
  speech.speechSupported.mockReturnValue(false);
  speech.recordingSupported.mockReturnValue(false);
  speech.recognize.mockResolvedValue(null);
  speech.recordClip.mockResolvedValue(null);
  URL.createObjectURL = vi.fn(() => 'blob:clip');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const speakButton = () => screen.getByRole('button', { name: 'Sprechen' });

describe('Speak', () => {
  it('meldet mit Erkennung "donde esta el baño" als richtig', async () => {
    speech.speechSupported.mockReturnValue(true);
    speech.recognize.mockResolvedValue('donde esta el baño');
    const onAnswered = vi.fn();
    const onDone = vi.fn();
    render(<Speak task={task} item={item} onAnswered={onAnswered} onDone={onDone} />);
    expect(screen.getByText('Wo ist die Toilette?')).toBeTruthy();
    fireEvent.click(speakButton());
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'correct', usedHint: false }));
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'correct' }));
  });

  it('erlaubt einen zweiten Versuch, markiert fehlende Wörter und wertet mit usedHint', async () => {
    speech.speechSupported.mockReturnValue(true);
    speech.recognize.mockResolvedValueOnce('hola').mockResolvedValueOnce('donde esta el baño');
    const onAnswered = vi.fn();
    render(<Speak task={task} item={item} onAnswered={onAnswered} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    await screen.findByText(/Noch einmal/);
    expect(document.querySelector('mark')).toBeTruthy();
    expect(onAnswered).not.toHaveBeenCalled();
    fireEvent.click(speakButton());
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'correct', usedHint: true }));
  });

  it('wertet nach zwei Fehlversuchen als falsch', async () => {
    speech.speechSupported.mockReturnValue(true);
    speech.recognize.mockResolvedValue('hola');
    const onAnswered = vi.fn();
    render(<Speak task={task} item={item} onAnswered={onAnswered} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    await screen.findByText(/Noch einmal/);
    fireEvent.click(speakButton());
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1));
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'wrong', usedHint: true }));
  });

  it('zeigt ohne SpeechRecognition die Aufnahme-Variante mit Selbstbewertung', async () => {
    speech.recordingSupported.mockReturnValue(true);
    speech.recordClip.mockResolvedValue(new Blob(['x']));
    const onAnswered = vi.fn();
    render(<Speak task={task} item={item} onAnswered={onAnswered} onDone={vi.fn()} />);
    expect(speech.recognize).not.toHaveBeenCalled();
    fireEvent.click(speakButton());
    const same = await screen.findByRole('button', { name: 'Klang gleich' });
    expect(playSequence).not.toHaveBeenCalled();
    fireEvent.click(same);
    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'correct' }));
  });

  it('meldet "Eher nicht" als falsch, nur einmal', async () => {
    speech.recordingSupported.mockReturnValue(true);
    speech.recordClip.mockResolvedValue(new Blob(['x']));
    const onAnswered = vi.fn();
    render(<Speak task={task} item={item} onAnswered={onAnswered} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    const no = await screen.findByRole('button', { name: 'Eher nicht' });
    fireEvent.click(no);
    fireEvent.click(no);
    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'wrong' }));
  });

  it('fällt bei null aus der Erkennung auf die Aufnahme zurück, ohne Fehlermeldung', async () => {
    speech.speechSupported.mockReturnValue(true);
    speech.recordingSupported.mockReturnValue(true);
    speech.recognize.mockResolvedValue(null);
    speech.recordClip.mockResolvedValue(new Blob(['x']));
    render(<Speak task={task} item={item} onAnswered={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    expect(await screen.findByRole('button', { name: 'Klang gleich' })).toBeTruthy();
    expect(screen.queryByText(/Fehler/)).toBeNull();
  });

  it('stellt ohne Mikrofon die Aufgabe als Tippaufgabe', () => {
    render(<Speak task={task} item={item} onAnswered={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByText('Mikrofon nicht verfügbar')).toBeTruthy();
    expect(screen.getByLabelText('Deine Antwort auf Spanisch')).toBeTruthy();
  });

  it('fällt auf Tippen zurück, wenn die Aufnahme null liefert', async () => {
    speech.recordingSupported.mockReturnValue(true);
    speech.recordClip.mockResolvedValue(null);
    render(<Speak task={task} item={item} onAnswered={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    expect(await screen.findByText('Mikrofon nicht verfügbar')).toBeTruthy();
    expect(screen.getByLabelText('Deine Antwort auf Spanisch')).toBeTruthy();
  });

  it('spielt Original und Aufnahme erst auf Knopfdruck nacheinander', async () => {
    speech.recordingSupported.mockReturnValue(true);
    speech.recordClip.mockResolvedValue(new Blob(['x']));
    render(
      <RoundEnvContext.Provider value={{ situations: [], urlFor: () => 'orig.mp3' }}>
        <Speak task={task} item={item} onAnswered={vi.fn()} onDone={vi.fn()} />
      </RoundEnvContext.Provider>,
    );
    fireEvent.click(speakButton());
    const both = await screen.findByRole('button', { name: 'Beide anhören' });
    expect(playSequence).not.toHaveBeenCalled();
    fireEvent.click(both);
    expect(playSequence).toHaveBeenCalledWith(['orig.mp3', 'blob:clip']);
    fireEvent.click(screen.getByRole('button', { name: 'Deine Aufnahme anhören' }));
    expect(play).toHaveBeenCalledWith('blob:clip');
  });

  it('gibt die Aufnahme-Adresse beim Verlassen frei', async () => {
    speech.recordingSupported.mockReturnValue(true);
    speech.recordClip.mockResolvedValue(new Blob(['x']));
    const { unmount } = render(<Speak task={task} item={item} onAnswered={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(speakButton());
    await screen.findByRole('button', { name: 'Klang gleich' });
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:clip');
  });

  it('ruft onDone bei doppeltem Weiter nur einmal', async () => {
    speech.speechSupported.mockReturnValue(true);
    speech.recognize.mockResolvedValue('donde esta el baño');
    const onDone = vi.fn();
    render(<Speak task={task} item={item} onAnswered={vi.fn()} onDone={onDone} />);
    fireEvent.click(speakButton());
    const next = await screen.findByRole('button', { name: 'Weiter' });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
