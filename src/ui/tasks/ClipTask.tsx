import { useEffect, useRef, useState } from 'preact/hooks';
import type { ChileClip } from '../../content/types';
import { tokens } from '../../content/validate';
import { stopAudio } from '../../media/audio';
import { AudioButton } from './AudioButton';
import { ChoiceBase } from './ChoiceBase';
import type { Answer, TaskResult } from './types';

type Props = {
  clip: ChileClip;
  clips: ChileClip[];
  /** Zufallsquelle für die Ablenker, im Test steuerbar. */
  rand?: () => number;
  url: string | null;
  /** Der Ton ließ sich vor der Antwort nicht laden oder abspielen: die Aufgabe ist nicht lösbar. */
  onUnplayable?(): void;
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

/** Größter Unterschied in der Wortzahl, aus dem zunächst Ablenker gezogen werden. */
const START_GAP = 2;

/**
 * Drei deutsche Bedeutungen: die richtige und zwei von anderen Clips, deren Wortzahl höchstens
 * START_GAP von der des Clips abweicht. Gibt es dort zu wenige, wächst der Abstand schrittweise.
 * Gezogen wird zufällig, damit nicht immer dieselben Ablenker kommen; die Reihenfolge ist ebenfalls zufällig.
 */
export function clipOptions(clip: ChileClip, clips: ChileClip[], rand: () => number = Math.random): string[] {
  const n = tokens(clip.es).length;
  const others = clips
    .filter((c) => c.id !== clip.id && c.de !== clip.de)
    .map((c) => ({ de: c.de, d: Math.abs(tokens(c.es).length - n) }));
  const maxGap = others.reduce((m, x) => Math.max(m, x.d), 0);
  let pool: string[] = [];
  for (let gap = START_GAP; gap <= Math.max(maxGap, START_GAP); gap++) {
    pool = [...new Set(others.filter((x) => x.d <= gap).map((x) => x.de))];
    if (pool.length >= 2) break;
  }
  return shuffled([clip.de, ...shuffled(pool, rand).slice(0, 2)], rand);
}

/** Echte Aufnahme aus Chile: erst nur hören, dann die Bedeutung wählen, danach Text und Übersetzung. */
export function ClipTask({ clip, clips, rand, url, onUnplayable, onAnswered, onDone }: Props) {
  const [options] = useState(() => clipOptions(clip, clips, rand));
  const answeredRef = useRef(false);
  useEffect(() => () => stopAudio(), []);
  return (
    <ChoiceBase
      question={
        <>
          <p class="ask">Chile hören</p>
          <p class="german">Echte Aufnahme aus Chile</p>
          <AudioButton url={url} spaceKey autoplay onFailed={() => !answeredRef.current && onUnplayable?.()} />
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
      onAnswered={(r) => {
        answeredRef.current = true;
        onAnswered?.(r);
      }}
      onDone={onDone}
    />
  );
}
