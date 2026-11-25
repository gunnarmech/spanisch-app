import { Listen } from './Listen';
import type { TaskProps } from './types';

/**
 * Hören unter Druck ist Listen ohne Text. Schnelles Tempo und chilenische Stimme wählt die Tonauflösung
 * der Runde anhand von task.form === 'pressure'.
 */
export function Pressure(props: TaskProps) {
  return <Listen {...props} />;
}
