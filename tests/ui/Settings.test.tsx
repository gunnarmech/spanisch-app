import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, expect, test, vi } from 'vitest';
import type { ReviewEvent } from '../../src/engine/state';
import { openDb } from '../../src/store/db';
import { App } from '../../src/ui/App';
import { useAppState, type AppState } from '../../src/ui/useAppState';
import { RoundEnd } from '../../src/ui/RoundEnd';
import { Settings } from '../../src/ui/Settings';
import { fakeApp } from './fixtures';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

let n = 0;
const fresh = () => openDb(`settings-${Date.now()}-${n++}`);
const noop = () => {};

test('zeigt Tokenfeld mit Anleitung und Link, letzten Abgleich und Quellen nur mit Ziel', () => {
  const app = fakeApp({ settings: { device: 'd', retention: 0.9, voiceSpeedNew: 'slow', lastSync: new Date(2026, 10, 25, 9, 30).getTime() } });
  const { rerender } = render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  const link = screen.getByRole('link', { name: 'Token anlegen' }) as HTMLAnchorElement;
  expect(link.href).toBe('https://github.com/settings/tokens/new?scopes=gist&description=spanisch-app');
  expect(screen.getByLabelText('GitHub-Token')).toBeTruthy();
  expect(screen.getByText(/Letzter Abgleich: .*2026/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Quellen' })).toBeNull();
  rerender(<Settings app={app} onBack={noop} onDiagnose={noop} onSources={noop} />);
  expect(screen.getByRole('button', { name: 'Quellen' })).toBeTruthy();
});

test('speichert den Token beim Verlassen des Feldes', () => {
  const app = fakeApp();
  render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  const input = screen.getByLabelText('GitHub-Token');
  fireEvent.input(input, { target: { value: ' ghp_abc ' } });
  fireEvent.blur(input);
  expect(app.updateSettings).toHaveBeenCalledWith({ gistToken: 'ghp_abc', gistId: undefined });
});

test('Ziel-Behaltensquote geht von 0.8 bis 0.95 und wird beim Loslassen gespeichert', () => {
  const app = fakeApp();
  render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  const slider = screen.getByLabelText(/Ziel-Behaltensquote/) as HTMLInputElement;
  expect([slider.min, slider.max]).toEqual(['0.8', '0.95']);
  fireEvent.input(slider, { target: { value: '0.85' } });
  fireEvent.change(slider);
  expect(app.updateSettings).toHaveBeenCalledWith({ retention: 0.85 });
});

test('"Jetzt abgleichen" meldet das Ergebnis, Fehler stehen als ruhige Zeile da', async () => {
  const sync = vi.fn(async () => ({ added: 2, pushed: 1 }));
  const app = fakeApp({ sync });
  const { rerender } = render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  fireEvent.input(screen.getByLabelText('GitHub-Token'), { target: { value: 't' } });
  fireEvent.click(screen.getByRole('button', { name: 'Jetzt abgleichen' }));
  await screen.findByText('Abgeglichen: 2 geholt, 1 gesendet.');
  expect(sync).toHaveBeenCalled();
  rerender(<Settings app={{ ...app, syncError: 'Der Token wurde abgelehnt. Bitte einen neuen anlegen.' }} onBack={noop} onDiagnose={noop} />);
  expect(screen.getByText(/Token wurde abgelehnt/)).toBeTruthy();
});

test('Import mit ungültiger Datei zeigt den Fehler und lädt nicht neu', async () => {
  const db = await fresh();
  const app = fakeApp({ db });
  render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  const file = new File(['kaputt'], 'x.json', { type: 'application/json' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText('Keine gültige Sicherung');
  expect(app.reload).not.toHaveBeenCalled();
});

test('Einstellungen sind von der Startseite erreichbar', async () => {
  render(<App db={await fresh()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Einstellungen' }));
  expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Diagnose' }));
  expect(screen.getByRole('heading', { name: 'Diagnose' })).toBeTruthy();
});

test('das Rundenende löst einen Abgleich aus', () => {
  const app = fakeApp();
  render(<RoundEnd app={app} tasks={[]} startCoverage={new Map()} onExit={noop} onAgain={noop} />);
  expect(app.sync).toHaveBeenCalledTimes(1);
});

test('beim Start wird abgeglichen und danach mit dem gemergten Protokoll neu geladen', async () => {
  const db = await fresh();
  await db.saveSettings({ ...(await db.getSettings()), gistToken: 'tok', gistId: 'g1' });
  const remote: ReviewEvent = { id: 'r1', cardId: 'unbekannt', ts: 5, device: 'x', kind: 'known' };
  const file = { content: JSON.stringify({ version: 1, events: [remote] }) };
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ id: 'g1', files: { 'spanisch-app-log.json': file } })),
  );
  vi.stubGlobal('fetch', fetchMock);
  render(<App db={db} />);
  await waitFor(async () => expect((await db.allEvents()).map((e) => e.id)).toEqual(['r1']));
  expect(fetchMock).toHaveBeenCalled();
});

test('überlappende sync()-Aufrufe: ein Folgelauf schickt die Ereignisse, die während des ersten Laufs entstanden', async () => {
  const db = await fresh();
  await db.saveSettings({ ...(await db.getSettings()), gistToken: 'tok', gistId: 'g1' });
  const patches: string[] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  let gets = 0;
  const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      patches.push(init.body as string);
      return new Response('{}');
    }
    if (gets++ === 0) await gate;
    return new Response(JSON.stringify({ id: 'g1', files: {} }));
  });
  vi.stubGlobal('fetch', fetchMock);
  let app: AppState | null = null;
  const Probe = () => {
    app = useAppState(db);
    return null;
  };
  render(<Probe />);
  await waitFor(() => expect(gets).toBe(1));
  // Der Startlauf hängt am ersten GET und hat das lokale Protokoll schon gelesen.
  await db.addEvents([{ id: 'late', cardId: 'c', ts: 9, device: 'd', kind: 'known' }]);
  const second = app!.sync();
  release();
  await second;
  expect(patches.some((p) => p.includes('late'))).toBe(true);
});

