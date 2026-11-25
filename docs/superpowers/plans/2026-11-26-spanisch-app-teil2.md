# Spanisch-App Teil 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Situationen 4 bis 9 mit Ton und Foto, echte chilenische Aufnahmen (OpenSLR SLR71) als Höraufgabe "Chile hören" in den Runden, voller Einstufungstest über 150 Einträge, Audio-Cache für alle Situationen.

**Architecture:** Wie Teil 1. Neue Situationen sind weitere JSON-Dateien. Die echten Aufnahmen liegen als eigene Inhaltsdatei `content/chile-hoeren.json` (kein Situations-Item) mit Audio unter `public/audio/chile-echt/`; die Runde wählt daraus höchstens einen Satz, das Ergebnis ist ein `heard`-Ereignis wie bei Dialogen. "Nur verstehen" (`produce: false`) ändert nur die Aufgabenform beim Zusammenstellen der Runde, nicht `replay`.

**Tech Stack:** Vite, TypeScript strict, Preact, Vitest, ts-fsrs, vite-plugin-pwa, Python 3 mit edge-tts, ffmpeg über das Python-Paket `imageio-ffmpeg`.

**Spec:** `docs/superpowers/specs/2026-11-26-spanisch-app-teil2-design.md` (baut auf `2026-11-25-spanisch-app-design.md` und `2026-11-25-spanisch-app-gestaltung-design.md` auf)

## Global Constraints

