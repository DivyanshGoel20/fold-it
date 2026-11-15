import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './style.css';
import { Scene, Cam, TowerState } from './scene';
import { CLIMBERS, MARKERS, MAX_FOLD, MOON_FOLD, MOON_ALT, PAPER_T, RAIL, SUN_ALT, factFor, fmtDuration, fmtWords, foldFor, layers, thickness } from './data';
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
const SUN_FOLD = foldFor(SUN_ALT);
type Fly = 'moon' | 'sun';
type Seg = { kind: 'fold'; n: number; len: number } | { kind: 'fly'; at: number; target: Fly; len: number } | { kind: 'end'; len: number };
const TIMELINE: Seg[] = [];
// folds where something new appears get a full scroll step; quiet ones go by faster
const busy = new Set<number>();
for (const m of MARKERS) busy.add(foldFor(m.alt));
for (let k = 0; k <= MAX_FOLD; k++) if (k <= 30 || factFor(k).tag) busy.add(k);
for (let n = 0; n < MAX_FOLD; n++) {
  TIMELINE.push({ kind: 'fold', n, len: busy.has(n + 1) || busy.has(n) ? 1 : 0.6 });
  if (n + 1 === MOON_FOLD) TIMELINE.push({ kind: 'fly', at: MOON_FOLD, target: 'moon', len: 2.6 });
  if (n + 1 === SUN_FOLD) TIMELINE.push({ kind: 'fly', at: SUN_FOLD, target: 'sun', len: 2.4 });
}
TIMELINE.push({ kind: 'end', len: 0.8 });
const TOTAL = TIMELINE.reduce((s, x) => s + x.len, 0);

/** scroll position (in units) where fold k has just been completed */
function uForFold(k: number) {
  let acc = 0;
  for (const s of TIMELINE) {
    if (s.kind === 'fold' && s.n === k - 1) return acc + s.len * 0.9;
    acc += s.len;
  }
  return k <= 0 ? 0 : TOTAL;
}

const unit = () => window.innerHeight * (scene.mobile ? 0.7 : 0.62);
const track = $('track');
function sizeTrack() {
  track.style.height = `${TOTAL * unit() + window.innerHeight}px`;
}

interface Frame {
  cam: Cam;
  tower: TowerState;
  k: number;
  thick: number;
}

function frameAt(u: number): Frame {
  let acc = 0;
  for (const s of TIMELINE) {
    if (u < acc + s.len || s.kind === 'end') {
      const t = clamp(u - acc, 0, s.len);
      if (s.kind === 'fold') {
        const q = seg(t / s.len, 0.12, 0.88);
        const tower: TowerState = { n: s.n, theta: 0, settle: 0 };
        if (q > 0 && q < 0.46) tower.theta = Math.PI * ease(q / 0.46);
        else if (q >= 0.46 && q < 0.62) tower.settle = Math.max(1e-4, seg(q, 0.46, 0.62));
        else if (q >= 0.62) tower.n = s.n + 1;
        const c = ease(seg(q, 0.3, 1));
        return { cam: lerpCam(scene.camFor(s.n), scene.camFor(s.n + 1), c, 0), tower, k: q >= 0.46 ? s.n + 1 : s.n, thick: s.n + c };
      }
      if (s.kind === 'fly') {
        const tower = { n: s.at, theta: 0, settle: 0 };
        const target = s.target === 'moon' ? scene.moonCam() : scene.sunCam();
        const anchor = s.target === 'moon' ? MOON_ALT : SUN_ALT;
        const zin = ease(seg(t, 0, 1));
        const zout = ease(seg(t, s.len - 1, s.len));
        const cam = zout > 0 ? lerpCam(target, scene.camFor(s.at), zout, anchor) : lerpCam(scene.camFor(s.at), target, zin, anchor);
        return { cam, tower, k: s.at, thick: s.at };
      }
      return { cam: scene.camFor(MAX_FOLD), tower: { n: MAX_FOLD, theta: 0, settle: 0 }, k: MAX_FOLD, thick: MAX_FOLD };
    }
    acc += s.len;
  }
  throw new Error('unreachable');
}

// ---------- UI ----------
const ui = {
  card: $('card'),
  foldN: $('foldN'),
  layers: $('layers'),
  tv: $('tv'),
  tu: $('tu'),
  desc: $('desc'),
  stamp: $('stamp'),
  hero: $('hero'),
  hint: $('hint'),
  end: $('end'),
  climb: $('climb'),
  climbList: $('climbList'),
  railFill: $('railFill'),
  railDot: $('railDot'),
  railTicks: $('railTicks'),
};

