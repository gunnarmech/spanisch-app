# Spanisch für Chile, Teil 2: restliche Situationen, echtes chilenisches Hören, volle Einstufung

Stand 26.11.2026. Baut auf der Hauptspec `2026-11-25-spanisch-app-design.md` (Inhalt, Lernablauf, Bauweise) und der Gestaltungs-Spec `2026-11-25-spanisch-app-gestaltung-design.md` (Schrift, Farben, Bausteine) auf. Was dort steht, gilt weiter; hier steht nur, was Teil 2 hinzufügt oder ändert. Ausgangsstand: main = 6857e91, live seit 26.11.2026.

## Absicht und Warum

Gunnar ist im März 2027 in Chile. Teil 1 deckt Grundlagen, Café und Restaurant, Einkaufen und Bezahlen ab und läuft auf iPhone und PC. Für den Alltag dort fehlen noch Unterwegs, Weg fragen, Unterkunft, Smalltalk, Notfall und die chilenische Ebene. Die Hauptspec verlangt außerdem, dass er chilenisches Spanisch auch bei normalem Tempo versteht, und synthetische Stimmen bilden das nur teilweise ab. Deshalb kommen echte chilenische Aufnahmen dazu. Weil er schon angefangen hat, muss der volle Einstufungstest auch nachträglich erreichbar sein und darf seinen Lernstand nicht stören.

Erfolg heißt: Alle neun Situationen der Hauptspec sind in der App, jede mit Ton, Foto und Verständnisanzeige; in seinen Runden tauchen regelmäßig echte chilenische Sätze zum Hören auf; ein Einstufungstest über die 150 häufigsten Einträge ist jederzeit startbar; nichts davon setzt seinen bisherigen Lernstand zurück.

## Ziele

1. Situationen 4 bis 8 als Inhaltsdateien nach dem Muster von Teil 1, mit Audio, Prüfung und Foto.
2. Situation 9, Chile-Ebene: Chilenismen und chilenische Aussprache als eigene Situation.
3. Echte chilenische Aufnahmen als neue Höraufgabe "Chile hören", die nach den Grundlagen in die normalen Runden einfließt.
4. Voller Einstufungstest über die 150 häufigsten Wörter und Wendungen aller Situationen, beim ersten Start angeboten und jederzeit aus den Einstellungen startbar.
5. Audio-Cache so groß, dass alle Situationen offline Platz haben.

## Nicht-Ziele

- Benachrichtigungen. Die Hauptspec nennt sie Kür; auf dem iPhone braucht eine Web-App dafür Web Push mit einem Server, und ein Server ist ausgeschlossen. Entfällt ersatzlos.
- Neue Grundfunktionen (KI, Konten, Statistik), Änderungen an FSRS, Stufenlogik, Abgleich oder Bewertung.
- Neugestaltung. Neue Bildschirmteile werden aus den vorhandenen Bausteinen gebaut.
- Eine Übung, die das chilenische s-Verschlucken mit Wortpaaren drillt. Dafür gibt es kein belegtes echtes Material (siehe Chile hören); die Hauptspec sieht für diesen Fall vor, dass die s-Übung schrumpft.
- Die zurückgestellten Kleinigkeiten aus `docs/superpowers/teil1-offene-punkte.md`, soweit sie unten nicht ausdrücklich genannt sind.

## Anti-Ziele

Alle Anti-Ziele der Hauptspec und der Gestaltungs-Spec gelten. Für Teil 2 besonders:

- Der Einstufungstest oder neue Inhalte verändern oder löschen bestehende Ereignisse, oder markieren Items als bekannt, die er schon lernt.
- Echte Aufnahmen, deren Sätze er überwiegend nicht verstehen kann (dann ist es Rauschen, keine Übung).
- Aussprache über absichtlich falsch geschriebenen Eingabetext für die Stimmen nachbauen ("ehtá").
- Peninsularismen oder Chilenismen ohne Beleg.
- Eine Zahl, die einen Rückstand anzeigt, oder Zähler wie "37 von 150" im Einstufungstest, die nach Prüfung klingen. Ein ruhiger Fortschrittsbalken ist erlaubt.

## Inhalt: Situationen 4 bis 8

