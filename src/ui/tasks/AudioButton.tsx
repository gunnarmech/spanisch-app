import { useEffect } from 'preact/hooks';
import { play } from '../../media/audio';
import { isTyping, useKey } from './keys';

type Props = {
  url: string | null;
  label?: string;
  spaceKey?: boolean;
  autoplay?: boolean;
  /** Der Ton ließ sich nicht laden oder abspielen (nicht: vom Browser nur nicht automatisch erlaubt). */
  onFailed?(): void;
};

/** Spielt einen Ton. Mit spaceKey reagiert auch die Leertaste (nicht im Textfeld). Ohne url wird nichts gezeigt. */
export function AudioButton({ url, label = 'Anhören', spaceKey = false, autoplay = false, onFailed }: Props) {
  const go = async (u: string) => {
    if ((await play(u)) === 'failed') onFailed?.();
  };
  useEffect(() => {
    if (autoplay && url) void go(url);
  }, [url, autoplay]);
  useKey((e) => {
    if (!spaceKey || !url || e.key !== ' ' || isTyping(e) || (e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    void go(url);
  });
  if (!url) return null;
  return (
    <button type="button" class="btn btn--secondary" onClick={() => void go(url)}>
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
      {label}
    </button>
  );
}
