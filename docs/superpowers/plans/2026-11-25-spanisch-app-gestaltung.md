# Neugestaltung nach Taste-Skill: Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die ganze Oberfläche der Spanisch-App bekommt das ausgeloste Taste-Skill-System (Host Grotesk, weiß mit Tintenblau, rund, solide Knöpfe), echte Santiago-Fotos auf der Startseite und an den Situationen, Eintritt und Hover-Bewegung, ohne Lernlogik oder Texte zu ändern.

**Architecture:** Preact-App ohne Router. Das Design liegt in CSS: `src/ui/styles/tokens.css` (Werte), `src/ui/styles/base.css` (Bausteine und Bewegung), `src/ui/theme.css` (bildschirmspezifisch). Fotos als Daten in `src/ui/photos.ts`. Ein Prüf-Einstieg nur im Dev-Build (`src/ui/dev/preview.tsx`) öffnet einzelne Bildschirme per URL für Screenshots und Gate.

**Tech Stack:** Preact 11, Vite 8, vite-plugin-pwa (Workbox), Vitest + Testing Library, Playwright (Screenshots), Taste-Skill-Skripte unter `C:\Users\gunna\.claude\skills\design-taste-frontend` (im Plan `<skill>`).

**Spec:** `docs/superpowers/specs/2026-11-25-spanisch-app-gestaltung-design.md` (vor jeder Aufgabe ganz lesen; dort stehen alle Größen, Farben, Zustände je Bildschirm).

## Global Constraints

- Arbeitszweig `gestaltung`, abgezweigt von `teil1` (a3fc5de). Commits mit Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Keine Gedankenstriche (— oder – als Einschub) in Oberfläche, Kommentaren, Commits. Kein "·". Keine Emojis.
- Keine Änderung an `src/engine`, `src/content`, `src/store`, `src/sync`, `src/media` und deren Tests. Texte der Oberfläche bleiben wortgleich, außer wo eine Aufgabe es ausdrücklich nennt.
- Alle 197 bestehenden Tests bleiben grün; Testanpassungen nur, wo sich eine Klasse oder Rolle ändert, nie an der Aussage.
- Palette `white-link-blue`: `--bg #ffffff`, `--surface #f4f4f4`, `--ink #111111`, `--muted #6b6b6b`, `--action #1a4be0`, `--action-ink #ffffff`. Dunkel: `--bg #111111`, `--surface #1e1e1e`, `--ink #ffffff`, `--muted #9a9a9a`, `--action #8aa4ff`, `--action-ink #111111`.
- Zustandsfarben hell / dunkel: richtig `#1f7a4d` / `#6fcf9b`, falsch `#b3261e` / `#ff8a80`, fast `#8a6400` / `#e0b44c`.
- Schrift: Host Grotesk (Überschriften 500, Text 400, Knöpfe und Labels 500, Laufweite -0.035em ab 40 px, -0.04em für h1 der Startseite), JetBrains Mono nur für Ziffern-Labels. Selbst gehostet über `@fontsource-variable/host-grotesk@5.3.0` und `@fontsource-variable/jetbrains-mono@5.3.0`, nur Latin. Nie 600/700 außer im Icon. Nichts unter 13 px.
- Radius `round`: `--r-sm 10px`, `--r-md 16px`, `--r-lg 24px`, `--r-btn 10px`.
- Abstände nur aus `--s-1..--s-9` = 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Knöpfe `solid`: Primär gefüllt in `--action`, Sekundär 1 px Rand in `--ink`, beide 48 px hoch, Label 16 px / 500, 24 px Seitenabstand. Ein Primärknopf je Bildschirm.
- Tap-Ziele außerhalb von Fließtext mindestens 44 px hoch, mindestens 8 px Abstand.
- Bewegung: nur `transform`/`opacity` (Hover zusätzlich Farben); Zeiten 150 ms hinein, 120 ms hinaus, 90 ms Druck; Kurven `--ease: cubic-bezier(.2,.8,.2,1)`, `--ease-enter: cubic-bezier(.22,1,.36,1)`. Hover nur unter `(hover: hover) and (pointer: fine)`. Unter `prefers-reduced-motion: reduce` ruht alles, nichts bleibt versteckt.
- Kein Laden von fremden Servern zur Laufzeit; Schriften und Fotos im Precache.
- Spalten: 40 rem für alle Bildschirme, 64 rem für die Startseite ab 1024 px.
- Taste-Skill-Kit-Dateien nie bearbeiten oder ins Repo kopieren.

