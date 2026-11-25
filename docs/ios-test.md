# iPhone-Test

Stand 26.11.2026, iPhone von Gunnar, App vom Home-Bildschirm gestartet (Stand main bb57fad).

| Zeile | Ergebnis |
|---|---|
| Spracherkennung | ja (Schnittstelle vorhanden) |
| Anzeige als App | ja |
| Ton-Test | ok |
| Mikrofon-Test | ok |
| Erkennungs-Test | keine Erkennung |
| Offline (Flugmodus, App neu geoeffnet) | ok |

Folge: Die Schnittstelle ist da, liefert im Standalone-Modus aber kein Ergebnis. Das ist der im Plan vorgesehene Ausfallweg: Sprechaufgaben fallen still auf Aufnahme und Selbstvergleich ("klang gleich") zurueck (src/ui/tasks/Speak.tsx). mp3 spielt, keine Umstellung auf m4a noetig.

Offen: ob die Erkennung mit eingeschalteter Diktierfunktion oder im Safari-Tab statt vom Home-Bildschirm geht.