// the folding ruler: every milestone is a button
const RAIL_LO = Math.log10(PAPER_T);
const RAIL_HI = Math.log10(RAIL[RAIL.length - 1].m);
const railPos = (m: number) => clamp((Math.log10(m) - RAIL_LO) / (RAIL_HI - RAIL_LO));
// spread labels so none overlap, while the tick stays at the true position
const labelPos: number[] = [];
RAIL.forEach((r, i) => labelPos.push(Math.max(railPos(r.m), i ? labelPos[i - 1] + 0.034 : 0)));
ui.railTicks.innerHTML = RAIL.map(
  (r, i) => `<button class="mark" data-i="${i}" style="bottom:${labelPos[i] * 100}%" title="Jump to ${r.name}"><span>${r.name}</span></button>`,
).join('');
const marks = [...ui.railTicks.querySelectorAll<HTMLButtonElement>('.mark')];
marks.forEach((b) =>
  b.addEventListener('click', () => {
    const r = RAIL[+b.dataset.i!];
    jumpTo(uForFold(foldFor(r.m)));
  }),
);

let jumping = false;
function jumpTo(u: number) {
  jumping = true;
  window.scrollTo({ top: u * prevUnit, behavior: 'instant' as ScrollBehavior });
}

ui.climbList.innerHTML = CLIMBERS.map((c) => `<li><span>${c.name}</span><b></b></li>`).join('');
const climbVals = [...ui.climbList.querySelectorAll('b')];

let shownK = -1;
let swapTimer = 0;
function setCard(k: number) {
  if (k === shownK) return;
  shownK = k;
  const f = factFor(k);
  ui.card.classList.add('swap');
  clearTimeout(swapTimer);
  swapTimer = window.setTimeout(() => {
    ui.foldN.textContent = String(k);
    ui.layers.textContent = k === 0 ? '1 layer' : `${layers(k)} layers`;
    ui.desc.textContent = f.text;
    ui.card.classList.remove('swap');
    if (f.tag) {
      ui.stamp.textContent = f.tag;
      ui.stamp.hidden = false;
      ui.stamp.classList.remove('thunk');
      void ui.stamp.offsetWidth;
      ui.stamp.classList.add('thunk');
    } else ui.stamp.hidden = true;
  }, 120);
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
  jumpTo(0);
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
let activeMark = -1;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const target = clamp(window.scrollY / prevUnit, 0, TOTAL);
  const gap = Math.abs(target - disp);
  // long jumps sweep through the folds instead of teleporting
  const rate = jumping && gap > 2 ? 2.2 : 10;
  disp += (target - disp) * (1 - Math.exp(-dt * rate));
  if (gap < 0.0005) {
    disp = target;
    jumping = false;
  }

  const fr = frameAt(disp);
  scene.creaseLevel = clamp(fr.thick + 1, 0, 6) * (1 - smooth(8, 14, fr.thick));
  scene.render(fr.cam, fr.tower, now);
  setCard(fr.k);

  thickDisp += (fr.thick - thickDisp) * (1 - Math.exp(-dt * 12));
  if (Math.abs(fr.thick - thickDisp) < 0.001) thickDisp = fr.thick;
  const T = PAPER_T * Math.pow(2, thickDisp);
  const w = fmtWords(T);
  if (ui.tv.textContent !== w.v) ui.tv.textContent = w.v;
  if (ui.tu.textContent !== w.u) {
    ui.tu.textContent = w.u;
    ui.card.classList.toggle('long', w.u.length > 12);
  }

  climbVals.forEach((b, i) => {
    const v = fmtDuration(T / CLIMBERS[i].v);
    if (b.textContent !== v) b.textContent = v;
  });
  ui.climb.classList.toggle('show', fr.thick > 23.5 && disp < TOTAL - 0.4);

  const p = railPos(T);
  ui.railFill.style.transform = `scaleY(${p})`;
  ui.railDot.style.bottom = `${p * 100}%`;
  let am = -1;
  RAIL.forEach((r, i) => {
    if (T >= r.m * 0.999) am = i;
  });
  if (am !== activeMark) {
    marks.forEach((m, i) => m.classList.toggle('passed', i <= am));
    activeMark = am;
  }

  const heroA = 1 - smooth(0.02, 0.35, disp);
  ui.hero.style.opacity = String(heroA);
  ui.hero.style.transform = `translate(-50%, ${-(1 - heroA) * 40}px)`;
  ui.hero.style.visibility = heroA < 0.01 ? 'hidden' : 'visible';
  ui.card.style.opacity = String(smooth(0.15, 0.45, disp));
  ui.card.style.visibility = disp < 0.12 ? 'hidden' : 'visible';
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

(window as any).__fold = { scene, TOTAL, unit, uForFold, thickness };