## Review Focus

- Dunkelmodus: jede neue Fläche, jedes Feld, jeder Zustand muss im Dunkelmodus lesbar sein (Kontrast Text 4,5:1, Aktion 3:1). Task 9 schießt jeden Bildschirm hell und dunkel.
- Offline nach Neuinstallation: Schriftdateien und Fotos müssen im Precache stehen; ohne Netz darf keine Ersatzschrift erscheinen. Task 1 und Task 4 prüfen `dist/sw.js` auf `woff2` und `webp`.
- Rückkehr zur Startseite nach einer Runde darf den Eintritt nicht erneut abspielen und nichts unsichtbar lassen. Task 5 hat den Test.
- Lange Situationsnamen und 320 px Breite: Zeilen mit Foto dürfen nicht überlaufen oder umbrechen, dass der Balken unter das Foto rutscht. Task 5 legt die Zeile als Grid an; Task 9 prüft 320 per Gate.
- Prüf-Einstieg darf im Produktionsbuild nicht enthalten sein. Task 2 hat den Bundle-Test.

---

### Task 1: Grundlage (Zweig, Schriften, Tokens, Kopf)

**Files:**
- Create: `src/ui/styles/tokens.css`, `src/ui/styles/fonts.ts`
- Modify: `src/main.tsx`, `src/ui/theme.css:1-80` (alte Tokens, `--serif`, Grundstile raus), `index.html`, `vite.config.ts` (Manifest-Farben, Workbox-Muster), `package.json`, `.gitignore`
- Test: `tests/ui/styles.test.ts`

**Interfaces:**
- Produces: CSS-Variablen `--bg --surface --ink --muted --line --action --action-ink --good --bad --near --font-text --font-display --font-mono --display-weight --t-h1 --t-h2 --t-task --t-lead --t-body --t-small --t-label --s-1..--s-9 --r-sm --r-md --r-lg --r-btn --btn-h --tap --ease --ease-enter --m-in --m-out --m-press`. `--line` = Tinte 12 %. `--t-task` = Größe des Aufgabenworts (32 / 40 px). Alle weiteren Tasks nutzen nur diese Namen.

- [ ] **Step 1:** Zweig `gestaltung` ist schon angelegt (Spec und Plan liegen darauf). `.gitignore` um `.taste-skill/search/`, `.taste-skill/chrome-*/`, `.taste-skill/gate/`, `.taste-skill/root/` ergänzen (Rest von `.taste-skill/` wird committet).
- [ ] **Step 2: Failing test** `tests/ui/styles.test.ts`: liest `src/ui/styles/tokens.css` und `src/ui/theme.css` als Text und prüft
  - `tokens.css` enthält `--action: #1a4be0`, `--ink: #111111`, `--r-md: 16px`, `--font-text:` mit `"Host Grotesk Variable"` am Anfang;
  - keine der Dateien enthält `Palatino`, `Georgia`, `Iowan`, `--serif`;
  - keine Hexfarbe mit OKLCH-Farbton zwischen 270 und 330 Grad (eine kleine Hilfsfunktion im Test: Hex nach OKLCH, nur Farben mit Chroma > 0.03 zählen).
