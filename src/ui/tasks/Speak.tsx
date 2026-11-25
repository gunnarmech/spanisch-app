import { useEffect, useRef, useState } from 'preact/hooks';
import { gradeSpoken, normalize } from '../../engine/grade';
import { play, playSequence } from '../../media/audio';
import { recognize, recordClip, recordingSupported, speechSupported } from '../../media/speech';
import { AudioButton } from './AudioButton';
import { useRoundEnv } from './env';
import { Type } from './Type';
import { textOf, type Answer, type TaskProps } from './types';

type Phase =
  | { name: 'ask'; mode: 'recognize' | 'record' }
  | { name: 'busy' }
  | { name: 'retry'; missing: string[] }
  | { name: 'assess'; clipUrl: string | null }
  | { name: 'result'; verdict: Answer['verdict']; missing: string[]; ms: number; usedHint: boolean }
  | { name: 'type' };

/** Das Ziel, das am besten zur Aussage passt (erstes mit ok, sonst mit den wenigsten fehlenden Wörtern). */
function bestSpoken(transcript: string, targets: string[]) {
  const graded = targets.map((t) => ({ target: t, ...gradeSpoken(transcript, t) }));
  return graded.find((g) => g.ok) ?? graded.reduce((a, b) => (b.missing.length < a.missing.length ? b : a));
}

function Missing({ target, missing }: { target: string; missing: string[] }) {
  return (
    <p class="spanish solution">
      {normalize(target)
        .split(' ')
        .map((w, i) => (
          <>
            {i > 0 && ' '}
            {missing.includes(w) ? <mark key={i}>{w}</mark> : w}
          </>
        ))}
    </p>
  );
}

/** Stufe 3: Deutsch sehen, Spanisch sprechen. Ohne Erkennung Selbstbewertung, ohne Mikrofon Tippen. */
export function Speak(props: TaskProps) {
  const { task, item, onAnswered, onDone } = props;
  const env = useRoundEnv();
  const text = textOf(item);
  const start = useRef(Date.now());
  const reported = useRef(false);
  const finished = useRef(false);
  const attempts = useRef(0);
  const [phase, setPhase] = useState<Phase>(() => ({
    name: 'ask',
    mode: speechSupported() ? 'recognize' : 'record',
  }));
  const [canRecord] = useState(recordingSupported);
  const unavailable = phase.name === 'type' || (phase.name === 'ask' && phase.mode === 'record' && !canRecord);
  const url = text ? env.urlFor(task, item.id) : null;
  const clipUrl = phase.name === 'assess' ? phase.clipUrl : null;

  // Die Aufnahme-Adresse beim Verlassen freigeben.
  const clipRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    },
    [],
  );

  if (!text) return null;
  if (unavailable) {
    return (
      <>
        <p class="hint" role="status">
          Mikrofon nicht verfügbar
        </p>
        <Type {...props} />
      </>
    );
  }

  const report = (a: Answer) => {
    if (reported.current) return false;
    reported.current = true;
    onAnswered?.(a);
    return true;
  };

  const targets = [text.es, ...text.accept];

  const record = async () => {
    setPhase({ name: 'busy' });
    const blob = await recordClip();
    if (!blob) {
      setPhase({ name: 'type' });
      return;
    }
    const clip = URL.createObjectURL(blob);
    clipRef.current = clip;
    setPhase({ name: 'assess', clipUrl: clip });
  };

  const speak = async () => {
    if (phase.name === 'ask' && phase.mode === 'record') {
      await record();
      return;
    }
    setPhase({ name: 'busy' });
    const transcript = await recognize();
    if (transcript === null) {
      // Keine Fehlermeldung: stillschweigend weiter mit der Aufnahme
      if (recordingSupported()) {
        await record();
      } else {
        setPhase({ name: 'type' });
      }
      return;
    }
    attempts.current += 1;
    const best = bestSpoken(transcript, targets);
    const ms = Date.now() - start.current;
    const usedHint = attempts.current > 1;
    if (best.ok) {
      report({ verdict: 'correct', ms, usedHint });
      setPhase({ name: 'result', verdict: 'correct', missing: [], ms, usedHint });
    } else if (attempts.current === 1) {
      setPhase({ name: 'retry', missing: best.missing });
    } else {
      report({ verdict: 'wrong', ms, usedHint });
      setPhase({ name: 'result', verdict: 'wrong', missing: best.missing, ms, usedHint });
    }
  };

  const assess = (verdict: Answer['verdict']) => {
    const ms = Date.now() - start.current;
    if (!report({ verdict, ms, usedHint: false })) return;
    onDone({ verdict, ms, usedHint: false });
  };

  return (
    <div class="task">
      <p class="ask">Sag das auf Spanisch.</p>
      <p class="german big">{text.de}</p>
      {(phase.name === 'ask' || phase.name === 'busy' || phase.name === 'retry') && (
        <div class="speaking">
          {phase.name === 'retry' && (
            <>
              <p class="hint" role="status">
                Noch einmal. Diese Wörter fehlten:
              </p>
              <Missing target={text.es} missing={phase.missing} />
            </>
          )}
          <button type="button" class="btn btn--primary" data-primary disabled={phase.name === 'busy'} onClick={() => void speak()}>
            sprechen
          </button>
          {phase.name === 'busy' && <p class="hint" role="status">Ich höre zu.</p>}
        </div>
      )}
      {phase.name === 'assess' && (
        <div class="feedback" role="status">
          <p class="spanish solution">{text.es}</p>
          <AudioButton url={url} label="Original anhören" />
          {clipUrl && (
            <>
              <button type="button" class="btn btn--secondary" onClick={() => void play(clipUrl)}>
                Deine Aufnahme anhören
              </button>
              <button
                type="button"
                class="btn btn--secondary"
                onClick={() => void playSequence([url, clipUrl].filter((u): u is string => !!u))}
              >
                beide anhören
              </button>
            </>
          )}
          <button type="button" class="btn btn--primary" onClick={() => assess('correct')}>
            klang gleich
          </button>
          <button type="button" onClick={() => assess('wrong')}>
            eher nicht
          </button>
        </div>
      )}
      {phase.name === 'result' && (
        <div class="feedback" role="status">
          <p class={phase.verdict === 'correct' ? 'verdict good' : 'verdict bad'}>
            {phase.verdict === 'correct' ? 'Richtig.' : 'Nicht ganz. Richtig ist:'}
          </p>
          {phase.verdict === 'wrong' ? <Missing target={text.es} missing={phase.missing} /> : <p class="spanish solution">{text.es}</p>}
          <AudioButton url={url} primary autoplay />
          <button
            type="button"
            class="btn btn--primary"
            data-primary
            onClick={() => {
              if (finished.current) return;
              finished.current = true;
              onDone({ verdict: phase.verdict, ms: phase.ms, usedHint: phase.usedHint });
            }}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