Format, Feldnamen, ID-Schema, Prüfskript, Audio-Schlüssel und Prüfliste wie in Teil 1 (Plan Teil 1, Task 13 bis 15). Umfang je Situation: 100 bis 140 Wörter und Wendungen, 40 bis 60 Sätze, 6 Dialoge, 3 bis 5 Grammatik-Häppchen, Hörpaare wo sinnvoll. Wörter, die schon in einer früheren Situation vorkommen, werden nicht neu angelegt, sondern nur in Dialogen benutzt (die Deckungsprüfung kennt alle Situationen). Dialoge bestehen zu mindestens 95 % aus Wörtern dieser und früherer Situationen, wie in Teil 1 geprüft.

Datei, Titel und Schwerpunkte (Claudes Festlegung, nach der Liste der Hauptspec):

- `04-unterwegs.json`, "Unterwegs": Metro, Micro (Stadtbus), Bip!-Karte aufladen ("cargar la Bip"), Taxi, Uber, Colectivo, Fernbus ("bus", "terminal", "pasaje"), Abfahrt und Ankunft, Uhrzeit, "¿A qué hora sale...?", "¿Este bus pasa por...?", "me bajo aquí". Grammatik: ir im Präsens, ir a/en ("voy en metro"), Uhrzeit ("a las ocho y media"), "hay que".
- `05-weg.json`, "Weg fragen": "¿Dónde queda...?", "¿Cómo llego a...?", links, rechts, geradeaus ("todo derecho"), Ecke, Block ("cuadra"), nah und weit, Himmelsrichtungen nur als Wörter, Orientierungspunkte (plaza, esquina, semáforo, cerro). Grammatik: estar für Lage, Wegbeschreibung als feste Formen mit usted ("siga", "doble a la derecha") als Wendungen gelernt, nicht als Imperativlehre, Präpositionen des Ortes (al lado de, enfrente de, cerca de).
- `06-unterkunft.json`, "Unterkunft": Hostel und Airbnb, Reservierung, Check-in und Check-out, Zimmer, Bett, Schlüssel, Dusche und warmes Wasser ("no hay agua caliente"), WLAN und Passwort ("la clave del wifi"), Probleme ("no funciona"), Gepäck aufbewahren, Frühstück. Grammatik: Possessiva (mi, tu, su, nuestro), "no funciona" und funcionar, hacer im Präsens, "¿Se puede...?".
- `07-smalltalk.json`, "Smalltalk": woher, was machst du, wie lange bleibst du, Reisepläne, Wetter, Familie in einfachen Formen, Vorlieben, Komplimente für Chile, sich verabreden, Kontakt austauschen ("¿Tienes WhatsApp?"). Grammatik: gustar (me gusta, me gustan, ¿te gusta?), saber und conocer, ser und estar gemischt geübt, "hace" für Dauer ("hace dos semanas").
- `08-notfall.json`, "Notfall und Gesundheit": Apotheke, Arzt, Schmerzen ("me duele"), Allergien und Medikamente, Notruf (131 Ambulanz, 133 Carabineros, 132 Feuerwehr), Polizei, verloren und gestohlen ("me robaron", "perdí" als feste Formen), Botschaft, Versicherung, Hilfe rufen. Grammatik: doler wie gustar, necesitar, por und para gemischt geübt, Vergangenheitsformen nur als feste Wendungen mit Hinweis.

Fotos: je Situation ein echtes Foto aus Santiago oder Chile von Wikimedia Commons mit freier Lizenz, im Format und Ablauf der vorhandenen drei (160 x 160 webp, Eintrag in `src/ui/photos.ts`, Nachweis in `docs/fotos.md` und auf der Quellenseite).

## Inhalt: Situation 9, Chile-Ebene

`09-chile.json`, Titel "Chile-Ebene". Enthält die häufigsten Chilenismen als Wort- oder Wendungs-Items, jedes mit Feld `chile` (kurze Begründung und Quelle, zum Beispiel DAMER oder ein Wörterbuch der Academia Chilena) und mit Beispielsatz in natürlicher chilenischer Umgangssprache. Kandidaten (Claudes Auswahl, Builder darf nach Beleglage kürzen oder ergänzen): cachai, al tiro, po, fome, bacán, harto, luca, pololo und polola, carrete, taco (Stau), copete, guagua, flaite (nur verstehen), cuático, la raja, pucha, ya po, ¿cómo estái?, weón (nur verstehen, Hinweis zu Ton und Register). Ziel: 40 bis 70 Items, 20 bis 30 Sätze, 4 Dialoge in chilenischer Umgangssprache.

