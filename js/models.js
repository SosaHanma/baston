// Modèles 3D low-poly des combattants (humains + duo de chats)
import { Node, geo, mat } from './gl.js';
import { cvs, drawFaceCanvas, cartoonHuman, cartoonCat } from './textures.js';
import { MV } from './data.js';

const GC = new Map();
const gg = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
const N = (g, m) => new Node(g, m);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const BUILDS = { normal: { w: 1, hr: .2 }, big: { w: 1.2, hr: .2 }, slim: { w: .88, hr: .19 }, kid: { w: 1, hr: .25, kid: true } };
export const YAW = .45;

/* ------------------------------------------------------------------ Humains */
export function buildHuman(def, c, img) {
  const B = BUILDS[def.build] || BUILDS.normal, w = B.w, hr = B.hr;
  const m = {
    shirt: mat({ color: c.color }), pants: mat({ color: c.color2 }), skin: mat({ color: c.skin }), shoe: mat({ color: '#1a1622' }),
    hair: mat({ color: c.hairCol, double: true }), belt: mat({ color: '#141018' }), phone: mat({ color: '#15121c' }), screen: mat({ color: '#e6f6ff', unlit: true }),
  };
  const faceC = cvs(128, 128);
  m.face = mat({ tex: faceC, transparent: true, depthWrite: true });
  const redrawFace = () => drawFaceCanvas(faceC, img(c.photo, redrawFace), c, cartoonHuman(B.kid ? 'kid' : 'adult'));
  redrawFace();

  const root = new Node(), body = new Node(); root.add(body);
  const hips = new Node(); body.add(hips);
  hips.add(N(gg('pel' + w, () => geo.cyl(.15 * w, .14 * w, .17, 8)), m.pants).scl(1, 1, .75));
  hips.add(N(gg('belt' + w, () => geo.cyl(.155 * w, .155 * w, .05, 8)), m.belt).at(0, .07, 0).scl(1, 1, .76));
  const torso = new Node(); hips.add(torso);
  torso.add(N(gg('chest' + w, () => geo.cyl(.19 * w, .145 * w, .48, 8)), m.shirt).at(0, .32, 0).scl(1, 1, .62));
  torso.add(N(gg('neck', () => geo.cyl(.05, .06, .12, 6)), m.skin).at(0, .58, 0));
  const head = new Node().at(0, .6 + hr * .9, 0); torso.add(head);
  head.add(N(gg('skull' + hr, () => geo.sphere(hr, 12, 10)), m.skin));
  head.add(N(gg('face' + hr, () => geo.sphere(hr * 1.03, 12, 10, Math.PI - 1.0, 2.0, Math.PI / 2 - .95, 1.9)), m.face));
  for (const z of [-1, 1]) head.add(N(gg('ear', () => geo.sphere(.045, 6, 5)), m.skin).at(-.02, -.01, z * hr * .97).scl(.6, 1, .5));
  let tail = null;
  const cap = () => N(gg('cap' + hr, () => geo.sphere(hr * 1.08, 12, 8, 0, Math.PI * 2, 0, 1.35)), m.hair).rot(0, 0, .5);
  if (def.hair === 'short' || def.hair === 'messy') {
    head.add(cap());
    if (def.hair === 'messy') for (let i = 0; i < 7; i++) {
      const a = -1.4 + i * .45, sp = N(gg('spike', () => geo.cyl(0, .05, .13, 5)), m.hair);
      sp.at(Math.sin(a) * hr * .85 - .04, Math.cos(a) * hr * .85 + .02, (i % 2 ? .06 : -.06)).rot(0, 0, -a * .9); head.add(sp);
    }
  } else if (def.hair === 'long') {
    head.add(cap());
    head.add(N(gg('drape' + hr, () => geo.cyl(hr * 1.06, hr * 1.3, hr * 2.4, 10, true, Math.PI, Math.PI)), m.hair).at(-.01, -hr * .65, 0));
  } else if (def.hair === 'ponytail') {
    head.add(cap());
    head.add(N(gg('tie', () => geo.sphere(.05, 6, 5)), m.hair).at(-hr * .98, hr * .25, 0));
    tail = new Node().at(-hr * 1.05, hr * .25, 0); head.add(tail);
    tail.add(N(gg('pony', () => geo.cyl(.06, .025, .42, 6)), m.hair).at(0, -.2, 0));
  }
  const arm = z => {
    const sh = new Node().at(0, .5, z * .21 * w); torso.add(sh);
    sh.add(N(gg('sh' + w, () => geo.sphere(.07 * w, 7, 6)), m.shirt));
    sh.add(N(gg('up' + w, () => geo.cyl(.058 * w, .05 * w, .3, 7)), m.shirt).at(0, -.15, 0));
    const el = new Node().at(0, -.3, 0); sh.add(el);
    el.add(N(gg('elb' + w, () => geo.sphere(.05 * w, 6, 5)), m.skin));
    el.add(N(gg('fore' + w, () => geo.cyl(.047 * w, .04 * w, .29, 7)), m.skin).at(0, -.145, 0));
    const hand = N(gg('hand' + w, () => geo.sphere(.068 * w, 7, 6)), m.skin).at(0, -.31, 0); el.add(hand);
    return { sh, el, hand };
  };
  const leg = z => {
    const hp = new Node().at(0, 0, z * .09 * w); hips.add(hp);
    hp.add(N(gg('thigh' + w, () => geo.cyl(.085 * w, .068 * w, .42, 7)), m.pants).at(0, -.21, 0));
    const kn = new Node().at(0, -.42, 0); hp.add(kn);
    kn.add(N(gg('knee' + w, () => geo.sphere(.066 * w, 6, 5)), m.pants));
    kn.add(N(gg('shin' + w, () => geo.cyl(.066 * w, .052 * w, .42, 7)), m.pants).at(0, -.21, 0));
    const ft = new Node().at(0, -.42, 0); kn.add(ft);
    ft.add(N(gg('shoe', () => geo.box(.23, .09, .12)), m.shoe).at(.05, -.03, 0));
    return { hp, kn, ft };
  };
  const aB = arm(-1), lB = leg(-1), lF = leg(1), aF = arm(1);
  const phone = new Node().at(.04, -.36, 0); aF.el.add(phone); phone.visible = false;
  phone.add(N(gg('phone', () => geo.box(.03, .16, .09)), m.phone));
  phone.add(N(gg('screen', () => geo.box(.035, .13, .07)), m.screen).at(.004, 0, 0));
  body.scl(def.scale);
  return { kind: 'human', root, body, hips, torso, head, aF, aB, lF, lB, tail, phone, m, faceC, redrawFace, hr, scale: def.scale };
}