- [ ] **Step 3:** Test laufen lassen: `npx vitest run tests/ui/styles.test.ts`, erwartet FAIL (Datei fehlt).
- [ ] **Step 4:** `npm i @fontsource-variable/host-grotesk@5.3.0 @fontsource-variable/jetbrains-mono@5.3.0`. `src/ui/styles/fonts.ts` importiert nur die Latin-wght-Dateien (`@fontsource-variable/host-grotesk/wght.css` ist alle Teilmengen; stattdessen die Latin-Datei des Pakets, z. B. `.../latin-wght.css`, wenn vorhanden, sonst `wght.css` und im Bericht nennen). `main.tsx` importiert `./ui/styles/fonts`, `./ui/styles/tokens.css`, dann `./ui/theme.css`.
- [ ] **Step 5:** `tokens.css` schreiben: `:root` mit allen Werten aus Global Constraints und Spec (Größen 390 per Grundwert, ab 1024 per `@media (min-width: 1024px)`), Dunkelwerte unter `@media (prefers-color-scheme: dark)`, `color-scheme: light dark`, `body` mit `background: var(--bg); color: var(--ink); font: 400 var(--t-body)/1.625 var(--font-text)`, `font-synthesis: none`, `-webkit-font-smoothing: antialiased`. Alte Token- und Grundblöcke aus `theme.css` entfernen und dort alle Verweise auf alte Namen (`--text`, `--accent`, `--border`, `--serif`) auf die neuen umstellen.
- [ ] **Step 6:** `index.html`: zwei `meta name="theme-color"` (`#ffffff` mit `media="(prefers-color-scheme: light)"`, `#111111` mit `dark`), `meta name="description"` "Spanisch für die Reise nach Chile, ein paar Minuten am Tag." und im Kopf vor allem anderen Skript die Zeile `<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>`. `<html lang="de" data-motion>`. `vite.config.ts`: Manifest `background_color '#ffffff'`, `theme_color '#ffffff'`; `globPatterns` um `woff2,webp` erweitern.
- [ ] **Step 7:** `npm test` (alle grün), `npm run build`, dann `grep -c woff2 dist/sw.js` > 0. Erwartet: PASS, Build ok.
- [ ] **Step 8:** Commit `style: Taste-Skill-Grundlage mit Host Grotesk und Tokens`.

### Task 2: Prüf-Einstieg und Screenshot-Skript

**Files:**
- Create: `src/ui/dev/preview.tsx`, `scripts/screenshots.mjs`, `tests/ui/preview.test.tsx`
- Modify: `src/main.tsx`
- Test: `tests/ui/preview.test.tsx`, Bundle-Prüfung in Step 6

**Interfaces:**
- Produces: `export function Preview({ params }: { params: URLSearchParams }): JSX.Element | null` in `src/ui/dev/preview.tsx`. Werte von `zeige`: `start`, `start-neu` (ohne Einstufung, keine Daten), `einstufung`, `fortschritt`, `einstellungen`, `diagnose`, `quellen`, `rundenende`, `aufgabe`. Bei `zeige=aufgabe` zusätzlich `typ` = `intro|choice|listen|type|speak|grammar|pressure|dialog`. Unbekannter Wert ergibt `null` (dann normale App). Inhalt fest: das erste passende Item aus den echten Situationsdaten, Datenbank per `openDb('preview')` mit leerem Stand. Zustände (Ergebnis, Hinweis) entstehen im Skript durch Klicks, nicht per Parameter.
- Produces: `node scripts/screenshots.mjs --out docs/screenshots/gestaltung [--base http://localhost:5173/spanisch-app/]` schießt jeden `zeige`-Wert und jeden `typ` bei 390x844 und 1440x900, je hell und dunkel (`colorScheme`), Datei `<breite>-<hell|dunkel>-<name>.png`, dazu je Auswahltyp nach Klick auf eine Antwort `-ergebnis` und beim Tippen nach Klick auf "Hinweis" `-hinweis`. Startet den Dev-Server selbst, wenn `--base` fehlt, und beendet ihn.