Ein Grammatik-Häppchen "Chilenisch hören" erklärt in 30 bis 60 Sekunden das aspirierte oder verschluckte s, verschluckte Endungen ("pa'" statt "para", "-ao" statt "-ado") und den chilenischen Voseo (estái, querís, cachai), als Verstehen, nicht zum Nachmachen. Ein Grammatik-Häppchen mit Übungen nur dort, wo Gunnar die Form selbst sagen soll (feste Wendungen wie "ya po", "al tiro").

Produktion bleibt neutral: Wo ein Chilenismus eine neutrale Entsprechung hat, steht sie im Hinweis, und Tipp- und Sprechaufgaben fragen nur feste Wendungen ab, die ein Reisender selbst gut sagen kann (Liste im Datensatz durch ein Feld, zum Beispiel `produce: false` für "nur verstehen"; Builder legt den Namen fest). Items mit "nur verstehen" steigen höchstens bis zur Stufe Hören unter Druck, nie bis Tippen oder Sprechen.

Audio für Situation 9 mit den es-CL-Stimmen wie gehabt; Stimmenwahl nur chilenisch (beide Stimmen cl-f und cl-m, kein mx oder co).

Die Situation steht in der Liste an Position 9 und kann wie jede andere gewählt werden. Der automatische Vorschlag der nächsten Situation folgt weiter der Reihenfolge.

## Chile hören: echte Aufnahmen

### Quelle

Die Hauptspec verlangt die Suche nach echten, frei lizenzierten chilenischen Aufnahmen, zuerst in Mozilla Common Voice. Ergebnis der Recherche am 26.11.2026 (Claudes Festlegung):

- **Hauptquelle: OpenSLR SLR71**, "Crowdsourced high-quality Chilean Spanish speech data set" (Google, Guevara-Rukoz u. a., 2020), Lizenz CC BY-SA 4.0, frei ladbar ohne Konto von openslr.org/71. 31 chilenische Sprecherinnen und Sprecher, 4374 gelesene Sätze mit Transkript (`line_index_female.tsv`, `line_index_male.tsv`, Audio als WAV in `es_cl_female.zip` 585 MB und `es_cl_male.zip` 860 MB). Die Sätze sind alltagsnah, teils mit Chilenismen ("al tiro").
- Common Voice Spanisch wird nicht verwendet: nur als Gesamtdatensatz über ein Konto bei der Mozilla Data Collective erhältlich, die Akzentangabe ist freiwillig und für Chile dünn besetzt, und SLR71 deckt den Zweck vollständig ab.
- Grenze, die Gunnar kennen soll: SLR71 ist vorgelesene Sprache. Das Tempo ist normal und der Akzent echt chilenisch, aber die Aussprache ist sorgfältiger als im Gespräch auf der Straße. Ein Ersatz für gesprochene Umgangssprache ist es nicht; es ist deutlich näher dran als die synthetischen Stimmen.

### Auswahl

Ein Skript (Bauzeit, nicht in der App) wählt aus den 4374 Sätzen die verständlichen aus:

- Der Satz besteht zu mindestens 85 % aus Formen, die in den `forms` der Wort-Items aller Situationen vorkommen (gleiche Normalisierung wie die Deckungsprüfung der Dialoge). Unbekannte Eigennamen zählen nicht gegen den Satz.
- 3 bis 16 Wörter lang.
- Kein Satz doppelt (gleicher Text von zwei Sprechern: eine Fassung behalten, abwechselnd Frau und Mann).
- Ziel 150 bis 250 Sätze; werden es weniger, gilt was belegt ist, ohne die Schwelle zu senken.

Jeder gewählte Satz bekommt eine deutsche Übersetzung, geschrieben von Claude und mit derselben Prüfliste geprüft wie die übrigen Inhalte (Übersetzung korrekt, Chilenismen erklärt). Sätze mit Inhalten, die in einer Lern-App befremden (Gewalt, Politik, Intimes), werden aussortiert.

### Ablage und Format

- Auswahl und Übersetzungen als eigene Inhaltsdatei (zum Beispiel `content/chile-hoeren.json`), mit stabiler ID je Satz (abgeleitet aus der SLR71-Datei-ID), Text, Übersetzung, Sprechergeschlecht und Herkunftsdatei. Builder entscheidet, ob es eine eigene Datei oder ein eigener Item-Typ in `09-chile.json` wird; die Deckungs- und Strukturprüfung (`npm run check:content`) deckt es in jedem Fall ab.
- Audio als mp3, mono, lautheitsnormalisiert, Anfang und Ende von Stille befreit, unter `public/audio/chile-echt/` mit eigenem `manifest.json` im Format der übrigen Manifeste. Umwandlung mit ffmpeg (auf dem Rechner nicht installiert; Builder holt es ohne Adminrechte, zum Beispiel über das Python-Paket `imageio-ffmpeg`).
- Die WAV-Archive werden nur lokal entpackt und nie ins Repository gelegt.
- Lizenznachweis: SLR71 mit Titel, Autoren, Link und Lizenz CC BY-SA 4.0 auf der Quellenseite und in der README, Hinweis "gekürzt, normalisiert und in mp3 umgewandelt".

