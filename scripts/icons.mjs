// Rendert public/icon.svg auf 192 und 512 px PNG (deckend, ohne Transparenz).
// Aufruf: node scripts/icons.mjs (Pfade liegen relativ zur Skriptdatei, der Aufruf geht aus jedem Ordner)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const svg = readFileSync(`${publicDir}icon.svg`, 'utf8');
const browser = await chromium.launch();
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:#fff}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    const png = await page.screenshot({ type: 'png', omitBackground: false });
    writeFileSync(`${publicDir}icon-${size}.png`, png);
    await page.close();
    console.log(`public/icon-${size}.png`);
  }
} finally {
  await browser.close();
}
