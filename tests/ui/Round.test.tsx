import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Home } from '../../src/ui/Home';
import { Round } from '../../src/ui/Round';
import { choiceOptions } from '../../src/ui/tasks/distractors';
import { fakeApp, situation } from './fixtures';

afterEach(cleanup);

const noop = () => {};

describe('Runde', () => {
  it('zeigt bei neuen Items erst die Einführung, dann die Auswahl, und bewertet richtig mit 3', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);

    expect(await screen.findByText('Neu')).toBeTruthy();
    expect(screen.getByText('hola')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(await screen.findByText('Was bedeutet das?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /hallo/ }));
    expect(screen.getByText('Richtig.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    await waitFor(() => expect(app.record).toHaveBeenCalledTimes(1));
    expect(app.record).toHaveBeenCalledWith({ kind: 'review', cardId: 'w-hola', rating: 3, stage: 0 });
  });

  it('wählt mit den Ziffertasten', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }));
    await screen.findByText('Was bedeutet das?');
    const options = screen.getAllByRole('button', { name: /^\d/ });
    const index = options.findIndex((b) => b.textContent?.includes('hallo'));
    fireEvent.keyDown(window, { key: String(index + 1) });
    expect(screen.getByText('Richtig.')).toBeTruthy();
  });

  it('kann ich schon erzeugt ein known-Ereignis und überspringt die Auswahl desselben Items', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'kann ich schon' }));

    await waitFor(() => expect(app.record).toHaveBeenCalledWith({ kind: 'known', cardId: 'w-hola' }));
    expect(await screen.findByText('adiós')).toBeTruthy();
    expect(screen.queryByText('Was bedeutet das?')).toBeNull();
  });

  it('meldet einen Fehler zum Item', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Fehler melden' }));
    const box = screen.getByLabelText('Was stimmt nicht?') as HTMLTextAreaElement;
    box.value = 'falsche Übersetzung';
    fireEvent.click(screen.getByRole('button', { name: 'Melden' }));
    await waitFor(() => expect(app.report).toHaveBeenCalledWith('w-hola', 'falsche Übersetzung'));
    expect(await screen.findByText('Fehler gemeldet.')).toBeTruthy();
  });

  it('Escape schließt das Meldefeld', async () => {
    render(<Round app={fakeApp()} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Fehler melden' }));
    expect(screen.getByLabelText('Was stimmt nicht?')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('Was stimmt nicht?')).toBeNull();
  });

  it('endet mit der Liste des Neuen und den Knöpfen fertig und noch eine Runde', async () => {
    const onExit = vi.fn();
    const onAgain = vi.fn();
    render(<Round app={fakeApp()} onExit={onExit} onAgain={onAgain} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'kann ich schon' }));
    await screen.findByText('adiós');
    fireEvent.click(screen.getByRole('button', { name: 'kann ich schon' }));

    expect(await screen.findByText('Runde geschafft.')).toBeTruthy();
    expect(screen.getByText('Neu in dieser Runde')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'noch eine Runde' }));
    fireEvent.click(screen.getByRole('button', { name: 'fertig' }));
    expect(onAgain).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });
});

describe('Startseite', () => {
  it('zeigt das Verständnis je Situation und nie eine Zahl fälliger Karten', () => {
    render(<Home app={fakeApp()} onStart={noop} />);
    expect(screen.getByRole('button', { name: 'Heute lernen' })).toBeTruthy();
    expect(screen.getByText(/du verstehst etwa 0 % der Dialoge/)).toBeTruthy();
    expect(screen.queryByText(/fällig/)).toBeNull();
  });

  it('startet eine Runde für die gewählte Situation', () => {
    const onStart = vi.fn();
    render(<Home app={fakeApp()} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Grundlagen/ }));
    expect(onStart).toHaveBeenCalledWith('s1');
  });
});

describe('Antwortoptionen', () => {
  const other = {
    id: 's2',
    order: 2,
    title: 'Mehr',
    items: [
      { id: 'w-a', kind: 'word' as const, es: 'a', de: 'eins', forms: ['a'], examples: [] },
      { id: 'w-b', kind: 'word' as const, es: 'b', de: 'zwei', forms: ['b'], examples: [] },
      { id: 'w-c', kind: 'word' as const, es: 'c', de: 'drei', forms: ['c'], examples: [] },
    ],
  };

  it('nimmt Ablenker zuerst aus der eigenen Situation, nie die richtige doppelt', () => {
    const opts = choiceOptions(situation.items[0], [situation, other], 's1');
    expect(opts.filter((o) => o === 'hallo')).toHaveLength(1);
    expect(new Set(opts).size).toBe(opts.length);
    expect(opts).toContain('auf Wiedersehen');
    expect(opts).toHaveLength(4);
  });

  it('füllt bei zu wenigen Items aus allen Situationen auf', () => {
    const opts = choiceOptions(situation.items[0], [situation, other], 's1');
    expect(opts.filter((o) => ['eins', 'zwei', 'drei'].includes(o))).toHaveLength(2);
  });
});
