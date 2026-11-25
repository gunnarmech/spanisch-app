import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/ui/styles/tokens.css', 'utf8');
const theme = readFileSync('src/ui/theme.css', 'utf8');

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Hex nach OKLCH (Ottosson), liefert Chroma und Farbton in Grad
function hexToOklch(hex: string): { c: number; h: number } {
  const full = hex.length === 4 ? '#' + [...hex.slice(1)].map((d) => d + d).join('') : hex;
  const n = parseInt(full.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

const fontsCss = readFileSync('src/ui/styles/fonts.css', 'utf8');
const fontsTs = readFileSync('src/ui/styles/fonts.ts', 'utf8');

describe('Gestaltung: Tokens und Schrift', () => {
  it('bindet nur Latin-Schriftdateien ein', () => {
    expect(fontsTs).not.toMatch(/wght\.css/);
    const files = [...fontsCss.matchAll(/files\/([\w-]+\.woff2)/g)].map((m) => m[1]);
    expect(files).toEqual(['host-grotesk-latin-wght-normal.woff2', 'jetbrains-mono-latin-wght-normal.woff2']);
  });

  it('expandiert dreistellige Hexwerte richtig', () => {
    expect(hexToOklch('#fff')).toEqual(hexToOklch('#ffffff'));
    expect(hexToOklch('#1a4')).toEqual(hexToOklch('#11aa44'));
  });

  it('enthält die ausgelosten Kernwerte', () => {
    expect(tokens).toContain('--action: #1a4be0');
    expect(tokens).toContain('--ink: #111111');
    expect(tokens).toContain('--r-md: 16px');
    expect(tokens).toMatch(/--font-text:\s*"Host Grotesk Variable"/);
  });

  it('nutzt keine Serifen der alten Oberfläche', () => {
    for (const css of [tokens, theme]) {
      expect(css).not.toMatch(/Palatino|Georgia|Iowan|--serif/);
    }
  });

  it('hat keine Farbe im Violett-Bereich (Farbton 270 bis 330 Grad)', () => {
    const hexes = [...tokens.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g), ...theme.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) => m[0]);
    expect(hexes.length).toBeGreaterThan(5);
    for (const hex of hexes) {
      const { c, h } = hexToOklch(hex);
      if (c > 0.03) expect(h < 270 || h > 330, `${hex} hat Farbton ${h.toFixed(0)}`).toBe(true);
    }
  });
});
