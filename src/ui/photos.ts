/** Fotos aus Santiago de Chile (Wikimedia Commons). Auswahl und Gründe: docs/fotos.md. */
export type Photo = {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: string;
  page: string;
};

const base = import.meta.env.BASE_URL;
const url = (file: string) => `${base}photos/${file}`;
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const headerPhoto: Photo = {
  src: url('kopf-800.webp'),
  srcset: `${url('kopf-800.webp')} 800w, ${url('kopf-1280.webp')} 1280w`,
  width: 800,
  height: 600,
  alt: 'Sonnige Straßenecke mit hohen Bäumen, Straßenschildern und einem dunkelroten Haus',
  author: 'Rodrigo Fernández',
  license: 'CC BY-SA 4.0',
  page: commons('Calle_Lastarria_con_Padre_Luis_de_Valdivia.jpg'),
};

const bySituation: Record<string, Photo> = {
  '01-grundlagen': {
    src: url('grundlagen.webp'),
    width: 160,
    height: 160,
    alt: 'Platz mit Palmen und Kirchtürmen unter blauem Himmel',
    author: 'Apincheira',
    license: 'CC BY-SA 3.0',
    page: commons('Plaza_de_Armas.JPG'),
  },
  '02-cafe': {
    src: url('cafe.webp'),
    width: 160,
    height: 160,
    alt: 'Heller Sonnenschirm über Tischen vor einem rot verputzten Café',
    author: 'Güldem Üstün',
    license: 'CC BY 2.0',
    page: commons('Chile_(Santiago)_Colonial_style_Cafe_(33370993193).jpg'),
  },
  '03-einkaufen': {
    src: url('einkaufen.webp'),
    width: 160,
    height: 160,
    alt: 'Tonnen mit Gewürzen und Mehl auf einem Markt, davor handgeschriebene Preisschilder',
    author: 'chileaktiv',
    license: 'CC BY-SA 2.0',
    page: commons('Condimentos_en_la_Vega_Central.jpg'),
  },
};

/** Foto der Situation, oder null, wenn es keins gibt (dann zeigt die Zeile kein Bild). */
export function photoFor(situationId: string): Photo | null {
  return bySituation[situationId] ?? null;
}

export const allPhotos: Photo[] = [headerPhoto, ...Object.values(bySituation)];
