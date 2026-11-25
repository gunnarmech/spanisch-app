import { useState } from 'preact/hooks';
import { exportBackup, importBackup } from '../store/backup';
import { saveBackupFile } from '../store/exportFile';
import type { AppState } from './useAppState';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=spanisch-app';

type Props = { app: AppState; onBack(): void; onDiagnose(): void; onSources?(): void };

function when(ts: number | undefined): string {
  return ts ? new Date(ts).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : 'noch nie';
}

export function Settings({ app, onBack, onDiagnose, onSources }: Props) {
  const { settings } = app;
  const [token, setToken] = useState(settings.gistToken ?? '');
  const [retention, setRetention] = useState(settings.retention);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  /** Ein anderer Token gehört womöglich zu einem anderen Konto, daher wird das gemerkte Gist verworfen. */
  const commitToken = async () => {
    const value = token.trim();
    if (value !== (settings.gistToken ?? '')) await app.updateSettings({ gistToken: value || undefined, gistId: undefined });
  };

  const syncClick = async () => {
    setBusy(true);
    await commitToken();
    const res = await app.sync();
    setNote(
      'error' in res
        ? ''
        : !token.trim()
          ? 'Ohne Token wird nichts abgeglichen.'
          : res.added + res.pushed === 0
            ? 'Alles ist auf dem gleichen Stand.'
            : `Abgeglichen: ${res.added} geholt, ${res.pushed} gesendet.`,
    );
    setBusy(false);
  };

  const download = async () => {
    const blob = await exportBackup(app.db);
    await saveBackupFile(blob, `spanisch-app-sicherung-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const upload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = await importBackup(app.db, file);
      await app.reload();
      setNote(count === 0 ? 'Die Sicherung enthielt nichts Neues.' : `${count} neue Ereignisse eingelesen.`);
    } catch (err) {
      setNote((err as Error).message);
    }
    input.value = '';
  };

  return (
    <>
      <header class="masthead">
        <h1>Einstellungen</h1>
      </header>

      <section class="settings">
        <h2>Abgleich zwischen Geräten</h2>
        <p class="german">
          Mit einem GitHub-Token mit nur dem Recht "gist" legt die App ein privates Gist an und gleicht deinen Lernstand darüber ab.{' '}
          <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer">
            Token anlegen
          </a>
        </p>
        <label for="gist-token">GitHub-Token</label>
        <input
          id="gist-token"
          type="password"
          autocomplete="off"
          spellcheck={false}
          value={token}
          onInput={(e) => setToken((e.currentTarget as HTMLInputElement).value)}
          onBlur={() => void commitToken()}
        />
        <p class="german">Letzter Abgleich: {when(settings.lastSync)}</p>
        <button type="button" class="secondary" disabled={busy} onClick={() => void syncClick()}>
          jetzt abgleichen
        </button>
        {app.syncError && <p class="quiet">{app.syncError}</p>}
        {note && <p class="quiet" role="status">{note}</p>}
      </section>

      <section class="settings">
        <h2>Sicherung</h2>
        <div class="actions">
          <button type="button" class="secondary" onClick={() => void download()}>
            Export
          </button>
          <label class="secondary filebutton">
            Import
            <input type="file" accept="application/json,.json" onChange={(e) => void upload(e)} />
          </label>
        </div>
      </section>

      <section class="settings">
        <h2>Lernen</h2>
        <label for="retention">Ziel-Behaltensquote: {Math.round(retention * 100)} %</label>
        <input
          id="retention"
          type="range"
          min="0.8"
          max="0.95"
          step="0.01"
          value={retention}
          onInput={(e) => setRetention(Number((e.currentTarget as HTMLInputElement).value))}
          onChange={() => void app.updateSettings({ retention })}
        />
        <p class="german">Höher heißt öfter wiederholen, niedriger heißt weniger Aufwand.</p>
      </section>

      <footer class="foot">
        <button type="button" class="link" onClick={onDiagnose}>
          Diagnose
        </button>
        {onSources && (
          <button type="button" class="link" onClick={onSources}>
            Quellen
          </button>
        )}
        <button type="button" class="link" onClick={onBack}>
          Zurück
        </button>
      </footer>
    </>
  );
}
