import { useEffect, useRef, useState } from 'preact/hooks';
import type { Item, Situation, WordItem } from '../content/types';
import type { CardState } from '../engine/state';
import { audioUrl, loadManifest, type Manifest } from '../media/audio';
import { AudioButton } from './tasks/AudioButton';
import { ChoiceBase } from './tasks/ChoiceBase';
import { choiceOptions } from './tasks/distractors';
import type { AppState } from './useAppState';

const COUNT = 150;
/** Fragen je Block; danach gibt es einen Zwischenstand. */
export const BLOCK = 30;
/** Richtig und schneller als diese Zeit (Millisekunden) heißt: sicher bekannt. */
const QUICK_MS = 4000;
/** Situation mit der Chile-Ebene: nur Verstehen, wird nicht eingestuft. */
const CHILE = '09-chile';

export type Entry = { item: WordItem; situationId: string };

/**
 * Wörter und Wendungen ohne Lernstand, ohne `produce: false`, ohne Chile-Ebene, nach Häufigkeit.
 * Items ohne freqRank kommen danach, in Dateireihenfolge. Die Sortierung ist stabil.
 * Items mit Lernstand werden nie angeboten, damit `known` nie auf eine laufende Karte geschrieben wird.
 */
export function placementItems(situations: Situation[], states: Map<string, CardState>, count = COUNT): Entry[] {
  const all: Entry[] = situations
    .filter((s) => s.id !== CHILE)
    .flatMap((s) =>
      s.items
        .filter(
          (it): it is WordItem => (it.kind === 'word' || it.kind === 'phrase') && it.produce !== false && !states.has(it.id),
        )
        .map((item) => ({ item, situationId: s.id })),
    );
  const rank = (e: Entry) => e.item.freqRank ?? Infinity;
  return all
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (rank(a.e) === rank(b.e) ? a.i - b.i : rank(a.e) < rank(b.e) ? -1 : 1))
    .slice(0, count)
    .map(({ e }) => e);
}

/** Angebot beim allerersten Start: noch keine Ereignisse und weder beendet noch übersprungen. */
export function PlacementOffer({ app, onStart }: { app: AppState; onStart(): void }) {
  if (app.settings.placementDone || app.states.size > 0 || app.heard.size > 0) return null;
  return (
    <section class="placement-offer">
      <h2>Kurz einstufen?</h2>
      <p class="german">
        Mit kurzen Fragen in Blöcken merkt sich die App, was du schon kannst, und fragt es später nicht mehr als Neues ab.
      </p>
      <div class="actions">
        <button type="button" class="btn btn--secondary" onClick={onStart}>
          kurz einstufen
        </button>
        <button type="button" class="link" onClick={() => void app.updateSettings({ placementDone: true })}>
          überspringen
        </button>
      </div>
    </section>
  );
}

type QuestionProps = {
  app: AppState;
  entry: Entry;
  manifest: Manifest | undefined;
  onAnswer(correct: boolean, known: boolean): void;
  onNext(): void;
};

function Question({ app, entry, manifest, onAnswer, onNext }: QuestionProps) {
  const [options] = useState(() => choiceOptions(entry.item as Item, app.situations, entry.situationId));
  const { situationId, item } = entry;
  const pick = { speed: app.settings.voiceSpeedNew } as const;
  const url = manifest
    ? (audioUrl(situationId, item.id, pick, manifest) ?? audioUrl(situationId, item.id, { speed: 'normal' }, manifest))
    : null;
  return (
    <ChoiceBase
      question={
        <>
          <p class="ask">Was bedeutet das?</p>
          {url ? <AudioButton url={url} spaceKey /> : <p class="spanish">{item.es}</p>}
        </>
      }
      options={options}
      correct={item.de}
      onAnswered={(r) => onAnswer(r.verdict === 'correct', r.verdict === 'correct' && r.ms < QUICK_MS)}
      onDone={onNext}
    />
  );
}

/** Zwischenstand nach einem Block, ohne Zahl. `stop`: zu wenig richtig, der Test endet hier. */
export function BlockPause({ stop, onContinue, onQuit }: { stop: boolean; onContinue(): void; onQuit(): void }) {
  return (
    <>
      <header class="masthead">
        <h1>Zwischenstand</h1>
      </header>
      <div class="progress" aria-hidden="true">
        <div />
      </div>
      <section class="block">
        {stop ? (
          <>
            <p class="german">Hier reicht es. Der Rest kommt beim normalen Lernen.</p>
            <div class="actions">
              <button type="button" class="btn btn--secondary" onClick={onQuit}>
                fertig
              </button>
            </div>
          </>
        ) : (
          <>
            <p class="german">Ein Block ist geschafft. Du kannst weitermachen oder hier aufhören, das Bisherige bleibt gemerkt.</p>
            <div class="actions">
              <button type="button" class="btn btn--secondary" onClick={onContinue}>
                weiter
              </button>
              <button type="button" class="link" onClick={onQuit}>
                aufhören
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}

/**
 * Einstufungstest in Blöcken: Hören plus Auswahl. Nur richtig und schnell erzeugt `known`, sonst nichts.
 * Nach jedem Block gibt es einen Zwischenstand ohne Zahl. Weniger als ein Viertel richtig im Block beendet den Test.
 */
export function Placement({ app, onFinish }: { app: AppState; onFinish(): void }) {
  const [entries] = useState(() => placementItems(app.situations, app.states));
  const [index, setIndex] = useState(0);
  const [rightInBlock, setRightInBlock] = useState(0);
  const [pause, setPause] = useState<'between' | 'stop' | null>(null);
  const [manifests, setManifests] = useState<Record<string, Manifest>>({});
  const finished = useRef(false);

  useEffect(() => {
    let alive = true;
    const ids = [...new Set(entries.map((e) => e.situationId))];
    void Promise.all(ids.map(async (id) => [id, await loadManifest(id)] as const)).then((list) => {
      if (alive) setManifests(Object.fromEntries(list));
    });
    return () => {
      alive = false;
    };
  }, [entries]);

  const finish = async () => {
    if (finished.current) return;
    finished.current = true;
    await app.updateSettings({ placementDone: true });
    onFinish();
  };

  const entry = entries[index];
  useEffect(() => {
    if (!entry) void finish();
  });

  const next = () => {
    const done = index + 1;
    if (done % BLOCK === 0 && done < entries.length) {
      setPause(rightInBlock * 4 < BLOCK ? 'stop' : 'between');
      setRightInBlock(0);
    }
    setIndex(done);
  };

  if (pause) return <BlockPause stop={pause === 'stop'} onContinue={() => setPause(null)} onQuit={() => void finish()} />;

  if (!entry) return null;
  const blockStart = index - (index % BLOCK);
  const blockLength = Math.min(BLOCK, entries.length - blockStart);
  const inBlock = index - blockStart;
  return (
    <>
      <header class="masthead">
        <h1>Einstufung</h1>
      </header>
      <div
        class="progress"
        role="progressbar"
        aria-label="Fortschritt im Block"
        aria-valuemin={0}
        aria-valuemax={blockLength}
        aria-valuenow={inBlock}
      >
        <div style={{ transform: `scaleX(${inBlock / blockLength})` }} />
      </div>
      <Question
        key={index}
        app={app}
        entry={entry}
        manifest={manifests[entry.situationId]}
        onAnswer={(correct, known) => {
          if (correct) setRightInBlock((n) => n + 1);
          if (known) void app.record({ kind: 'known', cardId: entry.item.id });
        }}
        onNext={next}
      />
      <button type="button" class="link leave" onClick={() => void finish()}>
        Beenden
      </button>
    </>
  );
}
