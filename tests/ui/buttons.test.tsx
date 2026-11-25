import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, expect, test } from 'vitest';
import { openDb } from '../../src/store/db';
import { App } from '../../src/ui/App';
import { AudioButton } from '../../src/ui/tasks/AudioButton';

afterEach(cleanup);

test('Startseite hat genau einen Primärknopf und keine alten Knopfklassen', async () => {
  const db = await openDb(`buttons-${Date.now()}`);
  const { container } = render(<App db={db} />);
  await screen.findByRole('button', { name: 'Heute lernen' });
  const primaries = container.querySelectorAll('.btn--primary');
  expect(primaries).toHaveLength(1);
  expect(primaries[0].textContent).toBe('Heute lernen');
  expect(container.querySelectorAll('.primary:not(.btn)')).toHaveLength(0);
  expect(container.querySelectorAll('.secondary:not(.btn)')).toHaveLength(0);
});

test('AudioButton ist ein Sekundärknopf mit verstecktem Lautsprecher-Symbol', () => {
  const { container } = render(<AudioButton url="/a.mp3" />);
  const button = screen.getByRole('button', { name: 'Anhören' });
  expect(button.classList.contains('btn')).toBe(true);
  expect(button.classList.contains('btn--secondary')).toBe(true);
  expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
});
