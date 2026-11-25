import { AudioButton } from './AudioButton';
import { useRoundEnv } from './env';
import { TypeBox } from './TypeBox';
import type { TaskProps } from './types';

/** Grammatik-Häppchen: Erklärung (bei neuen offen, sonst einklappbar) und eine Übung zum Eintippen. */
export function Grammar({ task, item, onDone }: TaskProps) {
  const env = useRoundEnv();
  if (item.kind !== 'grammar') return null;
  const n = Number(task.cardId.split('#')[1] ?? 0);
  const ex = item.exercises[n];
  if (!ex) return null;

  const explanation = (
    <>
      <p class="explanation">{item.explanation}</p>
      <ul class="plain examples">
        {item.examples.map((e, i) => (
          <li key={e.es}>
            <span class="spanish">{e.es}</span>
            <span class="german">{e.de}</span>
            <AudioButton url={env.urlFor(task, `${item.id}-ex${i + 1}`)} />
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <TypeBox
      task={task}
      prompt={ex.de}
      targets={[ex.es, ...(ex.accept ?? [])]}
      audioKey={`${item.id}-${n + 1}`}
      context={
        <section class="grammar">
          <h2>{item.title}</h2>
          {task.isNew ? explanation : (
            <details>
              <summary>Erklärung zeigen</summary>
              {explanation}
            </details>
          )}
        </section>
      }
      onDone={onDone}
    />
  );
}
