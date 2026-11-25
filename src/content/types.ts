export type Example = { es: string; de: string };

export type WordItem = {
  id: string;
  kind: 'word' | 'phrase';
  es: string;
  de: string;
  accept?: string[];
  /** Alle Formen, die in Dialogen vorkommen dürfen (normalisiert verglichen). */
  forms: string[];
  examples: Example[];
  note?: string;
  chile?: { note: string; source: string };
  freqRank?: number;
};

export type SentenceItem = { id: string; kind: 'sentence'; es: string; de: string; accept?: string[] };

export type DialogItem = {
  id: string;
  kind: 'dialog';
  title: string;
  lines: { speaker: 'A' | 'B'; es: string; de: string }[];
};

export type GrammarItem = {
  id: string;
  kind: 'grammar';
  title: string;
  explanation: string;
  examples: Example[];
  exercises: { de: string; es: string; accept?: string[] }[];
};

/** es ist die richtige Option, options enthält es. */
export type PairItem = { id: string; kind: 'pair'; es: string; options: string[] };

export type Item = WordItem | SentenceItem | DialogItem | GrammarItem | PairItem;

export type Situation = { id: string; order: number; title: string; items: Item[] };
