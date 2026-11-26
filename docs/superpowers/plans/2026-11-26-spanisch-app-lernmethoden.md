# Lernmethoden und Zurücksetzen: Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Items werden erst nach anderen Aufgaben und mit eigenem Abruf zum ersten Mal abgefragt, "sicher" heißt gefestigt (verteilte erfolgreiche Wiederholung), und der Fortschritt lässt sich geräteübergreifend zurücksetzen.

**Architecture:** Alles Lernstandswissen bleibt aus dem Ereignisprotokoll abgeleitet. `replay` bekommt ein Festigungsfeld und schneidet am letzten `reset`-Ereignis ab; `isSure` verlangt die Festigung. `buildRound` verzahnt Einführungen und verzögerte erste Abrufe. Die Einstellungen bekommen einen Abschnitt mit Bestätigung, der ein `reset`-Ereignis schreibt.

**Tech Stack:** TypeScript, Preact, Vite, Vitest mit jsdom, ts-fsrs 6, idb.

**Spec:** `docs/superpowers/specs/2026-11-26-spanisch-app-lernmethoden-design.md`

## Global Constraints

- Oberfläche deutsch, Knöpfe und Beschriftungen in Satzschreibung mit großem Anfangsbuchstaben.
- Keine Gedankenstriche (weder "—" noch " – ") in UI, Kommentaren, Commits. Kein "·" als Trenner, keine Emojis, kein Violett.
- Keine Serien, Punkte, Herzen, Rückstandszahlen; keine Anzeige wie "noch X Tage bis gefestigt".
- Sichtbare Änderungen mit dem Taste-Skill (`C:\Users\gunna\.claude\skills\design-taste-frontend`) bauen und mit dem Gate prüfen (`node C:\Users\gunna\.claude\skills\design-taste-frontend\scripts\gate.mjs`, Prüfordner `.taste-skill/root/spanisch-app/`). Screenshots nie ins Repo, nur in einen Scratch-Ordner.
- Abschluss jeder Aufgabe: `npm test`, `npx tsc --noEmit` grün; bei Inhalts- oder Build-Berührung zusätzlich `npm run check:content`, `npm run build`.
- Commit-Trailer jeder Nachricht:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01Teb8gyWxoj1xMc125WtSpb`
- Festigungsabstand: 20 Stunden (`CONSOLIDATE_MS = 20 * 3_600_000`). Schwelle R über 0,8 bleibt (`KNOWN_THRESHOLD`).
- Lücke zwischen Einführung und erstem Abruf: Ziel 3 andere Aufgaben (`FIRST_RETRIEVAL_GAP = 3`), abnahmefest mindestens 2, sobald die Runde genug Aufgaben hat.
- `maxNew` bleibt 6, `maxReviews` bleibt 20, `UNLOCK_COVERAGE` bleibt 0,5.

## Review Focus

- Bestehende Lernstände nach dem Update: Ereignisprotokolle aus Teil 1 und 2 (ohne `reset`, mit `known` aus der Einstufung) spielen fehlerfrei ab; `known`-Karten bleiben sicher, einmal bewertete fallen auf nicht sicher. Test in Task 1.
- "Kann ich schon" auf einer Einführung: der zugehörige verzögerte erste Abruf derselben Karte erscheint nicht mehr. Test in Task 2 (Round-UI).
- Gleicher Zeitstempel bei `reset` und einem anderen Ereignis: die Sortierung (ts, dann id) entscheidet deterministisch, unabhängig von der Eingabereihenfolge. Test in Task 3.
- Gist enthält `reset`: `syncNow` liest es als gültig und vereinigt es (kein "invalid"). Test in Task 3.
- Doppeltes Tippen auf "Ja, alles zurücksetzen" schreibt höchstens ein `reset`-Ereignis. Test in Task 4.

---

### Task 1: Festigung statt "einmal gesehen"

**Files:**
- Modify: `src/engine/state.ts` (CardState, applyKnown, replay)
- Modify: `src/engine/coverage.ts` (isSure)
- Test: `tests/engine/state.test.ts`, `tests/engine/coverage.test.ts`; anpassen, wo bestehende Tests "sicher nach einer Bewertung" festschreiben: `tests/engine/clips.test.ts`, `tests/ui/Progress.test.tsx`, `tests/ui/Home.test.tsx`, `tests/ui/Round.test.tsx` (RoundEnd-Zeile), ggf. weitere, die `npm test` dann rot zeigt.

**Interfaces:**
- Produces: `CardState = { card: Card; stage: Stage; known: boolean; consolidated: boolean; lastTs: number }`. `isSure(s: CardState | undefined, now: number): boolean` ist `!!s && (s.known || (s.consolidated && retrievability(s, now) > 0.8))`. Exportierte Konstante `CONSOLIDATE_MS` aus `state.ts`.

Regeln in `replay` je Karte (neben dem vorhandenen `lastTs` ein interner Merker `lastReviewTs` je Karte, nur aus `review`-Ereignissen):
- `known`: `consolidated = true` (in `applyKnown`).
- `review` mit Rating 1: `consolidated = false` (zusätzlich zur vorhandenen known-Regel).
- `review` mit Rating 2 bis 4: wenn es ein vorheriges `review` derselben Karte gibt und `e.ts - lastReviewTs >= CONSOLIDATE_MS`, dann `consolidated = true`; sonst bleibt der vorige Wert (neue Karte: `false`).

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** (`tests/engine/state.test.ts`, describe `Festigung`)

```ts
test('eine Bewertung festigt nicht', () => {
  expect(replay([review('1', 'a', T0, 3)], valid).get('a')!.consolidated).toBe(false);
});
test('zweite erfolgreiche Bewertung nach 20 h festigt, nach 19 h nicht', () => {
  const H = 3_600_000;
  expect(replay([review('1', 'a', T0, 3), review('2', 'a', T0 + 20 * H, 2)], valid).get('a')!.consolidated).toBe(true);
  expect(replay([review('1', 'a', T0, 3), review('2', 'a', T0 + 19 * H, 3)], valid).get('a')!.consolidated).toBe(false);
});
test('Again nimmt die Festigung, nächste verteilte Wiederholung gibt sie zurück', () => {
  const ev = [review('1', 'a', T0, 3), review('2', 'a', T0 + DAY, 3), review('3', 'a', T0 + 2 * DAY, 1)];
  expect(replay(ev, valid).get('a')!.consolidated).toBe(false);
  expect(replay([...ev, review('4', 'a', T0 + 3 * DAY, 3)], valid).get('a')!.consolidated).toBe(true);
});
test('known ist gefestigt, Again danach nicht mehr', () => {
  const k: ReviewEvent = { id: 'k', cardId: 'a', ts: T0, device: 'd1', kind: 'known' };
  expect(replay([k], valid).get('a')!.consolidated).toBe(true);
  expect(replay([k, review('2', 'a', T0 + DAY, 1)], valid).get('a')!.consolidated).toBe(false);
});
```

In `tests/engine/coverage.test.ts`:

```ts
test('isSure: direkt nach einer Bewertung nicht sicher', () => {
  const s = replay([rev('1', 'w1', T0, 3)], ids).get('w1')!;
  expect(isSure(s, T0 + 60_000)).toBe(false);
});
test('isSure: nach verteilter Wiederholung sicher, solange R über 0,8', () => {
  const s = replay([rev('1', 'w1', T0, 3), rev('2', 'w1', T0 + DAY, 3)], ids).get('w1')!;
  expect(isSure(s, T0 + DAY + 60_000)).toBe(true);
  expect(isSure(s, T0 + 400 * DAY)).toBe(false);
});
test('situationCoverage ändert sich durch eine einzelne Bewertung nicht', () => { /* Situation mit Dialog aus w1; vorher und nachher 0 */ });
```

(Hilfsfunktionsnamen an die Datei anpassen.)

- [ ] **Schritt 2: Laufen lassen, Fehlschlag sehen**: `npx vitest run tests/engine/state.test.ts tests/engine/coverage.test.ts`, erwartet FAIL (`consolidated` undefined bzw. isSure true).
- [ ] **Schritt 3: Umsetzen** in `state.ts` und `coverage.ts` nach den Regeln oben. Kommentar an `isSure` und an `CardState` auf Deutsch, ohne Gedankenstriche.
- [ ] **Schritt 4: Bestandsprotokoll-Test** (Review Focus 1) in `state.test.ts`: Protokoll aus `known` (Karte a) plus einem `review` Rating 3 (Karte b) spielt ab, `a.consolidated === true`, `b.consolidated === false`.
- [ ] **Schritt 5: `npm test`**; rot werdende Alttests, die "sicher nach einer Bewertung" voraussetzen, so umstellen, dass sie eine zweite Bewertung mindestens einen Tag später enthalten (Absicht des Tests bleibt). Kein Test wird gelöscht, ohne dass sein Zweck anderswo abgedeckt ist.
- [ ] **Schritt 6: `npm test` und `npx tsc --noEmit` grün.**
- [ ] **Schritt 7: Commit** `feat: sicher heißt gefestigt (verteilte erfolgreiche Wiederholung)`.

---

### Task 2: Verzögerter erster Abruf und Formen auf Stufe 0

**Files:**
- Modify: `src/engine/round.ts` (Formwahl, Rundenaufbau), `src/engine/state.ts` (nur Kommentar zu `Stage`)
- Test: `tests/engine/round.test.ts`, `tests/ui/Round.test.tsx`

**Interfaces:**
- Consumes: nichts Neues aus Task 1.
- Produces: `export function retrievalForm(item: Item): TaskForm` in `round.ts`: `'grammar'` für Grammatik, `'listen'` für `pair` und für word/phrase/sentence mit `produce === false`, sonst `'type'`. `buildRound` behält Signatur und Rückgabetyp. Exportierte Konstante `FIRST_RETRIEVAL_GAP = 3`.

Regeln:
- Wiederholungen auf Stufe 0 (nicht Grammatik) bekommen `retrievalForm(item)`. Stufen 1 bis 4 wie bisher inklusive der produce-false-Umlenkung.
- Ein neues Nicht-Grammatik-Item erzeugt `intro` und einen ersten Abruf `{ form: retrievalForm(item), isNew: true }` mit derselben `cardId`. Neue Grammatik bleibt eine einzelne `grammar`-Aufgabe.
- Aufbau (deterministisch):

```
S = interleave(reviews, [[intro oder grammar] je neuem Item])   // bestehende Funktion, Einzelgruppen
out = []; pending = FIFO von { check, introPos }
für jede Aufgabe x in S:
  solange pending nicht leer und (out.length - pending[0].introPos - 1) >= FIRST_RETRIEVAL_GAP:
    out.push(pending.shift().check)
  out.push(x); ist x ein intro: pending.push({ check, introPos: out.length - 1 })
