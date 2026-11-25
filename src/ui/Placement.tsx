import { useEffect, useRef, useState } from 'preact/hooks';
import type { Item, Situation, WordItem } from '../content/types';
import { audioUrl, loadManifest, type Manifest } from '../media/audio';
import { AudioButton } from './tasks/AudioButton';
import { ChoiceBase } from './tasks/ChoiceBase';
import { choiceOptions } from './tasks/distractors';
import type { AppState } from './useAppState';

const COUNT = 40;
/** Richtig und schneller als diese Zeit (Millisekunden) heißt: sicher bekannt. */
const QUICK_MS = 4000;

type Entry = { item: WordItem; situationId: string };

/**
 * Die ersten 40 Wörter und Wendungen nach Häufigkeit. Items ohne freqRank kommen danach, in Dateireihenfolge.
 * Die Sortierung ist stabil, Gleichstand bleibt in Dateireihenfolge.
 */
export function placementItems(situations: Situation[]): Entry[] {
  const all: Entry[] = situations.flatMap((s) =>
    s.items
      .filter((it): it is WordItem => it.kind === 'word' || it.kind === 'phrase')
      .map((item) => ({ item, situationId: s.id })),
  );
  const rank = (e: Entry) => e.item.freqRank ?? Infinity;
  return all
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (rank(a.e) === rank(b.e) ? a.i - b.i : rank(a.e) < rank(b.e) ? -1 : 1))
    .slice(0, COUNT)
    .map(({ e }) => e);
}

/** Angebot beim allerersten Start: noch keine Ereignisse und weder beendet noch übersprungen. */
export function PlacementOffer({ app, onStart }: { app: AppState; onStart(): void }) {
  if (app.settings.placementDone || app.states.size > 0 || app.heard.size > 0) return null;
  return (
    <section class="placement-offer">
      <h2>Kurz einstufen?</h2>
      <p class="german">
        Mit etwa 40 kurzen Fragen merkt sich die App, was du schon kannst, und fragt es später nicht mehr als Neues ab.
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
  onAnswer(known: boolean): void;
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
          {url ? <AudioButton url={url} primary /> : <p class="spanish">{item.es}</p>}
        </>
      }
      options={options}
      correct={item.de}
      onAnswered={(r) => onAnswer(r.verdict === 'correct' && r.ms < QUICK_MS)}
      onDone={onNext}
    />
  );
}

/** Kurzer Einstufungstest: Hören plus Auswahl. Nur richtig und schnell erzeugt `known`, sonst nichts. */
export function Placement({ app, onFinish }: { app: AppState; onFinish(): void }) {
  const [entries] = useState(() => placementItems(app.situations));
  const [index, setIndex] = useState(0);
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

  if (!entry) return null;
  return (
    <>
      <header class="masthead">
        <h1>Kurze Einstufung</h1>
        <p>
          Frage {index + 1} von {entries.length}
        </p>
      </header>
      <Question
        key={index}
        app={app}
        entry={entry}
        manifest={manifests[entry.situationId]}
        onAnswer={(known) => {
          if (known) void app.record({ kind: 'known', cardId: entry.item.id });
        }}
        onNext={() => setIndex(index + 1)}
      />
      <footer class="foot">
        <button type="button" class="link" onClick={() => void finish()}>
          Beenden
        </button>
      </footer>
    </>
  );
}
