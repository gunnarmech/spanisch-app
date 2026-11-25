import { cleanup, render, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { openDb } from '../../src/store/db';
import { syncNow } from '../../src/sync/gist';
import { useAppState } from '../../src/ui/useAppState';

vi.mock('../../src/sync/gist', () => ({ syncNow: vi.fn(async () => ({ added: 0, pushed: 0 })) }));

let n = 0;
const sync = vi.mocked(syncNow);

beforeEach(() => {
  sync.mockClear();
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function mount() {
  const db = await openDb(`appstate-${Date.now()}-${n++}`);
  await db.saveSettings({ ...(await db.getSettings()), gistToken: 'tok' });
  const Probe = () => {
    useAppState(db);
    return null;
  };
  render(<Probe />);
  await waitFor(() => expect(sync).toHaveBeenCalledTimes(1));
  await vi.waitFor(() => expect(sync.mock.results[0]).toBeDefined());
  await new Promise((r) => setTimeout(r, 20));
}

const show = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

test('gleicht beim Sichtbarwerden ab, aber höchstens einmal je 60 Sekunden', async () => {
  await mount();
  show('hidden');
  expect(sync).toHaveBeenCalledTimes(1);
  vi.setSystemTime(Date.now() + 30_000);
  show('visible');
  await new Promise((r) => setTimeout(r, 20));
  expect(sync).toHaveBeenCalledTimes(1);
  vi.setSystemTime(Date.now() + 61_000);
  show('visible');
  await waitFor(() => expect(sync).toHaveBeenCalledTimes(2));
});

test('gleicht beim Wiederkehren der Verbindung ab', async () => {
  await mount();
  window.dispatchEvent(new Event('online'));
  await waitFor(() => expect(sync).toHaveBeenCalledTimes(2));
});
