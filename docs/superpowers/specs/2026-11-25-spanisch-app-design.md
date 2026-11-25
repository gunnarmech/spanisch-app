# Spanisch-App für Chile: Design

Stand 25.11.2026. Grundlage: Gespräch mit Gunnar am 25.11.2026 und die Studiensammlung in `recherche/lernforschung.md` (Quellen dort als Q1 bis Q73, hier nur als Verweis).

## Absicht und Warum

Gunnar ist im März 2027 in Chile und will bis dahin genug Spanisch, um sich im Alltag zu verständigen: dort, wo niemand gut Englisch spricht, mehr können als Hände und Füße. Er fängt ungefähr bei null an. Es gibt keine Spanisch-App, die wirklich kostenlos ist, also baut er sich seine eigene. Die App ist nur für ihn; es gibt keine anderen Nutzer, kein Konto, keinen Verkauf.

Gelernt wird lateinamerikanisches Spanisch mit chilenischer Ebene. Kernvariante ist neutrales lateinamerikanisches Spanisch (seseo, yeísmo, ustedes, tú als Produktionsform). Dazu kommt gezielt chilenisches Hörverstehen (aspiriertes oder verschlucktes s am Silbenende, hohes Tempo) und die häufigsten Chilenismen (cachai, al tiro, po, fome, el "estai" als chilenischer Voseo). Chilenisches wird vor allem verstanden, nicht aktiv produziert, außer festen Wendungen, die man als Reisender gut gebrauchen kann.

Erfolg heißt: Im März kann er in Chile bestellen, einkaufen, nach dem Weg fragen, Bus und Metro nutzen, in Hostel und Unterkunft klarkommen, bezahlen, einfachen Smalltalk führen, im Notfall Hilfe holen, und er versteht die Antworten auch bei normalem chilenischem Tempo zum großen Teil.

## Was Gunnar ausdrücklich gesagt hat

- Für ihn selbst, Ziel Chile im März, lateinamerikanisches Spanisch.
- Zeit: meist 10 bis 20 Minuten am Tag, manchmal nur 5, manchmal gar nichts, manchmal deutlich länger. Länger lernen muss jederzeit möglich sein.
- Duolingo fand er nett, aber oft "so easy, warum mache ich das noch". Die App darf ihn nicht mit Sachen beschäftigen, die er schon kann.
- Kein KI-Gesprächspartner. Hören, Lesen und Nachsprechen mit Aussprachekontrolle reichen.
- iOS (iPhone) und Desktop (Windows-PC), kostenlos.
- Die vorgeschlagene Ausgestaltung (Situationen, Bausteine, Lerngefühl, Bauweise) hat er mit "passt so, leg los" angenommen. Die Bauentscheidungen unten waren Claudes Vorschlag; er hat sie angenommen, aber nicht selbst gewählt.

## Ziele

1. Eine installierbare Web-App (PWA), die auf dem iPhone über "Zum Home-Bildschirm" und am PC über Chrome oder Edge als App läuft, offline funktioniert und den Lernstand zwischen beiden Geräten abgleicht.
2. Inhalte entlang von Alltagssituationen in Chile, nach Häufigkeit ausgewählt.
3. Eine "Heute"-Einheit, die nach etwa 5 Minuten sinnvoll abgeschlossen ist, mit "weiter lernen" ohne Obergrenze.
4. Wiederholungen nach einem Gedächtnismodell (FSRS), die nach Pausen keinen Strafstapel erzeugen.
5. Keine Langeweile: Was sitzt, kommt selten; Aufgaben werden schwerer, sobald sie leichtfallen; "kann ich schon" überspringt sofort.
6. Hörtraining mit mehreren Stimmen aus mehreren Ländern, darunter chilenische, mit steigendem Tempo.
7. Nachsprechen mit Spracherkennung als Aussprachekontrolle.
8. Fortschrittsanzeige als Verständnis ("du kennst die Wörter für 70 % der Café-Dialoge"), nicht als Punkte.

## Nicht-Ziele

