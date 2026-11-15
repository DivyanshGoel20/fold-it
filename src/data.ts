// All the real-world numbers live here.

export const PAPER_T = 0.0001; // 0.1 mm
export const A4 = { w: 0.21, h: 0.297 };
export const MOON_FOLD = 42;
export const MAX_FOLD = 102;

export const EARTH_R = 6.371e6;
export const MOON_R = 1.7374e6;
export const MOON_ALT = 3.844e8 - EARTH_R; // surface of Earth to centre of Moon
export const SUN_R = 6.96e8;
export const SUN_ALT = 1.496e11;
export const LY = 9.4607e15;

export const thickness = (n: number) => PAPER_T * Math.pow(2, n);

export function layers(n: number): string {
  return (1n << BigInt(Math.max(0, Math.round(n)))).toLocaleString('en-US');
}

// ---------- formatting ----------

const sig = (v: number, digits = 3) => {
  if (v >= 100) return Math.round(v).toLocaleString('en-US');
  return Number(v.toPrecision(digits)).toString();
};

export function fmtLen(m: number): { v: string; u: string } {
  if (m < 9e-5) return { v: sig(m * 1e6), u: 'µm' };
  if (m < 0.01) return { v: sig(m * 1e3, 2), u: 'mm' };
  if (m < 1) return { v: sig(m * 100), u: 'cm' };
  if (m < 1000) return { v: sig(m), u: 'm' };
  if (m < 1e9) return { v: sig(m / 1000), u: 'km' };
  if (m < 1e12) return { v: sig(m / 1e9), u: 'million km' };
  if (m < 1e14) return { v: sig(m / 1e12), u: 'billion km' };
  const ly = m / LY;
  if (ly < 1000) return { v: sig(ly), u: ly < 1.5 ? 'light year' : 'light years' };
  if (ly < 1e6) return { v: sig(ly / 1e3), u: 'thousand light years' };
  if (ly < 1e9) return { v: sig(ly / 1e6), u: 'million light years' };
  return { v: sig(ly / 1e9), u: 'billion light years' };
}

/** Long-form unit words for the big headline. */
export function fmtWords(m: number): { v: string; u: string } {
  const f = fmtLen(m);
  const words: Record<string, string> = {
    'µm': 'micrometres',
    mm: 'millimetres',
    cm: 'centimetres',
    m: 'metres',
    km: 'kilometres',
  };
  let u = words[f.u] ?? f.u;
  if (f.v === '1' && u.endsWith('s')) u = u.slice(0, -1);
  return { v: f.v, u };
}

export const fmt = (m: number) => {
  const f = fmtLen(m);
  return `${f.v} ${f.u}`;
};

export function fmtLightTime(m: number): string {
  const s = m / 299792458;
  if (s < 1) return `${sig(s * 1000)} milliseconds`;
  if (s < 120) return `${sig(s)} seconds`;
  if (s < 7200) return `${sig(s / 60)} minutes`;
  if (s < 86400 * 3) return `${sig(s / 3600)} hours`;
  if (s < 86400 * 365 * 2) return `${sig(s / 86400)} days`;
  const y = s / (86400 * 365.25);
  if (y < 1e6) return `${Math.round(y).toLocaleString('en-US')} years`;
  if (y < 1e9) return `${sig(y / 1e6)} million years`;
  return `${sig(y / 1e9)} billion years`;
}

// ---------- reference objects (vintage plates) ----------

export interface Thing {
  id: string;
  name: string;
  credit: string;
  /** real-world height of the whole image, metres (or give w) */
  h?: number;
  /** real-world width of the whole image, metres */
  w?: number;
  size: string;
  /** drawn behind the tower, centred at this offset (fraction of own width) */
  backdrop?: number;
}

