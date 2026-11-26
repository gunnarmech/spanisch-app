import { retrievability, type CardState } from './state';
import { seenTokenShare } from './coverage';
import { CHILE_SITUATION, chileUnlocked, chooseClip } from './clips';
import type { ChileClip, DialogItem, Item, Situation } from '../content/types';

export type TaskForm = 'intro' | 'choice' | 'listen' | 'type' | 'speak' | 'pressure' | 'dialog' | 'grammar' | 'clip';

export type Task = {
  cardId: string;
  itemId: string;
  situationId: string;
  form: TaskForm;
  isNew: boolean;
};

const DIALOG_SEEN_SHARE = 0.8;
const DIALOG_REPEAT_MS = 3 * 86_400_000;
const STAGE_FORMS: TaskForm[] = ['choice', 'listen', 'type', 'speak', 'pressure'];
/** Mindestzahl Aufgaben zwischen der Einführung eines neuen Items und seinem ersten Abruf. */
export const FIRST_RETRIEVAL_GAP = 3;

/** Form des ersten Abrufs (Stufe 0): selbst tippen, bei nur Verstehen und bei Paaren hören. */
export function retrievalForm(item: Item): TaskForm {
  if (item.kind === 'grammar') return 'grammar';
  if (item.kind === 'pair') return 'listen';
  if ((item.kind === 'word' || item.kind === 'phrase' || item.kind === 'sentence') && item.produce === false) return 'listen';
  return 'type';
}

/** Karten-ids eines Items: Grammatik je Übung, Dialoge sind keine Karten. */
function cardIds(item: Item): string[] {
  if (item.kind === 'dialog') return [];
  if (item.kind === 'grammar') return item.exercises.map((_, i) => `${item.id}#${i}`);
  return [item.id];
}

function firstUnseenCard(item: Item, states: Map<string, CardState>): string | undefined {
  return cardIds(item).find((c) => !states.has(c));
}

function hasUnseen(s: Situation, states: Map<string, CardState>): boolean {
  return s.items.some((it) => firstUnseenCard(it, states) !== undefined);
}

/** Erste Situation nach order mit ungesehenen Items; sind alle durch, die letzte. */
export function currentSituation(situations: Situation[], states: Map<string, CardState>): string {
  const sorted = [...situations].sort((a, b) => a.order - b.order);
  const open = sorted.find((s) => hasUnseen(s, states));
  return (open ?? sorted[sorted.length - 1])?.id ?? '';
}

/** Anteil der Dialog-Tokens (je Vorkommen), die zu einem Wort-Item mit Lernstand gehören. */
function seenShare(dialog: DialogItem, situations: Situation[], states: Map<string, CardState>): number {
  return seenTokenShare(dialog.lines.map((l) => l.es), situations, states);
}

/** Verteilt die Gruppen gleichmäßig zwischen die Wiederholungen. Die Reihenfolge innerhalb einer Gruppe bleibt. */
function interleave(reviews: Task[], groups: Task[][]): Task[] {
  const out: Task[] = [];
  let g = 0;
  for (let i = 0; i <= reviews.length; i++) {
    while (g < groups.length && Math.floor(((g + 1) * reviews.length) / (groups.length + 1)) <= i) {
      out.push(...groups[g++]);
    }
    if (i < reviews.length) out.push(reviews[i]);
  }
  return out;
}

/**
 * Hängt jeden ersten Abruf frühestens FIRST_RETRIEVAL_GAP Aufgaben hinter seine Einführung, sonst ans Ende (FIFO).
 * Je Aufgabe wird höchstens ein Abruf vorgezogen; eine Schleife würde sie gebündelt vor den letzten Einführungen
 * ablegen, und deren Abrufe stünden ohne Lücke am Ende.
 */
function placeFirstRetrievals(sequence: Task[], checks: Map<Task, Task>): Task[] {
  const out: Task[] = [];
  const pending: { check: Task; introPos: number }[] = [];
  for (const x of sequence) {
    if (pending.length > 0 && out.length - pending[0].introPos - 1 >= FIRST_RETRIEVAL_GAP) {
      out.push(pending.shift()!.check);
    }
    out.push(x);
    const check = checks.get(x);
    if (check) pending.push({ check, introPos: out.length - 1 });
  }
  for (const p of pending) out.push(p.check);
  return out;
}

/**
 * Rückt Wiederholungen und Grammatik-Aufgaben hinter Einführungen, hinter denen sonst weniger als FIRST_RETRIEVAL_GAP
 * Aufgaben folgen würden. Die Einführungen behalten ihre Reihenfolge, nur die davor liegenden anderen Aufgaben
 * (höchstens FIRST_RETRIEVAL_GAP, die letzten zuerst) wandern hinter die letzte betroffene Einführung.
 * So bleibt Platz für den ersten Abruf, soweit die Runde überhaupt genug Aufgaben hat.
 */
function leaveRoomForRetrievals(sequence: Task[], checks: Map<Task, Task>): Task[] {
  const late = sequence
    .map((t, i) => (checks.has(t) && sequence.length - 1 - i < FIRST_RETRIEVAL_GAP ? i : -1))
    .filter((i) => i >= 0);
  if (late.length === 0) return sequence;
  const first = late[0];
  const last = late[late.length - 1];
  const movable = sequence.slice(0, first).map((_, i) => i).filter((i) => !checks.has(sequence[i])).slice(-FIRST_RETRIEVAL_GAP);
  if (movable.length === 0) return sequence;
  const skip = new Set(movable);
  return [
    ...sequence.slice(0, first).filter((_, i) => !skip.has(i)),
    ...sequence.slice(first, last + 1),
    ...movable.map((i) => sequence[i]),
    ...sequence.slice(last + 1),
  ];
}