- [ ] **Step 1: Failing test** `tests/ui/preview.test.tsx`: `render(<Preview params={new URLSearchParams('zeige=aufgabe&typ=choice')} />)` zeigt nach `findByText('Was bedeutet das?')` vier Optionen (`getAllByRole('button')` enthält mindestens vier mit Ziffern 1 bis 4); `zeige=fortschritt` zeigt die Überschrift "Fortschritt"; `zeige=unsinn` rendert `null`.
- [ ] **Step 2:** `npx vitest run tests/ui/preview.test.tsx`, erwartet FAIL.
- [ ] **Step 3:** `Preview` umsetzen; Aufgaben rendern über dieselbe Komponentenwahl wie `Round` (die Funktion `component` aus `Round.tsx` exportieren statt kopieren), mit `RoundEnvContext` wie in `Round`.
- [ ] **Step 4:** `main.tsx`: `if (import.meta.env.DEV) { const p = new URLSearchParams(location.search); if (p.has('zeige')) { const { Preview } = await import('./ui/dev/preview'); ... render Preview, Fallback App } }` sonst wie bisher. Kein statischer Import von `preview`.
- [ ] **Step 5:** Test PASS; `npm test` grün.
- [ ] **Step 6:** `npm run build`, dann `grep -rl "zeige" dist/assets/*.js` liefert nichts. Erwartet: keine Treffer.
- [ ] **Step 7:** `scripts/screenshots.mjs` schreiben (Playwright aus `node_modules`, falls nicht vorhanden `npm i -D playwright@1` ohne Browser-Download, Browser liegen unter `%LOCALAPPDATA%\ms-playwright`). Einmal laufen lassen gegen den aktuellen Stand nach `docs/screenshots/gestaltung-vorher/` (nicht committen, nur zum Vergleich, in `.gitignore`).
- [ ] **Step 8:** Commit `feat: Pruef-Einstieg im Dev-Build und Screenshot-Skript`.

### Task 3: Bausteine und Bewegung

**Files:**
- Create: `src/ui/styles/base.css`
- Modify: `src/main.tsx` (Import nach `tokens.css`), `src/ui/theme.css` (Knopf-, Link-, Fokus-, Feldregeln raus), alle `src/ui/*.tsx` und `src/ui/tasks/*.tsx`, die Knöpfe oder Links rendern (Klassen umstellen)
- Test: `tests/ui/buttons.test.tsx`

**Interfaces:**
- Consumes: Tokens aus Task 1.
- Produces: Klassen `btn btn--primary`, `btn btn--secondary` (ersetzen `primary`/`secondary`), `link` (Textlink, 44 px Ziel außerhalb von Fließtext über `min-height: var(--tap)` und `inline-flex`), `field` (Eingabe 48 px), `surface` (Fläche), `row-link` (ganze Zeile als Knopf, Hover hebt 2 px), `label` (13 px / 500), `num` (JetBrains Mono, `font-variant-numeric: tabular-nums`), `rule` (Haarlinie). `AudioButton` rendert `btn btn--secondary` mit Inline-SVG-Lautsprecher 20 px, `aria-hidden`.

- [ ] **Step 1: Failing test** `tests/ui/buttons.test.tsx`: Startseite (`render(<App db=...>)` mit leerer DB) hat genau ein Element mit Klasse `btn--primary` ("Heute lernen"); es gibt kein Element mit Klasse `primary` ohne `btn`; `AudioButton` rendert ein `svg[aria-hidden="true"]` und hat `btn--secondary`.
- [ ] **Step 2:** FAIL prüfen.
- [ ] **Step 3:** `base.css`: Knöpfe nach Global Constraints und Spec "Bewegung" (Hover 1 px hoch, Füllung `color-mix(in oklab, var(--action) 86%, var(--ink))`, Druck `translateY(1px) scale(.985)`), Links mit 1 px Haarlinie und gezogenem Unterstrich (Hintergrund-Verlauf über `background-size`, Transition 150/120 ms), Fokusring 2 px `--action` mit 2 px Abstand ohne Animation, `row-link` (Hover `translateY(-2px)`, Rand eine Stufe dunkler, Schatten `0 8px 24px color-mix(in oklab, var(--ink) 8%, transparent)` nur beim Hover; `img` darin `scale(1.03)` in 600 ms), Felder, Reduced-Motion-Block. Alle Hover-Regeln unter `@media (hover: hover) and (pointer: fine)`.
- [ ] **Step 4:** Markup umstellen: jedes `class="primary..."`/`"secondary..."` auf `btn btn--primary`/`btn btn--secondary`; Werkzeuglinks ("kann ich schon", "Fehler melden", "Runde beenden", "überspringen", Fußzeile, Zurück) auf `link`. In Speak-Ergebnisphase wird der Audioknopf sekundär, "Weiter" bleibt primär. Bestehende Tests, die nach alten Klassen suchen, auf die neuen Klassen ändern, Aussage gleich.
- [ ] **Step 5:** `npm test` grün; `npm run build`.
- [ ] **Step 6:** Commit `style: ein Knopfpaar, Links, Felder und Hover-Schicht`.

