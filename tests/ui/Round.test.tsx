import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replay } from '../../src/engine/state';
import { Home } from '../../src/ui/Home';
import { Round } from '../../src/ui/Round';
import { choiceOptions } from '../../src/ui/tasks/distractors';
import type { Situation } from '../../src/content/types';
import { fakeApp, situation } from './fixtures';

afterEach(cleanup);

const noop = () => {};

/** Beide Einführungen durchklicken, danach steht der erste Abruf (Tippen) von "hola" an. */
async function toFirstCheck() {
  fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }));
  expect(await screen.findByText('adiós')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
  await screen.findByText('Wie sagt man das auf Spanisch?');
}

function typeAnswer(text: string) {
  const box = screen.getByLabelText('Deine Antwort auf Spanisch') as HTMLInputElement;
  fireEvent.input(box, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
}

describe('Runde', () => {
  it('zeigt bei neuen Items erst die Einführungen, dann den Abruf per Tippen, und bewertet richtig mit 3', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);

    expect(await screen.findByText('Neu')).toBeTruthy();
    expect(screen.getByText('hola')).toBeTruthy();
    await toFirstCheck();
    expect(screen.queryByText('Was bedeutet das?')).toBeNull();
    expect(screen.getByText('hallo')).toBeTruthy();
    typeAnswer('hola');
    expect(screen.getByText('Richtig.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    await waitFor(() => expect(app.record).toHaveBeenCalledTimes(1));
    expect(app.record).toHaveBeenCalledWith({ kind: 'review', cardId: 'w-hola', rating: 3, stage: 0 });
  });

  it('Kann ich schon bei der Einführung entfernt den späteren Abruf und zeichnet genau ein known auf', async () => {
    const app = fakeApp({
      situations: [
        {
          ...situation,
          items: ['a', 'b', 'c'].map((x) => ({
            id: `w-${x}`,
            kind: 'word' as const,
            es: `pal${x}`,
            de: `wort${x}`,
            forms: [`pal${x}`],
            examples: [],
          })),
        },
      ],
    });
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('pala');
    fireEvent.click(screen.getByRole('button', { name: 'Kann ich schon' }));
    await waitFor(() => expect(app.record).toHaveBeenCalledWith({ kind: 'known', cardId: 'w-a' }));
    // Rest der Runde durchlaufen: Einführungen b und c, dann nur noch deren Abrufe.
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      if (screen.queryByText('Runde geschafft.')) break;
      if (screen.queryByText('Neu')) {
        seen.push(['pala', 'palb', 'palc'].find((w) => screen.queryByText(w)) ?? '?');
        fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
      } else if (screen.queryByText('Wie sagt man das auf Spanisch?')) {
        seen.push(['worta', 'wortb', 'wortc'].find((w) => screen.queryByText(w)) ?? '?');
        typeAnswer('x');
        typeAnswer('x');
        fireEvent.click(await screen.findByRole('button', { name: 'Weiter' }));
      }
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(seen).toEqual(['palb', 'palc', 'wortb', 'wortc']);
    const calls = app.record.mock.calls.map((c) => c[0] as { kind: string; cardId: string });
    expect(calls.filter((c) => c.kind === 'known')).toHaveLength(1);
    expect(calls.filter((c) => c.cardId === 'w-a')).toHaveLength(1);
  });

  it('kann ich schon erzeugt ein known-Ereignis und überspringt die Auswahl desselben Items', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Kann ich schon' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Kann ich schon' }));
    await screen.findByText('adiós');
    fireEvent.click(screen.getByRole('button', { name: 'Kann ich schon' }));

    expect(await screen.findByText('Runde geschafft.')).toBeTruthy();
    expect(screen.getByText('Neu in dieser Runde')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Noch eine Runde' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fertig' }));
    expect(onAgain).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });
});