danach alle verbleibenden pending in FIFO-Reihenfolge anhängen
```

  Dialog oder Clip (und `fallback`) kommen wie bisher danach ans Ende.

- [ ] **Schritt 1: Fehlschlagende Tests** in `tests/engine/round.test.ts` (den bisherigen Test "höchstens 6 neue, intro vor choice" ersetzen):

```ts
test('neue Items: nie Abruf direkt nach der eigenen Einführung, Lücke mindestens 2', () => {
  const sit: Situation = { id: 's1', order: 1, title: 'S', items: manyWords('n', 10) };
  const { tasks } = buildRound({ now: T0, states: new Map(), situations: [sit] });
  const intros = tasks.filter((t) => t.form === 'intro');
  expect(intros.length).toBe(6);
  for (const i of intros) {
    const a = tasks.indexOf(i);
    const b = tasks.findIndex((t, k) => k > a && t.cardId === i.cardId && t.form !== 'intro');
    expect(b - a - 1).toBeGreaterThanOrEqual(2);
  }
});
test('drei neue, keine Wiederholungen: Lücke je 2', () => { /* manyWords('n', 3); dieselbe Prüfung */ });
test('ein neues Item allein: Abruf am Ende, kein Fehler', () => { /* Reihenfolge intro, type */ });
test('erster Abruf: type bei produzierbar, listen bei produce false und bei pair', () => { /* ein Item je Art */ });
test('Wiederholung auf Stufe 0 nach Again ist type, nicht choice', () => {
  const sit: Situation = { id: 's1', order: 1, title: 'S', items: [word('w', 'hola')] };
  const states = replay([review(1, 'w', T0, 1)], new Set(['w']));
  const { tasks } = buildRound({ now: T0 + DAY, states, situations: [sit] });
  expect(tasks.find((t) => t.cardId === 'w' && !t.isNew)!.form).toBe('type');
});
test('Rundenaufbau ist deterministisch', () => { /* zweimal bauen, toEqual */ });
```

- [ ] **Schritt 2: Fehlschlag sehen**: `npx vitest run tests/engine/round.test.ts`.
- [ ] **Schritt 3: Umsetzen** in `round.ts`; Kommentar zu `Stage` in `state.ts`: "0 erster Abruf (Tippen, bei nur Verstehen Hören)".
- [ ] **Schritt 4: Round-UI-Test** (Review Focus 2) in `tests/ui/Round.test.tsx`: Runde mit drei neuen Wörtern, auf der ersten Einführung "Kann ich schon" auslösen; im weiteren Durchlauf erscheint keine Aufgabe mit dieser `cardId` mehr, und es wird genau ein `known`-Ereignis aufgezeichnet. Bestehende Round-Tests, die `intro` gefolgt von `choice` erwarten, auf die neue Folge umstellen.
- [ ] **Schritt 5: `npm test`, `npx tsc --noEmit` grün.**
- [ ] **Schritt 6: Commit** `feat: erster Abruf neuer Items verzögert und mit eigenem Hervorbringen`.

---

### Task 3: Reset-Ereignis im Protokoll und Einstufung danach

**Files:**
- Modify: `src/engine/state.ts` (ReviewEvent, validEvent, replay, dialogsHeard, neue Helfer)
- Modify: `src/store/db.ts` (Settings `placementAt?: number`)
- Modify: `src/ui/useAppState.ts` (AppState `resetAt?: number`)
- Modify: `src/ui/Placement.tsx` (Angebotsbedingung, `updateSettings`-Aufrufe), `src/ui/dev/preview.tsx` falls nötig für tsc
- Test: `tests/engine/state.test.ts`, `tests/sync/gist.test.ts`, `tests/ui/Placement.test.tsx`, `tests/ui/useAppState.test.tsx`

**Interfaces:**
- Produces:
  - Ereignisvariante `{ id: string; cardId: '*'; ts: number; device: string; kind: 'reset' }` in `ReviewEvent`; `RESET_CARD = '*'` exportiert. `validEvent` akzeptiert `kind === 'reset'` (mit den übrigen Pflichtfeldern wie bisher).
  - `export function lastResetTs(events: ReviewEvent[]): number | undefined` (ts des in der Sortierung (ts, id) letzten gültigen `reset`).
  - `replay` und `dialogsHeard` berücksichtigen nur Ereignisse, die in der Sortierung (ts, dann id) nach dem letzten `reset` liegen. Ein interner Helfer `afterLastReset(events: ReviewEvent[]): ReviewEvent[]` (gefiltert, sortiert, dedupliziert) wird von beiden genutzt.
  - `AppState.resetAt?: number` (aus `lastResetTs(events)` in `reload`).
  - `Settings.placementAt?: number`.
  - Placement-Angebot erscheint, wenn `!placementCounts && states.size === 0 && heard.size === 0`, wobei `placementCounts = !!settings.placementDone && (resetAt === undefined || (settings.placementAt ?? 0) > resetAt)`. Alle Stellen, die heute `updateSettings({ placementDone: true })` aufrufen, setzen zusätzlich `placementAt: Date.now()`.

- [ ] **Schritt 1: Fehlschlagende Tests** in `state.test.ts`, describe `reset`:

```ts
const reset = (id: string, ts: number): ReviewEvent => ({ id, cardId: '*', ts, device: 'd1', kind: 'reset' });
test('reset leert den Lernstand, spätere Ereignisse zählen', () => {
  const ev = [review('1', 'a', T0, 3), reset('r', T0 + DAY), review('2', 'b', T0 + 2 * DAY, 3)];
  const st = replay(ev, valid);
  expect(st.has('a')).toBe(false);
  expect(st.get('b')!.stage).toBe(1);
});
test('dialogsHeard ignoriert Gehörtes vor dem reset', () => { /* heard vor und nach reset */ });
test('gleicher ts: id entscheidet, unabhängig von der Eingabereihenfolge', () => {
  const a = review('a1', 'a', T0, 3), r = reset('b0', T0);
  expect(replay([a, r], valid)).toEqual(replay([r, a], valid));
  expect(replay([a, r], valid).has('a')).toBe(false); // 'a1' < 'b0', also vor dem reset
});
test('validEvent akzeptiert reset, lastResetTs liefert den letzten', () => { /* zwei resets */ });
```

  In `gist.test.ts` (Review Focus 4): Remote-Gist mit einem `reset`-Ereignis wird ohne Fehler vereinigt und lokal gespeichert.
  In `Placement.test.tsx`: Angebot erscheint bei `placementDone: true, placementAt: T0` und `resetAt: T0 + 1` mit leerem Lernstand; erscheint nicht bei `placementAt` nach `resetAt`; Überspringen ruft `updateSettings` mit `{ placementDone: true, placementAt: expect.any(Number) }` (bestehende Erwartungen entsprechend anpassen).
- [ ] **Schritt 2: Fehlschlag sehen**: `npx vitest run tests/engine/state.test.ts tests/sync/gist.test.ts tests/ui/Placement.test.tsx`.
- [ ] **Schritt 3: Umsetzen** wie in Interfaces. `useAppState.reload` setzt `resetAt`.
- [ ] **Schritt 4: `useAppState`-Test**: nach `record({ kind: 'reset', cardId: '*' })` ist `states.size === 0` und `resetAt` gesetzt.
- [ ] **Schritt 5: `npm test`, `npx tsc --noEmit` grün.**
- [ ] **Schritt 6: Commit** `feat: Reset-Ereignis im Protokoll, Einstufung danach auf jedem Gerät`.

---

### Task 4: Abschnitt "Neu anfangen" in den Einstellungen

**Files:**
- Modify: `src/ui/Settings.tsx`, ggf. Stildatei unter `src/ui/styles/` (bestehende Klassen bevorzugen)
- Test: `tests/ui/Settings.test.tsx`

**Interfaces:**
- Consumes: `app.record({ kind: 'reset', cardId: RESET_CARD })` und `app.sync()` aus Task 3; `Settings`-Prop `onBack()` für die Rückkehr zur Startseite.

Verhalten:
- Letzter Abschnitt der Einstellungen, Überschrift `Neu anfangen`. Erklärung (Wortlaut fest): "Dein Lernstand beginnt auf allen Geräten, die abgleichen, wieder von vorn. Einstellungen und Token bleiben. Vorher kannst du oben eine Sicherung als Datei speichern."
- Knopf `Fortschritt zurücksetzen` (sekundär). Klick zeigt in der Seite eine Bestätigung mit dem Satz "Wirklich alles zurücksetzen? Das lässt sich nicht rückgängig machen." und den Knöpfen `Ja, alles zurücksetzen` und `Abbrechen`. Kein `window.confirm`. Fokus springt auf `Abbrechen`.
- `Ja, alles zurücksetzen`: einmalig (Sperre gegen Doppeltippen) `record` mit reset, dann `sync()` ohne darauf zu warten, dann `onBack()`.
- `Abbrechen`: Bestätigung schließt, nichts wird aufgezeichnet.
- Gestaltung nach Taste-Skill im Stil der übrigen Einstellungsabschnitte; Hell und Dunkel; Handybreite ohne waagrechtes Scrollen.

- [ ] **Schritt 1: Fehlschlagende Tests** in `tests/ui/Settings.test.tsx`:

```ts
test('Zurücksetzen erst nach Bestätigung, genau ein reset, dann zurück', async () => {
  // render Settings mit fakeApp (record, sync als vi.fn), onBack vi.fn
  // Klick "Fortschritt zurücksetzen": record nicht aufgerufen, Bestätigung sichtbar
  // zweimal schnell "Ja, alles zurücksetzen" klicken
  // expect(record).toHaveBeenCalledTimes(1); expect(record).toHaveBeenCalledWith({ kind: 'reset', cardId: '*' })
  // expect(sync).toHaveBeenCalled(); expect(onBack).toHaveBeenCalled()
});
test('Abbrechen zeichnet nichts auf und schließt die Bestätigung', async () => { /* ... */ });
```

- [ ] **Schritt 2: Fehlschlag sehen**: `npx vitest run tests/ui/Settings.test.tsx`.
- [ ] **Schritt 3: Taste-Skill laden** (Skill `design-taste-frontend`) und den Abschnitt danach umsetzen.
- [ ] **Schritt 4: `npm test`, `npx tsc --noEmit`, `npm run build` grün.**
- [ ] **Schritt 5: Screenshots** mit `node scripts/screenshots.mjs --out <Scratch-Ordner>` (Einstellungen hell und dunkel, Bestätigung offen, Handybreite) und Gate laufen lassen; Gate-Ergebnis im Bericht nennen. Screenshots nicht committen.
- [ ] **Schritt 6: Commit** `feat: Fortschritt in den Einstellungen zurücksetzen, mit Bestätigung`.
