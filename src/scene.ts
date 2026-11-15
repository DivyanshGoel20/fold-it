import { A4, EARTH_R, MOON_ALT, MOON_R, SUN_ALT, SUN_R, LY, THINGS, MARKERS, fmt, thickness, Thing, Marker } from './data';
import ART from './art.json';

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
type ArtInfo = { w: number; h: number; mode: string };
const art = ART as Record<string, ArtInfo>;

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

// The page is paper by day and ink by night.
const NIGHT = [10, 14, 28];
const SKY: [number, RGBA][] = [
  [0, [244, 237, 222, 1]],
  [2500, [241, 235, 223, 1]],
  [8000, [222, 225, 226, 1]],
  [18000, [164, 178, 196, 1]],
  [40000, [70, 86, 118, 0.94]],
  [75000, [28, 37, 62, 0.6]],
  [130000, [10, 14, 28, 0]],
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

const GROUND = [233, 224, 204];
const SEA_HI = [126, 160, 168];
const SEA_LO = [38, 66, 84];

interface ThingEl { t: Thing; el: HTMLElement; lbl: HTMLElement; w: number; h: number; side: number; shown: boolean }
interface MarkerEl { m: Marker; el: HTMLElement; line: HTMLElement; shown: boolean }
interface BodyEl { el: HTMLElement; shown: boolean; place: () => { x: number; y: number; w: number; h: number; a: number } | null }

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
  private stars: { a: number; u: number; s: number; tw: number }[] = [];
  private web: [number, number, number][] = [];
  private clouds: { x: number; y: number; w: number; puffs: [number, number, number][] }[] = [];
  private fiber: CanvasPattern | null = null;
  private towerHalf = 11;

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
    this.earthTag.innerHTML = '<i></i>Earth';
    this.marks.appendChild(this.earthTag);
    this.build();
    this.resize();
  }

  private img(key: string, cls = '') {
    const a = art[key];
    const im = document.createElement('img');
    im.src = `${import.meta.env.BASE_URL}art/${key}.webp`;
    im.alt = '';
    im.decoding = 'async';
    im.draggable = false;
    im.className = `${a?.mode === 'dark' ? 'screen' : 'multiply'} ${cls}`;
    return im;
  }

  private build() {
    const r = rng(7);
    for (let i = 0; i < 360; i++) this.stars.push({ a: r() * Math.PI * 2, u: r(), s: 0.35 + r() * r() * 1.5, tw: r() * 6 });
    const wr = rng(11);
    for (let i = 0; i < 900; i++) {
      const a = wr() * Math.PI * 2, d = Math.sqrt(wr());
      this.web.push([Math.cos(a) * d, Math.sin(a) * d, wr()]);
    }
    const cr = rng(19);
    for (let i = 0; i < 40; i++) {
      const w = 400 + cr() * 1600;
      const puffs: [number, number, number][] = [];
      const n = 5 + Math.floor(cr() * 4);
      for (let k = 0; k < n; k++) {
        const px = (k / (n - 1) - 0.5) * 0.8 + (cr() - 0.5) * 0.1;
        const rad = 0.14 + cr() * 0.14 * (1 - Math.abs(px));
        puffs.push([px, -rad * 0.45 - cr() * 0.06, rad]);
      }
      this.clouds.push({ x: (cr() - 0.5) * 70000, y: 1100 + cr() * 2400, w, puffs });
    }

    // paper fibre texture for the magnified sheet
    const pc = document.createElement('canvas');
    pc.width = pc.height = 256;
    const p = pc.getContext('2d')!;
    const fr = rng(5);
    for (let i = 0; i < 300; i++) {
      p.strokeStyle = fr() > 0.5 ? 'rgba(170,150,120,0.16)' : 'rgba(255,255,255,0.55)';
      p.lineWidth = 0.6 + fr() * 1.3;
      p.beginPath();
      const x = fr() * 256, y = fr() * 256, a = fr() * Math.PI, l = 10 + fr() * 40;
      p.moveTo(x, y);
      p.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (fr() - 0.5) * 10, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      p.stroke();
    }
    this.fiber = this.f.createPattern(pc, 'repeat');

    // vintage plates
    THINGS.forEach((t, i) => {
      const a = art[t.id];
      if (!a) return;
      const ratio = a.w / a.h;
      const h = t.h ?? t.w! / ratio;
      const w = h * ratio;
      const el = this.img(t.id, 'thing' + (t.backdrop !== undefined ? ' backdrop' : ''));
      const lbl = document.createElement('div');
      lbl.className = 'lbl' + (t.backdrop !== undefined ? ' lbl-back' : '');
      lbl.innerHTML = `<b>${t.name}</b><span>${t.size}</span><em>${t.credit}</em><i class="leader"></i>`;
      (t.backdrop !== undefined ? this.deep : this.things).appendChild(el);
      this.things.appendChild(lbl);
      this.thingEls.push({ t, el, lbl, w, h, side: i % 2 ? -1 : 1, shown: false });
    });

    MARKERS.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.innerHTML = `<div class="mline"></div><div class="mlabel"><span class="malt">${fmt(m.alt)}</span><span class="mname">${m.name}</span></div>`;
      if (m.img && art[m.img]) el.querySelector('.mlabel')!.prepend(this.img(m.img, 'minset'));
      this.marks.appendChild(el);
      this.markerEls.push({ m, el, line: el.querySelector('.mline')!, shown: false });
    });

    // celestial bodies, drawn at true scale
    const ar = (k: string) => (art[k] ? art[k].w / art[k].h : 1);
    const body = (key: string, place: BodyEl['place']) => {
      if (!art[key]) return;
      const el = document.createElement('div');
      el.className = 'body screen';
      const im = this.img(key);
      im.className = '';
      el.appendChild(im);
      this.deep.appendChild(el);
      this.bodies.push({ el, place, shown: false });
    };
    body('aurora', () => {
      const h = 300e3 * this.cam.scale, w = h * ar('aurora');
      const a = smooth(30, 90, h) * (1 - smooth(this.H * 1.4, this.H * 3, h));
      return { x: this.cx - w / 2, y: this.sy(380e3), w, h, a: a * 0.9 };
    });
    body('moon', () => {
      // the moon plate is a disc filling MOON_FILL of its square image
      const d = Math.max(MOON_R * 2 * this.cam.scale, 5) / MOON_FILL;
      const x = this.cx + this.bodyX(MOON_R, 1.25);
      return { x: x - d / 2, y: this.sy(MOON_ALT) - d / 2, w: d, h: d, a: 1 };
    });
    body('sun', () => {
      const d = Math.max(SUN_R * 2 * this.cam.scale, 7) / SUN_FILL;
      const x = this.cx + this.bodyX(SUN_R, 1.6);
      return { x: x - d / 2, y: this.sy(SUN_ALT) - d / 2, w: d, h: d / ar('sun'), a: 1 };
    });
    body('milkyway', () => {
      const d = 1.2e5 * LY * this.cam.scale;
      const a = smooth(30, 120, d) * (1 - smooth(this.H * 3, this.H * 7, d));
      return { x: this.cx - d / 2, y: this.sy(2.6e4 * LY) - d / 2 / ar('milkyway'), w: d, h: d / ar('milkyway'), a };
    });
    body('andromeda', () => {
      const d = 2.6e5 * LY * this.cam.scale;
      const a = smooth(16, 60, d) * (1 - smooth(this.H * 2, this.H * 5, d));
      const x = this.cx + 1.6e5 * LY * this.cam.scale;
      return { x: x - d / 2, y: this.sy(2.5e6 * LY) - d / 2 / ar('andromeda'), w: d, h: d / ar('andromeda'), a };
    });
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

  get mobile() {
    return this.W < 640;
  }
  get baseline() {
    return this.H * 0.86;
  }
  get towerFrac() {
    const top = this.mobile ? 230 : 250;
    return Math.min(0.55, (this.baseline - top) / this.H);
  }
  get minW() {
    return this.mobile ? 14 : 20;
  }
  get cx() {
    return this.W / 2 + this.cam.ox;
  }

  camFor(n: number): Cam {
    return { scale: (this.H * this.towerFrac) / thickness(n), ay: 0, sy: this.baseline, ox: 0 };
  }

  moonCam(): Cam {
    const s = (Math.min(this.W, this.H) * (this.mobile ? 0.26 : 0.2)) / MOON_R;
    return { scale: s, ay: MOON_ALT, sy: this.H * 0.58, ox: -MOON_R * 1.25 * s * 0.5 };
  }

  sy(y: number, cam = this.cam) {
    return cam.sy - (y - cam.ay) * cam.scale;
  }

  render(cam: Cam, tower: TowerState, time: number) {
    this.cam = cam;
    const { b, f, dpr } = this;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, this.W, this.H);
    this.towerHalf = this.towerHalfPx(tower.n);
    this.drawBackground(time);
    this.drawTower(tower);
    this.layoutDom();
  }

  private towerHalfPx(n: number) {
    const L = A4.h / Math.pow(2, n);
    return Math.max(L * this.cam.scale, this.minW) / 2;
  }

  private bodyX(R: number, mult: number) {
    const Rpx = R * this.cam.scale;
    return Math.max(R * mult * this.cam.scale, this.towerHalf + 16 + Math.max(Rpx, 3));
  }

  // ---------- background ----------

  private drawBackground(time: number) {
    const { b, W, H, cam } = this;
    const cx = this.cx;
    const g0 = this.sy(0);
    const Rpx = EARTH_R * cam.scale;
    const flat = Rpx > 2e5;

    b.fillStyle = rgba(NIGHT);
    b.fillRect(0, 0, W, H);

    const c = skyAt((g0 - 120) / cam.scale);
    const col = mixc(NIGHT, c, c[3]);
    const lum = (0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]) / 255;
    this.darkness = g0 < 120 ? 1 : clamp((0.62 - lum) / 0.3);

    // stars, drifting inward as we zoom out
    {
      const z = Math.log2(cam.scale);
      const maxR = Math.hypot(W, H) * 0.62;
      const minR = maxR * 0.08;
      b.fillStyle = '#f6efdd';
      for (const s of this.stars) {
        let u = (s.u + z * 0.06) % 1;
        if (u < 0) u += 1;
        const r = minR * Math.pow(maxR / minR, u);
        const x = W / 2 + Math.cos(s.a) * r * 1.25;
        const y = H * 0.5 + Math.sin(s.a) * r;
        const fade = smooth(0, 0.3, u) * (1 - smooth(0.9, 1, u));
        const tw = 0.7 + 0.3 * Math.sin(time * 0.0012 + s.tw);
        b.globalAlpha = fade * tw * 0.85;
        b.beginPath();
        b.arc(x, y, s.s * (0.6 + u * 0.6), 0, Math.PI * 2);
        b.fill();
      }
      b.globalAlpha = 1;
    }

    this.drawUniverse(cx, g0);

    // atmosphere
    if (flat) {
      const top = Math.min(H, g0);
      if (top > 0) {
        const grad = b.createLinearGradient(0, 0, 0, top);
        const N = 14;
        for (let i = 0; i <= N; i++) {
          const y = (top * i) / N;
          grad.addColorStop(i / N, rgba(skyAt((g0 - y) / cam.scale)));
        }
        b.fillStyle = grad;
        b.fillRect(0, 0, W, top);
      }
    } else {
      const cy = g0 + Rpx;
      const outer = Rpx + Math.max(SKY_TOP * cam.scale * 1.4, 4);
      const glow = b.createRadialGradient(cx, cy, Rpx, cx, cy, outer);
      const k = smooth(2e5, 3e4, Rpx);
      const span = outer - Rpx;
      for (const [alt, cc] of SKY) {
        const off = Math.min(1, (alt * cam.scale) / span);
        glow.addColorStop(off, rgba(mixc(cc, [150, 182, 214], k), cc[3] * (1 - k * 0.45)));
      }
      glow.addColorStop(1, 'rgba(150,182,214,0)');
      b.fillStyle = glow;
      b.fillRect(0, 0, W, H);
    }

    this.drawClouds(cx, g0);

    if (flat) {
      if (g0 < H) this.drawGround(g0);
    } else {
      this.drawEarth(cx, g0 + Rpx, Rpx);
    }
  }

  private drawGround(g0: number) {
    const { b, W, H } = this;
    const k = smooth(4e4, 2e5, EARTH_R * this.cam.scale); // 1 = close up
    b.fillStyle = rgba(mixc(SEA_HI, GROUND, k));
    b.fillRect(0, g0, W, H - g0);
    // engraved hatching under the ground line
    b.strokeStyle = `rgba(60,45,30,${0.14 * k + 0.05})`;
    b.lineWidth = 1;
    b.beginPath();
    for (let i = 1; i < 9; i++) {
      const y = Math.round(g0 + i * i * 2.2 + 3) + 0.5;
      if (y > H) break;
      b.moveTo(0, y);
      b.lineTo(W, y);
    }
    b.stroke();
    b.fillStyle = `rgba(40,30,20,${0.8 * k + 0.1})`;
    b.fillRect(0, g0 - 0.75, W, 1.5);
  }

  /** an antique globe */
  private drawEarth(cx: number, cy: number, R: number) {
    const b = this.b;
    if (cy - R > this.H + 10) return;
    const r = Math.max(R, 3);
    const f = clamp(Math.log(2e5 / r) / Math.log(2e5 / 3000));
    b.save();
    b.beginPath();
    b.arc(cx, cy, r, 0, Math.PI * 2);
    const base = b.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r * 1.08);
    base.addColorStop(0, rgba(mixc(SEA_HI, [170, 198, 198], f)));
    base.addColorStop(1, rgba(SEA_LO));
    b.fillStyle = base;
    b.fill();
    if (r > 8 && r < 6e4) {
      b.clip();
      b.strokeStyle = `rgba(246,239,221,${0.3 * f})`;
      b.lineWidth = Math.max(0.6, Math.min(1.2, r / 300));
      b.beginPath();
      for (let lat = -75; lat <= 75; lat += 15) {
        const y = cy - Math.sin((lat * Math.PI) / 180) * r;
        const hw = Math.cos((lat * Math.PI) / 180) * r;
        b.moveTo(cx - hw, y);
        b.lineTo(cx + hw, y);
      }
      for (let lon = 10; lon < 180; lon += 20) {
        const rx = Math.abs(Math.cos((lon * Math.PI) / 180)) * r;
        b.moveTo(cx + rx, cy);
        b.ellipse(cx, cy, rx, r, 0, 0, Math.PI * 2);
      }
      b.stroke();
      const shade = b.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      shade.addColorStop(0.5, 'rgba(4,8,20,0)');
      shade.addColorStop(1, `rgba(4,8,20,${0.6 * f})`);
      b.fillStyle = shade;
      b.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    b.restore();
    if (f > 0.15) {
      b.strokeStyle = `rgba(246,239,221,${0.55 * f})`;
      b.lineWidth = 1;
      b.beginPath();
      b.arc(cx, cy, r, Math.PI * 1.08, Math.PI * 1.72);
      b.stroke();
    }
    const show = R < 9 && cy > 0 && cy < this.H;
    this.earthTag.style.opacity = show ? String(1 - smooth(4, 9, R)) : '0';
    if (show) this.earthTag.style.transform = `translate(${cx - 6}px, ${cy + 8}px)`;
  }

  private drawUniverse(cx: number, g0: number) {
    const b = this.b;
    const ru = 4.4e26 * this.cam.scale;
    if (ru < 8 || ru > this.H * 8) return;
    const a = smooth(8, 60, ru) * (1 - smooth(this.H * 3, this.H * 8, ru));
    b.save();
    b.globalAlpha = a;
    const g = b.createRadialGradient(cx, g0, 0, cx, g0, ru);
    g.addColorStop(0, 'rgba(246,239,221,0.02)');
    g.addColorStop(0.8, 'rgba(246,239,221,0.06)');
    g.addColorStop(0.98, 'rgba(246,224,190,0.22)');
    g.addColorStop(1, 'rgba(246,224,190,0)');
    b.fillStyle = g;
    b.beginPath();
    b.arc(cx, g0, ru, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = '#f6efdd';
    for (const [x, y, s] of this.web) {
      b.globalAlpha = a * (0.2 + s * 0.55);
      b.fillRect(cx + x * ru, g0 + y * ru, 1, 1);
    }
    b.globalAlpha = a * 0.85;
    b.strokeStyle = '#f6efdd';
    b.lineWidth = 1;
    b.setLineDash([2, 5]);
    b.beginPath();
    b.arc(cx, g0, ru, 0, Math.PI * 2);
    b.stroke();
    b.restore();
  }

  private drawClouds(cx: number, g0: number) {
    const b = this.b;
    const s = this.cam.scale;
    if (s * 400 > 1200 || s * 2000 < 14) return;
    for (const c of this.clouds) {
      const w = c.w * s;
      const a = smooth(14, 40, w) * (1 - smooth(500, 1100, w));
      if (a <= 0) continue;
      const x = cx + c.x * s;
      const y = g0 - c.y * s;
      if (x + w < -50 || x - w > this.W + 50 || y < -w || y > this.H + w) continue;
      b.beginPath();
      for (const [px, py, r] of c.puffs) {
        b.moveTo(x + px * w + r * w, y + py * w);
        b.arc(x + px * w, y + py * w, r * w, 0, Math.PI * 2);
      }
      b.globalAlpha = a * 0.92;
      b.fillStyle = '#fbf7ee';
      b.fill();
      b.globalAlpha = a * 0.3;
      b.strokeStyle = '#5a4a36';
      b.lineWidth = 0.8;
      b.stroke();
    }
    b.globalAlpha = 1;
  }

  // ---------- tower ----------

  private block(x: number, y: number, w: number, h: number, layers: number, lo = -Infinity, hi = Infinity) {
    const f = this.f;
    const x0 = Math.max(x, lo), x1 = Math.min(x + w, hi);
    if (x1 <= x0) return;
    const ww = x1 - x0;
    const g = f.createLinearGradient(x0, y, x0 + Math.min(ww, this.W), y + h);
    g.addColorStop(0, '#fffdf8');
    g.addColorStop(1, '#efe8da');
    f.fillStyle = g;
    f.fillRect(x0, y, ww, h);
    const spacing = h / layers;
    f.save();
    f.shadowColor = 'transparent';
    if (this.fiber && spacing > 30) {
      f.globalAlpha = smooth(30, 120, spacing) * 0.9;
      f.fillStyle = this.fiber;
      f.fillRect(x0, y, ww, h);
      f.globalAlpha = 1;
    }
    if (spacing > 3) {
      const a = smooth(3, 10, spacing) * 0.26;
      f.fillStyle = `rgba(110,90,60,${a})`;
      const lw = spacing > 40 ? 1.2 : 0.8;
      for (let i = 1; i < layers; i++) f.fillRect(x0, y + i * spacing - lw / 2, ww, lw);
    }
    f.strokeStyle = `rgba(50,38,24,${0.55 * (1 - this.darkness)})`;
    f.lineWidth = 1;
    f.strokeRect(x0 + 0.5, y + 0.5, ww - 1, h - 1);
    f.restore();
  }

  private drawTower(t: TowerState) {
    const f = this.f;
    const s = this.cam.scale;
    const cx = this.cx;
    const y0 = this.sy(0);
    const T = thickness(t.n);
    const L = A4.h / Math.pow(2, t.n);
    const w = Math.max(L * s, this.minW);
    const h = Math.max(T * s, 1.5);
    const N = Math.pow(2, t.n);
    const top = y0 - h;
    if (top > this.H + 50) return;

    f.save();
    if (this.darkness > 0.05) {
      f.shadowColor = `rgba(255,248,230,${0.4 * this.darkness})`;
      f.shadowBlur = 24;
    }
    const lo = -60, hi = this.W + 60;
    const reach = Math.hypot(this.W, this.H) * 1.5;
    if (t.theta <= 0 && t.settle <= 0) {
      this.block(cx - w / 2, top, w, h, N, lo, hi);
    } else if (t.settle <= 0) {
      this.block(cx - w / 2, top, w / 2, h, N, lo, hi);
      if (t.theta > Math.PI * 0.55) {
        f.save();
        f.shadowColor = 'transparent';
        const k = smooth(Math.PI * 0.55, Math.PI, t.theta);
        const sh = Math.min(h, 60);
        const g = f.createLinearGradient(0, top, 0, top + sh);
        g.addColorStop(0, `rgba(60,45,30,${0.22 * k})`);
        g.addColorStop(1, 'rgba(60,45,30,0)');
        f.fillStyle = g;
        const x0 = Math.max(cx - w / 2, lo);
        f.fillRect(x0, top, cx - x0, sh);
        f.restore();
      }
      f.save();
      f.translate(cx, top);
      f.rotate(-t.theta);
      this.block(0, 0, w / 2, h, N, 0, reach);
      f.shadowColor = 'transparent';
      const shade = Math.sin(t.theta) * 0.14 + (t.theta > Math.PI / 2 ? 0.05 : 0);
      f.fillStyle = `rgba(70,55,35,${shade})`;
      f.fillRect(0, 0, Math.min(w / 2, reach), h);
      f.restore();
    } else {
      const wNew = Math.max((L / 2) * s, this.minW);
      const e = 1 - Math.pow(1 - t.settle, 3);
      const ww = lerp(w / 2, wNew, e);
      const left = lerp(cx - w / 2, cx - wNew / 2, e);
      this.block(left, y0 - h * 2, ww, h * 2, N * 2, lo, hi);
    }
    f.restore();
  }

  // ---------- DOM overlays ----------

  private show(o: { el: HTMLElement; lbl?: HTMLElement; shown: boolean }, on: boolean) {
    if (on === o.shown) return;
    o.el.style.display = on ? 'block' : 'none';
    if (o.lbl) o.lbl.style.display = on ? 'grid' : 'none';
    o.shown = on;
  }

  private layoutDom() {
    const { W, H, cam } = this;
    const s = cam.scale;
    const cx = this.cx;
    const g0 = this.sy(0);
    const near = Math.min(this.towerHalf, W * 0.14);
    const gap = this.mobile ? 14 : 34;
    const pad = this.mobile ? 16 : 40;

    const acc = { r: 0, l: 0 };
    for (const te of this.thingEls) {
      const hp = te.h * s;
      const wp = te.w * s;
      const back = te.t.backdrop !== undefined;
      let a = back
        ? smooth(10, 40, hp) * (1 - smooth(H * 0.8, H * 1.4, hp))
        : smooth(14, 36, hp) * (1 - smooth(H * 0.42, H * 0.68, hp));
      if (g0 - hp > H || g0 < -10) a = 0;
      this.show(te, a > 0.003);
      if (a <= 0.003) continue;
      let x: number;
      if (back) x = cx + te.t.backdrop! * wp - wp / 2;
      else if (te.side > 0) {
        x = cx + near + gap + acc.r;
        acc.r += (wp + pad) * a;
      } else {
        x = cx - near - gap - acc.l - wp;
        acc.l += (wp + pad) * a;
      }
      te.el.style.width = wp + 'px';
      te.el.style.height = hp + 'px';
      te.el.style.transform = `translate3d(${x}px, ${g0 - hp}px, 0)`;
      te.el.style.opacity = String(a);
      const lx = back ? x + wp * 0.7 : x + wp / 2;
      const ly = back ? g0 - hp * 0.88 : g0 - hp;
      te.lbl.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      te.lbl.style.opacity = String(a);
    }

    for (const me of this.markerEls) {
      const ap = me.m.alt * s;
      const y = g0 - ap;
      const a = smooth(22, 54, ap) * smooth(150, 230, y) * (1 - smooth(H - 40, H, y));
      this.show(me, a > 0.003);
      if (a <= 0.003) continue;
      me.el.style.transform = `translate3d(0, ${y}px, 0)`;
      me.el.style.opacity = String(a);
      me.line.style.width = Math.max(0, cx - near - 10) + 'px';
    }

    for (const bd of this.bodies) {
      const p = bd.place();
      const on = !!p && p.a > 0.003 && p.y < H + 20 && p.y + p.h > -20 && p.x < W + 20 && p.x + p.w > -20;
      this.show(bd, on);
      if (!on || !p) continue;
      bd.el.style.width = p.w + 'px';
      bd.el.style.height = p.h + 'px';
      bd.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      bd.el.style.opacity = String(p.a);
    }
  }
}

/** fraction of the plate's width taken by the disc itself */
const MOON_FILL = 0.95;
const SUN_FILL = 0.2;
