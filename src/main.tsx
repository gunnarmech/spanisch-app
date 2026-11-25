import { render } from 'preact';
import { App } from './ui/App';
import './ui/styles/fonts';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/theme.css';

const root = document.getElementById('app')!;
const params = new URLSearchParams(location.search);

if (import.meta.env.DEV && params.has('zeige')) {
  // Prüf-Einstieg, kommt nie in den Produktionsbau.
  const { Preview } = await import('./ui/dev/preview');
  render(<Preview params={params} />, root);
  // Unbekannter Wert: Preview rendert nichts, dann die normale App.
  if (!root.firstChild) render(<App />, root);
} else {
  render(<App />, root);
}
