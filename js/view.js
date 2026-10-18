// Assemblage de la scène 3D, caméra et HUD
import { Renderer, Node, geo, mat, m4 } from './gl.js';
import { buildStage } from './stages.js';
import { buildHuman, buildCats, poseHuman, animateCats, YAW } from './models.js';
import * as T from './textures.js';
import { img, store } from './store.js';
import { W } from './data.js';

const TAU = Math.PI * 2, HW = 960, HH = 540, OUT = '#07050f';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const X3 = x => (x - W / 2) / 100;
export const FONT = '"Russo One", "Arial Black", Impact, sans-serif';

export class View {
  constructor(c3, hud) {
    this.R = new Renderer(c3); this.c3 = c3; this.hud = hud; this.h = hud.getContext('2d');
    this.scene = new Node(); this.world = new Node(); this.scene.add(this.world);
    this.cam = { view: new Float32Array(16), proj: new Float32Array(16), eye: [0, 1.4, 7] };
    this.eye = [0, 1.5, 7]; this.tgt = [0, .95, 0]; this.models = [null, null]; this.shadows = [];
    this.blobTex = T.blob(); this.ballTex = T.football();
    this.glowMat = mat({ tex: T.glow('255,240,200'), additive: true, unlit: true, fog: false });
    this.proj = new Map(); this.dropN = new Map();
    for (let i = 0; i < 2; i++) { const s = new Node(geo.disc(.5, 16), mat({ tex: this.blobTex, transparent: true, unlit: true })).rot(-Math.PI / 2, 0, 0); this.shadows.push(s); this.world.add(s); }
    this.stageId = null; this.resize();
  }
  resize() {
    const r = this.c3.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const g = store.opts.gfx;
    let iw, ih;
    if (g === 'hd') { iw = Math.max(320, Math.round(r.width * dpr)); ih = Math.round(iw * 9 / 16); }
    else if (g === 'pixel') { iw = 384; ih = 216; }
    else { iw = 640; ih = 360; }
    this.c3.width = g === 'pixel' ? iw : Math.max(iw, Math.round(r.width * dpr)); this.c3.height = Math.round(this.c3.width * 9 / 16);
    this.c3.style.imageRendering = g === 'pixel' ? 'pixelated' : 'auto';
    this.R.setInternal(iw, ih); this.R.dither = g === 'hd' ? 0 : 1;
    this.hud.width = Math.round(Math.max(HW, r.width * dpr)); this.hud.height = Math.round(this.hud.width * 9 / 16);
  }
  setStage(id, force) {
    if (this.stageId === id && !force) return;
    if (this.stage) this.world.remove(this.stage.root);
    this.stage = buildStage(id, img(store.stagePhoto, () => this.setStage(id, true)));
    this.world.add(this.stage.root); this.stageId = id;
  }
  setFighter(side, def, c, color) {
    if (this.models[side]) this.world.remove(this.models[side].root);
    const cc = color && color !== c.color ? { ...c, color } : c;
    const rig = def.kind === 'cats' ? buildCats(def, cc, img) : buildHuman(def, cc, img);
    rig.id = def.id; rig.def = def; this.models[side] = rig; this.world.add(rig.root);
    return rig;
  }
  sync(side, f) {
    const rig = this.models[side]; if (!rig) return;
    const x = X3(f.x);
    if (rig.kind === 'cats') {
      rig.root.at(x, -f.y / 100, 0); rig.body.r[1] = (f.face > 0 ? -.32 : .32) + (f.spin || 0); rig.body.s[0] = f.face;
      animateCats(rig, f);
    } else {
      const sc = rig.scale;
      rig.root.at(x, (f.low * sc - f.y) / 100, 0);
      rig.body.r[1] = (f.face > 0 ? -YAW : YAW) + (f.spin || 0); rig.body.s[0] = f.face * sc;
      poseHuman(rig, f.pose, f);
    }
    const s = this.shadows[side], hgt = clamp(-f.y / 200, 0, 1), k = (rig.kind === 'cats' ? 1.4 : 1) * (1 - hgt * .5);
    s.at(x, .012, 0); s.scl(k * 1.1, k * .7, 1);
  }
  syncFX(fight) {
    const seen = new Set();
    for (const p of fight.projs) {
      seen.add(p.id); let n = this.proj.get(p.id);
      if (!n) {
        n = new Node();
        if (p.kind === 'ballon') n.add(new Node(geo.sphere(.14, 10, 8), mat({ tex: this.ballTex })));
        else if (p.kind === 'poils') { n.add(new Node(geo.sphere(.14, 6, 4), mat({ color: '#9a8f86' }))); for (let i = 0; i < 6; i++) n.add(new Node(geo.cyl(0, .03, .1, 4), mat({ color: '#7d726a' })).rot(0, 0, i * 1.05).at(Math.sin(i * 1.05) * -.13, Math.cos(i * 1.05) * .13, 0)); }
        else { n.add(new Node(geo.sphere(.13, 8, 6), mat({ color: '#fff6dc', unlit: true }))); const gw = new Node(geo.plane(1, 1), mat({ tex: T.glow(hexToRgbStr(p.owner.color)), additive: true, unlit: true, fog: false })); gw.billboard = true; gw.scl(.7); n.add(gw); }
        this.world.add(n); this.proj.set(p.id, n);
      }
      n.at(X3(p.x), -p.y / 100, 0); n.r[2] = p.spin;
    }
    for (const [id, n] of this.proj) if (!seen.has(id)) { this.world.remove(n); this.proj.delete(id); }
    const seenD = new Set();
    for (const d of fight.drops) {
      seenD.add(d.id); let n = this.dropN.get(d.id);
      if (!n) {
        n = new Node(); const m = mat({ color: d.col });
        n.add(new Node(geo.box(.32, .17, .18), m)); for (const dx of [-.08, .08]) n.add(new Node(geo.cyl(.045, .045, .06, 8), m).at(dx, .11, 0));
        const sh = new Node(geo.disc(.3, 12), mat({ tex: this.blobTex, transparent: true, unlit: true })).rot(-Math.PI / 2, 0, 0); n.shadow = sh; this.world.add(sh);
        this.world.add(n); this.dropN.set(d.id, n);
      }
      n.visible = d.delay <= 0; n.at(X3(d.x), -d.y / 100, 0).rot(d.rot * .5, d.rot, d.rot * .3);
      const k = clamp(1 - (-d.y) / 600, 0, 1); n.shadow.at(X3(d.x), .015, 0).scl(.4 + k, .4 + k, 1); n.shadow.visible = d.delay <= 0;
    }
    for (const [id, n] of this.dropN) if (!seenD.has(id)) { this.world.remove(n); this.world.remove(n.shadow); this.dropN.delete(id); }
  }
  clearFX() { for (const n of this.proj.values()) this.world.remove(n); for (const n of this.dropN.values()) { this.world.remove(n); this.world.remove(n.shadow); } this.proj.clear(); this.dropN.clear(); }
  // caméra de combat : suit les deux combattants, zoome sur les pouvoirs
  camFight(fight) {
    const a = fight.f1, b = fight.f2, x1 = X3(a.x), x2 = X3(b.x);
    const mid = clamp((x1 + x2) / 2, -2.6, 2.6), sep = Math.abs(x1 - x2);
    const dist = clamp(3.6 + sep * .82, 4.4, 8), hy = Math.max(-a.y, -b.y) / 100;
    let e = [mid * .9, 1.3 + dist * .05 + hy * .3, dist], t = [mid, .9 + hy * .35, 0], k = .12;
    if (fight.cine) { const f = fight.cine.f, fx = X3(f.x), hh = f.h / 100; e = [fx + f.face * 1.3, .5 + hh * .7, 2.3]; t = [fx, hh * .62, 0]; k = .25; }
    if (fight.phase === 'over' || (fight.phase === 'roundEnd' && fight.pt < 150 && fight.winner)) { const f = fight.winner, fx = X3(f.x), hh = f.h / 100; e = [fx + f.face * 1.6, .6 + hh * .6, 3]; t = [fx, hh * .6, 0]; k = .05; }
    this.moveCam(e, t, k, fight.shake);
  }
  camShow(x1, x2, orbit) {
    const mid = (x1 + x2) / 2;
    const e = orbit != null ? [mid + Math.sin(orbit) * 5.5, 1.6, Math.cos(orbit) * 5.5 + 1] : [mid, 1.2, 5.2];
    this.moveCam(e, [mid, .85, 0], orbit != null ? 1 : .1, 0);
  }
  moveCam(e, t, k, shake) {
    for (let i = 0; i < 3; i++) { this.eye[i] += (e[i] - this.eye[i]) * k; this.tgt[i] += (t[i] - this.tgt[i]) * k; }
    const s = (shake || 0) * .006, ey = [this.eye[0] + (Math.random() - .5) * s, this.eye[1] + (Math.random() - .5) * s, this.eye[2]];
    this.cam.eye = ey; m4.lookAt(ey, this.tgt, [0, 1, 0], this.cam.view); m4.persp(34 * Math.PI / 180, 16 / 9, .1, 200, this.cam.proj);
  }
  render() { if (!this.stage) return; this.R.render(this.scene, this.cam, this.stage.env); }
  // coordonnées de jeu -> pixels du HUD (960×540)
  scr(x, y) { const p = this.R.project(this.cam, X3(x), -y / 100, 0); return [p[0] * HW, p[1] * HH, p[2]]; }