### Aufgabe in der Runde

- Neue Aufgabenform "Chile hören": Gunnar hört den Satz in Originalgeschwindigkeit ohne Text, wählt aus drei deutschen Bedeutungen (Ablenker sind Übersetzungen anderer gewählter Sätze ähnlicher Länge), sieht danach Text und Übersetzung und kann den Satz erneut hören. Eine langsame Fassung gibt es nicht (Originalaufnahme).
- Freischaltung: sobald seine Verständnisanzeige für Grundlagen mindestens 50 % zeigt.
- Je Runde höchstens eine Höraufgabe, wie die Hauptspec sagt: Dialog oder Chile hören. Sind beide möglich, wechseln sie sich ab (Builder legt fest, woran die Abwechslung hängt, zum Beispiel an der Zahl der gehörten Ereignisse).
- Gewählt wird ein noch nicht gehörter Satz, dessen Wörter er zu einem möglichst hohen Anteil sicher kennt (gleiches Maß wie bei der Dialogauswahl), mindestens 85 %. Sind alle gehört, kommen gehörte Sätze in der Reihenfolge des längsten Abstands wieder.
- Ergebnis wird als Ereignis gespeichert wie ein gehörter Dialog (kein FSRS-Kartenzustand), damit Abgleich und Neuberechnung unverändert funktionieren. Eine falsche Wahl wird nur festgehalten, nicht bestraft.
- Ohne Ton (Datei fehlt, offline nicht im Cache) wird die Aufgabe übersprungen, nicht mit Text ersetzt.

## Voller Einstufungstest

- Umfang: die 150 häufigsten Wort- und Wendungs-Items aller Situationen nach `freqRank`, ohne Items der Chile-Ebene und ohne "nur verstehen"-Items, Items ohne `freqRank` danach in Situations- und Dateireihenfolge (wie die vorhandene Sortierung).
- Ablauf: wie der vorhandene kurze Test (Hören, Auswahl, richtig und unter 4 Sekunden heißt bekannt), aber in Blöcken zu 30. Nach jedem Block die Wahl "weiter" oder "aufhören". Hat er in einem Block weniger als ein Viertel richtig, endet der Test von selbst mit einem freundlichen Satz, weil der Rest ihn nur langweilen würde.
- Nur Items ohne jedes Ereignis kommen in den Test und können als bekannt markiert werden. Was er schon lernt oder schon als bekannt markiert hat, wird übersprungen.
- Erreichbar: beim allerersten Start wie bisher als Angebot, und jederzeit in den Einstellungen als "Einstufung machen" (auch wenn er sie früher übersprungen oder den kurzen Test gemacht hat).
- Abbruch jederzeit; was bis dahin beantwortet ist, bleibt.
- Fortschritt als ruhiger Balken je Block, keine Zählerzahl.

## Audio-Cache und Vorabruf

- `maxEntries` des Audio-Caches so anheben, dass alle Dateien aller Situationen plus die echten Aufnahmen mit Reserve hineinpassen. Ein Test zählt die Dateien in allen Manifesten und schlägt fehl, wenn sie mehr als 80 % des Grenzwerts belegen.
- Vorabruf bleibt je Situation (keine Gesamtmenge auf einmal, wegen des iOS-Speichers). Die echten Aufnahmen werden vorab geladen, sobald die Höraufgabe freigeschaltet ist.

## Gestaltung

Jede sichtbare Änderung (neue Aufgabenform, Einstufung in Blöcken, Einstellungen, sechs neue Situationszeilen mit Foto, Quellenseite) wird mit dem Taste-Skill gebaut und geprüft (`C:\Users\gunna\.claude\skills\design-taste-frontend`, Prüfordner `.taste-skill/root/spanisch-app/`), aus den vorhandenen Bausteinen der Gestaltungs-Spec. Screenshots bei 390 und 1440 px in hell und dunkel, nur im Scratch-Ordner, nie im Repository.

## Prüfung der Inhalte

