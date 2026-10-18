// Assemblage de la scène 3D, caméra et HUD
import { Renderer, Node, geo, mat, m4 } from './gl.js';
import { buildStage } from './stages.js';
import { buildCats, poseHuman, animateCats, YAW } from './models.js';
import { buildPS2Human } from './ps2char.js';
import * as T from './textures.js';
import { img, store } from './store.js';
import { W } from './data.js';
import { FX } from './fx.js';

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
    this.fx = new FX(); this.fxT = 0;
    this.stageId = null; this.resize();
  }
  resize() {
    const r = this.c3.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), g = store.opts.gfx, R = this.R;
    const cw = Math.max(640, Math.round(r.width * dpr));
    this.c3.width = cw; this.c3.height = Math.round(cw * 9 / 16); this.c3.style.imageRendering = 'auto';
    const retro = g === 'vhs' || g === 'ps1';
    if (g === 'hd') R.setInternal(cw, Math.round(cw * 9 / 16)); else if (retro) R.setInternal(320, 180); else R.setInternal(854, 480);
    R.dither = g === 'hd' ? 0 : 1; R.vhs = g === 'vhs' ? 1 : 0; R.snap = retro ? 1 : 0; R.affine = retro ? 1 : 0;
    R.nearest = retro; R.upNearest = g === 'ps1';
    this.hud.width = Math.round(Math.max(HW, r.width * dpr)); this.hud.height = Math.round(this.hud.width * 9 / 16);
  }
  // incrustation façon magnétoscope
  osd(fightMode) {
    if (store.opts.gfx !== 'vhs') return;
    const h = this.h, t = performance.now() / 1000, mm = String(Math.floor(t / 60) % 60).padStart(2, '0'), ss = String(Math.floor(t) % 60).padStart(2, '0');
    h.font = '18px "VT323", "Courier New", monospace'; h.textBaseline = 'middle'; h.fillStyle = '#ffffff'; h.shadowColor = 'rgba(0,0,0,.8)'; h.shadowOffsetX = 2; h.shadowOffsetY = 2;
    if (fightMode) { h.textAlign = 'center'; h.fillText(`${Math.floor(t) % 2 ? '▶' : ' '} PLAY   SP  0:${mm}:${ss}`, HW / 2, 516); }
    else { h.textAlign = 'right'; h.font = '26px "VT323", "Courier New", monospace'; h.fillText(`▶ PLAY`, HW - 34, 40); h.font = '20px "VT323", "Courier New", monospace'; h.fillText(`SP  0:${mm}:${ss}`, HW - 34, 66); }
    h.shadowColor = 'transparent'; h.shadowOffsetX = 0; h.shadowOffsetY = 0;
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
    const rig = def.kind === 'cats' ? buildCats(def, cc, img) : buildPS2Human(def, cc, img);
    rig.id = def.id; rig.def = def; rig.photo = !!cc.photo; this.models[side] = rig; this.world.add(rig.root);
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
    this.effects(fight);
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
  // traduit les évènements du combat en effets 3D (positions de jeu -> mètres)
  effects(fight) {
    const F = this.fx, Y = y => -y / 100, z0 = .05; this.fxT++;
    const light = (x, y, k = 1) => { this.flashPos = [X3(x), Y(y), 1]; this.flashLight = Math.max(this.flashLight || 0, k); };
    for (const e of fight.fxq) {
      const x = X3(e.x ?? 0), y = Y(e.y ?? 0);
      switch (e.t) {
        case 'hit': F.hit(x, y, z0, e.col || '#ffffff', false); light(e.x, e.y, .25); break;
        case 'bighit': F.hit(x, y, z0, e.col || '#ffd23f', true); light(e.x, e.y, .6); break;
        case 'block': F.glow(x, y, z0, '#8fe4ff', .5, 8); F.ring(x, y, z0, '#8fe4ff', .9, 10); F.sparks(x, y, z0, '#bff0ff', 6, .06); break;
        case 'dust': F.dust(x, .03, 0, 6); break;
        case 'ko': F.hit(x, y, z0, '#ffffff', true); F.ring(x, y, z0, '#ffd23f', 4, 30); F.flashStar(x, y, z0); light(e.x, e.y, 1.5); break;
        case 'flash': F.flashStar(x, y, .2); light(e.x, e.y, 1.5); break;
        case 'portal': F.portal(x, y, 0, '#ffd23f'); break;
        case 'slash': F.slash(x, y, z0, e.dir, '#c77dff'); break;
        case 'powerStart': { const f = e.f, fx = X3(f.x), hh = f.h / 100; F.ring(fx, hh * .55, 0, f.color, 2.2, 24); F.glow(fx, hh * .55, 0, '#ffffff', .7, 12); for (let i = 0; i < 14; i++) F.aura(fx, 0, hh, f.color, 1); light(f.x, f.y - f.h * .6, .7); break; }
        case 'pw_dragon': { const f = e.f, fx = X3(f.x) + f.face * .15, fy = Y(f.y) + f.h / 100 * .85; F.fire(fx, fy, 0, 3, 1.2); F.spiral(X3(f.x), Y(f.y), f.h / 100, '#ff8a2a', this.fxT, 2); light(f.x, f.y - f.h * .9, .45); break; }
        case 'pw_charge': { const f = e.f, fx = X3(f.x); F.dust(fx - f.face * .2, .05, 0, 2); for (let i = 0; i < 2; i++) F.spawn({ x: fx + f.face * .2, y: Y(f.y) + .3 + Math.random() * f.h / 100 * .8, z: (Math.random() - .5) * .3, vx: -f.face * .12, streak: .4, size: .04, life: 8, col: '#ffffff', col1: '#ff5a3d', alpha: .7 }); F.aura(fx, Y(f.y), f.h / 100, '#ff5a3d', 2); break; }
        case 'pw_tornade': { const f = e.f; F.spiral(X3(f.x), Y(f.y), f.h / 100 * 1.1, '#c9b7ff', this.fxT, 5); if (this.fxT % 3 === 0) F.dust(X3(f.x), .03, 0, 2); break; }
        case 'pw_griffes': { const f = e.f; F.aura(X3(f.x), 0, .6, '#c77dff', 2); if (this.fxT % 2 === 0) F.dust(X3(f.x), .03, 0, 1); break; }
        case 'pw_summon': case 'pw_selfie': { const f = e.f; F.aura(X3(f.x), Y(f.y), f.h / 100, f.color, 3); break; }
      }
    }
    fight.fxq.length = 0;
    // aura pendant la mise en scène d'un pouvoir
    if (fight.cine) { const f = fight.cine.f; F.aura(X3(f.x), Y(f.y), f.h / 100, f.color, 2); if (this.fxT % 2) F.aura(X3(f.x), Y(f.y), f.h / 100, '#ffffff', 1); }
    // traînées des projectiles
    for (const p of fight.projs) {
      const x = X3(p.x), y = Y(p.y);
      if (p.kind === 'energy') { F.trail(x, y, 0, p.owner.color, .22, 12); F.trail(x, y, 0, '#ffffff', .1, 7); if (this.fxT % 2) F.sparks(x, y, 0, p.owner.color, 1, .03); }
      else if (p.kind === 'ballon') { if (this.fxT % 3 === 0) F.smoke(x - Math.sign(p.vx) * .1, y, 0, .08, '#c8c0b0', 18); }
      else F.spawn({ x, y, z: 0, vx: -p.vx * .002, vy: (Math.random() - .5) * .01, size: .06, size1: .12, life: 20, cell: 3, add: false, col: '#9a8f86', alpha: .6 });
    }
    for (const d of fight.drops) if (d.delay <= 0 && this.fxT % 2 === 0) F.spawn({ x: X3(d.x), y: Y(d.y), z: 0, size: .08, life: 12, cell: 2, col: d.col, rotv: .2 });
  }
  clearFX() { this.fx.clear(); for (const n of this.proj.values()) this.world.remove(n); for (const n of this.dropN.values()) { this.world.remove(n); this.world.remove(n.shadow); } this.proj.clear(); this.dropN.clear(); }
  // caméra de combat : suit les deux combattants, zoome sur les pouvoirs
  camFight(fight) {
    const a = fight.f1, b = fight.f2, x1 = X3(a.x), x2 = X3(b.x);
    const mid = clamp((x1 + x2) / 2, -2.6, 2.6), sep = Math.abs(x1 - x2);
    const dist = clamp(3.1 + sep * .78, 3.7, 7.6), hy = Math.max(-a.y, -b.y) / 100;
    let e = [mid * .9, 1.25 + dist * .05 + hy * .3, dist], t = [mid, .95 + hy * .35, 0], k = .12;
    if (fight.cine) { const f = fight.cine.f, fx = X3(f.x), hh = f.h / 100, fy = -f.y / 100; e = [fx + f.face * 1.4, fy + hh * .8, 2.6 + hh * .3]; t = [fx, fy + hh * .72, 0]; k = .25; }
    if (fight.phase === 'over' || (fight.phase === 'roundEnd' && fight.pt < 150 && fight.winner)) { const f = fight.winner, fx = X3(f.x), hh = f.h / 100; e = [fx + f.face * 1.6, .6 + hh * .6, 3]; t = [fx, hh * .6, 0]; k = .05; }
    this.moveCam(e, t, k, fight.shake);
    const g = fight.cine ? .5 : fight.slow > 0 ? .3 : 0; this.R.grade += (g - this.R.grade) * .2; this.R.tint = fight.cine ? [.55, .55, .75] : [.8, .82, .9];
  }
  camShow(x1, x2, orbit) {
    this.R.grade *= .8;
    const mid = (x1 + x2) / 2;
    const e = orbit != null ? [mid + Math.sin(orbit) * 5.5, 1.6, Math.cos(orbit) * 5.5 + 1] : [mid, 1.2, 5.2];
    this.moveCam(e, [mid, .85, 0], orbit != null ? 1 : .1, 0);
  }
  moveCam(e, t, k, shake) {
    for (let i = 0; i < 3; i++) { this.eye[i] += (e[i] - this.eye[i]) * k; this.tgt[i] += (t[i] - this.tgt[i]) * k; }
    const s = (shake || 0) * .006, ey = [this.eye[0] + (Math.random() - .5) * s, this.eye[1] + (Math.random() - .5) * s, this.eye[2]];
    this.cam.eye = ey; m4.lookAt(ey, this.tgt, [0, 1, 0], this.cam.view); m4.persp(34 * Math.PI / 180, 16 / 9, .1, 200, this.cam.proj);
  }
  render() {
    if (!this.stage) return;
    const e = this.stage.env, base = e.points || (e.point ? [e.point] : []), k = e.fill ?? .55;
    // lumière d'appoint côté caméra pour bien voir les visages
    const fill = { pos: [this.cam.eye[0] * .8, 2.1, Math.max(1.5, this.cam.eye[2] - 1)], col: [k, k * .93, k * .85], range: 11 };
    const pts = [...base.slice(0, 5), fill];
    if (this.flashLight > .02) { pts[4] = { pos: this.flashPos, col: [this.flashLight * 3, this.flashLight * 2.6, this.flashLight * 2.2], range: 9 }; this.flashLight *= .85; }
    this.fx.update();
    this.R.render(this.scene, this.cam, { ...e, points: pts }, R => this.fx.draw(R, this.cam.view));
  }
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
    h.translate(cx, cy); if (flip) h.scale(-1, 1); h.drawImage(rig.faceC, -r, -r, 2 * r, 2 * r);
    if (rig.kind === 'human' && rig.m.hair && !rig.photo) { h.fillStyle = rgbStr(rig.m.hair.color); h.beginPath(); h.ellipse(0, -r * .95, r * 1.1, r * .55, 0, 0, TAU); h.fill(); }
    h.restore();
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
    if (fight.cine) this.cutIn(fight);
    else this.hudBars(fight);
    this.center(fight);
    if (fight.flash > .02) { h.fillStyle = `rgba(255,255,255,${fight.flash})`; h.fillRect(0, 0, HW, HH); }
  }
  // bandeau de super pouvoir : visage du perso + nom du pouvoir
  cutIn(fight) {
    const h = this.h, c = fight.cine, k = 1 - c.t / c.max, f = c.f, side = f.side ? -1 : 1;
    const inA = Math.min(1, k / .18), outA = c.t < 6 ? c.t / 6 : 1, A = inA * outA;
    h.save(); h.globalAlpha = A;
    h.fillStyle = 'rgba(0,0,0,.55)'; h.fillRect(0, 0, HW, 70); h.fillRect(0, HH - 70, HW, 70);
    // lignes de vitesse
    h.strokeStyle = 'rgba(255,255,255,.18)'; h.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const y = 200 + ((i * 37 + fight.frame * 9) % 160); h.beginPath(); h.moveTo(0, y); h.lineTo(HW, y - 40 * side); h.stroke(); }
    // bande diagonale
    const slide = (1 - inA) * 600 * side;
    h.translate(slide, 0);
    h.beginPath(); h.moveTo(0, 210); h.lineTo(HW, 170); h.lineTo(HW, 340); h.lineTo(0, 380); h.closePath();
    const gr = h.createLinearGradient(0, 0, HW, 0); gr.addColorStop(0, f.side ? 'rgba(10,8,20,.92)' : '#b8471c'); gr.addColorStop(.45, 'rgba(10,8,20,.92)'); gr.addColorStop(1, f.side ? '#1c6ab8' : 'rgba(10,8,20,.92)');
    h.fillStyle = gr; h.fill(); h.strokeStyle = '#ffd23f'; h.lineWidth = 4; h.stroke();
    // visage
    const rig = this.models[f.side], px = f.side ? HW - 210 : 210;
    if (rig) { h.save(); h.beginPath(); h.ellipse(px, 275, 95, 115, 0, 0, TAU); h.clip(); h.fillStyle = rig.m.skin ? rgbStr(rig.m.skin.color) : '#888'; h.fillRect(px - 100, 155, 200, 240);
      h.drawImage(rig.faceC, px - 100, 160, 200, 230); if (rig.m.hair && !rig.photo) { h.fillStyle = rgbStr(rig.m.hair.color); h.beginPath(); h.ellipse(px, 160, 110, 60, 0, 0, TAU); h.fill(); } h.restore(); h.lineWidth = 5; h.strokeStyle = '#fff1dc'; h.beginPath(); h.ellipse(px, 275, 95, 115, 0, 0, TAU); h.stroke(); }
    const tx = f.side ? 360 : HW - 360;
    this.txt((f.c.name || '').toUpperCase(), tx, 228, 26, '#fff1dc', 'center', 6);
    const g2 = h.createLinearGradient(0, -30, 0, 30); g2.addColorStop(0, '#ffffff'); g2.addColorStop(.5, '#ffe58a'); g2.addColorStop(1, '#ff7a1e');
    h.save(); h.translate(tx, 290); h.transform(1, 0, -.18, 1, 0, 0); this.txt(c.name.toUpperCase(), 0, 0, c.name.length > 16 ? 40 : 50, g2, 'center', 10); h.restore();
    h.restore();
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
