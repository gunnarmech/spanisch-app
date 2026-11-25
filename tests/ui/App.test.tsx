import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, test, expect } from 'vitest';
import { App } from '../../src/ui/App';

afterEach(cleanup);

test('Startseite zeigt Titel', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});

test('Diagnose ist über die Startseite erreichbar und führt zurück', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Diagnose' }));
  expect(screen.getByRole('heading', { name: 'Diagnose' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});