### Task 4: Fotos

**Files:**
- Create: `public/photos/*.webp`, `src/ui/photos.ts`, `docs/fotos.md` (Auswahl mit Begründung, nicht im Build)
- Modify: `src/ui/Sources.tsx` (Abschnitt "Fotos"), `tests/ui/` neuer Test `photos.test.ts`
- Test: `tests/ui/photos.test.ts`

**Interfaces:**
- Produces: `export type Photo = { src: string; srcset?: string; width: number; height: number; alt: string; author: string; license: string; page: string }`; `export const headerPhoto: Photo`; `export function photoFor(situationId: string): Photo | null`; `export const allPhotos: Photo[]` (für Quellen). `src` relativ zu `import.meta.env.BASE_URL` (`${BASE_URL}photos/<datei>.webp`).

- [ ] **Step 1:** Kandidaten laden: `node <skill>/scripts/photos.mjs fetch <ids> --out .taste-skill/search` für die IDs aus der Spec (Kopf `f94520857,f94460493`; Grundlagen aus denselben oder eine weitere Suche "Plaza Santiago de Chile"; Café `f144817079,f159656439,f60816353`; Einkaufen `f28821922,f28821924,f15515124,f47900401`). Jede Datei in voller Größe ansehen (Read auf das Bild). Je Platz eins wählen nach Spec "Fotos" (scharf, natürliche Farben, kein lesbarer Firmenname im Mittelpunkt, kein Gesicht im Vordergrund, ähnliche Lichtstimmung). Die Wahl mit Grund je Bild in `docs/fotos.md`. Passt für einen Platz keins, weitere Suche mit `photos.mjs search "<worte>" --min 1200`; bleibt es leer, den Platz leer lassen und im Bericht nennen.
- [ ] **Step 2:** Zuschneiden und umwandeln (Python Pillow oder `sharp`, als Dev-Abhängigkeit nur wenn nötig, Skript `scripts/photos.mjs` im Repo, damit es wiederholbar ist): Kopf `kopf-800.webp` und `kopf-1280.webp` im Seitenverhältnis 4:3, je höchstens 180 KB; Situationen `grundlagen.webp`, `cafe.webp`, `einkaufen.webp` 160x160, je höchstens 25 KB. Gewichte prüfen: `ls -l public/photos`.
- [ ] **Step 3: Failing test** `tests/ui/photos.test.ts`: `photoFor('<id von Café>')` liefert ein Foto mit nicht leerem `alt`, `photoFor('gibt-es-nicht')` liefert `null`; jedes `allPhotos`-Element hat `author`, `license`, `page`; jede `src` zeigt auf eine Datei, die unter `public/photos/` existiert (per `fs.existsSync`). Situations-IDs aus `src/content` lesen, nicht raten.
- [ ] **Step 4:** `photos.ts` umsetzen, Alt-Texte neu auf Deutsch (was zu sehen ist, ohne Ortsnamen fremder Geschäfte).
- [ ] **Step 5:** `Sources.tsx`: Abschnitt "Fotos" unter den bestehenden Nachweisen, je Foto eine Zeile "Urheber, Lizenz" mit Link auf die Commons-Seite (`link`-Klasse). Bestehenden Quellen-Test um eine Prüfung ergänzen, dass "Fotos" erscheint.
- [ ] **Step 6:** `npm test` grün; `npm run build`; `grep -c webp dist/sw.js` > 0.
- [ ] **Step 7:** Commit `feat: Fotos aus Santiago mit Nachweis`.

