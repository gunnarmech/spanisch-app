# Spanisch-App Teil 1 (App und erste drei Situationen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine installierbare, offline lauffähige Lern-PWA mit FSRS-Wiederholung, Aufgabenstufen, Hör- und Sprechaufgaben, Gist-Abgleich und den Situationen Grundlagen, Café und Restaurant, Einkaufen und Bezahlen, gehostet auf GitHub Pages.

**Architecture:** Reine Client-App. Inhalte liegen als JSON je Situation im Repository, Audio wird vorab mit `edge-tts` erzeugt. Der Lernstand ist ein Anhängeprotokoll von Ereignissen in IndexedDB; der Kartenzustand wird immer durch Abspielen des Protokolls (FSRS über `ts-fsrs`) berechnet, dadurch ist der Abgleich über ein privates Gist eine einfache Vereinigungsmenge.

**Tech Stack:** Vite, TypeScript (strict), Preact, Vitest, @testing-library/preact, fake-indexeddb, idb, ts-fsrs 6.x (MIT), vite-plugin-pwa, Python 3 mit edge-tts für Audio, GitHub Actions und Pages.

**Spec:** `docs/superpowers/specs/2026-11-25-spanisch-app-design.md`

**Teil 2 (eigener Plan danach):** Situationen 4 bis 8, Chile-Ebene mit echten Aufnahmen (Common Voice Pflicht), Einstufungstest über die vollen 100 bis 200 häufigsten Einträge, Benachrichtigung als Kür.

## Global Constraints

- Keine laufenden Kosten, kein Server, kein API-Schlüssel zur Laufzeit außer dem optionalen Gist-Token mit nur dem Recht `gist`.
- Oberfläche komplett auf Deutsch. Keine Emojis, kein "·" als Trenner, keine Gedankenstriche (weder langer noch kurzer Strich als Einschub) in Texten, Kommentaren, Commits.
- Kein Claude-Standard-Look: keine Pillen-Buttons, kein Pfirsich-Kasten, kein Orange, kein Kartenraster. Ruhiges eigenes Design, Dunkelmodus nach Systemeinstellung.
- Nie eine Rückstandszahl anzeigen ("312 fällig" ist verboten). Keine Serien, Punkte, Ranglisten, Herzen.
- Spanisch ist lateinamerikanisch: ustedes, tú als Produktionsform, keine Peninsularismen (vosotros, coger im Sinn von nehmen, ordenador, zumo, móvil, vale als "okay", coche statt auto, celular statt móvil; manejar statt conducir bevorzugt).
- FSRS Ziel-Behaltensquote Voreinstellung 0.9.
- Runde: höchstens 20 Wiederholungen, höchstens 6 neue Items, höchstens 1 Dialogaufgabe; Ziel etwa 5 Minuten.
- "Sicher bekannt" heißt Abrufwahrscheinlichkeit > 0.8 oder als bekannt markiert.
- Stimmen: `cl-f` es-CL-CatalinaNeural, `cl-m` es-CL-LorenzoNeural, `mx-f` es-MX-DaliaNeural, `mx-m` es-MX-JorgeNeural, `co-f` es-CO-SalomeNeural, `co-m` es-CO-GonzaloNeural. Tempo `slow` -25 %, `normal` +0 %, `fast` +15 %.
- Vite `base` ist `/spanisch-app/` (GitHub Pages unter gunnarmech.github.io/spanisch-app).
- Lizenz: Code MIT, Inhalte CC BY-SA 4.0. Quellenseite in der App und in README.

## Review Focus

1. Lange Pause (30 Tage, 400 fällige Karten): erste Runde hat höchstens 20 Wiederholungen, die dringendsten zuerst, und nirgends erscheint eine Zahl des Rückstands. Test in Task 5.
2. Gleiches Ereignis kommt beim Abgleich von beiden Geräten (doppelte IDs, Ereignisse in falscher Zeitreihenfolge): Vereinigung ohne Duplikate, Zustand identisch zur Einzelgeräte-Abspielung. Test in Task 3 und Task 11.
3. Eingabe mit Akzent-Varianten, Satzzeichen, mehrfachen Leerzeichen, umgekehrtem Fragezeichen fehlt, ñ als n getippt: wird als "richtig mit Hinweis" gewertet, nicht als falsch. Test in Task 2.
4. Gerät ohne Spracherkennung (iOS Home-Bildschirm, Firefox): Sprechaufgabe fällt auf Aufnahme und Selbstbewertung zurück, keine Fehlermeldung, Runde läuft weiter. Test in Task 9.
5. Inhalt wird nachgeliefert (neue Items, geänderter Text bei gleicher ID, entfernte ID): Lernstand bleibt erhalten, Ereignisse zu unbekannten IDs werden ignoriert statt abzustürzen. Test in Task 3 und Task 4.

---

## Dateistruktur

