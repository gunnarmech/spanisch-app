import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { gradeTyped, normalize, type GradeResult } from '../../engine/grade';
import type { Task } from '../../engine/round';
import { AudioButton } from './AudioButton';
import { useRoundEnv } from './env';
import type { Answer, TaskResult } from './types';

type Props = {
  task: Task;
  /** Was übersetzt werden soll. */
  prompt: string;
  /** Die erste Form ist die Lösung, die weiteren sind erlaubte Varianten. */
  targets: string[];
  audioKey: string;
  context?: ComponentChildren;
  onAnswered?(result: Answer): void;
  onDone(result: TaskResult): void;
};

type Outcome = { verdict: GradeResult['verdict']; marks: GradeResult['marks']; usedHint: boolean; ms: number; target: string };

/** Die Zielform, zu der die Eingabe am besten passt (Positionen in marks beziehen sich auf sie). */
function bestTarget(input: string, targets: string[]): string {
  const all = JSON.stringify(gradeTyped(input, targets));
  return targets.find((t) => JSON.stringify(gradeTyped(input, [t])) === all) ?? targets[0];
}

/** Zeigt die normalisierte Zielform mit den abweichenden Stellen hervorgehoben. */
function Marked({ target, marks }: { target: string; marks: GradeResult['marks'] }) {
  const t = normalize(target);
  const parts: ComponentChildren[] = [];
  let at = 0;
  for (const m of marks) {
    if (m.index > at) parts.push(t.slice(at, m.index));
    parts.push(<mark key={m.index}>{t.slice(m.index, m.index + m.length)}</mark>);
    at = m.index + m.length;
  }
  parts.push(t.slice(at));
  return <p class="spanish solution">{parts}</p>;
}

export const hintFor = (target: string) =>
  normalize(target)
    .split(' ')
    .map((w) => `${w[0]}…`)
    .join(' ');

const MESSAGE: Record<GradeResult['verdict'], string> = {
  correct: 'Richtig.',
  accent: 'Richtig. Achte auf die Akzente:',
  typo: 'Fast richtig. Ein Tippfehler:',
  wrong: 'Nicht ganz. Richtig ist:',
};

/** Eintippen mit Rückmeldung. Bei falscher Eingabe erst ein Hinweis und ein zweiter Versuch, dann die Lösung. */
export function TypeBox({ task, prompt, targets, audioKey, context, onAnswered, onDone }: Props) {
  const env = useRoundEnv();
  const start = useRef(Date.now());
  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const url = env.urlFor(task, audioKey);

  const submit = (e: Event) => {
    e.preventDefault();
    if (!value.trim()) return;
    const ms = Date.now() - start.current;
    const r = gradeTyped(value, targets);
    const target = bestTarget(value, targets);
    if (r.verdict === 'wrong' && hint === null) {
      setHint(hintFor(targets[0]));
      setValue('');
      return;
    }
    setOutcome({ verdict: r.verdict, marks: r.marks, usedHint: hint !== null, ms, target });
    onAnswered?.({ verdict: r.verdict, ms, usedHint: hint !== null });
  };

  return (
    <div class="task">
      <p class="ask">Wie sagt man das auf Spanisch?</p>
      <p class="german big">{prompt}</p>
      {context}
      {outcome === null ? (
        <form class="typing" onSubmit={submit}>
          {hint !== null && (
            <p class="hint" role="status">
              Hinweis: {hint} Versuch es noch einmal.
            </p>
          )}
          <input
            class="field"
            type="text"
            lang="es"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellcheck={false}
            autoComplete="off"
            aria-label="Deine Antwort auf Spanisch"
          />
          <button type="submit" class="btn btn--primary">
            Prüfen
          </button>
        </form>
      ) : (
        <div class="feedback" role="status">
          <p class={outcome.verdict === 'correct' ? 'verdict good' : outcome.verdict === 'wrong' ? 'verdict bad' : 'verdict near'}>
            {MESSAGE[outcome.verdict]}
          </p>
          {outcome.verdict === 'accent' || outcome.verdict === 'typo' ? (
            <Marked target={outcome.target} marks={outcome.marks} />
          ) : (
            <p class="spanish solution">{outcome.verdict === 'correct' ? outcome.target : targets[0]}</p>
          )}
          <AudioButton url={url} spaceKey autoplay />
          <button
            type="button"
            class="btn btn--primary"
            data-primary
            onClick={() => onDone({ verdict: outcome.verdict, ms: outcome.ms, usedHint: outcome.usedHint })}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
