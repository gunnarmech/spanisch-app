# Gestaltung: Bericht zu Screenshots und Gate

Stand 26.11.2026, Zweig `gestaltung`.

## Gate

Letzte Zeile (Runde 3): `GATE: OPEN 10 (rounds used up)`. Die Runden endeten, weil die drei erlaubten Runden verbraucht sind; das Gate meldet "Stop fixing". Runde 2 stand bei `GATE: FAIL 10 (round 2 of 3)`, Runde 3 brachte dieselben zehn Befunde. `gate.mjs --done` wurde nicht aufgerufen (das bleibt beim Hauptthread mit Gunnars Satz).

Runde 1: `GATE: FAIL 21 (round 1 of 3)`. Behoben, weil sie für eine App gelten:
- `text-contrast`: Absatz im Einstufungsangebot in Tinte statt gedämpft (im Dunkelmodus 6,71:1, verlangt 7:1).
- `heading-scale`: h3 der Situationen 18 px statt 20 px; h2 "Kurz einstufen?" in der Größe der anderen h2.
- `motion-layer`: `data-motion` aus `<html>` entfernt (die Kit-Datei `motion.css` wird nicht kopiert); `hero-enter` bleibt grün über `m-enter`.
- `flush`: Startseitenkopf mit Abstand unten.

## Verzichte (fünf, je "App-Bildschirm, keine Webseite: <Regel> gilt nicht")

`nav`, `moment-none`, `one-section`, `section-height`, `hero-screen` (Kopf), in `.taste-skill/waivers.json`.

## Offene FAILs (Webseiten-Regeln, bewusst nicht behoben, kein Verzicht mehr frei)

Wortlaut des Gates (Runde 3, 1440 und 390 wie angegeben):

- `hero-fill` [1440, 390]: "the next section shows on the first screen: it starts at 505px on a 900px screen (the hero ends at 459px)". Die Startseite zeigt Kopf und Situationsliste auf einem Schirm, das ist gewollt.
- `hero-screen` (Situationsliste) [1440]: "393px of the next section shows on the first screen (from 507px on a 900px screen): nothing below the hero shows at load (SR-1)". Gleiche Ursache.
- `one-heading` [1440], zweimal: "the hero holds an h2 (1): its heading is the h1, and an h2 opens the next section (SR-5)" und "headings of two sections show whole on one screen". Das Einstufungsangebot hat eine eigene Überschrift im Kopf.
- `cta` [1440, 390]: "the last section before the footer ends with no button". Der Abschnitt endet mit der Situationsliste, deren Zeilen selbst Knöpfe sind.
- `container-edges` [1440], viermal: "the content of section 1 runs 228px from the left and 228px from the right (read from its outermost blocks: no .wrap): the margin is 64-120px at 1440px", ebenso Abschnitt 2, "section 3 runs 600px from the left and 600px from the right" (Fußzeile, 40-rem-Spalte, bewusst) und "a <div> at the top of the page, outside header.nav, main, footer.closing and nav.actionbar (SR-6)".
- `container` [1440, 390]: "no .wrap" (Klasse des Webseiten-Gerüsts).

Einordnung mit Nachweis: Diese Befunde verlangen Webseiten-Gerüst (`.wrap`, `header.nav`, `footer.closing`, ein Abschnitt je Bildschirm). Die tatsächlichen Ränder der App sind gemessen und in Ordnung: bei 1440 beträgt der Rand der Startseite 228 px (die Spec legt eine 64-rem-Spalte fest, das Gate will 64 bis 120 px), bei 390 und 320 beträgt er 20 px.

Messung bei 320 px über `?zeige=` (Playwright, hell und dunkel, alle 16 Bildschirme und Aufgabentypen): `scrollWidth` gleich `clientWidth` (320) überall, also kein Überlauf. Linker und rechter Rand der Spalte 20 px, mit einer Ausnahme: Sprechen hatte 6 px, weil der Aufnahmerahmen 14 px nach außen ragte. Behoben: der Rahmen ist jetzt ein Outline mit 2 px Abstand und liegt bei 16 px vom Rand; Nachmessung Sprechen bei 320 px: `scrollWidth` 320 gleich `clientWidth` 320; Knopf links und rechts je 20 px vom Rand; Rahmen ruhend (kein Outline) 20 px, bei laufender Aufnahme liegt die Außenkante des Outlines links und rechts je 16 px vom Rand. Alle Inhalte liegen also bei mindestens 20 px, nur der Aufnahmerahmen als Zierde bei 16 px (Vorgabe: mindestens 16 px). Bei der ersten Fassung des Fixes war der Knopf dabei zu schmal geworden; mit `width: 100%` am Block ist er wieder volle Spaltenbreite.

Weitere WARN (nicht blockierend): `copy-headings`, `copy-buttons`, `copy-actions`, `section-gaps`, `skip-link`.

## Die Auslosung

- Palette `white-link-blue`: weißes Blatt, blaue Tinte für das, was man tun soll (Heft und Kugelschreiber). Dunkelmodus invers, Aktion `#8aa8ff` (so in `tokens.css`).
- Schrift `host`: Host Grotesk plus JetBrains Mono für Ziffern, selbst gehostet.
- Radius `round`: 10 / 16 / 24 px.
- Knöpfe `solid`: gefüllter Primärknopf, Sekundärknopf mit Rand, 48 px.
- Marke `dots`: Punkte-Zeichen als App-Icon.

## Fotos

Ersatzbilder aus Santiago und Chile von Wikimedia Commons (freie Lizenzen). Urheber, Lizenz und Link je Foto stehen in der App auf der Seite Quellen.

## Screenshots (Abweichung vom Auftrag)

Die Screenshots liegen bewusst nicht im Repo, sondern in `C:\Users\gunna\AppData\Local\Temp\claude\spanisch-t9-shots` (76 Bilder: alle Bildschirme und Aufgabentypen, 390 und 1440, hell und dunkel). Erzeugt mit `node scripts/screenshots.mjs --out <Pfad>`. Bildliche Durchsicht: Start, Start neu, Aufgaben (Auswahl mit Ergebnis, Sprechen, Tippen mit Hinweis, Dialog), Diagnose, Einstellungen, Rundenende; keine Auffälligkeiten gegen Spec und Anti-Ziele.

## Nicht prüfbar

- Startseiten-Screenshots entstehen teils mitten im Eintritt (leicht ausgeblichen); der Eintritt selbst wurde über `hero-enter` im Gate geprüft.
- Live-Prüfung nach Deploy steht aus.
- Gate-Prüfung der per `?zeige=` geöffneten Bildschirme: nicht geprüft, das Gate sah nur die Startseite.

## Hinweis zu den Verzichten

Die Ziele der Verzichte in `waivers.json` sind konkrete DOM-Selektoren (zum Beispiel `div#app > main > footer.foot`). Ändert sich das DOM, greifen sie nicht mehr und die Befunde erscheinen wieder.
