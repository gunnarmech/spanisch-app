import { useEffect, useState } from 'preact/hooks';
import type { ChileClip } from '../../content/types';
import { tokens } from '../../content/validate';
import { stopAudio } from '../../media/audio';
import { AudioButton } from './AudioButton';
import { ChoiceBase } from './ChoiceBase';
import type { Answer, TaskResult } from './types';

type Props = {
  clip: ChileClip;
  clips: ChileClip[];
  url: string | null;
  onAnswered?(result: Answer): void;
  onDone(result: TaskResult): void;
};

function shuffled<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Drei deutsche Bedeutungen: die richtige und zwei von anderen Clips, deren Tokenzahl der des Clips
 * am nächsten kommt (Gleichstand: Dateireihenfolge, damit die Wahl stabil bleibt). Nur die Reihenfolge ist zufällig.
 */
export function clipOptions(clip: ChileClip, clips: ChileClip[], rand: () => number = Math.random): string[] {
  const n = tokens(clip.es).length;
  const others = clips
    .map((c, i) => ({ c, i, d: Math.abs(tokens(c.es).length - n) }))
    .filter((x) => x.c.id !== clip.id && x.c.de !== clip.de)
    .sort((a, b) => a.d - b.d || a.i - b.i);
  const chosen: string[] = [];
  for (const x of others) {
    if (chosen.length >= 2) break;
    if (!chosen.includes(x.c.de)) chosen.push(x.c.de);
  }
  return shuffled([clip.de, ...chosen], rand);
}

/** Echte Aufnahme aus Chile: erst nur hören, dann die Bedeutung wählen, danach Text und Übersetzung. */
export function ClipTask({ clip, clips, url, onAnswered, onDone }: Props) {
  const [options] = useState(() => clipOptions(clip, clips));
  useEffect(() => () => stopAudio(), []);
  return (
    <ChoiceBase
      question={
        <>
          <p class="ask">Chile hören</p>
          <p class="german">Echte Aufnahme aus Chile</p>
          <AudioButton url={url} spaceKey autoplay />
        </>
      }
      options={options}
      correct={clip.de}
      revealed={
        <>
          <p class="spanish">{clip.es}</p>
          <p class="german">{clip.de}</p>
          <AudioButton url={url} label="Nochmal hören" />
        </>
      }
      onAnswered={onAnswered}
      onDone={onDone}
    />
  );
}
