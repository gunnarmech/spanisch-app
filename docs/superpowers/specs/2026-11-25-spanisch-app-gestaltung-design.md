# Spanisch für Chile: Neugestaltung nach Taste-Skill

Stand 25.11.2026. Baut auf Teil 1 auf (Spec `2026-11-25-spanisch-app-design.md`, Stand main = a3fc5de).

## Absicht

Gunnar lernt bis März Spanisch für seine Chile-Reise, 10 bis 20 Minuten am Tag, auf iPhone und Desktop. Teil 1 funktioniert. Er mag den Aufbau der Startseite, aber die Schrift (Palatino-artige Serife in Überschriften plus Systemschrift) "geht gar nicht". Er will, dass die ganze Oberfläche nach dem Taste-Skill (`~/.claude/skills/design-taste-frontend`) gestaltet wird, die Startseite eingeschlossen, und dass der Skill auch für alles Spätere gilt.

Der Taste-Skill ist für Firmenwebseiten gebaut. Hier wird er sinngemäß auf eine kleine Lern-App übertragen: ausgeloste Palette und Schrift, ein strenges System, echte Fotos wo sie passen, Eintritt beim Laden, Hover- und Druck-Animation, 44 px Tap-Größe, seine Skript-Prüfungen soweit sie auf eine App passen.

## Ziele

- Neue Schrift, Farben, Radien, Knöpfe und Bewegung in der ganzen App (alle Bildschirme in `src/ui`, alle Aufgabentypen in `src/ui/tasks`).
- Aufbau und Texte der Startseite bleiben (Gunnar mag sie); sie bekommt Schrift, Farbe, ein Foto und die Situationszeilen mit Bild.
- Wirkt auf dem iPhone (390 px) wie eine ruhige, eigene App und auf dem Desktop (1440 px) nicht wie ein verlorener Streifen.
- Alles funktioniert offline weiter: Schriften und Fotos liegen im Build und im Precache.

## Nicht-Ziele

- Keine neuen Funktionen, keine Änderung an Lernlogik, Daten, Abgleich, Audio oder Tests der Engine.
- Keine Texte umschreiben außer den unten genannten Stellen.
- Kein Inhalt für Teil 2 (Situationen 4 bis 8); nur so gebaut, dass neue Situationen ihr Foto per Eintrag bekommen.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es läuft)

- Claude-Standard-Look: Pillen, Pfirsich, Orange, Kartenraster, Emojis, der Mittelpunkt "·" als Trenner. Kein Violett.
- Spiel-Elemente: Serien, Punkte, Ranglisten, Herzen, eine Rückstandszahl. Auch keine Zähl-Animation von Ergebnissen.
- Gedankenstriche (lang oder kurz als Einschub) in der Oberfläche.
- Bewegung, die beim Lernen ablenkt: nichts blendet beim Scrollen ein, keine Endlosschleifen, nichts in den Aufgaben selbst bewegt sich außer Hover, Druck und der Rückmeldung.
- Schrift oder Fotos von einem fremden Server zur Laufzeit (bräche offline und den Datenschutz).
- System-Schrift oder eine der Skill-Verbotsschriften (Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, Plus Jakarta Sans).

## Die Auslosung (Taste-Skill, nicht nach Geschmack)

Art: `software` (App). Ausgelost am 25.11.2026 mit `start.mjs deal --page software --trade "language learning app"`, Verlauf in `.taste-skill/history.json`:

