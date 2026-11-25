import { useEffect, useState } from 'preact/hooks';
import { audioUrl, loadManifest } from '../media/audio';
import { recognize, recordClip, speechSupported } from '../media/speech';

const MB = 1024 * 1024;

function standalone(): boolean {
  const mq = typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;
  return mq || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

async function storageText(): Promise<string> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est || est.usage === undefined || est.quota === undefined) return 'unbekannt';
    return `${Math.round(est.usage / MB)} MB von ${Math.round(est.quota / MB)} MB`;
  } catch {
    return 'unbekannt';
  }
}

export type Tone = 'good' | 'bad' | '';
export type Result = { text: string; tone: Tone };

/** Spielt den ersten verfügbaren Ton der Grundlagen und meldet "läuft" oder den Namen des Fehlers. */
async function toneTest(): Promise<Result> {
  try {
    const manifest = await loadManifest('01-grundlagen');
    const key = Object.keys(manifest).find((k) => manifest[k].length > 0);
    if (!key) return { text: 'kein Ton gefunden', tone: 'bad' };
    const url = audioUrl('01-grundlagen', key, { speed: manifest[key][0].speed }, manifest);
    if (!url) return { text: 'kein Ton gefunden', tone: 'bad' };
    await new Audio(url).play();
    return { text: 'läuft', tone: 'good' };
  } catch (err) {
    return { text: (err as { name?: string })?.name || 'Fehler', tone: 'bad' };
  }
}

type Row = { label: string; text: string; tone?: Tone; run?: () => Promise<Result> };

export function Diagnose({ onBack }: { onBack(): void }) {
  const [storage, setStorage] = useState('wird geprüft');
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    storageText().then((t) => alive && setStorage(t));
    return () => {
      alive = false;
    };
  }, []);

  const rows: Row[] = [
    { label: 'Spracherkennung', text: speechSupported() ? 'ja' : 'nein', tone: speechSupported() ? 'good' : 'bad' },
    { label: 'Anzeige als App', text: standalone() ? 'ja' : 'nein' },
    { label: 'Ton-Test', text: 'noch nicht geprüft', run: toneTest },
    {
      label: 'Mikrofon-Test',
      text: 'noch nicht geprüft',
      run: async () => {
        const clip = await recordClip(2000);
        return clip ? { text: `ok, ${Math.round(clip.size / 1024)} KB`, tone: 'good' } : { text: 'nicht verfügbar', tone: 'bad' };
      },
    },
    {
      label: 'Erkennungs-Test',
      text: 'noch nicht geprüft',
      run: async () => {
        const heard = await recognize();
        return heard ? { text: heard, tone: '' } : { text: 'keine Erkennung', tone: 'bad' };
      },
    },
    { label: 'Speicher', text: storage },
  ];

  const start = async (row: Row) => {
    if (!row.run || busy) return;
    setBusy(row.label);
    setResults((r) => ({ ...r, [row.label]: { text: 'läuft gerade', tone: '' } }));
    const result = await row.run();
    setResults((r) => ({ ...r, [row.label]: result }));
    setBusy(null);
  };

  return (
    <>
      <button type="button" class="link back" onClick={onBack}>
        Zurück
      </button>
      <header class="masthead">
        <h1>Diagnose</h1>
        <p>Zeigt, was dieses Gerät kann. Ein Screenshot reicht.</p>
      </header>
      <ul class="diagnose">
        {rows.map((row) => {
          const shown = results[row.label] ?? { text: row.text, tone: row.tone ?? '' };
          return (
            <li key={row.label}>
              <span class="name">{row.label}</span>
              <span class={`result ${shown.tone}`.trim()}>{shown.text}</span>
              {row.run && (
                <button type="button" class="btn btn--secondary" disabled={busy !== null} onClick={() => start(row)}>
                  Starten
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
