import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './style.css';
import { Scene, Cam, TowerState } from './scene';
import { MAX_FOLD, MOON_FOLD, MOON_ALT, PAPER_T, RAIL, factFor, fmtWords, layers } from './data';
import CREDITS from './credits.json';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const scene = new Scene($('app'));

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function lerpCam(a: Cam, b: Cam, t: number, anchor: number): Cam {
  const sa = a.sy - (anchor - a.ay) * a.scale;
  const sb = b.sy - (anchor - b.ay) * b.scale;
  return {
    scale: a.scale * Math.pow(b.scale / a.scale, t),
    ay: anchor,
    sy: sa + (sb - sa) * t,
    ox: a.ox + (b.ox - a.ox) * t,
  };
}

// ---------- the scroll timeline ----------
type Seg = { kind: 'fold'; n: number; len: number } | { kind: 'moon'; len: number } | { kind: 'end'; len: number };
const TIMELINE: Seg[] = [];
for (let n = 0; n < MAX_FOLD; n++) {
  TIMELINE.push({ kind: 'fold', n, len: 1 });
  if (n + 1 === MOON_FOLD) TIMELINE.push({ kind: 'moon', len: 2.6 });
}
TIMELINE.push({ kind: 'end', len: 0.8 });
const TOTAL = TIMELINE.reduce((s, x) => s + x.len, 0);

const unit = () => window.innerHeight * (scene.mobile ? 0.7 : 0.62);
const track = $('track');
function sizeTrack() {
  track.style.height = `${TOTAL * unit() + window.innerHeight}px`;
}

interface Frame {
  cam: Cam;
  tower: TowerState;
  k: number; // folds to show in the header
  thick: number; // log2 of displayed thickness / 0.1mm
}

function frameAt(u: number): Frame {
  let acc = 0;
  for (const s of TIMELINE) {
    if (u < acc + s.len || s.kind === 'end') {
      const t = clamp(u - acc, 0, s.len);
      if (s.kind === 'fold') {
        const q = seg(t, 0.12, 0.88);
        const tower: TowerState = { n: s.n, theta: 0, settle: 0 };
        if (q > 0 && q < 0.46) tower.theta = Math.PI * ease(q / 0.46);
        else if (q >= 0.46 && q < 0.62) tower.settle = Math.max(1e-4, seg(q, 0.46, 0.62));
        else if (q >= 0.62) tower.n = s.n + 1;
        const c = ease(seg(q, 0.3, 1));
        return { cam: lerpCam(scene.camFor(s.n), scene.camFor(s.n + 1), c, 0), tower, k: q >= 0.46 ? s.n + 1 : s.n, thick: s.n + c };
      }
      if (s.kind === 'moon') {
        const tower = { n: MOON_FOLD, theta: 0, settle: 0 };
        const zin = ease(seg(t, 0, 1));
        const zout = ease(seg(t, 1.6, 2.6));
        const cam = zout > 0
          ? lerpCam(scene.moonCam(), scene.camFor(MOON_FOLD), zout, MOON_ALT)
          : lerpCam(scene.camFor(MOON_FOLD), scene.moonCam(), zin, MOON_ALT);
        return { cam, tower, k: MOON_FOLD, thick: MOON_FOLD };
      }
      return { cam: scene.camFor(MAX_FOLD), tower: { n: MAX_FOLD, theta: 0, settle: 0 }, k: MAX_FOLD, thick: MAX_FOLD };
    }
    acc += s.len;
  }
  throw new Error('unreachable');
}

// ---------- UI ----------
const ui = {
  head: $('head'),
  eyebrow: $('eyebrow'),
  tv: $('tv'),
  tu: $('tu'),
  desc: $('desc'),
  hero: $('hero'),
  hint: $('hint'),
  end: $('end'),
  railFill: $('railFill'),
  railDot: $('railDot'),
  railTicks: $('railTicks'),
};