export function buildRound(opts: {
  now: number;
  states: Map<string, CardState>;
  situations: Situation[];
  focusSituationId?: string;
  maxReviews?: number;
  maxNew?: number;
  /** Zeitpunkt des letzten Anhörens je Dialog-id (aus dialogsHeard). */
  heard?: Map<string, number>;
  /** Echte Chile-Aufnahmen; ohne Angabe oder ohne Freischaltung gibt es keine Clip-Aufgabe. */
  clips?: ChileClip[];
}): { tasks: Task[]; finished: boolean; fallback?: Task } {
  const { now, states, situations } = opts;
  const maxReviews = opts.maxReviews ?? 20;
  const maxNew = opts.maxNew ?? 6;

  // Karten, die es im Inhalt gibt, mit ihrem Item.
  const owner = new Map<string, { item: Item; situationId: string }>();
  for (const s of situations) {
    for (const item of s.items) for (const c of cardIds(item)) owner.set(c, { item, situationId: s.id });
  }

  const due: { cardId: string; r: number; state: CardState }[] = [];
  for (const [cardId, state] of states) {
    if (!owner.has(cardId) || state.card.due.getTime() > now) continue;
    due.push({ cardId, r: retrievability(state, now), state });
  }
  due.sort((a, b) => a.r - b.r || (a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0));

  const reviews: Task[] = due.slice(0, maxReviews).map(({ cardId, state }) => {
    const { item, situationId } = owner.get(cardId)!;
    let form: TaskForm = item.kind === 'grammar' ? 'grammar' : state.stage === 0 ? retrievalForm(item) : STAGE_FORMS[state.stage];
    // Nur verstehen: nie selbst tippen oder sprechen, stattdessen hören und Antwort unter Zeitdruck.
    if ((item.kind === 'word' || item.kind === 'phrase' || item.kind === 'sentence') && item.produce === false) {
      if (form === 'type') form = 'listen';
      else if (form === 'speak') form = 'pressure';
    }
    return { cardId, itemId: item.id, situationId, form, isNew: false };
  });

  const targetId = opts.focusSituationId ?? currentSituation(situations, states);
  const target = situations.find((s) => s.id === targetId);

  // Neue Items in Dateireihenfolge. Ein neues Grammatik-Item bringt je Runde seine erste ungesehene Übung.
  const groups: Task[][] = [];
  const checks = new Map<Task, Task>();
  let newLeft = 0;
  if (target) {
    for (const item of target.items) {
      const cardId = firstUnseenCard(item, states);
      if (cardId === undefined) continue;
      if (groups.length >= maxNew) {
        newLeft++;
        continue;
      }
      const base = { cardId, itemId: item.id, situationId: target.id, isNew: true };
      if (item.kind === 'grammar') {
        groups.push([{ ...base, form: 'grammar' }]);
      } else {
        const intro: Task = { ...base, form: 'intro' };
        checks.set(intro, { ...base, form: retrievalForm(item) });
        groups.push([intro]);
      }
    }
  }

  const finished = due.length === 0 && groups.length === 0 && newLeft === 0;
  const tasks = placeFirstRetrievals(leaveRoomForRetrievals(interleave(reviews, groups), checks), checks);

  let fallback: Task | undefined;
  if (target && !finished) {
    const heard = opts.heard ?? new Map<string, number>();
    const eligible = target.items.filter(
      (it): it is DialogItem => it.kind === 'dialog' && seenShare(it, situations, states) >= DIALOG_SEEN_SHARE,
    );
    // Zuerst ein nie gehörter Dialog (Dateireihenfolge), sonst der am längsten zurückliegende, aber erst nach 3 Tagen.
    let dialog = eligible.find((d) => !heard.has(d.id));
    if (!dialog) {
      const oldest = [...eligible].sort((a, b) => heard.get(a.id)! - heard.get(b.id)!)[0];
      if (oldest && now - heard.get(oldest.id)! >= DIALOG_REPEAT_MS) dialog = oldest;
    }
    const clip = opts.clips && chileUnlocked(situations, states, now)
      ? chooseClip(opts.clips, situations, states, heard, now)
      : undefined;
    // Höchstens eine Höraufgabe je Runde. Der Wechsel richtet sich nach der Art des zuletzt Gehörten:
    // kam zuletzt ein Dialog, ist der Clip dran, sonst der Dialog. Wiederholungen ändern daran nichts.
    const clipIds = new Set((opts.clips ?? []).map((c) => c.id));
    let lastDialog = -Infinity;
    let lastClip = -Infinity;
    for (const [id, ts] of heard) {
      if (clipIds.has(id)) lastClip = Math.max(lastClip, ts);
      else lastDialog = Math.max(lastDialog, ts);
    }
    const clipTurn = lastDialog > -Infinity && lastDialog >= lastClip;
    const dialogTask: Task | undefined = dialog
      ? { cardId: dialog.id, itemId: dialog.id, situationId: target.id, form: 'dialog', isNew: false }
      : undefined;
    if (clip && (!dialog || clipTurn)) {
      tasks.push({ cardId: clip.id, itemId: clip.id, situationId: CHILE_SITUATION, form: 'clip', isNew: false });
      // Ist der Clip nicht abspielbar, rückt der Dialog nach.
      fallback = dialogTask;
    } else if (dialogTask) {
      tasks.push(dialogTask);
    }
  }

  return fallback ? { tasks, finished, fallback } : { tasks, finished };
}
