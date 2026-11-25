# Spanisch für Chile

Eine kleine Lern-App für chilenisches Spanisch (lateinamerikanisch, Du-Form als Produktionsform). Sie läuft als PWA im Browser, braucht keinen Server und keine laufenden Kosten.

Live unter https://gunnarmech.github.io/spanisch-app/

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
