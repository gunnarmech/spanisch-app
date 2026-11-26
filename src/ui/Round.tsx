import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Item } from '../content/types';
import { CHILE_SITUATION, chileUnlocked } from '../engine/clips';
import { situationCoverage } from '../engine/coverage';
import { buildRound, type Task } from '../engine/round';
import { ratingFor, type Stage } from '../engine/state';
import { audioUrl, loadManifest, prefetchSituations, prefetchTargets, type Manifest } from '../media/audio';
import { RoundEnd } from './RoundEnd';
import { TaskTools } from './TaskTools';
import { Choice } from './tasks/Choice';
import { ClipTask } from './tasks/ClipTask';
import { Dialog } from './tasks/Dialog';
import { RoundEnvContext, type RoundEnv } from './tasks/env';
import { Grammar } from './tasks/Grammar';
import { Intro } from './tasks/Intro';
import { isTyping, useKey } from './tasks/keys';
import { Listen } from './tasks/Listen';
import { Pressure } from './tasks/Pressure';
import { Speak } from './tasks/Speak';
import { Type } from './tasks/Type';
import type { Answer, TaskProps } from './tasks/types';
import type { AppState } from './useAppState';

type Props = { app: AppState; focusSituationId?: string; onExit(): void; onAgain(): void };

export function component(task: Task, item: Item): (p: TaskProps) => preact.JSX.Element | null {
  switch (task.form) {
    case 'intro':
      return Intro;
    case 'dialog':
      return Dialog;
    case 'grammar':
      return Grammar;
    case 'pressure':
      return Pressure;
    case 'listen':
      return Listen;
    case 'choice':
      return item.kind === 'pair' ? Listen : Choice;
    case 'speak':
      return item.kind === 'pair' ? Listen : Speak;
    default:
      // Hörpaare werden immer gehört, nie getippt
      return item.kind === 'pair' ? Listen : Type;
  }
}

