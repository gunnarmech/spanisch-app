import { render, screen } from '@testing-library/preact';
import { test, expect } from 'vitest';
import { App } from '../../src/ui/App';

test('Startseite zeigt Titel', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Spanisch für Chile' })).toBeTruthy();
});