export function poseHuman(rig, p, f) {
  rig.torso.r[2] = -p.lean;
  rig.aF.sh.r[2] = p.fa1 + p.lean; rig.aF.el.r[2] = p.fa2 - p.fa1;
  rig.aB.sh.r[2] = p.ba1 + p.lean; rig.aB.el.r[2] = p.ba2 - p.ba1;
  rig.lF.hp.r[2] = p.fl1; rig.lF.kn.r[2] = p.fl2 - p.fl1; rig.lF.ft.r[2] = -p.fl2;
  rig.lB.hp.r[2] = p.bl1; rig.lB.kn.r[2] = p.bl2 - p.bl1; rig.lB.ft.r[2] = -p.bl2;
  rig.head.r[2] = p.lean * .55; rig.head.r[1] = -.4;
  rig.aF.sh.r[0] = -.12; rig.aB.sh.r[0] = .12;
  if (rig.tail) rig.tail.r[2] = -.5 + Math.sin(f.t * .12) * .15 - (f.vx || 0) * f.face * .03;
  rig.phone.visible = f.move === 'selfie';
}

// point le plus bas du corps sous la hanche (unités de jeu), pour poser les pieds au sol
export function lowPoint(p, hr, ko) {
  const pt = (o, a, l) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l];
  const hip = [0, 0], fk = pt(hip, p.fl1, 42), ff = pt(fk, p.fl2, 42), bk = pt(hip, p.bl1, 42), bf = pt(bk, p.bl2, 42);
  let low = Math.max(ff[1], bf[1]) + 4;
  if (ko) {
    const neck = [Math.sin(p.lean) * 56, -Math.cos(p.lean) * 56], sh = neck;
    const fe = pt(sh, p.fa1, 30), fh = pt(fe, p.fa2, 29), be = pt(sh, p.ba1, 30), bh = pt(be, p.ba2, 29);
    const hd = (60 + hr * 90), head = [Math.sin(p.lean) * hd, -Math.cos(p.lean) * hd];
    low = Math.max(low, fh[1], bh[1], fk[1], bk[1], head[1] + hr * 100, 14);
  }
  return low;
}

