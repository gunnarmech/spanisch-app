# Spanisch für Chile

Eine kleine Lern-App für chilenisches Spanisch (lateinamerikanisch, Du-Form als Produktionsform). Sie läuft als PWA im Browser, braucht keinen Server und keine laufenden Kosten.

Live unter https://gunnarmech.github.io/spanisch-app/

## Installation

App-Adresse: https://gunnarmech.github.io/spanisch-app/

Auf dem iPhone: Adresse in Safari öffnen, unten auf Teilen tippen, "Zum Home-Bildschirm" wählen und bestätigen. Danach die App vom Home-Bildschirm starten.

Am PC: Adresse in Chrome oder Edge öffnen und rechts in der Adressleiste auf das Installationssymbol klicken.

Wenn etwas nicht geht (Ton, Mikrofon, Spracherkennung), zeigt die Diagnose-Seite unten auf der Startseite, was das Gerät kann.

## Entwicklung

```
npm install
npm run dev            # Entwicklungsserver
npm test               # Tests (vitest)
npm run check:content  # Inhalte prüfen
npm run build          # Produktionsbuild nach dist
```

Bei jedem Push auf `main` testet, baut und veröffentlicht der Workflow `.github/workflows/pages.yml` die App auf GitHub Pages.

## Lizenz und Quellen

Der Code steht unter der MIT-Lizenz (`LICENSE`), die Inhalte unter CC BY-SA 4.0 (`content/LICENSE`). Dieselben Quellen stehen auf der Quellenseite in der App (Einstellungen, Quellen):

- Häufigkeitsliste: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) von hermitdave (CC BY-SA 4.0), die ersten 5000 Zeilen der spanischen Liste, siehe `content/frequency/README.md`.
- Abstände der Wiederholungen: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT).
- Stimmen: erzeugt mit [edge-tts](https://github.com/rany2/edge-tts) (Microsoft Edge TTS, Stimmen es-CL, es-MX, es-CO), Skript `scripts/tts.py`.
- Hinweise zum Sprachgebrauch in Chile: je Eintrag in den Situationsdateien mit Quelle belegt, aus dem [Diccionario de americanismos](https://www.asale.org/damer) (RAE-ASALE).
