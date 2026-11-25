import { render } from 'preact';
import { App } from './ui/App';
import './ui/styles/fonts';
import './ui/styles/tokens.css';
import './ui/theme.css';

render(<App />, document.getElementById('app')!);
