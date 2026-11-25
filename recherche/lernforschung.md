# Lernforschung für eine kostenlose Spanisch-App (lateinamerikanisches Spanisch)

Stand der Recherche: 25.11.2026. Alle Texte auf Deutsch, ohne Gedankenstriche.

## Lesehinweise und Prüfstufen

Jede Quelle trägt eine Nummer (Q1 bis Q71) und eine Prüfstufe. Die Stufe sagt, wie gründlich ich die Angabe tatsächlich geprüft habe.

- **Stufe A**: Seite, Abstract oder PDF in dieser Sitzung selbst abgerufen und gelesen (Zahlen stammen aus dem Text).
- **Stufe B**: Bibliografische Angaben und Kernbefund durch Websuche bestätigt (Abstract-Auszüge, Verlags- oder Repositoriumsseiten). Zahlen im Volltext nicht nachgeprüft.
- **Stufe C**: Nur Sekundärquelle, Konferenzbeitrag, Preprint, Blog oder unsichere Angabe. Vor Verwendung im Produkt oder in Texten nachprüfen.

Status je Befund: **gesichert** (mehrere Meta-Analysen oder breite Replikation), **überwiegend gestützt**, **umstritten**, **dünn** (wenige oder schwache Studien).

Effektgrößen: d = Cohens d, g = Hedges g. Für die Sprachforschung gilt: Cohens Schwellen (0,2 / 0,5 / 0,8) sind hier zu streng bewertet. Plonsky und Oswald (Q41) zeigen, dass typische Effekte in der L2-Forschung größer ausfallen. Die konkreten Feldschwellen habe ich nicht im Volltext geprüft.

Was ich nicht gefunden oder nicht geprüft habe, steht am Ende (Abschnitt "Lücken").

---

## 1. Spaced Repetition und verteiltes Üben

**Gesamtstatus: gesichert.** Der Spacing-Effekt ist einer der robustesten Befunde der Gedächtnisforschung. Weniger klar ist, wie groß der ideale Abstand ist und ob wachsende Abstände besser sind als gleich lange.

**Q1** Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354-380. PubMed: https://pubmed.ncbi.nlm.nih.gov/16719566/ (Stufe B)
Kernbefund: Meta-Analyse über 839 Messungen aus 317 Experimenten in 184 Artikeln. Der beste Abstand zwischen Lernsitzungen wächst mit dem Zeitraum, nach dem man sich erinnern will.
Konsequenz für die App: Abstände nicht fest, sondern abhängig vom gewünschten Behaltenszeitraum planen.

**Q2** Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*(11), 1095-1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x (Stufe B)
Kernbefund: Mehr als 1350 Personen, Abstände bis 3,5 Monate, Test bis ein Jahr später. Umgekehrt-U-Kurve: zu kurze und zu lange Abstände schaden. Der optimale Abstand beträgt grob 20 bis 40 % der Behaltensdauer bei einer Woche, aber nur 5 bis 10 % bei einem Jahr.
Konsequenz: Ein Scheduler sollte Intervalle mit der Zeit relativ kürzer wachsen lassen, nicht beliebig explodieren.

**Q3** Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269-319. Katalogeintrag: https://eld.bl.uk/catalog/100152978253_0x000001 (Stufe B)
Kernbefund: Spacing wirkt auf L2-Lernen mittel bis groß. Kürzere und längere Abstände waren im Sofort-Test gleich gut, längere Abstände waren im verzögerten Test besser. Gleich lange und wachsende Abstände unterschieden sich nicht. Moderatoren: Lernziel, Zahl der Sitzungen, Übungsart, Zeitpunkt des Feedbacks. Zahl der Studien unklar: Serrano (Q4) nennt 37 Studien, andere Quellen 48 Experimente mit 98 Effektstärken (N = 3411). Beim Zitieren nachprüfen.
Konsequenz: Spacing für Wortschatz und Grammatik einsetzen. Die Wahl "wachsend" gegenüber "gleich lang" ist zweitrangig.

**Q4** Serrano, R. (2022). A state-of-the-art review of distribution-of-practice effects on L2 learning. *Studies in Second Language Learning and Teaching, 12*(3), 355-379. https://doi.org/10.14746/ssllt.2022.12.3.2 (Stufe A, Volltext gelesen)
Kernbefund: Narrativer Überblick über 47 Studien. Der Spacing-Effekt ist robust, der Lag-Effekt (längere Abstände besser) weniger konsistent (Verweis auf Toppino und Gerbier). Behandelt auch Blocked versus Interleaved in L2.
Konsequenz: Nicht auf einen "magischen" Abstand setzen, sondern Verteilung grundsätzlich erzwingen.

**Q5** Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *Proceedings of ACL 2016*, 1848-1858. https://doi.org/10.18653/v1/P16-1174 (Stufe B)
Kernbefund: Half-Life Regression (HLR) schätzt die "Halbwertszeit" eines Wortes im Gedächtnis aus Duolingo-Daten (etwa 13 Mio. Lernspuren, Code MIT-lizenziert, Daten frei). Laut Abstract (nur aus Zweitquelle, nicht geprüft) etwa 45 % weniger Vorhersagefehler als Baselines und 12 % mehr Tagesengagement im Feldversuch. Duolingo-eigene Studie.
Konsequenz: Datenbasiertes Intervallmodell ist machbar, offene Daten und Code erlauben Offline-Tests.

**Q6** Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *Proceedings of KDD 2022*, 4381-4390. https://dblp1.uni-trier.de/rec/conf/kdd/YeSC22.html (Stufe B)
Kernbefund: Scheduler minimiert Wiederholungsaufwand; laut Abstract 12,6 % besser als der Stand der Technik, im Einsatz bei MaiMemo (Vokabel-App). Grundlage des später quelloffenen FSRS-Schedulers, der seit Anki 23.10 integriert ist (laut Zweitquellen).
Konsequenz: FSRS-artige Modelle als Scheduler nehmen.

**Q7** open-spaced-repetition (laufend). srs-benchmark (GitHub). https://github.com/open-spaced-repetition/srs-benchmark (Stufe A, Seite gelesen; Community-Benchmark, nicht peer reviewed)
Kernbefund: Vergleich vieler Gedächtnismodelle auf echten Anki-Wiederholungsprotokollen von etwa 10 000 Nutzern. Die FSRS-Versionen verbessern sich Version für Version (Log Loss ohne Same-Day-Reviews: v1 0,4913, v4 0,3726, v6 0,3460), Neuronale Modelle (RWKV) sind genauer. SM-2 taucht auf der Seite nicht mit Ergebnissen auf, ein direkter Vergleich FSRS gegen SM-2 ist dort also nicht belegt. Die Datensatzgröße wird auf der Seite widersprüchlich angegeben.
Konsequenz: FSRS ist empirisch gut getestet, aber das Kernargument "FSRS schlägt SM-2" muss ich aus anderer Quelle belegen (offen).

**Q8** Woźniak, P. (1990). Beschreibung des Algorithmus SM-2 (SuperMemo). https://www-v1.supermemo.com/archives1990-2015/english/ol/sm2 (Stufe B)
Kernbefund: Erste Intervalle 1 und 6 Tage, danach Intervall mal Easiness-Faktor (Start 2,5, Untergrenze 1,3), Bewertung 0 bis 5. Einfach, aber ohne empirischen Beleg in dieser Quelle.
Konsequenz: SM-2 ist als Fallback implementierbar, der Nachweis der Überlegenheit liegt bei neueren Modellen (Q5 bis Q7).

---

## 2. Abrufpraxis und Testing-Effekt

**Gesamtstatus: gesichert.** Abruf schlägt Wiederlesen bei verzögerten Tests. Umstritten ist die Rolle des Feedbacks, das Ausmaß bei komplexem Stoff und einzelne Interpretationen (etwa der Swahili-Versuch von 2008).

**Q10** Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249-255. https://pubmed.ncbi.nlm.nih.gov/16507066/ (Stufe B)
Kernbefund: Nach 5 Minuten war Wiederlesen besser, nach 2 Tagen und 1 Woche war Abruf deutlich besser. Wiederleser fühlten sich sicherer, behielten aber weniger.
Konsequenz: Abruf statt Wiederlesen, auch wenn Lernende das Gegenteil bevorzugen.

