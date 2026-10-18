// Modèles 3D low-poly des combattants (humains + duo de chats)
import { Node, geo, mat } from './gl.js';
import { cvs, drawFaceCanvas, realFace, realCatFace, cloth, hairTex, tabby } from './textures.js';
import { MV } from './data.js';

const GC = new Map();
const gg = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
const N = (g, m) => new Node(g, m);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const YAW = .45;

/* ------------------------------------------------------------------ Humains */
const BUILDS = { normal: { w: 1, hr: .115 }, big: { w: 1.15, d: 1.18, hr: .118 }, slim: { w: .9, hr: .108, fem: 1 }, kid: { w: .96, d: 1.05, hr: .132, kid: 1 } };
const TEX = {};
const texOf = (k, f) => TEX[k] || (TEX[k] = f());
const ell = (k, sx, sy, sz, m, seg = 14) => N(gg('ell' + seg, () => geo.sphere(1, seg, Math.round(seg * .75))), m).scl(sx, sy, sz);
function torsoProfile(fem, w, d) {
  const P = fem
    ? [[.6, 0, 0], [.585, .05, .065], [.56, .07, .13], [.52, .088, .162], [.46, .104, .158], [.4, .112, .15], [.32, .1, .135], [.22, .09, .125], [.12, .096, .14], [.02, .1, .15]]
    : [[.62, 0, 0], [.6, .055, .07], [.575, .075, .15], [.53, .095, .19], [.46, .108, .186], [.38, .11, .172], [.28, .1, .157], [.18, .095, .148], [.08, .1, .155], [.02, .1, .158]];
  return P.map(([y, x, z]) => [y, x * d, z * w]);
}
function pelvisProfile(fem, w, d) {
  const P = [[.12, .1, fem ? .148 : .156], [.03, .108, fem ? .168 : .162], [-.05, .102, fem ? .165 : .158], [-.11, .088, .132], [-.155, .052, .075], [-.168, 0, 0]];
  return P.map(([y, x, z]) => [y, x * d, z * w]);
}
export function buildHuman(def, c, img) {
  const B = BUILDS[def.build] || BUILDS.normal, w = B.w, d = B.d || 1, hr = B.hr, fem = !!B.fem;
  const top = def.top || 'tshirt', bottom = def.bottom || 'jeans', shortSleeve = top === 'tshirt', shorts = bottom === 'shorts';
  const m = {
    top: mat({ color: c.color, tex: texOf('c_' + top, () => cloth(top)), spec: .03 }), sleeve: mat({ color: c.color, tex: texOf('c_plain', () => cloth('plain')), spec: .03 }),
    bot: mat({ color: c.color2, tex: texOf('c_' + bottom, () => cloth(bottom === 'shorts' ? 'jogging' : bottom)), spec: .04 }),
    skin: mat({ color: c.skin, spec: .12, shin: 14 }), hair: mat({ color: c.hairCol, tex: texOf('hair', hairTex), double: true, spec: .25, shin: 40 }),
    shoe: mat({ color: def.build === 'big' ? '#1d1d22' : fem ? '#3a2a22' : '#dcd8cf', spec: .25, shin: 30 }), sole: mat({ color: '#efece6' }), belt: mat({ color: '#1a1512', spec: .3, shin: 30 }),
    phone: mat({ color: '#15121c', spec: .5, shin: 60 }), screen: mat({ color: '#e6f6ff', unlit: true }),
  };
  const faceC = cvs(256, 256);
  m.face = mat({ tex: faceC, transparent: true, depthWrite: true, spec: .1, shin: 14 });
  const redrawFace = () => drawFaceCanvas(faceC, img(c.photo, redrawFace), c, realFace(B.kid ? 'kid' : 'adult', fem));
  redrawFace();
  const root = new Node(), body = new Node(); root.add(body);
  const hips = new Node(); body.add(hips);
  hips.add(N(gg('pelvis' + w + d + fem, () => geo.lathe(pelvisProfile(fem, w, d), 18)), m.bot));
  if (bottom === 'jeans') hips.add(N(gg('belt' + w + d + fem, () => geo.lathe([[.135, .103 * d, (fem ? .15 : .158) * w], [.1, .105 * d, (fem ? .156 : .16) * w]], 18)), m.belt));
  const torso = new Node(); hips.add(torso);
  torso.add(N(gg('torso' + w + d + fem, () => geo.lathe(torsoProfile(fem, w, d), 20)), m.top));
  if (top === 'hoodie') { torso.add(ell(0, .07, .06, .13 * w, m.sleeve).at(-.075 * d, .58, 0)); torso.add(ell(0, .03, .05, .09 * w, m.sleeve).at(.045 * d, .59, 0)); }
  if (top === 'jacket') torso.add(N(gg('collar' + w, () => geo.lathe([[.66, .06, .07], [.62, .075, .095], [.58, .085, .13 * w]], 16)), m.sleeve));
  torso.add(N(gg('neck', () => geo.limb(.11, .05, .056, 12)), m.skin).at(0, .7, 0));
  const head = new Node().at(0, .66 + hr * 1.12, 0); torso.add(head);
  const hs = new Node().scl(.9, 1.12, .93); head.add(hs);
  hs.add(N(gg('skull' + hr, () => geo.sphere(hr, 24, 18)), m.skin));
  hs.add(N(gg('face2' + hr, () => geo.sphere(hr * 1.012, 24, 18, Math.PI - 1.25, 2.5, .38, 1.95)), m.face));
  hs.add(ell(0, hr * .62, hr * .42, hr * .7, m.skin).at(hr * .32, -hr * .62, 0));
  for (const z of [-1, 1]) hs.add(ell(0, .016, .03, .012, m.skin, 10).at(-.012, -.005, z * hr * .98));
  let tail = null;
  const cap = (k, th, tilt) => N(gg('capR' + hr + k + th, () => geo.sphere(hr * k, 24, 12, 0, Math.PI * 2, 0, th)), m.hair).rot(0, 0, tilt);
  if (def.hair === 'buzz') hs.add(cap(1.025, 1.3, .5));
  else if (def.hair === 'short') { hs.add(cap(1.06, 1.2, .55)); hs.add(ell(0, hr * .95, hr * .45, hr * 1.0, m.hair, 18).at(-.008, hr * .52, 0)); }
  else if (def.hair === 'kid') { hs.add(cap(1.07, 1.28, .42)); hs.add(ell(0, hr * .98, hr * .5, hr * 1.02, m.hair, 18).at(.005, hr * .5, 0)); }
  else if (def.hair === 'long') {
    hs.add(cap(1.07, 1.3, .38));
    hs.add(N(gg('drapeR' + hr, () => geo.lathe([[hr * .4, hr * 1.02, hr * 1.06], [-hr * .4, hr * 1.06, hr * 1.12], [-hr * 1.4, hr * .9, hr * 1.15], [-hr * 2.6, hr * .7, hr * 1.18], [-hr * 2.75, hr * .5, hr * 1.0]], 18)), m.hair).at(-hr * .32, 0, 0).scl(.85, 1, 1));
  } else if (def.hair === 'ponytail') {
    hs.add(cap(1.05, 1.32, .45));
    hs.add(ell(0, .03, .03, .03, m.hair, 10).at(-hr * .98, hr * .32, 0));
    tail = new Node().at(-hr * 1.04, hr * .32, 0); hs.add(tail);
    tail.add(N(gg('ponyR' + hr, () => geo.limb(hr * 2.6, hr * .3, hr * .12, 10)), m.hair));
  }
  const sw = fem ? .88 : 1;
  const arm = z => {
    const sh = new Node().at(0, .52, z * .185 * w * sw); torso.add(sh);
    const ur = .052 * w, er = .043 * w, wr = .033 * w;
    sh.add(N(gg('upA' + w, () => geo.limb(.29, ur, er, 14)), shortSleeve ? m.skin : m.sleeve));
    if (shortSleeve) sh.add(N(gg('slv' + w, () => geo.limb(.15, ur * 1.18, ur * 1.1, 14)), m.top));
    const el = new Node().at(0, -.29, 0); sh.add(el);
    el.add(N(gg('foreA' + w, () => geo.limb(.27, er, wr, 14)), shortSleeve ? m.skin : m.sleeve));
    if (!shortSleeve) el.add(N(gg('cuff' + w, () => geo.lathe([[-.22, wr * 1.2, wr * 1.25], [-.26, wr * 1.15, wr * 1.2]], 12)), m.sleeve));
    const hand = new Node().at(0, -.28, 0); el.add(hand);
    hand.add(ell(0, .028, .048, .04, m.skin).at(0, -.035, 0));
    hand.add(ell(0, .026, .04, .038, m.skin).at(.012, -.082, 0).rot(0, 0, .35));
    hand.add(ell(0, .017, .03, .016, m.skin, 10).at(.02, -.035, .032).rot(.4, 0, .2));
    return { sh, el, hand };
  };
  const leg = z => {
    const hp = new Node().at(0, -.06, z * .09 * w); hips.add(hp);
    const tr = .086 * w, kr = .062 * w, ar = .045 * w;
    hp.add(N(gg('thighL' + w, () => geo.limb(.43, tr, kr, 14)), m.bot));
    const kn = new Node().at(0, -.43, 0); hp.add(kn);
    kn.add(N(gg('shinL' + w, () => geo.limb(.42, kr, ar, 14)), shorts ? m.skin : m.bot));
    const ft = new Node().at(0, -.42, 0); kn.add(ft);
    ft.add(ell(0, .125, .052, .055, m.shoe, 16).at(.05, -.04, 0));
    ft.add(ell(0, .135, .022, .06, m.sole, 16).at(.052, -.08, 0));
    if (!shorts) ft.add(N(gg('ankle' + w, () => geo.lathe([[.03, ar * 1.2, ar * 1.25], [-.02, ar * 1.25, ar * 1.3]], 12)), m.bot));
    return { hp, kn, ft };
  };
  const aB = arm(-1), lB = leg(-1), lF = leg(1), aF = arm(1);
  const phone = new Node().at(.045, -.33, 0); aF.el.add(phone); phone.visible = false;
  phone.add(N(gg('phone', () => geo.box(.022, .15, .075)), m.phone));
  phone.add(N(gg('screen', () => geo.box(.026, .125, .06)), m.screen).at(.003, 0, 0));
  body.scl(def.scale);
  return { kind: 'human', root, body, hips, torso, head, aF, aB, lF, lB, tail, phone, m, faceC, redrawFace, hr, scale: def.scale };
}