- **Palette `white-link-blue`** (erste gezogene, so verlangt es der Skill): Grund `#ffffff`, Fläche `#f4f4f4`, Tinte `#111111`, gedämpft `#6b6b6b`, Akzent und Aktion `#1a4be0` mit weißer Schrift. Passt, weil eine Lern-App wie Heft und Kugelschreiber arbeitet: weißes Blatt, blaue Tinte für das, was man tun soll. Inverse Werte für den Dunkelmodus: Grund `#111111`, Fläche `#1e1e1e`, Tinte `#ffffff`, gedämpft `#9a9a9a`.
- **Schrift `host`:** Host Grotesk (Überschriften 500, Text 400, Knöpfe und Labels 500, Laufweite -3,5 % ab 40 px, -4 % bei der größten Überschrift) plus JetBrains Mono (nur für Ziffern-Labels: die Tastenziffern 1 bis 4 der Auswahl, Prozentangaben, Versionsangaben in der Diagnose).
- **Radius `round`** (Consumer-App): 10 / 16 / 24 px (Steuerelemente / Flächen / große Rahmen), Knöpfe 10 px.
- **Knopfstil `solid`** (ausgelost): gefüllter Primärknopf in der Aktionsfarbe, Sekundärknopf mit 1 px Rand in Tinte, beide 48 px hoch, Label 16 px / 500.
- **Marke `dots`** (ausgelost): das Punkte-Zeichen aus `system.css` `.mark[data-mark="dots"]` als App-Icon (Favicon, Touch-Icon, Manifest-Icons) in Tinte auf Weiß.

Die `:root`-Werte so übernehmen, wie `start.mjs css --page software --palette white-link-blue --type host --radius round` sie druckt (Ausgabe steht im Plan), ergänzt um die App-eigenen Zustandsfarben unten.

## Konstanten des Systems

- **Schriften selbst gehostet** über `@fontsource-variable/host-grotesk` und `@fontsource-variable/jetbrains-mono` (beide 5.3.0), nur Latin-Teilmenge, eingebunden aus `src/main.tsx`; die woff2-Dateien landen im Build und im Workbox-Precache. Höchstens vier Schriftdateien. `font-display: swap`.
- **Größen** (390 / ab 1024): Seitentitel h1 38 / 56 px, h2 24 / 30, Aufgabenwort ("hola") 32 / 40 als größtes Element im Aufgabenbildschirm, Lead 18 / 20, Text 16 / 26 Zeilenhöhe, klein 14, Labels 13 / 500. Nichts unter 13 px. Satzanfang groß, keine Versalien-Labels. Zeilen höchstens 62 Zeichen.
- **Abstände:** nur die Skala 4, 8, 12, 16, 24, 32, 48, 64, 96 als Tokens.
- **Farbe:** Oberfläche 90 bis 95 % neutral; die Aktionsfarbe nur für den einen Primärknopf je Bildschirm, Links, Fokusring und den Fortschrittsbalken. Tinte und gedämpft mit Kontrast 7:1 bzw. 4,5:1 auf dem Grund, in beiden Modi.
- **Zustandsfarben der Rückmeldung** (App-eigen, nicht vom Skill gedruckt, meine Wahl): richtig `#1f7a4d`, falsch `#b3261e`, fast `#8a6400`; im Dunkelmodus `#6fcf9b`, `#ff8a80`, `#e0b44c`. Jede mindestens 4,5:1 auf ihrem Grund. Die Farbe trägt nie allein: das Urteil steht immer auch als Wort da (bleibt wie in Teil 1).
- **Dunkelmodus** nach System (`prefers-color-scheme`), wie bisher. Aktion im Dunkelmodus: Füllung `#8aa4ff`, Label `#111111` (meine Wahl, weil `#1a4be0` auf `#111111` zu wenig Kontrast hat).
- **Ein Knopfpaar, eine Linkform, eine Flächenform.** Links: 1 px Haarlinie darunter, die sich beim Hover in Tinte von links nach rechts zieht. Flächen: Hintergrund `--surface`, Radius 16, keine Schatten außer beim Hover verlinkter Zeilen.
- **Tap-Ziele** außerhalb von Fließtext mindestens 44 px hoch, mit mindestens 8 px Abstand zum nächsten Ziel. Das betrifft auch die heutigen Textlinks "kann ich schon", "Fehler melden", "Runde beenden", "überspringen" und die Fußzeile der Startseite.
- **Theme-Color:** `#ffffff` hell, `#111111` dunkel (zwei `meta name="theme-color"` mit `media`).

