import type { ReviewEvent } from '../engine/state';
import type { Db, ErrorReport } from './db';

const INVALID = 'Keine gültige Sicherung';

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export function validEvent(x: unknown): x is ReviewEvent {
  return (
    isObj(x) &&
    typeof x.id === 'string' && x.id !== '' &&
    typeof x.cardId === 'string' && x.cardId !== '' &&
    typeof x.ts === 'number' && Number.isFinite(x.ts) &&
    (x.kind === 'review' || x.kind === 'known' || x.kind === 'heard')
  );
}

function validReport(x: unknown): x is ErrorReport {
  return (
    isObj(x) &&
    typeof x.id === 'string' && x.id !== '' &&
    typeof x.itemId === 'string' &&
    typeof x.ts === 'number' &&
    typeof x.text === 'string'
  );
}

/** Sicherung als JSON. Einstellungen und damit der Gist-Token sind nie enthalten. */
export async function exportBackup(db: Db): Promise<Blob> {
  const [events, reports] = await Promise.all([db.allEvents(), db.allReports()]);
  return new Blob([JSON.stringify({ version: 1, events, reports })], { type: 'application/json' });
}

/** Gibt die Anzahl neuer Ereignisse zurück. Wirft bei ungültiger Datei, bevor etwas geschrieben wird. */
export async function importBackup(db: Db, file: Blob): Promise<number> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error(INVALID);
  }
  if (
    !isObj(data) || data.version !== 1 ||
    !Array.isArray(data.events) || !data.events.every(validEvent) ||
    !Array.isArray(data.reports) || !data.reports.every(validReport)
  ) {
    throw new Error(INVALID);
  }
  const events = data.events as ReviewEvent[];
  const known = new Set((await db.allEvents()).map((e) => e.id));
  const fresh = events.filter((e, i) => !known.has(e.id) && events.findIndex((x) => x.id === e.id) === i);
  await db.addEvents(fresh);
  for (const r of data.reports as ErrorReport[]) await db.addReport(r);
  return fresh.length;
}