### Task 5: Startseite

**Files:**
- Modify: `src/ui/Home.tsx`, `src/ui/Placement.tsx` (nur `PlacementOffer`-Markup), `src/ui/theme.css` (Startseiten-Regeln), `src/ui/App.tsx` (Klasse am `main` je Bildschirm)
- Test: `tests/ui/Home.test.tsx` (neu)

**Interfaces:**
- Consumes: `headerPhoto`, `photoFor` aus Task 4; Klassen aus Task 3.
- Produces: `main` trägt `data-view="home|round|..."`; Startseite nutzt `data-view="home"` für die 64-rem-Spalte. Eintritt: der Kopf ist `<section class="hero" data-enter>` mit h1, Unterzeile, Einstufungsangebot, "Heute lernen" und dem Foto (`data-enter-media` am `img`). Eintritt nur beim ersten Rendern der Startseite seit App-Start: ein Modul-Flag `let entered = false` in `Home.tsx`; danach `data-enter="off"`.

- [ ] **Step 1: Failing tests** `tests/ui/Home.test.tsx`:
  - Startseite mit Daten: Kopf-`img` mit `alt` gleich `headerPhoto.alt`; jede Situationszeile mit Foto hat ein `img` mit dem `alt` aus `photoFor`;
  - eine Situation ohne Foto (Test-Situation mit unbekannter ID per gemocktem `photoFor`, `vi.mock('../../src/ui/photos')`) hat in ihrer Zeile kein `img` und die Klasse `situation--ohne-bild`;
  - erster Render: `section.hero` hat `data-enter` ohne Wert; nach `cleanup` und zweitem Render in derselben Testdatei `data-enter="off"`;
  - die Prozentzahl steht in einem Element mit Klasse `num`.
- [ ] **Step 2:** FAIL prüfen.
- [ ] **Step 3:** Markup nach Spec "Startseite": Kopf als `section.hero` mit zwei Spalten ab 1024 (`display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-7)`), Foto als `<img src srcset sizes="(min-width: 1024px) 32rem, 100vw" width height alt loading="eager" data-enter-media>` mit `aspect-ratio: 4/3; object-fit: cover; border-radius: var(--r-lg)`; 390: Foto nach der Unterzeile, vor dem Einstufungsangebot. Situationszeile `button.situation.row-link` als Grid `64px 1fr` (80 px ab 1024), Name als `h3`, Zeile `du verstehst etwa <span class="num">N %</span> der Dialoge` (Text wortgleich), Balken darunter in Spalte 2. Liste ab 1024 zweispaltig. Fußzeile mit drei `link`-Knöpfen, mittig, 16 px Abstand.
- [ ] **Step 4:** Eintritts-CSS in `theme.css`: unter `html.m-enter:not(.m-enter-done) .hero[data-enter]:not([data-enter="off"])` starten h1, Unterzeile, Rest und Bild bei `opacity: 0; transform: translateY(8px)` und laufen per `@keyframes` mit Verzögerungen 0, 120, 240, 360 ms in je 700 ms (`--ease-enter`) auf Ruhe; `animation-fill-mode: both`. Ohne `m-enter` (kein Skript) und unter Reduced Motion sofort sichtbar. Kein Teil darf nach 1,2 s noch unsichtbar sein.
- [ ] **Step 5:** `npm test` grün. `npm run dev` und `node scripts/screenshots.mjs --out .taste-skill/shots-home` nur für `start` und `start-neu`; Bilder bei 390 und 1440 ansehen und gegen Spec prüfen (zwei Spalten ab 1024, Foto 4:3, Zeilen bündig, kein Überlauf).
- [ ] **Step 6:** Commit `style: Startseite mit Kopffoto, Situationsbildern und Eintritt`.