- KI-Gesprächspartner, Chatbot, jede Funktion mit laufenden API-Kosten oder API-Schlüssel zur Laufzeit.
- App-Store-App, native iOS-App, Mac, Apple-Entwicklerkonto.
- Mehrere Nutzer, Anmeldung, Server mit Datenbank.
- Vollständiger Grammatikkurs, Vergangenheitszeiten in der Tiefe, Schreiben längerer Texte.
- Europäisches Spanisch als Lernziel (vosotros, [θ] nur als "kommt vor" erwähnen, wenn überhaupt).
- Andere Länder als Chile vertieft (andere Akzente nur als Stimmenvielfalt).

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Serien, die reißen, Verlustangst, Punkte, Ranglisten, Herzen, Strafen für ausgelassene Tage.
- Nach einer Woche Pause ein Berg von hunderten überfälligen Karten.
- Aufgaben, die er längst kann, in derselben leichten Form immer wieder.
- Reines Anklicken ("gewusst"), ohne dass etwas abgerufen wurde.
- Wörter ohne Satz und ohne Ton.
- Laufende Kosten irgendeiner Art.
- Inhalte mit falschem oder spanischem (Spanien) Sprachgebrauch, wo lateinamerikanischer gemeint ist.

## Inhalt

### Situationen

Die Inhalte sind in Situationen gegliedert. Reihenfolge nach Nutzen für einen Reisenden (Claudes Festlegung):

1. Grundlagen: Begrüßen, sich vorstellen, bitte, danke, verstehen und nicht verstehen ("¿Puede repetir, más despacio?"), Zahlen 0 bis 100, Zahlen für Preise.
2. Café und Restaurant: bestellen, nachfragen, Rechnung, Allergien.
3. Einkaufen und Bezahlen: Supermarkt, Kiosk, Preise in Pesos, Karte oder bar.
4. Unterwegs: Metro, Bus (Micro), Taxi und Uber, Fernbus, Tickets, Bip!-Karte.
5. Weg fragen und Richtungen.
6. Unterkunft: Hostel, Check-in, Probleme im Zimmer, WLAN.
7. Smalltalk: woher, was machst du, wie lange bleibst du, Wetter, Vorlieben.
8. Notfall und Gesundheit: Apotheke, Arzt, Polizei, verloren, gestohlen.
9. Chile-Ebene: Chilenismen und chilenische Aussprache als eigene Einheiten, die nach den Grundlagen freigeschaltet werden und danach in die anderen Situationen einfließen.

Uhrzeit, Tage und einfache Zeitangaben laufen in den Situationen mit, wo sie gebraucht werden.

### Lerneinheiten (Items)

Jede Situation enthält Items. Typen:

- **Wort oder feste Wendung**: spanisches Lemma oder Chunk, deutsche Bedeutung, mindestens ein Beispielsatz mit Übersetzung, Audio in mehreren Stimmen, optional Hinweis (Gebrauch, chilenische Variante).
- **Satz**: ganzer nützlicher Satz mit Übersetzung, Audio, zugehörige Wörter verlinkt.
- **Dialog**: kurzer Dialog (4 bis 10 Repliken) in einer Situation, Repliken mit Sprecher, Übersetzung, Audio je Replik, aus bereits eingeführten Wörtern gebaut (Ziel: 95 bis 98 % bekannte Wörter beim ersten Hören, Q24, Q25).
- **Grammatik-Häppchen**: Erklärung, die in 30 bis 60 Sekunden lesbar ist, mit Beispielen, danach Übungen über Sätze (Q36, Q37). Umfang bis März: Präsens regelmäßig und die wichtigsten unregelmäßigen Verben (ser, estar, tener, ir, querer, poder, hacer, saber), ser gegen estar, Fragen und Fragewörter, Artikel und Geschlecht, Verneinung, "quiero / me gustaría / ¿me da...?", Zukunft mit "voy a", "hay", Possessiva, gustar. Verwechselbare Paare (ser/estar, por/para) werden gemischt geübt (Q15, Q16).
- **Hörpaar** (Aussprache): Wortpaare oder Sätze, die sich am Hören unterscheiden, für Identifikationsübungen (Q42, Q43).

Umfang bis März (Richtwert, Claudes Festlegung): etwa 800 bis 1200 Wörter und Wendungen, 300 bis 500 Sätze, 40 bis 60 Dialoge. Die ersten drei Situationen müssen früh fertig sein, damit Gunnar schnell anfangen kann; der Rest kann nachgeliefert werden. Ein Inhaltsnachschub darf den Lernstand nicht zurücksetzen.

### Herkunft der Inhalte