Wie in der Hauptspec: Jede Inhaltsdatei (fünf Situationen, Chile-Ebene, Übersetzungen der echten Aufnahmen) bekommt eine eigene Review-Runde mit der festen Prüfliste: Peninsularismen, natürlicher Gebrauch in Chile, Übersetzung korrekt, Chilenismen mit Beleg, Dialoge aus eingeführten Wörtern.

## Einschränkungen

- Alle Einschränkungen der Hauptspec (keine Kosten, kein Server, offline, Windows als Bauumgebung, iOS-Eigenheiten).
- Bestehende IDs in den Situationen 1 bis 3 bleiben unverändert. Neue IDs sind über alle Situationen eindeutig.
- Das Repository wächst um etwa 25 MB Audio je Situation; GitHub Pages trägt das (Grenze 1 GB je Seite). Die echten Aufnahmen kommen in mp3 auf geschätzt 10 bis 20 MB.
- Inhalte werden situationsweise fertig und können einzeln ausgeliefert werden.

## Dem Builder überlassen

- Dateischnitt und Datentyp der echten Aufnahmen, Feldname für "nur verstehen".
- Wie die Abwechslung Dialog und Chile hören festgelegt wird.
- Reihenfolge der Inhalte innerhalb einer Situation, genaue Item-Auswahl im Rahmen der Schwerpunkte.
- Ob die Einstufung in den Einstellungen dieselbe Komponente wie das Startangebot nutzt.
- Wahl der Fotos im Rahmen der Lizenzregeln.

## Offene Punkte und Claudes Annahmen

- Annahme: Gunnar will die Chile-Ebene als eigene Situation am Ende der Liste, nicht vor Unterwegs; die echten Aufnahmen fließen ohnehin ab 50 % Grundlagen in die Runden.
- Annahme: 150 Einträge im Einstufungstest (Mitte der Spanne 100 bis 200 der Hauptspec).
- Annahme: Übersetzungen der SLR71-Sätze durch Claude mit Modell-Review genügen, wie bei den übrigen Inhalten.

## Entscheidungen nach dem Builder Check (Claudes Festlegung)

- **Einstufung füllt auf.** Der Test nimmt die 150 häufigsten Wort- und Wendungs-Items, die noch kein Ereignis haben (ohne Chile-Ebene und ohne "nur verstehen"), also nicht eine feste Liste, aus der Bekanntes herausfällt. Weil Gunnar die Situationen 1 bis 3 schon lernt, besteht der Test für ihn vor allem aus Wörtern der Situationen 4 bis 8. Gibt es weniger als 150 solche Items, wird der Test entsprechend kürzer; gibt es keine, zeigen Einstellungen und Startangebot statt des Knopfs einen kurzen Satz, dass es nichts einzustufen gibt.
- **Chile hören, Maß zur Laufzeit.** Es gilt dasselbe Maß wie bei der Dialogauswahl (`seenShare`: Anteil der Wörter, deren Wort-Item überhaupt einen Lernstand hat) mit derselben Schwelle 80 %. Die 85 % gelten nur bei der Auswahl zur Bauzeit gegen den Wortschatz aller Situationen. Es gibt keine Rückfallregel: Erreicht kein Satz 80 %, gibt es in dieser Runde keine Chile-Höraufgabe. Dass die Aufgabe nach der Freischaltung erst nach und nach auftaucht, ist gewollt (verständlicher Input). Vorabruf der echten Aufnahmen, sobald die Freischaltung erreicht ist.
- **"Nur verstehen" ändert nur die Aufgabenform, nicht die Stufenlogik.** Die Stufen laufen in `replay` unverändert. Beim Zusammenstellen der Runde wird für Items mit "nur verstehen" Stufe 2 (Tippen) als Hören zu Bedeutung und Stufe 3 (Sprechen) als Hören unter Druck gestellt. Das Feld darf an Wort-, Wendungs- und Satz-Items stehen; Dialoge sind ohnehin keine Karten.
- **"Chilenisch hören" bekommt Übungen.** Grammatik-Items brauchen Übungen, sonst entstehen keine Karten. Das Häppchen erklärt die chilenische Aussprache und übt sie als Verstehen: Übungen zeigen eine chilenische Form mit Kontext und verlangen die neutrale Standardform ("pa' la casa" ergibt "para la casa", "¿cómo estái?" ergibt "¿cómo estás?"). Die Inhaltsprüfung lehnt künftig Grammatik-Items ohne Übung ab.
