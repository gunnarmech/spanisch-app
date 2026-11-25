import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens, validateSituation } from '../src/content/validate';

const dir = 'content/situations';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];

if (files.length === 0) {
  console.log('keine Inhalte');
  process.exit(0);
}

const errors: string[] = [];
const parsed: { file: string; data: unknown }[] = [];
for (const file of files) {
  try {
    parsed.push({ file, data: JSON.parse(readFileSync(join(dir, file), 'utf8')) });
  } catch (e) {
    errors.push(`${file}: kein gültiges JSON (${(e as Error).message})`);
  }
}

// Wortformen aller Situationen, damit Dialoge Wörter aus früheren Situationen nutzen dürfen.
const knownForms = new Set<string>();
for (const { data } of parsed) {
  const items = (data as { items?: unknown })?.items;
  if (!Array.isArray(items)) continue;
  for (const it of items) {
    if (it && typeof it === 'object' && ((it as any).kind === 'word' || (it as any).kind === 'phrase')) {
      const forms = (it as any).forms;
      if (Array.isArray(forms)) for (const f of forms) if (typeof f === 'string') for (const t of tokens(f)) knownForms.add(t);
    }
  }
}

// Doppelte IDs zwischen Dateien werden bei der jeweils späteren Datei gemeldet.
const allIds = new Set<string>();
for (const { file, data } of parsed) {
  for (const e of validateSituation(data, allIds, knownForms)) errors.push(`${file}: ${e}`);
  const d = data as { id?: unknown; items?: unknown };
  if (typeof d?.id === 'string') allIds.add(d.id);
  if (Array.isArray(d?.items)) {
    for (const it of d.items) if (it && typeof (it as any).id === 'string') allIds.add((it as any).id);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`${errors.length} Fehler in ${files.length} Dateien`);
  process.exit(1);
}
console.log(`${files.length} Situationsdateien ohne Fehler`);