## Bewegung

Werte aus `references/motion.md`, in eigenem CSS nachgebaut (die Kit-Dateien `motion.css`/`motion.js` passen nicht in eine Preact-App und werden nicht kopiert):

- **Eintritt der Startseite** einmal je App-Start: h1, dann Unterzeile, dann Knöpfe und Liste, je 6 bis 12 px von unten mit Ausblenden, zusammen etwa 1,1 s, Kurve `cubic-bezier(.22,1,.36,1)`. Bei Rückkehr aus einer Runde kein zweiter Eintritt.
- **Knöpfe:** Hover hebt um 1 px und dunkelt die Füllung um 14 % Richtung Tinte (Sekundär: leichte Füllung, stärkerer Rand); Druck 1 px unter Ruhe und `scale(.985)`. 150 ms hinein, 120 ms hinaus, 90 ms Druck. Hover nur bei feinem Zeiger; Fokus zeigt denselben Zustand.
- **Verlinkte Zeilen** (Situationen, Auswahloptionen): heben sich beim Hover um 2 px, Rand eine Stufe dunkler; ein Foto darin zoomt im Rahmen auf 1,03.
- **Links:** Unterstrich zieht sich beim Hover.
- **Rückmeldung** nach einer Antwort: das Urteil blendet in 150 ms ein; keine Wackel- oder Hüpfanimation.
- `prefers-reduced-motion: reduce`: alles ruht, nichts bleibt versteckt.
- Nur `transform` und `opacity` werden animiert (beim Hover zusätzlich Farben).

## Bildschirme

Alle Bildschirme behalten ihre Inhalte, Reihenfolge und Tastaturbedienung aus Teil 1. Spalte bleibt einspaltig, 40 rem breit, mittig; Abstand oben 32 px (390) bzw. 64 px (ab 1024), unten mit Safe-Area.

### Startseite

- **Kopf:** h1 "Spanisch für Chile", Unterzeile "Ein paar Minuten am Tag." Darunter bzw. daneben ein Foto aus Santiago.
  - 390: Foto über die Spaltenbreite, Seitenverhältnis 4:3, Radius 24, unter der Unterzeile.
  - ab 1024: die ganze Startseite nutzt eine breitere Spalte von 64 rem. Kopf zweispaltig: links h1, Unterzeile, Einstufungsangebot und "Heute lernen"; rechts das Foto, Höhe gleich der linken Spalte, Radius 24. Darunter die Situationsliste zweispaltig (zwei Zeilen nebeneinander), dann die Fußzeile. Alle anderen Bildschirme bleiben bei 40 rem.
- **Einstufungsangebot** bleibt wie es ist (Überschrift, Satz, Sekundärknopf "kurz einstufen", Link "überspringen"); "überspringen" wird ein 44-px-Ziel.
- **"Heute lernen"** ist der eine Primärknopf, volle Spaltenbreite auf 390, ab 1024 so breit wie sein Text plus 24 px Innenabstand je Seite, mindestens 240 px.
- **Situationszeilen:** links ein quadratisches Foto 64 px (390) bzw. 80 px, Radius 10, rechts Name (h3, 18/20 px, 500), darunter "du verstehst etwa N % der Dialoge" bzw. "noch keine Dialoge" und der Balken. Die Prozentzahl in JetBrains Mono. Der Balken: 4 px hoch, Grund in Tinte 10 %, Füllung Aktionsfarbe. Ganze Zeile ist der Knopf.
- **Fußzeile:** Diagnose, Fortschritt, Einstellungen als 44-px-Textlinks in einer Zeile, mittig.

### Runde und Aufgaben

