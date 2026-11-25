import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { loadSituations } from '../content/load';
import type { Situation } from '../content/types';
import { dialogsHeard, newEvent, replay, type CardState, type ReviewEvent } from '../engine/state';
import { openDb, requestPersistence, type Db, type Settings } from '../store/db';
import { syncNow, type SyncResult } from '../sync/gist';

type Distribute<T> = T extends unknown ? Omit<T, 'id' | 'ts' | 'device'> : never;
export type AppEvent = Distribute<ReviewEvent>;

export type AppState = {
  situations: Situation[];
  states: Map<string, CardState>;
  /** Zeitpunkt des letzten Anhörens je Dialog-id. */
  heard: Map<string, number>;
  settings: Settings;
  db: Db;
  /** Letzter Fehler des Abgleichs, nur im Speicher. */
  syncError?: string;
  /** Gleicht mit dem Gist ab und lädt danach neu. Wirft nie, blockiert die Oberfläche nicht. */
  sync(): Promise<SyncResult>;
  /** Speichert geänderte Einstellungen und spielt das Protokoll damit neu ab. */
  updateSettings(patch: Partial<Settings>): Promise<void>;
  record(e: AppEvent): Promise<void>;
  reload(): Promise<void>;
  report(itemId: string, text: string): Promise<void>;
};

/** Karten-ids, die es im Inhalt gibt: Items und je Grammatikübung `<id>#<n>`. */
export function validCardIds(situations: Situation[]): Set<string> {
  const ids = new Set<string>();
  for (const s of situations) {
    for (const item of s.items) {
      if (item.kind === 'grammar') item.exercises.forEach((_, i) => ids.add(`${item.id}#${i}`));
      else ids.add(item.id);
    }
  }
  return ids;
}

const SYNC_MIN_GAP_MS = 60_000;

let situationsCache: Situation[] | undefined;

/** Lädt Inhalt, Ereignisprotokoll und Einstellungen, spielt das Protokoll ab. Null, solange geladen wird. */
export function useAppState(injected?: Db): AppState | null {
  const [state, setState] = useState<Omit<AppState, 'sync' | 'updateSettings' | 'syncError'> | null>(null);
  const [syncError, setSyncError] = useState<string>();
  const running = useRef<Promise<SyncResult> | null>(null);
  const queued = useRef<Promise<SyncResult> | null>(null);
  const lastStart = useRef(0);
  const db = useRef<Db | null>(null);
  const settings = useRef<Settings | null>(null);

  const reload = useCallback(async () => {
    if (!db.current || !settings.current) return;
    situationsCache ??= loadSituations();
    const situations = situationsCache;
    const events = await db.current.allEvents();
    const states = replay(events, validCardIds(situations), settings.current.retention);
    const current = db.current;
    const cfg = settings.current;
    setState({
      situations,
      states,
      heard: dialogsHeard(events),
      settings: cfg,
      db: current,
      reload,
      async record(e) {
        await current.addEvents([newEvent(e, cfg.device)]);
        await reload();
      },
      report: (itemId, text) => current.addReport({ id: crypto.randomUUID(), itemId, ts: Date.now(), text }),
    });
  }, []);

  const runSync = useCallback(async (): Promise<SyncResult> => {
    if (!db.current || !settings.current?.gistToken) return { added: 0, pushed: 0 };
    const res = await syncNow(db.current);
    if ('error' in res) {
      setSyncError(res.error);
    } else {
      setSyncError(undefined);
      settings.current = await db.current.getSettings();
      await reload();
    }
    return res;
  }, [reload]);

  /**
   * Höchstens ein Lauf zugleich. Kommt währenddessen eine neue Anforderung, wird genau ein
   * Folgelauf nach dessen Ende vorgemerkt, damit zwischenzeitlich entstandene Ereignisse mitgehen.
   */
  const sync = useCallback((): Promise<SyncResult> => {
    const start = (): Promise<SyncResult> => {
      lastStart.current = Date.now();
      const run = runSync().finally(() => {
        running.current = null;
      });
      running.current = run;
      return run;
    };
    if (!running.current) return start();
    queued.current ??= running.current.then(() => {
      queued.current = null;
      return start();
    });
    return queued.current;
  }, [runSync]);

  // Weitere Abgleichpunkte: Rückkehr in die App (höchstens einmal je Minute) und Wiederkehr der Verbindung.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastStart.current >= SYNC_MIN_GAP_MS) void sync();
    };
    const onOnline = () => void sync();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [sync]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!db.current) return;
      settings.current = { ...(await db.current.getSettings()), ...patch };
      await db.current.saveSettings(settings.current);
      await reload();
    },
    [reload],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      void requestPersistence();
      db.current = injected ?? (await openDb());
      settings.current = await db.current.getSettings();
      if (alive) await reload();
      if (alive) void sync();
    })();
    return () => {
      alive = false;
    };
  }, [injected, reload, sync]);

  return useMemo(() => (state ? { ...state, syncError, sync, updateSettings } : null), [state, syncError, sync, updateSettings]);
}
