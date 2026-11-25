import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { Round } from '../../src/ui/Round';
import { fakeApp } from './fixtures';

vi.mock('../../src/media/audio', async (orig) => ({
  ...(await orig<typeof import('../../src/media/audio')>()),
  prefetchSituations: vi.fn(async () => {}),
}));
import { prefetchSituations } from '../../src/media/audio';

afterEach(cleanup);

it('lädt beim Start einer Runde die Töne der Situation vor', async () => {
  render(<Round app={fakeApp()} onExit={() => {}} onAgain={() => {}} />);
  await screen.findByText('Neu');
  expect(prefetchSituations).toHaveBeenCalledWith(['s1']);
});