- Fortschrittsbalken oben: 4 px, Radius voll, Füllung Aktionsfarbe.
- Aufgabenfrage ("Was bedeutet das?") als Label in gedämpft 16 px, Aufgabenwort groß in Host Grotesk 500.
- **Auswahloptionen** (Karte, Hören, Grammatik, Zeitdruck, Dialog-Fragen): jede Option eine Fläche (`--surface`, Radius 16, 56 px hoch mindestens, 8 px Abstand), links die Tastenziffer in JetBrains Mono gedämpft, rechts der Text 18 px. Zustände richtig/falsch/übrige mit den Zustandsfarben als 2 px Rand und leichter Tönung (10 %) der Fläche, plus das Wort im Urteil darunter.
- **Tippfelder** (Tippen, Sprechen-Ersatz, Lückentext): 48 px hoch, Radius 10, 1 px Rand in Tinte 20 %, Fokus 2 px Aktionsfarbe, Text 18 px. Markierte Abweichungen in der Lösung (`mark`) mit Unterstreichung in der Zustandsfarbe statt Hintergrundmarker.
- **"Anhören"** und andere Audio-Knöpfe: Sekundärknopf mit Lautsprecher-Zeichen (inline SVG, 20 px, Tinte), 44 px.
- **Werkzeugzeile** (kann ich schon, Fehler melden, Runde beenden): Textlinks als 44-px-Ziele, in einer Zeile mit 16 px Abstand, auf 390 umbrechend.
- **Sprechen:** Mikrofon-Knopf als Primärknopf; laufende Aufnahme zeigt den Zustand als Wort und als ruhigen Rand, kein Pulsieren.
- **Dialog:** Zeilen als zwei Seiten (A links bündig, B mit 32 px Einzug), Sprecher in Label-Größe gedämpft, Spanisch 18 px, Deutsch 16 px gedämpft.
- **Rundenende:** Überschrift, die neuen Wörter als Liste mit Haarlinien, die Knöpfe "Noch eine Runde" (Primär) und "Fertig" (Sekundär) nebeneinander ab 1024, gestapelt auf 390.

### Einstufung, Fortschritt, Einstellungen, Diagnose, Quellen

Gleiche Bausteine: h1 wie Startseite, Listen mit Haarlinien, Formularfelder wie die Tippfelder, Schieberegler in Aktionsfarbe, Knöpfe aus dem einen Paar, Zurück als Textlink oben links (44 px). Diagnose-Ergebnisse als Wort (ok, fehlt) in Zustandsfarbe plus Wort.

## Fotos

- Echte Fotos aus Santiago bzw. Chile von Wikimedia Commons (CC0, CC BY, CC BY-SA, gemeinfrei) über `photos.mjs search` und `fetch`, je Bild einzeln in voller Größe angesehen: scharf, natürliche Farben, kein lesbarer Firmenname oder Logo im Mittelpunkt, kein erkennbares Gesicht im Vordergrund, ein Licht und eine Farbstimmung über den Satz.
- **Plätze:** ein Kopffoto der Startseite (Straße in Santiago, z. B. Barrio Lastarria; Kandidaten `f94520857`, `f94460493`), je ein Foto für die Situationen Grundlagen (Straße oder Platz), Café und Restaurant (Kandidaten `f144817079`, `f159656439`, `f60816353`), Einkaufen und Bezahlen (Markt in Santiago; Kandidaten `f28821922` Ajíes in der Vega Central, `f28821924`, `f15515124`, `f47900401`).
- **Zuordnung als Daten:** eine Datei `src/ui/photos.ts` ordnet Situations-IDs Bilddateien und Alt-Texten zu. Fehlt ein Eintrag (Teil-2-Situationen), zeigt die Zeile kein Bild und bleibt bündig (Text rückt nicht ein, das Bildfeld fällt weg).
- **Formate und Gewicht:** WebP. Kopffoto in 800 und 1280 px Breite mit `srcset`, höchstens 180 KB je Datei; Situationsbilder 160 px Quadrat, höchstens 25 KB. Alle in `public/photos/`, im Workbox-Precache (Muster um `webp` erweitern). `width`/`height` gesetzt, damit nichts springt.
- **Alt-Texte** neu auf Deutsch beschreiben, was zu sehen ist (nicht den Dateititel übernehmen, der fremde Orte nennt).
- **Nachweis:** keine Bildunterschrift. Jedes Foto mit Urheber, Lizenz und Link auf der Seite Quellen (dort gibt es schon Nachweise für Audio). Keine Zeile auf der Startseite.

