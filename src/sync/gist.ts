import type { ReviewEvent } from '../engine/state';
import { validEvent } from '../store/backup';
import type { Db } from '../store/db';

const API = 'https://api.github.com';
const DESCRIPTION = 'spanisch-app sync';
/** Gemeinsame Datei aus der Zeit vor den Geräte-Dateien. Wird nur noch gelesen. */
const LEGACY_FILE = 'spanisch-app-log.json';
const DEVICE_PREFIX = 'spanisch-app-log-';
const isLogFile = (name: string) => name === LEGACY_FILE || (name.startsWith(DEVICE_PREFIX) && name.endsWith('.json'));
const MAX_PAGES = 10;
const REQUEST_TIMEOUT_MS = 15000;

export type SyncResult = { added: number; pushed: number } | { error: string };

/** Fehler mit deutschem Text, der bis zur Rückgabe von syncNow durchgereicht wird. */
class SyncError extends Error {}

const byTime = (a: ReviewEvent, b: ReviewEvent) => a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Vereinigung über id (der erste Treffer gilt), sortiert nach ts und id. */
export function mergeEvents(a: ReviewEvent[], b: ReviewEvent[]): ReviewEvent[] {
  const byId = new Map<string, ReviewEvent>();
  for (const e of [...a, ...b]) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort(byTime);
}

function failure(status: number): SyncError {
  if (status === 401) return new SyncError('Der Token wurde abgelehnt. Bitte einen neuen anlegen.');
  if (status === 403) return new SyncError('Der Token hat nicht das Recht "gist" oder das Limit von GitHub ist erreicht.');
  if (status === 404) return new SyncError('Das Gist wurde nicht gefunden. Prüfe den Token.');
  return new SyncError(`GitHub antwortet mit Fehler ${status}.`);
}

type Remote = { id: string; description?: string; files?: Record<string, { content?: string; truncated?: boolean; raw_url?: string }> };

async function readEvents(file: NonNullable<Remote['files']>[string] | undefined, raw: (url: string) => Promise<Response>): Promise<ReviewEvent[]> {
  if (!file) return [];
  let text = file.content ?? '';
  if (file.truncated && file.raw_url) {
    const res = await raw(file.raw_url);
    if (!res.ok) throw failure(res.status);
    text = await res.text();
  }
  const invalid = new SyncError('Das Gist enthält keine gültigen Daten. Es wurde nicht verändert.');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw invalid;
  }
  const d = data as { version?: unknown; events?: unknown };
  if (typeof data !== 'object' || data === null || d.version !== 1 || !Array.isArray(d.events) || !d.events.every(validEvent)) throw invalid;
  return d.events as ReviewEvent[];
}

/**
 * Gleicht das lokale Protokoll mit dem Gist ab. Ohne Token passiert nichts.
 * Wirft nie; Fehler kommen als { error } mit deutschem Text zurück.
 */
export async function syncNow(db: Db, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<SyncResult> {
  const settings = await db.getSettings();
  const token = settings.gistToken?.trim();
  if (!token) return { added: 0, pushed: 0 };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const request = async (url: string, init: RequestInit = {}): Promise<Response> => {
    try {
      return await fetchImpl(url, { ...init, headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw new SyncError('Keine Verbindung zu GitHub. Der Abgleich wird später erneut versucht.');
    }
  };
  // gist.githubusercontent.com lehnt den CORS-Preflight bei eigenen Headern ab, daher ohne Header.
  const raw = async (url: string): Promise<Response> => {
    try {
      return await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw new SyncError('Keine Verbindung zu GitHub. Der Abgleich wird später erneut versucht.');
    }
  };
  const json = async <T>(res: Response): Promise<T> => {
    if (!res.ok) throw failure(res.status);
    return (await res.json()) as T;
  };
  const body = (events: ReviewEvent[]) => JSON.stringify({ version: 1, events });

  const ownFile = `${DEVICE_PREFIX}${settings.device}.json`;

  try {
    let gistId = settings.gistId;
    let gist: Remote | undefined;
    if (gistId) {
      const res = await request(`${API}/gists/${gistId}`);
      // Gist gelöscht: gemerkte id verwerfen und neu suchen oder anlegen.
      if (res.status === 404) gistId = undefined;
      else gist = await json<Remote>(res);
    }
    if (!gistId) {
      for (let page = 1; page <= MAX_PAGES && !gistId; page++) {
        const list = await json<Remote[]>(await request(`${API}/gists?per_page=100&page=${page}`));
        gistId = list.find((g) => g.description === DESCRIPTION)?.id;
        if (list.length < 100) break;
      }
      if (gistId) gist = await json<Remote>(await request(`${API}/gists/${gistId}`));
    }

    const local = await db.allEvents();
    let added = 0;
    let pushed = 0;

    if (!gistId || !gist) {
      const created = await json<Remote>(
        await request(`${API}/gists`, {
          method: 'POST',
          body: JSON.stringify({ description: DESCRIPTION, public: false, files: { [ownFile]: { content: body(local) } } }),
        }),
      );
      gistId = created.id;
      pushed = local.length;
    } else {
      // Jedes Gerät schreibt nur seine eigene Datei und liest alle, damit gleichzeitige Abgleiche nichts verdrängen.
      let own: ReviewEvent[] = [];
      let others: ReviewEvent[] = [];
      for (const [name, file] of Object.entries(gist.files ?? {})) {
        if (!isLogFile(name)) continue;
        const events = await readEvents(file, raw);
        if (name === ownFile) own = events;
        else others = mergeEvents(others, events);
      }
      const merged = mergeEvents(local, mergeEvents(own, others));
      const localIds = new Set(local.map((e) => e.id));
      const ownIds = new Set(own.map((e) => e.id));
      const otherIds = new Set(others.map((e) => e.id));
      const fresh = merged.filter((e) => !localIds.has(e.id));
      const mine = merged.filter((e) => !otherIds.has(e.id));
      const missing = mine.filter((e) => !ownIds.has(e.id));
      if (fresh.length > 0) await db.addEvents(fresh);
      if (missing.length > 0) {
        await json(await request(`${API}/gists/${gistId}`, { method: 'PATCH', body: JSON.stringify({ files: { [ownFile]: { content: body(mine) } } }) }));
      }
      added = fresh.length;
      pushed = missing.length;
    }

    // Einstellungen frisch lesen, damit Änderungen während des Abgleichs nicht überschrieben werden.
    // Wurde der Token währenddessen gewechselt, gehört die gistId nicht mehr zur neuen Konfiguration.
    const current = await db.getSettings();
    if (current.gistToken?.trim() === token) await db.saveSettings({ ...current, gistId, lastSync: Date.now() });
    return { added, pushed };
  } catch (err) {
    return { error: err instanceof SyncError ? err.message : 'Der Abgleich ist fehlgeschlagen.' };
  }
}
