import { render } from '@testing-library/preact';
import { expect, test } from 'vitest';
import { allPhotos } from '../../src/ui/photos';
import { Sources } from '../../src/ui/Sources';
import { fakeApp } from './fixtures';

function app() {
  return fakeApp({ db: { allReports: async () => [] } as never });
}

test('Quellenseite nennt den Chile-Korpus SLR71 mit Lizenz, Link und Bearbeitung', async () => {
  const { container } = render(<Sources app={app()} onBack={() => {}} />);
  expect(container.textContent).toContain('Crowdsourced high-quality Chilean Spanish speech data set');
  expect(container.textContent).toContain('CC BY-SA 4.0');
  expect(container.textContent).toContain('gekürzt, normalisiert und in mp3 umgewandelt');
  const link = container.querySelector('a[href="https://www.openslr.org/71/"]');
  expect(link).not.toBeNull();
});

test('Quellenseite führt für jedes Foto einen Nachweis', () => {
  const { container } = render(<Sources app={app()} onBack={() => {}} />);
  for (const p of allPhotos) {
    expect(container.querySelector(`a[href="${p.page}"]`), p.page).not.toBeNull();
  }
});