## Prüfung

- Alle bestehenden Tests, `check:content` und `build` bleiben grün. Neue Tests nur, wo Verhalten entsteht: das Fehlen eines Fotos für eine Situation und der einmalige Eintritt.
- Screenshots aller Bildschirme und Aufgabentypen bei 390 und 1440, hell und dunkel, neu nach `docs/screenshots/gestaltung/` (ersetzen `teil1` nicht). Dazu ein Playwright-Skript im Repo (`scripts/screenshots.mjs`), damit es nicht wieder verloren geht.
- Taste-Skill-Skripte auf dem gebauten Stand (`dist`, über `vite preview` oder `--root dist`): `gate.mjs` mit Art `software`, Kategorie "Spanisch-Lern-App", Hauptaktion "Heute lernen". Was davon für eine App gilt, wird behoben (Tap-Größe, Kontrast, Fokus, Hover, Schrift geladen, Alt-Texte, Überlauf bei 320, Eintritt). Was nur für Webseiten gilt, wird in `.taste-skill/waivers.json` mit Grund verzichtet: ein Abschnitt pro Bildschirm, feste Navigation, Fußzeilen-Typen, ausgeloste Moments und Szenen, Share-Tags, Adressen, Wortbudget je Bildschirm. Endet das Gate nicht in PASS oder OPEN, `gate.mjs --done` mit Begründung "App statt Webseite, nicht anwendbare Regeln verzichtet".
- **Prüf-Einstieg (meine Wahl nach Builder Check):** nur im Entwicklungsbuild (`import.meta.env.DEV`) öffnet ein URL-Parameter `?zeige=<bildschirm>` bzw. `?zeige=aufgabe&typ=<aufgabentyp>` einen Bildschirm oder eine Aufgabe direkt mit festem Inhalt; Ergebnis- und Hinweiszustände erzeugt das Skript per Klick. Im Produktionsbuild ist der Code nicht enthalten (per Test oder Bundle-Suche belegt). Das Screenshot-Skript nutzt den Dev-Server; das Gate prüft zusätzlich zur Startseite die per Parameter geöffneten Hauptbildschirme, soweit es eine URL annimmt.
- **Gate-Abschluss (meine Wahl nach Builder Check):** Was für eine App gilt, wird erfüllt, auch die Kennzeichnung des Eintritts (`data-enter` am Kopf der Startseite, `m-enter` im Dokumentkopf), damit `hero-enter` greift. Höchstens fünf Verzichte in `waivers.json`, für die eindeutigsten Webseiten-Befunde. Bleiben danach Webseiten-FAILs offen (etwa `moment-none`, `one-section`), wird nichts App-Fremdes eingebaut; die offenen Befunde gehen in den Bericht, und `gate.mjs --done` läuft erst mit Gunnars eigenem Satz, um den ich ihn dann einmal bitte.
- Pfade: Das Gate bekommt einen Prüfordner, in dem der Build unter `spanisch-app/` liegt (Vite-Basis `/spanisch-app/`), damit die Assets laden.
- Live-Prüfung nach Deploy: Live-Bundle gleich Build, Startseite bei 390 im Browser angesehen.

## Den Bauenden überlassen

- Aufteilung von `theme.css` (eine Datei oder Tokens plus Bausteine), solange es ein System bleibt.
- Wie das Icon aus dem Punkte-Zeichen als PNG entsteht (Playwright-Screenshot eines SVG oder ein Skript).
- Kleine Abstände innerhalb der Skala, wo die Spec keinen Wert nennt.
