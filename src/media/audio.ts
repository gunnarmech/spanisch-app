export type VoiceId = 'cl-f' | 'cl-m' | 'mx-f' | 'mx-m' | 'co-f' | 'co-m';
export type Speed = 'slow' | 'normal' | 'fast';
export type Manifest = { [key: string]: { voice: VoiceId; speed: Speed; hash?: string }[] };

export const AUDIO_CACHE = 'audio-v1';

const dir = (situationId: string) => `${import.meta.env.BASE_URL}audio/${situationId}`;
/** Der Hash steht als Query in der URL: nach einer Textkorrektur ist es ein neuer Cache-Schlüssel. */
const fileUrl = (situationId: string, key: string, voice: VoiceId, speed: Speed, hash?: string) =>
  `${dir(situationId)}/${key}-${voice}-${speed}.mp3${hash ? `?h=${hash}` : ''}`;

export async function loadManifest(situationId: string): Promise<Manifest> {
  try {
    const res = await fetch(`${dir(situationId)}/manifest.json`);
    if (!res.ok) return {};
    return (await res.json()) as Manifest;
  } catch {
    return {};
  }
}

export function audioUrl(
  situationId: string,
  key: string,
  pick: { voice?: VoiceId; speed: Speed; preferChile?: boolean },
  manifest: Manifest,
): string | null {
  const entries = (manifest[key] ?? []).filter((e) => e.speed === pick.speed);
  if (entries.length === 0) return null;
  const chosen =
    (pick.voice && entries.find((e) => e.voice === pick.voice)) ||
    (pick.preferChile && entries.find((e) => e.voice.startsWith('cl-'))) ||
    entries[0];
  return fileUrl(situationId, key, chosen.voice, chosen.speed, chosen.hash);
}

let shared: HTMLAudioElement | null = null;

/** `ok`: läuft. `blocked`: der Browser lässt es (noch) nicht zu. `failed`: Laden oder Abspielen ist gescheitert (404, Netzabbruch). */
export type PlayResult = 'ok' | 'blocked' | 'failed';

/** Muss aus einer Nutzergeste heraus aufgerufen werden. Fehler werden geloggt, nicht geworfen. */
export async function play(url: string): Promise<PlayResult> {
  try {
    shared ??= new Audio();
    shared.pause();
    shared.src = url;
    shared.currentTime = 0;
    await shared.play();
    return 'ok';
  } catch (err) {
    console.warn('Audio konnte nicht abgespielt werden', url, err);
    // Autoplay-Sperre und ein durch neues Laden unterbrochenes Abspielen sind keine kaputte Datei.
    const name = (err as { name?: string } | null)?.name;
    return name === 'NotAllowedError' || name === 'AbortError' ? 'blocked' : 'failed';
  }
}

/**
 * Spielt Töne nacheinander auf dem gemeinsamen Element und wartet jeweils auf das Ende.
 * Muss aus einer Nutzergeste heraus aufgerufen werden; das gemeinsame Element bleibt danach entsperrt (iOS).
 * Fehler werden geloggt, nicht geworfen.
 */
let sequence = 0;
let release: (() => void) | null = null;

/** Hält eine laufende Folge an (zum Beispiel beim Verlassen der Aufgabe). */
export function stopAudio(): void {
  sequence++;
  shared?.pause();
  release?.();
}

export async function playSequence(urls: string[]): Promise<void> {
  shared ??= new Audio();
  const el = shared;
  const mine = ++sequence;
  release?.();
  for (const url of urls) {
    if (mine !== sequence) return;
    try {
      el.pause();
      el.src = url;
      el.currentTime = 0;
      const ended = new Promise<void>((resolve) => {
        release = resolve;
        el.addEventListener('ended', () => resolve(), { once: true });
        el.addEventListener('error', () => resolve(), { once: true });
      });
      await el.play();
      await ended;
    } catch (err) {
      console.warn('Audio konnte nicht abgespielt werden', url, err);
      return;
    }
  }
}

export async function prefetchSituation(situationId: string, manifest: Manifest): Promise<void> {
  if (typeof caches === 'undefined') return;
  const urls = Object.entries(manifest).flatMap(([key, entries]) =>
    entries.map((e) => fileUrl(situationId, key, e.voice, e.speed, e.hash)),
  );
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const queue = [...urls];
    const worker = async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        try {
          if (await cache.match(url)) continue;
          const res = await fetch(url);
          // Nur vollständige 200er: die Workbox-Route (rangeRequests) schneidet daraus die 206-Antworten.
          if (res.ok && res.status === 200) await cache.put(url, res.clone());
        } catch (err) {
          console.warn('Audio-Vorabruf fehlgeschlagen', url, err);
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } catch (err) {
    console.warn('Audio-Cache nicht verfügbar', err);
  }
}

/** Die Situationen der Runde plus die nächste in der Reihenfolge der Situationen, ohne Doppelte. */
export function prefetchTargets(planned: string[], allIds: string[]): string[] {
  const out = [...new Set(planned)];
  const last = Math.max(-1, ...out.map((id) => allIds.indexOf(id)));
  const next = allIds[last + 1];
  if (last >= 0 && next && !out.includes(next)) out.push(next);
  return out;
}

/** Lädt im Hintergrund die Töne der Situationen in den Cache. Nur mit Netz, Fehler bleiben still. */
export async function prefetchSituations(ids: string[]): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  for (const id of ids) {
    try {
      await prefetchSituation(id, await loadManifest(id));
    } catch {
      // still: Vorabruf ist nur ein Gewinn
    }
  }
}
