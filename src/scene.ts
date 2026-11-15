import { A4, EARTH_R, MOON_ALT, MOON_R, LY, THINGS, MARKERS, fmt, thickness, Thing, Marker } from './data';
import { ART, ICONS, GALAXY_SVG, ANDROMEDA_SVG } from './illustrations';

export interface Cam {
  scale: number; // px per metre
  ay: number; // anchor world y
  sy: number; // screen y of the anchor
  ox: number; // horizontal pixel offset
}

export interface TowerState {
  n: number; // folds already in the stack
  theta: number; // 0..PI rotation of the moving half (0 = not folding)
  settle: number; // 0..1 after landing
}

type RGBA = [number, number, number, number];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixc = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t));
const rgba = (c: number[], a = c[3] ?? 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKY: [number, RGBA][] = [
  [0, [198, 229, 255, 1]],
  [1500, [160, 210, 252, 1]],
  [8000, [98, 165, 238, 1]],
  [20000, [46, 102, 198, 1]],
  [45000, [16, 42, 112, 0.93]],
  [80000, [6, 14, 42, 0.55]],
  [130000, [2, 4, 12, 0]],
];
const SKY_TOP = 130000;

function skyAt(alt: number): RGBA {
  if (alt <= 0) return SKY[0][1];
  for (let i = 1; i < SKY.length; i++) {
    if (alt <= SKY[i][0]) {
      const [a0, c0] = SKY[i - 1], [a1, c1] = SKY[i];
      return mixc(c0, c1, (alt - a0) / (a1 - a0)) as RGBA;
    }
  }
  return SKY[SKY.length - 1][1];
}

const GROUND_TOP = [172, 214, 146];
const GROUND_DEEP = [92, 152, 88];
const OCEAN_HI = [96, 170, 240];
const OCEAN_LO = [22, 62, 134];

interface ThingEl { t: Thing; el: HTMLElement; ratio: number; side: number; shown: boolean }
interface MarkerEl { m: Marker; el: HTMLElement; line: HTMLElement; shown: boolean }
interface BodyEl { el: HTMLElement; x: number; y: number; d: number; shown: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; rot: number; vr: number }

export class Scene {
  W = 0;
  H = 0;
  dpr = 1;
  bg: HTMLCanvasElement;
  fg: HTMLCanvasElement;
  b: CanvasRenderingContext2D;
  f: CanvasRenderingContext2D;
  deep: HTMLElement;
  things: HTMLElement;
  marks: HTMLElement;
  cam: Cam = { scale: 1, ay: 0, sy: 0, ox: 0 };
  darkness = 0;

  private thingEls: ThingEl[] = [];
  private markerEls: MarkerEl[] = [];
  private bodies: BodyEl[] = [];
  private earthTag: HTMLElement;
  private clouds: { x: number; y: number; w: number; puffs: [number, number, number][] }[] = [];
  private stars: { a: number; u: number; s: number; tw: number }[] = [];
  private continents: [number, number, number][] = [];
  private cloudsEarth: [number, number, number, number][] = [];
  private craters: [number, number, number][] = [];
  private web: [number, number, number][] = [];
  private fiber: CanvasPattern | null = null;
  private particles: Particle[] = [];

  constructor(root: HTMLElement) {
    this.bg = root.querySelector('#bg')!;
    this.fg = root.querySelector('#fg')!;
    this.deep = root.querySelector('#deep')!;
    this.things = root.querySelector('#things')!;
    this.marks = root.querySelector('#marks')!;
    this.b = this.bg.getContext('2d')!;
    this.f = this.fg.getContext('2d')!;
    this.earthTag = document.createElement('div');
    this.earthTag.className = 'earth-tag';
    this.earthTag.innerHTML = '<span></span>Earth';
    this.marks.appendChild(this.earthTag);
    this.build();
    this.resize();
  }

  private build() {
    const r = rng(7);
    // clouds
    for (let i = 0; i < 46; i++) {
      const w = 300 + r() * 1500;
      const puffs: [number, number, number][] = [];
      const n = 4 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const px = (k / (n - 1) - 0.5) * 0.8 + (r() - 0.5) * 0.12;
        const rad = 0.16 + r() * 0.16 * (1 - Math.abs(px));
        puffs.push([px, -rad * 0.5 - r() * 0.08, rad]);
      }
      this.clouds.push({ x: (r() - 0.5) * 60000, y: 900 + r() * 2200, w, puffs });
    }
    // stars (log-polar so they drift inward as we zoom out)
    for (let i = 0; i < 320; i++) this.stars.push({ a: r() * Math.PI * 2, u: r(), s: 0.4 + r() * r() * 1.6, tw: r() * 6 });
    // continents on the Earth (unit circle coords)
    const er = rng(42);
    for (let i = 0; i < 9; i++) {
      const cx = (er() - 0.5) * 1.6, cy = (er() - 0.5) * 1.6;
      for (let k = 0; k < 7; k++) this.continents.push([cx + (er() - 0.5) * 0.35, cy + (er() - 0.5) * 0.3, 0.06 + er() * 0.14]);
    }
    for (let i = 0; i < 16; i++) this.cloudsEarth.push([(er() - 0.5) * 1.8, (er() - 0.5) * 1.8, 0.1 + er() * 0.3, er() * Math.PI]);
    const mr = rng(3);
    for (let i = 0; i < 26; i++) {
      const a = mr() * Math.PI * 2, d = Math.sqrt(mr()) * 0.85;
      this.craters.push([Math.cos(a) * d, Math.sin(a) * d, 0.04 + mr() * mr() * 0.18]);
    }
    const wr = rng(11);
    for (let i = 0; i < 700; i++) {
      const a = wr() * Math.PI * 2, d = Math.sqrt(wr());
      this.web.push([Math.cos(a) * d, Math.sin(a) * d, wr()]);
    }

    // paper fibre texture
    const pc = document.createElement('canvas');
    pc.width = pc.height = 256;
    const p = pc.getContext('2d')!;
    const fr = rng(5);
    for (let i = 0; i < 260; i++) {
      p.strokeStyle = fr() > 0.5 ? 'rgba(180,170,150,0.18)' : 'rgba(255,255,255,0.5)';
      p.lineWidth = 0.6 + fr() * 1.4;
      p.beginPath();
      const x = fr() * 256, y = fr() * 256, a = fr() * Math.PI, l = 10 + fr() * 40;
      p.moveTo(x, y);
      p.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (fr() - 0.5) * 10, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      p.stroke();
    }
    this.fiber = this.f.createPattern(pc, 'repeat');

    // DOM objects
    THINGS.forEach((t, i) => {
      const art = ART[t.art];
      const el = document.createElement('div');
      el.className = 'thing' + (t.backdrop !== undefined ? ' backdrop' : '');
      el.innerHTML = `<svg viewBox="0 0 ${art.vb[0]} ${art.vb[1]}" preserveAspectRatio="none" overflow="visible">${art.svg}</svg>
        <div class="tag"><b>${t.name}</b><span>${t.size ?? fmt(t.h)}</span></div>`;
      (t.backdrop !== undefined ? this.deep : this.things).appendChild(el);
      this.thingEls.push({ t, el, ratio: art.vb[0] / art.vb[1], side: i % 2 ? -1 : 1, shown: false });
    });
    MARKERS.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'marker';
      if (m.color) el.style.setProperty('--mc', m.color);
      el.innerHTML = `<div class="mline"></div><div class="mchip"><svg viewBox="0 0 24 24">${ICONS[m.icon]}</svg><b>${m.name}</b><span>${fmt(m.alt)}</span></div>`;
      this.marks.appendChild(el);
      this.markerEls.push({ m, el, line: el.querySelector('.mline')!, shown: false });
    });
    const addBody = (svg: string, x: number, y: number, d: number, label: string) => {
      const el = document.createElement('div');
      el.className = 'body';
      el.innerHTML = svg + `<div class="btag">${label}</div>`;
      this.deep.appendChild(el);
      this.bodies.push({ el, x, y, d, shown: false });
    };
    addBody(GALAXY_SVG, 0, 2.6e4 * LY, 1e5 * LY, 'The Milky Way');
    addBody(ANDROMEDA_SVG, 1.4e5 * LY, 2.5e6 * LY, 2.2e5 * LY, 'Andromeda');
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    for (const c of [this.bg, this.fg]) {
      c.width = Math.round(this.W * this.dpr);
      c.height = Math.round(this.H * this.dpr);
      c.style.width = this.W + 'px';
      c.style.height = this.H + 'px';
    }
  }

  get baseline() {
    const dock = this.W < 640 ? 196 : 236;
    return Math.max(this.H * 0.62, Math.min(this.H * 0.8, this.H - dock));
  }
  get towerFrac() {
    // leave room for the counter above the tower
    const top = this.W < 640 ? 150 : 190;
    return Math.min(0.5, (this.baseline - top - 30) / this.H);
  }
  get minW() {
    return this.W < 640 ? 16 : 22;
  }

  /** The resting camera for a given fold count. */
  camFor(n: number): Cam {
    return { scale: (this.H * this.towerFrac) / thickness(n), ay: 0, sy: this.baseline, ox: 0 };
  }

  moonCam(): Cam {
    const s = (Math.min(this.W, this.H) * (this.W < 640 ? 0.2 : 0.13)) / MOON_R;
    return { scale: s, ay: MOON_ALT, sy: this.H * (this.W < 640 ? 0.36 : 0.33), ox: -MOON_R * 1.15 * s * 0.55 };
  }

  sy(y: number, cam = this.cam) {
    return cam.sy - (y - cam.ay) * cam.scale;
  }

  // ---------------------------------------------------------------------------

  render(cam: Cam, tower: TowerState, time: number, dt: number) {
    this.cam = cam;
    const { b, f, dpr } = this;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, this.W, this.H);

    const towerHalf = this.towerHalfPx(tower.n);
    this.drawBackground(time, towerHalf);
    this.drawTower(tower);
    this.drawParticles(dt);
    this.layoutDom(towerHalf);
  }

  private towerHalfPx(n: number) {
    const L = A4.h / Math.pow(2, n);
    return Math.max(L * this.cam.scale, this.minW) / 2;
  }

  // ---------- background ----------

  private drawBackground(time: number, towerHalf: number) {
    const { b, W, H, cam } = this;
    const cx = W / 2 + cam.ox;
    const g0 = this.sy(0);
    const Rpx = EARTH_R * cam.scale;
    const flat = Rpx > 2e5;

    b.fillStyle = '#03050d';
    b.fillRect(0, 0, W, H);

    // how dark is the sky behind the counter (top of the screen)?
    const altTop = (g0 - 90) / cam.scale;
    const c = skyAt(altTop);
    const lum = ((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255) * c[3];
    this.darkness = clamp(1 - lum / 0.55);
    if (g0 < 90) this.darkness = 1;

    // stars
    if (this.darkness > 0.02) {
      const z = Math.log2(cam.scale);
      const maxR = Math.hypot(W, H) * 0.62;
      const minR = maxR * 0.1;
      b.fillStyle = '#fff';
      for (const s of this.stars) {
        let u = (s.u + z * 0.07) % 1;
        if (u < 0) u += 1;
        const r = minR * Math.pow(maxR / minR, u);
        const x = W / 2 + Math.cos(s.a) * r * 1.2;
        const y = H * 0.45 + Math.sin(s.a) * r;
        const fade = smooth(0, 0.3, u) * (1 - smooth(0.9, 1, u));
        const tw = 0.75 + 0.25 * Math.sin(time * 0.0015 + s.tw);
        b.globalAlpha = fade * tw * this.darkness * 0.95;
        b.beginPath();
        b.arc(x, y, s.s * (0.6 + u * 0.7), 0, Math.PI * 2);
        b.fill();
      }
      b.globalAlpha = 1;
    }

    this.drawUniverse(cx, g0);
    this.drawSun(cx, towerHalf);
    this.drawMoon(cx, towerHalf);

    // atmosphere
    if (flat) {
      const top = Math.min(H, g0);
      if (top > 0) {
        const grad = b.createLinearGradient(0, 0, 0, top);
        const N = 12;
        for (let i = 0; i <= N; i++) {
          const y = (top * i) / N;
          grad.addColorStop(i / N, rgba(skyAt((g0 - y) / cam.scale)));
        }
        b.fillStyle = grad;
        b.fillRect(0, 0, W, top);
      }
    } else {
      const cy = g0 + Rpx;
      const r1 = (EARTH_R + SKY_TOP) * cam.scale;
      const grad = b.createRadialGradient(cx, cy, Rpx, cx, cy, r1);
      for (const [alt, c] of SKY) grad.addColorStop(alt / SKY_TOP, rgba(c));
      b.fillStyle = grad;
      b.fillRect(0, 0, W, H);
      if (Rpx < 4000) {
        const k = Math.max(Rpx * 0.12, 5);
        const glow = b.createRadialGradient(cx, cy, Rpx * 0.96, cx, cy, Rpx + k);
        glow.addColorStop(0, 'rgba(120,190,255,0.55)');
        glow.addColorStop(1, 'rgba(120,190,255,0)');
        b.fillStyle = glow;
        b.beginPath();
        b.arc(cx, cy, Rpx + k, 0, Math.PI * 2);
        b.fill();
      }
    }

    this.drawClouds(cx, g0);

    // ground or planet
    if (flat) {
      if (g0 < H) {
        const grad = b.createLinearGradient(0, g0, 0, g0 + 160);
        grad.addColorStop(0, rgba(GROUND_TOP));
        grad.addColorStop(1, rgba(GROUND_DEEP));
        b.fillStyle = grad;
        b.fillRect(0, g0, W, H - g0);
        b.fillStyle = 'rgba(255,255,255,0.35)';
        b.fillRect(0, g0 - 0.5, W, 1.5);
        b.fillStyle = 'rgba(40,80,40,0.15)';
        b.fillRect(0, g0 + 1, W, 3);
      }
    } else {
      this.drawEarth(cx, g0 + Rpx, Rpx);
    }
  }

  private drawEarth(cx: number, cy: number, R: number) {
    const b = this.b;
    if (cy - R > this.H + 10) return;
    const f = clamp(Math.log(2e5 / R) / Math.log(2e5 / 2500));
    const r = Math.max(R, 2.5);
    b.save();
    b.beginPath();
    b.arc(cx, cy, r, 0, Math.PI * 2);
    const base = b.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r * 1.1);
    base.addColorStop(0, rgba(mixc(GROUND_TOP, OCEAN_HI, f)));
    base.addColorStop(1, rgba(mixc(GROUND_DEEP, OCEAN_LO, f)));
    b.fillStyle = base;
    b.fill();
    if (f > 0 && r > 6) {
      b.clip();
      b.fillStyle = `rgba(118,186,110,${0.9 * f})`;
      for (const [x, y, s] of this.continents) {
        b.beginPath();
        b.arc(cx + x * r, cy + y * r, s * r, 0, Math.PI * 2);
        b.fill();
      }
      b.fillStyle = `rgba(255,255,255,${0.4 * f})`;
      for (const [x, y, s, a] of this.cloudsEarth) {
        b.beginPath();
        b.ellipse(cx + x * r, cy + y * r, s * r, s * r * 0.22, a, 0, Math.PI * 2);
        b.fill();
      }
      const shade = b.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      shade.addColorStop(0.45, 'rgba(2,6,20,0)');
      shade.addColorStop(1, `rgba(2,6,20,${0.7 * f})`);
      b.fillStyle = shade;
      b.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    b.restore();
    if (f > 0.2) {
      b.strokeStyle = `rgba(170,215,255,${0.5 * f})`;
      b.lineWidth = 1.5;
      b.beginPath();
      b.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 1.75);
      b.stroke();
    }
    // "Earth" tag when it's a dot
    const show = R < 9 && cy > 0 && cy < this.H;
    this.earthTag.style.opacity = show ? String(1 - smooth(4, 9, R)) : '0';
    if (show) this.earthTag.style.transform = `translate(${cx - 8}px, ${cy}px)`;
  }

  private bodyX(R: number, towerHalf: number, mult = 1.15) {
    const Rpx = R * this.cam.scale;
    return Math.max(R * mult * this.cam.scale, towerHalf + 14 + Math.max(Rpx, 2));
  }

  private drawMoon(cx: number, towerHalf: number) {
    const b = this.b;
    const R = Math.max(MOON_R * this.cam.scale, 2);
    const y = this.sy(MOON_ALT);
    const x = cx + this.bodyX(MOON_R, towerHalf);
    if (y - R * 3 > this.H || y + R * 3 < 0 || x - R > this.W) return;
    const glowR = Math.max(R * 2.2, 10);
    const glow = b.createRadialGradient(x, y, R * 0.8, x, y, glowR);
    glow.addColorStop(0, 'rgba(255,250,230,0.25)');
    glow.addColorStop(1, 'rgba(255,250,230,0)');
    b.fillStyle = glow;
    b.beginPath();
    b.arc(x, y, glowR, 0, Math.PI * 2);
    b.fill();
    b.save();
    b.beginPath();
    b.arc(x, y, R, 0, Math.PI * 2);
    const g = b.createRadialGradient(x - R * 0.4, y - R * 0.4, R * 0.1, x, y, R * 1.05);
    g.addColorStop(0, '#f7f4ec');
    g.addColorStop(1, '#b4aea3');
    b.fillStyle = g;
    b.fill();
    if (R > 10) {
      b.clip();
      for (const [cxr, cyr, s] of this.craters) {
        const px = x + cxr * R, py = y + cyr * R, pr = s * R;
        b.fillStyle = 'rgba(120,112,100,0.22)';
        b.beginPath();
        b.arc(px, py, pr, 0, Math.PI * 2);
        b.fill();
        b.fillStyle = 'rgba(255,255,255,0.18)';
        b.beginPath();
        b.arc(px + pr * 0.15, py + pr * 0.15, pr * 0.75, 0, Math.PI * 2);
        b.fill();
      }
      const sh = b.createLinearGradient(x - R, y, x + R, y);
      sh.addColorStop(0.55, 'rgba(10,12,24,0)');
      sh.addColorStop(1, 'rgba(10,12,24,0.55)');
      b.fillStyle = sh;
      b.fillRect(x - R, y - R, R * 2, R * 2);
    }
    b.restore();
  }

  private drawSun(cx: number, towerHalf: number) {
    const b = this.b;
    const SR = 6.96e8;
    const alt = 1.496e11;
    const R = Math.max(SR * this.cam.scale, 3);
    const y = this.sy(alt);
    const x = cx + this.bodyX(SR, towerHalf, 1.3);
    const glowR = Math.max(R * 5, 26);
    if (y - glowR > this.H || y + glowR < 0) return;
    const glow = b.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, 'rgba(255,240,190,1)');
    glow.addColorStop(R / glowR, 'rgba(255,214,102,0.9)');
    glow.addColorStop(Math.min(1, (R / glowR) * 2.2), 'rgba(255,170,60,0.25)');
    glow.addColorStop(1, 'rgba(255,150,40,0)');
    b.fillStyle = glow;
    b.beginPath();
    b.arc(x, y, glowR, 0, Math.PI * 2);
    b.fill();
  }

  private drawUniverse(cx: number, g0: number) {
    const b = this.b;
    const ru = 4.4e26 * this.cam.scale;
    if (ru < 8 || ru > this.H * 8) return;
    const a = smooth(8, 60, ru) * (1 - smooth(this.H * 3, this.H * 8, ru));
    b.save();
    b.globalAlpha = a;
    const g = b.createRadialGradient(cx, g0, 0, cx, g0, ru);
    g.addColorStop(0, 'rgba(120,100,255,0.05)');
    g.addColorStop(0.75, 'rgba(140,110,255,0.10)');
    g.addColorStop(0.97, 'rgba(255,170,120,0.35)');
    g.addColorStop(1, 'rgba(255,200,160,0)');
    b.fillStyle = g;
    b.beginPath();
    b.arc(cx, g0, ru, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = '#cfc6ff';
    for (const [x, y, s] of this.web) {
      b.globalAlpha = a * (0.25 + s * 0.6);
      b.fillRect(cx + x * ru, g0 + y * ru, 1.1, 1.1);
    }
    b.globalAlpha = a * 0.9;
    b.strokeStyle = 'rgba(255,214,180,0.9)';
    b.lineWidth = 1.5;
    b.setLineDash([3, 5]);
    b.beginPath();
    b.arc(cx, g0, ru, 0, Math.PI * 2);
    b.stroke();
    b.restore();
  }

  private drawClouds(cx: number, g0: number) {
    const b = this.b;
    const s = this.cam.scale;
    if (s * 300 > 1100 || s * 1800 < 14) return;
    for (const c of this.clouds) {
      const w = c.w * s;
      const a = smooth(14, 40, w) * (1 - smooth(500, 1100, w));
      if (a <= 0) continue;
      const x = cx + c.x * s;
      const y = g0 - c.y * s;
      if (x + w < -50 || x - w > this.W + 50 || y < -w || y > this.H + w) continue;
      b.globalAlpha = a * 0.92;
      b.fillStyle = '#ffffff';
      b.beginPath();
      for (const [px, py, r] of c.puffs) {
        b.moveTo(x + px * w + r * w, y + py * w);
        b.arc(x + px * w, y + py * w, r * w, 0, Math.PI * 2);
      }
      b.fill();
    }
    b.globalAlpha = 1;
  }

  // ---------- tower ----------

  private paperFill(x: number, y: number, w: number, h: number) {
    const f = this.f;
    const g = f.createLinearGradient(x, y, x + Math.min(w, this.W), y + h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#ece7dc');
    return g;
  }

  /** Paper block in current transform, spanning x..x+w, y..y+h; trimmed to [lo, hi] horizontally. */
  private block(x: number, y: number, w: number, h: number, layers: number, lo = -Infinity, hi = Infinity) {
    const f = this.f;
    const x0 = Math.max(x, lo), x1 = Math.min(x + w, hi);
    if (x1 <= x0) return;
    const ww = x1 - x0;
    f.fillStyle = this.paperFill(x0, y, ww, h);
    f.fillRect(x0, y, ww, h);
    const spacing = h / layers;
    if (this.fiber && spacing > 30) {
      f.save();
      f.globalAlpha = smooth(30, 120, spacing) * 0.9;
      f.shadowColor = 'transparent';
      f.fillStyle = this.fiber;
      f.fillRect(x0, y, ww, h);
      f.restore();
    }
    if (spacing > 3) {
      f.save();
      f.shadowColor = 'transparent';
      const a = smooth(3, 10, spacing) * 0.22;
      f.fillStyle = `rgba(120,110,90,${a})`;
      const lw = spacing > 40 ? 1.5 : 1;
      for (let i = 1; i < layers; i++) f.fillRect(x0, y + i * spacing - lw / 2, ww, lw);
      f.fillStyle = 'rgba(255,255,255,0.9)';
      f.fillRect(x0, y, ww, Math.min(1.2, h));
      f.restore();
    }
  }

  private drawTower(t: TowerState) {
    const f = this.f;
    const s = this.cam.scale;
    const cx = this.W / 2 + this.cam.ox;
    const y0 = this.sy(0);
    const T = thickness(t.n);
    const L = A4.h / Math.pow(2, t.n);
    const w = Math.max(L * s, this.minW);
    const h = Math.max(T * s, 1.5);
    const N = Math.pow(2, t.n);
    const top = y0 - h;
    if (top > this.H + 50) return;

    f.save();
    // glow in the dark
    if (this.darkness > 0.05) {
      f.shadowColor = `rgba(255,255,255,${0.45 * this.darkness})`;
      f.shadowBlur = 22;
    }
    // ground shadow
    if (y0 < this.H && EARTH_R * s > 2e5) {
      const sw = Math.min(w, this.W * 3) * 0.6 + 20;
      const sh = f.createRadialGradient(cx, y0, 0, cx, y0, sw);
      sh.addColorStop(0, 'rgba(20,40,20,0.22)');
      sh.addColorStop(1, 'rgba(20,40,20,0)');
      f.save();
      f.shadowColor = 'transparent';
      f.translate(0, y0);
      f.scale(1, 0.06);
      f.fillStyle = sh;
      f.beginPath();
      f.arc(cx, 0, sw, 0, Math.PI * 2);
      f.fill();
      f.restore();
    }

    const lo = -60, hi = this.W + 60;
    const reach = Math.hypot(this.W, this.H) * 1.5;
    if (t.theta <= 0 && t.settle <= 0) {
      this.block(cx - w / 2, top, w, h, N, lo, hi);
      if (t.n > 0 && w < this.W * 2) {
        f.save();
        f.shadowColor = 'transparent';
        f.fillStyle = 'rgba(0,0,0,0.06)';
        f.fillRect(cx + w / 2 - 2, top, 2, h);
        f.restore();
      }
    } else if (t.settle <= 0) {
      this.block(cx - w / 2, top, w / 2, h, N, lo, hi);
      if (t.theta > Math.PI * 0.55) {
        f.save();
        f.shadowColor = 'transparent';
        const k = smooth(Math.PI * 0.55, Math.PI, t.theta);
        const sh = Math.min(h, 60);
        const g = f.createLinearGradient(0, top, 0, top + sh);
        g.addColorStop(0, `rgba(30,30,50,${0.25 * k})`);
        g.addColorStop(1, 'rgba(30,30,50,0)');
        f.fillStyle = g;
        const x0 = Math.max(cx - w / 2, lo);
        f.fillRect(x0, top, cx - x0, sh);
        f.restore();
      }
      // the moving half, hinged at the top centre
      f.save();
      f.translate(cx, top);
      f.rotate(-t.theta);
      this.block(0, 0, w / 2, h, N, 0, reach);
      f.shadowColor = 'transparent';
      const shade = Math.sin(t.theta) * 0.16 + (t.theta > Math.PI / 2 ? 0.05 : 0);
      f.fillStyle = `rgba(40,40,70,${shade})`;
      f.fillRect(0, 0, Math.min(w / 2, reach), h);
      f.restore();
    } else {
      const L1 = L / 2;
      const wNew = Math.max(L1 * s, this.minW);
      const e = 1 - Math.pow(1 - t.settle, 3);
      const ww = lerp(w / 2, wNew, e);
      const left = lerp(cx - w / 2, cx - wNew / 2, e);
      this.block(left, y0 - h * 2, ww, h * 2, N * 2, lo, hi);
    }
    f.restore();
  }

  burst(n: number) {
    const s = this.cam.scale;
    const cx = this.W / 2 + this.cam.ox;
    const y = this.sy(thickness(n));
    const w = Math.min(Math.max((A4.h / Math.pow(2, n)) * s, this.minW), this.W * 0.6);
    const count = 22;
    for (let i = 0; i < count; i++) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * w,
        y: y + Math.random() * 4,
        vx: dir * (40 + Math.random() * 160),
        vy: -(40 + Math.random() * 140),
        life: 0,
        max: 0.7 + Math.random() * 0.6,
        r: 1.5 + Math.random() * 2.5,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 12,
      });
    }
  }

  private drawParticles(dt: number) {
    const f = this.f;
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      p.vy += 260 * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      f.save();
      f.globalAlpha = 1 - p.life / p.max;
      f.translate(p.x, p.y);
      f.rotate(p.rot);
      f.fillStyle = this.darkness > 0.5 ? '#ffffff' : '#fdfbf5';
      f.strokeStyle = 'rgba(0,0,0,0.12)';
      f.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      f.strokeRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      f.restore();
    }
  }

  // ---------- DOM overlays ----------

  private layoutDom(towerHalf: number) {
    const { W, H, cam } = this;
    const s = cam.scale;
    const cx = W / 2 + cam.ox;
    const g0 = this.sy(0);
    const near = Math.min(towerHalf, W * 0.14);
    const gap = W < 640 ? 12 : 26;
    const pad = W < 640 ? 12 : 28;

    const accR: number[] = [0], accL: number[] = [0];
    for (const te of this.thingEls) {
      const hp = te.t.h * s;
      const wp = hp * te.ratio;
      const back = te.t.backdrop !== undefined;
      let a = back
        ? smooth(10, 30, hp) * (1 - smooth(H * 0.75, H * 1.3, hp))
        : smooth(12, 30, hp) * (1 - smooth(H * 0.55, H * 0.82, hp));
      if (g0 - hp > H || g0 < -10) a = 0;
      if (a <= 0.003) {
        if (te.shown) {
          te.el.style.display = 'none';
          te.shown = false;
        }
        continue;
      }
      if (!te.shown) {
        te.el.style.display = 'block';
        te.shown = true;
      }
      let x: number;
      if (back) {
        x = cx + te.t.backdrop! * wp - wp / 2;
      } else if (te.side > 0) {
        x = cx + near + gap + accR[0];
        accR[0] += (wp + pad) * a;
      } else {
        x = cx - near - gap - accL[0] - wp;
        accL[0] += (wp + pad) * a;
      }
      const el = te.el;
      el.style.width = wp + 'px';
      el.style.height = hp + 'px';
      el.style.transform = `translate3d(${x}px, ${g0 - hp}px, 0)`;
      el.style.opacity = String(a);
    }

    for (const me of this.markerEls) {
      const ap = me.m.alt * s;
      const y = g0 - ap;
      const a = smooth(22, 48, ap) * smooth(56, 110, y) * (1 - smooth(H - 30, H + 10, y));
      if (a <= 0.003) {
        if (me.shown) {
          me.el.style.display = 'none';
          me.shown = false;
        }
        continue;
      }
      if (!me.shown) {
        me.el.style.display = 'block';
        me.shown = true;
      }
      me.el.style.transform = `translate3d(0, ${y}px, 0)`;
      me.el.style.opacity = String(a);
      me.line.style.width = Math.max(0, cx - near - 8) + 'px';
    }

    for (const bd of this.bodies) {
      const d = bd.d * s;
      const a = smooth(14, 50, d) * (1 - smooth(H * 2.5, H * 6, d));
      if (a <= 0.003) {
        if (bd.shown) {
          bd.el.style.display = 'none';
          bd.shown = false;
        }
        continue;
      }
      if (!bd.shown) {
        bd.el.style.display = 'block';
        bd.shown = true;
      }
      const x = cx + bd.x * s - d / 2;
      const y = this.sy(bd.y) - d / 2;
      bd.el.style.width = bd.el.style.height = d + 'px';
      bd.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      bd.el.style.opacity = String(a);
    }
  }
}
