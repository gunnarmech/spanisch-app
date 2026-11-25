export type VoiceId = 'cl-f' | 'cl-m' | 'mx-f' | 'mx-m' | 'co-f' | 'co-m';
export type Speed = 'slow' | 'normal' | 'fast';
export type Manifest = { [key: string]: { voice: VoiceId; speed: Speed; hash?: string }[] };

export const AUDIO_CACHE = 'audio-v1';

const dir = (situationId: string) => `${import.meta.env.BASE_URL}audio/${situationId}`;
const fileUrl = (situationId: string, key: string, voice: VoiceId, speed: Speed) =>
  `${dir(situationId)}/${key}-${voice}-${speed}.mp3`;

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
  return fileUrl(situationId, key, chosen.voice, chosen.speed);
}

let shared: HTMLAudioElement | null = null;

/** Muss aus einer Nutzergeste heraus aufgerufen werden. Fehler werden geloggt, nicht geworfen. */
export async function play(url: string): Promise<void> {
  try {
    shared ??= new Audio();
    shared.pause();
    shared.src = url;
    shared.currentTime = 0;
    await shared.play();
  } catch (err) {
    console.warn('Audio konnte nicht abgespielt werden', url, err);
  }
}

/**
 * Spielt Töne nacheinander auf dem gemeinsamen Element und wartet jeweils auf das Ende.
 * Muss aus einer Nutzergeste heraus aufgerufen werden; das gemeinsame Element bleibt danach entsperrt (iOS).
 * Fehler werden geloggt, nicht geworfen.
 */
export async function playSequence(urls: string[]): Promise<void> {
  shared ??= new Audio();
  const el = shared;
  for (const url of urls) {
    try {
      el.pause();
      el.src = url;
      el.currentTime = 0;
      const ended = new Promise<void>((resolve) => {
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
    entries.map((e) => fileUrl(situationId, key, e.voice, e.speed)),
  );
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const queue = [...urls];
    const worker = async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        try {
          if (await cache.match(url)) continue;
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res.clone());
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
