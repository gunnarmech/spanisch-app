import { normalize } from '../engine/grade';
import type { Item, Situation } from './types';

const ID_RE = /^[a-z0-9-]+$/;
const MAX_EXPLANATION = 600;

/** Peninsularismen, nur als ganzes Wort und ohne Diakritika verglichen. */
const BANNED = new Set([
  'vosotros',
  'vosotras',
  'os',
  'ordenador',
  'zumo',
  'movil',
  'coger',
  'coche',
  'habeis',
  'teneis',
  'estais',
  'sois',
  'vais',
]);

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

/** Wörter eines spanischen Textes, normalisiert (Diakritika bleiben erhalten). */
export function tokens(es: string): string[] {
  return normalize(es).split(' ').filter(Boolean);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function isExample(v: unknown): boolean {
  return isObj(v) && isStr(v.es) && isStr(v.de);
}

/**
 * Prüft eine Situation und gibt die Fehlerliste zurück (leer = gut).
 * allIds: IDs aus bereits geprüften anderen Situationen.
 * knownForms: normalisierte Wortformen aller Situationen; ohne Angabe zählen nur die der eigenen.
 */
export function validateSituation(s: unknown, allIds: Set<string>, knownForms?: Set<string>): string[] {
  const errors: string[] = [];
  if (!isObj(s)) return ['Situation ist kein Objekt'];

  const sid = isStr(s.id) ? s.id : '(ohne id)';
  if (!isStr(s.id) || !ID_RE.test(s.id)) errors.push(`${sid}: ungültige Situations-ID`);
  else if (allIds.has(s.id)) errors.push(`${sid}: doppelte ID`);
  if (typeof s.order !== 'number') errors.push(`${sid}: order fehlt`);
  if (!isStr(s.title)) errors.push(`${sid}: title fehlt`);
  if (!Array.isArray(s.items)) return [...errors, `${sid}: items fehlt`];

  const seen = new Set<string>();
  const ownForms = new Set<string>();
  const dialogs: { id: string; es: string }[] = [];
  const spanish: { where: string; text: string }[] = [];

  const addEs = (where: string, v: unknown) => {
    if (typeof v === 'string') spanish.push({ where, text: v });
  };
  const addEsList = (where: string, v: unknown) => {
    if (Array.isArray(v)) v.forEach((x) => addEs(where, x));
  };

  for (const raw of s.items as unknown[]) {
    if (!isObj(raw)) {
      errors.push(`${sid}: Item ist kein Objekt`);
      continue;
    }
    const id = isStr(raw.id) ? raw.id : '(ohne id)';
    const bad = (msg: string) => errors.push(`${id}: ${msg}`);

    if (!isStr(raw.id) || !ID_RE.test(raw.id)) bad('ungültige ID');
    else if (allIds.has(raw.id) || seen.has(raw.id)) bad('doppelte ID');
    else seen.add(raw.id);

    switch (raw.kind) {
      case 'word':
      case 'phrase': {
        if (!isStr(raw.es)) bad('es fehlt');
        if (!isStr(raw.de)) bad('de fehlt');
        if (raw.produce !== undefined && raw.produce !== false) bad('produce darf nur false sein');
        if (!isStrArr(raw.forms) || raw.forms.length === 0) bad('forms fehlt');
        else for (const f of raw.forms) for (const t of tokens(f)) ownForms.add(t);
        if (!Array.isArray(raw.examples) || !raw.examples.every(isExample)) bad('examples ungültig');
        if (raw.accept !== undefined && !isStrArr(raw.accept)) bad('accept ungültig');
        addEs(id, raw.es);
        addEsList(id, raw.accept);
        addEsList(id, raw.forms);
        if (Array.isArray(raw.examples)) raw.examples.forEach((e) => isObj(e) && addEs(id, e.es));
        break;
      }
      case 'sentence': {
        if (!isStr(raw.es)) bad('es fehlt');
        if (!isStr(raw.de)) bad('de fehlt');
        if (raw.produce !== undefined && raw.produce !== false) bad('produce darf nur false sein');
        if (raw.accept !== undefined && !isStrArr(raw.accept)) bad('accept ungültig');
        addEs(id, raw.es);
        addEsList(id, raw.accept);
        break;
      }
      case 'dialog': {
        if (!isStr(raw.title)) bad('title fehlt');
        const lines = raw.lines;
        if (!Array.isArray(lines) || lines.length < 4 || lines.length > 10) {
          bad('Dialog braucht 4 bis 10 Zeilen');
          break;
        }
        for (const line of lines) {
          if (!isObj(line) || (line.speaker !== 'A' && line.speaker !== 'B') || !isStr(line.es) || !isStr(line.de)) {
            bad('Dialogzeile ungültig');
            continue;
          }
          dialogs.push({ id, es: line.es });
          addEs(id, line.es);
        }
        break;
      }
      case 'grammar': {
        if (!isStr(raw.title)) bad('title fehlt');
        if (!isStr(raw.explanation)) bad('explanation fehlt');
        else if (raw.explanation.length > MAX_EXPLANATION) bad(`explanation länger als ${MAX_EXPLANATION} Zeichen`);
        if (!Array.isArray(raw.examples) || !raw.examples.every(isExample)) bad('examples ungültig');
        if (
          !Array.isArray(raw.exercises) ||
          raw.exercises.length === 0 ||
          !raw.exercises.every((x) => isObj(x) && isStr(x.de) && isStr(x.es) && (x.accept === undefined || isStrArr(x.accept)))
        )
          bad('exercises ungültig');
        if (Array.isArray(raw.examples)) raw.examples.forEach((e) => isObj(e) && addEs(id, e.es));
        if (Array.isArray(raw.exercises))
          raw.exercises.forEach((x) => {
            if (isObj(x)) {
              addEs(id, x.es);
              addEsList(id, x.accept);
            }
          });
        break;
      }
      case 'pair': {
        if (!isStr(raw.es)) bad('es fehlt');
        const opts = raw.options;
        if (!isStrArr(opts) || opts.length < 2 || opts.length > 4) bad('options braucht 2 bis 4 Einträge');
        else if (!opts.includes(raw.es as string)) bad('options enthält es nicht');
        addEs(id, raw.es);
        addEsList(id, opts);
        break;
      }
      default:
        bad(`unbekannte kind: ${String(raw.kind)}`);
    }
  }

  const forms = knownForms ?? ownForms;
  for (const d of dialogs) {
    for (const t of tokens(d.es)) {
      if (!forms.has(t) && !ownForms.has(t)) errors.push(`${d.id}: Dialogwort ohne Wort-Item: ${t}`);
    }
  }

  for (const { where, text } of spanish) {
    for (const t of stripDiacritics(normalize(text)).split(' ')) {
      if (BANNED.has(t)) errors.push(`${where}: Peninsularismus ${t} in "${text}"`);
    }
  }

  return [...new Set(errors)];
}

const CLIP_MIN_TOKENS = 3;
const CLIP_MAX_TOKENS = 16;
const CLIP_MIN_COVERAGE = 0.85;

/**
 * Prüft die Chile-Aufnahmen ({ clips: [...] }) und gibt die Fehlerliste zurück (leer = gut).
 * itemIds: alle Item-IDs der Situationen (Kartenkollisionen); knownForms: alle normalisierten Wortformen.
 */
export function validateClips(data: unknown, itemIds: Set<string>, knownForms: Set<string>): string[] {
  const errors: string[] = [];
  if (!isObj(data) || !Array.isArray(data.clips)) return ['Clipdatei braucht { clips: [...] }'];
  const seen = new Set<string>();

  for (const raw of data.clips as unknown[]) {
    if (!isObj(raw)) {
      errors.push('Clip ist kein Objekt');
      continue;
    }
    const id = isStr(raw.id) ? raw.id : '(ohne id)';
    const bad = (msg: string) => errors.push(`${id}: ${msg}`);

    if (!isStr(raw.id) || !ID_RE.test(raw.id)) bad('ungültige Clip-ID');
    else if (seen.has(raw.id)) bad('doppelte Clip-ID');
    else if (itemIds.has(raw.id)) bad('Clip-ID kollidiert mit Item-ID');
    else seen.add(raw.id);

    if (!isStr(raw.de)) bad('de fehlt');
    if (raw.gender !== 'f' && raw.gender !== 'm') bad('gender muss f oder m sein');
    if (!isStr(raw.source)) bad('source fehlt');
    if (!isStr(raw.es)) {
      bad('es fehlt');
      continue;
    }

    const toks = tokens(raw.es);
    if (toks.length < CLIP_MIN_TOKENS || toks.length > CLIP_MAX_TOKENS)
      bad(`${CLIP_MIN_TOKENS} bis ${CLIP_MAX_TOKENS} Wörter nötig, gefunden ${toks.length}`);

    // Eigennamen (Großbuchstabe, nicht am Satzanfang) zählen für die Deckung nicht.
    const words = raw.es.split(/\s+/).filter(Boolean);
    let counted = 0;
    let hit = 0;
    words.forEach((w, i) => {
      const startsSentence = i === 0 || /[.!?…]["»”)]*$/.test(words[i - 1]);
      const proper = !startsSentence && /^[¿¡"«“(]*\p{Lu}/u.test(w);
      if (proper) return;
      for (const t of tokens(w)) {
        counted++;
        if (knownForms.has(t)) hit++;
      }
    });
    if (counted > 0 && hit / counted < CLIP_MIN_COVERAGE)
      bad(`Deckung durch bekannte Wortformen ${(hit / counted).toFixed(2)} unter ${CLIP_MIN_COVERAGE}`);

    for (const t of stripDiacritics(normalize(raw.es)).split(' ')) {
      if (BANNED.has(t)) bad(`Peninsularismus ${t} in "${raw.es}"`);
    }
  }
  return [...new Set(errors)];
}

export type { Item, Situation };
