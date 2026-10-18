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
const BUILDS = { normal: { w: 1, hr: .118 }, big: { w: 1.17, hr: .122 }, slim: { w: .9, hr: .112, fem: 1 }, kid: { w: .96, hr: .138, kid: 1 } };
const TEX = {};
const texOf = (k, f) => TEX[k] || (TEX[k] = f());
export function buildHuman(def, c, img) {
  const B = BUILDS[def.build] || BUILDS.normal, w = B.w, hr = B.hr, fem = !!B.fem;
  const top = def.top || 'tshirt', bottom = def.bottom || 'jeans', shortSleeve = top === 'tshirt', shorts = bottom === 'shorts';
  const m = {
    top: mat({ color: c.color, tex: texOf('c_' + top, () => cloth(top)) }), sleeve: mat({ color: c.color, tex: texOf('c_plain', () => cloth('plain')) }),
    bot: mat({ color: c.color2, tex: texOf('c_' + bottom, () => cloth(bottom === 'shorts' ? 'jogging' : bottom)) }),
    skin: mat({ color: c.skin }), hair: mat({ color: c.hairCol, tex: texOf('hair', hairTex), double: true }),
    shoe: mat({ color: def.build === 'big' ? '#1d1d22' : fem ? '#3a2a22' : '#dcd8cf' }), sole: mat({ color: '#efece6' }), belt: mat({ color: '#1a1512' }),
    phone: mat({ color: '#15121c' }), screen: mat({ color: '#e6f6ff', unlit: true }),
  };
  const faceC = cvs(128, 128);
  m.face = mat({ tex: faceC, transparent: true, depthWrite: true });
  const redrawFace = () => drawFaceCanvas(faceC, img(c.photo, redrawFace), c, realFace(B.kid ? 'kid' : 'adult', fem));
  redrawFace();
  const sw = fem ? .9 : 1;
  const root = new Node(), body = new Node(); root.add(body);
  const hips = new Node(); body.add(hips);
  hips.add(N(gg('pel' + w, () => geo.cyl(.155 * w, .15 * w, .2, 10)), m.bot).at(0, .03, 0).scl(1, 1, .62));
  if (bottom === 'jeans') hips.add(N(gg('belt' + w, () => geo.cyl(.158 * w, .158 * w, .035, 10)), m.belt).at(0, .12, 0).scl(1, 1, .63));
  const torso = new Node(); hips.add(torso);
  torso.add(N(gg('abd' + w + sw, () => geo.cyl(.142 * w * (fem ? .92 : 1), .152 * w, .22, 10)), m.top).at(0, .15, 0).scl(1, 1, .6));
  torso.add(N(gg('chest' + w + sw, () => geo.cyl(.178 * w * sw, .142 * w * (fem ? .92 : 1), .3, 10)), m.top).at(0, .39, 0).scl(1, 1, .6));
  for (const z of [-1, 1]) torso.add(N(gg('shb' + w, () => geo.sphere(.064 * w, 8, 6)), m.sleeve).at(0, .5, z * .165 * w * sw));
  if (top === 'hoodie') torso.add(N(gg('hood', () => geo.sphere(.115, 8, 6)), m.sleeve).at(-.075, .55, 0).scl(.9, .55, 1.25));
  if (top === 'jacket') torso.add(N(gg('collar', () => geo.cyl(.075, .1, .07, 8)), m.sleeve).at(0, .56, 0).scl(1, 1, .8));
  torso.add(N(gg('neck', () => geo.cyl(.045, .053, .12, 8)), m.skin).at(0, .6, 0));
  const head = new Node().at(0, .64 + hr * 1.08, 0); torso.add(head);
  const hs = new Node().scl(.93, 1.17, .95); head.add(hs);
  hs.add(N(gg('skull' + hr, () => geo.sphere(hr, 14, 10)), m.skin));
  hs.add(N(gg('face' + hr, () => geo.sphere(hr * 1.025, 14, 10, Math.PI - 1.0, 2.0, Math.PI / 2 - .95, 1.9)), m.face));
  for (const z of [-1, 1]) hs.add(N(gg('ear', () => geo.sphere(.03, 6, 5)), m.skin).at(-.012, -.005, z * hr * .97).scl(.55, 1, .45));
  let tail = null;
  const cap = (k, th, tilt) => N(gg('cap' + hr + k, () => geo.sphere(hr * k, 14, 8, 0, Math.PI * 2, 0, th)), m.hair).rot(0, 0, tilt);
  if (def.hair === 'buzz') hs.add(cap(1.03, 1.35, .5));
  else if (def.hair === 'short') { hs.add(cap(1.08, 1.25, .55)); hs.add(N(gg('vol' + hr, () => geo.sphere(hr * .85, 10, 6)), m.hair).at(-.01, hr * .45, 0).scl(1.05, .55, 1.08)); }
  else if (def.hair === 'kid') {
    hs.add(cap(1.09, 1.3, .45));
    for (let i = 0; i < 6; i++) { const a = -1.2 + i * .45, sp = N(gg('kspike', () => geo.cyl(0, .03, .07, 5)), m.hair); sp.at(Math.sin(a) * hr * .9 - .01, Math.cos(a) * hr * .9 + .01, (i % 2 ? .03 : -.03)).rot(0, 0, -a * .9); hs.add(sp); }
  } else if (def.hair === 'long') {
    hs.add(cap(1.08, 1.3, .4));
    hs.add(N(gg('drape' + hr, () => geo.cyl(hr * 1.06, hr * 1.3, hr * 3.4, 12, true, Math.PI * .92, Math.PI * 1.16)), m.hair).at(-.005, -hr * 1.3, 0));
    for (const z of [-1, 1]) hs.add(N(gg('lock' + hr, () => geo.box(hr * .35, hr * 2.3, hr * .3)), m.hair).at(hr * .25, -hr * .6, z * hr * .95));
  } else if (def.hair === 'ponytail') {
    hs.add(cap(1.07, 1.35, .45));
    hs.add(N(gg('tie', () => geo.sphere(.035, 6, 5)), m.hair).at(-hr * .98, hr * .3, 0));
    tail = new Node().at(-hr * 1.05, hr * .3, 0); hs.add(tail);
    tail.add(N(gg('pony' + hr, () => geo.cyl(hr * .38, hr * .12, hr * 3, 6)), m.hair).at(0, -hr * 1.5, 0));
  }
  const arm = z => {
    const sh = new Node().at(0, .5, z * .18 * w * sw); torso.add(sh);
    sh.add(N(gg('up' + w, () => geo.cyl(.05 * w, .044 * w, .29, 8)), m.sleeve).at(0, -.145, 0));
    const el = new Node().at(0, -.29, 0); sh.add(el);
    const lower = shortSleeve ? m.skin : m.sleeve;
    el.add(N(gg('elb' + w, () => geo.sphere(.044 * w, 6, 5)), lower));
    el.add(N(gg('fore' + w, () => geo.cyl(.043 * w, .034 * w, .27, 8)), lower).at(0, -.135, 0));
    const hand = new Node().at(0, -.28, 0); el.add(hand);
    hand.add(N(gg('palm', () => geo.box(.04, .09, .075)), m.skin).at(0, -.03, 0));
    hand.add(N(gg('fing', () => geo.box(.045, .055, .072)), m.skin).at(.012, -.085, 0).rot(0, 0, .35));
    hand.add(N(gg('thumb', () => geo.box(.025, .05, .025)), m.skin).at(.025, -.03, .035));
    return { sh, el, hand };
  };
  const leg = z => {
    const hp = new Node().at(0, -.04, z * .088 * w); hips.add(hp);
    hp.add(N(gg('thigh' + w, () => geo.cyl(.085 * w, .064 * w, .43, 8)), m.bot).at(0, -.215, 0));
    const kn = new Node().at(0, -.43, 0); hp.add(kn);
    const lo = shorts ? m.skin : m.bot;
    kn.add(N(gg('knee' + w, () => geo.sphere(.06 * w, 6, 5)), lo));
    kn.add(N(gg('shin' + w, () => geo.cyl(.06 * w, .046 * w, .42, 8)), lo).at(0, -.21, 0));
    const ft = new Node().at(0, -.42, 0); kn.add(ft);
    ft.add(N(gg('shoeU', () => geo.box(.24, .085, .1)), m.shoe).at(.045, -.035, 0));
    ft.add(N(gg('sole', () => geo.box(.26, .03, .108)), m.sole).at(.05, -.08, 0));
    return { hp, kn, ft };
  };
  const aB = arm(-1), lB = leg(-1), lF = leg(1), aF = arm(1);
  const phone = new Node().at(.04, -.33, 0); aF.el.add(phone); phone.visible = false;
  phone.add(N(gg('phone', () => geo.box(.025, .15, .075)), m.phone));
  phone.add(N(gg('screen', () => geo.box(.03, .125, .06)), m.screen).at(.004, 0, 0));
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
  let low = Math.max(ff[1], bf[1]) + 9;
  if (ko) {
    const neck = [Math.sin(p.lean) * 56, -Math.cos(p.lean) * 56], sh = neck;
    const fe = pt(sh, p.fa1, 30), fh = pt(fe, p.fa2, 29), be = pt(sh, p.ba1, 30), bh = pt(be, p.ba2, 29);
    const hd = (64 + hr * 105), head = [Math.sin(p.lean) * hd, -Math.cos(p.lean) * hd];
    low = Math.max(low, fh[1], bh[1], fk[1], bk[1], head[1] + hr * 115, 12);
  }
  return low;
}

