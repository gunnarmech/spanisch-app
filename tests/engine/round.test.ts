import { describe, expect, test } from 'vitest';
import { buildRound, currentSituation } from '../../src/engine/round';
import { dialogsHeard, replay, retrievability, type CardState, type ReviewEvent } from '../../src/engine/state';
import type { ChileClip, Item, Situation } from '../../src/content/types';

const T0 = Date.UTC(2026, 10, 25, 10, 0, 0);
const DAY = 86_400_000;

function word(id: string, es: string): Item {
  return { id, kind: 'word', es, de: es, forms: [es], examples: [] };
}

function review(n: number, cardId: string, ts: number, rating: 1 | 2 | 3 | 4 = 3): ReviewEvent {
  return { id: `e${n}`, cardId, ts, device: 'd', kind: 'review', rating, stage: 0 };
}

function manyWords(prefix: string, n: number): Item[] {
  return Array.from({ length: n }, (_, i) => word(`${prefix}${i}`, `${prefix}${i}`));
}

describe('buildRound', () => {
  test('400 fällige: genau 20, dringendste zuerst, keine Rückstandszahl', () => {
    const items = manyWords('w', 400);
    const sit: Situation = { id: 's1', order: 1, title: 'S', items };
    const events: ReviewEvent[] = items.map((it, i) => review(i, it.id, T0 + i * 1000));
    const states = replay(events, new Set(items.map((i) => i.id)));
    const now = T0 + 400 * DAY;
    const round = buildRound({ now, states, situations: [sit] });
    expect(Object.keys(round).sort()).toEqual(['finished', 'tasks']);
    const reviews = round.tasks.filter((t) => !t.isNew);
    expect(reviews.length).toBe(20);
    const r = (id: string) => retrievability(states.get(id) as CardState, now);
    const chosen = reviews.map((t) => r(t.cardId));
    const sorted = items.map((i) => r(i.id)).sort((a, b) => a - b);
    expect(chosen).toEqual(sorted.slice(0, 20));
    expect(round.finished).toBe(false);
  });

  test('höchstens 6 neue, intro vor choice', () => {
    const sit: Situation = { id: 's1', order: 1, title: 'S', items: manyWords('n', 10) };
    const round = buildRound({ now: T0, states: new Map(), situations: [sit] });
    const news = round.tasks.filter((t) => t.isNew);
    expect(news.map((t) => t.itemId)).toEqual(['n0', 'n0', 'n1', 'n1', 'n2', 'n2', 'n3', 'n3', 'n4', 'n4', 'n5', 'n5']);
    expect(news.map((t) => t.form)).toEqual(Array.from({ length: 6 }, () => ['intro', 'choice']).flat());
  });

  test('kein neues Item vor seinem intro, auch bei gemischten Wiederholungen', () => {
    const old = manyWords('o', 10);
    const fresh = manyWords('n', 4);
    const sit: Situation = { id: 's1', order: 1, title: 'S', items: [...old, ...fresh] };
    const states = replay(
      old.map((it, i) => review(i, it.id, T0)),
      new Set(old.map((i) => i.id)),
    );
    const round = buildRound({ now: T0 + 30 * DAY, states, situations: [sit] });
    const introSeen = new Set<string>();
    for (const t of round.tasks) {
      if (t.isNew && t.form === 'intro') introSeen.add(t.cardId);
      if (t.isNew && t.form !== 'intro') expect(introSeen.has(t.cardId)).toBe(true);
    }
    expect(introSeen.size).toBe(4);
    expect(round.tasks.filter((t) => !t.isNew).length).toBe(10);
    // wirklich gemischt: die Wiederholungen stehen nicht alle vor den neuen Items
    expect(round.tasks[0].isNew).toBe(false);
    expect(round.tasks.findIndex((t) => t.isNew)).toBeLessThan(10);
  });

  test('focusSituationId bestimmt neue Items', () => {
    const s1: Situation = { id: 's1', order: 1, title: 'A', items: [word('a', 'a')] };
    const s2: Situation = { id: 's2', order: 2, title: 'B', items: [word('b', 'b')] };
    const def = buildRound({ now: T0, states: new Map(), situations: [s1, s2] });
    expect(def.tasks.map((t) => t.itemId)).toEqual(['a', 'a']);
    const foc = buildRound({ now: T0, states: new Map(), situations: [s1, s2], focusSituationId: 's2' });
    expect(foc.tasks.map((t) => t.itemId)).toEqual(['b', 'b']);
    expect(foc.tasks[0].situationId).toBe('s2');
  });

  test('nichts fällig, nichts neu: finished', () => {
    const sit: Situation = { id: 's1', order: 1, title: 'S', items: [word('a', 'a')] };
    const states = replay([review(1, 'a', T0)], new Set(['a']));
    const round = buildRound({ now: T0, states, situations: [sit] });
    expect(round).toEqual({ tasks: [], finished: true });
  });

  test('Form folgt Stufe', () => {
    const sit: Situation = { id: 's1', order: 1, title: 'S', items: manyWords('w', 5) };
    const states = new Map<string, CardState>();
    ['w0', 'w1', 'w2', 'w3', 'w4'].forEach((id, i) => {
      const base = replay([review(i, id, T0)], new Set([id])).get(id) as CardState;
      states.set(id, { ...base, stage: i as 0 | 1 | 2 | 3 | 4 });
    });
    const round = buildRound({ now: T0 + 60 * DAY, states, situations: [sit] });
    const form = (id: string) => round.tasks.find((t) => t.cardId === id)?.form;
    expect([0, 1, 2, 3, 4].map((i) => form(`w${i}`))).toEqual(['choice', 'listen', 'type', 'speak', 'pressure']);
  });

  describe('produce:false', () => {
    const noProduce = (id: string): Item => ({ id, kind: 'word', es: id, de: id, forms: [id], examples: [], produce: false });
    const formFor = (items: Item[], stage: 0 | 1 | 2 | 3 | 4, id: string, known = false) => {
      const sit: Situation = { id: 's1', order: 1, title: 'S', items };
      const base = replay([review(1, id, T0)], new Set([id])).get(id) as CardState;
      const states = new Map<string, CardState>([[id, { ...base, stage, known }]]);
      const round = buildRound({ now: T0 + 60 * DAY, states, situations: [sit] });
      return round.tasks.find((t) => t.cardId === id)?.form;
    };

    test('produce:false auf Stufe 2 wird listen', () => {
      expect(formFor([noProduce('a')], 2, 'a')).toBe('listen');
    });
    test('produce:false auf Stufe 3 wird pressure', () => {
      expect(formFor([noProduce('a')], 3, 'a')).toBe('pressure');
    });
    test('produce:false nach known und einem Fehler (Stufe 2) wird listen', () => {
      const sit: Situation = { id: 's1', order: 1, title: 'S', items: [noProduce('a')] };
      const events: ReviewEvent[] = [
        { id: 'k', cardId: 'a', ts: T0, device: 'd', kind: 'known' } as ReviewEvent,
        review(2, 'a', T0 + 1000, 1),
      ];
      const states = replay(events, new Set(['a']));
      expect(states.get('a')?.stage).toBe(2);
      const round = buildRound({ now: T0 + 400 * DAY, states, situations: [sit] });
      expect(round.tasks.find((t) => t.cardId === 'a')?.form).toBe('listen');
    });
    test('ohne produce bleibt Stufe 2 type', () => {
      expect(formFor([word('a', 'a')], 2, 'a')).toBe('type');
    });
  });

  test('Grammatik: Übungskarten, Form grammar, neu ohne intro', () => {
    const g: Item = {
      id: 'g1',
      kind: 'grammar',
      title: 'G',
      explanation: 'x',
      examples: [],
      exercises: [
        { de: 'a', es: 'a' },
        { de: 'b', es: 'b' },
      ],
    };
    const sit: Situation = { id: 's1', order: 1, title: 'S', items: [g] };
    const fresh = buildRound({ now: T0, states: new Map(), situations: [sit] });
    expect(fresh.tasks).toEqual([{ cardId: 'g1#0', itemId: 'g1', situationId: 's1', form: 'grammar', isNew: true }]);
    const states = replay([review(1, 'g1#0', T0)], new Set(['g1#0', 'g1#1']));
    const later = buildRound({ now: T0 + 30 * DAY, states, situations: [sit] });
    expect(later.tasks.map((t) => [t.cardId, t.form, t.isNew]).sort()).toEqual([
      ['g1#0', 'grammar', false],
      ['g1#1', 'grammar', true],
    ]);
  });

  test('Dialog erst ab 80 Prozent gesehener Wörter, höchstens einer, am Ende', () => {
    const items: Item[] = [
      word('w-hola', 'hola'),
      word('w-mesa', 'mesa'),
      word('w-sol', 'sol'),
      word('w-luz', 'luz'),
      word('w-pan', 'pan'),
      {
        id: 'd1',
        kind: 'dialog',
        title: 'D',
        lines: [
          { speaker: 'A', es: 'Hola mesa sol', de: '' },
          { speaker: 'B', es: 'luz pan', de: '' },
        ],
      },
      { id: 'd2', kind: 'dialog', title: 'D2', lines: [{ speaker: 'A', es: 'hola luz mesa', de: '' }] },
    ];
    const sit: Situation = { id: 's1', order: 1, title: 'S', items };
    const seen = (ids: string[]) =>
      replay(
        ids.map((id, i) => review(i, id, T0)),
        new Set(ids),
      );
    const none = buildRound({ now: T0, states: seen(['w-hola', 'w-mesa', 'w-sol']), situations: [sit] });
    expect(none.tasks.some((t) => t.form === 'dialog')).toBe(false);
    const ok = buildRound({ now: T0, states: seen(['w-hola', 'w-mesa', 'w-sol', 'w-luz']), situations: [sit] });
    const dialogs = ok.tasks.filter((t) => t.form === 'dialog');
    expect(dialogs).toEqual([{ cardId: 'd1', itemId: 'd1', situationId: 's1', form: 'dialog', isNew: false }]);
    expect(ok.tasks[ok.tasks.length - 1].form).toBe('dialog');
  });
});

