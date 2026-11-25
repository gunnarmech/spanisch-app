import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, test, vi } from 'vitest';
import { newEvent, replay } from '../../src/engine/state';
import { Progress } from '../../src/ui/Progress';
import { allPhotos } from '../../src/ui/photos';
import { Sources } from '../../src/ui/Sources';
import { fakeApp, situation } from './fixtures';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const noop = () => {};

test('zeigt Verständnis in Prozent je Situation und die Zahl sicher bekannter Wörter, ohne fällig', () => {
  const now = Date.now();
  const states = replay([newEvent({ kind: 'known', cardId: 'w-hola' }, 'd', now)], new Set(['w-hola', 'w-adios']));
  render(<Progress app={fakeApp({ states })} onBack={noop} />);
  expect(screen.getByText('Grundlagen')).toBeTruthy();
  expect(document.querySelector('.understand')?.textContent).toBe('du verstehst etwa 100 % der Dialoge');
  expect(screen.getByText(/sicher bekannte Wörter und Wendungen: 1/)).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/fällig/i);
  expect(document.body.textContent).not.toMatch(/[—–]/);
});

test('Situation ohne Dialog zeigt keinen Prozentwert', () => {
  const noDialog = { ...situation, items: situation.items.filter((i) => i.kind !== 'dialog') };
  render(<Progress app={fakeApp({ situations: [noDialog] })} onBack={noop} />);
  expect(screen.getByText('noch keine Dialoge')).toBeTruthy();
});

test('Quellen nennen Lizenzen und listen Fehlermeldungen mit Export als Text', async () => {
  const writeText = vi.fn(async () => {});
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const reports = [{ id: 'r1', itemId: 'w-hola', ts: new Date(2026, 10, 25, 9, 0).getTime(), text: 'Betonung falsch' }];
  const db = { allReports: async () => reports };
  render(<Sources app={fakeApp({ db: db as never })} onBack={noop} />);
  expect(screen.getAllByText(/CC BY-SA 4.0/).length).toBeGreaterThan(0);
  expect(screen.getByText(/ts-fsrs/)).toBeTruthy();
  expect(screen.getByText(/edge-tts/)).toBeTruthy();
  expect((screen.getByRole('link', { name: /FrequencyWords/ }) as HTMLAnchorElement).href).toContain(
    'github.com/hermitdave/FrequencyWords',
  );
  expect((screen.getByRole('link', { name: /Diccionario de americanismos/ }) as HTMLAnchorElement).href).toContain(
    'asale.org/damer',
  );
  await screen.findByText(/Betonung falsch/);
  fireEvent.click(screen.getByRole('button', { name: 'als Text kopieren' }));
  await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('w-hola')));
});

test('Quellen führen die Fotos mit Urheber, Lizenz und Link auf die Commons-Seite', () => {
  const db = { allReports: async () => [] };
  render(<Sources app={fakeApp({ db: db as never })} onBack={noop} />);
  expect(screen.getByRole('heading', { name: 'Fotos' })).toBeTruthy();
  for (const p of allPhotos) {
    const link = screen.getByRole('link', { name: `${p.author}, ${p.license}` }) as HTMLAnchorElement;
    expect(link.href).toBe(p.page);
  }
});
