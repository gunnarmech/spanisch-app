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
    <button type="button" class="audio" onClick={() => void play(url)}>
      {label}
    </button>
  );
}
