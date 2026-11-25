import { useState } from 'preact/hooks';
import { AudioButton } from './AudioButton';
import { ChoiceBase } from './ChoiceBase';
import { choiceOptions } from './distractors';
import { useRoundEnv } from './env';
import { textOf, type TaskProps } from './types';

/** Stufe 0: spanische Form mit Ton sehen, die deutsche Bedeutung wählen. */
export function Choice({ task, item, onAnswered, onDone }: TaskProps) {
  const env = useRoundEnv();
  const text = textOf(item);
  const [options] = useState(() => choiceOptions(item, env.situations, task.situationId));
  if (!text) return null;
  const url = env.urlFor(task, item.id);
  return (
    <ChoiceBase
      question={
        <>
          <p class="ask">Was bedeutet das?</p>
          <p class="spanish big">{text.es}</p>
          <AudioButton url={url} primary />
        </>
      }
      options={options}
      correct={text.de}
      onAnswered={onAnswered}
      onDone={onDone}
    />
  );
}
