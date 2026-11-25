# Offene Punkte aus Teil 1

Aus dem Ledger der Ausfuehrung uebernommen (zurueckgestellte Kleinigkeiten und Hinweise fuer Teil 2). Stand 25.11.2026, Commit 3918b90.

- Task 1: minor (deferred): check_content.ts still exit 0 bei vorhandenen JSON bis Task 4; "Pruefung" mit ue in Konsolentext/README; LICENSE-Name "Gunnar Mech" bestaetigen; Actions nicht SHA-gepinnt
- Task 2: minor (deferred): leere Zielform -> mark index -1; Bindestrich verschmilzt Woerter in normalize; kein Test leeres Transkript
- Task 3: minor (deferred): Test "neue Karte ohne Wiederholung hat 0" prueft nichts (state.test.ts:233); Kommentar state.ts:95 unerreichbar; retrievability baut Scheduler je Aufruf; Hinweis: replay immer mit vollem Protokoll aufrufen (T8/T11)
- Task 4: minor (deferred): knownForms erlaubt Woerter aus spaeteren Situationen; doppelte order nicht gemeldet; kein Test fuer R unter 0.8 nach known; loader validiert nicht (CI laeuft check:content vor build)
- Hinweis fuer T8/T12: situationCoverage immer mit all=situations aufrufen
- Task 5: minor (deferred): Cast WordItem statt Typwaechter; keine Tests maxNew mit Grammatik, finished bei >20 faellig
- Task 5: minor (deferred): Kommentar state.ts:72 zu dialogsHeard ungenau; Dialog nur wenn Runde nicht finished
- Hinweis fuer T8: Dialog-Aufgabe schreibt 'heard'-Ereignis; buildRound bekommt heard=dialogsHeard(events)
- Task 6: minor (deferred): getKey leerer String; Report-ts nicht auf Endlichkeit; review ohne rating/stage gilt als gueltig; findIndex O(n2) im Import; requestPersistence ohne Test; getSettings Race
- Hinweis fuer T8: requestPersistence() beim Start einmal aufrufen
- Task 7: minor (deferred): Retry ohne Pause; Manifest bei Fehlschlag ungenau; edge-tts nicht gepinnt; AbortError-Rauschen in play; audio-v1 doppelt als Literal; run_situation ohne Test; ffprobe fehlt, Dauer nur ueber Groesse
- Hinweis fuer T8: Audio-Keys 1-basiert (d-x-1, w-x-ex1, g-x-1, pair-x-opt1); loadManifest(situationId); audioUrl liefert null ohne passendes Tempo
- Task 8: minor (deferred): keine Tests useAppState/validCardIds/Grammar/Pressure/Listen; openDb-Fehler ohne Meldung, record-Fehler verschluckt; ms zaehlt ab Mount; pressure zeigt Text ohne Ton; bestTarget via JSON-Vergleich; Type/Grammar/Dialog nicht fotografiert (T16)
- Task 8: minor (deferred): answered ohne Sperre (Doppel-Enter/Doppelklick Fertig kann zwei Ereignisse schreiben); known gibt Sperre bei record-Fehler nicht frei; Einrueckung Listen.tsx pair-Zweig
- Task 9: minor (deferred): Aufnahme immer volle 6 s ohne Stopp; Markierung gegen text.es statt accept-Variante; usedHint false nach zweitem null; recordClip-Erfolgspfad ungetestet
- Task 9: minor (deferred): once-Listener bleibt am geteilten Element; play und playSequence nicht gegeneinander gesichert
- Task 10: review clean (Diagnose+README); minor (deferred): Hinweis 'Sprich jetzt' fehlt; Ton-Test mit eigenem Audio statt geteiltem; kein try/finally
- Task 11: minor (deferred): bei >1000 Gists oder gleichzeitiger Erstanlage zwei Gists; GET/PATCH nicht atomar (heilt sich); Settings-UI-Tests ohne RED
- Task 11: minor (deferred): Mikrotask-Luecke zwischen running und queued; commitToken doppelt bei Blur+Klick
- Task 12: minor (deferred): Placement zeigt bis Manifest geladen kurz spanischen Text (verraet Antwort); execCommand-Fallback ungetestet; useEffect ohne deps; README-Quellen pruefen in T16
- Hinweis T16: Push auf main loest Pages-Workflow nicht aus (nur workflow_dispatch laeuft); Run 45694884029 fuer bcd4ddc manuell
- Task 13: minor (deferred): Namen Ana/Pablo als forms von p-me-llamo (Behelf fuer Dialogpruefung); Generator nur im Scratchpad
- Task 14: minor (deferred): DAMER-Eintraege nicht vom Review geoeffnet
- Task 14: minor (deferred): w-chico-Note behauptet derbe Nebenbedeutung von "el chico" in Chile ohne Beleg, im Schluss-Fix streichen; chucrut nur in deutscher Note
- Task 16: minor (deferred): Grammatik-Eingabe unter langer Erklaerung (Scrollen); Hoerpaare erst spaet in Dateireihenfolge; Erkennungs-Timeout nur mit Uhr-Vorspulen geprueft
- Schluss-Review: Re-Review der Fix-Welle clean (A1 bis A6, B1 bis B8 addressed); deferred: maxEntries 6000 reicht nur fuer etwa 4 Situationen, in Teil 2 anheben; Vorabruf laedt beim ersten Mal etwa 50 MB je Situation
- iPhone-Test (Plan Task 10, Schritte 4 und 5) offen, Ergebnis gehoert nach docs/ios-test.md
- Push auf main loest den Pages-Workflow nicht aus; Auslieferung per gh workflow run pages.yml --ref main
