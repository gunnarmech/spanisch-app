# Chile hören: Herkunft, Lizenz, Bearbeitung

`chile-hoeren.json` enthält 228 echte chilenische Sätze mit deutscher Übersetzung. Die Aufnahmen liegen unter `public/audio/chile-echt/`.

## Quelle

- Titel: Crowdsourced high-quality Chilean Spanish speech data set (OpenSLR SLR71)
- Autoren: Adriana Guevara-Rukoz, Isin Demirsahin, Fei He, Shan-Hui Cathy Chu, Supheakmungkol Sarin, Knot Pipatsrisawat, Alexander Gutkin, Alena Butryna, Oddur Kjartansson (Google), 2020
- Link: https://www.openslr.org/71/
- Lizenz: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/
- Zitat: Guevara-Rukoz, A. u. a. (2020): Crowdsourcing Latin American Spanish for Low-Resource Text-to-Speech. Proceedings of the 12th Language Resources and Evaluation Conference (LREC), Marseille, S. 6504 bis 6513. https://www.aclweb.org/anthology/2020.lrec-1.801

## Bearbeitung

- Die Aufnahmen sind gekürzt (Stille am Anfang und Ende entfernt), lautheitsnormalisiert und in mp3 (mono, 64 kbit/s, 24 kHz) umgewandelt. Inhaltlich sind sie nicht verändert.
- Auswahl: `npm run select:clips -- <slr71-ordner> <ausgabedatei>` liefert die Kandidaten (mindestens 85 % bekannte Wortformen, 3 bis 16 Wörter, gleiche Texte nur einmal, abwechselnd Frau und Mann). Aus den Kandidaten sind die alltagstauglichen ausgewählt; Gewalt, Politik, Intimes, Werbung und Behördensprache sind aussortiert.
- Die Texte folgen dem Transkript von SLR71. Fehlende Akzente, Fragezeichen und Kommas sind ergänzt, Leerzeichen vor Satzzeichen entfernt. Die deutschen Übersetzungen stammen von Claude.
- Umwandlung: `python scripts/clips_audio.py --slr71 <ordner> [--only-missing]` (ffmpeg über `imageio-ffmpeg`).
- Die WAV-Archive werden nur lokal entpackt und liegen nie im Repository.

## Weitergabe

Wegen CC BY-SA 4.0 stehen die Aufnahmen und dieser Nachweis unter derselben Lizenz. Jeder Eintrag in `chile-hoeren.json` nennt in `source` die Originaldatei bei SLR71.