export const THINGS: Thing[] = [
  { id: 'radiolaria', name: 'Radiolarian', credit: 'Ernst Haeckel, 1904', h: 2.4e-4, size: '0.2 mm across' },
  { id: 'flea', name: 'Flea', credit: 'Robert Hooke, 1665', w: 2.6e-3, size: '2.5 mm long' },
  { id: 'ant', name: 'Ant', credit: 'Robert Hooke, 1665', h: 6e-3, size: '5 mm long' },
  { id: 'blueberry', name: 'Blueberries', credit: 'USDA watercolour, 1912', w: 0.045, size: '4 cm cluster' },
  { id: 'cat', name: 'House cat', credit: 'Jacques de Sève, 1755', h: 0.5, size: '30 cm tall' },
  { id: 'vitruvian', name: 'Person', credit: 'Leonardo da Vinci, c.1490', h: 2.25, size: '1.8 m tall' },
  { id: 'elephant', name: 'Elephant', credit: 'Jacques de Sève, 1762', h: 4.6, size: '3.2 m tall' },
  { id: 'whale', name: 'Blue whale', credit: 'Thomas Bell, 1874', w: 26, size: '25 m long' },
  { id: 'pyramids', name: 'Great Pyramid of Giza', credit: 'Description de l’Égypte, 1809', w: 560, size: '139 m tall', backdrop: 0.18 },
  { id: 'matterhorn', name: 'The Matterhorn', credit: 'Edward Whymper, 1871', h: 5200, size: '4,478 m', backdrop: -0.18 },
];

// ---------- altitude markers (horizontal guide lines) ----------

export interface Marker {
  id: string;
  name: string;
  alt: number;
  /** a big plate shown beside the tower */
  img?: string;
  /** real diameter in metres, to say how much the plate is magnified */
  d?: number;
  credit?: string;
  /** draw a glowing star instead of an image: [r,g,b], cluster for the Pleiades */
  star?: [number, number, number];
  cluster?: boolean;
}

