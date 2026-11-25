import { useEffect, useRef, useState } from 'preact/hooks';
import { AudioButton } from './AudioButton';
import { useRoundEnv } from './env';
import type { TaskProps } from './types';

type Phase = 'hear' | 'text' | 'lines';

/** Spielt Töne nacheinander mit einem eigenen Element. Gibt eine Abbruchfunktion zurück. */
function playSequence(urls: string[]): () => void {
  const audio = new Audio();
  let i = 0;
  let stopped = false;
  const next = () => {
    if (stopped || i >= urls.length) return;
    audio.src = urls[i++];
    audio.play().catch((err) => console.warn('Audio konnte nicht abgespielt werden', err));
  };
  audio.addEventListener('ended', next);
  next();
  return () => {
    stopped = true;
    audio.pause();
  };
}

/** Dialog: erst nur Ton, dann Text einblendbar, dann Zeile für Zeile. Kein Rating. */
export function Dialog({ task, item, onAnswered, onDone }: TaskProps) {
  const env = useRoundEnv();
  const [phase, setPhase] = useState<Phase>('hear');
  const [line, setLine] = useState(0);
  const [showDe, setShowDe] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  if (item.kind !== 'dialog') return null;

  const urls = item.lines.map((_, i) => env.urlFor(task, `${item.id}-${i + 1}`));
  const available = urls.filter((u): u is string => !!u);
  const hearAll = () => {
    stop.current?.();
    stop.current = playSequence(available);
  };
  const done = () => {
    onAnswered?.({ verdict: 'correct', ms: 0, usedHint: false });
    onDone({ verdict: 'correct', ms: 0, usedHint: false });
  };

  if (phase === 'hear') {
    return (
      <div class="task">
        <p class="ask">{item.title}</p>
        <p class="german">Hör zu, ohne mitzulesen.</p>
        {available.length > 0 && (
          <button type="button" class="primary" onClick={hearAll}>
            Dialog anhören
          </button>
        )}
        <button type="button" class="secondary" data-primary onClick={() => setPhase('text')}>
          Text zeigen
        </button>
      </div>
    );
  }

  if (phase === 'text') {
    return (
      <div class="task">
        <p class="ask">{item.title}</p>
        <ul class="plain dialog">
          {item.lines.map((l, i) => (
            <li key={i} class={`speaker-${l.speaker}`}>
              <span class="spanish">{l.es}</span>
              {showDe && <span class="german">{l.de}</span>}
              <AudioButton url={urls[i]} />
            </li>
          ))}
        </ul>
        <button type="button" class="link" onClick={() => setShowDe(!showDe)}>
          {showDe ? 'Übersetzung ausblenden' : 'Übersetzung einblenden'}
        </button>
        <button type="button" class="primary" data-primary onClick={() => setPhase('lines')}>
          Zeile für Zeile
        </button>
      </div>
    );
  }

  const l = item.lines[line];
  const last = line === item.lines.length - 1;
  return (
    <div class="task">
      <p class="ask">{item.title}</p>
      <p class="spanish big">{l.es}</p>
      <p class="german">{l.de}</p>
      <AudioButton url={urls[line]} primary autoplay />
      <button
        type="button"
        class="primary"
        data-primary
        onClick={() => (last ? done() : setLine(line + 1))}
      >
        {last ? 'Fertig' : 'Nächste Zeile'}
      </button>
    </div>
  );
}