describe('Startseite', () => {
  it('zeigt das Verständnis je Situation und nie eine Zahl fälliger Karten', () => {
    render(<Home app={fakeApp()} onStart={noop} onDiagnose={noop} onSettings={noop} />);
    expect(screen.getByRole('button', { name: 'Heute lernen' })).toBeTruthy();
    expect(
      screen.getByText((_, el) => el?.classList.contains('understand') === true && el.textContent === 'Du verstehst etwa 0 % der Dialoge'),
    ).toBeTruthy();
    expect(screen.queryByText(/fällig/)).toBeNull();
  });

  it('startet eine Runde für die gewählte Situation', () => {
    const onStart = vi.fn();
    render(<Home app={fakeApp()} onStart={onStart} onDiagnose={noop} onSettings={noop} />);
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

describe('Ablenker nach Art', () => {
  const mk = (items: Situation['items']): Situation => ({ id: 's', order: 1, title: 'S', items });
  const word = (id: string, de: string) => ({ id, kind: 'word' as const, es: id, de, forms: [id], examples: [] });
  const sentence = (id: string, de: string) => ({ id, kind: 'sentence' as const, es: id, de });

  it('nimmt für ein Wort zuerst Wörter und Wendungen, keine Sätze, solange genug da sind', () => {
    const s = mk([word('w1', 'eins'), word('w2', 'zwei'), word('w3', 'drei'), word('w4', 'vier'), sentence('s1', 'Ein ganzer Satz.')]);
    for (let i = 0; i < 20; i++) {
      expect(choiceOptions(s.items[0], [s], 's')).not.toContain('Ein ganzer Satz.');
    }
  });

  it('nimmt für einen Satz zuerst Sätze', () => {
    const s = mk([sentence('a', 'Satz eins.'), sentence('b', 'Satz zwei.'), sentence('c', 'Satz drei.'), sentence('d', 'Satz vier.'), word('w1', 'Wort')]);
    for (let i = 0; i < 20; i++) {
      expect(choiceOptions(s.items[0], [s], 's')).not.toContain('Wort');
    }
  });

  it('füllt aus der anderen Art auf, wenn die eigene nicht reicht', () => {
    const s = mk([word('w1', 'eins'), word('w2', 'zwei'), sentence('s1', 'Satz.'), sentence('s2', 'Noch ein Satz.')]);
    const opts = choiceOptions(s.items[0], [s], 's');
    expect(opts).toHaveLength(4);
  });
});

describe('Ereignisse beim Antworten', () => {
  it('schreibt die Bewertung schon bei der Antwort, vor Weiter', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await toFirstCheck();
    typeAnswer('hola');
    await waitFor(() => expect(app.record).toHaveBeenCalledTimes(1));
    expect(app.record).toHaveBeenCalledWith({ kind: 'review', cardId: 'w-hola', rating: 3, stage: 0 });
  });

  it('schreibt beim Beenden der Runde auf dem Rückmeldebildschirm nichts verloren', async () => {
    const app = fakeApp();
    const onExit = vi.fn();
    render(<Round app={app} onExit={onExit} onAgain={noop} />);
    await toFirstCheck();
    typeAnswer('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
    expect(app.record).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalled();
  });

  it('doppeltes Tippen auf Weiter schaltet nur einmal weiter und schreibt nur ein Ereignis', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await toFirstCheck();
    typeAnswer('hola');
    const next = screen.getByRole('button', { name: 'Weiter' });
    fireEvent.click(next);
    fireEvent.click(next);
    // Genau eine Aufgabe weiter: der Abruf von adiós, nicht der übernächste Schritt.
    expect(await screen.findByText('auf Wiedersehen')).toBeTruthy();
    expect(screen.getByLabelText('Deine Antwort auf Spanisch')).toBeTruthy();
    expect(app.record).toHaveBeenCalledTimes(1);
  });

  it('doppeltes Tippen auf kann ich schon schreibt genau ein Ereignis', async () => {
    const app = fakeApp({
      record: vi.fn(() => new Promise<void>((r) => setTimeout(r, 20))),
    });
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    const known = screen.getByRole('button', { name: 'Kann ich schon' });
    fireEvent.click(known);
    fireEvent.click(known);
    expect(await screen.findByText('adiós')).toBeTruthy();
    expect(app.record).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Neu')).toBeTruthy();
  });

  it('eine Dialogaufgabe schreibt heard und kein review', async () => {
    const validIds = new Set(['w-hola', 'w-adios']);
    const states = replay(
      [{ id: 'e1', cardId: 'w-hola', ts: Date.now() - 30 * 86_400_000, device: 'x', kind: 'review', rating: 3, stage: 0 }],
      validIds,
    );
    const app = fakeApp({ states });
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    for (let i = 0; i < 3; i++) {
      if (screen.queryByRole('button', { name: 'Text zeigen' })) break;
      fireEvent.click(await screen.findByRole('button', { name: 'Kann ich schon' }));
      await waitFor(() => expect(app.record).toHaveBeenCalledTimes(i + 1));
      await new Promise((r) => setTimeout(r, 0));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Text zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zeile für Zeile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fertig' }));
    await waitFor(() => expect(app.record).toHaveBeenCalledWith({ kind: 'heard', cardId: 'd-1' }));
    const kinds = app.record.mock.calls.map((c) => (c[0] as { kind: string }).kind);
    expect(kinds).not.toContain('review');
    expect(kinds.filter((k) => k === 'heard')).toHaveLength(1);
  });
});

describe('Abgleich beim Beenden', () => {
  it('Runde beenden gleicht ab, wenn in der Runde etwas aufgezeichnet wurde', async () => {
    const app = fakeApp();
    const onExit = vi.fn();
    render(<Round app={app} onExit={onExit} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Kann ich schon' }));
    await waitFor(() => expect(app.record).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
    expect(app.sync).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalled();
  });

  it('Runde beenden ohne Aufzeichnung gleicht nicht ab', async () => {
    const app = fakeApp();
    render(<Round app={app} onExit={noop} onAgain={noop} />);
    await screen.findByText('hola');
    fireEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
    expect(app.sync).not.toHaveBeenCalled();
  });
});
