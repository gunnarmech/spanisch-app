import { TypeBox } from './TypeBox';
import { textOf, type TaskProps } from './types';

/** Stufe 2 (und vorläufig 3): deutsche Bedeutung sehen, Spanisch tippen. Task 9 ersetzt Stufe 3 durch Speak. */
export function Type({ task, item, onAnswered, onDone }: TaskProps) {
  const text = textOf(item);
  if (!text) return null;
  return (
    <TypeBox
      task={task}
      prompt={text.de}
      targets={[text.es, ...text.accept]}
      audioKey={item.id}
      onAnswered={onAnswered}
      onDone={onDone}
    />
  );
}