- Sätze, Dialoge, Erklärungen und Chilenismen schreibt Claude beim Bau. Qualitätsregel: natürliches lateinamerikanisches Spanisch, wie man es in Santiago hören würde; nichts Spanien-Spezifisches.
- Wortauswahl und Reihenfolge orientieren sich an einer freien Häufigkeitsliste (hermitdave/FrequencyWords, Spanisch, CC BY-SA 4.0, Q66) und am Situationsbedarf. Ergänzend können Tatoeba-Sätze (CC BY 2.0 FR, Q65) genutzt werden, aber nur nach Prüfung auf lateinamerikanischen Sprachgebrauch.
- Lizenzangaben und Namensnennung stehen auf einer Seite "Quellen" in der App und in der README.
- Davies-Korpus und Frequenzwörterbuch werden nicht verwendet (kostenpflichtig, Q62, Q63).

### Audio

Audio wird vorab beim Bau erzeugt und als Dateien ausgeliefert, nicht zur Laufzeit. Werkzeug: neuronale Sprachstimmen über das Python-Paket `edge-tts` (kostenlos, ohne Schlüssel). Stimmen (Claudes Festlegung):

- Chile: es-CL-CatalinaNeural, es-CL-LorenzoNeural
- Mexiko: es-MX-DaliaNeural, es-MX-JorgeNeural
- Kolumbien: es-CO-SalomeNeural, es-CO-GonzaloNeural

Jedes Item bekommt mindestens zwei Stimmen, davon mindestens eine chilenische; Dialoge werden mit verschiedenen Stimmen je Sprecher erzeugt. Tempo: normale Geschwindigkeit plus eine langsame Fassung (etwa 75 %) für neue Items; für Hörtraining auf höheren Stufen eine schnelle Fassung (etwa 115 %), um chilenisches Tempo anzunähern. Wenn eine Stimme ausfällt oder nicht verfügbar ist, nimmt der Bau eine andere aus derselben Liste.

Grenze, die Gunnar kennen soll: Synthetische Stimmen bilden chilenische Umgangssprache (aspiriertes s, Verschleifungen) nur teilweise ab. Für die Chile-Ebene können zusätzlich frei lizenzierte echte Aufnahmen (zum Beispiel aus Tatoeba mit passender Lizenz oder Wikimedia Commons) eingebunden werden, wenn sich welche finden; das ist Kür, nicht Pflicht.

Die Nutzungsbedingungen des Dienstes hinter `edge-tts` sind für Privatgebrauch ausreichend geduldet, aber nicht ausdrücklich erlaubt. Für eine rein private App nimmt Claude das in Kauf; die erzeugten Dateien liegen allerdings in einem öffentlichen Repository (siehe Hosting). Siehe offene Punkte.

## Lernablauf

### Heute-Einheit

Beim Öffnen zeigt die App eine Startseite mit einem großen Knopf "Heute lernen". Eine Runde dauert etwa 5 Minuten (Richtwert: 15 bis 25 Aufgaben, abhängig vom Aufgabentyp) und besteht aus:

1. fälligen Wiederholungen zuerst, sortiert nach Dringlichkeit (geringste aktuelle Abrufwahrscheinlichkeit zuerst),
2. dann neuen Items aus der aktuellen Situation, höchstens etwa 5 bis 8 neue pro Runde,
3. höchstens einer kurzen Hör- oder Dialogaufgabe.

Nach einer Runde: kurze Rückmeldung (was neu ist, wie viel Verständnis dazugekommen ist) und zwei Knöpfe: "fertig" und "noch eine Runde". Es gibt keine Tagesgrenze für Runden. Die Situationen können auch gezielt gewählt werden (Gunnar entscheidet, was er als Nächstes lernen will; Autonomie, Q55); ohne Wahl schlägt die App die nächste Situation in der Reihenfolge vor.

### Pausen ohne Strafstapel

- Fällige Wiederholungen werden pro Runde begrenzt; der Rest verteilt sich auf spätere Runden, wobei immer die dringendsten zuerst kommen.
- Nach einer längeren Pause (mehrere Tage) bringt die erste Runde fast nur Wiederholungen der wichtigsten Items und keine Zahl, die einen Rückstand anzeigt. Die App zeigt nie "312 Karten fällig".
- Keine Serien, keine Tageszähler, keine Erinnerungen, die Schuld erzeugen. Eine freiwillige, freundliche Erinnerung per Benachrichtigung ist Kür, nicht Pflicht.

### Gedächtnismodell

Wiederholungsplanung mit FSRS (Q5 bis Q8), umgesetzt mit der Bibliothek `ts-fsrs` (Lizenz vor Einsatz prüfen; bei unpassender Lizenz eine eigene schlanke FSRS-Umsetzung nach veröffentlichter Formel). Ziel-Behaltensquote 0,9 als Voreinstellung, in den Einstellungen änderbar. Bewertung wird aus der Aufgabe abgeleitet, nicht vom Nutzer erfragt: falsch = Again, richtig mit Hilfe oder sehr langsam = Hard, richtig = Good, richtig und schnell auf schwerer Stufe = Easy. Die genauen Schwellen legt der Builder fest.