test('Wechsel des Tokens verwirft die gemerkte gistId', () => {
  const app = fakeApp({ settings: { device: 'd', retention: 0.9, voiceSpeedNew: 'slow', gistToken: 'alt', gistId: 'g1' } });
  render(<Settings app={app} onBack={noop} onDiagnose={noop} />);
  const input = screen.getByLabelText('GitHub-Token');
  fireEvent.input(input, { target: { value: 'neu' } });
  fireEvent.blur(input);
  const patch = vi.mocked(app.updateSettings).mock.calls[0][0];
  expect(patch).toEqual({ gistToken: 'neu', gistId: undefined });
  expect(Object.keys(patch)).toContain('gistId');
});

test('Knopf Einstufung machen öffnet die Einstufung', () => {
  const onPlacement = vi.fn();
  render(<Settings app={fakeApp()} onBack={noop} onDiagnose={noop} onPlacement={onPlacement} />);
  fireEvent.click(screen.getByRole('button', { name: 'Einstufung machen' }));
  expect(onPlacement).toHaveBeenCalled();
});

test('ohne Kandidaten Hinweistext statt Knopf', () => {
  const states = new Map([
    ['w-hola', {} as never],
    ['w-adios', {} as never],
  ]);
  render(<Settings app={fakeApp({ states })} onBack={noop} onDiagnose={noop} onPlacement={noop} />);
  expect(screen.queryByRole('button', { name: 'Einstufung machen' })).toBeNull();
  expect(screen.getByText('Es gibt gerade nichts einzustufen.')).toBeTruthy();
});

test('Einstufung ist über die Einstellungen erreichbar', async () => {
  render(<App db={await fresh()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Einstellungen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Einstufung machen' }));
  expect(screen.getByRole('heading', { name: 'Einstufung' })).toBeTruthy();
});

test('Zurücksetzen erst nach Bestätigung, genau ein reset, dann zurück', async () => {
  const app = fakeApp();
  const onBack = vi.fn();
  render(<Settings app={app} onBack={onBack} onDiagnose={noop} />);
  expect(screen.getByRole('heading', { name: 'Neu anfangen' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
  expect(app.record).not.toHaveBeenCalled();
  expect(screen.getByText('Wirklich alles zurücksetzen? Das lässt sich nicht rückgängig machen.')).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abbrechen' }));
  const yes = screen.getByRole('button', { name: 'Ja, alles zurücksetzen' });
  fireEvent.click(yes);
  fireEvent.click(yes);
  await waitFor(() => expect(onBack).toHaveBeenCalled());
  expect(app.record).toHaveBeenCalledTimes(1);
  expect(app.record).toHaveBeenCalledWith({ kind: 'reset', cardId: '*' });
  expect(app.sync).toHaveBeenCalled();
});

test('Abbrechen zeichnet nichts auf und schließt die Bestätigung', () => {
  const app = fakeApp();
  const onBack = vi.fn();
  render(<Settings app={app} onBack={onBack} onDiagnose={noop} />);
  fireEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(screen.queryByText(/Wirklich alles zurücksetzen/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' })).toBeTruthy();
  expect(app.record).not.toHaveBeenCalled();
  expect(onBack).not.toHaveBeenCalled();
});

test('Neu anfangen: Erklärtext ohne Sicherungsversprechen', () => {
  render(<Settings app={fakeApp()} onBack={noop} onDiagnose={noop} />);
  expect(
    screen.getByText('Dein Lernstand beginnt auf allen Geräten, die abgleichen, wieder von vorn. Einstellungen und Token bleiben.'),
  ).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/Sicherung als Datei/);
});

test('Zurücksetzen scheitert: Sperre frei, Meldung, zweiter Versuch möglich', async () => {
  const app = fakeApp();
  app.record.mockRejectedValueOnce(new Error('kaputt'));
  const onBack = vi.fn();
  render(<Settings app={app} onBack={onBack} onDiagnose={noop} />);
  fireEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ja, alles zurücksetzen' }));
  await screen.findByText('Zurücksetzen hat nicht geklappt. Bitte noch einmal versuchen.');
  expect(onBack).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Ja, alles zurücksetzen' }));
  await waitFor(() => expect(onBack).toHaveBeenCalled());
  expect(app.record).toHaveBeenCalledTimes(2);
});

test('Nach Abbrechen steht der Fokus wieder auf "Fortschritt zurücksetzen"', async () => {
  render(<Settings app={fakeApp()} onBack={noop} onDiagnose={noop} />);
  fireEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' })));
});
