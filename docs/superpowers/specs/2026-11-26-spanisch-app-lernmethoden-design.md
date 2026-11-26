# Spanisch-App: Lernmethoden nach Forschungsstand und Fortschritt zurücksetzen

Stand 26.11.2026. Baut auf `2026-11-25-spanisch-app-design.md` (Lernlogik Teil 1) auf und ersetzt dort den Abschnitt "Erstkontakt" (Aufgabenstufe 1) und die Definition von "sicher" im Abschnitt "Fortschritt".

## Anlass und Absicht

Gunnar (wörtlich, gekürzt): "da stand hasta luego auf der einen Seite, da stand dann, was es bedeutet, und auf der nächsten Seite musste ich dann angegeben, was es bedeutet. Ist das effektives Lernen? [...] du musst doch mal nachgucken, was die besten Methoden sind, um eine Sprache zu lernen, wissenschaftlich bewiesen. Und jetzt habe ich schon 18 % von dem Kapitel fertig [...] obwohl ich nur ein einziges Mal hasta luego angeklickt habe." Und: "Ich will eine Funktion haben, dass ich meinen Fortschritt zurücksetzen kann."

Drei Probleme:

1. **Abfrage direkt nach der Einführung.** Ein neues Item wird gezeigt (Form, Bedeutung, Ton) und unmittelbar danach per Auswahl abgefragt. Das ist Abschreiben aus dem Kurzzeitgedächtnis, kein Abruf. Diese Antwort zählt zudem als erste FSRS-Bewertung.
2. **Fortschrittsanzeige zählt Gesehenes als Gekonntes.** `isSure` gilt ab Abrufwahrscheinlichkeit über 0,8. Direkt nach der ersten Bewertung liegt sie bei fast 1. Ein Klick macht ein Wort "sicher", in jedem Dialog, in dem es vorkommt.
3. **Kein Neuanfang möglich.** Der Lernstand ist ein Ereignisprotokoll, das über das Gist zwischen Geräten vereinigt wird. Lokales Löschen würde beim nächsten Abgleich zurückgeholt.

Ziel: Die App folgt belegten Lernprinzipien sichtbar, und die Prozentzahl bedeutet, was sie sagt.

## Forschungsgrundlage (geprüft am 26.11.2026)

- **Testing Effect**: Abrufen schlägt Wiederlesen (Roediger und Karpicke 2006; Metaanalyse Adesope, Trevisan und Sundararajan 2017, Review of Educational Research 87, 659 bis 701). Bestätigt das Grundprinzip der App.
- **Ersten Abruf verzögern**: Karpicke und Roediger 2007 (JEP:LMC 33, 704 bis 719), Vokabelpaare: Ein sofortiger erster Test hilft nach 10 Minuten, aber nicht nach 2 Tagen; "Delaying the first test improved long-term retention, regardless of how the repeated tests were spaced." Direkt anwendbar auf Problem 1.
- **Retrieval-Effort-Hypothese**: schwere, aber erfolgreiche Abrufe festigen mehr als leichte (Pyc und Rawson 2009, JML 60, 437 bis 447).
- **Verteiltes Üben** im Fremdsprachenlernen stark und anhaltend, für Wortschatz und Grammatik (Kim und Webb 2022, Language Learning, Metaanalyse über 48 Experimente). Leistet FSRS bereits.
- **Hervorbringen schlägt Wiedererkennen** (Generationseffekt; Abruf mit Eingabe statt Auswahl).
- **Textabdeckung**: Müheloses Verstehen braucht etwa 95 bis 98 % bekannte Wörter (Nation 2006; van Zeeland und Schmitt 2013 für gesprochene Sprache). Die Anzeige "Du verstehst etwa X %" ist als Maß richtig, wenn sie gefestigte Wörter zählt.

## Ziele

1. Neue Items werden erst nach anderen Aufgaben zum ersten Mal abgefragt, nicht direkt nach der Einführung.
2. Dieser erste Abruf verlangt, wo es geht, eigenes Hervorbringen statt Auswahl.
3. "Sicher" (und damit "Du verstehst etwa X %", die Gesamtzahl auf der Fortschrittsseite, die Rundenende-Zeile und die Freischaltung der Chile-Aufnahmen) zählt nur gefestigte Items: richtig abgerufen nach mindestens einem Tag Abstand, oder ausdrücklich als bekannt markiert.
4. Fortschritt zurücksetzen in den Einstellungen, mit Rückfrage, wirksam auf allen Geräten über den Abgleich.