export const MARKERS: Marker[] = [
  { id: 'everest', name: 'Summit of Mount Everest', alt: 8849 },
  { id: 'jet', name: 'Passenger jets cruise', alt: 11000 },
  { id: 'skydive', name: 'Highest skydive ever', alt: 41400 },
  { id: 'meteors', name: 'Shooting stars burn up', alt: 85000, img: 'meteors', credit: 'Trouvelot, 1868' },
  { id: 'karman', name: 'Kármán line, where space begins', alt: 100000 },
  { id: 'iss', name: 'International Space Station', alt: 408000 },
  { id: 'hubble', name: 'Hubble Space Telescope', alt: 535000 },
  { id: 'gps', name: 'GPS satellites', alt: 20200e3 },
  { id: 'geo', name: 'Geostationary orbit', alt: 35786e3 },
  { id: 'moon', name: 'The Moon', alt: MOON_ALT },
  { id: 'mars', name: 'Mars, at its closest', alt: 5.46e10, img: 'mars', d: 6.779e6, credit: 'Trouvelot, 1877' },
  { id: 'sun', name: 'The Sun', alt: SUN_ALT, img: 'sun', d: 1.39e9, credit: 'Total eclipse, Trouvelot, 1878' },
  { id: 'jupiter', name: 'Jupiter, at its closest', alt: 5.88e11, img: 'jupiter', d: 1.398e8, credit: 'Trouvelot, 1880' },
  { id: 'saturn', name: 'Saturn, at its closest', alt: 1.2e12, img: 'saturn', d: 2.7e8, credit: 'Trouvelot, 1874' },
  { id: 'neptune', name: 'Neptune, the last planet', alt: 4.3e12 },
  { id: 'comet', name: 'Halley’s Comet, at its farthest', alt: 5.25e12, img: 'comet', credit: 'Trouvelot, 1881' },
  { id: 'pluto', name: 'Pluto', alt: 5.9e12 },
  { id: 'voyager', name: 'Voyager 1, farthest human-made object', alt: 2.53e13 },
  { id: 'oort', name: 'Oort Cloud, home of comets, begins', alt: 3e14 },
  { id: 'ly', name: 'One light year', alt: LY },
  { id: 'oortend', name: 'Edge of the Sun’s influence', alt: 1.5e16 },
  { id: 'proxima', name: 'Proxima Centauri, the nearest star', alt: 4.24 * LY, star: [255, 120, 90], d: 2.1e8, credit: 'A small red dwarf' },
  { id: 'sirius', name: 'Sirius, brightest star in the sky', alt: 8.6 * LY, star: [190, 215, 255], d: 2.4e9, credit: '25\u00d7 brighter than the Sun' },
  { id: 'vega', name: 'Vega', alt: 25 * LY, star: [225, 235, 255], d: 3.3e9, credit: 'The North Star of the year 14,000' },
  { id: 'pleiades', name: 'The Pleiades', alt: 444 * LY, star: [170, 200, 255], cluster: true, d: 86 * LY, credit: 'The Seven Sisters' },
  { id: 'orion', name: 'Orion Nebula', alt: 1344 * LY, img: 'orion', d: 24 * LY, credit: 'Trouvelot, 1875' },
  { id: 'crab', name: 'Crab Nebula, a star that exploded in 1054', alt: 6500 * LY },
  { id: 'hercules', name: 'Great Cluster in Hercules', alt: 22200 * LY, img: 'hercules', d: 145 * LY, credit: 'Trouvelot, 1877' },
  { id: 'mwcenter', name: 'Centre of the Milky Way', alt: 26000 * LY },
  { id: 'mwacross', name: 'Width of the Milky Way', alt: 100000 * LY },
  { id: 'lmc', name: 'Large Magellanic Cloud', alt: 160000 * LY },
  { id: 'andromeda', name: 'Andromeda Galaxy', alt: 2.5e6 * LY, img: 'andromeda', d: 2.2e5 * LY, credit: 'Isaac Roberts, 1899' },
  { id: 'whirlpool', name: 'Whirlpool Galaxy', alt: 2.3e7 * LY, img: 'whirlpool', d: 7.6e4 * LY, credit: 'Lord Rosse, 1845' },
  { id: 'virgo', name: 'Virgo Cluster', alt: 5.4e7 * LY },
  { id: 'laniakea', name: 'Edge of Laniakea, our supercluster', alt: 2.6e8 * LY },
  { id: 'quasar', name: 'Quasar 3C 273', alt: 2.4e9 * LY },
  { id: 'edge', name: 'Edge of the observable universe', alt: 4.65e10 * LY },
];

// ---------- the story ----------

export interface Fact {
  tag?: string;
  text: string;
}

