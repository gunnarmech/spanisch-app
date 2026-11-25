import { describe, it, expect } from 'vitest';
import { openDb } from '../../src/store/db';
import type { ReviewEvent } from '../../src/engine/state';

let n = 0;
const fresh = () => openDb(`test-${Date.now()}-${n++}`);
const ev = (id: string): ReviewEvent => ({ id, cardId: 'c1', ts: 1, device: 'd', kind: 'known' });

describe('db', () => {
  it('speichert Ereignisse idempotent über id', async () => {
    const db = await fresh();
    await db.addEvents([ev('a'), ev('b')]);
    await db.addEvents([ev('a')]);
    expect((await db.allEvents()).map((e) => e.id).sort()).toEqual(['a', 'b']);
  });

  it('legt Einstellungen beim ersten Aufruf an und behält sie', async () => {
    const db = await fresh();
    const s = await db.getSettings();
    expect(s.device).toBeTruthy();
    expect(s.retention).toBe(0.9);
    expect(s.voiceSpeedNew).toBe('slow');
    expect((await db.getSettings()).device).toBe(s.device);
    await db.saveSettings({ ...s, retention: 0.85 });
    expect((await db.getSettings()).retention).toBe(0.85);
  });

  it('speichert Fehlermeldungen', async () => {
    const db = await fresh();
    await db.addReport({ id: 'r1', itemId: 'i1', ts: 5, text: 'falsch' });
    expect(await db.allReports()).toHaveLength(1);
  });
});
