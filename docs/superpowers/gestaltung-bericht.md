# Gestaltung: Bericht zu Screenshots und Gate

Stand 26.11.2026, Zweig `gestaltung`.

## Gate

Letzte Zeile: `GATE: FAIL 10 (round 2 of 3)`. Zwei Runden gelaufen, `gate.mjs --done` nicht aufgerufen (bleibt beim Hauptthread mit Gunnars Satz).

Runde 1: `GATE: FAIL 21 (round 1 of 3)`. Behoben, weil sie für eine App gelten:
- `text-contrast`: Absatz im Einstufungsangebot in Tinte statt gedämpft (im Dunkelmodus 6,71:1, verlangt 7:1).
- `heading-scale`: h3 der Situationen 18 px statt 20 px; h2 "Kurz einstufen?" in der Größe der anderen h2.
- `motion-layer`: `data-motion` aus `<html>` entfernt (die Kit-Datei `motion.css` wird nicht kopiert); `hero-enter` bleibt grün über `m-enter`.
- `flush`: Startseitenkopf mit Abstand unten.

## Verzichte (fünf, je "App-Bildschirm, keine Webseite: <Regel> gilt nicht")

`nav`, `moment-none`, `one-section`, `section-height`, `hero-screen` (Kopf), in `.taste-skill/waivers.json`.

## Offene FAILs (Webseiten-Regeln, bewusst nicht behoben, kein Verzicht mehr frei)

- `hero-fill`, `hero-screen` (Situationsabschnitt), `one-heading` (2x): Die Startseite ist ein App-Bildschirm mit Kopf und Liste auf einem Schirm, kein Abschnitt je Bildschirm.
- `cta`: Der Abschnitt vor der Fußzeile endet ohne Knopf, weil dort die Situationsliste steht, deren Zeilen selbst Knöpfe sind.
- `container-edges` (4x) und `container`: Das Gate verlangt `.wrap`, `header.nav`, `footer.closing` und 64 bis 120 px Rand; die App hat eine 64-rem-Spalte mit 228 px Rand und `div#app`.

Weitere WARN (nicht blockierend): `copy-headings`, `copy-buttons`, `copy-actions`, `section-gaps`, `skip-link`.

## Die Auslosung

- Palette `white-link-blue`: weißes Blatt, blaue Tinte für das, was man tun soll (Heft und Kugelschreiber). Dunkelmodus invers, Aktion `#8aa4ff`.
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