export function poseHuman(rig, p, f) {
  rig.torso.r[2] = -p.lean;
  rig.aF.sh.r[2] = p.fa1 + p.lean; rig.aF.el.r[2] = p.fa2 - p.fa1;
  rig.aB.sh.r[2] = p.ba1 + p.lean; rig.aB.el.r[2] = p.ba2 - p.ba1;
  rig.lF.hp.r[2] = p.fl1; rig.lF.kn.r[2] = p.fl2 - p.fl1; rig.lF.ft.r[2] = -p.fl2;
  rig.lB.hp.r[2] = p.bl1; rig.lB.kn.r[2] = p.bl2 - p.bl1; rig.lB.ft.r[2] = -p.bl2;
  rig.head.r[2] = p.lean * .55; rig.head.r[1] = -.45;
  rig.aF.sh.r[0] = -.12; rig.aB.sh.r[0] = .12;
  if (rig.tail) rig.tail.r[2] = -.5 + Math.sin(f.t * .12) * .15 - (f.vx || 0) * f.face * .03;
  rig.phone.visible = f.move === 'selfie';
}

// point le plus bas du corps sous la hanche (unités de jeu), pour poser les pieds au sol
export function lowPoint(p, hr, ko) {
  const pt = (o, a, l) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l];
  const hip = [0, 0], fk = pt(hip, p.fl1, 42), ff = pt(fk, p.fl2, 42), bk = pt(hip, p.bl1, 42), bf = pt(bk, p.bl2, 42);
  let low = Math.max(ff[1], bf[1]) + 10;
  if (ko) {
    const neck = [Math.sin(p.lean) * 56, -Math.cos(p.lean) * 56], sh = neck;
    const fe = pt(sh, p.fa1, 30), fh = pt(fe, p.fa2, 29), be = pt(sh, p.ba1, 30), bh = pt(be, p.ba2, 29);
    const hd = (66 + hr * 112), head = [Math.sin(p.lean) * hd, -Math.cos(p.lean) * hd];
    low = Math.max(low, fh[1], bh[1], fk[1], bk[1], head[1] + hr * 115, 12);
  }
  return low;
}

