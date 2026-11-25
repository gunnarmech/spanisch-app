export type GradeResult = {
  verdict: 'correct' | 'accent' | 'typo' | 'wrong';
  /** Abweichende Stellen als Positionen in der normalisierten Zielform. */
  marks: { index: number; length: number }[];
};

export function normalize(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ohne diakritische Zeichen (ñ wird zu n). Die Laenge bleibt gleich. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

/** Levenshtein-Abstand samt Positionen der Zielform, die nicht getroffen wurden. */
function align(input: string, target: string): { distance: number; marks: number[] } {
  const n = input.length;
  const m = target.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => [i, ...new Array<number>(m).fill(0)]);
  for (let j = 1; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = d[i - 1][j - 1] + (input[i - 1] === target[j - 1] ? 0 : 1);
      d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const marks: number[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (input[i - 1] === target[j - 1] ? 0 : 1)) {
      if (input[i - 1] !== target[j - 1]) marks.push(j - 1);
      i--;
      j--;
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
      marks.push(j - 1); // Zeichen fehlt in der Eingabe
      j--;
    } else {
      marks.push(Math.min(j, m - 1)); // Zeichen zu viel in der Eingabe: Nachbarstelle markieren
      i--;
    }
  }
  return { distance: d[n][m], marks: marks.sort((a, b) => a - b) };
}

function toRuns(positions: number[]): { index: number; length: number }[] {
  const runs: { index: number; length: number }[] = [];
  for (const p of [...new Set(positions)].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && last.index + last.length === p) last.length++;
    else runs.push({ index: p, length: 1 });
  }
  return runs;
}

const RANK = { correct: 0, accent: 1, typo: 2, wrong: 3 } as const;

function gradeOne(input: string, target: string): { result: GradeResult; distance: number } {
  const a = normalize(input);
  const t = normalize(target);
  if (a === t) return { result: { verdict: 'correct', marks: [] }, distance: 0 };

  const as = stripDiacritics(a);
  const ts = stripDiacritics(t);
  if (as === ts) {
    const diff: number[] = [];
    for (let k = 0; k < t.length; k++) if (a[k] !== t[k]) diff.push(k);
    return { result: { verdict: 'accent', marks: toRuns(diff) }, distance: 0 };
  }

  const { distance, marks } = align(as, ts);
  const verdict = distance === 1 && ts.length >= 4 ? 'typo' : 'wrong';
  return { result: { verdict, marks: toRuns(marks) }, distance };
}

export function gradeTyped(input: string, targets: string[]): GradeResult {
  let best: { result: GradeResult; distance: number } | undefined;
  for (const target of targets) {
    const cur = gradeOne(input, target);
    if (
      !best ||
      RANK[cur.result.verdict] < RANK[best.result.verdict] ||
      (cur.result.verdict === best.result.verdict && cur.distance < best.distance)
    ) {
      best = cur;
    }
  }
  return best?.result ?? { verdict: 'wrong', marks: [] };
}

export function gradeSpoken(transcript: string, target: string): { ok: boolean; missing: string[] } {
  const said = new Set(stripDiacritics(normalize(transcript)).split(' ').filter(Boolean));
  const words = normalize(target).split(' ').filter(Boolean);
  const absent = words.filter((w) => !said.has(stripDiacritics(w)));
  const missing = absent.filter((w) => w.length > 3);
  const ok = absent.length * 5 <= words.length && missing.length <= 1;
  return { ok, missing };
}
