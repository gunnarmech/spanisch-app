/** Fotos aus Santiago de Chile (Wikimedia Commons). Auswahl und Gründe: docs/fotos.md. */
export type Photo = {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  page: string;
  /** Bearbeitungshinweis für den Nachweis (CC verlangt, Änderungen zu nennen). */
  edit: string;
};

const base = import.meta.env.BASE_URL;
const url = (file: string) => `${base}photos/${file}`;
const deed = (path: string) => `https://creativecommons.org/licenses/${path}/deed.de`;
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const headerPhoto: Photo = {
  src: url('kopf-800.webp'),
  srcset: `${url('kopf-800.webp')} 800w, ${url('kopf-1280.webp')} 1280w`,
  width: 800,
  height: 600,
  alt: 'Sonnige Straßenecke mit hohen Bäumen, Straßenschildern und einem dunkelroten Haus',
  author: 'Rodrigo Fernández',
  license: 'CC BY-SA 4.0',
  licenseUrl: deed('by-sa/4.0'),
  page: commons('Calle_Lastarria_con_Padre_Luis_de_Valdivia.jpg'),
  edit: 'zugeschnitten und verkleinert',
};

const bySituation: Record<string, Photo> = {
  '01-grundlagen': {
    src: url('grundlagen.webp'),
    width: 160,
    height: 160,
    alt: 'Platz mit Palmen und Kirchtürmen unter blauem Himmel',
    author: 'Apincheira',
    license: 'CC BY-SA 3.0',
    licenseUrl: deed('by-sa/3.0'),
    page: commons('Plaza_de_Armas.JPG'),
    edit: 'zugeschnitten und verkleinert',
  },
  '02-cafe': {
    src: url('cafe.webp'),
    width: 160,
    height: 160,
    alt: 'Heller Sonnenschirm über Tischen vor einem rot verputzten Café',
    author: 'Güldem Üstün',
    license: 'CC BY 2.0',
    licenseUrl: deed('by/2.0'),
    page: commons('Chile_(Santiago)_Colonial_style_Cafe_(33370993193).jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '03-einkaufen': {
    src: url('einkaufen.webp'),
    width: 160,
    height: 160,
    alt: 'Tonnen mit Gewürzen und Mehl auf einem Markt, davor handgeschriebene Preisschilder',
    author: 'chileaktiv',
    license: 'CC BY-SA 2.0',
    licenseUrl: deed('by-sa/2.0'),
    page: commons('Condimentos_en_la_Vega_Central.jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '04-unterwegs': {
    src: url('unterwegs.webp'),
    width: 160,
    height: 160,
    alt: 'Roter Stadtbus der Red Movilidad auf einer Kopfsteinpflasterstraße unter Herbstbäumen',
    author: 'Carlos Figueroa Rojas',
    license: 'CC BY-SA 4.0',
    licenseUrl: deed('by-sa/4.0'),
    page: commons('Bus_213e_en_Parque_Forestal,_Santiago_20230421.jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '05-weg': {
    src: url('weg.webp'),
    width: 160,
    height: 160,
    alt: 'Gelbe Balustraden und Treppen am Fuß des Cerro Santa Lucía, dahinter Palmen und Bäume',
    author: 'Jorge Láscar',
    license: 'CC BY 2.0',
    licenseUrl: deed('by/2.0'),
    page: commons('Lascar_Cerro_Santa_Luc%C3%ADa_(Santa_Luc%C3%ADa_Hill)_(4576822725).jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '06-unterkunft': {
    src: url('unterkunft.webp'),
    width: 160,
    height: 160,
    alt: 'Weiße Hausfassade mit Balkon, dem Schriftzug HOSTAL und einem Fenster mit Vorhang',
    author: 'Mx. Granger',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.de',
    page: commons('Hostal_Santa_Luc%C3%ADa,_Santiago.jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '07-smalltalk': {
    src: url('smalltalk.webp'),
    width: 160,
    height: 160,
    alt: 'Blick vom Cerro San Cristóbal über Häuser und Straßen von Santiago auf einen kleinen Hügel und die Berge am Horizont',
    author: 'David Berkowitz',
    license: 'CC BY 2.0',
    licenseUrl: deed('by/2.0'),
    page: commons('Cerro_San_Cristobal_Santiago,_Chile.jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '08-notfall': {
    src: url('notfall.webp'),
    width: 160,
    height: 160,
    alt: 'Modernes Krankenhausgebäude mit Glasturm und dem Schriftzug URGENCIA über dem Eingang unter blauem Himmel',
    author: 'Carlos Figueroa Rojas',
    license: 'CC BY-SA 4.0',
    licenseUrl: deed('by-sa/4.0'),
    page: commons('Hospital_de_Urgencia_Asistencia_P%C3%BAblica,_Santiago_20230325.jpg'),
    edit: 'zugeschnitten und verkleinert',
  },
  '09-chile': {
    src: url('chile.webp'),
    width: 160,
    height: 160,
    alt: 'Enge Gasse in Valparaíso mit bunten Häusern in Blau, Violett und Grün',
    author: 'Trinidadvj',
    license: 'CC BY-SA 3.0',
    licenseUrl: deed('by-sa/3.0'),
    page: commons('Multiples_colores,_Valpara%C3%ADso..JPG'),
    edit: 'zugeschnitten und verkleinert',
  },
};

/** Foto der Situation, oder null, wenn es keins gibt (dann zeigt die Zeile kein Bild). */
export function photoFor(situationId: string): Photo | null {
  return bySituation[situationId] ?? null;
}

export const allPhotos: Photo[] = [headerPhoto, ...Object.values(bySituation)];