Ein Item kann mehrere Karten haben (zum Beispiel Hören→Bedeutung und Deutsch→Spanisch). Der Builder entscheidet, ob Karten getrennt geplant werden oder als ein Item mit Stufe.

### Aufgabenstufen gegen Langeweile

Jedes Item steigt mit wachsender Stabilität durch schwerere Aufgabenformen (Abruf vor Anzeige, Q10 bis Q14):

1. **Erstkontakt**: Item wird mit Ton, Satz und Übersetzung gezeigt, danach sofort eine leichte Abrufaufgabe (Auswahl aus 3 bis 4).
2. **Hören→Bedeutung**: Audio hören, Bedeutung wählen oder eintippen.
3. **Deutsch→Spanisch tippen**: Lückensatz oder ganzer Ausdruck. Toleranz: Groß- und Kleinschreibung und Satzzeichen egal; fehlende Akzente zählen als richtig mit Hinweis; Tippfehler mit einem Zeichen Abstand zählen als richtig mit Hinweis.
4. **Sprechen**: Deutsch sehen, Spanisch sagen, Spracherkennung prüft.
5. **Hören unter Druck**: andere Stimme, schnelle Fassung, chilenische Stimme, ohne Text.

Wer eine Stufe sicher schafft, bekommt beim nächsten Mal die nächste. Wer scheitert, geht eine Stufe zurück. Jede Aufgabe hat einen Knopf "kann ich schon": Das Item wird als sicher markiert und kommt erst nach langem Abstand wieder, dann gleich auf der höchsten Stufe; scheitert es dort, wird es normal eingereiht.

Beim allerersten Start gibt es einen kurzen Einstufungstest über die häufigsten 100 bis 200 Wörter und Wendungen, damit bekannte Items gar nicht erst als neu kommen. Gunnar kann ihn überspringen.

### Feedback

Sofort nach jeder Antwort: richtig oder falsch, die richtige Form mit Ton, bei Tippfehlern die Stelle markiert (Q38 bis Q40). Bei falscher Antwort erst ein Hinweis und ein zweiter Versuch, dann die Lösung. Kurz und ohne Wertung.

### Hörtraining und Aussprache

- **Identifikation**: "Welches Wort hörst du?" mit Wortlabels, mehrere Stimmen (Q42, Q43). Schwerpunkte: chilenisches s-Verschlucken ("¿cómo estás?" gegen "¿cómo ehtá?"), schnelle Verbindungen, Zahlen und Preise in normalem Tempo.
- **Dialoge**: hören ohne Text, dann mit Text, dann Replik für Replik nachsprechen.
- **Nachsprechen mit Spracherkennung**: Web Speech API (`SpeechRecognition` bzw. `webkitSpeechRecognition`) mit Sprache `es-CL` oder `es-419`. Vergleich mit dem Zielsatz tolerant (Satzzeichen, Groß/Klein, Akzente egal). Ergebnis: verstanden, teilweise (Wörter markiert) oder nicht verstanden.
- **Ausfallweg**: Wenn Spracherkennung auf einem Gerät oder im installierten Modus nicht verfügbar ist (auf iOS im Home-Bildschirm-Modus unsicher), nimmt die App die eigene Aussprache auf, spielt sie nach dem Original ab, und Gunnar bewertet selbst ("klang gleich / eher nicht"). Die Sprechstufe gilt dann als bestanden mit Selbstbewertung.

### Fortschritt

- Hauptanzeige je Situation: Anteil der Wörter in den Dialogen dieser Situation, die er sicher kennt ("du verstehst etwa 70 % der Café-Dialoge"). Sicher heißt: Abrufwahrscheinlichkeit über 0,8 (Builder darf anpassen).
- Gesamt: Anzahl sicher bekannter Wörter und Wendungen, geschätzte Abdeckung von gesprochenem Alltagsspanisch.
- Keine Punkte, keine Serien, keine Ranglisten (Q51 bis Q55).

## Bauweise (Claudes Festlegung, von Gunnar angenommen)

