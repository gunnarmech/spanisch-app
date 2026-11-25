import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, test } from 'vitest';
import { ChoiceBase } from '../../src/ui/tasks/ChoiceBase';

afterEach(cleanup);

function setup() {
  return render(<ChoiceBase question={<p>Frage</p>} options={['sí', 'no', 'quizás']} correct="sí" onDone={() => {}} />);
}

test('Optionen sind Flächen mit Tastenziffer in der Ziffernschrift', () => {
  const { container } = setup();
  const options = container.querySelectorAll('button.option');
  expect(options).toHaveLength(3);
  for (const o of options) expect(o.classList.contains('surface')).toBe(true);
  const keys = container.querySelectorAll('button.option span.key');
  expect([...keys].map((k) => k.textContent)).toEqual(['1', '2', '3']);
  for (const k of keys) expect(k.classList.contains('num')).toBe(true);
});

test('falsche Antwort: Urteil als Wort, gewählte Option wrong, richtige right, Rest rest', () => {
  const { container } = setup();
  fireEvent.click(screen.getByRole('button', { name: /no/ }));
  expect(screen.getByText('Nicht ganz.').classList.contains('bad')).toBe(true);
  expect(container.querySelector('button.option.wrong')?.textContent).toContain('no');
  expect(container.querySelector('button.option.right')?.textContent).toContain('sí');
  expect(container.querySelector('button.option.rest')?.textContent).toContain('quizás');
  expect(container.querySelectorAll('.btn--primary')).toHaveLength(1);
});

test('richtige Antwort: Urteil Richtig mit Klasse good', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: /sí/ }));
  expect(screen.getByText('Richtig.').classList.contains('good')).toBe(true);
});
