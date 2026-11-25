import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { isTyping, useKey } from './keys';
import type { Answer, TaskResult } from './types';

type Props = {
  question: ComponentChildren;
  options: string[];
  correct: string;
  /** Wird nach der Antwort gezeigt, zum Beispiel die spanische Form. */
  revealed?: ComponentChildren;
  onAnswered?(result: Answer): void;
  onDone(result: TaskResult): void;
};

/** Auswahl aus Antworten per Klick oder Ziffertaste. Falsch gibt es hier ohne zweiten Versuch. */
export function ChoiceBase({ question, options, correct, revealed, onAnswered, onDone }: Props) {
  const start = useRef(Date.now());
  const ms = useRef(0);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (o: string) => {
    if (picked !== null) return;
    ms.current = Date.now() - start.current;
    (document.activeElement as HTMLElement | null)?.blur();
    setPicked(o);
    onAnswered?.({ verdict: o === correct ? 'correct' : 'wrong', ms: ms.current, usedHint: false });
  };
  useKey((e) => {
    if (isTyping(e) || e.repeat) return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) pick(options[n - 1]);
  });

  const ok = picked === correct;
  return (
    <div class="task">
      {question}
      <ol class="options">
        {options.map((o, i) => {
          const state = picked === null ? '' : o === correct ? 'right' : o === picked ? 'wrong' : 'rest';
          return (
            <li key={o}>
              <button type="button" class={`option ${state}`} aria-disabled={picked !== null} onClick={() => pick(o)}>
                <span class="key">{i + 1}</span>
                <span>{o}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {picked !== null && (
        <div class="feedback" role="status">
          <p class={ok ? 'verdict good' : 'verdict bad'}>{ok ? 'Richtig.' : 'Nicht ganz.'}</p>
          {revealed}
          <button
            type="button"
            class="btn btn--primary"
            data-primary
            onClick={() => onDone({ verdict: ok ? 'correct' : 'wrong', ms: ms.current, usedHint: false })}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
