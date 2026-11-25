import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Task } from '../../engine/round';
import type { Situation } from '../../content/types';

export type RoundEnv = {
  situations: Situation[];
  /** Ton-Adresse für einen Audioschlüssel der Aufgabe, oder null, wenn es keinen Ton gibt. */
  urlFor(task: Task, key: string): string | null;
};

export const RoundEnvContext = createContext<RoundEnv>({ situations: [], urlFor: () => null });

export const useRoundEnv = () => useContext(RoundEnvContext);