**Q11** Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science, 319*(5865), 966-968. (Stufe B)
Kernbefund: Mit 40 Swahili-Englisch-Paaren brachte weiteres Studieren nach erfolgreichem Abruf keinen messbaren Zusatz, wiederholter Abruf schon. Status: umstritten in der Auslegung. Replikationen mit demselben Material (Soderstrom et al., UCLA, https://sites.lifesci.ucla.edu/psych-bjorklab/wp-content/uploads/sites/13/2016/11/soderstorm_kerr.pdf, Stufe C) prüfen, ob die scheinbare Wirkungslosigkeit von Wiederholungsstudium an der Spacing-Konstruktion des Originals lag.
Konsequenz: Nicht "gelernte" Wörter aus dem Plan entfernen, sondern Abstände wachsen lassen.

**Q12** Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin, 140*(6), 1432-1463. https://doi.org/10.1037/a0037559 (Stufe B)
Kernbefund: Meta-Analyse, Abruf übertrifft Wiederstudium, Recall-Tests stärker als Wiedererkennung. Eine Zweitquelle nennt 61 Studien und d etwa 0,50 (nicht am Original geprüft).
Konsequenz: Übungen als freies Abrufen (Tippen, Sprechen) gestalten statt als reines Erkennen.

**Q13** Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research, 87*(3), 659-701. https://doi.org/10.3102/0034654316689306 (Stufe B)
Kernbefund: Übungstests schlagen Wiederstudium und jede andere Vergleichsbedingung. Zweitquelle nennt g etwa 0,70 (nicht geprüft). Größte Effekte bei 1 bis 6 Tagen Abstand zwischen Übungstest und Endtest, Feedback ohne signifikanten Zusatznutzen (Zusammenfassung, nicht im Volltext geprüft).
Konsequenz: Kurzer Abrufversuch zuerst, Feedback danach.

**Q14** Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. *Psychological Science in the Public Interest, 14*(1), 4-58. https://doi.org/10.1177/1529100612453266 (Stufe B)
Kernbefund: Zehn Techniken bewertet. Höchste Nützlichkeit: Übungstests und verteiltes Üben (hoch). Niedrig: Zusammenfassen, Markieren, Keyword-Mnemonik, Imagery für Texte, Wiederlesen. Interleaving als "mittel". Effekte helfen vor allem motivierten, fähigen Lernenden.
Konsequenz: Funktionen entsprechend priorisieren: Abruf und Spacing zuerst, Mnemonik und Markieren nicht als Kern.

---

## 3. Interleaving und "desirable difficulties"

**Gesamtstatus: überwiegend gestützt, mit klaren Grenzen.** Interleaving hilft vor allem beim Unterscheiden ähnlicher Kategorien (Konzepte, Mathematik, Malstile). Bei Wortlisten und Fließtexten ist der Nutzen unklar oder negativ.

**Q15** Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science*. https://pubmed.ncbi.nlm.nih.gov/18578849/ (Stufe B)
Kernbefund: Gemischte Darbietung von Malern schlug geblockte Darbietung bei der Kategorisierung neuer Bilder, obwohl Teilnehmer Blocking für besser hielten.
Konsequenz: Verwechselbare Muster (ser/estar, por/para, Zeiten) gemischt üben.

**Q16** Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029-1052. https://doi.org/10.1037/bul0000209 (Stufe B)
Kernbefund: 59 Studien, 238 Effektstärken. Gesamt g etwa 0,42 (Zweitquelle), hohe Heterogenität. Effekt stärker bei hoher Ähnlichkeit zwischen und niedriger Ähnlichkeit innerhalb der Kategorien. Vorsicht bei Texten und Wörtern.
Konsequenz: Interleaving für Grammatik und Kategorien, nicht für Vokabelkarten.

**Q17** Rohrer, D., Dedrick, R. F., & Stershic, S. (2015). Interleaved practice improves mathematics learning. *Journal of Educational Psychology, 107*, 900-908. (Stufe B, Fundstelle über IES-Förderseite, Cohens d etwa 0,42 sofort und 0,79 nach 30 Tagen laut Abstract)
Dazu: Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. *Journal of Educational Psychology, 112*, 40-52. (Stufe B)
Kernbefund: Interleaving schlug Blocking, auch in einer randomisierten Schulstudie (54 Klassen). Mathematik, nicht Sprache.
Konsequenz: Übertragbarkeit auf Grammatik plausibel, aber nicht direkt belegt.

**Q18** Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In M. A. Gernsbacher et al. (Hrsg.), *Psychology and the Real World* (S. 56-64). PDF: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf (Stufe B)
Kernbefund: Erwünschte Schwierigkeiten (Spacing, Interleaving, Testen, Variation) verlangsamen die Leistung beim Lernen, fördern aber Behalten. Nur "erwünscht", wenn Lernende sie bewältigen können. Mechanismen noch diskutiert.
Konsequenz: Schwierigkeit steuern, nicht maximieren; Erfolgsquote im Blick halten.

---

## 4. Comprehensible Input, Output, Interaktion

**Gesamtstatus: umstritten in der Theorie, aber praktisch weitgehend Konsens:** Input ist notwendig, reicht allein nicht für Genauigkeit, Output und Interaktion mit Feedback ergänzen.

**Q19** Nguyen, & Doan (2025). Kritik an Krashens Comprehensible-Input-Hypothese aus neurolinguistischer und ökologischer Sicht. *Frontiers in Psychology*. https://doi.org/10.3389/fpsyg.2025.1636777 (Stufe C: Autorenvornamen und Titel aus Suchauszug, nicht geprüft)
Dazu die klassischen Kritiken: McLaughlin (1987) zur Unschärfe von "i+1", Gregg (1984, *Applied Linguistics*). Beide nur über Sekundärquellen gesehen (Stufe C).
Kernbefund: Krashens Input-Hypothese gilt als zu vage (was ist "Niveau", was "i+1") und überzogen. Eine zusätzliche Krashen-Primärquelle habe ich nicht geöffnet.
Konsequenz: Input als Basis, nicht als einziges Mittel.

**Q20** Swain, M., & Lapkin, S. (1995). Problems in output and the cognitive processes they generate: A step towards second language learning. *Applied Linguistics, 16*, 371-391. (Stufe C: Zitat bestätigt, Studie selbst nicht gelesen)
Dazu: Swain (1985) Output-Hypothese als Antwort auf Krashen.
Kernbefund: Output löst Bemerken von Lücken aus (Noticing), Hypothesentesten, reflektierende Funktion. Empirisch gemischt.
Konsequenz: Erzwungenes Sprechen und Schreiben einplanen, aber nicht als Wunderwaffe behandeln.

**Q21** Long, M. H. (1996). The role of the linguistic environment in second language acquisition. In W. C. Ritchie & T. K. Bhatia (Hrsg.), *Handbook of Second Language Acquisition*. (Stufe C: nur über Zweitquellen belegt)
Kernbefund: Interaktionshypothese: Bedeutungsaushandlung und negatives Feedback lenken die Aufmerksamkeit auf problematische Formen.
Konsequenz: Rückfragen und Klärungsschleifen im Dialog (auch mit KI) sind sinnvoll, wenn sie auf die Form lenken.

**Q22** Mackey, A., & Goo, J. (2007). Interaction research in SLA: A meta-analysis and research synthesis. In A. Mackey (Hrsg.), *Conversational Interaction in Second Language Acquisition*. OUP. https://eprints.lancs.ac.uk/id/eprint/59863/ (Stufe B)
Kernbefund: Interaktion fördert Wortschatz und Grammatik, mittlere bis große Effekte (Zweitquelle: Feedback d 0,71 sofort, 1,09 verzögert; Studienzahl 26 oder 28 je nach Quelle). Laboreffekte größer als Klassenzimmereffekte.
Konsequenz: Realistische Erwartung: Effekte im Alltag kleiner als im Labor.

**Q23** Spada, N. (1997). Form-focussed instruction and second language acquisition: A review of classroom and laboratory research. *Language Teaching*. https://www.cambridge.org/core/product/9E8079880B5DDA83C9ECC8F2E74D28B1 (Stufe B)
Dazu: Lightbown & Spada zur kanadischen Französisch-Immersion: reine kommunikative Praxis führte nicht automatisch zu grammatischer Genauigkeit (Stufe C, Sekundärstelle).
Kernbefund: Formfokus im kommunikativen Unterricht bringt Gewinn bei Genauigkeit.
Konsequenz: Nur Inputflut reicht nicht, kurze Formfokus-Elemente einbauen.

---

## 5. Extensive Reading, Hören, Wortschatzschwellen

**Gesamtstatus: überwiegend gestützt.** Viel Lesen und Hören hilft. Die Deckungsschwelle (95 oder 98 %) ist umstritten, die Ergebnisse sind linear statt schwellenförmig. Die Größenangaben stammen fast alle aus dem Englischen.

**Q24** Nation, I. S. P. (2006). How large a vocabulary is needed for reading and listening? *Canadian Modern Language Review, 63*(1), 59-82. https://doi.org/10.3138/cmlr.63.1.59 (Stufe B)
Kernbefund: Für 98 % Deckung braucht man etwa 8000 bis 9000 Wortfamilien (geschriebene Texte), etwa 6000 bis 7000 (gesprochene Texte). Englisch, BNC-Listen.
Konsequenz: Frequenzstufen und Deckungsgrad als Steuergröße benutzen, aber nicht auf Spanisch übertragen, ohne zu prüfen (siehe Q27).

**Q25** Schmitt, N., Jiang, X., & Grabe, W. (2011). The percentage of words known in a text and reading comprehension. *Modern Language Journal, 95*(1), 26-43. https://www.lextutor.ca/cover/papers/schmitt_etal_2011.pdf (Stufe A, PDF gelesen)
Kernbefund: 661 Teilnehmende aus 8 Ländern. Das Verständnis steigt etwa linear mit dem Anteil bekannter Wörter, es gibt keine Schwelle. 98 % ist ein vernünftiges Ziel für akademische Texte. Selbst bei 98 bis 100 % Deckung nicht 100 % Verständnis. Bei geringer Deckung etwa 50 %.
Konsequenz: Texte mit 95 bis 98 % bekannten Wörtern ansteuern, Hilfen (Glossen, Audio) bei niedriger Deckung.

**Q26** Schmitt, N., Cobb, T., Horst, M., et al. Replikation: How much vocabulary is needed to use English? Replication of van Zeeland & Schmitt (2012), Nation (2006) and Cobb (2007). *Language Teaching* (Jahr laut Quellen zwischen 2015 und 2017, nicht verifiziert). https://www.cambridge.org/core/journals/language-teaching/article/how-much-vocabulary-is-needed-to-use-english-replication-of-van-zeeland-schmitt-2012-nation-2006-and-cobb-2007/1D217A56A2E0056E67802A6A8360FDDE (Stufe B)
Kernbefund: Fürs Hören reichen laut van Zeeland & Schmitt unter Umständen 95 % Deckung, was etwa 2000 bis 3000 Wortfamilien entspräche. Umstritten.
Konsequenz: Für Hörverständnis in der App niedrigere Deckung zulassen.

**Q27** Davies, M. (um 2005). Vocabulary range and text coverage: Insights from the forthcoming Routledge Frequency Dictionary of Spanish. BYU. https://www.mark-davies.org/articles/davies_26.pdf (Stufe A, PDF gelesen, Erscheinungsort nicht verifiziert, Seiten 107 bis 113 eines Sammelbands)
Kernbefund (Spanisch): Die ersten 1000 Lemmata decken 76,0 % (Sachtexte), 79,6 % (Fiktion), 87,8 % (gesprochen) der Wörter. Die ersten 3000 decken 88,2 %, 89,6 %, 94,0 %. Abnehmender Grenznutzen: zweites Tausend nur 5 bis 8 % mehr, drittes 2 bis 4 %. Zählung nach Lemmata, nicht nach Wortfamilien, also nicht direkt mit Nation vergleichbar. Das Korpus ist die frühe Version (1900er, Spanien und Lateinamerika gemischt).
Konsequenz: Die ersten 1000 bis 3000 Lemmata bringen den größten Nutzen, besonders fürs Gesprochene.

**Q28** Webb, S., & Rodgers, M. P. H. (2009). The vocabulary demands of television programs. *Language Learning, 59*(2), 335-366. (Stufe B)
Kernbefund: 88 Fernsehprogramme (264 384 laufende Wörter). Genre ist der wichtigste Faktor für Wortschatzanforderung. Programme derselben Untergattung hintereinander sehen erleichtert das Lernen. Englisch.
Konsequenz: Hörtexte nach Genre und Thema bündeln, damit sich Wörter wiederholen.

**Q29** Nakanishi, T. (2015). A meta-analysis of extensive reading research. *TESOL Quarterly, 49*(1). https://doi.org/10.1002/tesq.157 (Stufe B)
Kernbefund: 34 Studien, N = 3942. d = 0,46 (Gruppenvergleich), d = 0,71 (Vorher-nachher). Alter und Dauer ohne signifikanten Unterschied. Kritik an der Auswahl (siehe Q30).
Konsequenz: Extensives Lesen als festen Bestandteil anbieten.

**Q30** Jeon, E.-Y., & Day, R. R. (2016). The effectiveness of ER on reading proficiency: A meta-analysis. *Reading in a Foreign Language, 28*(2), 246-265. (Stufe B, Gesamtwert nicht gelesen)
Kernbefund: Engere Auswahl nur mit echten ER-Programmen (selbst gewählte Bücher). Gesamtgröße nicht geprüft.
Konsequenz: Auswahlfreiheit (Autonomie) ist Teil der ER-Definition.

**Q31** Nation, I. S. P. (2017). How vocabulary is learned. *Indonesian Journal of English Language Teaching, 12*(1). https://ejournal.atmajaya.ac.id/index.php/ijelt/article/view/1458 (Stufe B; Autorenschaft laut Quellen unklar, teils Webb & Nation)
Kernbefund: Wortlernen braucht Wiederholung und qualitativ gute geistige Verarbeitung der Begegnungen. Spacing ist der entscheidende Faktor bei der Wiederholung.
Konsequenz: Mehrfache, verteilte, tiefe Begegnungen mit jedem Wort planen.

**Q32** Webb, S., Yanagisawa, A., & Uchihara, T. (2020). How effective are intentional vocabulary-learning activities? A meta-analysis. *Modern Language Journal, 104*(4). https://doi.org/10.1111/modl.12671 (Stufe B)
Kernbefund: 22 Studien, 100 Effektstärken (Karteikarten, Wortlisten, Schreiben, Lückentext). Karteikarten bringen relativ große Gewinne gegenüber Wortlisten (Zweitquelle). Einzelzahlen nicht geprüft.
Konsequenz: Karteikartenmodus (mit Abruf) bleibt ein starkes Werkzeug neben Kontext.

**Q33** Webb, S., Uchihara, T., & Yanagisawa, A. (ca. 2022/2023). Meta-Analyse zum beiläufigen Wortschatzlernen: 24 Primärstudien, 29 Effektstärken, N = 2771. (Stufe C, nur Suchauszug, Zeitschrift nicht verifiziert)
Kernbefund: Beiläufiges Lernen bringt kleine Gewinne im Vergleich zu absichtlichem Lernen.
Konsequenz: Nur Lesen und Hören reicht fürs Wortlernen nicht, gezielte Wiederholung ergänzen.

**Q34** Hulstijn, J. H., & Laufer, B. (2001). Some empirical evidence for the involvement load hypothesis in vocabulary acquisition. *Language Learning, 51*(4), 539-558 (Stufe C: nur über Sekundärquellen). Dazu Yanagisawa, A., & Webb, S. (SSLA, online 2021, "Involvement load hypothesis plus": https://www.cambridge.org/core/services/aop-cambridge-core/content/view/5C5984B326F37FBF3A3DDA3C0EB2996C/S0272263121000577a.pdf/involvement-load-hypothesis-plus-creating-an-improved-predictive-model-of-incidental-vocabulary-learning.pdf, Stufe B) und ein systematischer Review: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9598591/ (Stufe B)
Kernbefund: Mehr "Beteiligung" (Bedarf, Suchen, Bewerten) bringt mehr Behalten. Mit Einschränkungen bestätigt.
Konsequenz: Aufgaben mit Bedarf, Suchen und Auswahl bevorzugen gegenüber reinem Lesen der Übersetzung.

**Q35** Nakata, T. (2008). English vocabulary learning with word lists, word cards and computers: Implications from cognitive psychology research for optimal spaced learning. *ReCALL, 20*(1), 3-20. https://www.cambridge.org/core/journals/recall/article/english-vocabulary-learning-with-word-lists-word-cards-and-computers-implications-from-cognitive-psychology-research-for-optimal-spaced-learning/4742121ED692165551C531F6464E67FA (Stufe B)
Kernbefund: 226 japanische Schüler, 10 Wörter. Computer-Gruppe schlug Wortliste im verzögerten Test, Karten nur begrenzt besser als Listen. Zeit pro Wort korrelierte negativ mit dem Ergebnis. Kleine Studie, Mini-Wortschatz.
Konsequenz: Computergestütztes, verteiltes Üben ist Papierlisten überlegen, aber Effekt bleibt klein belegt.

---

## 6. Explizite und implizite Grammatik, Korrekturfeedback

**Gesamtstatus: überwiegend gestützt, im Detail umstritten.** Fokussierte Instruktion bringt große Gewinne, explizite Vermittlung schlägt implizite in den meisten Meta-Analysen. Kritik: Testformate begünstigen explizites Wissen.

**Q36** Norris, J. M., & Ortega, L. (2000). Effectiveness of L2 instruction: A research synthesis and quantitative meta-analysis. *Language Learning, 50*(3), 417-528. (Stufe B, Zahlen d nicht verifiziert)
Kernbefund: 49 Stichproben aus 1980 bis 1998. Fokussierte Instruktion bringt große Effekte, explizit besser als implizit, Gewinne bleiben bestehen. Kritik: Messformate (kontrollierte Tests) begünstigen explizit, nur etwa 16 % der Studien mit freier Produktion, dort leichter Vorteil für implizit (Zweitquelle). Reanalyse und Kritik in Shin (2010) und Moosavian (2007), siehe https://doaj.org/article/01b7af7b486a479da9c615ae8cb7c9a7 (Stufe C).
Konsequenz: Erklärungen kurz und explizit, aber Wirkung nur an freier Produktion messen.

**Q37** Spada, N., & Tomita, Y. (2010). Interactions between type of instruction and type of language feature: A meta-analysis. *Language Learning, 60*(2), 263-308. https://doi.org/10.1111/j.1467-9922.2010.00562.x (Stufe B)
Kernbefund: 41 Studien. Explizite Instruktion größer als implizite, für einfache und komplexe Merkmale, für kontrollierten und spontanen Gebrauch. d-Werte nicht gefunden.
Konsequenz: Explizite Regelerklärung auch für komplexe Formen lohnt sich.

**Q38** Li, S. (2010). The effectiveness of corrective feedback in SLA: A meta-analysis. *Language Learning, 60*(2), 309-365. https://doi.org/10.1111/j.1467-9922.2010.00561.x (Stufe B)
Kernbefund: 33 Studien (22 veröffentlicht, 11 Dissertationen). Mittlerer Gesamteffekt. Implizites Feedback hält besser über die Zeit als explizites. d-Werte je Typ nicht gefunden.
Konsequenz: Feedback immer, die Form (explizit gegenüber implizit) ist zweitrangig.

**Q39** Lyster, R., & Saito, K. (2010). Oral feedback in classroom SLA: A meta-analysis. *Studies in Second Language Acquisition, 32*(2), 265-302. (Stufe B)
Kernbefund: 15 quasi-experimentelle Studien (N = 827). Korrekturfeedback im Unterricht wirkt (Gesamtzahlen aus dem Abstract nicht geprüft).
Konsequenz: Feedback auch beim mündlichen Üben in der App.

**Q40** Lyster, R., & Ranta, L. (1997). Corrective feedback and learner uptake: Negotiation of form in communicative classrooms. *Studies in Second Language Acquisition, 19*(1), 37-66. (Stufe B)
Kernbefund: 18,3 Stunden in vier Klassen französischer Immersion (Klasse 4 und 5). Sechs Feedbacktypen. Prompts (Nachfragen, Hinweise, Metasprache) führen eher zu Selbstkorrektur als Recasts, Recasts überwiegen in der Praxis.
Konsequenz: Statt sofort die Lösung zu nennen, erst Hinweis geben und Selbstkorrektur ermöglichen.

**Q41** Plonsky, L., & Oswald, F. L. (2014). How big is "big"? Interpreting effect sizes in L2 research. *Language Learning, 64*(4), 878-912. https://doi.org/10.1111/lang.12079 (Stufe B)
Kernbefund: 346 Primärstudien und 91 Meta-Analysen. Cohens Schwellen unterschätzen typische L2-Effekte. Die genauen Feldwerte habe ich nicht geprüft.
Konsequenz: Beim Bewerten eigener Wirksamkeitsdaten Feldmaßstäbe benutzen.

---

## 7. Aussprache: Wahrnehmungstraining, HVPT, Shadowing

**Gesamtstatus: HVPT gesichert (Wahrnehmung), Übertrag auf Sprechen nur eingeschränkt, Shadowing dünn.**

**Q42** Thomson, R. I. (2018). Beitrag zu High Variability Phonetic Training. *Journal of Second Language Pronunciation*. https://doi.org/10.1075/jslp.17038.tho (Stufe C: Titel nicht verifiziert)
Kernbefund: Kritische Synthese von 32 HVPT-Studien. Wirksamkeit gut belegt, viele Hürden für breiten Einsatz im Unterricht. Kanonisches HVPT: mehrere Sprecher, wechselnde Wortkontexte, Korrekturfeedback.
Konsequenz: Wahrnehmungstraining mit vielen Stimmen als eigene Übungsform.

**Q43** Uchihara, T., Karas, M., & Thomson, R. I. (2025). High variability phonetic training (HVPT): A meta-analysis of L2 perceptual training studies. *Studies in Second Language Acquisition, 47*(3), 794-827. https://doi.org/10.1017/S0272263125100879 (Stufe A, Volltext gelesen)
Kernbefund: 79 Studien. Vorher-nachher g = 0,92 (nach Publikationsbias-Korrektur 0,71), Behandlung gegen Kontrolle g = 0,67. Gewinne bleiben erhalten (verzögerter Test g = 0,98 gegen Vortest). Generalisierung auf neue Sprecher und Wörter nur klein. Identifikationstraining (g = 0,95) schlägt Diskriminationstraining (g = 0,57). Bilder als Antwortlabel schwächer (g = 0,47) als Schlüsselwörter, Orthografie oder Lautschrift (etwa 0,9 bis 1,0). Mehr Sprecher helfen fortgeschrittenen Lernenden (bis sechs Sprecher). Nicht signifikant: Lernkontext, Feedbackart, Trainingsdauer insgesamt.
Konsequenz: Identifikationsaufgaben mit mehreren Sprechern, Antwort per Wort statt per Bild.

**Q44** Uchihara, T., Karas, M., & Thomson, R. I. (2024). Meta-Analyse: Verbessert perzeptuelles HVPT die L2-Produktion? (31 Studien). https://www.cambridge.org/core/product/E38D8F5CE65DC708137B0E95F97C6BC7 (Stufe C: Zeitschrift widersprüchlich angegeben, laut URL Applied Psycholinguistics)
Kernbefund: Untersucht den Übertrag auf Sprechen. Details nicht geprüft.
Konsequenz: Ein Übertrag auf die eigene Aussprache ist plausibel, aber nicht sicher.

**Q45** Sakai, M., & Moorman, C. (2018). Can perception training improve the production of second language phonemes? A meta-analytic review of 25 years of perception training research. *Applied Psycholinguistics, 39*(1), 187-224. https://www.cambridge.org/core/product/57401D28450902EE96659AD10AA11488 (Stufe B)
Kernbefund: Wahrnehmungstraining kann die Produktion verbessern. Die Korrelation zwischen Wahrnehmungs- und Produktionsgewinn war klein bis mittel, aber nicht signifikant.
Konsequenz: Wahrnehmung trainieren, Sprechen separat üben.

**Q46** Foote, J. A., & McDonough, K. (2017). Shadowing-Studie. *Journal of Second Language Pronunciation*. (Stufe C)
Kernbefund: 16 Lernende, 8 Wochen Shadowing, Verbesserung bei allen Sprechmaßen außer Akzent. Kleine Studie. Eine systematische Übersicht (Oxford-Masterarbeit, nicht peer reviewed, https://ora.ox.ac.uk/objects/uuid:3104cae1-3a6b-400a-b173-de44384238d2) sieht Hinweise auf Verständlichkeit und Flüssigkeit, Wirkung auf einzelne Laute unklar. Keine Meta-Analyse gefunden.
Konsequenz: Shadowing als optionale Übung, keine Kernfunktion.

---

## 8. Wirksamkeit von Sprachlern-Apps, Gamification, Motivation

**Gesamtstatus: dünn bis umstritten.** Industrie-gestützte Studien melden Gewinne, unabhängige Studien sind selten, kleine Stichproben, hohe Abbruchquoten. Meta-Analysen zu MALL zeigen große mittlere Effekte, aber hohe Heterogenität und Publikationsbias.

**Q47** Vesselinov, R., & Grego, J. (2012). *Duolingo effectiveness study.* Bericht (von Duolingo bezahlt, Auswertung laut Autoren unabhängig). Zugänglich über Kopien, z. B. https://www.scribd.com/doc/295554832/DuolingoReport-Final (Stufe C)
Kernbefund: Rund 8 Wochen Spanisch, im Mittel etwa 8,1 Punkte pro Lernstunde (95 %-KI 5,6 bis 10,7). Krashen (Kritik, https://mail.sdkrashen.com/content/articles/research_on_duolingo.pdf, Stufe C) nennt Median 3,9 Punkte pro Stunde und Standardabweichung 12,1: starke Streuung, Selbstselektion, nur Teilnehmende mit mindestens 2 Stunden.
Konsequenz: Kein Maßstab für Wirksamkeitsversprechen. Eigene Messung nötig.

**Q48** Loewen, S., Crowther, D., Isbell, D. R., Kim, K. M., Maloney, J., Miller, Z. F., & Rawal, H. (2019). Mobile-assisted language learning: A Duolingo case study. *ReCALL, 31*(3), 293-311. https://doi.org/10.1017/S0958344019000065 (Stufe B)
Kernbefund: Neun Teilnehmende, Türkisch, ein Semester. Verbesserung auf L2-Maßen, mäßige positive Korrelation zwischen Nutzungszeit und Gewinn. Flexibilität und Gamification geschätzt, Motivation schwankend, Frust mit dem Material. Unabhängig, aber sehr klein.
Konsequenz: Dosis zählt, Motivation ist die Schwachstelle.

**Q49** Jiang, X., Rollinson, J., Plonsky, L., Gustafson, E., & Pajak, B. (2021). Evaluating the reading and listening outcomes of beginning-level Duolingo courses. *Foreign Language Annals*. https://experts.nau.edu/en/publications/evaluating-the-reading-and-listening-outcomes-of-beginning-level-/ (Stufe C; Duolingo-Autoren beteiligt, Stichprobe laut Kritik stark akademisch und selbstselektiert)
Kernbefund: Erwachsene nach Anfängerkursen Spanisch oder Französisch erreichten Lesen Intermediate Low und Hören Novice High, vergleichbar mit Uni-Studierenden nach vier Semestern.
Konsequenz: Vorsicht beim Zitieren, Selektion.

**Q50** Shortt, M., Tilak, S., Kuznetcova, I., Martens, B., & Akinkuolie, B. (2023). Gamification in mobile-assisted language learning: A systematic review of Duolingo literature from public release of 2012 to early 2020. *Computer Assisted Language Learning, 36*(3), 517-554. (Stufe B)
Kernbefund: 35 von 367 Treffern analysiert. Forschung konzentriert sich auf das App-Design statt auf Lernprozess und Lernergebnis. Überwiegend quantitativ, nicht-probabilistische Stichproben.
Konsequenz: Wirksamkeit belegen heißt selbst messen.

**Q51** Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77-112. https://doi.org/10.1007/s10648-019-09498-w (Stufe B)
Kernbefund: Positive, kleine bis mittlere Effekte auf kognitives, motivationales und verhaltensbezogenes Lernen. Kognitive Effekte stabil bei hoher methodischer Qualität, motivationale und Verhaltenseffekte weniger stabil. Spielgeschichte und soziale Interaktion verstärken Verhaltenseffekte. Zahlenwerte aus den Suchauszügen widersprüchlich, daher nicht übernommen.
Konsequenz: Gamification dosiert, mit Geschichte und Gemeinschaft statt reiner Punkte.

**Q52** Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does gamification work? A literature review of empirical studies on gamification. *HICSS 2014*, 3025-3034. https://doi.org/10.1109/HICSS.2014.377 (Stufe B)
Kernbefund: 24 empirische Arbeiten. Gamification hat positive Effekte, abhängig von Kontext und Nutzenden.
Konsequenz: Gamification passend zur Zielgruppe testen.

**Q53** Mekler, E. D., Brühlmann, F., Tuch, A. N., & Opwis, K. (2017). Towards understanding the effects of individual gamification elements on intrinsic motivation and performance. *Computers in Human Behavior, 71*, 525-534. https://glassmanlab.seas.harvard.edu/annotated_works/mekler17.pdf (Stufe B)
Kernbefund: Punkte, Level und Ranglisten steigerten die Leistung (mehr Tags), aber nicht die intrinsische Motivation oder das Kompetenzerleben. Wirkten als äußere Anreize.
Konsequenz: Rangliste und Punkte nicht als Motivationsmotor überschätzen, Kompetenzrückmeldung inhaltlich gestalten.

**Q54** Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68-78. https://doi.org/10.1037/0003-066X.55.1.68 (Stufe B)
Kernbefund: Drei Grundbedürfnisse: Autonomie, Kompetenz, soziale Eingebundenheit. Kontexte, die sie stützen, fördern Eigenmotivation, kontrollierende Kontexte untergraben sie.
Konsequenz: Wahlfreiheit bei Themen, sichtbarer Fortschritt, optionale soziale Elemente, kein Druck durch Verlustangst.

**Q55** Noels, K. A., Pelletier, L. G., Clément, R., & Vallerand, R. J. (2000). Why are you learning a second language? Motivational orientations and self-determination theory. *Language Learning, 50*(1), 57-85. https://selfdeterminationtheory.org/wp-content/uploads/2019/06/2000_NoelsPelletierVallerand_wiley.pdf (Stufe B)
Kernbefund: SDT auf Sprachenlernen übertragen: Motivation liegt auf einem Kontinuum der Selbstbestimmung.
Konsequenz: Motivationsarten erfragen (Reise, Familie, Beruf) und Inhalte danach ausrichten.

**Q56** Burston, J., & Giannakou, K. (2022). MALL language learning outcomes: A comprehensive meta-analysis 1994-2019. *ReCALL*. https://doi.org/10.1017/s0958344021000240 (Stufe B; Jahrgang der Ausgabe nicht geprüft)
Kernbefund: Große Gesamteffekte für Gruppenvergleiche und Vorher-nachher, aber deutlicher Publikationsbias und Heterogenität nahe 100 %. Die Autoren raten zur Zurückhaltung.
Konsequenz: Positive Befunde zu "Apps" nicht überbewerten.

**Q57** Mihaylova, M., Gorin, S., Reber, T. P., & Rothen, N. (2022). A meta-analysis on mobile-assisted language learning applications: Benefits and risks. PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC9479751 (Stufe C: Seite nicht lesbar; Angaben aus Suchauszug; Zeitschrift unsicher, vermutlich *Psychologica Belgica*)
Kernbefund: Mittlerer bis starker Gesamteffekt (g etwa 0,88), aber hohes Verzerrungsrisiko und niedrige Evidenzqualität in allen Studien.
Konsequenz: Effektgröße vorsichtig lesen, Studienqualität ist niedrig.

---

## 9. Duale Kodierung, Mnemonik, Kontext gegen Wortlisten

**Gesamtstatus: gemischt.** Bild plus Wort hilft meist, Keyword-Methode wirkt im Labor, wird aber in Dunlosky et al. (Q14) als wenig nützlich für den Lernalltag bewertet. Eine Meta-Analyse zur Keyword-Methode in L2 habe ich nicht gefunden. Paivios Originalarbeiten zur dualen Kodierung habe ich nicht geprüft.

**Q58** Plass, J. L., Chun, D. M., Mayer, R. E., & Leutner, D. (1998). Supporting visual and verbal learning preferences in a second-language multimedia learning environment. *Journal of Educational Psychology, 90*(1), 25-36. https://fis.leuphana.de/en/publications/supporting-visual-and-verbal-learning-preferences-in-a-second-lan/ (Stufe B)
Kernbefund: Lernende, die zu Schlüsselwörtern sowohl Übersetzung als auch Bild oder Video wählten, behielten die Übersetzungen besser als solche mit einer oder keiner Annotation.
Konsequenz: Wort plus Bild plus Audio anbieten, nicht erzwingen.

**Q59** Atkinson, R. C., & Raugh, M. R. (1975). An application of the mnemonic keyword method to the acquisition of a Russian vocabulary. *Journal of Experimental Psychology: Human Learning and Memory*, S. 126-133. https://apps.dtic.mil/sti/pdfs/AD0787843.pdf (Stufe B; Bandangabe unsicher; die Suchseite nennt Band 104, vermutlich Band 1)
Kernbefund: 120 russische Wörter, Keyword-Gruppe 72 % gegen 46 % Kontrollgruppe. Gutes Ergebnis bei Spanisch- und Russischlernern im Labor.
Konsequenz: Keyword-Mnemonik als optionale Hilfe bei hartnäckigen Wörtern, Wirkung langfristig und im Alltag eher begrenzt (Q14).

**Weitere Belege zum Kontext gegenüber Listen:** siehe Q32 (Karteikarten besser als Wortlisten), Q35 (Computer besser als Listen) und Q31 (qualitativ gute Verarbeitung der Begegnungen).

---

## 10. Lateinamerikanisches gegenüber europäischem Spanisch, Korpora, Lizenzen

**Gesamtstatus Dialektunterschiede: gesichert** (seseo, yeísmo, ustedes, voseo, Lexik). Belegt aus Sekundärquellen und Lipski. **Wirksamkeit bestimmter Lehrstrategien für Dialektvielfalt: dünn.**

**Q60** Lipski, J. M. Arbeiten zu Dialektzonen und Voseo (Sammlung von PDFs). https://johnlipski.github.io/dialects-borders.pdf und weitere Dateien (Stufe B; genauer Titel und Jahr nicht verifiziert, Seite ist Lipskis eigene Ablage)
Kernbefund: Dialektzonen Lateinamerikas decken sich selten mit Staatsgrenzen. Vos tritt in allen lateinamerikanischen Ländern außer Puerto Rico und der Dominikanischen Republik zumindest regional auf, mit mindestens sechs verschiedenen Verbendungssätzen, und kommt in keiner Varietät des europäischen Spanisch vor.
Konsequenz: Voseo ist ein Muss als Verständnisinhalt, aber regional unterschiedlich. Als Kernproduktion tú wählen, Voseo rezeptiv und optional.

**Dialektunterschiede im Überblick** (Stufe C, populäre Quellen wie https://www.fluentu.com/blog/spanish/differences-between-castilian-and-latin-american-spanish/ und Wikipedia): Seseo (kein Unterschied zwischen "z/c" und "s") in ganz Lateinamerika, ebenso im Süden Spaniens und auf den Kanaren. Yeísmo (ll und y gleich) in Lateinamerika weit verbreitet. Ustedes für jedes "ihr" in Lateinamerika (kein vosotros). Kein Leísmo in Lateinamerika. Wortschatz: z. B. *computadora* gegen *ordenador*. Länderspezifische Lexik (Alltag, Essen, Schimpfwörter) habe ich nicht systematisch belegt.
Konsequenz: Kernlehrplan mit seseo, ustedes, Lexik Lateinamerika, plus Hinweise auf Spanien-Varianten; Länderlexik kennzeichnen.

**Q61** L2-Entwicklung der perzeptuellen Kategorisierung dialektaler Laute (Spanisch). *Studies in Second Language Acquisition* (2021). https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/l2-development-of-perceptual-categorization-of-dialectal-sounds/9F0D264139E5069BBFC0231B66EAC972 (Stufe B; Autoren nicht verifiziert)
Kernbefund (laut Suchzusammenfassung): 111 amerikanische Lernende erkannten Dialekte über Zufall, aber deutlich schlechter als Muttersprachler. Sie wichen auf häufig gehörte Varietäten (Spanien, Mexiko) aus. Vertrautheit sagt die Erkennung voraus. Explizite Unterweisung zu Dialekten verbesserte die Erkennungsgenauigkeit nicht, Kontakt (Auslandsaufenthalt, Muttersprachler) eher.
Konsequenz: Dialektvielfalt über Hören mit Sprechern aus mehreren Ländern vermitteln, nicht über Regeltabellen.

**Korpora, Frequenzlisten und Lizenzlage**

**Q62** Davies, M. Corpus del Español (Web/Dialects). https://www.corpusdelespanol.org/ (Stufe B)
Befund: Webkorpus mit mehr als zwei Milliarden Wörtern aus 21 spanischsprachigen Ländern (Angabe laut Buchbeschreibung des Frequenzwörterbuchs, nicht geprüft). Häufigkeitsdaten laut Kaufvertragskopien (Stufe C, Dritthosting, https://www.wordfrequency.info/license/spanish_40k_com.doc) nur kostenpflichtig (genannt 295 Dollar) mit Auflagen, zum Beispiel Nutzern nur Häufigkeitsbänder zeigen, nicht exakte Ränge, und keine Neuzusammensetzung ähnlicher Listen. Akademische Variante für 100 Dollar. Kein freies Material für eine kostenlose App, aktuelle Bedingungen beim Rechteinhaber prüfen.

**Q63** Davies, M., & Davies, K. H. (2018). *A Frequency Dictionary of Spanish: Core Vocabulary for Learners* (2. Aufl.). Routledge. https://www.routledge.com/A-Frequency-Dictionary-of-Spanish-Core-Vocabulary-for-Learners/Davies-Davies/p/book/9781138686540 (Stufe B)
Befund: Die 5000 häufigsten Wörter, 2. Auflage mit mehr als 500 neuen Einträgen. Korpusangaben widersprüchlich (20 Mio. gegenüber 2 Mrd. Wörter). Buch ist urheberrechtlich geschützt, nicht frei nutzbar.

**Q64** Real Academia Española. CORPES XXI. https://rae.es/banco-de-datos/corpes-xxi (Stufe B: Seite nicht abrufbar, Angaben aus Suchauszügen)
Befund: Version 1.1 (April 2024) mit mehr als 410 Mio. Formen, erstmals mit Frequenzwörterbuch (laut einer Quelle jetzt Version 1.3 mit mehr als 400 Mio. orthografischen Formen). Texte aus Spanien, Amerika, den Philippinen und Äquatorialguinea. Nutzungsbedingungen und Download der Frequenzlisten nicht geprüft.

**Q65** Tatoeba. Downloads. https://tatoeba.org/en/downloads (Stufe A, Seite gelesen)
Befund: Dateien unter CC BY 2.0 FR, ein Teil der Sätze zusätzlich unter CC0 1.0 (eigener CC0-Export). Spanische Sätze per Sprachfilter exportierbar, Satzpaare mit Übersetzung über "Sentence pairs" oder die Links-Datei. Audio hat je Beitragendem eigene Lizenz, ohne Lizenzfeld keine Wiederverwendung außerhalb von Tatoeba. Herkunftsland der Sätze (Lateinamerika oder Spanien) ist nicht als Merkmal ausgewiesen, nicht geprüft.

**Q66** hermitdave. FrequencyWords (GitHub). https://github.com/hermitdave/FrequencyWords (Stufe A, README gelesen)
Befund: Code MIT, Inhalt CC BY-SA 4.0. Listen aus OpenSubtitles 2016 und 2018. Eine Drittrepo (doozan/spanish_data) nennt CC BY-SA 3.0. Keine Aussage zu Lateinamerika gegenüber Spanien. Die Rechte der zugrunde liegenden OpenSubtitles-Daten sind ungeklärt: OPUS bittet um Zitat von Lison & Tiedemann (LREC 2016) und Link, Hugging Face führt die Lizenz als "unknown" (Stufe B, https://opus.nlpl.eu/OpenSubtitles/en&/v2018/OpenSubtitles). Share-Alike gilt für abgeleitete Listen.

**Q67** doozan. spanish_data (GitHub). https://github.com/doozan/spanish_data (Stufe C, nur Suchtreffer)
Befund: Daten aus Wiktionary und Tatoeba mit eigenen Spanish Tools. Wiktionary-Frequenzlisten stehen unter CC BY-SA (https://en.wiktionary.org/wiki/Wiktionary%3AFrequency_lists, Stufe B). Brauchbar als freie Ergänzung, Qualität und Dialektbezug nicht geprüft.

---

## 11. Sprechen mit KI und Chatbots (2023 bis 2026)

**Gesamtstatus: dünn bis vorsichtig positiv.** Meta-Analysen zeigen mittlere Effekte für Dialogsysteme, aber die Studienbasis ist klein, oft Englisch, oft kurz. Zu großen Sprachmodellen gibt es erste Studien, aber kaum randomisierte Kontrollstudien.

**Q68** Bibauw, S., Van den Noortgate, W., François, T., & Desmet, P. (2022). Dialogue systems for language learning: A meta-analysis. *Language Learning & Technology, 26*(1), 1-24. https://www.lltjournal.org/item-detail/1035 (Stufe B)
Kernbefund: 17 Studien, 100 Effektstärken. Mittlerer Effekt (d etwa 0,58 oder 0,59, Quellen uneinheitlich). Gesichert für niedrigeres Niveau, Wortschatz, Morphosyntax, Gesamtniveau, Genauigkeit. Befürwortet formfokussierte, zielorientierte, systemgeführte Systeme, Korrekturfeedback und Gamification-Elemente.
Konsequenz: Geführte, zielorientierte Dialoge mit Feedback bauen, nicht freies Plaudern.

**Q69** Hou, Z., & Min, S. (2026). Dialogue-based computer-assisted language learning systems for second language speaking development: A three-level meta-analysis. *ReCALL, 38*(1), 40-56. https://doi.org/10.1017/S0958344025100268 (Stufe A, Seite gelesen)
Kernbefund: 16 Studien, 89 Effektstärken, g = 0,61 (95 %-KI 0,34 bis 0,89). Signifikante Moderatoren: Systemtyp, Bedeutungsbeschränkung, Modalität. Zielorientierte Systeme mit den größten Gewinnen, gemischte Modalität (Stimme plus Text) groß, reine Sprachsysteme klein. Nicht signifikant: Bildungsstufe, Sprachniveau, Ort, Korrekturfeedback, Dauer, Interaktionsart. Einschränkungen: kleine Stichproben, Publikationsbias, nur englisch- und chinesischsprachige Zeitschriften.
Konsequenz: Zielorientierte Szenarien (Café, Arzt, Wegbeschreibung), Sprache plus Text kombinieren.

**Q70** Wang, Z., Bibauw, S., Noreillie, A.-S., & Desmet, P. (2026). Meta-Analyse konversationeller Chatbots im L2-Lernen. Konferenzvortrag EUROCALL 2026, Belfast (8.9.2026). https://research.dial.uclouvain.be/entities/publication/29791a54-111b-40eb-bacb-346494980619 (Stufe A, Seite gelesen; nicht peer reviewed)
Kernbefund: 67 Studien (2011 bis 2025), 237 Effektstärken, 4544 Personen, g = 0,61 (95 %-KI 0,48 bis 0,74). Jugendliche am meisten (g = 1,05), Erwachsene 0,54, Kinder 0,49. Produktive Fertigkeiten g = 0,65, Wortschatz g = 0,92, Verstehen nicht signifikant. Passende Test- und Übungsmodalität bringt etwa 2,5-fach größere Effekte. Verzögerte Tests (g = 0,92) größer als sofortige (0,58). LLM-Chatbots mit der größten Schätzung (g = 0,64), Technologie jedoch kein signifikanter Moderator.
Konsequenz: Übungsmodus und Test passend halten (Sprechen üben, Sprechen testen). Bei LLM keine Wunderwirkung erwarten.

**Q71** Hayashi, Y. et al. (2023/24). ChatGPT-Studie zu Sprechangst und Sprechniveau. WorldCALL 2023. https://papers.iafor.org/wp-content/uploads/papers/worldcall2023/WorldCALL2023_75518.pdf (Stufe C; Autorenname aus Suchauszug, nicht geprüft)
Kernbefund: Vier Wochen, täglich 10 Minuten, signifikant weniger Sprechangst gegenüber nicht-interaktiven Aktivitäten. Randomisierung und Effektgrößen nicht gesehen. Viele weitere Studien sind quasi-experimentell oder Einzelgruppen und deshalb nur als Hinweise zu lesen.
Konsequenz: KI als angstarmer Übungsraum plausibel, Nachweis für Sprechniveau offen.

**Q72** Lancaster University (CASS). When less is more: AI feedback for language learners. https://cass.lancs.ac.uk/when-less-is-more-ai-feedback-for-language-learners/ (Stufe C, Blog zu einer GPT-4o-Studie)
Kernbefund: Ein handelsübliches LLM neigte trotz Anweisungen zum Überkorrigieren, Feintuning machte es zurückhaltender. Ein ganzer Umschreibe-Vorschlag kann den konkreten Fehler verdecken, den Lernende bemerken sollen (Noticing). Eine Studie zu einem eigenen GPT-Tutor für Spanisch-Anfänger (EUROCALL Review, https://polipapers.upv.es/index.php/eurocall/article/view/23827, Stufe C, Zuordnung ungeprüft) fand Probleme beim Abwägen zwischen Korrektur und Ermutigung sowie Inkonsistenzen bei gleicher Version.
Konsequenz: Feedback der KI strikt begrenzen (ein bis zwei Hinweise), Ausgabeformat steuern, Zuverlässigkeit testen. Halluzinierte Grammatikerklärungen habe ich in der Literatur nicht gefunden, das Risiko bleibt offen.

**Q73** Savaş, S. (2024/25). Use of artificially intelligent chatbots in English language learning: A systematic metasynthesis study of articles published between 2010 and 2024. *ReCALL*. https://www.cambridge.org/core/product/118654390007CCA33DEAD142D45C8D4F/core-reader (Stufe C: Autorenname und Jahr aus Suchauszug)
Kernbefund: Qualitative Metasynthese von 57 Studien zu sprachbasierten KI-Chatbots. Details nicht geprüft.
Konsequenz: Hintergrund, kein Wirksamkeitsnachweis.

---

## Gestaltungsprinzipien für die App (priorisiert)

Die Reihenfolge folgt Stärke der Evidenz mal Hebelwirkung auf das Lernergebnis. Verweise in Klammern.

1. **Abruf vor Anzeige.** Jede Wort- und Grammatikübung beginnt mit einem Abrufversuch (Tippen, Sprechen, Lückensatz), erst danach kommt das Feedback. Wiedererkennen und Wiederlesen sind Nebensache. (Q10, Q11, Q12, Q13, Q14)
2. **Adaptiver Spacing-Scheduler statt fester Intervalle.** FSRS-artiges Modell mit konfigurierbarer Ziel-Behaltensquote, SM-2 nur als Fallback. Intervalle nach Zielzeitraum, nicht unbegrenzt wachsend. Die Überlegenheit gegenüber SM-2 muss ich noch separat belegen. Lizenz des FSRS-Codes prüfen. (Q1, Q2, Q3, Q5, Q6, Q7, Q8)
3. **Frequenzbasierter Wortschatzpfad mit lateinamerikanischer Gewichtung.** Die ersten 1000 bis 3000 Lemmata zuerst (gesprochen etwa 88 bis 94 % Deckung bei 1000 bis 3000), danach Themenfelder. Eigene Frequenzliste aus freien Quellen bauen und Länderlexik markieren. (Q27, Q24, Q25, Q62, Q66)
4. **Wörter im Satzkontext mit mehrfachen, tiefen Begegnungen.** Jede Karte hat Beispielsatz, Audio und optional Bild. Wiederholungen über verschiedene Kontexte, mit Aufgaben, die "Beteiligung" verlangen (suchen, entscheiden, produzieren). (Q31, Q32, Q34, Q35, Q58)
5. **Verständlicher Input in großer Menge, gesteuert nach Deckung.** Kurze Lese- und Hörtexte mit 95 bis 98 % bekannten Wörtern, nach Genre und Thema gebündelt, mit Glossen. Tägliches Hören mit Muttersprachlern aus mehreren Ländern. (Q24, Q25, Q26, Q28, Q29, Q30)
6. **Früh produzieren, auch beim Anfänger.** Pro Sitzung mindestens eine Sprech- und eine Schreibaufgabe mit Zwang zur eigenen Formulierung. Nicht nur Input und Erkennen. (Q20, Q21, Q22, Q23)
7. **Kurze, explizite Regelerklärung, dann gebrauchsnahe Übung.** Grammatik erst erklären (30 bis 60 Sekunden), dann mit Abruf und Produktion üben, die Wirkung an freier Produktion messen. (Q36, Q37, Q23)
8. **Sofortiges, abgestuftes Feedback.** Erst Hinweis (Prompt), dann Lösung. Feedback immer anbieten, die Form ist zweitrangig. Selbstkorrektur ermöglichen. (Q38, Q39, Q40)
9. **Interleaving gezielt bei verwechselbaren Mustern.** *ser/estar*, *por/para*, Vergangenheitszeiten, Verbendungen mischen. Bei Vokabelkarten nicht mischen nach dem Kriterium "ähnliche Wörter", sondern nach Thema. (Q15, Q16, Q17, Q18)
10. **Wahrnehmungstraining für die Aussprache mit vielen Sprechern.** Identifikationsaufgaben (Welches Wort hörst du?) mit mehreren Stimmen und Ländern, Antwort per Wort statt per Bild. Sprechen separat üben. (Q42, Q43, Q45)
11. **Dialektstrategie festlegen.** Kernvariante: lateinamerikanischer Standard (seseo, yeísmo tolerant, ustedes, tú als Produktionsform). Voseo rezeptiv mit Länderhinweis. Europäische Formen (vosotros, "z" als [θ]) als "kommt vor" kennzeichnen. Dialekte über Hören vermitteln, nicht über Tabellen. (Q60, Q61)
12. **Fortschritt sichtbar, Kompetenz informativ.** Fortschritt in Fähigkeiten ("du kannst jetzt…") statt nur Punkte und Ranglisten. Streaks sparsam, keine Verlustangst als Hauptantrieb. Wahlfreiheit bei Themen. (Q54, Q55, Q53, Q51, Q52)
13. **Schwierigkeit steuern, nicht maximieren.** Erfolgsquote im Blick behalten (erwünschte Schwierigkeit nur, wenn sie bewältigbar ist). Nutzende bevorzugen Wiederlesen, die App darf sich darauf nicht einlassen. (Q18, Q10, Q15)
14. **KI-Gesprächspartner: zielorientiert, begrenzt, mehrkanalig.** Szenarien mit klarem Ziel (Café, Arzt), Sprache plus Text, Feedback beschränkt, Dialekt im Systemprompt festlegen. (Q68, Q69, Q70, Q72)
15. **Kurze, tägliche Sitzungen statt lange, seltene.** Sitzungen von 10 bis 15 Minuten, verteilt über die Woche, mit Wiederholung am Anfang. Begründung: Spacing und Abbruchrisiko. (Q1, Q2, Q3, Q4, Q48)
16. **Eigene Wirksamkeitsmessung und ehrliche Versprechen.** Einstufungstest, Vorher-nachher-Tests mit freier Produktion, Berichte ohne "so gut wie ein Uni-Semester"-Behauptungen. Feldmaßstäbe für Effektgrößen benutzen. (Q47, Q48, Q50, Q56, Q57, Q41)
17. **Freie Datenbasis und saubere Lizenzen.** Tatoeba (CC BY, Attribution, CC0-Export), FrequencyWords (CC BY-SA 4.0, Share-Alike), Wiktionary-Listen (CC BY-SA). Vor dem Einsatz OpenSubtitles-Herkunft und Share-Alike-Folgen klären. Corpus del Español und das Frequenzwörterbuch von Davies nicht ohne Lizenz verwenden. (Q62, Q63, Q65, Q66, Q67)
18. **Mnemonik und Bilder als optionale Hilfe.** Keyword-Hilfen und Bildkarten anbieten, nicht als Kern. Bilder als Antwortlabel im Lautunterricht meiden. (Q14, Q58, Q59, Q43)
19. **Shadowing als Zusatzübung.** Nur optional, Evidenz dünn. (Q46)
20. **Motivationsprofil beim Start abfragen** (Reise, Familie, Beruf) und Inhalte danach auswählen. (Q55, Q54)

---

## Lücken und offene Prüfpunkte

- **Krashen-Primärquellen** (1982, 1985) und Gregg 1984, McLaughlin 1987 habe ich nicht geöffnet, nur Sekundärquellen.
- **FSRS gegen SM-2:** Ein direkter, belastbarer Vergleich liegt mir nicht vor. Die Lizenz des FSRS-Codes habe ich nicht geprüft.
- **Effektgrößen** für Norris und Ortega (2000), Spada und Tomita (2010), Li (2010), Lyster und Saito (2010) und Webb et al. (2020) habe ich nicht im Volltext geprüft. Zahlen in diesen Einträgen stammen aus Abstracts oder Zweitquellen und sind als solche gekennzeichnet.
- **Duale Kodierung (Paivio):** Originalquellen nicht geprüft. Es gibt keine gefundene Meta-Analyse zur Keyword-Methode in L2.
- **Shadowing:** keine Meta-Analyse gefunden, Hamada (2016) nicht gefunden.
- **Spanisch-spezifische Deckungsdaten** zu 95 und 98 % in Spanisch (Tschirner und Mitarbeiter, AAUSC 2018) konnte ich nicht lesen (Seite gesperrt), nur eine Suchzusammenfassung: 95 % Deckung reichte für 60 % Verständnis, 98 % für 70 %. Nicht in die Liste aufgenommen.
- **Länderspezifische Lexik** (Alltagswörter, Schimpfwörter) und der Anteil lateinamerikanischer gegenüber spanischen Sätzen in Tatoeba und OpenSubtitles: nicht belegt.
- **RAE CORPES XXI:** Nutzungsbedingungen und Download der Frequenzlisten nicht geprüft.
- **LLM-Tutoren:** Keine randomisierte Kontrollstudie zu Sprechniveau mit modernen LLMs gefunden. Halluzinationsrate bei Grammatikerklärungen in der Literatur nicht gefunden.
- **Mihaylova et al. (Q57), Savaş (Q73), Foote und McDonough (Q46), Hayashi (Q71)** und mehrere Autorennamen sind aus Suchauszügen und müssen vor dem Zitieren geprüft werden.
