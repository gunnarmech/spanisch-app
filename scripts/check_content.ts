import { existsSync, readdirSync } from 'node:fs';

const dir = 'content/situations';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];

if (files.length === 0) {
  console.log('keine Inhalte');
  process.exit(0);
}

console.log(`${files.length} Situationsdateien gefunden (Pruefung folgt in Task 4)`);
