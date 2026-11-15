// All the real-world numbers live here.

export const PAPER_T = 0.0001; // 0.1 mm
export const A4 = { w: 0.21, h: 0.297 };
export const MOON_FOLD = 42;
export const MAX_FOLD = 102;

export const EARTH_R = 6.371e6;
export const MOON_R = 1.7374e6;
export const MOON_ALT = 3.844e8 - EARTH_R; // surface of Earth to centre of Moon
export const LY = 9.4607e15;

export const thickness = (n: number) => PAPER_T * Math.pow(2, n);

export function layers(n: number): string {
  return (1n << BigInt(Math.max(0, Math.round(n)))).toLocaleString('en-US');
}

/** Footprint of the folded sheet, halving the long side each fold. */
export function footprint(n: number): [number, number] {
  let a = A4.w, b = A4.h;
  for (let i = 0; i < n; i++) {
    if (b >= a) b /= 2; else a /= 2;
  }
  return [Math.min(a, b), Math.max(a, b)];
}

// ---------- formatting ----------

const sig = (v: number, digits = 3) => {
  if (v >= 100) return Math.round(v).toLocaleString('en-US');
  return Number(v.toPrecision(digits)).toString();
};

export function fmtLen(m: number): { v: string; u: string } {
  if (m < 1e-6) return { v: sig(m * 1e9), u: 'nm' };
  if (m < 1e-3) return { v: sig(m * 1e6), u: 'µm' };
  if (m < 0.01) return { v: sig(m * 1e3, 2), u: 'mm' };
  if (m < 1) return { v: sig(m * 100), u: 'cm' };
  if (m < 1000) return { v: sig(m), u: 'm' };
  if (m < 1e9) return { v: sig(m / 1000), u: 'km' };
  if (m < 1e12) return { v: sig(m / 1e9), u: 'million km' };
  if (m < 1e14) return { v: sig(m / 1e12), u: 'billion km' };
  const ly = m / LY;
  if (ly < 1000) return { v: sig(ly), u: ly < 1.5 ? 'light-year' : 'light-years' };
  if (ly < 1e6) return { v: sig(ly / 1e3), u: 'thousand light-years' };
  if (ly < 1e9) return { v: sig(ly / 1e6), u: 'million light-years' };
  return { v: sig(ly / 1e9), u: 'billion light-years' };
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

// ---------- reference objects standing on the ground ----------

export interface Thing {
  id: string;
  art: string;
  name: string;
  h: number; // metres
  size?: string; // label override
  backdrop?: number; // if set: drawn behind the tower, horizontal offset as fraction of own width
}

export const THINGS: Thing[] = [
  { id: 'rbc', art: 'rbc', name: 'Red blood cell', h: 8e-6 },
  { id: 'hair', art: 'hair', name: 'Human hair, end-on', h: 7e-5 },
  { id: 'mite', art: 'mite', name: 'Dust mite', h: 2e-4 },
  { id: 'salt', art: 'salt', name: 'Grain of salt', h: 3e-4 },
  { id: 'sand', art: 'sand', name: 'Grain of sand', h: 5e-4 },
  { id: 'poppy', art: 'poppy', name: 'Poppy seed', h: 1e-3 },
  { id: 'ant', art: 'ant', name: 'Ant', h: 2.2e-3, size: '5 mm long' },
  { id: 'ladybug', art: 'ladybug', name: 'Ladybug', h: 4e-3, size: '6 mm long' },
  { id: 'blueberry', art: 'blueberry', name: 'Blueberry', h: 0.012 },
  { id: 'coin', art: 'coin', name: 'Coin, on its edge', h: 0.0243 },
  { id: 'golf', art: 'golf', name: 'Golf ball', h: 0.0427 },
  { id: 'mug', art: 'mug', name: 'Coffee mug', h: 0.095 },
  { id: 'cat', art: 'cat', name: 'Cat', h: 0.32 },
  { id: 'toddler', art: 'toddler', name: 'Toddler', h: 0.85 },
  { id: 'adult', art: 'adult', name: 'Person', h: 1.7 },
  { id: 'elephant', art: 'elephant', name: 'Elephant', h: 3.2 },
  { id: 'giraffe', art: 'giraffe', name: 'Giraffe', h: 5.5 },
  { id: 'house', art: 'house', name: 'House', h: 9 },
  { id: 'whale', art: 'whale', name: 'Blue whale, on its tail', h: 25 },
  { id: 'arc', art: 'arc', name: 'Arc de Triomphe', h: 50 },
  { id: 'liberty', art: 'liberty', name: 'Statue of Liberty', h: 93 },
  { id: 'pyramid', art: 'pyramid', name: 'Great Pyramid', h: 139 },
  { id: 'eiffel', art: 'eiffel', name: 'Eiffel Tower', h: 330 },
  { id: 'empire', art: 'empire', name: 'Empire State Building', h: 443 },
  { id: 'burj', art: 'burj', name: 'Burj Khalifa', h: 828 },
  { id: 'fuji', art: 'fuji', name: 'Mount Fuji', h: 3776, backdrop: -0.62 },
  { id: 'everest', art: 'everest', name: 'Mount Everest', h: 8849, backdrop: 0.1 },
];

// ---------- altitude markers (horizontal guide lines) ----------

export interface Marker {
  id: string;
  icon: string;
  name: string;
  alt: number;
  color?: string;
}

export const MARKERS: Marker[] = [
  { id: 'jet', icon: 'jet', name: 'Passenger jets', alt: 11000 },
  { id: 'skydive', icon: 'skydiver', name: 'Highest skydive ever', alt: 41400 },
  { id: 'karman', icon: 'rocket', name: 'Edge of space', alt: 100000, color: '#9fd0ff' },
  { id: 'aurora', icon: 'aurora', name: 'Northern lights', alt: 200000, color: '#7cf2b4' },
  { id: 'iss', icon: 'iss', name: 'International Space Station', alt: 408000 },
  { id: 'hubble', icon: 'telescope', name: 'Hubble Space Telescope', alt: 535000 },
  { id: 'gps', icon: 'satellite', name: 'GPS satellites', alt: 20200e3 },
  { id: 'geo', icon: 'satellite', name: 'Geostationary orbit', alt: 35786e3 },
  { id: 'moon', icon: 'moon', name: 'The Moon', alt: MOON_ALT, color: '#f3f0e6' },
  { id: 'mars', icon: 'planet', name: 'Mars, at its closest', alt: 5.46e10, color: '#ff8a5c' },
  { id: 'sun', icon: 'sun', name: 'The Sun', alt: 1.496e11, color: '#ffd166' },
  { id: 'jupiter', icon: 'ringed', name: 'Jupiter, at its closest', alt: 5.88e11, color: '#e8c7a0' },
  { id: 'neptune', icon: 'planet', name: 'Neptune', alt: 4.3e12, color: '#6fa8ff' },
  { id: 'voyager', icon: 'probe', name: 'Voyager 1, the farthest human-made object', alt: 2.53e13, color: '#cfd8e8' },
  { id: 'ly', icon: 'ruler', name: 'One light-year', alt: LY },
  { id: 'proxima', icon: 'star', name: 'Proxima Centauri, nearest star', alt: 4.24 * LY, color: '#ff9f80' },
  { id: 'mwcenter', icon: 'galaxy', name: 'Centre of the Milky Way', alt: 26000 * LY, color: '#ffe1b0' },
  { id: 'mwacross', icon: 'galaxy', name: 'All the way across the Milky Way', alt: 100000 * LY, color: '#c9d4ff' },
  { id: 'andromeda', icon: 'galaxy', name: 'Andromeda Galaxy', alt: 2.5e6 * LY, color: '#d6c9ff' },
  { id: 'virgo', icon: 'galaxy', name: 'Virgo Cluster, 1,300+ galaxies', alt: 5.4e7 * LY, color: '#c9d4ff' },
  { id: 'edge', icon: 'universe', name: 'Edge of the observable universe', alt: 4.65e10 * LY, color: '#ffffff' },
];

// ---------- the story ----------

export interface Fact {
  tag?: string;
  text: string;
}

const F: Record<number, Fact> = {
  0: { text: 'A single sheet of paper, magnified 5,000 times. It is 0.1 mm thick, a little thicker than a human hair.' },
  1: { text: 'Two layers. Hard to see, but it has doubled.' },
  2: { text: 'Four layers. Thicker than a grain of salt now.' },
  3: { text: 'Eight layers. About as thick as a credit card.' },
  4: { text: 'Sixteen layers. Each fold doubles everything that came before it.' },
  5: { text: 'As tall as an ant. Thirty-two layers deep.' },
  6: { text: 'Most people say paper can only be folded 7 times. Let’s see.' },
  7: { tag: 'The “7 fold limit”', text: 'It’s a myth, but a stubborn one. Real paper gets brutally stiff around here.' },
  8: { text: 'Taller than a coin standing on its edge.' },
  9: { text: 'Taller than a golf ball. 512 layers.' },
  10: { text: '1,024 layers. As tall as a coffee mug.' },
  11: { text: 'About the height of a sitting cat.' },
  12: { tag: 'World record', text: 'In 2002, high-schooler Britney Gallivan folded a 1.2 km strip of paper 12 times. Nobody has gone further. Everything after this is imagination.' },
  13: { text: 'As tall as a toddler.' },
  14: { text: 'About as tall as you. 16,384 layers of paper.' },
  15: { text: 'Taller than an elephant.' },
  16: { text: 'A giraffe would have to look up.' },
  17: { text: 'Taller than a two-storey house.' },
  18: { text: 'As tall as a blue whale is long.' },
  19: { text: 'Taller than the Arc de Triomphe.' },
  20: { tag: 'A million layers', text: '1,048,576 sheets, stacked taller than the Statue of Liberty.' },
  21: { text: 'You just passed the Great Pyramid of Giza.' },
  22: { text: 'Taller than the Eiffel Tower and the Empire State Building.' },
  23: { tag: 'Tallest building', text: 'Taller than the Burj Khalifa, the tallest building on Earth.' },
  24: { text: 'Your paper is poking into the clouds.' },
  25: { text: 'Laid flat, it would take you 40 minutes to walk its length.' },
  26: { text: 'Taller than Mount Fuji.' },
  27: { tag: 'Top of the world', text: 'Higher than Mount Everest, and higher than airliners fly.' },
  28: { text: 'The sky is turning dark. 268 million layers.' },
  29: { text: 'Higher than the highest skydive ever made, from 41 km.' },
  30: { tag: 'Space', text: 'You’ve crossed the Kármán line. Your stack of paper is officially in space.' },
  31: { text: 'The northern lights shimmer around this height.' },
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
  42: { tag: 'The Moon', text: 'You made it. A single sheet of paper, folded 42 times, reaches past the Moon.' },
  43: { text: 'Twice the distance to the Moon. Let’s keep going.' },
  49: { tag: 'Mars', text: 'Past Mars at its closest approach to Earth.' },
  51: { tag: 'The Sun', text: 'Past the Sun. 51 folds.' },
  53: { text: 'Past Jupiter.' },
  56: { text: 'Past Neptune, the outermost planet.' },
  58: { tag: 'Voyager 1', text: 'Past Voyager 1, launched in 1977 and still the farthest thing humans have ever made.' },
  60: { text: 'A quintillion layers. That’s a 1 with 18 zeros.' },
  67: { tag: 'One light-year', text: 'Light itself needs a full year to climb your paper.' },
  69: { tag: 'Nearest star', text: 'Past Proxima Centauri, our closest neighbouring star.' },
  78: { text: 'Past almost every star you can see with the naked eye.' },
  82: { tag: 'Galactic centre', text: 'All the way to the black hole at the centre of the Milky Way.' },
  83: { tag: 'The Milky Way', text: 'Taller than our entire galaxy is wide.' },
  88: { tag: 'Andromeda', text: 'Past the Andromeda Galaxy, 2.5 million light-years away.' },
  93: { text: 'Past the Virgo Cluster and its thousand-plus galaxies.' },
  100: { text: 'Fold 100. There are now more layers of paper than atoms in your body.' },
  102: { tag: 'The end', text: 'Your paper is now taller than the observable universe. From one sheet. 102 folds.' },
};

export function factFor(n: number): Fact {
  if (F[n]) return F[n];
  const t = thickness(n);
  if (n > MOON_FOLD) return { text: `Light takes ${fmtLightTime(t)} to travel from the bottom of your paper to the top.` };
  return { text: '' };
}

/** Milestones for the progress rail. */
export const RAIL: { name: string; m: number }[] = [
  { name: 'Hair', m: 7e-5 },
  { name: 'Coin', m: 0.024 },
  { name: 'You', m: 1.7 },
  { name: 'Burj', m: 828 },
  { name: 'Everest', m: 8849 },
  { name: 'Space', m: 1e5 },
  { name: 'Moon', m: MOON_ALT },
];

export const RAIL_DEEP: { name: string; m: number }[] = [
  { name: 'Moon', m: MOON_ALT },
  { name: 'Sun', m: 1.496e11 },
  { name: 'Voyager', m: 2.53e13 },
  { name: 'Stars', m: 4.24 * LY },
  { name: 'Galaxy', m: 1e5 * LY },
  { name: 'Andromeda', m: 2.5e6 * LY },
  { name: 'Universe', m: 4.65e10 * LY },
];