const F: Record<number, Fact> = {
  0: { text: 'A single sheet of paper, magnified 5,000 times. It’s about as thick as a human hair.' },
  1: { text: 'Two layers. Hard to see, but it has doubled.' },
  2: { text: 'Four layers. Taller than a radiolarian, a tiny ocean creature.' },
  3: { text: 'Eight layers. About as thick as a credit card.' },
  4: { text: 'Sixteen layers. Each fold doubles everything that came before it.' },
  5: { text: 'As long as a flea. Thirty-two layers deep.' },
  6: { text: 'Most people say paper can only be folded 7 times. Let’s see.' },
  7: { tag: 'The 7-fold myth', text: 'It’s a myth, but a stubborn one. Real paper gets brutally stiff around here.' },
  8: { text: '256 layers. As tall as a stack of 16 coins.' },
  9: { text: 'Taller than a sprig of blueberries.' },
  10: { text: '1,024 layers, about the height of a coffee mug.' },
  11: { text: 'About the height of a sitting cat.' },
  12: { tag: 'World record', text: 'In 2002, high-schooler Britney Gallivan folded a 1.2 km strip of paper 12 times. Nobody has gone further. Everything after this is imagination.' },
  13: { text: 'As tall as a toddler.' },
  14: { text: 'About as tall as you. 16,384 layers of paper.' },
  15: { text: 'Taller than an elephant.' },
  16: { text: 'Taller than a giraffe.' },
  17: { text: 'Taller than a four-storey building.' },
  18: { text: 'As tall as a blue whale is long.' },
  19: { text: 'Taller than the Arc de Triomphe.' },
  20: { tag: 'A million layers', text: '1,048,576 sheets, stacked taller than the Statue of Liberty.' },
  21: { text: 'Taller than the Great Pyramid of Giza.' },
  22: { text: 'Taller than the Eiffel Tower.' },
  23: { tag: 'Tallest building', text: 'Taller than the Burj Khalifa, the tallest building on Earth.' },
  24: { text: 'Your paper is poking into the clouds.' },
  25: { text: 'Laid flat, it would take you 40 minutes to walk its length.' },
  26: { text: 'Taller than the Matterhorn.' },
  27: { tag: 'Top of the world', text: 'Higher than Mount Everest, and higher than airliners fly.' },
  28: { text: 'The sky is turning dark. 268 million layers.' },
  29: { text: 'Higher than the highest skydive ever made, from 41 km.' },
  30: { tag: 'Space', text: 'You\u2019ve crossed the K\u00e1rm\u00e1n line. Your stack of paper is officially in space. Shooting stars burn up just below.' },
  31: { text: 'The northern lights shimmer at around this height.' },
  32: { text: 'Astronauts on the Space Station could wave at your paper.' },
  33: { text: 'Higher than the Hubble Space Telescope.' },
  34: { text: 'If it tipped over, it would stretch from London to Rome.' },
  35: { text: 'Almost as tall as the Moon is wide.' },
  36: { text: 'Taller than the distance to the centre of the Earth.' },
  37: { text: 'Taller than the whole Earth is wide.' },
  38: { text: 'Past the GPS satellites that guide your phone.' },
  39: { text: 'Past geostationary orbit, where weather satellites hover.' },
  40: { tag: 'A trillion layers', text: '1,099,511,627,776 sheets. Over a quarter of the way to the Moon.' },
  41: { text: 'More than halfway there. One more fold…' },
  42: { tag: 'The Moon', text: 'A single sheet of paper, folded 42 times, reaches past the Moon.' },
  43: { text: 'Twice the distance to the Moon. Keep going.' },
  49: { tag: 'Mars', text: 'Past Mars at its closest approach to Earth.' },
  51: { tag: 'The Sun', text: 'Past the Sun. Fifty-one folds.' },
  53: { text: 'Past Jupiter.' },
  54: { text: 'Past Saturn and its rings.' },
  56: { text: 'Past Neptune, and past the farthest point of Halley\u2019s Comet\u2019s orbit.' },
  58: { tag: 'Voyager 1', text: 'Past Voyager 1, launched in 1977 and still the farthest thing humans have ever made.' },
  60: { text: 'A quintillion layers. That’s a 1 with 18 zeros.' },
  67: { tag: 'One light year', text: 'Light itself needs a full year to climb your paper.' },
  69: { tag: 'Nearest star', text: 'Past Proxima Centauri, our closest neighbouring star.' },
  77: { text: 'Past the Orion Nebula, a nursery where new stars are born.' },
  61: { text: 'Sunlight takes 9 days to reach the top of your paper.' },
  62: { tag: 'Oort Cloud', text: 'Into the Oort Cloud, a vast shell of icy comets around the Sun.' },
  68: { text: 'Past the edge of the Sun’s gravity. You’ve left the solar system for good.' },
  70: { tag: 'Sirius', text: 'Past Sirius, the brightest star in our night sky.' },
  72: { text: 'Past Vega, which will be our North Star in 12,000 years.' },
  76: { text: 'Past the Pleiades, the Seven Sisters.' },
  80: { text: 'Past the Crab Nebula. Astronomers in China watched this star explode in 1054.' },
  81: { tag: 'Star cluster', text: 'Past the Great Cluster in Hercules: hundreds of thousands of stars packed into a ball.' },
  84: { text: 'Past the Large Magellanic Cloud, a small galaxy orbiting ours.' },
  91: { tag: 'Whirlpool', text: 'Past the Whirlpool Galaxy. Lord Rosse sketched its spiral in 1845, the first one anyone had seen.' },
  95: { tag: 'Supercluster', text: 'Out of Laniakea, the supercluster of 100,000 galaxies we live in.' },
  98: { text: 'Past quasar 3C 273, a black hole shining brighter than a trillion suns.' },
  78: { text: 'Past almost every star you can see with the naked eye.' },
  82: { tag: 'Galactic centre', text: 'All the way to the black hole at the centre of the Milky Way.' },
  83: { tag: 'The Milky Way', text: 'Taller than our entire galaxy is wide.' },
  88: { tag: 'Andromeda', text: 'Past the Andromeda Galaxy, 2.5 million light years away.' },
  93: { text: 'Past the Virgo Cluster and its thousand-plus galaxies.' },
  100: { text: 'Fold 100. There are now more layers of paper than atoms in your body.' },
  102: { tag: 'The end', text: 'Your paper is now taller than the observable universe. From one sheet, folded 102 times.' },
};