/* ------------------------------------------------------------------ Chats */
function buildCat(col, faceC) {
  const m = { fur: mat({ color: col }), belly: mat({ color: '#f6efe4' }), face: mat({ tex: faceC, transparent: true, depthWrite: true }), nose: mat({ color: '#f29bb0' }) };
  const g = new Node();
  const body = N(gg('catBody', () => geo.sphere(.2, 10, 8)), m.fur).at(0, .3, 0).scl(1.6, .9, .82); g.add(body);
  g.add(N(gg('catChest', () => geo.sphere(.13, 8, 6)), m.belly).at(.22, .3, 0).scl(1, 1, .9));
  const head = new Node().at(.36, .48, 0); g.add(head);
  head.add(N(gg('catSkull', () => geo.sphere(.15, 10, 8)), m.fur));
  head.add(N(gg('catFace', () => geo.sphere(.155, 10, 8, Math.PI - 1.0, 2.0, Math.PI / 2 - .9, 1.8)), m.face));
  for (const z of [-1, 1]) head.add(N(gg('catEar', () => geo.cyl(0, .055, .11, 4)), m.fur).at(-.02, .13, z * .075).rot(z * .3, 0, .1));
  const legs = [];
  for (const [x, z] of [[.2, .09], [.2, -.09], [-.2, .09], [-.2, -.09]]) {
    const lp = new Node().at(x, .27, z); g.add(lp);
    lp.add(N(gg('catLeg', () => geo.cyl(.036, .03, .24, 6)), m.fur).at(0, -.12, 0));
    lp.add(N(gg('catPaw', () => geo.sphere(.042, 6, 5)), m.belly).at(.01, -.25, 0));
    legs.push(lp);
  }
  const tail = []; let prev = g;
  for (let i = 0; i < 3; i++) {
    const t = new Node().at(i ? 0 : -.3, i ? -.14 : .36, 0); prev.add(t);
    t.add(N(gg('catTail', () => geo.cyl(.03, .024, .15, 6)), m.fur).at(0, -.07, 0)); tail.push(t); prev = t;
  }
  return { g, body, head, legs, tail, m, o: { x: 0, y: 0, pitch: 0, roll: 0 } };
}
export function buildCats(def, c, img) {
  const fA = cvs(128, 128), fB = cvs(128, 128);
  const redrawFace = () => {
    drawFaceCanvas(fA, img(c.photo, redrawFace), { zoom: c.zoom, ox: c.ox, oy: c.oy }, cartoonCat('#7ed957'));
    drawFaceCanvas(fB, img(c.photo2, redrawFace), { zoom: c.zoom2, ox: c.ox2, oy: c.oy2 }, cartoonCat('#f2c94c'));
  };
  redrawFace();
  const root = new Node(), body = new Node(); root.add(body);
  const A = buildCat(c.color, fA), Bc = buildCat(c.color2, fB);
  A.base = [.16, 0, .2]; Bc.base = [-.4, 0, -.2];
  A.g.scl(1.14); Bc.g.scl(.82); // Bouftiko est le plus gros, Poutine le plus petit
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
    c.tail[1].r[2] = .4 + Math.sin(t * .11 + i) * .3 - o.tail * .3; c.tail[2].r[2] = .3 + Math.sin(t * .13 + i * 3) * .3;
  });
}