## Nicht-Ziele

- Kein neues Wiederholungsverfahren. FSRS (ts-fsrs) und die Bewertungsableitung (`ratingFor`) bleiben.
- Keine neuen Inhalte, keine neuen Aufgabenformen. Es werden bestehende Formen (Intro, Choice, Listen, Type, Grammar) neu angeordnet.
- Keine Änderung an Dialog- und Clip-Auswahl außer der Freischaltung (siehe unten). Dialoge und Clips werden weiter nach gesehenem Wortanteil angeboten; Zuhören mit gesehenen Wörtern ist sinnvolles Hören und soll nicht warten.
- Kein Zurücksetzen einzelner Situationen oder Wörter. Nur alles.

## Anti-Ziele

- Keine Serien, Punkte, Herzen, Rückstandszahlen (unverändert). Insbesondere keine Anzeige wie "noch 3 Tage bis gefestigt".
- Kein Frust durch zu schwere erste Abrufe: Wer beim ersten Abruf scheitert, bekommt wie heute Hinweis, zweiten Versuch und Lösung.
- Zurücksetzen darf nie aus Versehen passieren und darf keine Einstellungen (Token, Behaltensquote, Stimmen) löschen.

## Festlegungen

### 1. Neue Items: Einführung, Abstand, erster Abruf (Claudes Festlegung)

Heute: je neuem Item die Gruppe `[intro, choice]` direkt hintereinander, Gruppen gleichmäßig zwischen die Wiederholungen verteilt (`interleave` in `src/engine/round.ts`).

Neu:

- Die Einführung (`intro`) bleibt unverändert: Form, Bedeutung, Ton, Beispiele, Knopf "Kann ich schon". Sie erzeugt weiterhin kein Ereignis.
- Der erste Abruf eines neuen Items steht in derselben Runde, aber **mit mindestens zwei, möglichst drei anderen Aufgaben dazwischen** (beliebiger Art: Wiederholungen, andere Einführungen, andere erste Abrufe). Diese Lücke ist die Hauptsache der Änderung.
- Anordnung: Die Runde wird so gebaut, dass Einführungen und erste Abrufe verzahnt laufen, etwa: Einführung A, Einführung B, Wiederholung, Einführung C, Abruf A, Wiederholung, Abruf B, Einführung D, Abruf C, ... Gibt es zu wenige Aufgaben, um die Lücke einzuhalten (zum Beispiel nur ein neues Item und keine Wiederholungen), kommt der Abruf ans Ende der Runde, mit so viel Abstand wie möglich. Die genaue Verteilung legt der Builder fest; prüfbar ist: zwischen Einführung und erstem Abruf desselben Items liegen mindestens 2 andere Aufgaben, sofern die Runde insgesamt genug Aufgaben dafür hat.
- **Form des ersten Abrufs** je Item-Art:
  - Wort, Wendung, Satz mit `produce !== false`: `type` (Deutsch sehen, Spanisch tippen). Das ist freies Abrufen.
  - Wort, Wendung, Satz mit `produce === false` (nur verstehen): `listen` (Hören, Bedeutung finden).
  - Hörpaar (`pair`): wie heute die Hörform.
  - Grammatik: unverändert (`grammar`, keine eigene Einführung).
- Der erste Abruf erzeugt wie heute ein `review`-Ereignis mit Stufe 0. Die Stufenleiter danach bleibt wie sie ist (Rating 3 oder 4 hebt die Stufe, also kommt beim nächsten Mal Hören, dann Tippen, dann Sprechen, dann Hören unter Druck). Dass der erste Abruf schon getippt wird und Stufe 1 danach Hören ist, ist gewollt: Tippen festigt die Form, Hören danach trainiert das Erkennen im Ton.
- **Wiederholungen auf Stufe 0** (nach Rating 1 oder 2 bleibt oder fällt die Stufe auf 0): Form wie beim ersten Abruf, also `type` bzw. bei `produce === false` `listen`, nicht mehr `choice`. Damit verschwindet die reine Auswahl aus der Leiter für Wörter, Wendungen und Sätze (Claudes Festlegung nach Builder Check). Der Kommentar zu `Stage` in `state.ts` wird angepasst. Die Komponente `Choice` bleibt im Code.
- Scheitern beim ersten Abruf: Rückmeldung so, wie die jeweilige Form es heute macht (Tippen mit Hinweis, zweitem Versuch und Lösung; Hören mit Lösung ohne zweiten Versuch). Keine Änderung an `ChoiceBase` (Claudes Festlegung nach Builder Check).
- Bricht Gunnar die Runde nach einer Einführung, aber vor ihrem ersten Abruf ab, gibt es kein Ereignis; das Item gilt beim nächsten Mal wieder als neu und wird erneut eingeführt (heutiges Verhalten, bleibt).
- "Kann ich schon" auf der Einführung: wie heute `known`-Ereignis; der zugehörige erste Abruf entfällt in dieser Runde (heute über `skipped`, bleibt).
- `maxNew` bleibt 6.

