import type { Item, Situation } from '../../content/types';
import { textOf } from './types';

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deutsche Antwortoptionen: die richtige plus bis zu `count` Ablenker, zuerst aus der Situation des Items,
 * bei Mangel aus allen Situationen. Nie doppelte Texte, nie die richtige Antwort ein zweites Mal.
 */
export function choiceOptions(
  item: Item,
  situations: Situation[],
  situationId: string,
  count = 3,
  rand: () => number = Math.random,
): string[] {
  const correct = textOf(item)?.de;
  if (correct === undefined) return [];
  const pool = (list: Situation[]) =>
    list.flatMap((s) => s.items.filter((it) => it.id !== item.id).map((it) => textOf(it)?.de));
  const chosen: string[] = [];
  const take = (candidates: (string | undefined)[]) => {
    for (const c of shuffle(candidates.filter((x): x is string => !!x), rand)) {
      if (chosen.length >= count) return;
      if (c !== correct && !chosen.includes(c)) chosen.push(c);
    }
  };
  take(pool(situations.filter((s) => s.id === situationId)));
  if (chosen.length < count) take(pool(situations));
  return shuffle([correct, ...chosen], rand);
}
