// Arènes 3D réalistes, ambiance années 90 de nuit
import { Node, geo, mat, hexRGB } from './gl.js';
import * as T from './textures.js';

const N = (g, m) => new Node(g, m);
const box = (w, h, d, m, x, y, z) => N(geo.box(w, h, d), m).at(x, y + h / 2, z);
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function floor(root, tex, w, d, rep, color = '#ffffff') {
  const f = N(geo.plane(w, d, rep * w / d, rep, 16), mat({ tex, color })).rot(-Math.PI / 2, 0, 0); root.add(f); return f;
}
function wallZ(root, tex, w, h, z, rep, color = '#ffffff') { root.add(N(geo.plane(w, h, rep * w / h, rep, 10), mat({ tex, color })).at(0, h / 2, z)); }
function wallX(root, tex, d, h, x, zc, rep, color = '#ffffff') { root.add(N(geo.plane(d, h, rep * d / h, rep, 8), mat({ tex, color })).at(x, h / 2, zc).rot(0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0)); }
function glow(root, x, y, z, s, col) { const g = N(geo.plane(s, s), mat({ tex: T.glow(col), additive: true, unlit: true, fog: false })).at(x, y, z); g.billboard = true; root.add(g); return g; }
function env(o) {
  const n = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  return { clear: hexRGB(o.clear), fogCol: hexRGB(o.fog), fog: o.fogR || [10, 40], ldir: n(o.ldir || [-.3, -1, -.4]), lcol: hexRGB(o.lcol || '#999999'),
    sky: hexRGB(o.sky || '#777777'), ground: hexRGB(o.ground || '#333333'), point: o.point || null, expo: o.expo || 1, with(pts) { this.points = pts; return this; } };
}

