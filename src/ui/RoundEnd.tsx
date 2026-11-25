import { useEffect } from 'preact/hooks';
import { situationCoverage } from '../engine/coverage';
import type { Task } from '../engine/round';
import type { Item, Situation } from '../content/types';
import type { AppState } from './useAppState';

type Props = {
  app: AppState;
  tasks: Task[];
  /** Verständnis je Situation zu Beginn der Runde (0 bis 1). */
  startCoverage: Map<string, number>;
  onExit(): void;
  onAgain(): void;
};

function label(item: Item): { main: string; sub?: string } {
  if (item.kind === 'grammar' || item.kind === 'dialog') return { main: item.title };
  if (item.kind === 'pair') return { main: item.es };
  return { main: item.es, sub: item.de };
}

const percent = (x: number) => `${Math.round(x * 100)} %`;

export function RoundEnd({ app, tasks, startCoverage, onExit, onAgain }: Props) {
  // Ende der Runde ist ein Abgleichpunkt; die Oberfläche wartet nicht darauf.
  useEffect(() => {
    void app.sync();
  }, []);

  const find = (id: string): { item: Item; situation: Situation } | undefined => {
    for (const s of app.situations) {
      const item = s.items.find((it) => it.id === id);
      if (item) return { item, situation: s };
    }
  };
  const newIds = [...new Set(tasks.filter((t) => t.isNew).map((t) => t.itemId))];
  const newItems = newIds.map(find).filter((x): x is { item: Item; situation: Situation } => !!x);

  const sid = tasks.find((t) => t.isNew)?.situationId ?? tasks[0]?.situationId;
  const situation = app.situations.find((s) => s.id === sid);
  const hasDialog = !!situation?.items.some((it) => it.kind === 'dialog');
  const before = startCoverage.get(sid ?? '') ?? 0;
  const after = situation ? situationCoverage(situation, app.states, Date.now(), app.situations) : 0;

  return (
    <div class="task end">
      <h2>{tasks.length === 0 ? 'Gerade ist nichts dran.' : 'Runde geschafft.'}</h2>
      {tasks.length === 0 && <p class="german">Komm später wieder oder wähle auf der Startseite eine Situation.</p>}
      {newItems.length > 0 && (
        <>
          <p class="ask">Neu in dieser Runde</p>
          <ul class="plain newlist">
            {newItems.map(({ item }) => {
              const l = label(item);
              return (
                <li key={item.id}>
                  <span class="spanish">{l.main}</span>
                  {l.sub && <span class="german">{l.sub}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {situation && hasDialog && (
        <p class="coverage">
          {Math.round(after * 100) === Math.round(before * 100)
            ? `Du verstehst etwa ${percent(after)} der Dialoge in ${situation.title}.`
            : `Du verstehst jetzt etwa ${percent(after)} der Dialoge in ${situation.title}, vorher ${percent(before)}.`}
        </p>
      )}
      <div class="actions">
        {tasks.length > 0 && (
          <button type="button" class="btn btn--primary" data-primary onClick={onAgain}>
            noch eine Runde
          </button>
        )}
        <button type="button" class={tasks.length > 0 ? 'btn btn--secondary' : 'btn btn--primary'} onClick={onExit}>
          fertig
        </button>
      </div>
    </div>
  );
}
