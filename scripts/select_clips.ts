// Kandidaten für "Chile hören" aus den SLR71-Zeilenindizes (Bauzeit, nicht in der App).
// Aufruf: npm run select:clips -- <slr71-ordner> <ausgabedatei>
// Jeder Kandidat besteht validateClips (gleiche Regeln wie check:content).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tokens, validateClips } from '../src/content/validate';
import type { ChileClip } from '../src/content/types';

export type Candidate = Omit<ChileClip, 'de'> & { de: string };

/** clf_09334_01278378087 wird clip-09334-01278378087; Geschlecht aus dem Präfix. */
export function clipFromSource(source: string): { id: string; gender: 'f' | 'm' } | null {
  const m = /^cl([fm])_(.+)$/.exec(source);
  if (!m) return null;
  return { id: `clip-${m[2].replace(/_/g, '-')}`, gender: m[1] as 'f' | 'm' };
}

/** Leerzeichen vor Satzzeichen entfernen, Ränder kürzen. */
export function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\s+([?!.,;:])/g, '$1').trim();
}

export function knownFormsFromDir(dir: string): { forms: Set<string>; ids: Set<string> } {
  const forms = new Set<string>();
  const ids = new Set<string>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (typeof data.id === 'string') ids.add(data.id);
    for (const it of data.items ?? []) {
      if (typeof it.id === 'string') ids.add(it.id);
      if (it.kind === 'word' || it.kind === 'phrase') {
        for (const form of it.forms ?? []) for (const t of tokens(form)) forms.add(t);
      }
    }
  }
  return { forms, ids };
}

/** Wählt aus (Datei-ID, Text)-Zeilen die gültigen, nach Text eindeutigen Kandidaten. */
export function selectCandidates(
  rows: { source: string; text: string }[],
  ids: Set<string>,
  forms: Set<string>,
): Candidate[] {
  const groups = new Map<string, Candidate[]>();
  for (const { source, text } of rows) {
    const meta = clipFromSource(source);
    if (!meta) continue;
    const es = cleanText(text);
    const cand: Candidate = { id: meta.id, es, de: '-', gender: meta.gender, source };
    if (validateClips({ clips: [cand] }, ids, forms).length > 0) continue;
    const key = tokens(es).join(' ');
    const g = groups.get(key) ?? [];
    g.push(cand);
    groups.set(key, g);
  }
  // Gleiche Texte nur einmal; bei Wahl zwischen Frau und Mann abwechselnd.
  const out: Candidate[] = [];
  let preferF = true;
  for (const g of groups.values()) {
    const f = g.find((c) => c.gender === 'f');
    const m = g.find((c) => c.gender === 'm');
    let pick: Candidate;
    if (f && m) {
      pick = preferF ? f : m;
      preferF = !preferF;
    } else pick = g[0];
    out.push(pick);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function readIndex(file: string): { source: string; text: string }[] {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('\t');
      return { source: l.slice(0, i), text: l.slice(i + 1) };
    });
}

const isMain = process.argv[1] !== undefined && basename(process.argv[1]) === 'select_clips.ts';
if (isMain) {
  const [dir, outFile] = process.argv.slice(2);
  if (!dir || !outFile) {
    console.error('Aufruf: npm run select:clips -- <slr71-ordner> <ausgabedatei>');
    process.exit(1);
  }
  const rows: { source: string; text: string }[] = [];
  for (const f of ['line_index_female.tsv', 'line_index_male.tsv']) {
    const p = join(dir, f);
    if (!existsSync(p)) {
      console.error(`${p} fehlt`);
      process.exit(1);
    }
    rows.push(...readIndex(p));
  }
  const { forms, ids } = knownFormsFromDir('content/situations');
  const cands = selectCandidates(rows, ids, forms);
  writeFileSync(outFile, JSON.stringify({ clips: cands }, null, 1), 'utf8');
  const nf = cands.filter((c) => c.gender === 'f').length;
  console.log(`${rows.length} Zeilen, ${cands.length} Kandidaten (f ${nf}, m ${cands.length - nf}) nach ${outFile}`);
}