- **Art**: Progressive Web App, offline lauffähig (Service Worker cached App, Inhalte und Audio). Installierbar auf iPhone (Safari, Zum Home-Bildschirm) und am PC (Chrome oder Edge).
- **Technik**: Vite, TypeScript, Preact; Tests mit Vitest; Offline über `vite-plugin-pwa`. Der Builder darf gleichwertig wählen, wenn er gute Gründe hat, aber kein schweres Framework und kein Server.
- **Lokale Daten**: IndexedDB für Lernstand und Bewertungsprotokoll.
- **Inhalte**: als JSON-Dateien im Repository, je Situation eine Datei, mit stabilen Item-IDs. Ein Prüfskript im Bau validiert Struktur, IDs, Audioverweise und die Deckung der Dialoge.
- **Audio**: vorab erzeugt (Skript in Python mit `edge-tts`), als komprimierte Dateien (mp3 oder Opus in mp4/webm, Safari-tauglich) im Repository. Nur fehlende oder geänderte Dateien neu erzeugen.
- **Hosting**: GitHub Pages aus einem Repository in Gunnars GitHub-Konto (gunnarmech). Bei einem kostenlosen GitHub-Konto muss das Repository dafür öffentlich sein. Inhalte und Audio sind damit öffentlich einsehbar; der Lernstand nicht.
- **Abgleich zwischen Geräten**: über ein privates (secret) GitHub Gist in Gunnars Konto. Gunnar legt einmalig ein Token mit nur dem Recht `gist` an und trägt es auf jedem Gerät in den Einstellungen ein; es bleibt nur lokal im Gerät. Abgleich beim Öffnen, nach jeder Runde und per Knopf. Gespeichert wird ein reines Anhängeprotokoll aller Bewertungen (Ereignisse mit eindeutiger ID, Zeitstempel, Gerät). Beim Abgleich werden die Protokolle vereinigt und der Lernstand aus dem Protokoll neu berechnet; dadurch gibt es keine Konflikte. Einstellungen gelten pro Gerät oder werden mit "letzte Änderung gewinnt" abgeglichen (Builder entscheidet). Ohne Token funktioniert alles lokal. Zusätzlich Export und Import als Datei als Sicherung.
- **Oberfläche**: Deutsch. Mobil zuerst, am PC zentrierte Spalte mit Tastaturbedienung (Enter bestätigt, Zifferntasten für Auswahl, Leertaste spielt Ton). Ruhiges, eigenes Design; nicht der typische Claude-Look (keine Pillen, kein Pfirsich-Kasten, kein Orange, kein Kartenraster), keine Emojis, kein "·" als Trenner. Dunkelmodus nach Systemeinstellung.

## Einschränkungen

- Keine laufenden Kosten, keine Schlüssel zur Laufzeit außer dem optionalen Gist-Token.
- Kein Mac verfügbar. Gebaut und getestet wird unter Windows; iOS-Verhalten wird am Ende auf Gunnars iPhone geprüft.
- Zeitrahmen: Die ersten drei Situationen sollen bald nutzbar sein, der volle Inhalt bis spätestens Ende Januar 2027, damit noch Lernzeit bis März bleibt.
- iOS-Eigenheiten, die der Builder beachten muss: Audio erst nach Nutzerinteraktion abspielbar; Speicher einer PWA kann von iOS bei Platzmangel oder nach langer Nichtnutzung geleert werden (deshalb Abgleich und Export wichtig); Spracherkennung im Home-Bildschirm-Modus unsicher.

## Dem Builder überlassen

- Genaue Datenstruktur, Dateiaufteilung, Komponentenschnitt.
- Schwellen für Bewertung (Hard/Good/Easy) und Stufenwechsel, Länge einer Runde im Detail.
- Ob Karten pro Richtung getrennt geplant werden.
- Gestaltung im Detail, solange die Design-Regeln oben eingehalten werden.
- Wie die Deckung von gesprochenem Spanisch geschätzt wird.
- Reihenfolge der Inhalte innerhalb einer Situation.

## Offene Punkte und Claudes Annahmen

- **Öffentliches Repository**: Wegen GitHub Pages im Gratiskonto sind Inhalte und Audio öffentlich. Claudes Annahme: unkritisch, weil keine persönlichen Daten darin stehen. Alternative ohne öffentliches Repository wäre Cloudflare Pages oder Netlify aus einem privaten Repository; Builder darf wechseln, wenn Pages nicht passt.
- **edge-tts Nutzungsbedingungen**: siehe Audio. Claudes Annahme: für ein privates Lernprojekt vertretbar.
- **Lizenzen**: CC BY-SA der Häufigkeitsliste gilt für daraus abgeleitete Listen; das Repository bekommt für Inhalte CC BY-SA 4.0, für Code MIT. `ts-fsrs` Lizenz prüfen.
