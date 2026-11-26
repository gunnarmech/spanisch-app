import { useState } from 'preact/hooks';
import { situationCoverage } from '../engine/coverage';
import { PlacementOffer } from './Placement';
import { headerPhoto, photoFor } from './photos';
import type { AppState } from './useAppState';

type Props = {
  app: AppState | null;
  onStart(focusSituationId?: string): void;
  onDiagnose(): void;
  onSettings(): void;
  onProgress?(): void;
  onPlacement?(): void;
};

/** Der Eintritt läuft einmal je App-Start. Bei Rückkehr aus einer Runde bleibt alles in Ruhe. */
let entered = false;

export function Home({ app, onStart, onDiagnose, onSettings, onProgress, onPlacement }: Props) {
  const now = Date.now();
  // Einmal beim Einhängen festlegen, damit ein späteres Neuzeichnen (Daten geladen) den Eintritt nicht abbricht.
  const [playEnter] = useState(() => {
    const first = !entered;
    entered = true;
    return first;
  });
  return (
    <>
      <section class="hero" data-enter={playEnter ? '' : 'off'}>
        <h1>Spanisch für Chile</h1>
        <p class="lead">Ein paar Minuten am Tag.</p>
        <img
          class="hero-photo"
          src={headerPhoto.src}
          srcset={headerPhoto.srcset}
          sizes="(min-width: 1024px) 32rem, 100vw"
          width={headerPhoto.width}
          height={headerPhoto.height}
          alt={headerPhoto.alt}
          loading="eager"
          data-enter-media
        />
        {app && onPlacement && <PlacementOffer app={app} onStart={onPlacement} />}
        {app && (
          <button type="button" class="btn btn--primary start" onClick={() => onStart()}>
            Heute lernen
          </button>
        )}
      </section>
      {app && (
        <div class="choose">
          <h2 class="section">Oder eine Situation wählen</h2>
          <ul class="situations">
            {app.situations.map((s) => {
              const hasDialog = s.items.some((it) => it.kind === 'dialog');
              const share = situationCoverage(s, app.states, now, app.situations);
              const pct = Math.round(share * 100);
              const photo = photoFor(s.id);
              return (
                <li key={s.id} class={`situation row-link${photo ? '' : ' situation--ohne-bild'}`}>
                  {photo && (
                    <span class="thumb">
                      {/* Schmuck: der Nachweis steht auf der Quellenseite, der Name der Zeile im Knopf */}
                      <img src={photo.src} width={photo.width} height={photo.height} alt="" loading="lazy" />
                    </span>
                  )}
                  <h3 class="situation-item">
                    <button
                      type="button"
                      class="situation-link"
                      aria-describedby={`understand-${s.id}`}
                      onClick={() => onStart(s.id)}
                    >
                      <span class="name">{s.title}</span>
                    </button>
                  </h3>
                  {hasDialog ? (
                    <>
                      <span class="understand" id={`understand-${s.id}`}>
                        Du verstehst etwa <span class="num">{pct}</span> % der Dialoge
                      </span>
                      <span class="meter" aria-hidden="true">
                        <span style={{ width: `${pct}%` }} />
                      </span>
                    </>
                  ) : (
                    <span class="understand" id={`understand-${s.id}`}>
                      Noch keine Dialoge
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <footer class="foot">
        <button type="button" class="link" onClick={onDiagnose}>
          Diagnose
        </button>
        {app && onProgress && (
          <button type="button" class="link" onClick={onProgress}>
            Fortschritt
          </button>
        )}
        {app && (
          <button type="button" class="link" onClick={onSettings}>
            Einstellungen
          </button>
        )}
      </footer>
    </>
  );
}
