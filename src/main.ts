import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import { Scene, Cam, TowerState } from './scene';
import { sound } from './audio';
import { MAX_FOLD, MOON_FOLD, MOON_ALT, PAPER_T, RAIL, RAIL_DEEP, factFor, fmtLen, layers, thickness } from './data';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const scene = new Scene($('app'));

// ---------- helpers ----------
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

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

// ---------- state ----------
type Mode = 'intro' | 'idle' | 'fold' | 'unfold' | 'flyby' | 'finale' | 'return';

const st = {
  mode: 'intro' as Mode,
  n: 0,
  t0: 0,
  dur: 1500,
  landed: false,
  held: false,
  queued: 0,
  guess: 1000,
  moonDone: false,
  endDone: false,
  disp: 0, // smoothed log2 thickness for counters
  shake: 0,
  camFrom: null as Cam | null,
  camTo: null as Cam | null,
};

// ---------- UI refs ----------
const ui = {
  num: $('num'),
  tv: $('tv'),
  tu: $('tu'),
  layers: $('layers'),
  capTag: $('capTag'),
  capText: $('capText'),
  caption: $('caption'),
  fold: $<HTMLButtonElement>('fold'),
  unfold: $<HTMLButtonElement>('unfold'),
  hint: $('hint'),
  intro: $('intro'),
  finale: $('finale'),
  fTag: $('fTag'),
  fTitle: $('fTitle'),
  fText: $('fText'),
  fGuess: $('fGuess'),
  fGo: $<HTMLButtonElement>('fGo'),
  guess: $<HTMLInputElement>('guess'),
  sound: $('sound'),
  toast: $('toast'),
  railFill: $('railFill'),
  railDot: $('railDot'),
  railTicks: $('railTicks'),
  rail: $('rail'),
};

// ---------- caption ----------
let capTimer = 0;
function setCaption(n: number, animate = true) {
  const f = factFor(n);
  const apply = () => {
    ui.capTag.textContent = f.tag ?? '';
    ui.capTag.style.display = f.tag ? '' : 'none';
    ui.capText.textContent = f.text;
    ui.caption.classList.toggle('empty', !f.text);
    ui.caption.classList.toggle('special', !!f.tag);
    ui.caption.classList.remove('out');
  };
  clearTimeout(capTimer);
  if (!animate) return apply();
  ui.caption.classList.add('out');
  capTimer = window.setTimeout(apply, 160);
}

function setCount(n: number) {
  ui.num.textContent = String(n);
  ui.num.classList.remove('bump');
  void ui.num.offsetWidth;
  ui.num.classList.add('bump');
  ui.layers.textContent = n === 0 ? '1 layer' : `${layers(n)} layers`;
  ui.unfold.disabled = n === 0;
  ui.fold.disabled = n >= MAX_FOLD;
}

// ---------- rail ----------
let railDeep = false;
function buildRail() {
  const list = railDeep ? RAIL_DEEP : RAIL;
  const lo = Math.log10(railDeep ? list[0].m : PAPER_T);
  const hi = Math.log10(list[list.length - 1].m);
  ui.railTicks.innerHTML = list
    .map((r) => `<div class="tick" style="bottom:${((Math.log10(r.m) - lo) / (hi - lo)) * 100}%"><span>${r.name}</span></div>`)
    .join('');
  ui.rail.dataset.lo = String(lo);
  ui.rail.dataset.hi = String(hi);
  ui.rail.classList.toggle('deep', railDeep);
}
function updateRail() {
  const lo = +ui.rail.dataset.lo!, hi = +ui.rail.dataset.hi!;
  const m = PAPER_T * Math.pow(2, st.disp);
  const p = clamp((Math.log10(m) - lo) / (hi - lo));
  ui.railFill.style.transform = `scaleY(${p})`;
  ui.railDot.style.bottom = `calc(${p * 100}% - 6px)`;
}

// ---------- actions ----------
function begin(mode: 'fold' | 'unfold') {
  const fast = st.held || st.queued > 0;
  st.mode = mode;
  st.t0 = performance.now();
  st.dur = fast ? 950 : 1500;
  st.landed = false;
  const base = mode === 'fold' ? st.n : st.n - 1;
  sound.fold(clamp(base / 40), (st.dur * 0.46) / 1000);
  if (mode === 'unfold') {
    st.n -= 1;
    setCount(st.n);
    setCaption(st.n);
  }
  ui.hint.classList.add('gone');
}

function requestFold() {
  if (st.mode === 'intro' || st.mode === 'finale' || st.mode === 'flyby' || st.mode === 'return') return;
  if (st.n >= MAX_FOLD) return;
  if (st.mode === 'idle') begin('fold');
  else if (st.queued < 2) st.queued++;
}

function requestUnfold() {
  if (st.mode !== 'idle' || st.n <= 0) return;
  st.queued = 0;
  begin('unfold');
}

function onLanded(n: number) {
  setCount(n);
  setCaption(n);
  const heavy = clamp(n / 40);
  sound.land(heavy);
  scene.burst(n);
  if (n >= 14) st.shake = Math.min(1, 0.25 + n / 60);
  if (factFor(n).tag) sound.milestone();
}

