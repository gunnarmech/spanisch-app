import { AudioButton } from './AudioButton';
import { useRoundEnv } from './env';
import type { TaskProps } from './types';

/** Erstkontakt: Form, Bedeutung, Ton, Beispiele. Kein Rating. */
export function Intro({ task, item, onDone }: TaskProps) {
  const env = useRoundEnv();
  const go = (
    <button
      type="button"
      class="primary"
      data-primary
      onClick={() => onDone({ verdict: 'correct', ms: 0, usedHint: false })}
    >
      Weiter
    </button>
  );

  if (item.kind === 'pair') {
    return (
      <div class="task">
        <p class="ask">Diese Wörter klingen ähnlich. Hör genau hin.</p>
        <ul class="plain">
          {item.options.map((o, i) => (
            <li key={o} class="lineup">
              <span class="spanish">{o}</span>
              <AudioButton url={env.urlFor(task, `${item.id}-opt${i + 1}`)} primary={i === 0} />
            </li>
          ))}
        </ul>
        {go}
      </div>
    );
  }
  if (item.kind !== 'word' && item.kind !== 'phrase' && item.kind !== 'sentence') return null;

  const examples = item.kind === 'sentence' ? [] : item.examples;
  return (
    <div class="task">
      <p class="ask">Neu</p>
      <p class="spanish big">{item.es}</p>
      <p class="german">{item.de}</p>
      <AudioButton url={env.urlFor(task, item.id)} primary autoplay />
      {item.kind !== 'sentence' && item.note && <p class="note">{item.note}</p>}
      {item.kind !== 'sentence' && item.chile && <p class="note">In Chile: {item.chile.note}</p>}
      {examples.length > 0 && (
        <ul class="plain examples">
          {examples.map((ex, i) => (
            <li key={ex.es}>
              <span class="spanish">{ex.es}</span>
              <span class="german">{ex.de}</span>
              <AudioButton url={env.urlFor(task, `${item.id}-ex${i + 1}`)} />
            </li>
          ))}
        </ul>
      )}
      {go}
    </div>
  );
}