const RAIL_LO = Math.log10(PAPER_T);
const RAIL_HI = Math.log10(RAIL[RAIL.length - 1].m);
ui.railTicks.innerHTML = RAIL.map(
  (r) => `<div class="tick" style="bottom:${((Math.log10(r.m) - RAIL_LO) / (RAIL_HI - RAIL_LO)) * 100}%"><span>${r.name}</span></div>`,
).join('');

let shownK = -1;
let swapTimer = 0;
function setHeader(k: number) {
  if (k === shownK) return;
  shownK = k;
  const f = factFor(k);
  const lay = k === 0 ? '1 layer' : `${layers(k)} layers`;
  ui.head.classList.add('swap');
  clearTimeout(swapTimer);
  swapTimer = window.setTimeout(() => {
    ui.eyebrow.innerHTML = `<span>Fold ${k}</span>${f.tag ? `<em>${f.tag}</em>` : ''}<span class="lay">${lay}</span>`;
    ui.desc.textContent = f.text;
    ui.head.classList.remove('swap');
  }, 140);
}

const creditList = $('credits');
creditList.innerHTML = Object.values(CREDITS as Record<string, { title: string; page: string }>)
  .map((c) => `<li><a href="${c.page}" target="_blank" rel="noopener">${c.title.replace(/^File:/, '').replace(/\.(jpe?g|png|tif)$/i, '')}</a></li>`)
  .join('');
const about = $<HTMLDialogElement>('about');
$('info').addEventListener('click', () => about.showModal());
about.addEventListener('click', (e) => {
  if (e.target === about) about.close();
});

const toTop = (e?: Event) => {
  e?.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
$('brand').addEventListener('click', toTop);
$('top').addEventListener('click', toTop);

let prevUnit = unit();
window.addEventListener('resize', () => {
  const u = window.scrollY / prevUnit;
  scene.resize();
  sizeTrack();
  prevUnit = unit();
  window.scrollTo(0, u * prevUnit);
});

// ---------- frame loop ----------
let disp = 0;
let thickDisp = 0;
let last = performance.now();
let darkOn = false;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const target = clamp(window.scrollY / prevUnit, 0, TOTAL);
  disp += (target - disp) * (1 - Math.exp(-dt * 10));
  if (Math.abs(target - disp) < 0.0005) disp = target;

  const fr = frameAt(disp);
  scene.render(fr.cam, fr.tower, now);
  setHeader(fr.k);

  thickDisp += (fr.thick - thickDisp) * (1 - Math.exp(-dt * 12));
  if (Math.abs(fr.thick - thickDisp) < 0.001) thickDisp = fr.thick;
  const w = fmtWords(PAPER_T * Math.pow(2, thickDisp));
  if (ui.tv.textContent !== w.v) ui.tv.textContent = w.v;
  if (ui.tu.textContent !== w.u) {
    ui.tu.textContent = w.u;
    ui.head.classList.toggle('long', w.u.length > 12);
  }

  const p = clamp((Math.log10(PAPER_T * Math.pow(2, thickDisp)) - RAIL_LO) / (RAIL_HI - RAIL_LO));
  ui.railFill.style.transform = `scaleY(${p})`;
  ui.railDot.style.bottom = `calc(${p * 100}% - 4px)`;

  const heroA = 1 - smooth(0.02, 0.35, disp);
  ui.hero.style.opacity = String(heroA);
  ui.hero.style.transform = `translate(-50%, ${-(1 - heroA) * 30}px)`;
  ui.hero.style.visibility = heroA < 0.01 ? 'hidden' : 'visible';
  ui.head.style.opacity = String(smooth(0.15, 0.45, disp));
  ui.hint.style.opacity = String(1 - smooth(0.02, 0.2, disp));
  ui.end.classList.toggle('show', disp > TOTAL - 0.5);

  const d = scene.darkness;
  if (!darkOn && d > 0.55) {
    darkOn = true;
    document.body.classList.add('dark');
  } else if (darkOn && d < 0.45) {
    darkOn = false;
    document.body.classList.remove('dark');
  }

  requestAnimationFrame(frame);
}

sizeTrack();
window.scrollTo(0, 0);
requestAnimationFrame(frame);

(window as any).__fold = { scene, TOTAL, unit, MOON_ALT };
