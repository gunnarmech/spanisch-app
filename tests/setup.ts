import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/preact';
import { afterAll } from 'vitest';

// Preact 11 fuehrt die passiven Aufraeumfunktionen ausgehaengter Komponenten
// (z. B. removeEventListener in useKey) erst nach dem naechsten Frame aus
// (requestAnimationFrame oder bis zu 35 ms Timeout, dann noch ein Timeout).
// Haengt der letzte Test einer Datei etwas aus und die Datei endet sofort,
// baut vitest jsdom ab, bevor dieser Timer feuert: "window is not defined".
// Deshalb nach der letzten Datei-Aufgabe aushaengen und den Timer abwarten.
afterAll(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 80));
});
