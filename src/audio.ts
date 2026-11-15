// Every sound is synthesised live with the Web Audio API.

class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode;
  noise!: AudioBuffer;
  enabled = true;
  private drone: { g: GainNode; oscs: OscillatorNode[] } | null = null;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }

  private noiseSrc() {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.playbackRate.value = 0.9 + Math.random() * 0.2;
    return s;
  }

  /** Paper swooshing over. `heavy` 0..1 makes it deeper and longer. */
  fold(heavy: number, dur = 0.7) {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime;
    // crinkle ticks
    for (let i = 0; i < 5; i++) {
      const s = this.noiseSrc();
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500 + Math.random() * 3000;
      const g = c.createGain();
      const st = t + i * 0.025 + Math.random() * 0.02;
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.12 * (1 - heavy * 0.6), st + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);
      s.connect(hp).connect(g).connect(this.master);
      s.start(st, Math.random());
      s.stop(st + 0.08);
    }
    // whoosh
    const s = this.noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    const f0 = 600 - heavy * 380, f1 = 2600 - heavy * 1800;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(this.master);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  /** The stack landing on itself. */
  land(heavy: number) {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime;
    const s = this.noiseSrc();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900 - heavy * 600;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + heavy * 0.25);
    s.connect(lp).connect(g).connect(this.master);
    s.start(t, Math.random());
    s.stop(t + 0.5);

    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140 - heavy * 80, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25 + heavy * 0.3);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.35 + heavy * 0.25, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3 + heavy * 0.4);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.8);
  }

  private bell(freq: number, at: number, vol = 0.12, len = 1.6) {
    const c = this.ctx!;
    [1, 2.01, 3.98].forEach((m, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * m;
      const g = c.createGain();
      const v = vol / (i * 2.2 + 1);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(v, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len / (i + 1));
      o.connect(g).connect(this.master);
      o.start(at);
      o.stop(at + len + 0.1);
    });
  }

  milestone() {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime + 0.05;
    this.bell(659.25, t, 0.1);
    this.bell(987.77, t + 0.11, 0.09);
  }

  triumph() {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.bell(f, t + i * 0.12, 0.1, 2.6));
  }

  click() {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.03);
    const g = c.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.06);
  }

  /** Quiet ambient pad once we're in space. level 0..1 */
  space(level: number) {
    const c = this.ctx;
    if (!c) return;
    if (!this.drone && level > 0) {
      const g = c.createGain();
      g.gain.value = 0;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      g.connect(lp).connect(this.master);
      const oscs = [55, 82.4, 110.3, 164.8].map((f, i) => {
        const o = c.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = (Math.random() - 0.5) * 12;
        o.connect(g);
        o.start();
        return o;
      });
      this.drone = { g, oscs };
    }
    if (this.drone) this.drone.g.gain.setTargetAtTime(level * 0.05, c.currentTime, 1.5);
  }
}

export const sound = new Sound();