  /* ------------------------------ HUD ------------------------------ */
  hudBegin() { const h = this.h, s = this.hud.width / HW; h.setTransform(s, 0, 0, s, 0, 0); h.clearRect(0, 0, HW, HH); return h; }
  txt(t, x, y, size, fill, align = 'center', stroke = 6, font = FONT) {
    const h = this.h; h.font = `${size}px ${font}`; h.textAlign = align; h.textBaseline = 'middle'; h.lineJoin = 'round';
    if (stroke) { h.lineWidth = stroke; h.strokeStyle = OUT; h.strokeText(t, x, y); } h.fillStyle = fill; h.fillText(t, x, y);
  }
  portrait(rig, cx, cy, r, ring, flip) {
    const h = this.h; if (!rig) return;
    h.save(); h.beginPath(); h.arc(cx, cy, r, 0, TAU); h.clip();
    h.fillStyle = rig.kind === 'cats' ? rig.def && rgbStr(rig.m.a.fur.color) : rgbStr(rig.m.skin.color); h.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    h.translate(cx, cy); if (flip) h.scale(-1, 1); h.drawImage(rig.faceC, -r, -r, 2 * r, 2 * r); h.restore();
    h.lineWidth = 4; h.strokeStyle = ring; h.beginPath(); h.arc(cx, cy, r, 0, TAU); h.stroke();
    h.lineWidth = 2; h.strokeStyle = OUT; h.beginPath(); h.arc(cx, cy, r + 3, 0, TAU); h.stroke();
  }
  bar(x, y, w, hgt, v, dv, rev) {
    const h = this.h;
    h.fillStyle = 'rgba(7,5,15,.85)'; h.fillRect(x - 3, y - 3, w + 6, hgt + 6);
    h.fillStyle = '#2a1a3a'; h.fillRect(x, y, w, hgt);
    const fill = (val, c) => { const ww = w * clamp(val, 0, 1); h.fillStyle = c; h.fillRect(rev ? x + w - ww : x, y, ww, hgt); };
    fill(dv, '#ff3d4f');
    const g = h.createLinearGradient(0, y, 0, y + hgt); g.addColorStop(0, v > .3 ? '#fffbd0' : '#ffd0a0'); g.addColorStop(.5, v > .3 ? '#ffd23f' : '#ff8a3d'); g.addColorStop(1, v > .3 ? '#d99a12' : '#d9381e');
    fill(v, g); h.fillStyle = 'rgba(255,255,255,.35)'; h.fillRect(x, y + 2, w, 3);
    h.strokeStyle = '#c9c3dd'; h.lineWidth = 1.5; h.strokeRect(x - 1.5, y - 1.5, w + 3, hgt + 3);
  }
  drawFight(fight) {
    const h = this.hudBegin();
    // particules
    for (const q of fight.parts) {
      const [sx, sy] = this.scr(q.x, q.y), a = q.life / q.max;
      h.globalAlpha = a;
      if (q.t === 'spark') { const [ex, ey] = this.scr(q.x - q.vx * 3, q.y - q.vy * 3); h.strokeStyle = q.col; h.lineWidth = 3; h.beginPath(); h.moveTo(sx, sy); h.lineTo(ex, ey); h.stroke(); }
      else if (q.t === 'ring') { h.strokeStyle = q.col; h.lineWidth = 4; h.beginPath(); h.arc(sx, sy, (1 - a) * 60 + 8, 0, TAU); h.stroke(); }
      else if (q.t === 'dust') { h.globalAlpha = a * .5; h.fillStyle = q.col; h.beginPath(); h.arc(sx, sy, 6 * (1.5 - a), 0, TAU); h.fill(); }
      else if (q.t === 'fire') { h.fillStyle = a > .5 ? '#ffd23f' : '#ff6a3d'; h.beginPath(); h.arc(sx, sy, 10 * a + 3, 0, TAU); h.fill(); }
    }
    h.globalAlpha = 1;
    for (const f of [fight.f1, fight.f2]) if (f.dazzle > 0) { const [sx, sy] = this.scr(f.x, f.y - f.h - 10); for (let i = 0; i < 3; i++) { const a = f.t * .15 + i * TAU / 3; this.txt('★', sx + Math.cos(a) * 26, sy + Math.sin(a) * 8, 18, '#ffd23f', 'center', 3); } }
    for (const q of fight.pops) {
      let sx, sy; if (q.fixed) { sx = q.x; sy = q.x === W / 2 ? 120 : 150; } else [sx, sy] = this.scr(q.x, q.y);
      h.globalAlpha = Math.min(1, q.life / 12); const s = 1 + Math.max(0, (q.life - 42) / 8) * .4;
      h.save(); h.translate(sx, sy); h.scale(s, s); this.txt(q.text, 0, 0, q.size, q.col, 'center', 7); h.restore();
    }
    h.globalAlpha = 1;
    if (fight.cine) { h.fillStyle = 'rgba(7,5,15,.35)'; h.fillRect(0, 0, HW, 60); h.fillRect(0, HH - 60, HW, 60); }
    else this.hudBars(fight);
    this.center(fight);
    if (fight.flash > .02) { h.fillStyle = `rgba(255,255,255,${fight.flash})`; h.fillRect(0, 0, HW, HH); }
  }
  hudBars(fight) {
    const h = this.h, L = fight.f1, R = fight.f2;
    this.bar(100, 28, 330, 22, L.hp / L.hpMax, L.dhp / L.hpMax, false); this.bar(530, 28, 330, 22, R.hp / R.hpMax, R.dhp / R.hpMax, true);
    this.portrait(this.models[0], 54, 44, 32, L.color, false); this.portrait(this.models[1], HW - 54, 44, 32, R.color, true);
    this.txt((L.c.name || '').toUpperCase(), 102, 70, 17, '#fff1dc', 'left', 5); this.txt((R.c.name || '').toUpperCase(), HW - 102, 70, 17, '#fff1dc', 'right', 5);
    for (let i = 0; i < fight.opts.rounds; i++) {
      for (const [f, x] of [[L, 410 - i * 20], [R, 550 + i * 20]]) { h.fillStyle = i < f.wins ? '#ffd23f' : '#2a1a3a'; h.strokeStyle = OUT; h.lineWidth = 3; h.save(); h.translate(x, 70); h.rotate(Math.PI / 4); h.fillRect(-6, -6, 12, 12); h.strokeRect(-6, -6, 12, 12); h.restore(); }
    }
    h.fillStyle = 'rgba(7,5,15,.85)'; h.fillRect(447, 16, 66, 50); h.strokeStyle = '#c9c3dd'; h.lineWidth = 1.5; h.strokeRect(447, 16, 66, 50);
    const tt = fight.opts.time ? String(fight.time).padStart(2, '0') : '∞';
    this.txt(tt, 480, 42, 30, fight.opts.time && fight.time <= 10 && fight.frame % 30 < 15 ? '#ff4f5e' : '#fff1dc', 'center', 4);
    const meter = (f, x, rev) => {
      const P = f.power(), v = f.meter, ok = v >= P.cost, w = 250;
      h.fillStyle = 'rgba(7,5,15,.85)'; h.fillRect(x - 3, 507, w + 6, 16); h.fillStyle = '#1d1735'; h.fillRect(x, 510, w, 10);
      const ww = w * v / 100; const g = h.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3fd0ff'); g.addColorStop(1, '#b07bff');
      h.fillStyle = ok ? (fight.frame % 20 < 10 ? '#ffd23f' : '#fff1dc') : g; h.fillRect(rev ? x + w - ww : x, 510, ww, 10);
      const mk = w * P.cost / 100; h.fillStyle = '#fff1dc'; h.fillRect(rev ? x + w - mk - 1 : x + mk - 1, 505, 3, 20);
      this.txt(ok ? P.name.toUpperCase() + ' — PRÊT' : P.name.toUpperCase(), rev ? x + w : x, 494, 12, ok ? '#ffd23f' : '#c9c3dd', rev ? 'right' : 'left', 4);
    };
    meter(L, 40, false); meter(R, HW - 290, true);
  }
  center(fight) {
    let t = null, sub = null, k = 1;
    if (fight.phase === 'intro') {
      if (fight.pt > 50) { t = fight.round >= fight.opts.rounds * 2 - 1 ? 'MANCHE FINALE' : 'MANCHE ' + fight.round; k = Math.min(1, (130 - fight.pt) / 12); }
      else { t = 'BASTON !'; k = Math.min(1, (50 - fight.pt) / 8); }
    } else if (fight.phase === 'roundEnd') {
      if (fight.pt > 120) { t = fight.endMsg; k = Math.min(1, (230 - fight.pt) / 10); }
      else { t = fight.winner ? (fight.winner.c.name || '').toUpperCase() : 'PERSONNE'; sub = fight.winner ? 'gagne la manche' : 'ne gagne la manche'; }
    }
    if (!t) return;
    const h = this.h; h.save(); h.translate(HW / 2, HH / 2 - 30); const sc = .6 + .4 * k + (1 - k) * .8; h.scale(sc, sc);
    const size = t.length > 12 ? 52 : t.length > 8 ? 64 : 82;
    const g = h.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#ffe58a'); g.addColorStop(.55, '#ffb21e'); g.addColorStop(1, '#ff5a1e');
    this.txt(t, 0, 0, size, g, 'center', 12);
    if (sub) this.txt(sub, 0, size * .75, 24, '#fff1dc', 'center', 6);
    h.restore();
  }
}
function hexToRgbStr(hex) { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; }
function rgbStr(c) { return `rgb(${c.map(v => Math.round(v * 255)).join(',')})`; }
