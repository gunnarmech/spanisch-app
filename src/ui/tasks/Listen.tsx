import { useState } from 'preact/hooks';
import { AudioButton } from './AudioButton';
import { ChoiceBase } from './ChoiceBase';
import { choiceOptions } from './distractors';
import { useRoundEnv } from './env';
import { textOf, type TaskProps } from './types';

function shuffled<T>(xs: T[]): T[] {
  return [...xs].sort(() => Math.random() - 0.5);
}

/** Hören ohne Text. Wörter und Sätze: Bedeutung wählen. Hörpaare: das gehörte Wort wählen. */
export function Listen({ task, item, onAnswered, onDone }: TaskProps) {
  const env = useRoundEnv();
  const [options] = useState(() =>
    item.kind === 'pair' ? shuffled(item.options) : choiceOptions(item, env.situations, task.situationId),
  );

  if (item.kind === 'pair') {
    const url = env.urlFor(task, `${item.id}-opt${item.options.indexOf(item.es) + 1}`);
    return (
      <ChoiceBase
        question={
          <>
            <p class="ask">Welches Wort hörst du?</p>
            <AudioButton url={url} primary autoplay />
          </>
        }
        options={options}
        correct={item.es}
        onAnswered={onAnswered}
      onDone={onDone}
      />
    );
  }

  const text = textOf(item);
  if (!text) return null;
  const url = env.urlFor(task, item.id);
  const pressure = task.form === 'pressure';
  return (
    <ChoiceBase
      question={
        <>
          <p class="ask">Was bedeutet das?</p>
          {url ? <AudioButton url={url} primary autoplay /> : <p class="spanish">{text.es}</p>}
        </>
      }
      options={options}
      correct={text.de}
      revealed={
        <>
          <p class="spanish">{text.es}</p>
          {pressure && <AudioButton url={url} label="Nochmal anhören" />}
        </>
      }
      onAnswered={onAnswered}
      onDone={onDone}
    />
  );
}
