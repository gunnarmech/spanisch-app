import { useEffect } from 'preact/hooks';
import { play } from '../../media/audio';
import { isTyping, useKey } from './keys';

type Props = { url: string | null; label?: string; primary?: boolean; autoplay?: boolean };

/** Spielt einen Ton. Mit primary reagiert auch die Leertaste (nicht im Textfeld). Ohne url wird nichts gezeigt. */
export function AudioButton({ url, label = 'Anhören', primary = false, autoplay = false }: Props) {
  useEffect(() => {
    if (autoplay && url) void play(url);
  }, [url, autoplay]);
  useKey((e) => {
    if (!primary || !url || e.key !== ' ' || isTyping(e) || (e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    void play(url);
  });
  if (!url) return null;
  return (
    <button type="button" class="btn btn--secondary" onClick={() => void play(url)}>
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
      {label}
    </button>
  );
}