```
index.html, vite.config.ts, tsconfig.json, package.json
src/main.tsx                      Einstieg, Service Worker registrieren
src/content/types.ts              Inhaltstypen
src/content/load.ts               Situationen laden (import.meta.glob)
src/content/validate.ts           Strukturprüfung, auch im Test benutzt
src/engine/grade.ts               Tippantwort und Sprechantwort vergleichen
src/engine/state.ts               Ereignisse, Abspielen, Stufen, FSRS
src/engine/round.ts               Runde zusammenstellen
src/engine/coverage.ts            Verständnisanzeige
src/store/db.ts                   IndexedDB: Ereignisse, Einstellungen, Meldungen
src/store/backup.ts               Export und Import als Datei
src/sync/gist.ts                  Abgleich über Gist
src/media/audio.ts                Audio abspielen, Dateipfad bauen
src/media/speech.ts               Spracherkennung und Aufnahme-Ausfallweg
src/ui/App.tsx, Home.tsx, Round.tsx, Settings.tsx, Progress.tsx, Sources.tsx
src/ui/tasks/Choice.tsx, Listen.tsx, Type.tsx, Speak.tsx, Dialog.tsx, Intro.tsx, Grammar.tsx
src/ui/theme.css
content/situations/01-grundlagen.json, 02-cafe.json, 03-einkaufen.json
scripts/tts.py                    Audio erzeugen
scripts/check_content.ts          ruft validate.ts über alle Dateien (npm run check:content)
public/audio/<situationId>/...    erzeugte Dateien plus manifest.json
.github/workflows/pages.yml
tests/... spiegelt src/
```

---

