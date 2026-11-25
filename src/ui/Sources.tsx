import { useEffect, useState } from 'preact/hooks';
import type { ErrorReport } from '../store/db';
import { allPhotos } from './photos';
import type { AppState } from './useAppState';

const FREQ_URL = 'https://github.com/hermitdave/FrequencyWords';
const DAMER_URL = 'https://www.asale.org/damer';

function stamp(ts: number): string {
  return new Date(ts).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

export function reportsAsText(reports: ErrorReport[]): string {
  return reports.map((r) => `${stamp(r.ts)}\t${r.itemId}\t${r.text}`).join('\n');
}

/** Kopiert in die Zwischenablage, sonst über ein Textfeld und den Kopierbefehl. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export function Sources({ app, onBack }: { app: AppState; onBack(): void }) {
  const [reports, setReports] = useState<ErrorReport[] | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    void app.db.allReports().then((list) => {
      if (alive) setReports([...list].sort((a, b) => a.ts - b.ts));
    });
    return () => {
      alive = false;
    };
  }, [app.db]);

  const copy = async () => setNote((await copyText(reportsAsText(reports ?? []))) ? 'Kopiert.' : 'Kopieren hat nicht geklappt.');

  return (
    <>
      <button type="button" class="link back" onClick={onBack}>
        Zurück
      </button>
      <header class="masthead">
        <h1>Quellen</h1>
      </header>

      <section class="block">
        <h2>Lizenzen</h2>
        <ul class="plain">
          <li>Der Code der App steht unter der MIT-Lizenz.</li>
          <li>Die Inhalte (Wörter, Wendungen, Dialoge, Erklärungen) stehen unter CC BY-SA 4.0.</li>
          <li>
            <span>
              Die Häufigkeitsliste stammt aus{' '}
              <a href={FREQ_URL} target="_blank" rel="noopener noreferrer">
                FrequencyWords
              </a>{' '}
              (CC BY-SA 4.0).
            </span>
          </li>
          <li>
            <span>
              Die Abstände der Wiederholungen berechnet <span style={{ whiteSpace: 'nowrap' }}>ts-fsrs</span> (MIT).
            </span>
          </li>
          <li>Die Stimmen sind erzeugt mit edge-tts.</li>
          <li>
            <span>
              Die Hinweise zum Sprachgebrauch in Chile stützen sich auf das{' '}
              <a href={DAMER_URL} target="_blank" rel="noopener noreferrer">
                Diccionario de americanismos
              </a>{' '}
              der Asociación de Academias de la Lengua Española (ASALE).
            </span>
          </li>
        </ul>
      </section>

      <section class="block">
        <h2>Fotos</h2>
        <ul class="plain">
          {allPhotos.map((p) => (
            <li key={p.page}>
              <span>
                {p.alt}:{' '}
                <a class="link" href={p.page} target="_blank" rel="noopener noreferrer">
                  {p.author}
                </a>
                ,{' '}
                <a class="link" href={p.licenseUrl} target="_blank" rel="noopener noreferrer">
                  {p.license}
                </a>
                , {p.edit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section class="block">
        <h2>Fehlermeldungen</h2>
        {reports === null ? null : reports.length === 0 ? (
          <p class="german">Noch keine Meldungen.</p>
        ) : (
          <>
            <ul class="plain">
              {reports.map((r) => (
                <li key={r.id}>
                  {stamp(r.ts)}, {r.itemId}: {r.text}
                </li>
              ))}
            </ul>
            <button type="button" class="btn btn--secondary" onClick={() => void copy()}>
              als Text kopieren
            </button>
            {note && (
              <p class="quiet" role="status">
                {note}
              </p>
            )}
          </>
        )}
      </section>

    </>
  );
}
