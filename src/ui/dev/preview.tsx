import { useEffect, useState } from 'preact/hooks';
import type { Item } from '../../content/types';
import type { Task, TaskForm } from '../../engine/round';
import { openDb } from '../../store/db';
import { Diagnose } from '../Diagnose';
import { Home } from '../Home';
import { BlockPause, Placement } from '../Placement';
import { Progress } from '../Progress';
import { component } from '../Round';
import { ClipTask } from '../tasks/ClipTask';
import { RoundEnd } from '../RoundEnd';
import { Settings } from '../Settings';
import { Sources } from '../Sources';
import { RoundEnvContext } from '../tasks/env';
import { useAppState, type AppState } from '../useAppState';

const noop = () => {};
const FORMS: TaskForm[] = ['intro', 'choice', 'listen', 'type', 'speak', 'grammar', 'pressure', 'dialog'];

/** Erstes Item, das zur Aufgabenart passt, samt Situation. */
function pick(app: AppState, form: TaskForm): { task: Task; item: Item } | null {
  const fits = (it: Item): boolean => {
    if (form === 'dialog') return it.kind === 'dialog';
    if (form === 'grammar') return it.kind === 'grammar';
    if (form === 'listen') return it.kind === 'pair';
    return it.kind === 'word' || it.kind === 'phrase' || it.kind === 'sentence';
  };
  for (const s of app.situations) {
    const item = s.items.find(fits);
    if (!item) continue;
    const cardId = item.kind === 'grammar' ? `${item.id}#0` : item.id;
    return { item, task: { cardId, itemId: item.id, situationId: s.id, form, isNew: form === 'intro' } };
  }
  return null;
}

/** Alle zeige-Werte; Screen und Preview lesen dieselbe Liste. */
const KNOWN = ['start', 'start-neu', 'einstufung', 'einstufung-pause', 'einstufung-ende', 'fortschritt', 'einstellungen', 'diagnose', 'quellen', 'rundenende', 'aufgabe'] as const;
type Zeige = (typeof KNOWN)[number];

// Nur im Dev-Build erreichbar (main.tsx lädt dieses Modul dynamisch hinter import.meta.env.DEV).
function Screen({ app, params }: { app: AppState; params: URLSearchParams }) {
  const zeige = params.get('zeige') as Zeige;
  switch (zeige) {
    case 'start':
      return <Home app={{ ...app, settings: { ...app.settings, placementDone: true } }} onStart={noop} onDiagnose={noop} onSettings={noop} onProgress={noop} onPlacement={noop} />;
    case 'start-neu':
      return <Home app={{ ...app, settings: { ...app.settings, placementDone: false } }} onStart={noop} onDiagnose={noop} onSettings={noop} onProgress={noop} onPlacement={noop} />;
    case 'einstufung':
      return <Placement app={app} onFinish={noop} />;
    case 'einstufung-pause':
      return <BlockPause stop={false} onContinue={noop} onQuit={noop} />;
    case 'einstufung-ende':
      return <BlockPause stop onContinue={noop} onQuit={noop} />;
    case 'fortschritt':
      return <Progress app={app} onBack={noop} />;
    case 'einstellungen':
      return <Settings app={app} onBack={noop} onDiagnose={noop} onSources={noop} />;
    case 'diagnose':
      return <Diagnose onBack={noop} />;
    case 'quellen':
      return <Sources app={app} onBack={noop} />;
    case 'rundenende': {
      const first = pick(app, 'choice');
      const tasks = first ? [{ ...first.task, isNew: true }] : [];
      return <RoundEnd app={app} tasks={tasks} startCoverage={new Map()} onExit={noop} onAgain={noop} />;
    }
    case 'aufgabe': {
      const typ = params.get('typ') as TaskForm | null;
      if (typ === 'clip') {
        const clips = [
          { id: 'c-1', es: 'oye, cachai que llegó la micro', de: 'Hör mal, weißt du, dass der Bus gekommen ist', gender: 'f' as const, source: 'Vorschau' },
          { id: 'c-2', es: 'ya po, vamos al tiro', de: 'Na klar, wir gehen sofort los', gender: 'm' as const, source: 'Vorschau' },
          { id: 'c-3', es: 'qué fome está el día', de: 'Wie langweilig der Tag ist', gender: 'f' as const, source: 'Vorschau' },
        ];
        return <ClipTask clip={clips[0]} clips={clips} url={`${import.meta.env.BASE_URL}audio/01-grundlagen/d-conocerse-1-cl-f-normal.mp3`} onDone={noop} />;
      }
      const found = typ && FORMS.includes(typ) ? pick(app, typ) : null;
      if (!found) return null;
      const Current = component(found.task, found.item);
      const env = { situations: app.situations, urlFor: () => `${import.meta.env.BASE_URL}audio/01-grundlagen/d-conocerse-1-cl-f-normal.mp3` };
      return (
        <RoundEnvContext.Provider value={env}>
          <Current task={found.task} item={found.item} onDone={noop} />
        </RoundEnvContext.Provider>
      );
    }
    default:
      return null;
  }
}

export function Preview({ params }: { params: URLSearchParams }) {
  const [db, setDb] = useState<Awaited<ReturnType<typeof openDb>>>();
  useEffect(() => {
    void openDb('preview').then(setDb);
  }, []);
  const app = useAppState(db);
  if (!(KNOWN as readonly string[]).includes(params.get('zeige') ?? '')) return null;
  if (!app) return <main aria-busy="true" />;
  const zeige = params.get('zeige') ?? '';
  return (
    <main data-view={zeige.startsWith('start') ? 'home' : zeige}>
      <Screen app={app} params={params} />
    </main>
  );
}
