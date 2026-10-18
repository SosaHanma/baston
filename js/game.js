// Logique de combat (indépendante du rendu)
import { W, GRAV, MV, POSE, POWERS } from './data.js';
import { blank } from './input.js';
import { sfx } from './audio.js';
import { lowPoint } from './models.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WORDS = ['PAF !', 'BIM !', 'POW !', 'BAM !', 'TCHAC !', 'VLAN !'];
const DIFF = { facile: { think: 26, block: .12, aggr: .3, jit: 16, pow: .25 }, normal: { think: 14, block: .42, aggr: .55, jit: 10, pow: .5 }, difficile: { think: 7, block: .74, aggr: .78, jit: 5, pow: .8 } };

export class Fighter {
  constructor(def, c, side, color) {
    this.def = def; this.c = c; this.side = side; this.color = color || c.color;
    this.st = def.stats; this.cat = def.kind === 'cats';
    this.h = this.cat ? 64 : 172 * def.scale; this.wr = this.cat ? 36 : 27 * Math.sqrt(def.scale) + 2;
    this.hr = this.cat ? .1 : ({ big: .122, slim: .112, kid: .138 }[def.build] || .118);
    this.hpMax = this.st.hp; this.wins = 0; this.meter = 0;
    this.reset();
  }
  reset() {
    Object.assign(this, { x: this.side ? W - 300 : 300, y: 0, vx: 0, vy: 0, face: this.side ? -1 : 1, hp: this.hpMax, dhp: this.hpMax, state: 'idle', move: null, mt: 0,
      hitDone: false, stun: 0, blockstun: false, crouch: false, onGround: true, guarding: false, pose: { ...POSE.idle }, t: 0, buf: {}, flash: 0, cd: 0, combo: 0,
      invul: 0, armor: false, frozen: 0, dazzle: 0, inp: blank(), ai: { t: 20, plan: 'idle', pt: 0 }, low: 84, spin: 0 });
  }
  power() { return POWERS[this.c.power] || POWERS[this.def.power]; }
}

export class Fight {
  constructor(d1, c1, d2, c2, opts) {
    const same = d1.id === d2.id;
    this.f1 = new Fighter(d1, c1, 0); this.f2 = new Fighter(d2, c2, 1, same ? (c1.color.toLowerCase() === '#3fd0ff' ? '#ff6a3d' : '#3fd0ff') : null);
    this.opts = opts; this.round = 1; this.frame = 0; this.projs = []; this.drops = []; this.parts = []; this.pops = []; this.flash = 0;
    this.hitstop = 0; this.shake = 0; this.slow = 0; this.cine = null; this.events = []; this.pid = 0; this.fxq = [];
    this.startRound();
  }
  startRound() {
    this.f1.reset(); this.f2.reset(); this.projs = []; this.drops = []; this.parts = []; this.pops = [];
    this.time = this.opts.time; this.phase = 'intro'; this.pt = 130; this.winner = null; this.slow = 0; this.hitstop = 0; this.cine = null; sfx('round');
  }
  opp(f) { return f === this.f1 ? this.f2 : this.f1; }
  hasProj(f) { return this.projs.some(p => p.owner === f); }

