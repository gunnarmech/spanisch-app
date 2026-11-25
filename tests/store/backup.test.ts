import { describe, it, expect } from 'vitest';
import { openDb } from '../../src/store/db';
import { exportBackup, importBackup } from '../../src/store/backup';
import type { ReviewEvent } from '../../src/engine/state';

let n = 0;
const fresh = () => openDb(`backup-${Date.now()}-${n++}`);
const ev = (id: string): ReviewEvent => ({ id, cardId: 'c1', ts: 1, device: 'd', kind: 'known' });
const blob = (o: unknown) => new Blob([typeof o === 'string' ? o : JSON.stringify(o)]);

describe('backup', () => {
  it('exportiert ohne Token', async () => {
    const db = await fresh();
    const s = await db.getSettings();
    await db.saveSettings({ ...s, gistToken: 'geheim', gistId: 'g1' });
    await db.addEvents([ev('a')]);
    const text = await exportBackup(db).then((b) => b.text());
    expect(text).not.toContain('geheim');
    expect(JSON.parse(text)).toMatchObject({ version: 1, events: [{ id: 'a' }], reports: [] });
  });

  it('zählt beim Import nur neue Ereignisse', async () => {
    const a = await fresh();
    await a.addEvents([ev('a'), ev('b')]);
    const file = await exportBackup(a);
    const b = await fresh();
    await b.addEvents([ev('a')]);
    expect(await importBackup(b, file)).toBe(1);
    expect(await importBackup(b, file)).toBe(0);
    expect(await b.allEvents()).toHaveLength(2);
  });

  it('übernimmt Fehlermeldungen und alle drei Ereignisarten', async () => {
    const db = await fresh();
    const events = [
      ev('a'),
      { id: 'b', cardId: 'c', ts: 1, device: 'd', kind: 'heard' },
      { id: 'c', cardId: 'c', ts: 1, device: 'd', kind: 'review', rating: 3, stage: 1 },
    ];
    const reports = [{ id: 'r', itemId: 'i', ts: 1, text: 't' }];
    expect(await importBackup(db, blob({ version: 1, events, reports }))).toBe(3);
    expect(await db.allReports()).toHaveLength(1);
  });

  it('lehnt Bewertungen mit ungültigem rating, stage oder ts ab', async () => {
    const db = await fresh();
    const r = { id: 'x', cardId: 'c', ts: 1, device: 'd', kind: 'review', rating: 3, stage: 1 };
    for (const bad of [{ ...r, rating: undefined }, { ...r, rating: 5 }, { ...r, rating: 2.5 }, { ...r, stage: 9 }, { ...r, stage: undefined }, { ...r, ts: 1e300 }]) {
      await expect(importBackup(db, blob({ version: 1, events: [bad], reports: [] }))).rejects.toThrow('Keine gültige Sicherung');
    }
    expect(await db.allEvents()).toHaveLength(0);
  });

  it('wirft bei Unsinn', async () => {
    const db = await fresh();
    for (const bad of ['kein json', { version: 2, events: [], reports: [] }, { version: 1, events: [{ cardId: 'x', ts: 1 }], reports: [] }, { version: 1, events: [{ id: 'x', cardId: 'c', kind: 'known', ts: 'x' }], reports: [] }]) {
      await expect(importBackup(db, blob(bad))).rejects.toThrow('Keine gültige Sicherung');
    }
    expect(await db.allEvents()).toHaveLength(0);
  });
});
