// Lädt die gewählten Fotos von Wikimedia Commons, schneidet zu und schreibt WebP nach public/photos.
// Aufruf: node scripts/photos.mjs   (Quellen landen in .taste-skill/search/src, das ist ignoriert)
// Auswahl und Begründung: docs/fotos.md
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, '.taste-skill', 'search', 'src');
const outDir = path.join(root, 'public', 'photos');

// crop: Anteile (links, oben, Breite, Höhe) des Quellbilds
const JOBS = [
  {
    file: 'Calle Lastarria con Padre Luis de Valdivia.jpg',
    crop: { left: 0.2, top: 0.05, width: 0.64, height: 0.72 },
    outputs: [
      { name: 'kopf-800.webp', width: 800, height: 600, maxKb: 180 },
      { name: 'kopf-1280.webp', width: 1280, height: 960, maxKb: 180 },
    ],
  },
  {
    file: 'Plaza de Armas.JPG',
    crop: { left: 0.17, top: 0, width: 0.667, height: 1 },
    outputs: [{ name: 'grundlagen.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Chile (Santiago) Colonial style Cafe (33370993193).jpg',
    crop: { left: 0.2135, top: 0.396, width: 0.476, height: 0.6037 },
    outputs: [{ name: 'cafe.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Condimentos en la Vega Central.jpg',
    crop: { left: 0.125, top: 0, width: 0.75, height: 1 },
    outputs: [{ name: 'einkaufen.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Bus 213e en Parque Forestal, Santiago 20230421.jpg',
    crop: { left: 0.04, top: 0.0, width: 0.667, height: 1 },
    outputs: [{ name: 'unterwegs.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Lascar Cerro Santa Lucía (Santa Lucía Hill) (4576822725).jpg',
    crop: { left: 0.05, top: 0, width: 0.664, height: 1 },
    outputs: [{ name: 'weg.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Hostal Santa Lucía, Santiago.jpg',
    crop: { left: 0.34, top: 0.36, width: 0.5, height: 0.407 },
    outputs: [{ name: 'unterkunft.webp', width: 160, height: 160, maxKb: 25 }],
  },
  {
    file: 'Cerro San Cristobal Santiago, Chile.jpg',
    crop: { left: 0.25, top: 0.1, width: 0.6, height: 0.8 },
    outputs: [{ name: 'smalltalk.webp', width: 160, height: 160, maxKb: 25 }],
  },
];

async function download(file) {
  const target = path.join(srcDir, file);
  if (existsSync(target)) return target;
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=2000`;
  const res = await fetch(url, { headers: { 'User-Agent': 'spanisch-app-photo-script/1.0' } });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  await writeFile(target, Buffer.from(await res.arrayBuffer()));
  return target;
}

await mkdir(srcDir, { recursive: true });
await mkdir(outDir, { recursive: true });

for (const job of JOBS) {
  const input = await download(job.file);
  const meta = await sharp(input).metadata();
  const region = {
    left: Math.round(job.crop.left * meta.width),
    top: Math.round(job.crop.top * meta.height),
    width: Math.round(job.crop.width * meta.width),
    height: Math.round(job.crop.height * meta.height),
  };
  for (const out of job.outputs) {
    let quality = 82;
    let size = Infinity;
    const target = path.join(outDir, out.name);
    while (size > out.maxKb * 1024 && quality >= 40) {
      await sharp(input)
        .extract(region)
        .resize(out.width, out.height, { fit: 'cover' })
        .webp({ quality })
        .toFile(target);
      size = (await stat(target)).size;
      quality -= 6;
    }
    console.log(`${out.name}: ${Math.round(size / 1024)} KB (q ${quality + 6})`);
    if (size > out.maxKb * 1024) throw new Error(`${out.name} über ${out.maxKb} KB`);
  }
}