  start(f, name) {
    f.move = name; f.mt = 0; f.hitDone = false; f.state = 'attack'; f.buf = {};
    if (!MV[name].power && name !== 'fire') sfx(/kick/.test(name) ? 'whooshBig' : 'whoosh');
    if (!MV[name].power && name !== 'fire') this.fxq.push({ t: 'swing', f, name });
    if (!MV[name].power && Math.random() < .3) this.events.push({ voice: 'coup', f });
    if (!MV[name].air) f.vx = 0;
    if (MV[name].power) { this.cine = { f, t: 48, max: 48, name: f.power().name }; this.hitstop = 48; sfx('power'); this.fxq.push({ t: 'powerStart', f }); this.events.push({ voice: 'pouvoir', f }); this.pop(f.power().name.toUpperCase(), W / 2, 0, '#ffd23f', 36, true); }
  }
  canBlock(o, srcX, lvl) {
    if (!o.onGround || o.move || lvl === 'unblock') return false;
    if (o.stun > 0 && !o.blockstun) return false;
    const back = srcX > o.x ? o.inp.l : o.inp.r;
    if (!back) return false;
    if (lvl === 'low' && !o.inp.d) return false;
    if (lvl === 'high' && o.inp.d) return false;
    return true;
  }
  hit(a, o, h) {
    if (o.invul > 0 || o.state === 'ko') return;
    const dir = o.x >= h.srcX ? 1 : -1;
    const dmg = h.dmg * a.st.dmg;
    if (this.canBlock(o, h.srcX, h.lvl)) {
      o.hp = Math.max(1, o.hp - dmg * .12); o.stun = Math.round(h.stun * .75); o.blockstun = true; o.state = 'block'; o.crouch = !!o.inp.d; o.vx = dir * h.kb * .9;
      o.meter = Math.min(100, o.meter + 3); a.meter = Math.min(100, a.meter + 3);
      this.burst(h.hx, h.hy, '#8fe4ff', 8, 4); sfx('block'); this.hitstop = 3; return;
    }
    if (o.armor) { o.hp -= dmg * .6; o.flash = 1; this.burst(h.hx, h.hy, '#fff1dc', 8, 4); sfx('block'); this.hitstop = 3; if (o.hp <= 0) this.ko(a, o, dir); return; }
    a.combo = o.stun > 0 ? a.combo + 1 : 1;
    if (dmg > 8 || Math.random() < .25) this.events.push({ voice: 'aie', f: o });
    if (a.move === 'griffes') this.fxq.push({ t: 'slash', x: h.hx, y: h.hy, dir: a.face });
    o.hp -= dmg; o.stun = h.stun; o.blockstun = false; o.state = 'hit'; o.move = null; o.vx = dir * h.kb; o.flash = 1; o.frozen = 0;
    if (!o.onGround) { o.vy = -6; o.stun += 10; }
    if (h.launch) { o.vy = -11; o.onGround = false; o.stun += 8; }
    if (h.dazzle) { o.stun = h.stun; o.dazzle = h.stun; o.vx = dir * 1.5; this.pop('ÉBLOUI !', o.x, o.y - o.h - 40, '#ffffff', 28); }
    a.meter = Math.min(100, a.meter + 12); o.meter = Math.min(100, o.meter + 6);
    this.burst(h.hx, h.hy, h.big ? '#ffd23f' : '#fff1dc', h.big ? 26 : 14, h.big ? 9 : 6); this.ring(h.hx, h.hy, a.color);
    if (!h.dazzle) this.pop(h.big ? 'MÉGA BOUM !' : WORDS[Math.floor(Math.random() * WORDS.length)], h.hx, h.hy - 30, h.big ? '#ffd23f' : a.color, h.big ? 42 : 30);
    this.shake = h.big ? 16 : dmg > 8 ? 9 : 5; this.hitstop = Math.max(this.hitstop, h.big ? 14 : dmg > 8 ? 8 : 5); sfx(h.big ? 'big' : 'hit', Math.min(1, dmg / 12));
    o.hitDir = dir; o.hitT = 14; o.hitK = h.big ? 1 : Math.min(1, dmg / 10); this.zoom = Math.max(this.zoom || 0, h.big ? 1 : dmg > 8 ? .55 : .3);
    this.fxq.push({ t: 'sweat', x: o.x, y: o.y - o.h * .9, dir, n: h.big ? 10 : dmg > 8 ? 6 : 3 });
    if (a.cat && Math.random() < .25) sfx('meow');
    if (o.hp <= 0) this.ko(a, o, dir);
  }
  ko(a, o, dir) {
    o.hp = 0; o.state = 'ko'; o.stun = 0; o.move = null; o.onGround = false; o.vy = -10; o.vx = dir * 7; o.frozen = 0; o.armor = false; o.dazzle = 0;
    this.phase = 'roundEnd'; this.pt = 230; this.winner = a; this.endMsg = 'K.O. !'; this.slow = 70; this.hitstop = 18; a.wins++;
    this.projs = []; this.drops = []; sfx('ko'); this.fxq.push({ t: 'ko', x: o.x, y: o.y - o.h * .6 }); this.events.push({ voice: 'ko', f: o }, { voice: 'victoire', f: a, delay: 90 });
  }
  melee(f, o, m) {
    if (o.state === 'ko') return;
    const reach = m.reach * f.st.reach, dx = (o.x - f.x) * f.face;
    if (dx < -14 || dx > reach + o.wr) return;
    if (m.air || m.anti) { if (Math.abs(o.y - f.y) > 140) return; }
    else if (o.y < -105) return;
    f.hitDone = true;
    const hx = f.x + f.face * Math.max(30, Math.min(dx, reach)), hy = o.y - (m.lvl === 'low' ? 25 : o.h * .6);
    this.hit(f, o, { dmg: m.dmg, stun: m.stun, kb: m.kb, lvl: m.lvl, srcX: f.x, hx, hy, launch: m.launch, big: f.move === 'charge' || f.move === 'dragon' });
  }
  spawnProj(f) {
    const kind = f.def.proj;
    this.projs.push({ id: ++this.pid, x: f.x + f.face * 50, y: -Math.min(80, f.h * .55), vx: f.face * (kind === 'ballon' ? 8 : 7.2), owner: f, r: kind === 'poils' ? 20 : 22, dmg: 10, kind, spin: 0 });
    f.cd = 45; sfx('fire'); if (f.cat) sfx('meow');
  }
  trigger(f, o, name) {
    switch (name) {
      case 'fire': this.spawnProj(f); break;
      case 'summon':
        this.fxq.push({ t: 'portal', x: o.x, y: -420 });
        for (let i = 0; i < 6; i++) this.drops.push({ id: ++this.pid, x: clamp(o.x + (i - 2.5) * 44 + (Math.random() - .5) * 16, 30, W - 30), y: -620 - i * 30, vy: 0, delay: i * 7, owner: f, dmg: 6, rot: Math.random() * TAU, col: ['#e8452c', '#2d6cdf', '#34c46a', '#f2c94c', '#d94fa3', '#ff8a3d'][i] });
        break;
      case 'selfie': {
        this.flash = 1; sfx('flash'); this.fxq.push({ t: 'flash', x: f.x + f.face * 35, y: f.y - f.h * .85 });
        const dx = (o.x - f.x) * f.face;
        if (dx > 0 && dx < 380 && o.y > -170 && o.invul <= 0 && o.state !== 'ko') {
          const half = o.guarding || o.blockstun;
          this.hit(f, o, { dmg: half ? 2 : 5, stun: half ? 28 : 78, kb: 1, lvl: 'unblock', srcX: f.x, hx: o.x, hy: o.y - o.h * .8, dazzle: true });
        }
        break;
      }
      case 'dragon': f.vy = -16; f.onGround = false; f.vx = f.face * 2.5; break;
    }
  }
  physics(f) {
    if (!f.onGround) f.vy += GRAV;
    if (f.frozen > 0 || f.dazzle > 0) f.vx *= .6;
    f.x += f.vx; f.y += f.vy;
    if (f.y >= 0) {
      f.y = 0;
      if (!f.onGround) {
        f.onGround = true; f.vy = 0;
        if (f.move && (MV[f.move].air || f.move === 'dragon')) f.move = null;
        if (f.state === 'jump' || f.state === 'attack') { f.state = 'idle'; f.vx = 0; }
        if (f.state === 'ko') { f.vx *= .4; this.shake = Math.max(this.shake, 12); sfx('fall'); this.fxq.push({ t: 'thud', x: f.x }); } else sfx('land');
        this.dust(f.x);
      }
    }
    if (f.onGround && ['hit', 'block', 'ko', 'win'].includes(f.state)) f.vx *= .84;
    f.x = clamp(f.x, 46, W - 46);
  }
  update(f, o, inp) {
    f.t++; if (f.cd > 0) f.cd--; f.flash *= .82; f.inp = inp; if (f.hitT > 0) f.hitT--;
    if (f.invul > 0) f.invul--; if (f.dazzle > 0) f.dazzle--;
    for (const k of ['p', 'k', 's', 'x']) if (inp.press[k]) f.buf[k] = this.frame;
    const fresh = k => f.buf[k] != null && this.frame - f.buf[k] <= 7;
    f.armor = false;
    if (f.state === 'ko' || f.state === 'win') { this.physics(f); return; }
    if (this.phase === 'roundEnd' && this.winner === f && f.onGround && !f.move && f.stun <= 0 && this.pt < 170) { f.state = 'win'; f.vx = 0; this.physics(f); return; }
    if (f.stun > 0) { f.stun--; if (f.stun <= 0) { f.state = 'idle'; f.blockstun = false; f.combo = 0; o.combo = 0; f.dazzle = 0; } this.physics(f); return; }
    const back = o.x > f.x ? inp.l : inp.r;
    f.guarding = !!back && f.onGround && (!!o.move || this.projs.some(p => p.owner === o && Math.abs(p.x - f.x) < 260) || this.drops.some(d => d.owner === o));
    if (f.move) {
      f.mt++; const m = MV[f.move], act = f.mt >= m.s && f.mt < m.s + m.a;
      if (f.mt === m.s) this.trigger(f, o, f.move);
      if (m.dash) {
        if (act) { f.vx = f.face * m.dash; if (f.t % 2 === 0) this.dust(f.x - f.face * 30); } else if (f.mt >= m.s + m.a) f.vx *= .7;
        if (f.move === 'tornade') f.spin = act ? f.spin + .55 : 0;
      }
      if (m.armor) f.armor = f.mt < m.s + m.a;
      if (m.multi && act && (f.mt - m.s) % m.multi === 0) f.hitDone = false;
      if (f.move === 'dragon' && f.mt < m.s + 10) f.invul = 2;
      if (m.power && act) this.fxq.push({ t: 'pw_' + f.move, f, k: f.mt - m.s });
      if (m.dmg && act && !f.hitDone) this.melee(f, o, m);
      if (f.mt >= m.s + m.a + m.r && !m.air) { f.move = null; f.crouch = !!inp.d; f.state = f.crouch ? 'crouch' : 'idle'; if (f.onGround) f.vx = 0; f.spin = 0; }
      this.physics(f); return;
    }
    const dir = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), spd = f.st.spd;
    if (f.onGround) {
      f.face = o.x > f.x ? 1 : -1; f.crouch = !!inp.d;
      const P = f.power();
      if (fresh('x') && f.meter >= P.cost) { f.meter -= P.cost; this.start(f, P.move); }
      else if (fresh('s') && f.cd <= 0 && !this.hasProj(f)) this.start(f, 'fire');
      else if (fresh('p')) this.start(f, f.crouch ? 'cpunch' : 'punch');
      else if (fresh('k')) this.start(f, f.crouch ? 'ckick' : 'kick');
      else if (inp.u) { f.vy = -15.5 * Math.sqrt(f.st.jump); f.vx = dir * 4.3 * spd; f.onGround = false; f.state = 'jump'; f.crouch = false; this.dust(f.x); }
      else if (f.crouch) { f.vx = 0; f.state = 'crouch'; }
      else if (dir) { f.vx = dir * (dir === f.face ? 4 : 3.2) * spd; f.state = 'walk'; if (f.t % 17 === 0) sfx('step'); }
      else { f.vx = 0; f.state = 'idle'; }
    } else {
      if (fresh('p')) this.start(f, 'apunch'); else if (fresh('k')) this.start(f, 'akick');
    }
    this.physics(f);
  }
  ai(f, o) {
    const D = DIFF[this.opts.diff] || DIFF.normal, A = f.ai, inp = blank(), r = Math.random;
    const dist = Math.abs(o.x - f.x), tw = o.x > f.x ? 'r' : 'l', aw = tw === 'r' ? 'l' : 'r';
    const threat = this.projs.find(p => p.owner === o && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(f.x - p.x) < 280) || this.drops.some(d => d.owner === o && d.delay <= 0);
    if (--A.t <= 0) {
      A.t = D.think + r() * D.jit; A.pt = 0;
      const P = f.power(), k = f.c.power; let pw = false;
      if (f.meter >= P.cost && r() < D.pow) {
        if (k === 'dragon') pw = (!o.onGround && dist < 170) || (dist < 90 && r() < .3);
        else if (k === 'selfie') pw = dist < 330 && o.onGround;
        else if (k === 'taureau' || k === 'tornade' || k === 'griffes') pw = dist < 340 && dist > 70;
        else pw = dist > 120;
      }
      if (pw) A.plan = 'power';
      else if (threat) A.plan = r() < D.block ? 'block' : (r() < .5 ? 'jump' : 'block');
      else if (o.move && dist < 170) A.plan = r() < D.block ? (o.move === 'ckick' ? 'cblock' : 'block') : 'attack';
      else if (dist > 330) A.plan = r() < .35 ? 'fire' : 'approach';
      else if (dist > 125) A.plan = r() < .2 * D.aggr ? 'jumpin' : r() < .14 ? 'fire' : 'approach';
      else A.plan = r() < D.aggr ? 'attack' : r() < .5 ? 'block' : 'retreat';
    }
    A.pt++;
    switch (A.plan) {
      case 'approach': inp[tw] = 1; break;
      case 'retreat': case 'block': inp[aw] = 1; break;
      case 'cblock': inp[aw] = 1; inp.d = 1; break;
      case 'jump': inp.u = A.pt < 3; break;
      case 'jumpin': if (A.pt < 3) { inp.u = 1; inp[tw] = 1; } else if (!f.onGround && dist < 135 && !f.move) inp.press.k = 1; break;
      case 'fire': if (A.pt === 1) inp.press.s = 1; break;
      case 'power': if (A.pt === 1) inp.press.x = 1; break;
      case 'attack':
        if (dist > 100 * f.st.reach) inp[tw] = 1;
        else if (!f.move && A.pt % 7 === 1) { const q = r(); if (q < .4) inp.press.p = 1; else if (q < .75) inp.press.k = 1; else { inp.d = 1; inp.press.k = 1; } }
        break;
    }
    return inp;
  }
  burst(x, y, col, n, sp) { this.fxq.push({ t: n >= 20 ? 'bighit' : n <= 8 ? 'block' : 'hit', x, y, col }); }
  ring(x, y, col) { }
  dust(x) { this.fxq.push({ t: 'dust', x }); }
  pop(text, x, y, col, size, fixed) { this.pops.push({ text, x: clamp(x, 100, W - 100), y, col, size, life: 50, max: 50, fixed }); }

  // une image de jeu (1/60 s)
  tick(i1, i2) {
    this.frame++;
    if (this.cine) { this.cine.t--; if (this.cine.t <= 0) this.cine = null; }
    if (this.hitstop > 0) { this.hitstop--; this.shake *= .9; return; }
    const { f1, f2 } = this;
    if (this.phase !== 'fight') { i1 = blank(); i2 = blank(); }
    this.update(f1, f2, i1); this.update(f2, f1, i2);
    const dx = f2.x - f1.x, md = f1.wr + f2.wr;
    if (Math.abs(dx) < md && Math.abs(f1.y - f2.y) < 95 && f1.state !== 'ko' && f2.state !== 'ko' && !(f1.invul || f2.invul)) {
      const push = (md - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); f1.x = clamp(f1.x - push, 46, W - 46); f2.x = clamp(f2.x + push, 46, W - 46);
    }
    for (const p of this.projs) {
      p.x += p.vx; p.spin += .3 * Math.sign(p.vx);
      const o = this.opp(p.owner);
      if (!p.dead && o.state !== 'ko' && o.invul <= 0 && Math.abs(p.x - o.x) < p.r + o.wr && p.y + p.r > o.y - o.h && p.y - p.r < o.y) {
        p.dead = true; this.hit(p.owner, o, { dmg: p.dmg, stun: 20, kb: 5, lvl: 'mid', srcX: p.x, hx: p.x, hy: p.y });
      }
      if (p.x < -80 || p.x > W + 80) p.dead = true;
    }
    for (let i = 0; i < this.projs.length; i++) for (let j = i + 1; j < this.projs.length; j++) {
      const a = this.projs[i], b = this.projs[j];
      if (a.owner !== b.owner && !a.dead && !b.dead && Math.abs(a.x - b.x) < a.r + b.r) { a.dead = b.dead = true; this.burst((a.x + b.x) / 2, a.y, '#ffd23f', 16, 6); sfx('block'); }
    }
    this.projs = this.projs.filter(p => !p.dead);
    for (const d of this.drops) {
      if (d.delay > 0) { d.delay--; continue; }
      d.vy = Math.min(d.vy + .9, 15); d.y += d.vy; d.rot += .25;
      const o = this.opp(d.owner);
      if (!d.dead && o.state !== 'ko' && Math.abs(d.x - o.x) < o.wr + 10 && d.y > o.y - o.h && d.y < o.y + 5) { d.dead = true; this.hit(d.owner, o, { dmg: d.dmg, stun: 16, kb: 2, lvl: 'high', srcX: d.owner.x, hx: d.x, hy: d.y }); sfx('toy'); }
      if (d.y >= 0) { d.dead = true; this.dust(d.x); sfx('toy'); }
    }
    this.drops = this.drops.filter(d => !d.dead);
    for (const q of this.parts) { q.x += q.vx || 0; q.y += q.vy || 0; if (q.t === 'spark') { q.vx *= .9; q.vy *= .9; } if (q.t === 'fire') q.vy -= .25; q.life--; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const q of this.pops) { q.life--; if (!q.fixed) q.y -= .6; }
    this.pops = this.pops.filter(q => q.life > 0);
    for (const f of [f1, f2]) f.dhp += (f.hp - f.dhp) * (f.stun > 0 ? .02 : .08);
    this.shake *= .85; this.flash *= .9; this.zoom = (this.zoom || 0) * .9;
    if (this.phase === 'intro') { this.pt--; if (this.pt === 50) sfx('fight'); if (this.pt <= 0) this.phase = 'fight'; }
    else if (this.phase === 'fight') {
      if (this.time > 0 && this.frame % 60 === 0) {
        this.time--;
        if (this.time === 0) {
          this.phase = 'roundEnd'; this.pt = 200; this.projs = []; this.drops = [];
          const r1 = f1.hp / f1.hpMax, r2 = f2.hp / f2.hpMax;
          if (Math.abs(r1 - r2) < .005) { this.winner = null; this.endMsg = 'ÉGALITÉ'; } else { this.winner = r1 > r2 ? f1 : f2; this.winner.wins++; this.endMsg = 'TEMPS !'; }
          sfx('round');
        }
      }
    } else if (this.phase === 'roundEnd') {
      this.pt--;
      if (this.pt <= 0) {
        if (this.winner && this.winner.wins >= this.opts.rounds) { this.phase = 'over'; this.events.push('over'); }
        else { this.round++; this.startRound(); }
      }
    }
  }
  // poses interpolées (appelée à chaque affichage)
  animate(f) {
    if (f.frozen > 0) return;
    let tgt, rate; const s = f.state;
    if (s === 'ko') { tgt = POSE.ko; rate = .16; }
    else if (s === 'win') { tgt = POSE.win; rate = .15; }
    else if (f.stun > 0) { tgt = f.blockstun ? (f.crouch ? POSE.cblock : POSE.block) : f.dazzle > 0 ? POSE.block : POSE.hit; rate = .5; }
    else if (f.move) {
      const m = MV[f.move];
      if (f.mt < m.s) { tgt = POSE[m.pose + '_s'] || POSE[m.pose]; rate = .38; }
      else if (f.mt < m.s + m.a) { tgt = POSE[m.pose]; rate = .6; }
      else { tgt = m.crouch ? POSE.crouch : (m.air || !f.onGround) ? POSE.jump : POSE.idle; rate = .18; }
    }
    else if (!f.onGround) { tgt = POSE.jump; rate = .25; }
    else if (f.guarding) { tgt = f.crouch ? POSE.cblock : POSE.block; rate = .4; }
    else if (s === 'crouch') { tgt = POSE.crouch; rate = .35; }
    else if (s === 'walk') { const w = Math.sin(f.t * .28); tgt = { ...POSE.idle, fl1: .15 + w * .45, fl2: .05 + w * .2 - Math.max(0, -w) * .4, bl1: -.15 - w * .45, bl2: -.1 - w * .2 - Math.max(0, w) * .4, lean: .16 }; rate = .35; }
    else { const b = Math.sin(f.t * .1); tgt = { ...POSE.idle, fa2: 2.5 + b * .1, ba2: 2.3 + b * .1, lean: .12 + b * .03, fl1: .35 + b * .03, bl1: -.35 - b * .03 }; rate = .25; }
    for (const k in tgt) f.pose[k] += (tgt[k] - f.pose[k]) * rate;
    f.low = lowPoint(f.pose, f.hr, s === 'ko');
  }
}
