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
    sky: hexRGB(o.sky || '#777777'), ground: hexRGB(o.ground || '#333333'), point: o.point || null };
}

/* ---------- Le vidéoclub ---------- */
function videoclub() {
  const r = new Node(), rnd = rng(3);
  floor(r, T.lino(), 26, 14, 5);
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
  return { root: r, env: env({ clear: '#141614', fog: '#151715', fogR: [12, 30], sky: '#b9c8b8', ground: '#4a4a40', lcol: '#cfdccf', ldir: [-.1, -1, -.25],
    point: { pos: [0, 2.6, -3.6], col: [1.4, .35, .9], range: 6 } }), bounds: 9 };
}

/* ---------- Le parking de nuit ---------- */
function parking() {
  const r = new Node(), rnd = rng(9);
  r.add(N(geo.sphere(70, 14, 6, 0, Math.PI * 2, 0, Math.PI * .6), mat({ tex: T.stars([[0, '#03040a'], [.7, '#0b1020'], [1, '#1f2236']]), unlit: true, double: true, fog: false })));
  floor(r, T.asphalt(), 70, 40, 12, '#c8c8cc');
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
  return { root: r, env: env({ clear: '#05060c', fog: '#0b0d16', fogR: [12, 46], sky: '#4a5070', ground: '#2a2420', lcol: '#ffb070', ldir: [.35, -1, -.2],
    point: { pos: [-8.4, 5.5, -2], col: [1.6, .9, .4], range: 13 } }), bounds: 10 };
}

/* ---------- Les toilettes ---------- */
function wc() {
  const r = new Node();
  floor(r, T.floorTiles(), 24, 12, 6);
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
  return { root: r, env: env({ clear: '#1a1a16', fog: '#22221c', fogR: [10, 28], sky: '#e8e6c8', ground: '#5a5a4c', lcol: '#d8d4b0', ldir: [.1, -1, -.3],
    point: { pos: [0, 3, -1], col: [.8, .8, .65], range: 9 } }), bounds: 8.5 };
}

function photo(img) {
  const r = new Node();
  floor(r, T.floorTiles(), 30, 14, 4, '#b8b0a8');
  r.add(N(geo.plane(22, 11, 1, 1, 8), mat({ tex: T.photoBackdrop(img), unlit: true, fog: false })).at(0, 4.6, -7));
  return { root: r, env: env({ clear: '#1a1626', fog: '#1a1626', fogR: [30, 60], sky: '#c9c0d8', ground: '#4a4050', lcol: '#cfc6b8' }), bounds: 10 };
}

export function buildStage(id, img) {
  if (id === 'parking') return parking();
  if (id === 'wc') return wc();
  if (id === 'photo') return photo(img);
  return videoclub();
}