### 2. "Sicher" heißt gefestigt (Claudes Festlegung)

Ein Item gilt als **gefestigt**, wenn eines davon zutrifft:

- Es wurde als bekannt markiert (`known`, aus "Kann ich schon" oder der Einstufung) und seitdem nicht mit "Again" (Rating 1) bewertet. (Heutige Regel für `known` bleibt.)
- Es hat mindestens eine **verteilte erfolgreiche Wiederholung**: ein `review` mit Rating 2 oder höher, dessen Zeitpunkt mindestens 20 Stunden nach dem vorherigen `review`-Ereignis derselben Karte liegt, und seit dieser Wiederholung kein Rating 1. (20 statt 24 Stunden, damit "morgen zur gleichen Zeit, etwas früher" zählt.)

Und zusätzlich, wie heute: Abrufwahrscheinlichkeit zum Zeitpunkt der Anzeige über 0,8 (oder `known`). Wer lange nicht übt, rutscht also wieder unter die Schwelle.

Ein Rating 1 nimmt die Festigung weg; sie kommt mit der nächsten verteilten erfolgreichen Wiederholung zurück.

Umsetzung: `replay` in `src/engine/state.ts` führt je Karte ein zusätzliches Feld (z. B. `consolidated: boolean`) mit; `isSure` in `src/engine/coverage.ts` verlangt es. Alle Aufrufer von `isSure` und `situationCoverage` (Home, Progress, RoundEnd, Round, `chileUnlocked`) bekommen damit automatisch das neue Maß.

Folgen, die gewollt sind:

- Nach der ersten Runde zeigt die Anzeige für die neuen Wörter 0 %. Die Rundenende-Zeile zeigt dann die gleichbleibende Zahl (heutige Textvariante ohne "vorher").
- Die Chile-Aufnahmen werden später frei (ab 50 % gefestigter Grundlagen-Dialogwörter statt gesehener). Die Schwelle 0,5 bleibt.
- Bestehende Lernstände werden beim Abspielen neu bewertet; es braucht keine Datenmigration, weil alles aus dem Protokoll berechnet wird.

Die Gesamtzeile auf der Fortschrittsseite heißt weiter "Gesamt, sicher bekannte Wörter und Wendungen" und zählt gefestigte.

### 3. Fortschritt zurücksetzen (Claudes Festlegung zur Technik)