/* ------------------------------------------------------------------ Chats */
function buildCat(col, faceC, fat) {
  const m = { fur: mat({ color: col, tex: texOf(fat ? 'tabby' : 'plainfur', () => tabby(fat)) }), belly: mat({ color: '#efe7da', tex: texOf('plainfur', () => tabby(false)) }),
    face: mat({ tex: faceC, transparent: true, depthWrite: true }) };
  const g = new Node(), fz = fat ? 1.3 : 1;
  const body = N(gg('catBody' + fat, () => geo.sphere(.17, 20, 14)), m.fur).at(0, .28, 0).scl(1.75, fat ? .92 : .8, .72 * fz); g.add(body);
  g.add(N(gg('catChest', () => geo.sphere(.1, 14, 10)), m.belly).at(.21, .29, 0).scl(1, 1.05, .9 * (fat ? 1.1 : 1)));
  for (const z of [-1, 1]) g.add(N(gg('haunch' + fat, () => geo.sphere(.085 * (fat ? 1.15 : 1), 8, 6)), m.fur).at(-.19, .27, z * .055 * fz));
  const head = new Node().at(.33, .43, 0); g.add(head);
  head.add(N(gg('catSkull', () => geo.sphere(.095, 20, 14)), m.fur).scl(1.05, .92, 1.08));
  head.add(N(gg('muzzle', () => geo.sphere(.045, 8, 6)), m.belly).at(.072, -.035, 0).scl(1, .8, 1.2));
  head.add(N(gg('catFace', () => geo.sphere(.1, 20, 14, Math.PI - 1.0, 2.0, Math.PI / 2 - .85, 1.7)), m.face).scl(1.05, .92, 1.08));
  for (const z of [-1, 1]) head.add(N(gg('catEar', () => geo.cyl(0, .042, .08, 3)), m.fur).at(-.015, .085, z * .052).rot(z * .25, z * .5, .1));
  const legs = [];
  for (const [x, z] of [[.19, .065], [.19, -.065], [-.19, .065], [-.19, -.065]]) {
    const lp = new Node().at(x, .24, z * fz); g.add(lp);
    lp.add(N(gg('catLeg', () => geo.limb(.23, .026, .021, 10)), m.fur));
    lp.add(N(gg('catPaw', () => geo.sphere(.03, 6, 5)), m.belly).at(.008, -.232, 0).scl(1.3, .8, 1));
    legs.push(lp);
  }
  const tail = []; let prev = g;
  for (let i = 0; i < 5; i++) {
    const t = new Node().at(i ? 0 : -.29, i ? -.085 : .31, 0); prev.add(t);
    t.add(N(gg('catTail', () => geo.limb(.085, .022, .018, 10)), m.fur)); tail.push(t); prev = t;
  }
  return { g, body, head, legs, tail, m, o: { x: 0, y: 0, pitch: 0, roll: 0 } };
}
export function buildCats(def, c, img) {
  const fA = cvs(256, 256), fB = cvs(256, 256);
  const redrawFace = () => {
    drawFaceCanvas(fA, img(c.photo, redrawFace), { zoom: c.zoom, ox: c.ox, oy: c.oy }, realCatFace('#c9a43a'));
    drawFaceCanvas(fB, img(c.photo2, redrawFace), { zoom: c.zoom2, ox: c.ox2, oy: c.oy2 }, realCatFace('#9ccf4f'));
  };
  redrawFace();
  const root = new Node(), body = new Node(); root.add(body);
  const A = buildCat(c.color, fA, true), Bc = buildCat(c.color2, fB, false);
  A.base = [.16, 0, .2]; Bc.base = [-.4, 0, -.2];
  A.g.scl(1.15); Bc.g.scl(.85); // Bouftiko est le plus gros, Poutine le plus petit
  body.add(Bc.g, A.g);
  return { kind: 'cats', root, body, cats: [A, Bc], redrawFace, scale: 1, m: { a: A.m, b: Bc.m }, faceC: fA, faceC2: fB };
}
const lerp = (a, b, k) => a + (b - a) * k;
export function animateCats(rig, f) {
  const t = f.t, mv = f.move ? MV[f.move] : null, ph = mv ? clamp(f.mt / (mv.s + mv.a), 0, 1) : 0;
  const act = mv && f.mt >= mv.s && f.mt < mv.s + mv.a;
  rig.cats.forEach((c, i) => {
    const T = { x: 0, y: 0, pitch: 0, roll: 0, legA: 0, legB: 0, swipe: 0, head: 0, tail: 0, sit: 0 };
    const walkPh = t * .38 + i * 1.3;
    if (f.state === 'ko') { T.roll = Math.PI / 2 * (i ? -1 : 1) * .95; T.y = -.08; T.x = i ? -.1 : .1; }
    else if (f.state === 'win') { T.sit = 1; T.tail = 1; }
    else if (f.stun > 0 && !f.blockstun) { T.pitch = -.35; T.x = -.12; T.head = .3; }
    else if (f.frozen > 0) { }
    else if (mv) {
      const name = f.move;
      if (['punch', 'cpunch', 'apunch'].includes(name)) { if (i === 0) { T.x = Math.sin(ph * Math.PI) * .35; T.swipe = act ? 1 : 0; T.pitch = .15; } }
      else if (['kick', 'ckick', 'akick'].includes(name)) { if (i === 1) { T.x = Math.sin(ph * Math.PI) * .95; T.y = Math.sin(ph * Math.PI) * (name === 'ckick' ? .05 : .38); T.pitch = .3; T.legA = 1.1; T.legB = -1.1; } }
      else if (name === 'fire') { if (i === 0) { T.head = f.mt < mv.s ? .5 : -.4; T.pitch = f.mt < mv.s ? .2 : -.1; } }
      else if (name === 'griffes' || name === 'charge' || name === 'tornade') {
        const k = Math.sin(f.mt * .55 + i * Math.PI);
        T.x = act ? .25 + k * .35 : 0; T.swipe = act && k > .3 ? 1 : 0; T.pitch = .2; T.legA = Math.sin(walkPh * 1.6) * .8; T.legB = -T.legA;
      }
      else if (name === 'dragon') { if (i === 0) { T.y = act ? Math.sin(ph * Math.PI) * .5 : 0; T.pitch = .9; T.swipe = 1; } }
      else { T.sit = 1; T.head = -.2; }
    }
    else if (!f.onGround) { T.legA = 1.0; T.legB = -1.0; T.pitch = f.vy < 0 ? .25 : -.2; }
    else if (f.guarding) { T.pitch = -.12; T.tail = 1; T.head = .25; T.y = .03; }
    else if (f.state === 'crouch') { T.y = -.08; T.head = .15; }
    else if (f.state === 'walk') { T.legA = Math.sin(walkPh) * .7; T.legB = -T.legA; T.y = Math.abs(Math.sin(walkPh)) * .03; }
    const o = c.o, k = .35;
    for (const key of ['x', 'y', 'pitch', 'roll']) o[key] = lerp(o[key] || 0, T[key], k);
    o.sit = lerp(o.sit || 0, T.sit, .2); o.head = lerp(o.head || 0, T.head, .3); o.tail = lerp(o.tail || 0, T.tail, .2);
    c.g.p[0] = c.base[0] + o.x; c.g.p[1] = c.base[1] + o.y + o.sit * .05; c.g.p[2] = c.base[2];
    c.g.r[2] = o.pitch + o.sit * .55; c.g.r[0] = o.roll;
    const breathe = 1 + Math.sin(t * .08 + i) * .02; c.body.s[1] = .9 * breathe;
    c.legs[0].r[2] = T.swipe ? 1.7 : T.legA; c.legs[1].r[2] = -T.legA * .9 + (T.swipe ? .3 : 0);
    c.legs[2].r[2] = T.legB - o.sit * 1.2; c.legs[3].r[2] = -T.legB - o.sit * 1.2;
    c.head.r[2] = o.head - o.sit * .45; c.head.r[1] = -.55;
    c.tail[0].r[2] = -2.2 + o.tail * 1.6 + Math.sin(t * .09 + i * 2) * .25;
    for (let k = 1; k < c.tail.length; k++) c.tail[k].r[2] = .28 + Math.sin(t * (.1 + k * .015) + i * 2 + k) * .22 - o.tail * .18;
  });
}