### Task 6: Runde und Aufgaben

**Files:**
- Modify: `src/ui/Round.tsx`, `src/ui/RoundEnd.tsx`, `src/ui/TaskTools.tsx`, `src/ui/tasks/ChoiceBase.tsx`, `Dialog.tsx`, `Grammar.tsx`, `Intro.tsx`, `Listen.tsx`, `Speak.tsx`, `TypeBox.tsx`, `src/ui/theme.css`
- Test: bestehende `tests/ui/Round.test.tsx`, `Speak.test.tsx`, `Type.test.tsx`, `DialogAudio.test.tsx` grün halten; neu `tests/ui/feedback.test.tsx`

**Interfaces:**
- Consumes: Klassen aus Task 3.
- Produces: Optionen als `button.option.surface` mit `span.key.num`; Zustandsklassen bleiben `right|wrong|rest`; Urteil `p.verdict.good|bad|near` bleibt.

- [ ] **Step 1: Failing test** `tests/ui/feedback.test.tsx`: nach falscher Antwort in einer Auswahlaufgabe (über `Preview` mit `typ=choice` oder direkt `Choice` mit einem Item) steht das Urteil als Wort im Dokument (bestehender Text, z. B. "Nicht ganz" oder was Teil 1 zeigt; aus `ChoiceBase.tsx` lesen) und die gewählte Option trägt `wrong`, die richtige `right`. Die Tastenziffer hat Klasse `num`.
- [ ] **Step 2:** FAIL prüfen (Klasse `num` fehlt).
- [ ] **Step 3:** Umsetzung nach Spec "Runde und Aufgaben": Fortschrittsbalken 4 px; Frage als `label`-Zeile in `--muted` 16 px; Aufgabenwort in `--t-task`, `--display-weight`; Optionen als Flächen (min. 56 px, 8 px Abstand, Radius `--r-md`); Zustände als 2 px Rand plus 10 % Tönung (`color-mix`) der Zustandsfarbe; `mark` in Lösungen als `text-decoration: underline 2px` in Zustandsfarbe, kein Hintergrund; Tippfelder `field` mit 18 px Text; Werkzeugzeile als `link`-Reihe mit `gap: var(--s-4)` und Umbruch; Sprechen: Mikrofon primär, laufende Aufnahme als Wort plus 2 px Rand in `--action`, kein Pulsieren (vorhandene Animationen entfernen); Dialog: B-Zeilen mit 32 px Einzug, Sprecher als `label`; Urteil blendet in 150 ms ein (nur `opacity`). Rundenende: "Noch eine Runde" primär, "Fertig" sekundär, ab 1024 nebeneinander.
- [ ] **Step 4:** `npm test` grün.
- [ ] **Step 5:** Screenshots aller `typ` bei 390 hell und dunkel (`scripts/screenshots.mjs`), ansehen; Zustände richtig/falsch/Hinweis lesbar in beiden Modi.
- [ ] **Step 6:** Commit `style: Runde und Aufgaben im neuen System`.

### Task 7: Übrige Bildschirme

**Files:**
- Modify: `src/ui/Placement.tsx`, `Progress.tsx`, `Settings.tsx`, `Diagnose.tsx`, `Sources.tsx`, `src/ui/theme.css`
- Test: bestehende Tests der Bildschirme grün halten

**Interfaces:**
- Consumes: Klassen aus Task 3.

- [ ] **Step 1:** Je Bildschirm nach Spec "Einstufung, Fortschritt, Einstellungen, Diagnose, Quellen": Zurück als `link` oben links (44 px), h1 in `--t-h1`, Listen mit `rule`-Haarlinien, Felder `field`, Schieberegler mit `accent-color: var(--action)` und 44 px Höhe, Datei-Knopf als `btn--secondary`, Diagnose-Ergebnis als Wort in Zustandsfarbe, Versionsangaben in `num`. Die Einstufung nutzt die Optionen aus Task 6.
- [ ] **Step 2:** Alle übrigen Regeln aus `theme.css`, die nicht mehr greifen, löschen (Klassen, die im Markup nicht mehr vorkommen; mit `grep` gegen `src/ui` prüfen).
- [ ] **Step 3:** `npm test` grün; Screenshots `einstufung`, `fortschritt`, `einstellungen`, `diagnose`, `quellen` bei 390 und 1440, hell und dunkel, ansehen.
- [ ] **Step 4:** Commit `style: Einstufung, Fortschritt, Einstellungen, Diagnose, Quellen`.