export function Round({ app, focusSituationId, onExit, onAgain }: Props) {
  const [plan] = useState(() => {
    const now = Date.now();
    const built = buildRound({
      now,
      states: app.states,
      situations: app.situations,
      focusSituationId,
      heard: app.heard,
      clips: app.clips,
    });
    const startCoverage = new Map(app.situations.map((s) => [s.id, situationCoverage(s, app.states, now, app.situations)]));
    return { ...built, startCoverage };
  });
  const [index, setIndex] = useState(0);
  const [manifests, setManifests] = useState<Record<string, Manifest> | null>(null);
  const skipped = useRef(new Set<string>());

  useEffect(() => {
    let alive = true;
    const ids = [...new Set(plan.tasks.map((t) => t.situationId))];
    void Promise.all(ids.map(async (id) => [id, await loadManifest(id)] as const)).then((list) => {
      if (alive) setManifests(Object.fromEntries(list));
    });
    return () => {
      alive = false;
    };
  }, [plan]);

  // Offline-Audio: Töne dieser und der nächsten Situation im Hintergrund in den Cache legen.
  useEffect(() => {
    const ids = prefetchTargets(
      plan.tasks.map((t) => t.situationId),
      app.situations.map((s) => s.id),
    );
    // Die Chile-Aufnahmen kommen dazu, sobald sie freigeschaltet sind, auch wenn diese Runde keine enthält.
    if (app.clips.length > 0 && chileUnlocked(app.situations, app.states, Date.now()) && !ids.includes(CHILE_SITUATION)) {
      ids.push(CHILE_SITUATION);
    }
    void prefetchSituations(ids);
  }, [plan]);

  useKey((e) => {
    if (e.key !== 'Enter' || e.repeat || isTyping(e) || (e.target as HTMLElement).tagName === 'BUTTON') return;
    document.querySelector<HTMLButtonElement>('button[data-primary]')?.click();
  });

  const items = useMemo(() => {
    const m = new Map<string, Item>();
    for (const s of app.situations) for (const it of s.items) m.set(it.id, it);
    return m;
  }, [app.situations]);

  const env: RoundEnv = {
    situations: app.situations,
    urlFor(task, key) {
      const manifest = manifests?.[task.situationId] ?? {};
      const speed = task.form === 'clip' ? 'normal' : task.form === 'pressure' ? 'fast' : task.isNew ? app.settings.voiceSpeedNew : 'normal';
      const pick = { speed, preferChile: task.form === 'pressure' } as const;
      return audioUrl(task.situationId, key, pick, manifest) ?? audioUrl(task.situationId, key, { ...pick, speed: 'normal' }, manifest);
    },
  };

  const advance = (from: number) => {
    let next = from + 1;
    while (plan.tasks[next] && skipped.current.has(plan.tasks[next].cardId)) next++;
    setIndex(next);
  };

  // Pro Aufgabe nur ein Weiterschalten oder "kann ich schon", auch bei doppeltem Tippen.
  const locked = useRef<number | null>(null);
  const recorded = useRef(false);
  const leave = () => {
    // Wurde etwas aufgezeichnet, ist das Beenden ein Abgleichpunkt; die Oberfläche wartet nicht darauf.
    if (recorded.current) void app.sync();
    onExit();
  };
  const take = () => {
    if (locked.current === index) return false;
    locked.current = index;
    return true;
  };

  /** Das Ereignis entsteht beim Antworten, nicht erst beim Weiterschalten. */
  const answered = async (task: Task, result: Answer) => {
    if (task.form === 'intro') return;
    recorded.current = true;
    if (task.form === 'dialog' || task.form === 'clip') {
      await app.record({ kind: 'heard', cardId: task.itemId });
      return;
    }
    const stage: Stage = app.states.get(task.cardId)?.stage ?? 0;
    await app.record({
      kind: 'review',
      cardId: task.cardId,
      rating: ratingFor(result.verdict, result.ms, stage, result.usedHint),
      stage,
    });
  };

  const next = () => {
    if (take()) advance(index);
  };

  const known = async (task: Task) => {
    if (!take()) return;
    skipped.current.add(task.cardId);
    recorded.current = true;
    await app.record({ kind: 'known', cardId: task.cardId });
    advance(index);
  };

  const task = plan.tasks[index];
  const clip = task?.form === 'clip' ? app.clips.find((c) => c.id === task.itemId) : undefined;
  const clipUrl = task && clip && manifests ? env.urlFor(task, clip.id) : null;
  // Eine Aufnahme ohne Ton (Manifest fehlt oder ohne Eintrag) wird übersprungen, die Runde geht weiter.
  const clipMissing = task?.form === 'clip' && manifests !== null && (!clip || !clipUrl);
  useEffect(() => {
    if (clipMissing) advance(index);
  }, [clipMissing, index]);

  if (manifests === null) return <div class="task" aria-busy="true" />;
  if (clipMissing) return null;

  const item = task && items.get(task.itemId);
  if (task && clip && clipUrl) {
    return (
      <RoundEnvContext.Provider value={env}>
        <div class="progress" role="progressbar" aria-label="Fortschritt der Runde" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((index / plan.tasks.length) * 100)}>
          <div style={{ transform: `scaleX(${index / plan.tasks.length})` }} />
        </div>
        <ClipTask key={index} clip={clip} clips={app.clips} url={clipUrl} onAnswered={(r) => void answered(task, r)} onDone={next} />
        <TaskTools key={`tools-${index}`} canKnow={false} onKnown={() => {}} onReport={(text) => app.report(task.itemId, text)} />
        <button type="button" class="link leave" onClick={leave}>
          Runde beenden
        </button>
      </RoundEnvContext.Provider>
    );
  }
  if (!task || !item) {
    return <RoundEnd app={app} tasks={plan.tasks} startCoverage={plan.startCoverage} onExit={onExit} onAgain={onAgain} />;
  }

  const Current = component(task, item);
  const percent = Math.round((index / plan.tasks.length) * 100);
  return (
    <RoundEnvContext.Provider value={env}>
      <div class="progress" role="progressbar" aria-label="Fortschritt der Runde" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <Current key={index} task={task} item={item} onAnswered={(r) => void answered(task, r)} onDone={next} />
      <TaskTools
        key={`tools-${index}`}
        canKnow={task.form !== 'dialog'}
        onKnown={() => void known(task)}
        onReport={(text) => app.report(task.itemId, text)}
      />
      <button type="button" class="link leave" onClick={leave}>
        Runde beenden
      </button>
    </RoundEnvContext.Provider>
  );
}
