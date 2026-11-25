import { isSure, situationCoverage } from '../engine/coverage';
import type { AppState } from './useAppState';

/** Ruhige Übersicht: Verständnis je Situation und die Zahl sicher bekannter Wörter. Nie Rückstand oder Fälligkeit. */
export function Progress({ app, onBack }: { app: AppState; onBack(): void }) {
  const now = Date.now();
  const sureWords = app.situations
    .flatMap((s) => s.items)
    .filter((it) => (it.kind === 'word' || it.kind === 'phrase') && isSure(app.states.get(it.id), now)).length;
  return (
    <>
      <button type="button" class="link back" onClick={onBack}>
        Zurück
      </button>
      <header class="masthead">
        <h1>Fortschritt</h1>
        <p>Gesamt, sicher bekannte Wörter und Wendungen: {sureWords}</p>
      </header>
      <ul class="rows">
        {app.situations.map((s) => {
          const hasDialog = s.items.some((it) => it.kind === 'dialog');
          const pct = Math.round(situationCoverage(s, app.states, now, app.situations) * 100);
          return (
            <li key={s.id}>
              <div class="row">
                <span class="name">{s.title}</span>
                {hasDialog ? (
                  <>
                    <span class="understand">
                      du verstehst etwa <span class="num">{pct}</span> % der Dialoge
                    </span>
                    <span class="meter" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                  </>
                ) : (
                  <span class="understand">noch keine Dialoge</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