function onFoldDone() {
  if (st.n === MOON_FOLD && !st.moonDone) {
    st.moonDone = true;
    st.queued = 0;
    st.held = false;
    startCamAnim('flyby', scene.camFor(MOON_FOLD), scene.moonCam(), 3200);
    sound.triumph();
    return;
  }
  if (st.n === MAX_FOLD && !st.endDone) {
    st.endDone = true;
    st.queued = 0;
    st.held = false;
    sound.triumph();
    window.setTimeout(() => showFinale('end'), 900);
    st.mode = 'finale';
    return;
  }
  st.mode = 'idle';
  if (st.queued > 0 || st.held) {
    st.queued = Math.max(0, st.queued - 1);
    requestFold();
  }
}

function startCamAnim(mode: 'flyby' | 'return', from: Cam, to: Cam, dur: number) {
  st.mode = mode;
  st.camFrom = from;
  st.camTo = to;
  st.t0 = performance.now();
  st.dur = dur;
}

function showFinale(kind: 'moon' | 'end') {
  const g = st.guess;
  if (kind === 'moon') {
    ui.fTag.textContent = `Fold ${MOON_FOLD}`;
    ui.fTitle.textContent = 'You reached the Moon.';
    ui.fText.innerHTML = `One sheet of paper, folded ${MOON_FOLD} times, is <b>439,805 km</b> thick. That’s <b>${layers(MOON_FOLD)}</b> layers, and it sails right past the Moon.`;
    let verdict: string;
    if (g === MOON_FOLD) verdict = 'Exactly right. Impressive.';
    else if (g > MOON_FOLD) {
      const x = g / MOON_FOLD;
      verdict = x >= 3 ? `That’s ${Math.round(x).toLocaleString('en-US')}× too many. Almost everyone guesses way too high, because doubling is sneaky.` : `Close, but too high. Doubling gets away from you fast.`;
    } else verdict = g >= MOON_FOLD - 6 ? 'Close, but too low.' : 'Too low. Even doubling needs a little time to get going.';
    ui.fGuess.innerHTML = `<span>Your guess</span><b>${g.toLocaleString('en-US')}</b><em>${verdict}</em>`;
    ui.fGo.textContent = 'Keep folding to the edge of the universe';
    ui.fGo.style.display = '';
  } else {
    ui.fTag.textContent = `Fold ${MAX_FOLD}`;
    ui.fTitle.textContent = 'Bigger than the universe.';
    ui.fText.innerHTML = `After ${MAX_FOLD} folds your paper is <b>${fmtLen(thickness(MAX_FOLD)).v} ${fmtLen(thickness(MAX_FOLD)).u}</b> thick, taller than everything we can see. It started as one sheet, 0.1&nbsp;mm thick.`;
    ui.fGuess.innerHTML = `<span>Layers of paper</span><b class="huge">${layers(MAX_FOLD)}</b>`;
    ui.fGo.style.display = 'none';
  }
  ui.finale.hidden = false;
  requestAnimationFrame(() => ui.finale.classList.add('show'));
  st.mode = 'finale';
}

function hideFinale() {
  ui.finale.classList.remove('show');
  window.setTimeout(() => (ui.finale.hidden = true), 400);
}

function restart() {
  hideFinale();
  st.n = 0;
  st.queued = 0;
  st.held = false;
  st.moonDone = false;
  st.endDone = false;
  st.disp = 0;
  railDeep = false;
  buildRail();
  setCount(0);
  setCaption(0, false);
  ui.hint.classList.remove('gone');
  st.mode = 'intro';
  ui.intro.hidden = false;
  requestAnimationFrame(() => ui.intro.classList.remove('leave'));
  sound.space(0);
}

function start() {
  const g = parseInt(ui.guess.value, 10);
  st.guess = Number.isFinite(g) && g > 0 ? g : 1000;
  sound.init();
  sound.click();
  ui.intro.classList.add('leave');
  window.setTimeout(() => (ui.intro.hidden = true), 700);
  st.mode = 'idle';
  setCaption(0, false);
  ui.caption.classList.add('out');
  window.setTimeout(() => ui.caption.classList.remove('out'), 500);
}

let toastTimer = 0;
function toast(msg: string) {
  ui.toast.textContent = msg;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2200);
}

