import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { Preview } from '../../src/ui/dev/preview';

afterEach(cleanup);

describe('Preview', () => {
  it('zeigt eine Auswahlaufgabe mit vier Optionen', async () => {
    render(<Preview params={new URLSearchParams('zeige=aufgabe&typ=choice')} />);
    expect(await screen.findByText('Was bedeutet das?')).toBeTruthy();
    const options = screen.getAllByRole('button').filter((b) => /^\d/.test(b.textContent ?? ''));
    expect(options.length).toBeGreaterThanOrEqual(4);
  });

  it('zeigt den Fortschritt', async () => {
    render(<Preview params={new URLSearchParams('zeige=fortschritt')} />);
    expect(await screen.findByRole('heading', { name: 'Fortschritt' })).toBeTruthy();
  });

  it('rendert bei unbekanntem Wert nichts', () => {
    const { container } = render(<Preview params={new URLSearchParams('zeige=unsinn')} />);
    expect(container.innerHTML).toBe('');
  });
});