/* ------------------------------------------------------------------ Chats */
function buildCat(col, faceC, fat) {
  const m = { fur: mat({ color: col, tex: texOf(fat ? 'tabby' : 'plainfur', () => tabby(fat)) }), belly: mat({ color: '#efe7da', tex: texOf('plainfur', () => tabby(false)) }),
    face: mat({ tex: faceC, transparent: true, depthWrite: true }) };
  const g = new Node(), fz = fat ? 1.3 : 1;
  const body = N(gg('catBody' + fat, () => geo.sphere(.17, 12, 8)), m.fur).at(0, .28, 0).scl(1.75, fat ? .92 : .8, .72 * fz); g.add(body);
  g.add(N(gg('catChest', () => geo.sphere(.1, 8, 6)), m.belly).at(.21, .29, 0).scl(1, 1.05, .9 * (fat ? 1.1 : 1)));
  for (const z of [-1, 1]) g.add(N(gg('haunch' + fat, () => geo.sphere(.085 * (fat ? 1.15 : 1), 8, 6)), m.fur).at(-.19, .27, z * .055 * fz));
  const head = new Node().at(.33, .43, 0); g.add(head);
  head.add(N(gg('catSkull', () => geo.sphere(.095, 12, 9)), m.fur).scl(1.05, .92, 1.08));
  head.add(N(gg('muzzle', () => geo.sphere(.045, 8, 6)), m.belly).at(.072, -.035, 0).scl(1, .8, 1.2));
  head.add(N(gg('catFace', () => geo.sphere(.1, 12, 8, Math.PI - 1.0, 2.0, Math.PI / 2 - .85, 1.7)), m.face).scl(1.05, .92, 1.08));
  for (const z of [-1, 1]) head.add(N(gg('catEar', () => geo.cyl(0, .042, .08, 3)), m.fur).at(-.015, .085, z * .052).rot(z * .25, z * .5, .1));
  const legs = [];
  for (const [x, z] of [[.19, .065], [.19, -.065], [-.19, .065], [-.19, -.065]]) {
    const lp = new Node().at(x, .24, z * fz); g.add(lp);
    lp.add(N(gg('catLeg', () => geo.cyl(.026, .021, .23, 6)), m.fur).at(0, -.115, 0));
    lp.add(N(gg('catPaw', () => geo.sphere(.03, 6, 5)), m.belly).at(.008, -.232, 0).scl(1.3, .8, 1));
    legs.push(lp);
  }
  const tail = []; let prev = g;
  for (let i = 0; i < 5; i++) {
    const t = new Node().at(i ? 0 : -.29, i ? -.085 : .31, 0); prev.add(t);
    t.add(N(gg('catTail', () => geo.cyl(.022, .018, .09, 6)), m.fur).at(0, -.043, 0)); tail.push(t); prev = t;
  }
  return { g, body, head, legs, tail, m, o: { x: 0, y: 0, pitch: 0, roll: 0 } };
}
export function buildCats(def, c, img) {
  const fA = cvs(128, 128), fB = cvs(128, 128);
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
