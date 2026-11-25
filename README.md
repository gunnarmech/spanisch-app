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

Der Code steht unter der MIT-Lizenz (`LICENSE`), die Inhalte unter CC BY-SA 4.0 (`content/LICENSE`). Die Quellen der Inhalte stehen auf der Quellenseite in der App; sie wird hier ergänzt, sobald Inhalte vorliegen.

Die Sprachausgabe stammt aus Microsoft Edge TTS (Stimmen es-CL, es-MX, es-CO), erzeugt mit `scripts/tts.py`. Die Abstände der Wiederholungen berechnet die Bibliothek ts-fsrs (MIT).
