import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, test, expect } from 'vitest';
import { openDb } from '../../src/store/db';
import { App } from '../../src/ui/App';

afterEach(cleanup);

test('Startseite zeigt Titel', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});

test('Diagnose ist über die Startseite erreichbar und führt zurück', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Diagnose' }));
  expect(screen.getByRole('heading', { name: 'Diagnose' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});

test('Fortschritt ist von der Startseite erreichbar', async () => {
  const db = await openDb(`progress-${Date.now()}`);
  render(<App db={db} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Fortschritt' }));
  expect(screen.getByRole('heading', { name: 'Fortschritt' })).toBeTruthy();
});

test('Quellen sind über die Einstellungen erreichbar', async () => {
  const db = await openDb(`sources-${Date.now()}`);
  render(<App db={db} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Einstellungen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Quellen' }));
  expect(screen.getByRole('heading', { name: 'Quellen' })).toBeTruthy();
});

test('das Angebot zur Einstufung erscheint beim ersten Start und nach dem Überspringen nicht mehr', async () => {
  const db = await openDb(`placement-${Date.now()}`);
  render(<App db={db} />);
  fireEvent.click(await screen.findByRole('button', { name: 'überspringen' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'überspringen' })).toBeNull());
  expect((await db.getSettings()).placementDone).toBe(true);
  expect(await db.allEvents()).toEqual([]);
});