describe('Dialogwahl', () => {
  const dlg = (id: string, es: string): Item => ({
    id,
    kind: 'dialog',
    title: id,
    lines: [{ speaker: 'A', es, de: '' }],
  });
  const sit: Situation = {
    id: 's1',
    order: 1,
    title: 'S',
    items: [word('w-hola', 'hola'), dlg('d1', 'hola'), dlg('d2', 'hola hola')],
  };
  // Das Wort ist zu NOW fällig, sonst wäre die Runde fertig und enthielte keinen Dialog.
  const NOW = T0 + 30 * DAY;
  const states = replay([review(1, 'w-hola', T0)], new Set(['w-hola']));
  const dialogOf = (heard?: Map<string, number>, now = NOW) =>
    buildRound({ now, states, situations: [sit], heard }).tasks.filter((t) => t.form === 'dialog').map((t) => t.itemId);

  test('zweiter Dialog nach dem ersten', () => {
    expect(dialogOf()).toEqual(['d1']);
    expect(dialogOf(new Map([['d1', NOW]]))).toEqual(['d2']);
  });

  test('alle kürzlich gehört: kein Dialog', () => {
    const heard = new Map([
      ['d1', NOW - 1 * DAY],
      ['d2', NOW - 2 * DAY],
    ]);
    expect(dialogOf(heard)).toEqual([]);
  });

  test('vor 4 Tagen gehört: am längsten zurückliegender wieder', () => {
    const heard = new Map([
      ['d1', NOW - 4 * DAY],
      ['d2', NOW - 6 * DAY],
    ]);
    expect(dialogOf(heard)).toEqual(['d2']);
    expect(dialogOf(new Map([['d1', NOW - 4 * DAY], ['d2', NOW - 1 * DAY]]))).toEqual(['d1']);
  });

  test('Wortform aus anderer Situation zählt zu den 80 Prozent', () => {
    const s0: Situation = { id: 's0', order: 1, title: 'A', items: [word('w-mesa', 'mesa'), word('w-sol', 'sol')] };
    const s1: Situation = {
      id: 's1',
      order: 2,
      title: 'B',
      items: [word('w-pan', 'pan'), dlg('d1', 'mesa sol pan')],
    };
    const st = replay(
      ['w-mesa', 'w-sol', 'w-pan'].map((id, i) => review(i, id, T0)),
      new Set(['w-mesa', 'w-sol', 'w-pan']),
    );
    const r = buildRound({ now: T0 + 30 * DAY, states: st, situations: [s0, s1], focusSituationId: 's1' });
    expect(r.tasks.some((t) => t.form === 'dialog')).toBe(true);
    const st2 = replay([review(1, 'w-pan', T0)], new Set(['w-pan']));
    const r2 = buildRound({ now: T0 + 30 * DAY, states: st2, situations: [s0, s1], focusSituationId: 's1' });
    expect(r2.tasks.some((t) => t.form === 'dialog')).toBe(false);
  });
});