export function factFor(n: number): Fact {
  if (F[n]) return F[n];
  const t = thickness(n);
  if (n > MOON_FOLD) return { text: `Light takes ${fmtLightTime(t)} to travel from the bottom of your paper to the top.` };
  return { text: '' };
}

/** Milestones for the folding ruler; each one is clickable. */
export const RAIL: { name: string; m: number }[] = [
  { name: 'Paper', m: PAPER_T },
  { name: 'Flea', m: 2.5e-3 },
  { name: 'You', m: 1.7 },
  { name: 'Pyramid', m: 139 },
  { name: 'Everest', m: 8849 },
  { name: 'Space', m: 1e5 },
  { name: 'Moon', m: MOON_ALT },
  { name: 'Sun', m: SUN_ALT },
  { name: 'Voyager', m: 2.53e13 },
  { name: 'Nearest star', m: 4.24 * LY },
  { name: 'Milky Way', m: 1e5 * LY },
  { name: 'Andromeda', m: 2.5e6 * LY },
  { name: 'Universe', m: 4.65e10 * LY },
];

/** Fold count at which the stack first passes `m` metres. */
export const foldFor = (m: number) => Math.max(0, Math.ceil(Math.log2(m / PAPER_T) - 1e-9));

/** How long it would take to climb the stack. */
export const CLIMBERS: { name: string; v: number }[] = [
  { name: 'On foot', v: 5 / 3.6 },
  { name: 'By car', v: 100 / 3.6 },
  { name: 'By jet', v: 900 / 3.6 },
  { name: 'Fastest spacecraft', v: 192e3 },
  { name: 'At light speed', v: 299792458 },
];

export function fmtDuration(s: number): string {
  if (s < 1) return s < 0.001 ? 'instantly' : `${sig(s * 1000)} ms`;
  if (s < 60) return `${sig(s)} sec`;
  if (s < 3600) return `${sig(s / 60)} min`;
  if (s < 86400) return `${sig(s / 3600)} hours`;
  if (s < 86400 * 365.25) return `${sig(s / 86400)} days`;
  const y = s / (86400 * 365.25);
  if (y < 1000) return `${sig(y)} years`;
  if (y < 1e6) return `${sig(y / 1e3)} thousand yrs`;
  if (y < 1e9) return `${sig(y / 1e6)} million yrs`;
  if (y < 1e12) return `${sig(y / 1e9)} billion yrs`;
  return `${sig(y / 1e12)} trillion yrs`;
}
