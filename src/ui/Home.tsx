import { situationCoverage } from '../engine/coverage';
import type { AppState } from './useAppState';

type Props = { app: AppState | null; onStart(focusSituationId?: string): void; onDiagnose(): void; onSettings(): void };

export function Home({ app, onStart, onDiagnose, onSettings }: Props) {
  const now = Date.now();
  return (
    <>
      <header class="masthead">
        <h1>Spanisch für Chile</h1>
        <p>Ein paar Minuten am Tag.</p>
      </header>
      {app && (
        <>
          <button type="button" class="primary start" onClick={() => onStart()}>
            Heute lernen
          </button>
          <h2 class="section">Oder eine Situation wählen</h2>
          <ul class="situations">
            {app.situations.map((s) => {
              const hasDialog = s.items.some((it) => it.kind === 'dialog');
              const share = situationCoverage(s, app.states, now, app.situations);
              const pct = Math.round(share * 100);
              return (
                <li key={s.id}>
                  <button type="button" class="situation" onClick={() => onStart(s.id)}>
                    <span class="name">{s.title}</span>
                    {hasDialog ? (
                      <>
                        <span class="understand">du verstehst etwa {pct} % der Dialoge</span>
                        <span class="meter" aria-hidden="true">
                          <span style={{ width: `${pct}%` }} />
                        </span>
                      </>
                    ) : (
                      <span class="understand">noch keine Dialoge</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <footer class="foot">
        <button type="button" class="link" onClick={onDiagnose}>
          Diagnose
        </button>
        {app && (
          <button type="button" class="link" onClick={onSettings}>
            Einstellungen
          </button>
        )}
      </footer>
    </>
  );
}