describe('currentSituation', () => {
  test('erste nach order mit ungesehenen Items', () => {
    const s1: Situation = { id: 's1', order: 1, title: 'A', items: [word('a', 'a')] };
    const s2: Situation = { id: 's2', order: 2, title: 'B', items: [word('b', 'b')] };
    expect(currentSituation([s2, s1], new Map())).toBe('s1');
    const states = replay([review(1, 'a', T0)], new Set(['a']));
    expect(currentSituation([s2, s1], states)).toBe('s2');
  });
});

describe('Chile-Clips in der Runde', () => {
  const grundlagen: Situation = {
    id: '01-grundlagen',
    order: 1,
    title: 'G',
    items: [
      word('w-hola', 'hola'),
      word('w-mesa', 'mesa'),
      word('w-extra', 'extra'),
      { id: 'd1', kind: 'dialog', title: 'D', lines: [{ speaker: 'A', es: 'hola mesa', de: '' }] },
    ],
  };
  const clips: ChileClip[] = [{ id: 'clip-1', es: 'hola mesa', de: '', gender: 'f', source: 's' }];
  const ids = new Set(['w-hola', 'w-mesa', 'w-extra']);
  // w-extra ist zu NOW fällig, damit die Runde nicht fertig ist; die Bekannten sichern Freischaltung und Anteil.
  const states = replay(
    [
      review(3, 'w-extra', T0),
      { id: 'k1', cardId: 'w-hola', ts: T0, device: 'd', kind: 'known' },
      { id: 'k2', cardId: 'w-mesa', ts: T0, device: 'd', kind: 'known' },
    ],
    ids,
  );
  const NOW = T0 + 30 * DAY;
  const listens = (heard: Map<string, number>, c?: ChileClip[]) =>
    buildRound({ now: NOW, states, situations: [grundlagen], heard, clips: c, maxNew: 0 }).tasks.filter(
      (t) => t.form === 'dialog' || t.form === 'clip',
    );

  test('höchstens eine Höraufgabe je Runde, Wechsel nach der Art des zuletzt Gehörten', () => {
    // Zuletzt kam ein Dialog: jetzt der Clip.
    const afterDialog = listens(new Map([['d1', 1]]), clips);
    expect(afterDialog).toEqual([
      { cardId: 'clip-1', itemId: 'clip-1', situationId: 'chile-echt', form: 'clip', isNew: false },
    ]);
    // Zuletzt kam ein Clip: jetzt der Dialog.
    const afterClip = listens(new Map([['d1', 1], ['clip-1', 2]]), clips);
    expect(afterClip.map((t) => t.form)).toEqual(['dialog']);
  });

  test('wiederholter Dialog bei gerader Zahl gehörter IDs ergibt als nächstes den Clip', () => {
    // heard.size ist 2 (gerade), der jüngste Eintrag ist der Dialog d1.
    const heard = new Map([['d0', 1], ['d1', 5]]);
    expect(listens(heard, clips).map((t) => t.form)).toEqual(['clip']);
  });

  test('ohne Gehörtes beginnt der Dialog', () => {
    expect(listens(new Map(), clips).map((t) => t.form)).toEqual(['dialog']);
  });

  test('mehrere Runden mit wiederholten IDs wechseln', () => {
    const heard = new Map<string, number>([['d1', 1]]);
    const forms: string[] = [];
    for (let r = 0; r < 4; r++) {
      const t = listens(heard, clips)[0];
      forms.push(t.form);
      heard.set(t.itemId, 10 + r); // dieselben IDs werden wiederholt, die Zahl wächst nicht
    }
    expect(forms).toEqual(['clip', 'dialog', 'clip', 'dialog']);
    expect(heard.size).toBe(2);
  });

  test('liefert den Dialog als Ersatz, falls der Clip nicht abspielbar ist', () => {
    const r = buildRound({ now: NOW, states, situations: [grundlagen], heard: new Map([['d1', 1]]), clips, maxNew: 0 });
    expect(r.fallback).toEqual({ cardId: 'd1', itemId: 'd1', situationId: '01-grundlagen', form: 'dialog', isNew: false });
    const none = buildRound({ now: NOW, states, situations: [grundlagen], heard: new Map(), clips, maxNew: 0 });
    expect(none.fallback).toBeUndefined();
  });

  test('ohne clips unverändert wie bisher', () => {
    const t = listens(new Map([['d1', 1]]));
    expect(t.map((x) => x.form)).toEqual(['dialog']);
    expect(listens(new Map([['d1', 1]]), [])).toEqual(t);
  });

  test('ohne Freischaltung kein Clip', () => {
    const locked = buildRound({ now: NOW, states: new Map(), situations: [grundlagen], clips, heard: new Map([['x', 1]]) });
    expect(locked.tasks.some((t) => t.form === 'clip')).toBe(false);
  });

  test('replay ignoriert heard-Ereignis mit Clip-ID', () => {
    const base: ReviewEvent[] = [review(1, 'w-hola', T0)];
    const heard: ReviewEvent = { id: 'h1', cardId: 'clip-1', ts: T0 + 5, device: 'd', kind: 'heard' };
    expect(replay([...base, heard], ids)).toEqual(replay(base, ids));
    expect(dialogsHeard([heard]).get('clip-1')).toBe(T0 + 5);
  });
});