/* ---------- La chambre (de nuit) ---------- */
const P = (pos, col, range) => ({ pos, col, range });
function chambre() {
  const r = new Node(), H = 2.9;
  const flo = N(geo.plane(22, 12, 9, 5, 16), mat({ tex: T.carpet(), spec: .02 })).rot(-Math.PI / 2, 0, 0); r.add(flo);
  r.add(N(geo.plane(22, 12, 7, 4, 8), mat({ color: '#d8d4cc' })).rot(Math.PI / 2, 0, 0).at(0, H, 0));
  const wp = T.damask();
  wallZ(r, wp, 22, H, -3.9, 1.6); wallX(r, wp, 12, H, -8.2, 2, 1.6); wallX(r, wp, 12, H, 8.2, 2, 1.6);
  const trim = mat({ color: '#efe8da', spec: .2, shin: 30 }), wood = mat({ tex: T.woodDark(), spec: .25, shin: 40 }), woodD = mat({ tex: T.woodDark(), color: '#7a6a60', spec: .2, shin: 30 });
  r.add(box(22, .14, .04, trim, 0, 0, -3.88)); r.add(box(22, .09, .07, trim, 0, H - .09, -3.88));
  // fenêtre avec vue sur la ville
  const wx = 2.6, wy = 1.55;
  r.add(N(geo.plane(1.6, 1.8), mat({ tex: T.nightCity(), unlit: true })).at(wx, wy, -3.93));
  for (const [x, y, w, h] of [[wx, wy + .93, 1.8, .1], [wx, wy - .93, 1.8, .12], [wx - .86, wy, .1, 1.95], [wx + .86, wy, .1, 1.95], [wx, wy, .05, 1.8], [wx, wy + .25, 1.6, .05]]) r.add(N(geo.box(w, h, .12), trim).at(x, y, -3.86));
  r.add(N(geo.box(1.95, .06, .26), trim).at(wx, wy - 1, -3.78));
  const curt = mat({ color: '#e9e4d8', tex: T.quilt(), spec: .02, double: true });
  for (const x of [wx - 1.25, wx + 1.25]) r.add(N(geo.curtain(.9, 2.45, 4, .05), curt).at(x, 1.42, -3.72));
  r.add(N(geo.cyl(.02, .02, 3.4, 8), mat({ color: '#3a3430', spec: .5, shin: 50 })).rot(0, 0, Math.PI / 2).at(wx, 2.7, -3.7));
  // tapisserie murale
  r.add(N(geo.box(1.15, 2, .04), mat({ color: '#2a1810' })).at(-5.6, 1.55, -3.86));
  r.add(N(geo.plane(1.05, 1.9), mat({ tex: T.tapestry(), spec: .02 })).at(-5.6, 1.55, -3.83));
  // lit
  r.add(box(2.2, .44, 1.8, wood, -2.4, 0, -2.9)); r.add(box(2.2, 1.15, .1, wood, -2.4, 0, -3.8));
  r.add(N(geo.box(2.1, .22, 1.7), mat({ color: '#e8e4dc' })).at(-2.4, .55, -2.88));
  const duvet = N(geo.curtain(2.15, 1.35, 5, .025, 30, 10), mat({ color: '#2f3d66', tex: T.quilt(), spec: .03, double: true })).rot(-Math.PI / 2, 0, 0).at(-2.4, .68, -2.62); r.add(duvet);
  for (const x of [-2.95, -1.85]) r.add(N(geo.sphere(1, 16, 10), mat({ color: '#efece4', tex: T.quilt(), spec: .02 })).scl(.42, .1, .22).at(x, .75, -3.55));
  // table de nuit + lampe
  r.add(box(.55, .55, .45, wood, -4.05, 0, -3.55)); r.add(box(.5, .02, .02, mat({ color: '#c9a050', spec: .6, shin: 60 }), -4.05, .35, -3.32));
  r.add(N(geo.lathe([[.0, .07, .07], [-.05, .1, .1], [-.28, .06, .06], [-.32, .1, .1]], 14), mat({ color: '#8a6a3a', spec: .5, shin: 50 })).at(-4.05, .87, -3.55));
  r.add(N(geo.lathe([[0, .12, .12], [-.24, .2, .2]], 18), mat({ color: '#f2d8a0', unlit: true, double: true })).at(-4.05, 1.12, -3.55));
  glow(r, -4.05, 1.0, -3.45, 1.4, '255,200,120');
  // commode + télé cathodique
  r.add(box(1.4, .85, .5, wood, 5.6, 0, -3.6));
  for (const y of [.18, .45, .7]) { r.add(box(1.3, .02, .02, woodD, 5.6, y, -3.34)); for (const x of [5.25, 5.95]) r.add(N(geo.sphere(.022, 8, 6), mat({ color: '#c9a050', spec: .6, shin: 60 })).at(x, y - .1, -3.33)); }
  r.add(box(.62, .5, .5, mat({ color: '#2a2a2e', spec: .3, shin: 30 }), 5.6, .85, -3.62));
  r.add(N(geo.plane(.5, .38), mat({ tex: T.crtStatic(), unlit: true })).at(5.6, 1.1, -3.36));
  // cadres photo
  for (const [x, y, k] of [[-.6, 1.9, 1], [.1, 1.75, 2], [-.6, 1.45, 3]]) { r.add(N(geo.box(.42, .52, .03), mat({ color: '#1e1610' })).at(x, y, -3.88)); r.add(N(geo.plane(.34, .44), mat({ tex: T.photoFrame(k) })).at(x, y, -3.86)); }
  // porte + plafonnier
  r.add(N(geo.box(.05, 2.1, 1), mat({ color: '#e2dccf', spec: .15 })).at(-8.15, 1.05, .5));
  r.add(N(geo.sphere(.22, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat({ color: '#f6eedc', unlit: true })).at(0, H, -1));
  return { root: r, env: env({ clear: '#0c0e16', fog: '#0c0e16', fogR: [14, 30], sky: '#3a4566', ground: '#1e1c22', lcol: '#5a6a96', ldir: [-.5, -.6, .4], expo: 1.05 }).with([
    P([-4.05, 1.0, -3.2], [1.5, 1.05, .6], 5.5), P([wx, 1.6, -3.2], [.35, .45, .8], 5), P([0, 2.6, -.8], [.55, .5, .42], 7), P([5.6, 1.1, -3.1], [.25, .3, .5], 2.5)]), bounds: 7.5 };
}

/* ---------- Le vidéoclub ---------- */
function videoclub() {
  const r = new Node(), rnd = rng(3);
  const fl = floor(r, T.lino(), 26, 14, 5); fl.mat.spec = .35; fl.mat.shin = 50;
  const ceil = N(geo.plane(26, 14, 9, 5, 8), mat({ tex: T.ceilingTiles() })).rot(Math.PI / 2, 0, 0).at(0, 3.3, 0); r.add(ceil);
  const tube = mat({ color: '#eef8ee', unlit: true }), housing = mat({ color: '#b8b8ae' });
  for (const x of [-6, -2, 2, 6]) for (const z of [-3, 0.5]) { r.add(box(1.5, .06, .3, housing, x, 3.22, z)); r.add(box(1.4, .03, .18, tube, x, 3.2, z)); }
  const wall = T.paintWall('#6c7564');
  wallZ(r, wall, 26, 3.3, -4.6, 1.2); wallX(r, wall, 14, 3.3, -9.5, 1.4, 1.2); wallX(r, wall, 14, 3.3, 9.5, 1.4, 1.2);
  r.add(box(26, .12, .06, mat({ color: '#3a3a34' }), 0, 0, -4.56));
  // rayonnages de cassettes contre le mur
  const shelf = mat({ tex: T.vhsShelf() }), frame = mat({ color: '#3b2e25' });
  for (const x of [-7.4, -4.1, 4.1, 7.4]) {
    r.add(box(3, 2.3, .45, frame, x, 0, -4.3));
    r.add(N(geo.plane(2.8, 2.1, 1.4, 1.6, 2), shelf).at(x, 1.15, -4.07));
    r.add(box(3, .2, .5, mat({ color: '#d8c84a' }), x, 2.3, -4.3));
  }
  // affiches
  const posters = [['LA NUIT\nDU PLOMBIER', 'BIENTÔT EN CASSETTE', 350], ['CHASSE\nD\'EAU 3', 'LE RETOUR', 120], ['TOILETTES\nMAUDITES', 'INTERDIT -12 ANS', 200]];
  posters.forEach(([t, s, h], i) => r.add(N(geo.plane(.75, 1.1), mat({ tex: T.poster(t, s, h) })).at(-1.3 + i * 1.3, 2.05, -4.56)));
  // enseigne néon
  r.add(N(geo.plane(3.4, .85), mat({ tex: T.neon('VIDÉOCLUB'), unlit: true, transparent: true, fog: false })).at(0, 2.85, -4.5));
  glow(r, 0, 2.85, -4.3, 4.5, '255,60,170');
  // îlots de cassettes au milieu
  for (const x of [-6.2, 6.2]) { r.add(box(2.4, 1.4, .9, frame, x, 0, -2.4)); for (const z of [-1.94, -2.86]) r.add(N(geo.plane(2.3, 1.2, 1, .75, 2), shelf).at(x, .72, z).rot(0, z < -2.4 ? Math.PI : 0, 0)); }
  // comptoir + caisse + télé
  const counter = mat({ color: '#5a4636' }), top = mat({ color: '#8a8478' });
  r.add(box(.8, 1.05, 3, counter, 8.6, 0, .6)); r.add(box(.95, .06, 3.15, top, 8.6, 1.05, .6));
  r.add(box(.4, .28, .45, mat({ color: '#2a2a2e' }), 8.55, 1.11, 1.2));
  r.add(box(.55, .45, .5, mat({ color: '#1e1e22' }), 8.6, 1.11, -.3));
  r.add(N(geo.plane(.42, .32), mat({ tex: T.crtStatic(), unlit: true })).at(8.32, 1.34, -.3).rot(0, -Math.PI / 2, 0));
  // porte des toilettes
  r.add(box(1.1, 2.15, .06, mat({ color: '#7a6a52' }), -8.3, 0, -4.5));
  r.add(N(geo.plane(.35, .35), mat({ tex: T.wcSign() })).at(-8.3, 1.75, -4.46));
  // poubelle, présentoir de bonbons
  r.add(N(geo.cyl(.22, .19, .55, 8), mat({ color: '#3a4a3a' })).at(-9, .275, 1.5));
  for (let i = 0; i < 18; i++) r.add(box(.12, .02, .2, mat({ color: ['#c0392b', '#1f3a93', '#f1c40f', '#27ae60'][i % 4] }), -6.2 + (rnd() - .5) * 2, 1.4, -2.4 + (rnd() - .5) * .6));
  return { root: r, env: env({ clear: '#141614', fog: '#151715', fogR: [12, 30], sky: '#7f8f80', ground: '#3a3a32', lcol: '#a8b8a8', ldir: [-.1, -1, -.25] }).with([
    P([0, 2.6, -3.6], [1.4, .35, .9], 6), P([-4, 3, .5], [.75, .85, .75], 7), P([4, 3, .5], [.75, .85, .75], 7), P([8.3, 1.4, -.3], [.2, .25, .5], 2.5)]), bounds: 9 };
}

/* ---------- Le parking de nuit ---------- */
function parking() {
  const r = new Node(), rnd = rng(9);
  r.add(N(geo.sphere(70, 14, 6, 0, Math.PI * 2, 0, Math.PI * .6), mat({ tex: T.stars([[0, '#03040a'], [.7, '#0b1020'], [1, '#1f2236']]), unlit: true, double: true, fog: false })));
  const fl = floor(r, T.asphalt(), 70, 40, 12, '#c8c8cc'); fl.mat.spec = .18; fl.mat.shin = 20;
  const paint = mat({ color: '#d8d4c4' });
  for (let x = -12; x <= 12; x += 2.6) r.add(N(geo.plane(.1, 4.6), paint).rot(-Math.PI / 2, 0, 0).at(x, .01, -5.2));
  r.add(N(geo.plane(28, .12), paint).rot(-Math.PI / 2, 0, 0).at(0, .01, -2.9));
  // magasin au fond
  const brick = mat({ tex: T.brickDark() });
  r.add(N(geo.box(22, 4.4, 1), brick).at(0, 2.2, -11));
  for (const x of [-6, -2.2]) r.add(N(geo.plane(3.2, 1.8), mat({ tex: T.shopWindow(), unlit: true })).at(x, 1.4, -10.48));
  r.add(N(geo.plane(1.4, 2.2), mat({ color: '#e8d8a8', unlit: true })).at(1.4, 1.1, -10.48));
  r.add(box(22.4, .3, 1.4, mat({ color: '#1d1d22' }), 0, 4.4, -11));
  r.add(N(geo.plane(4.4, 1.1), mat({ tex: T.neon('VIDÉOCLUB'), unlit: true, transparent: true, fog: false })).at(-3.5, 3.6, -10.45));
  glow(r, -3.5, 3.6, -10.2, 6, '255,60,170');
  r.add(N(geo.plane(3, 1.6), mat({ color: '#2a2a30' })).at(5.6, 1.5, -10.48));
  // voitures garées
  const car = (x, z, col, rot) => {
    const g = new Node().at(x, 0, z).rot(0, rot, 0), bodyM = mat({ color: col }), glass = mat({ tex: T.carGlass() }), tire = mat({ color: '#111114' });
    g.add(box(4.1, .7, 1.75, bodyM, 0, .3, 0)); g.add(N(geo.box(2.2, .6, 1.6), glass).at(-.2, 1.3, 0));
    g.add(N(geo.box(2.3, .06, 1.62), bodyM).at(-.2, 1.62, 0));
    for (const [wx, wz] of [[1.3, .82], [1.3, -.82], [-1.3, .82], [-1.3, -.82]]) g.add(N(geo.cyl(.34, .34, .25, 10), tire).at(wx, .34, wz).rot(Math.PI / 2, 0, 0));
    for (const wz of [.6, -.6]) { g.add(N(geo.box(.04, .14, .3), mat({ color: '#fff4d0', unlit: true })).at(2.06, .78, wz)); g.add(N(geo.box(.04, .12, .3), mat({ color: '#a01818', unlit: true })).at(-2.06, .8, wz)); }
    r.add(g);
  };
  car(-7.8, -5.4, '#5a1f22', Math.PI / 2); car(-2.6, -5.4, '#2a3550', Math.PI / 2 + .05); car(5.2, -5.5, '#6a6a60', Math.PI / 2 - .04); car(13, -4, '#1e2a22', 0);
  // lampadaires (lumière orange au sodium)
  const pole = mat({ color: '#2e2e32' }), lamp = mat({ color: '#ffb35c', unlit: true });
  for (const x of [-9, 9]) { r.add(N(geo.cyl(.08, .11, 6, 6), pole).at(x, 3, -2.5)); r.add(box(1.2, .12, .35, pole, x + .5, 6, -2.5)); r.add(box(.8, .05, .25, lamp, x + .6, 5.95, -2.5)); glow(r, x + .6, 5.8, -2.4, 4, '255,170,80'); }
  // benne + barrière
  r.add(box(2, 1.3, 1.1, mat({ color: '#24402e' }), 10.5, 0, -8)); r.add(box(2.1, .12, 1.2, mat({ color: '#1a2a20' }), 10.5, 1.3, -8));
  for (let x = -16; x <= 16; x += 2) r.add(N(geo.cyl(.05, .05, 1, 5), pole).at(x, .5, -14));
  return { root: r, env: env({ clear: '#05060c', fog: '#0b0d16', fogR: [12, 46], sky: '#2e3450', ground: '#1a1614', lcol: '#6a5a50', ldir: [.35, -1, -.2] }).with([
    P([-8.4, 5.6, -2.3], [1.9, 1.05, .45], 12), P([9.6, 5.6, -2.3], [1.9, 1.05, .45], 12), P([-3.5, 3.4, -9.6], [1.3, .3, .8], 7), P([-4, 1.4, -9.8], [.9, .75, .5], 6)]), bounds: 10 };
}

/* ---------- Les toilettes ---------- */
function wc() {
  const r = new Node();
  const fl = floor(r, T.floorTiles(), 24, 12, 6); fl.mat.spec = .3; fl.mat.shin = 40;
  const tiles = T.whiteTiles();
  wallZ(r, tiles, 24, 3.2, -4.2, 1.6, '#e8eae0'); wallX(r, tiles, 12, 3.2, -9, 1.8, 1.6, '#e8eae0'); wallX(r, tiles, 12, 3.2, 9, 1.8, 1.6, '#e8eae0');
  r.add(N(geo.plane(24, 12), mat({ color: '#6a6c64' })).rot(Math.PI / 2, 0, 0).at(0, 3.2, 1.8));
  // cabines
  const part = mat({ color: '#7d8a8a' }), door = mat({ color: '#6f7d7e' }), bowl = mat({ color: '#f2f2ee' }), metal = mat({ color: '#9a9a96' });
  for (let i = 0; i < 4; i++) {
    const x = -6.5 + i * 2.2;
    r.add(box(.06, 2.1, 1.7, part, x - 1.1, .15, -3.35));
    if (i !== 1) r.add(box(1.4, 1.95, .05, door, x - .25, .2, -2.5));
    else { const d = box(1.4, 1.95, .05, door, x + .5, .2, -1.9); d.r[1] = -1.2; r.add(d); }
    r.add(N(geo.cyl(.2, .16, .4, 10), bowl).at(x, .2, -3.7)); r.add(N(geo.cyl(.22, .22, .04, 10), bowl).at(x, .42, -3.7));
    r.add(box(.45, .45, .2, bowl, x, .6, -4.05)); r.add(box(.08, .04, .06, metal, x + .15, 1.07, -4));
  }
  r.add(box(.06, 2.1, 1.7, part, 2.3, .15, -3.35));
  r.add(N(geo.plane(1.4, .7), mat({ tex: T.graffiti(), transparent: true })).at(-4.5, 1.4, -2.46));
  // lavabos + miroir
  for (const x of [4.6, 6.4]) { r.add(box(1, .15, .55, bowl, x, .85, -3.9)); r.add(N(geo.cyl(.03, .03, .25, 6), metal).at(x, 1.1, -4.05)); }
  r.add(N(geo.plane(3, 1.1), mat({ color: '#5a6466', unlit: false })).at(5.5, 1.85, -4.18));
  r.add(box(3.1, .05, .06, metal, 5.5, 2.4, -4.17)); r.add(box(.5, .3, .22, metal, 8.2, 1.3, -4.08));
  // néons
  const tube = mat({ color: '#f4f2d8', unlit: true });
  for (const x of [-5, 0, 5]) r.add(box(1.3, .04, .16, tube, x, 3.16, -1));
  r.add(box(.9, 2.1, .06, mat({ color: '#7a6a52' }), -8.94, 0, 1).rot(0, Math.PI / 2, 0));
  return { root: r, env: env({ clear: '#1a1a16', fog: '#22221c', fogR: [10, 28], sky: '#8a8a74', ground: '#3a3a30', lcol: '#a8a488', ldir: [.1, -1, -.3] }).with([
    P([-5, 3, -1], [.85, .85, .7], 7), P([0, 3, -1], [.85, .85, .7], 7), P([5, 3, -1], [.85, .85, .7], 7), P([-4.5, 2.2, -3.2], [.25, .25, .2], 3)]), bounds: 8.5 };
}

function photo(img) {
  const r = new Node();
  floor(r, T.floorTiles(), 30, 14, 4, '#b8b0a8');
  r.add(N(geo.plane(22, 11, 1, 1, 8), mat({ tex: T.photoBackdrop(img), unlit: true, fog: false })).at(0, 4.6, -7));
  return { root: r, env: env({ clear: '#1a1626', fog: '#1a1626', fogR: [30, 60], sky: '#c9c0d8', ground: '#4a4050', lcol: '#cfc6b8' }), bounds: 10 };
}

export function buildStage(id, img) {
  if (id === 'chambre') return chambre();
  if (id === 'parking') return parking();
  if (id === 'wc') return wc();
  if (id === 'photo') return photo(img);
  return videoclub();
}
