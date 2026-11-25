import { openDB } from 'idb';
import type { ReviewEvent } from '../engine/state';

export type Settings = {
  device: string;
  retention: number;
  gistToken?: string;
  gistId?: string;
  voiceSpeedNew: 'slow' | 'normal';
  lastSync?: number;
};

export type ErrorReport = { id: string; itemId: string; ts: number; text: string };

export type Db = {
  /** Idempotent über id: bereits vorhandene Ereignisse bleiben unverändert. */
  addEvents(e: ReviewEvent[]): Promise<void>;
  allEvents(): Promise<ReviewEvent[]>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  addReport(r: ErrorReport): Promise<void>;
  allReports(): Promise<ErrorReport[]>;
};

const SETTINGS_KEY = 'main';

/** Fragt dauerhaften Speicher an. Gibt false zurück, wenn der Browser das nicht kann. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function openDb(name = 'spanisch-app'): Promise<Db> {
  const idb = await openDB(name, 1, {
    upgrade(d) {
      d.createObjectStore('events', { keyPath: 'id' });
      d.createObjectStore('settings');
      d.createObjectStore('reports', { keyPath: 'id' });
    },
  });

  return {
    async addEvents(events) {
      const tx = idb.transaction('events', 'readwrite');
      await Promise.all([
        ...events.map(async (e) => {
          if (!(await tx.store.getKey(e.id))) await tx.store.put(e);
        }),
        tx.done,
      ]);
    },
    allEvents: () => idb.getAll('events'),
    async getSettings() {
      const existing = (await idb.get('settings', SETTINGS_KEY)) as Settings | undefined;
      if (existing) return existing;
      const created: Settings = { device: crypto.randomUUID(), retention: 0.9, voiceSpeedNew: 'slow' };
      await idb.put('settings', created, SETTINGS_KEY);
      return created;
    },
    async saveSettings(s) {
      await idb.put('settings', s, SETTINGS_KEY);
    },
    async addReport(r) {
      await idb.put('reports', r);
    },
    allReports: () => idb.getAll('reports'),
  };
}