- Alle Global Constraints aus `docs/superpowers/plans/2026-11-25-spanisch-app-teil1.md` gelten unverändert (Deutsch, keine Gedankenstriche, kein "·", keine Emojis, kein Violett, kein Claude-Look, keine Rückstandszahl, lateinamerikanisches Spanisch ohne Peninsularismen, Runde höchstens 20 Wiederholungen, 6 neue, 1 Höraufgabe).
- Bestehende IDs in `01-grundlagen`, `02-cafe`, `03-einkaufen` bleiben unverändert. Neue IDs sind über alle Dateien eindeutig.
- Jede sichtbare Änderung mit dem Taste-Skill (`C:\Users\gunna\.claude\skills\design-taste-frontend`, SKILL.md lesen) aus vorhandenen Bausteinen bauen; Screenshots nur unter dem Scratch-Ordner, nie im Repository.
- Commit-Nachrichten auf Deutsch, ohne Gedankenstriche, mit den Trailern `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` und `Claude-Session: https://claude.ai/code/session_01Teb8h2PPyMu23P6VknPiNU`.
- WAV-Archive von SLR71 nie ins Repository; sie liegen unter `C:\Users\gunna\AppData\Local\Temp\claude\53f0401640b2da3e\929eae73-4501-480c-a5a7-87c8432d3f80\scratchpad\slr71\` (`es_cl_female.zip`, `es_cl_male.zip`, `line_index_female.tsv`, `line_index_male.tsv`).
- Checks nach jeder Aufgabe: `npm test`, `npm run check:content`, `npm run build` grün.

## Review Focus

1. Gunnar hat schon Lernstand in Situation 1 bis 3: Einstufung bietet nur Items ohne Ereignis an und schreibt nie ein `known` auf ein Item mit Lernstand. Test in Task 4.
2. Chile-Aufnahmen offline nicht im Cache oder Manifest fehlt: Aufgabe wird übersprungen, Runde läuft weiter, kein Text als Ersatz. Test in Task 3.
3. Item mit `produce: false` auf Stufe 2, 3 oder nach `known` (Stufe 4) mit Fehler zurück auf 2: nie Tipp- oder Sprechaufgabe. Test in Task 1.
4. Ereignisse zu Clip-IDs beim Abgleich und in `replay`: werden nicht als Karten behandelt und brechen nichts; Clip-IDs kollidieren nicht mit Item-IDs. Test in Task 2 und Prüfung in Task 1.
5. Viele Situationen: Audio-Cache-Grenze reicht für alle Manifeste; Vorabruf bleibt je Situation. Test in Task 3.

---

## Dateistruktur

```
src/content/types.ts          + produce?: false an Wort/Wendung/Satz, Typ ChileClip
src/content/validate.ts       + Grammatik braucht Übung, produce prüfen, validateClips
src/content/load.ts           + loadClips()
scripts/check_content.ts      + prüft content/chile-hoeren.json
src/engine/round.ts           + Formabbildung produce:false, Clip-Auswahl, Abwechslung Dialog/Clip
src/engine/clips.ts           chooseClip, chileUnlocked
src/ui/tasks/ClipTask.tsx     Aufgabe "Chile hören"
src/ui/Round.tsx              Clip-Aufgabe einhängen, Vorabruf chile-echt
src/ui/Placement.tsx          voller Test in Blöcken
src/ui/Settings.tsx           "Einstufung machen"
src/ui/Sources.tsx, README.md SLR71-Nachweis
src/ui/photos.ts, docs/fotos.md, public/photos/*.webp   Fotos 04 bis 09
vite.config.ts                maxEntries
scripts/tts.py                nur chilenische Stimmen für 09-chile
scripts/select_clips.ts       Auswahl aus SLR71 (Bauzeit)
scripts/clips_audio.py        WAV zu mp3 plus Manifest (Bauzeit)
content/situations/04..09-*.json, content/chile-hoeren.json
public/audio/<situation>/, public/audio/chile-echt/
```

---

### Task 1: Inhaltsformat erweitern und "nur verstehen"

**Files:**
- Modify: `src/content/types.ts`, `src/content/validate.ts`, `src/content/load.ts`, `scripts/check_content.ts`, `src/engine/round.ts`
- Test: `tests/content/validate.test.ts`, `tests/engine/round.test.ts`

**Interfaces:**
- Produces:
  - `WordItem.produce?: false`, `SentenceItem.produce?: false` (fehlt = darf produziert werden).
  - `type ChileClip = { id: string; es: string; de: string; gender: 'f' | 'm'; source: string }` (`id` Muster `clip-<slr71-datei-id ohne Präfix cl[fm]_>` in Kleinbuchstaben, `source` die SLR71-Datei-ID). `type ClipFile = { clips: ChileClip[] }`.
  - `validateClips(data: unknown, itemIds: Set<string>, knownForms: Set<string>): string[]`: Fehler bei ungültiger oder doppelter ID, ID-Kollision mit `itemIds`, leerem `es`/`de`, `gender` nicht f/m, weniger als 3 oder mehr als 16 Tokens, Deckung durch `knownForms` unter 0.85 (Tokens, die mit Großbuchstaben beginnen und nicht am Satzanfang stehen, zählen als Eigennamen und werden ausgelassen), Peninsularismus.
  - `loadClips(): ChileClip[]` (leeres Array, wenn `content/chile-hoeren.json` fehlt; `import.meta.glob` mit `eager`).
  - Grammatik-Items ohne Übung sind ein Prüffehler `exercises ungültig`.

- [ ] **Step 1: Failing tests** in `tests/content/validate.test.ts`: `grammar ohne Übung ist Fehler`; `produce: true ist Fehler, produce: false gültig`; `validateClips` je ein Test für Deckung 0.8 abgelehnt und 0.9 angenommen, Eigenname "Valparaíso" mitten im Satz zählt nicht, 2 Tokens abgelehnt, ID-Kollision mit Item-ID gemeldet, doppelte Clip-ID gemeldet.
- [ ] **Step 2: Failing tests** in `tests/engine/round.test.ts`: `produce:false auf Stufe 2 wird listen`; `produce:false auf Stufe 3 wird pressure`; `produce:false nach known und einem Fehler (Stufe 2) wird listen`; `ohne produce bleibt Stufe 2 type`.
- [ ] **Step 3:** `npx vitest run tests/content/validate.test.ts tests/engine/round.test.ts`, erwartet FAIL.
- [ ] **Step 4:** Implementieren. In `buildRound` beim Bilden der Wiederholungsform: hat das Item `produce === false`, dann `type` zu `listen` und `speak` zu `pressure`. `check_content.ts` prüft `content/chile-hoeren.json`, falls vorhanden, mit `validateClips` gegen alle Item-IDs und alle Wortformen.
- [ ] **Step 5:** Tests, `npm run check:content`, `npm run build` grün.
- [ ] **Step 6:** Commit `feat: Inhaltsformat fuer nur verstehen und Chile-Aufnahmen`.

### Task 2: Chile hören in der Runde (Engine)

**Files:**
- Create: `src/engine/clips.ts`
- Modify: `src/engine/round.ts`
- Test: `tests/engine/clips.test.ts`, `tests/engine/round.test.ts`

**Interfaces:**
- Consumes: `ChileClip` (Task 1), `situationCoverage` (`src/engine/coverage.ts`), `tokens` (`src/content/validate.ts`), `heard: Map<string, number>` aus `dialogsHeard` (gilt für Clip-IDs genauso).
- Produces:
  - `CHILE_SITUATION = 'chile-echt'` (Pseudo-Situations-ID für Audio und Task).
  - `chileUnlocked(situations: Situation[], states: Map<string, CardState>, now: number): boolean`: `situationCoverage` von `01-grundlagen` (mit `all = situations`) mindestens 0.5; false, wenn es die Situation nicht gibt.
  - `clipShare(clip: ChileClip, situations: Situation[], states: Map<string, CardState>): number`: gleiches Maß wie `seenShare` in `round.ts` (Anteil Tokens, deren Wort-Item einen Lernstand hat); `seenShare` und `clipShare` teilen sich eine Hilfsfunktion statt Kopie.
  - `chooseClip(clips: ChileClip[], situations, states, heard, now): ChileClip | undefined`: nur Clips mit `clipShare >= 0.8`; zuerst nie gehörte, davon der mit dem höchsten Anteil (Gleichstand: Dateireihenfolge); sonst der am längsten zurückliegende gehörte, frühestens 3 Tage nach dem letzten Hören.
  - `TaskForm` um `'clip'` erweitert. `buildRound` bekommt `clips?: ChileClip[]`. Höraufgabe je Runde höchstens eine: Ist ein Dialog und ein Clip möglich, nimmt die Runde den Clip, wenn `heard.size` ungerade ist, sonst den Dialog. Clip-Task: `{ cardId: clip.id, itemId: clip.id, situationId: CHILE_SITUATION, form: 'clip', isNew: false }`. Ohne Freischaltung kein Clip.

- [ ] **Step 1: Failing tests** `tests/engine/clips.test.ts`: `gesperrt unter 50 % Grundlagen`; `frei ab 50 %`; `kein Clip unter 0.8 Anteil`; `nie gehörter vor gehörtem`; `höchster Anteil zuerst`; `gehörter erst nach 3 Tagen wieder`.
- [ ] **Step 2: Failing tests** `tests/engine/round.test.ts`: `höchstens eine Höraufgabe je Runde` (Dialog und Clip möglich, heard.size gerade ergibt Dialog, ungerade Clip); `ohne clips unverändert wie bisher`; `replay ignoriert heard-Ereignis mit Clip-ID` (Zustand gleich wie ohne das Ereignis).
- [ ] **Step 3:** FAIL bestätigen.
- [ ] **Step 4:** Implementieren.
- [ ] **Step 5:** Tests grün.
- [ ] **Step 6:** Commit `feat: Chile hoeren in der Rundenplanung`.

### Task 3: Chile hören in der Oberfläche, Audio-Cache

**Files:**
- Create: `src/ui/tasks/ClipTask.tsx`
- Modify: `src/ui/Round.tsx`, `src/ui/useAppState.ts` (Clips laden), `src/media/audio.ts` (falls nötig), `vite.config.ts`
- Test: `tests/ui/ClipTask.test.tsx`, `tests/ui/RoundPrefetch.test.tsx`, `tests/content/audio-manifest.test.ts`

**Interfaces:**
- Consumes: `chooseClip`, `chileUnlocked`, `CHILE_SITUATION` (Task 2), `loadManifest`, `audioUrl` mit `speed: 'normal'`, `prefetchSituations`, `app.record({ kind: 'heard', cardId })`.
- Produces: `ClipTask({ clip, clips, url, onDone })`. Ablauf: Ton abspielen (Knopf, Leertaste), drei deutsche Bedeutungen über `ChoiceBase` (Ablenker: zwei andere Clips mit der geringsten Differenz der Tokenzahl, stabile Wahl), danach Rückmeldung mit spanischem Text, Übersetzung und Knopf "nochmal hören". Überschrift der Aufgabe "Chile hören", Hinweiszeile "Echte Aufnahme aus Chile". Nach Antwort ein `heard`-Ereignis, richtig oder falsch.

- [ ] **Step 1: Failing tests** `tests/ui/ClipTask.test.tsx`: `zeigt vor der Antwort keinen spanischen Text`; `nach Wahl Text und Übersetzung sichtbar`; `falsche Wahl schreibt heard und keine review`.
- [ ] **Step 2: Failing test** `tests/ui/Round.test.tsx` oder `RoundPrefetch.test.tsx`: `Clip ohne Manifest-Eintrag wird übersprungen, Runde geht weiter`; `chile-echt wird vorab geladen, sobald freigeschaltet`.
- [ ] **Step 3: Failing test** in `tests/content/audio-manifest.test.ts`: `Dateien aller Manifeste belegen höchstens 80 % von maxEntries` (liest `maxEntries` aus `vite.config.ts` per Regex, zählt Einträge aller `public/audio/*/manifest.json`); und `jeder Clip aus content/chile-hoeren.json hat Eintrag und Datei in chile-echt` (übersprungen, solange die Datei fehlt).
- [ ] **Step 4:** FAIL bestätigen.
- [ ] **Step 5:** Implementieren; `maxEntries` auf 30000. Gestaltung nach Taste-Skill aus vorhandenen Bausteinen (Aufgabenkopf, `AudioButton`, `ChoiceBase`, Rückmeldung).
- [ ] **Step 6:** Tests grün, Build grün. Screenshot der Aufgabe über `?zeige=` (Dev-Vorschau, Eintrag in `src/ui/dev` ergänzen) bei 390 und 1440 px hell und dunkel in den Scratch-Ordner, mit Taste-Skill-Augen prüfen.
- [ ] **Step 7:** Commit `feat: Aufgabe Chile hoeren und groesserer Audio-Cache`.

### Task 4: Voller Einstufungstest

**Files:**
- Modify: `src/ui/Placement.tsx`, `src/ui/Settings.tsx`, `src/ui/App.tsx`, `src/ui/Home.tsx` (Text des Angebots)
- Test: `tests/ui/Placement.test.tsx`, `tests/ui/Settings.test.tsx`

**Interfaces:**
- Consumes: `app.states`, `app.situations`, `app.record`, `app.updateSettings`.
- Produces:
  - `placementItems(situations: Situation[], states: Map<string, CardState>, count = 150): Entry[]`: Wort- und Wendungs-Items ohne Lernstand, ohne `produce: false`, ohne Situation `09-chile`, sortiert wie bisher (freqRank, dann Datei- und Situationsreihenfolge), die ersten `count`.
  - `BLOCK = 30`. Nach jedem Block Zwischenstand ohne Zahl mit "weiter" und "aufhören". Weniger als ein Viertel richtig im gerade beendeten Block beendet den Test mit dem Satz "Hier reicht es. Der Rest kommt beim normalen Lernen." Fortschrittsbalken je Block (Anteil innerhalb des Blocks), keine "Frage x von y"-Zahl mehr.
  - Settings, Abschnitt "Lernen": Knopf "Einstufung machen" öffnet die Einstufung; gibt `placementItems` nichts zurück, steht dort stattdessen "Es gibt gerade nichts einzustufen."
  - Startangebot: Text "Mit kurzen Fragen in Blöcken merkt sich die App, was du schon kannst, und fragt es später nicht mehr als Neues ab."

- [ ] **Step 1: Failing tests**: `bietet nur Items ohne Lernstand an`; `ohne Chile-Ebene und ohne produce false`; `höchstens 150`; `nach 30 Fragen Zwischenstand mit weiter und aufhören`; `weniger als ein Viertel richtig im Block beendet den Test`; `aufhören behält bisherige known-Ereignisse`; `kein Text "von" mit Zahlen im Einstufungsbildschirm`; Settings: `Knopf Einstufung machen öffnet die Einstufung`, `ohne Kandidaten Hinweistext statt Knopf`.
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Implementieren nach Taste-Skill aus vorhandenen Bausteinen.
- [ ] **Step 4:** Tests grün; Screenshots Zwischenstand und Settings bei 390 px hell und dunkel in den Scratch-Ordner prüfen.
- [ ] **Step 5:** Commit `feat: voller Einstufungstest in Bloecken`.

### Task 5 bis 9: Inhalt der Situationen 4 bis 8

Je Situation eine eigene Aufgabe, gleiche Schritte. Schwerpunkte, Titel, Dateiname und Grammatik je Situation stehen in der Spec, Abschnitt "Inhalt: Situationen 4 bis 8". Format und Prüfliste wie Plan Teil 1, Task 13 bis 15; zum Muster `content/situations/02-cafe.json` lesen.

- Task 5: `content/situations/04-unterwegs.json`, order 4
- Task 6: `content/situations/05-weg.json`, order 5
- Task 7: `content/situations/06-unterkunft.json`, order 6
- Task 8: `content/situations/07-smalltalk.json`, order 7
- Task 9: `content/situations/08-notfall.json`, order 8

**Files je Aufgabe:** Create die JSON-Datei, `public/audio/<id>/*` (erzeugt), `public/photos/<kurzname>.webp`; Modify `src/ui/photos.ts`, `docs/fotos.md`.

- [ ] **Step 1:** Inhalt schreiben: 100 bis 140 Wörter und Wendungen (Wörter aus früheren Situationen nicht neu anlegen), 40 bis 60 Sätze, 6 Dialoge, 3 bis 5 Grammatik-Häppchen mit Übungen, Hörpaare wo sinnvoll; `freqRank` aus `content/frequency/es_top5000.txt`, wo das Lemma vorkommt; `chile`-Feld mit Beleg, wo chilenischer Gebrauch erklärt wird.
- [ ] **Step 2:** `npm run check:content` grün.
- [ ] **Step 3:** `python scripts/tts.py --situation <id> --only-missing`; `npx vitest run tests/content/audio-manifest.test.ts` grün.
- [ ] **Step 4:** Foto von Wikimedia Commons (Santiago oder Chile, CC BY, CC BY-SA oder CC0, passend zur Situation), 160 x 160 webp über `scripts/photos.mjs`, Eintrag in `photos.ts` und `docs/fotos.md`; `npx vitest run tests/ui/photos.test.ts` grün.
- [ ] **Step 5:** Commit `content: Situation <Titel>`.

Review dieser Aufgaben ausdrücklich mit Prüfliste: natürliches Spanisch, wie man es in Santiago hört; keine Peninsularismen; Übersetzungen korrekt; Dialoge nur aus eingeführten Wörtern; Chilenismen mit Beleg; Notrufnummern in Task 9 gegen eine offizielle chilenische Quelle prüfen.

### Task 10: Situation 9, Chile-Ebene

**Files:**
- Create: `content/situations/09-chile.json` (order 9, Titel "Chile-Ebene"), Foto wie Task 5
- Modify: `scripts/tts.py`, `scripts/test_tts.py`

**Interfaces:**
- Produces: In `tts.py` nutzt die Situation `09-chile` nur `cl-f` und `cl-m` (beide als die zwei Stimmen eines Schlüssels; Dialog A `cl-f`, B `cl-m`).

- [ ] **Step 1: Failing test** in `scripts/test_tts.py`: `plan` für eine Situation mit id `09-chile` erzeugt nur Stimmen mit Präfix `cl-`. `python -m pytest scripts/test_tts.py` (oder der bestehende Aufruf), erwartet FAIL.
- [ ] **Step 2:** `tts.py` anpassen, Test grün.
- [ ] **Step 3:** Inhalt nach Spec, Abschnitt "Inhalt: Situation 9" und Entscheidung "Chilenisch hören bekommt Übungen": 40 bis 70 Items mit `chile`-Beleg, `produce: false` für alles, was nur verstanden werden soll (flaite, weón, cuático und alle Voseo-Formen), 20 bis 30 Sätze, 4 Dialoge, Häppchen "Chilenisch hören" mit Übungen chilenische Form zu Standardform, Häppchen für feste Wendungen zum Selbersagen ("ya po", "al tiro").
- [ ] **Step 4:** `npm run check:content`, Audio erzeugen, Manifest-Test, Foto, Commit `content: Chile-Ebene`.

Review mit derselben Prüfliste; zusätzlich: jeder Chilenismus hat eine nachvollziehbare Quelle, Register von weón und flaite richtig erklärt.

### Task 11: Echte Aufnahmen auswählen, übersetzen, umwandeln

**Files:**
- Create: `scripts/select_clips.ts`, `scripts/clips_audio.py`, `content/chile-hoeren.json`, `public/audio/chile-echt/*.mp3`, `public/audio/chile-echt/manifest.json`, `content/chile-hoeren.README.md` (Herkunft, Lizenz, Bearbeitung)
- Modify: `scripts/requirements.txt` (`imageio-ffmpeg`), `package.json` (Skript `select:clips`)

**Interfaces:**
- Consumes: `tokens`, Wortformen aller Situationen (wie `check_content.ts`), `validateClips` (Task 1).
- Produces:
  - `npm run select:clips -- <slr71-ordner> <ausgabedatei>` schreibt die Kandidaten als JSON in die Ausgabedatei (im Scratch-Ordner, nicht im Repo) mit allen Sätzen, die die Regeln der Spec "Auswahl" erfüllen: Deckung mindestens 0.85, 3 bis 16 Tokens, gleiche Texte nur einmal (abwechselnd Frau und Mann).
  - `python scripts/clips_audio.py --slr71 <ordner> [--only-missing]` entpackt nur die benötigten WAV-Dateien in einen Temp-Ordner, wandelt mit ffmpeg zu mp3 mono 64 kbit/s, Filter `silenceremove` an Anfang und Ende und `loudnorm`, Datei `<clip-id>-cl-<f|m>-normal.mp3` (Stimme als `cl-f`/`cl-m`, damit `audioUrl` und das Manifestformat unverändert passen), schreibt `manifest.json` mit Hash der Quelldatei.
- [ ] **Step 1:** Kandidaten erzeugen, Anzahl notieren.
- [ ] **Step 2:** Aus den Kandidaten 150 bis 250 auswählen (aussortieren: Gewalt, Politik, Intimes, Werbe- oder Behördensätze ohne Alltagsbezug), deutsche Übersetzungen schreiben, `content/chile-hoeren.json` anlegen. Werden es weniger als 150, gilt was belegt ist.
- [ ] **Step 3:** `npm run check:content` grün.
- [ ] **Step 4:** Audio umwandeln; Stichprobe von 5 Dateien abspielen lassen ist nicht möglich, deshalb Dauer und Größe prüfen (keine Datei unter 0,5 s oder über 12 s); Manifest-Test aus Task 3 grün.
- [ ] **Step 5:** Commit `content: echte chilenische Aufnahmen aus SLR71`.

Review mit Prüfliste: Übersetzung korrekt, Auswahl ohne befremdliche Inhalte, Lizenznachweis vollständig.

### Task 12: Quellen, README, Gesamtlauf

**Files:**
- Modify: `src/ui/Sources.tsx`, `README.md`, `docs/superpowers/teil1-offene-punkte.md` (Erledigtes markieren: maxEntries)
- Test: `tests/ui/Progress.test.tsx` oder ein neuer `tests/ui/Sources.test.tsx`

- [ ] **Step 1: Failing test**: Quellenseite nennt "Crowdsourced high-quality Chilean Spanish speech data set", "CC BY-SA 4.0", Link `https://www.openslr.org/71/` und "gekürzt, normalisiert und in mp3 umgewandelt"; zeigt Nachweise für alle Fotos aus `allPhotos`.
- [ ] **Step 2:** Implementieren, README ergänzen (Inhalte, Quellen, Skripte `select:clips` und `clips_audio.py`).
- [ ] **Step 3:** `npm test`, `npm run check:content`, `npm run build` grün.
- [ ] **Step 4:** `node scripts/screenshots.mjs --out <scratch>/teil2` und Startseite mit 9 Situationszeilen, Aufgabe Chile hören, Einstufung, Quellen bei 390 und 1440 px hell und dunkel prüfen; Taste-Gate `node C:\Users\gunna\.claude\skills\design-taste-frontend\scripts\gate.mjs` mit Prüfordner `.taste-skill/root/spanisch-app/` laufen lassen, Ergebnis in `docs/superpowers/gestaltung-bericht.md` unter "Teil 2" ergänzen.
- [ ] **Step 5:** Playwright gegen `npm run preview`: eine Runde mit Fokus `04-unterwegs` vollständig durchspielen, keine Konsolenfehler.
- [ ] **Step 6:** Commit `docs: Quellen und Gesamtlauf Teil 2`.