- **Ort**: Einstellungen, eigener Abschnitt am Ende ("Neu anfangen" als Überschrift oder ähnlich, Satzschreibung), mit einem Satz Erklärung: Der Lernstand auf allen Geräten, die abgleichen, beginnt von vorn; Einstellungen und Token bleiben; eine Sicherung als Datei vorher ist möglich (Verweis auf den bestehenden Sicherungsknopf).
- **Rückfrage**: Ein Klick auf "Fortschritt zurücksetzen" öffnet eine Bestätigung in der Seite (kein `window.confirm`, das auf iOS im Home-Bildschirm-Modus unzuverlässig ist). Bestätigung mit einem eindeutig beschrifteten Knopf ("Ja, alles zurücksetzen"), daneben "Abbrechen". Gestaltung nach Taste-Skill, im Stil der bestehenden Einstellungen.
- **Technik**: Zurücksetzen schreibt ein neues Ereignis `{ kind: 'reset' }` in das Protokoll (mit `id`, `ts`, `device` wie alle Ereignisse; `cardId` ist ein fester Wert, z. B. `'*'`, damit `validEvent` und das Gist-Format unverändert gültig bleiben). Beim Abspielen (`replay`) und bei `dialogsHeard` zählen nur Ereignisse, die in der Sortierung (ts, dann id) nach dem letzten `reset` liegen. Das Ereignis wird wie jedes andere über das Gist verteilt; jedes Gerät mit neuer App-Version setzt dadurch beim nächsten Abgleich ebenfalls zurück. Nichts wird physisch gelöscht; Sicherungsimport und Abgleich bleiben reine Vereinigung.
- `validEvent` akzeptiert `reset`. Ältere App-Versionen lehnen ein Gist mit `reset` als ungültig ab und gleichen dann nicht ab, statt Daten zu verfälschen. Das ist hinnehmbar, weil die PWA sich selbst aktualisiert.
- **Einstufung nach dem Zurücksetzen, auf jedem Gerät** (Claudes Festlegung nach Builder Check): `placementDone` ist eine lokale Einstellung. Damit auch ein zweites Gerät, das das `reset` nur über den Abgleich bekommt, die Einstufung wieder anbietet, merkt sich die Einstellung zusätzlich den Zeitpunkt (z. B. `placementAt`, Millisekunden). Eine erledigte Einstufung zählt nur, wenn sie nach dem letzten `reset` liegt; ein altes `placementDone: true` ohne Zeitpunkt gilt als Zeitpunkt 0. Die übrigen Bedingungen für das Angebot (leerer Lernstand, nichts gehört) bleiben.
- Nach dem Zurücksetzen: Abgleich anstoßen (wenn Token vorhanden) und zur Startseite zurück. Fehlermeldungen (`addReport`) bleiben erhalten.
- Ereignisse vor dem Zurücksetzen mit Zeitstempel nach dem `reset` (Gerät mit falsch gehender Uhr) zählen; das ist hinnehmbar.

## Randbedingungen

- Oberfläche deutsch, Satzschreibung mit großem Anfangsbuchstaben, keine Gedankenstriche, kein Mittelpunkt als Trenner, keine Emojis, kein Violett. Dunkelmodus nach System. Offline.
- Jede sichtbare Änderung (Einstellungsabschnitt, Bestätigung) mit dem Taste-Skill bauen und mit dem Gate prüfen (`.taste-skill/root/spanisch-app/`). Screenshots nur in Scratch.
- Bestehende Tests müssen grün bleiben oder werden an das neue Verhalten angepasst, wo sie das alte (sofortige Auswahl, `isSure` nach einer Bewertung) festschreiben.
- Checks: `npm test`, `npx tsc --noEmit`, `npm run check:content`, `npm run build`.

## Dem Builder überlassen

- Exakter Verteilalgorithmus der Runde, solange die Lücke von mindestens 2 Aufgaben (wenn möglich 3) gilt und die Reihenfolge deterministisch bleibt.
- Name und Form des Festigungsfelds im `CardState`.
- Wortlaut der Erklärung und der Bestätigung im Rahmen der Randbedingungen.
- Ob `seenTokens` (Dialog- und Clip-Auswahl) unverändert bleibt: ja, außer es zeigt sich ein zwingender Grund.

## Prüfbare Abnahme

1. Runde mit neuen Items und ohne Wiederholungen: Keine Einführung wird unmittelbar von einer Abfrage desselben Items gefolgt; bei mindestens 3 neuen Items liegen zwischen Einführung und erstem Abruf jedes Items mindestens 2 andere Aufgaben.
2. Erster Abruf eines produzierbaren Worts ist `type`, eines Nur-verstehen-Worts `listen`. Dasselbe gilt für Wiederholungen auf Stufe 0.
3. Nach einer einzigen erfolgreichen Bewertung eines Worts zählt es nicht als sicher; die Anzeige der Situation ändert sich dadurch nicht.
4. Nach einer erfolgreichen Wiederholung mindestens 20 Stunden nach der ersten zählt es als sicher (solange R über 0,8). Nach einem folgenden Rating 1 nicht mehr.
5. `known` zählt sofort als sicher.
6. Zurücksetzen mit Bestätigung: danach leerer Lernstand, Startseite bietet die Einstufung an, Einstellungen und Token unverändert. Ein zweites Gerät, das das Protokoll mit `reset` vereinigt, hat danach ebenfalls leeren Lernstand und bietet die Einstufung an. Abbrechen ändert nichts.
7. Ereignisse nach dem `reset` bauen normal einen neuen Lernstand auf.