async function share() {
  const text = st.n >= MAX_FOLD
    ? `I folded a sheet of paper ${MAX_FOLD} times and it became bigger than the observable universe.`
    : `I folded a sheet of paper ${MOON_FOLD} times and it reached the Moon. (I guessed ${st.guess.toLocaleString('en-US')} folds.)`;
  const url = location.href;
  try {
    if (navigator.share) await navigator.share({ title: 'Fold It', text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast('Copied to clipboard');
    }
  } catch {
    /* cancelled */
  }
}

// ---------- events ----------
ui.fold.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  sound.init();
  st.held = true;
  requestFold();
});
const release = () => (st.held = false);
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
ui.fold.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') e.preventDefault();
});
ui.unfold.addEventListener('click', () => requestUnfold());
$('start').addEventListener('click', start);
$('restart').addEventListener('click', restart);
$('brand').addEventListener('click', restart);
$('fAgain').addEventListener('click', restart);
$('fShare').addEventListener('click', share);
ui.fGo.addEventListener('click', () => {
  hideFinale();
  railDeep = true;
  buildRail();
  startCamAnim('return', scene.moonCam(), scene.camFor(MOON_FOLD), 1800);
});
ui.sound.addEventListener('click', () => toggleSound());
function toggleSound() {
  sound.init();
  sound.setEnabled(!sound.enabled);
  ui.sound.classList.toggle('muted', !sound.enabled);
}
document.querySelectorAll<HTMLButtonElement>('.g-step').forEach((b) =>
  b.addEventListener('click', () => {
    const v = parseInt(ui.guess.value, 10) || 0;
    const step = +b.dataset.step!;
    const mag = v >= 1000 ? 100 : v >= 100 ? 10 : 1;
    ui.guess.value = String(clamp(v + step * mag, 1, 1000000));
  }),
);
ui.guess.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') start();
});

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'Enter') {
    if (st.mode === 'intro') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
      return;
    }
    e.preventDefault();
    if (e.repeat) return;
    if (e.key === ' ') st.held = true;
    sound.init();
    requestFold();
  } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'ArrowDown') {
    e.preventDefault();
    requestUnfold();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleSound();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === ' ') st.held = false;
});
window.addEventListener('resize', () => scene.resize());

// ---------- frame loop ----------
let last = performance.now();
let darkOn = false;

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  let cam: Cam;
  const tower: TowerState = { n: st.n, theta: 0, settle: 0 };
  let target = st.n;

  if (st.mode === 'fold' || st.mode === 'unfold') {
    const p = clamp((now - st.t0) / st.dur);
    const q = st.mode === 'fold' ? p : 1 - p;
    // in unfold mode st.n was already decremented, so this is the fold being reversed
    const base = st.n;
    tower.n = base;
    const rot = seg(q, 0, 0.46);
    if (q < 0.46) tower.theta = Math.PI * ease(rot);
    else tower.settle = Math.max(1e-4, seg(q, 0.46, 0.62));
    cam = lerpCam(scene.camFor(base), scene.camFor(base + 1), ease(seg(q, 0.3, 1)), 0);
    target = base + ease(seg(q, 0.3, 1));
    if (st.mode === 'fold' && !st.landed && q >= 0.46) {
      st.landed = true;
      onLanded(base + 1);
    }
    if (q >= 0.46 && tower.settle >= 1) {
      tower.n = base + 1;
      tower.settle = 0;
    }
    if (p >= 1) {
      if (st.mode === 'fold') {
        st.n += 1;
        tower.n = st.n;
        tower.settle = 0;
        onFoldDone();
      } else {
        tower.n = st.n;
        tower.theta = 0;
        st.mode = 'idle';
        if (st.n < MOON_FOLD && railDeep) {
          railDeep = false;
          buildRail();
        }
      }
    }
  } else if (st.mode === 'flyby' || st.mode === 'return') {
    const p = clamp((now - st.t0) / st.dur);
    cam = lerpCam(st.camFrom!, st.camTo!, ease(p), MOON_ALT);
    if (p >= 1) {
      if (st.mode === 'flyby') showFinale('moon');
      else st.mode = 'idle';
    }
  } else if (st.mode === 'finale' && st.moonDone && st.n === MOON_FOLD && !st.endDone) {
    cam = scene.moonCam();
  } else {
    cam = scene.camFor(st.n);
  }

  if (st.shake > 0) {
    cam = { ...cam, sy: cam.sy + Math.sin(now * 0.09) * st.shake * 4 };
    st.shake = Math.max(0, st.shake - dt * 2.8);
  }

  scene.render(cam, tower, now, dt);

  // counters
  st.disp += (target - st.disp) * (1 - Math.exp(-dt * 7));
  if (Math.abs(target - st.disp) < 0.001) st.disp = target;
  const f = fmtLen(PAPER_T * Math.pow(2, st.disp));
  if (ui.tv.textContent !== f.v) ui.tv.textContent = f.v;
  if (ui.tu.textContent !== f.u) ui.tu.textContent = f.u;
  updateRail();

  const d = scene.darkness;
  if (!darkOn && d > 0.55) {
    darkOn = true;
    document.body.classList.add('dark');
  } else if (darkOn && d < 0.45) {
    darkOn = false;
    document.body.classList.remove('dark');
  }
  sound.space(st.mode === 'intro' ? 0 : clamp((d - 0.4) * 1.6));

  requestAnimationFrame(frame);
}

// ---------- boot ----------
buildRail();
setCount(0);
setCaption(0, false);
requestAnimationFrame(frame);

// keep a reference for debugging in the console
(window as any).__fold = { st, scene, MOON_ALT };
