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

/** Spielt den ersten verfügbaren Ton der Grundlagen und meldet "läuft" oder den Namen des Fehlers. */
async function toneTest(): Promise<string> {
  try {
    const manifest = await loadManifest('01-grundlagen');
    const key = Object.keys(manifest).find((k) => manifest[k].length > 0);
    if (!key) return 'kein Ton gefunden';
    const url = audioUrl('01-grundlagen', key, { speed: manifest[key][0].speed }, manifest);
    if (!url) return 'kein Ton gefunden';
    await new Audio(url).play();
    return 'läuft';
  } catch (err) {
    return (err as { name?: string })?.name || 'Fehler';
  }
}

/** Zustand als Farbe zum Wort: gelungen, gescheitert oder neutral (noch offen, Messwert, erkannter Text). */
export function tone(text: string): 'good' | 'bad' | '' {
  if (/^(ja|ok|läuft)$|^ok,/.test(text)) return 'good';
  if (/^(nein|nicht verfügbar|keine Erkennung|kein Ton gefunden)$|Error$|^Fehler$/.test(text)) return 'bad';
  return '';
}

type Row = { label: string; text: string; run?: () => Promise<string>; neutral?: boolean };

export function Diagnose({ onBack }: { onBack(): void }) {
  const [storage, setStorage] = useState('wird geprüft');
  const [results, setResults] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    storageText().then((t) => alive && setStorage(t));
    return () => {
      alive = false;
    };
  }, []);

  const rows: Row[] = [
    { label: 'Spracherkennung', text: speechSupported() ? 'ja' : 'nein' },
    { label: 'Anzeige als App', text: standalone() ? 'ja' : 'nein', neutral: true },
    { label: 'Ton-Test', text: 'noch nicht geprüft', run: toneTest },
    {
      label: 'Mikrofon-Test',
      text: 'noch nicht geprüft',
      run: async () => {
        const clip = await recordClip(2000);
        return clip ? `ok, ${Math.round(clip.size / 1024)} KB` : 'nicht verfügbar';
      },
    },
    {
      label: 'Erkennungs-Test',
      text: 'noch nicht geprüft',
      run: async () => (await recognize()) ?? 'keine Erkennung',
    },
    { label: 'Speicher', text: storage },
  ];

  const start = async (row: Row) => {
    if (!row.run || busy) return;
    setBusy(row.label);
    setResults((r) => ({ ...r, [row.label]: 'läuft gerade' }));
    const text = await row.run();
    setResults((r) => ({ ...r, [row.label]: text }));
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
        {rows.map((row) => (
          <li key={row.label}>
            <span class="name">{row.label}</span>
            <span class={`result ${row.neutral ? '' : tone(results[row.label] ?? row.text)}`.trim()}>{results[row.label] ?? row.text}</span>
            {row.run && (
              <button type="button" class="btn btn--secondary" disabled={busy !== null} onClick={() => start(row)}>
                Starten
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