### Task 8: App-Icon aus dem Punkte-Zeichen

**Files:**
- Modify: `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`
- Create: `scripts/icons.mjs`

- [ ] **Step 1:** `public/icon.svg`: 512er Quadrat, Grund `#ffffff`, das Punkte-Zeichen (Pfad aus `<skill>/assets/system.css` `.mark[data-mark="dots"]`: drei Kreise r 4.5 bei (6.5,6.5), (17.5,6.5), (6.5,17.5) und ein Rechteck x 13 y 13 9x9 rx 1.5 im 24er Raster) in `#111111`, mittig auf 60 % der Fläche skaliert (Safe Zone für maskierte Icons).
- [ ] **Step 2:** `scripts/icons.mjs` rendert das SVG mit Playwright auf 192 und 512 px PNG (ohne Transparenz). Ausführen, PNGs ansehen.
- [ ] **Step 3:** `npm run build`; `dist/manifest.webmanifest` nennt die drei Icons.
- [ ] **Step 4:** Commit `style: App-Icon aus dem Punkte-Zeichen`.

### Task 9: Screenshots und Gate

**Files:**
- Create: `docs/screenshots/gestaltung/*.png`, `.taste-skill/waivers.json` (falls nötig), `docs/superpowers/gestaltung-bericht.md`
- Modify: CSS/Markup nur für Befunde

- [ ] **Step 1:** `node scripts/screenshots.mjs --out docs/screenshots/gestaltung` (alle Bildschirme und Typen, 390 und 1440, hell und dunkel). Jedes Bild ansehen gegen die Spec und die Anti-Ziele; Befunde beheben, neu schießen.
- [ ] **Step 2:** Prüfordner für das Gate: `npm run build`, dann `dist` nach `.taste-skill/root/spanisch-app/` kopieren (dann stimmen die Pfade unter `/spanisch-app/`) und das Gate darauf scharf schalten: `node <skill>/scripts/gate.mjs --start .taste-skill/root/spanisch-app/index.html --root .taste-skill/root --kind software --category "Spanisch-Lern-App" --primary "Heute lernen"`.
- [ ] **Step 3:** `node <skill>/scripts/gate.mjs` laufen lassen (Vordergrund, Timeout 10 min). Alle Befunde, die für eine App gelten (Tap-Größe, Kontrast, Fokus, Hover, `font-load`, `img-alt`, Überlauf und `collide` bei 320, `hero-enter`, `assets`, `heading-order`, `a11y-name`), beheben. Webseiten-Befunde (`one-section`, `section-height`, `section-air`, `hero-screen`, `moment-none`, Navigation, Fußzeile, Share-Tags, Wortbudget) nicht beheben; die fünf eindeutigsten in `.taste-skill/waivers.json` mit Grund "App-Bildschirm, keine Webseite: <Regel> gilt nicht" (je Befund ein Eintrag). Höchstens drei Gate-Runden.
- [ ] **Step 4:** `docs/superpowers/gestaltung-bericht.md`: letzte `GATE:`-Zeile, jeder Verzicht mit Grund, jeder offene FAIL mit Grund, die Auslosung (Palette und warum, Schrift, Radius, Knöpfe, Marke), Fotos als Ersatzbilder mit Quelle, was nicht prüfbar war. Kein `gate.mjs --done` (das bleibt beim Hauptthread mit Gunnars Satz).
- [ ] **Step 5:** `npm test`, `npm run check:content`, `npm run build` grün.
- [ ] **Step 6:** Commit `docs: Screenshots und Gate-Bericht der Neugestaltung`.
