import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { play } from '../../src/media/audio';
import { Dialog } from '../../src/ui/tasks/Dialog';
import { RoundEnvContext } from '../../src/ui/tasks/env';
import type { Task } from '../../src/engine/round';
import type { Item } from '../../src/content/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('spielt den ganzen Dialog über das gemeinsame Audio-Element', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const spy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    queueMicrotask(() => this.dispatchEvent(new Event('ended')));
    return Promise.resolve();
  });
  const item = {
    id: 'd-1',
    kind: 'dialog',
    title: 'Gruß',
    lines: [
      { speaker: 'A', es: 'Hola', de: 'Hallo' },
      { speaker: 'B', es: 'Hola, ¿qué tal?', de: 'Hallo, wie geht es?' },
    ],
  } as Item;
  const env = { situations: [], urlFor: (_t: Task, key: string) => `/${key}.mp3` };
  render(
    <RoundEnvContext.Provider value={env}>
      <Dialog task={{ cardId: 'd-1', situationId: 's' } as Task} item={item} onDone={() => {}} />
    </RoundEnvContext.Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Dialog anhören' }));
  await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  await play('/x.mp3');
  const els = spy.mock.contexts as HTMLAudioElement[];
  expect(new Set(els).size).toBe(1);
});