### Task 1: Gerüst, App-Hülle, Deployment-Workflow

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/ui/theme.css`, `.github/workflows/pages.yml`, `README.md`, `LICENSE` (MIT), `content/LICENSE` (CC BY-SA 4.0 Hinweis), `.gitignore`
- Test: `tests/ui/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev`, `npm test` (vitest run), `npm run build`, `npm run check:content`. `App` rendert eine Startseite mit Überschrift "Spanisch für Chile".

- [ ] **Step 1:** Projekt anlegen mit Vite (preact-ts), Abhängigkeiten aus dem Tech Stack installieren, Vitest mit jsdom und `fake-indexeddb/auto` im Setup.
- [ ] **Step 2: Failing test**

```tsx
test('Startseite zeigt Titel', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});
```
- [ ] **Step 3:** `npm test`, erwartet FAIL.
- [ ] **Step 4:** `App` mit Überschrift; `vite.config.ts` mit `base: '/spanisch-app/'` und `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Spanisch für Chile', short_name: 'Spanisch', lang: 'de', display: 'standalone', start_url: '/spanisch-app/' } , workbox: { globPatterns: ['**/*.{js,css,html,json,svg,png}'] } })`. Audio wird nicht im Precache abgelegt (siehe Task 7). Icons als schlichtes SVG und daraus PNG 192 und 512. `theme.css` mit CSS-Variablen für hell und dunkel (`prefers-color-scheme`).
- [ ] **Step 5:** `pages.yml`: bei Push auf `main` `npm ci`, `npm test`, `npm run check:content`, `npm run build`, Upload `dist` und Deploy mit `actions/deploy-pages`.
- [ ] **Step 6:** `npm test` und `npm run build` grün.
- [ ] **Step 7:** Commit `feat: Gerüst mit PWA und Pages-Workflow`.

### Task 2: Antworten bewerten

**Files:**
- Create: `src/engine/grade.ts`
- Test: `tests/engine/grade.test.ts`

**Interfaces:**
- Produces:
  - `type GradeResult = { verdict: 'correct' | 'accent' | 'typo' | 'wrong'; marks: { index: number; length: number }[] }` (`marks` sind Positionen in der Zielform, die abweichen)
  - `gradeTyped(input: string, targets: string[]): GradeResult` (bestes Ergebnis über alle akzeptierten Formen)
  - `gradeSpoken(transcript: string, target: string): { ok: boolean; missing: string[] }` (ok, wenn höchstens 1 von 5 Wörtern fehlt, mindestens aber jedes Inhaltswort mit mehr als 3 Buchstaben bis auf eins vorhanden)
  - `normalize(s: string): string` (klein, Satzzeichen inkl. ¿ ¡ weg, Leerzeichen zusammengefasst, getrimmt)

- [ ] **Step 1: Failing tests**

```ts
test('Satzzeichen und Gross/Klein egal', () =>
  expect(gradeTyped('donde esta el bano', ['¿Dónde está el baño?']).verdict).toBe('accent'));
test('exakt', () => expect(gradeTyped('¿Dónde está el baño?', ['¿Dónde está el baño?']).verdict).toBe('correct'));
test('ohne ¿ trotzdem correct', () => expect(gradeTyped('dónde está el baño', ['¿Dónde está el baño?']).verdict).toBe('correct'));
test('ein Tippfehler', () => expect(gradeTyped('¿Dónde está el bañp?', ['¿Dónde está el baño?']).verdict).toBe('typo'));
test('zwei Fehler sind falsch', () => expect(gradeTyped('donde esta al bamp', ['¿Dónde está el baño?']).verdict).toBe('wrong'));
test('Alternative Form', () => expect(gradeTyped('la cuenta por favor', ['La cuenta, por favor.', 'Me trae la cuenta']).verdict).toBe('correct'));
test('leere Eingabe ist falsch', () => expect(gradeTyped('   ', ['hola']).verdict).toBe('wrong'));
test('Sprechen tolerant', () => expect(gradeSpoken('donde esta el baño', '¿Dónde está el baño?').ok).toBe(true));
test('Sprechen fehlendes Inhaltswort', () => expect(gradeSpoken('donde esta', '¿Dónde está el baño?')).toEqual({ ok: false, missing: ['baño'] }));
```
- [ ] **Step 2:** `npx vitest run tests/engine/grade.test.ts`, erwartet FAIL.
- [ ] **Step 3:** Implementieren. Vergleich zweistufig: `normalize` dann ohne diakritische Zeichen (NFD, Kombinationszeichen entfernen, ñ zählt wie n). Gleich nach `normalize` = correct, gleich ohne Diakritika = accent, Levenshtein-Abstand 1 auf der diakritikfreien Form = typo. Kurze Wörter (Zielform unter 4 Zeichen) erlauben keinen Tippfehler.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Antworten bewerten`.

### Task 3: Ereignisprotokoll, FSRS und Stufen

**Files:**
- Create: `src/engine/state.ts`
- Test: `tests/engine/state.test.ts`

**Interfaces:**
- Consumes: `ts-fsrs` (`fsrs`, `generatorParameters`, `createEmptyCard`, `Rating`, `State`).
- Produces:
  - `type Stage = 0 | 1 | 2 | 3 | 4` (0 Erstkontakt plus Auswahl, 1 Hören zu Bedeutung, 2 Deutsch zu Spanisch tippen, 3 Sprechen, 4 Hören unter Druck)
  - `type ReviewEvent = { id: string; cardId: string; ts: number; device: string; kind: 'review'; rating: 1 | 2 | 3 | 4; stage: Stage } | { id: string; cardId: string; ts: number; device: string; kind: 'known' }`
  - `type CardState = { card: import('ts-fsrs').Card; stage: Stage; known: boolean; lastTs: number }`
  - `replay(events: ReviewEvent[], validCardIds: Set<string>, retention?: number): Map<string, CardState>` (sortiert nach `ts`, dann `id`; doppelte `id` einmal; Ereignisse zu unbekannten `cardId` ignoriert)
  - `retrievability(s: CardState, now: number): number`
  - `ratingFor(verdict: GradeResult['verdict'], ms: number, stage: Stage, usedHint: boolean): 1 | 2 | 3 | 4` (wrong 1; accent, typo, Hinweis oder ms > 15000: 2; Stufe ≥ 3 und ms < 4000: 4; sonst 3)
  - `newEvent(partial: Omit<ReviewEvent, 'id' | 'ts' | 'device'>, device: string, now?: number): ReviewEvent` (id per `crypto.randomUUID()`)
- Kartenschnitt (Festlegung): eine Karte je Item, `cardId` = Item-ID; Grammatikübungen haben eigene Karten `<grammarId>#<n>`; Dialoge sind keine Karten.
- Stufenregel: Rating 3 oder 4 hebt die Stufe um 1 (max 4), Rating 1 senkt um 1 (min 0), Rating 2 lässt sie. `known` setzt Stufe 4, `known = true`, und die Karte auf Zustand Review mit Fälligkeit `ts + 60 Tage` und Stabilität 60. Ein Rating 1 auf einer `known`-Karte setzt `known = false` und Stufe 2.

- [ ] **Step 1: Failing tests**

```ts
test('neue Karte nach Good auf Stufe 1 und später fällig', ...)  // stage 1, card.due > ts
test('Again senkt Stufe nicht unter 0', ...)
test('doppelte Ereignis-IDs zählen einmal', ...) // replay([e, e]) == replay([e])
test('Reihenfolge der Eingabe egal', ...) // replay(shuffled) deepEquals replay(sorted)
test('unbekannte cardId wird ignoriert', ...) // map hat Eintrag nicht, kein Fehler
test('known setzt Stufe 4 und Fälligkeit +60 Tage', ...)
test('Again nach known hebt known auf, Stufe 2', ...)
test('ratingFor', () => { expect(ratingFor('wrong', 1000, 2, false)).toBe(1); expect(ratingFor('typo', 1000, 2, false)).toBe(2); expect(ratingFor('correct', 20000, 2, false)).toBe(2); expect(ratingFor('correct', 3000, 3, false)).toBe(4); expect(ratingFor('correct', 3000, 2, false)).toBe(3); });
```
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren mit `fsrs(generatorParameters({ request_retention: retention ?? 0.9, enable_fuzz: false }))`, ohne Fuzz, damit Abspielen deterministisch ist.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Ereignisprotokoll mit FSRS und Stufen`.

### Task 4: Inhaltsformat, Prüfung, Verständnisanzeige, Probeinhalt

**Files:**
- Create: `src/content/types.ts`, `src/content/validate.ts`, `src/content/load.ts`, `src/engine/coverage.ts`, `scripts/check_content.ts`, `content/situations/01-grundlagen.json` (Probeinhalt: 10 Wörter und Wendungen, 3 Sätze, 1 Dialog, 1 Grammatik, 1 Hörpaar)
- Test: `tests/content/validate.test.ts`, `tests/engine/coverage.test.ts`

**Interfaces:**
- Produces (`src/content/types.ts`):

```ts
type Example = { es: string; de: string };
type WordItem = { id: string; kind: 'word' | 'phrase'; es: string; de: string; accept?: string[]; forms: string[];
  examples: Example[]; note?: string; chile?: { note: string; source: string }; freqRank?: number };
type SentenceItem = { id: string; kind: 'sentence'; es: string; de: string; accept?: string[] };
type DialogItem = { id: string; kind: 'dialog'; title: string; lines: { speaker: 'A' | 'B'; es: string; de: string }[] };
type GrammarItem = { id: string; kind: 'grammar'; title: string; explanation: string; examples: Example[];
  exercises: { de: string; es: string; accept?: string[] }[] };
type PairItem = { id: string; kind: 'pair'; es: string; options: string[] }; // es ist die richtige Option, options enthält es
type Item = WordItem | SentenceItem | DialogItem | GrammarItem | PairItem;
type Situation = { id: string; order: number; title: string; items: Item[] };
```
  - `validateSituation(s: unknown, allIds: Set<string>): string[]` (Fehlerliste, leer = gut)
  - `tokens(es: string): string[]` (über `normalize` aus Task 2, an Leerzeichen getrennt)
  - `situationCoverage(s: Situation, states: Map<string, CardState>, now: number): number` (Anteil der Dialog-Tokens, deren Wort-Item sicher bekannt ist; 0 bis 1)
  - `loadSituations(): Situation[]` (alle JSON aus `content/situations`, sortiert nach `order`)
- Prüfregeln in `validateSituation`: IDs eindeutig über alle Dateien und Form `^[a-z0-9-]+$`; Pflichtfelder je Typ; `explanation` höchstens 600 Zeichen; Dialog 4 bis 10 Zeilen; jeder Dialog-Token ist in `forms` (normalisiert) irgendeines Wort-Items aller Situationen enthalten, sonst Fehler mit Token; `pair.options` enthält `pair.es` und 2 bis 4 Einträge; Sperrliste Peninsularismen, nur als ganzes Wort (Wortgrenzen, nach `normalize` ohne Diakritika): `vosotros`, `vosotras`, `os`, `ordenador`, `zumo`, `movil`, `coger`, `coche`, `habeis`, `teneis`, `estais`, `sois`, `vais`; jeder Treffer in einem spanischen Text ist ein Fehler. `vale` bleibt erlaubt ("¿Cuánto vale?"), wird aber in der Inhaltsprüfung von Hand beachtet.
- `npm run check:content` ruft das für alle Dateien auf und beendet mit Code 1 bei Fehlern.

- [ ] **Step 1: Failing tests**

```ts
test('gültige Situation ohne Fehler', ...)
test('doppelte ID wird gemeldet', ...)
test('Dialogwort ohne Wort-Item wird gemeldet', ...) // Fehlertext enthält das Token
test('Peninsularismus wird gemeldet', ...) // "¿Tenéis mesa?" -> Fehler
test('nos ist kein Treffer für os', ...) // "Nos vemos" -> kein Fehler
test('Abdeckung 0.5 wenn Hälfte bekannt', ...)
test('entfernte ID im Lernstand bricht nichts', ...) // states mit cardId, die es nicht mehr gibt
```
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren, Probeinhalt schreiben.
- [ ] **Step 4:** `npm test` und `npm run check:content` grün.
- [ ] **Step 5:** Commit `feat: Inhaltsformat, Prüfung und Verständnisanzeige`.

### Task 5: Runde zusammenstellen

**Files:**
- Create: `src/engine/round.ts`
- Test: `tests/engine/round.test.ts`

**Interfaces:**
- Consumes: `CardState`, `retrievability`, `Stage` (Task 3); `Situation`, `Item`, `WordItem`, `DialogItem` aus `src/content/types.ts` und `situationCoverage`, `tokens` (Task 4).
- Produces:
  - `type Task = { cardId: string; itemId: string; situationId: string; form: 'intro' | 'choice' | 'listen' | 'type' | 'speak' | 'pressure' | 'dialog' | 'grammar'; isNew: boolean }`
  - `buildRound(opts: { now: number; states: Map<string, CardState>; situations: Situation[]; focusSituationId?: string; maxReviews?: number; maxNew?: number }): { tasks: Task[]; finished: boolean }`
  - `currentSituation(situations: Situation[], states: Map<string, CardState>): string` (erste nach `order` mit ungesehenen Items)
- Regeln: fällig ist eine Karte mit `card.due <= now`. Fällige Karten aufsteigend nach `retrievability`, höchstens `maxReviews` (20). Danach neue Items aus `focusSituationId ?? currentSituation`, höchstens `maxNew` (6), in Dateireihenfolge; neue Items starten mit `intro` direkt gefolgt von `choice`. Ein Dialog der Situation kommt dazu, wenn mindestens 80 % seiner Wörter gesehen sind ("gesehen": Token gehört zu einem Wort-Item, das einen Eintrag in `states` hat), höchstens einer. Aufgabenform aus Stufe: 0 choice, 1 listen, 2 type, 3 speak, 4 pressure; Grammatikkarten immer `grammar`. Wiederholungen und neue Items werden gemischt, aber kein neues Item vor seinem `intro`. `finished` ist true, wenn weder fällige noch neue Items übrig sind.

- [ ] **Step 1: Failing tests**

```ts
test('400 fällige: genau 20, dringendste zuerst', ...)  // tasks.filter(!isNew).length === 20, und die 20 haben die kleinste retrievability
test('höchstens 6 neue, intro vor choice', ...)
test('focusSituationId bestimmt neue Items', ...)
test('nichts fällig, nichts neu: finished', ...)
test('Form folgt Stufe', ...) // Stufe 2 -> 'type'
```
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Runde zusammenstellen`.

### Task 6: Speicher und Sicherung

**Files:**
- Create: `src/store/db.ts`, `src/store/backup.ts`
- Test: `tests/store/db.test.ts`, `tests/store/backup.test.ts`

**Interfaces:**
- Consumes: `ReviewEvent` (Task 3).
- Produces:
  - `type Settings = { device: string; retention: number; gistToken?: string; gistId?: string; voiceSpeedNew: 'slow' | 'normal'; lastSync?: number }`
  - `type ErrorReport = { id: string; itemId: string; ts: number; text: string }`
  - `openDb(): Promise<Db>`; `Db` mit `addEvents(e: ReviewEvent[]): Promise<void>` (idempotent über `id`), `allEvents(): Promise<ReviewEvent[]>`, `getSettings(): Promise<Settings>` (legt beim ersten Aufruf `device` per `crypto.randomUUID()` und `retention: 0.9` an), `saveSettings(s: Settings): Promise<void>`, `addReport(r: ErrorReport)`, `allReports()`
  - `exportBackup(db: Db): Promise<Blob>` (JSON `{ version: 1, events, reports }`, Token wird nie exportiert), `importBackup(db: Db, file: Blob): Promise<number>` (Anzahl neuer Ereignisse; ungültige Datei wirft `Error('Keine gültige Sicherung')`)
  - `navigator.storage.persist()` beim Start einmal anfragen.

- [ ] **Step 1: Failing tests** (fake-indexeddb): Ereignisse doppelt hinzufügen ergibt eine Zeile; Einstellungen erstmals mit device und 0.9; Export enthält keinen Token; Import einer Sicherung zählt nur neue Ereignisse; Import von Unsinn wirft.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren mit `idb`.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Speicher und Sicherung`.

### Task 7: Audio-Erzeugung und Abspielen

**Files:**
- Create: `scripts/tts.py`, `scripts/requirements.txt` (`edge-tts`), `src/media/audio.ts`
- Modify: `vite.config.ts` (Workbox Laufzeit-Cache für Audio)
- Test: `tests/media/audio.test.ts`, `scripts/test_tts.py` (pytest, nur Planungslogik ohne Netz)

**Interfaces:**
- Consumes: Inhaltsdateien (Task 4).
- Produces:
  - Dateipfad: `public/audio/<situationId>/<key>-<voice>-<speed>.mp3`, `key` ist Item-ID, bei Dialogzeilen `<dialogId>-<zeile>`, bei Beispielen `<itemId>-ex<n>`, bei Grammatikübungen `<grammarId>-<n>`.
  - `public/audio/<situationId>/manifest.json`: `{ [key: string]: { voice: VoiceId; speed: 'slow' | 'normal' | 'fast' }[] }`
  - `scripts/tts.py [--situation ID] [--only-missing]`: Plan je Key: Wörter und Sätze zwei Stimmen (eine `cl-*`, eine aus `mx`/`co` reihum), je `normal` und `slow`, Sätze zusätzlich `fast` in `cl-*`. Dialoge: Sprecher A `cl-f`, B im Wechsel `mx-m`/`co-m`, nur `normal` und `fast`. Pausen: Abfrage höchstens 4 parallel; bei Fehler einer Stimme Ersatz aus derselben Länderliste, sonst nächste. Text-Hash in Manifest speichern (`hash`-Feld je Eintrag), damit geänderte Texte neu erzeugt werden.
  - `type VoiceId = 'cl-f' | 'cl-m' | 'mx-f' | 'mx-m' | 'co-f' | 'co-m'`
  - `audioUrl(situationId: string, key: string, pick: { voice?: VoiceId; speed: 'slow' | 'normal' | 'fast'; preferChile?: boolean }, manifest: Manifest): string | null`
  - `play(url: string): Promise<void>` (ein gemeinsames `HTMLAudioElement`, erst nach Nutzergeste; Fehler werden geschluckt und geloggt)
  - `prefetchSituation(situationId: string, manifest: Manifest): Promise<void>` (lädt alle Dateien der Situation in den Cache `audio-v1`)
- Workbox: `runtimeCaching` für `/audio/` mit `CacheFirst`, Cache `audio-v1`, `rangeRequests: true` (Safari).
- Format mp3 vorläufig; endgültig nach Task 10.

- [ ] **Step 1: Failing tests**: `audioUrl` wählt chilenische Stimme bei `preferChile`, fällt auf vorhandene zurück, liefert `null` ohne Eintrag; Python: Plan für ein Wort ergibt 4 Dateien mit genau einer `cl`-Stimme, `--only-missing` überspringt vorhandene Hashes.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren; einmal `python scripts/tts.py --situation 01-grundlagen` auf dem Probeinhalt ausführen.
- [ ] **Step 4:** Tests grün, Dateien vorhanden, eine Datei per Ohr ist nicht prüfbar: stattdessen Dateigröße > 2 KB und Dauer > 0 mit `ffprobe`, falls vorhanden, sonst Größe.
- [ ] **Step 5:** Commit `feat: Audio erzeugen und abspielen`.

### Task 8: Lernrunde in der Oberfläche

**Files:**
- Create: `src/ui/Home.tsx`, `src/ui/Round.tsx`, `src/ui/tasks/Intro.tsx`, `Choice.tsx`, `Listen.tsx`, `Type.tsx`, `Pressure.tsx` (Hörvariante von Listen mit `fast` und anderer Stimme, ohne Text), `Grammar.tsx`, `Dialog.tsx`, `src/ui/useAppState.ts`
- Modify: `src/ui/App.tsx`
- Test: `tests/ui/Round.test.tsx`, `tests/ui/Type.test.tsx`

**Interfaces:**
- Consumes: `buildRound`, `Task` (Task 5); `gradeTyped` (Task 2); `ratingFor`, `newEvent`, `replay` (Task 3); `Db` (Task 6); `audioUrl`, `play` (Task 7); `loadSituations`, `situationCoverage` (Task 4).
- Produces:
  - `useAppState()`: `{ situations, states, settings, record(e: Omit<ReviewEvent,'id'|'ts'|'device'>): Promise<void>, reload(): Promise<void> }`
  - Jede Aufgabenkomponente: `props: { task: Task; item: Item; onDone(result: { verdict: GradeResult['verdict']; ms: number; usedHint: boolean } | { known: true }): void }`
- Verhalten:
  - Home: Knopf "Heute lernen"; Liste der Situationen mit Verständnis in Prozent ("du verstehst etwa 70 % der Dialoge"); Tippen auf eine Situation startet eine Runde mit `focusSituationId`. Keine Zahlen fälliger Karten.
  - Runde: eine Aufgabe nach der anderen, schmaler Fortschrittsbalken ohne Zahlen. Nach Antwort sofort Rückmeldung mit richtiger Form und Ton; bei `typo` und `accent` Stellen markieren (`marks`). Bei `wrong` zuerst Hinweis (erster Buchstabe jedes Wortes) und zweiter Versuch, dann Lösung; Rating aus dem zweiten Versuch mit `usedHint: true`.
  - Jede Aufgabe hat "kann ich schon" (Ereignis `known`) und "Fehler melden" (kleines Textfeld, `addReport`).
  - Rundenende: was neu war (Liste der Items), Verständnisänderung der Situation, Knöpfe "fertig" und "noch eine Runde".
  - Tastatur: Enter bestätigt, 1 bis 4 wählen, Leertaste spielt Ton (nicht im Textfeld), Escape schließt Meldung.
  - Choice: 3 Ablenker aus derselben Situation, nie die richtige doppelt; zu wenig Items: aus allen Situationen.
  - Dialog: erst nur Ton, dann Text einblendbar, dann Zeile für Zeile; kein Rating und kein Ereignis.
  - Form `speak` wird in dieser Aufgabe vorläufig mit `Type.tsx` gestellt; Task 9 ersetzt das durch `Speak.tsx`.

- [ ] **Step 1: Failing tests**: Runde mit 2 neuen Items zeigt Intro, dann Choice; richtige Auswahl erzeugt `review`-Ereignis mit Rating 3; Type zeigt bei `accent` den Hinweis und markiert; "kann ich schon" erzeugt `known`; Home zeigt keine Ziffernfolge "fällig" (Text-Suche nach /fällig/ leer).
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren. Gestaltung nach Global Constraints; Skill `frontend-design` laden und sich daran halten.
- [ ] **Step 4:** Tests grün; `npm run dev`, mit Playwright Screenshot von Home und einer Aufgabe bei 390 px und 1280 px Breite in hell und dunkel, prüfen, dass nichts überläuft.
- [ ] **Step 5:** Commit `feat: Lernrunde in der Oberfläche`.

### Task 9: Sprechaufgabe mit Ausfallweg

**Files:**
- Create: `src/media/speech.ts`, `src/ui/tasks/Speak.tsx`
- Test: `tests/media/speech.test.ts`, `tests/ui/Speak.test.tsx`

**Interfaces:**
- Consumes: `gradeSpoken` (Task 2), `play`, `audioUrl` (Task 7).
- Produces:
  - `speechSupported(): boolean` (`SpeechRecognition` oder `webkitSpeechRecognition` vorhanden)
  - `recognize(lang?: string, timeoutMs?: number): Promise<string | null>` (Voreinstellung `es-CL`, bei Sprachfehler einmal `es-419`; `null` bei Fehler, Ablehnung oder Zeitüberschreitung 8000 ms)
  - `recordClip(maxMs?: number): Promise<Blob | null>` (`MediaRecorder`, max 6000 ms; `null`, wenn nicht verfügbar)
- Speak-Verhalten: Deutsch zeigen, Knopf "sprechen". Mit Erkennung: Ergebnis über `gradeSpoken`, fehlende Wörter markieren, zweiter Versuch möglich, dann Original abspielen. Ohne Erkennung oder bei `null`: Aufnahme, danach Original und eigene Aufnahme nacheinander abspielen, Knöpfe "klang gleich" (verdict `correct`) und "eher nicht" (verdict `wrong`). Ohne Mikrofon: Text "Mikrofon nicht verfügbar", Aufgabe wird als `type` gestellt. Keine Fehlermeldung im Ablauf.

- [ ] **Step 1: Failing tests**: ohne `SpeechRecognition` im `window` zeigt Speak die Aufnahme-Variante; `recognize` liefert `null` bei `onerror`; mit gemockter Erkennung "donde esta el baño" wird `correct` gemeldet; ohne `MediaRecorder` und ohne Erkennung wird die Tippvariante gezeigt.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Sprechaufgabe mit Ausfallweg`.

### Task 10: Veröffentlichen und iPhone-Durchstich (Prüfpunkt mit Gunnar)

**Files:**
- Modify: `README.md` (Installation auf iPhone und PC, Quellen)
- Create: `src/ui/Diagnose.tsx` (Seite unter Einstellungen: zeigt `speechSupported`, Anzeige-Modus standalone ja/nein, Testknopf Ton, Testknopf Mikrofon, Testknopf Erkennung, Speicher `navigator.storage.estimate()`)

- [ ] **Step 1:** Diagnose-Seite bauen, Test: Seite rendert alle fünf Prüfzeilen.
- [ ] **Step 2:** Öffentliches Repository `gunnarmech/spanisch-app` anlegen (`gh repo create gunnarmech/spanisch-app --public --source . --push`), Pages auf "GitHub Actions" stellen (`gh api -X POST repos/gunnarmech/spanisch-app/pages -f build_type=workflow`).
- [ ] **Step 3:** Workflow grün, Seite unter `https://gunnarmech.github.io/spanisch-app/` erreichbar (`curl -sI` liefert 200).
- [ ] **Step 4:** Gunnar bitten (eine Nachricht, kurze Schritte): in Safari öffnen, "Zum Home-Bildschirm", aus dem Home-Bildschirm starten, Diagnose-Seite öffnen, die fünf Zeilen per Screenshot schicken, dann Flugmodus und App neu öffnen. Bis zur Antwort mit Task 11 und 12 weitermachen.
- [ ] **Step 5:** Ergebnis in `docs/ios-test.md` festhalten. Spielt mp3 nicht zuverlässig, auf AAC in `.m4a` umstellen (`tts.py` mit ffmpeg nachkodieren) und neu erzeugen. Funktioniert Erkennung im Standalone-Modus nicht, bleibt der Ausfallweg Standard auf iOS; nichts weiter zu bauen.
- [ ] **Step 6:** Commit `feat: Diagnose und Veröffentlichung`.

### Task 11: Abgleich über Gist

**Files:**
- Create: `src/sync/gist.ts`, Abschnitt in `src/ui/Settings.tsx`
- Test: `tests/sync/gist.test.ts`

**Interfaces:**
- Consumes: `Db`, `Settings` (Task 6); `ReviewEvent` (Task 3).
- Produces:
  - `mergeEvents(a: ReviewEvent[], b: ReviewEvent[]): ReviewEvent[]` (Vereinigung über `id`, sortiert nach `ts`, `id`)
  - `syncNow(db: Db, fetchImpl?: typeof fetch): Promise<{ added: number; pushed: number } | { error: string }>`
- Ablauf: ohne Token nichts tun. Ohne `gistId`: `GET /gists` durchsuchen nach Beschreibung `spanisch-app sync`; sonst neu anlegen (`public: false`, Datei `spanisch-app-log.json`). Datei lesen (bei `truncated` über `raw_url`), Inhalt `{ version: 1, events }`, mit lokalen Ereignissen vereinigen, lokal fehlende speichern, Ergebnis per `PATCH` schreiben, wenn sich etwas geändert hat. Fehler (401, Netz) als `{ error }` mit deutschem Text, nie werfen. Ausgelöst beim Start, nach jeder Runde und per Knopf "jetzt abgleichen". Einstellungen werden nicht abgeglichen (pro Gerät, Festlegung).
- Settings-Seite: Feld für Token mit Anleitung (Link `https://github.com/settings/tokens/new?scopes=gist&description=spanisch-app`), Zeitpunkt des letzten Abgleichs, Knöpfe Export und Import, Ziel-Behaltensquote (0.8 bis 0.95), Link Diagnose, Link Quellen.

- [ ] **Step 1: Failing tests** (fetch gemockt): `mergeEvents` mit Überlappung ohne Duplikate; zwei Geräte mit verschiedenen Ereignissen landen nach je einem Abgleich bei identischem `replay`; 401 liefert `{ error }` mit "Token"; ohne Token kein fetch-Aufruf; vorhandenes Gist wird über Beschreibung gefunden.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Abgleich über Gist`.

### Task 12: Fortschritt, Quellen, kurzer Einstufungstest

**Files:**
- Create: `src/ui/Progress.tsx`, `src/ui/Sources.tsx`, `src/ui/Placement.tsx`
- Test: `tests/ui/Placement.test.tsx`, `tests/ui/Progress.test.tsx`

**Interfaces:**
- Consumes: `situationCoverage`, `retrievability`, `record`.
- Produces:
  - Progress: je Situation Verständnis in Prozent als ruhiger Balken; gesamt "sicher bekannte Wörter und Wendungen: N"; keine Fälligkeitszahlen.
  - Sources: Lizenzen (Code MIT, Inhalte CC BY-SA 4.0, FrequencyWords CC BY-SA 4.0 mit Link, Tatoeba CC BY 2.0 FR falls benutzt, ts-fsrs MIT, Stimmen erzeugt mit edge-tts) und Liste der Fehlermeldungen mit Export als Text.
  - Placement: beim allerersten Start Angebot "kurz einstufen" oder "überspringen". Zeigt die ersten 40 Wort-Items nach `freqRank` als Hören plus Auswahl; richtig und schnell (unter 4 s) erzeugt `known`, sonst nichts. Abbruch jederzeit. Der volle Test (100 bis 200) kommt in Teil 2.

- [ ] **Step 1: Failing tests**: Placement erzeugt `known` nur bei richtiger, schneller Antwort; Überspringen erzeugt kein Ereignis und erscheint nicht wieder; Progress zeigt Prozent je Situation und keine "fällig"-Zahl.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** Tests grün.
- [ ] **Step 5:** Commit `feat: Fortschritt, Quellen, Einstufung`.

### Task 13: Inhalt Situation 1, Grundlagen

**Files:**
- Modify: `content/situations/01-grundlagen.json` (Probeinhalt ersetzen)
- Create: `content/frequency/README.md` (Herkunft hermitdave/FrequencyWords es_50k, CC BY-SA 4.0), `content/frequency/es_top5000.txt` (die ersten 5000 Zeilen von `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt`)

Inhalt: Begrüßen und Verabschieden, sich vorstellen, bitte und danke, Verstehen und Nichtverstehen ("¿Puede repetir, más despacio, por favor?", "No entiendo", "¿Cómo se dice ... en español?"), ja und nein, Zahlen 0 bis 100, Preise ("mil", "dos mil quinientos" für Pesos), Fragewörter. Umfang: 120 bis 160 Wörter und Wendungen, 40 bis 60 Sätze, 5 Dialoge, Grammatik: Fragewörter, ser für Herkunft und Namen, Verneinung, Artikel und Geschlecht; 4 Hörpaare (z. B. "trece / treinta", "seis / siete", "quince / cincuenta", "doscientos / dos mil"). `freqRank` aus der Liste setzen, wo das Lemma vorkommt.

- [ ] **Step 1:** Inhalt schreiben; Peninsularismen-Prüfliste und Global Constraints befolgen; `tú` als Produktionsform, `usted` in Höflichkeitsformeln mit Hinweis.
- [ ] **Step 2:** `npm run check:content` grün.
- [ ] **Step 3:** `python scripts/tts.py --situation 01-grundlagen --only-missing`, Manifest vollständig für alle Keys (Prüfskript im Test: jeder Key aus dem Inhalt hat mindestens einen Manifest-Eintrag; diesen Test in `tests/content/audio-manifest.test.ts` anlegen, er gilt für alle Situationen).
- [ ] **Step 4:** Commit `content: Situation Grundlagen`.

Review dieser Aufgabe ausdrücklich mit Prüfliste: natürliches Spanisch, wie man es in Santiago hört; keine Peninsularismen; Übersetzungen korrekt; Dialoge nur aus eingeführten Wörtern.

### Task 14: Inhalt Situation 2, Café und Restaurant

**Files:** Create `content/situations/02-cafe.json`

Inhalt: bestellen ("Quiero...", "Me gustaría...", "¿Me da...?", "Para llevar / para servir"), Getränke und Essen in Chile (café, té, agua con gas / sin gas, jugo, once als Abendmahlzeit, completo, empanada de pino, sopaipilla, pebre, menú del día, almuerzo), nachfragen ("¿Qué me recomienda?", "¿Tiene algo sin carne?"), Allergien, Rechnung und Trinkgeld ("La cuenta, por favor", "¿Incluye la propina?", 10 % propina sugerida), Karte oder bar. Umfang: 100 bis 140 Wörter und Wendungen, 40 bis 60 Sätze, 6 Dialoge, Grammatik: querer und poder im Präsens, "me gustaría", estar für Zustand ("está rico"), Mengen ("un poco de", "más"). Chile-Hinweise im Feld `chile` mit Begründung (z. B. once, completo, "al tiro" kommt erst in Teil 2).

- [ ] **Step 1:** Inhalt schreiben.
- [ ] **Step 2:** `npm run check:content` grün.
- [ ] **Step 3:** Audio erzeugen, Manifest-Test grün.
- [ ] **Step 4:** Commit `content: Situation Café und Restaurant`.

Review mit derselben Prüfliste wie Task 13.

### Task 15: Inhalt Situation 3, Einkaufen und Bezahlen

**Files:** Create `content/situations/03-einkaufen.json`

Inhalt: Supermarkt, Kiosk und Almacén, Feria, Apotheke nur als Laden (Gesundheit kommt in Teil 2), Preise in Pesos ("¿Cuánto cuesta / cuánto sale?", "luca" nur als Chile-Hinweis), Größen und Mengen, Karte oder bar ("¿Con tarjeta o efectivo?", "débito o crédito", "¿Quiere boleta?"), Tüte ("bolsa"), Wechselgeld ("vuelto"). Umfang: 100 bis 140 Wörter und Wendungen, 40 bis 60 Sätze, 6 Dialoge, Grammatik: tener und hay, Demonstrativa (este, ese), Zahlen über 100 in Preisen, "voy a" für nahe Zukunft. 3 Hörpaare mit Preisen.

- [ ] **Step 1:** Inhalt schreiben.
- [ ] **Step 2:** `npm run check:content` grün.
- [ ] **Step 3:** Audio erzeugen, Manifest-Test grün.
- [ ] **Step 4:** Commit `content: Situation Einkaufen und Bezahlen`.

Review mit derselben Prüfliste wie Task 13.

### Task 16: Gesamtlauf und Auslieferung

- [ ] **Step 1:** `npm test`, `npm run check:content`, `npm run build` grün.
- [ ] **Step 2:** Mit Playwright gegen `npm run preview`: erste Runde vollständig durchspielen (Placement überspringen, 6 neue Items, Rundenende, "noch eine Runde"), Screenshot je Aufgabentyp bei 390 px, keine Konsolenfehler.
- [ ] **Step 3:** Push, Workflow grün, Live-Seite lädt `manifest.webmanifest` und mindestens eine Audiodatei mit 200.
- [ ] **Step 4:** Commit und Push etwaiger Korrekturen.
