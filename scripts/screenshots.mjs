// Schießt jeden Prüf-Bildschirm hell und dunkel bei Handy- und Desktopbreite.
// Aufruf: node scripts/screenshots.mjs --out docs/screenshots/gestaltung [--base http://localhost:5173/spanisch-app/]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const out = opt('out');
if (!out) {
  console.error('Aufruf: node scripts/screenshots.mjs --out <Ordner> [--base <URL>]');
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const SCREENS = ['start', 'start-neu', 'einstufung', 'fortschritt', 'einstellungen', 'diagnose', 'quellen', 'rundenende'];
const TYPES = ['intro', 'choice', 'listen', 'type', 'speak', 'grammar', 'pressure', 'dialog'];
const SIZES = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
const SCHEMES = [
  ['hell', 'light'],
  ['dunkel', 'dark'],
];

let server;
let base = opt('base');
if (!base) {
  base = 'http://localhost:5173/spanisch-app/';
  server = spawn(process.execPath, [join('node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
  });
  let up = false;
  for (let i = 0; i < 100 && !up; i++) {
    try {
      up = (await fetch(base)).ok;
    } catch {}
    if (!up) await new Promise((r) => setTimeout(r, 300));
  }
  if (!up) {
    server.kill();
    console.error(`Dev-Server unter ${base} nicht erreichbar.`);
    process.exit(1);
  }
}

const stop = () => {
  if (!server) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill();
};

let count = 0;
const missing = [];
const browser = await chromium.launch();
try {
  for (const size of SIZES) {
    for (const [label, scheme] of SCHEMES) {
      const context = await browser.newContext({ viewport: size, colorScheme: scheme });
      const page = await context.newPage();
      const shot = async (name) => {
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        await page.screenshot({ path: join(out, `${size.width}-${label}-${name}.png`), fullPage: true });
        count++;
      };
      const open = async (query) => {
        await page.goto(`${base}?${query}`);
        await page.waitForSelector('main > *', { timeout: 15000 });
        await page.waitForTimeout(300);
      };
      for (const zeige of SCREENS) {
        await open(`zeige=${zeige}`);
        await shot(zeige);
      }
      for (const typ of TYPES) {
        await open(`zeige=aufgabe&typ=${typ}`);
        await shot(`aufgabe-${typ}`);
        if (typ === 'choice' || typ === 'listen') {
          const option = page.locator('button.option').first();
          if (await option.count()) {
            await option.click();
            await shot(`aufgabe-${typ}-ergebnis`);
          } else {
            missing.push(`${size.width}-${label}-aufgabe-${typ}-ergebnis`);
          }
        }
        if (typ === 'type') {
          // Falsche Eingabe zeigt den Hinweis.
          try {
            await page.fill('input[type=text]', 'xxx', { timeout: 5000 });
            await page.click('button[type=submit]', { timeout: 5000 });
            await page.waitForSelector('.hint', { timeout: 5000 });
            await shot('aufgabe-type-hinweis');
          } catch {
            missing.push(`${size.width}-${label}-aufgabe-type-hinweis`);
          }
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  stop();
}
console.log(`${count} Bilder in ${out}`);
if (missing.length) {
  console.error(`Fehlende Bilder (${missing.length}):`);
  for (const name of missing) console.error(name);
  process.exit(1);
}
