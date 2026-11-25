import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { loadSituations } from '../content/load';
import type { Situation } from '../content/types';
import { dialogsHeard, newEvent, replay, type CardState, type ReviewEvent } from '../engine/state';
import { openDb, requestPersistence, type Db, type Settings } from '../store/db';

type Distribute<T> = T extends unknown ? Omit<T, 'id' | 'ts' | 'device'> : never;
export type AppEvent = Distribute<ReviewEvent>;

export type AppState = {
  situations: Situation[];
  states: Map<string, CardState>;
  /** Zeitpunkt des letzten Anhörens je Dialog-id. */
  heard: Map<string, number>;
  settings: Settings;
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

let situationsCache: Situation[] | undefined;

/** Lädt Inhalt, Ereignisprotokoll und Einstellungen, spielt das Protokoll ab. Null, solange geladen wird. */
export function useAppState(injected?: Db): AppState | null {
  const [state, setState] = useState<AppState | null>(null);
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
      reload,
      async record(e) {
        await current.addEvents([newEvent(e, cfg.device)]);
        await reload();
      },
      report: (itemId, text) => current.addReport({ id: crypto.randomUUID(), itemId, ts: Date.now(), text }),
    });
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      void requestPersistence();
      db.current = injected ?? (await openDb());
      settings.current = await db.current.getSettings();
      if (alive) await reload();
    })();
    return () => {
      alive = false;
    };
  }, [injected, reload]);

  return state;
}
