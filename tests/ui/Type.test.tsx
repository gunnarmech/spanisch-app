import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../src/engine/round';
import { Type } from '../../src/ui/tasks/Type';
import { situation } from './fixtures';

afterEach(cleanup);

const task: Task = { cardId: 'w-adios', itemId: 'w-adios', situationId: 's1', form: 'type', isNew: false };
const item = situation.items[1];

function answer(text: string) {
  const input = screen.getByLabelText('Deine Antwort auf Spanisch');
  fireEvent.input(input, { target: { value: text } });
  fireEvent.submit(input.closest('form')!);
}

describe('Type', () => {
  it('zeigt bei fehlendem Akzent den Hinweis und markiert die Stelle', () => {
    const onDone = vi.fn();
    render(<Type task={task} item={item} onDone={onDone} />);
    answer('adios');
    expect(screen.getByText(/Achte auf die Akzente/)).toBeTruthy();
    expect(document.querySelector('mark')?.textContent).toBe('ó');
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'accent', usedHint: false }));
  });

  it('gibt bei falscher Antwort zuerst einen Hinweis, dann die Lösung', () => {
    const onDone = vi.fn();
    render(<Type task={task} item={item} onDone={onDone} />);
    answer('hasta');
    expect(screen.getByText(/Hinweis: a…/)).toBeTruthy();
    answer('nada');
    expect(screen.getByText('Nicht ganz. Richtig ist:')).toBeTruthy();
    expect(screen.getByText('adiós')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'wrong', usedHint: true }));
  });

  it('wertet den zweiten Versuch mit usedHint', () => {
    const onDone = vi.fn();
    render(<Type task={task} item={item} onDone={onDone} />);
    answer('hasta');
    answer('adiós');
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'correct', usedHint: true }));
  });
});
