// Arènes 3D
import { Node, geo, mat, hexRGB } from './gl.js';
import * as T from './textures.js';

const N = (g, m) => new Node(g, m);
const box = (w, h, d, m, x, y, z) => N(geo.box(w, h, d), m).at(x, y + h / 2, z);
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function sky(root, tex, r = 60) {
  const s = N(geo.sphere(r, 16, 8, 0, Math.PI * 2, 0, Math.PI * .62), mat({ tex, unlit: true, double: true, fog: false }));
  root.add(s); return s;
}
function floor(root, tex, w, d, rep, color = '#ffffff') {
  const f = N(geo.plane(w, d, rep * w / d, rep), mat({ tex, color })).rot(-Math.PI / 2, 0, 0); root.add(f); return f;
}
function env(o) {
  return { clear: hexRGB(o.clear), fogCol: hexRGB(o.fog), fog: o.fogR || [10, 45], ldir: norm(o.ldir || [-.4, -1, -.5]), lcol: hexRGB(o.lcol || '#bbbbbb'),
    sky: hexRGB(o.sky || '#888888'), ground: hexRGB(o.ground || '#444444'), point: o.point || null };
}
function norm(v) { const l = Math.hypot(...v); return v.map(x => x / l); }

function salon() {
  const r = new Node(), wood = mat({ color: '#704a35' }), wall = mat({ tex: T.wallpaper() }), white = mat({ color: '#efe3cf' });
  floor(r, T.planks(), 26, 14, 5);
  const wl = N(geo.plane(26, 7, 6, 1.6), wall).at(0, 3.5, -4.6); r.add(wl);
  for (const s of [-1, 1]) r.add(N(geo.plane(12, 7, 3, 1.6), wall).at(s * 9.5, 3.5, 1.4).rot(0, -s * Math.PI / 2, 0));
  r.add(box(26, .9, .08, wood, 0, 0, -4.55));
  r.add(N(geo.disc(1, 24), mat({ tex: T.rug() })).rot(-Math.PI / 2, 0, 0).at(0, .01, -.2).scl(4.2, 1.5, 1));
  // fenêtre + rideaux
  r.add(N(geo.plane(2.2, 1.8), mat({ tex: T.windowNight(), unlit: true })).at(2.6, 2.4, -4.55));
  for (const [x, y, w, h] of [[2.6, 3.33, 2.4, .1], [2.6, 1.47, 2.4, .1], [1.45, 2.4, .1, 1.95], [3.75, 2.4, .1, 1.95], [2.6, 2.4, .06, 1.8], [2.6, 2.4, 2.2, .06]]) r.add(box(w, h, .06, white, x, y - h / 2, -4.5));
  const curt = mat({ color: '#b8323f' });
  for (const x of [1.15, 4.05]) r.add(box(.55, 2.6, .12, curt, x, 1.15, -4.45));
  r.add(box(3.4, .12, .14, mat({ color: '#7a1f2a' }), 2.6, 3.7, -4.45));
  // canapé
  const sofa = mat({ color: '#8a3248' }), cush = mat({ color: '#c8566f' });
  r.add(box(3, .45, 1, sofa, -2.2, 0, -3.9)); r.add(box(3, .9, .3, sofa, -2.2, .4, -4.3));
  for (const x of [-3.75, -.65]) r.add(box(.3, .75, 1, sofa, x, 0, -3.9));
  for (const x of [-2.95, -1.45]) r.add(box(1.3, .25, .85, cush, x, .45, -3.85));
  // TV
  r.add(box(1.8, .6, .6, mat({ color: '#3a261b' }), 5.6, 0, -4.1));
  r.add(box(1.5, .9, .12, mat({ color: '#16121c' }), 5.6, .62, -4.15));
  r.add(N(geo.plane(1.35, .76), mat({ tex: T.tvScreen(), unlit: true })).at(5.6, 1.07, -4.08));
  // lampe
  r.add(box(.08, 1.9, .08, mat({ color: '#2a1a14' }), -5.6, 0, -3.8));
  r.add(N(geo.cyl(.25, .4, .4, 10, true), mat({ color: '#f2c75c', unlit: true, double: true })).at(-5.6, 2.05, -3.8));
  const gl = N(geo.plane(3, 3), mat({ tex: T.glow('255,214,120'), additive: true, unlit: true, fog: false })).at(-5.6, 2.0, -3.7); gl.billboard = true; r.add(gl);
  // tableaux
  const gold = mat({ color: '#c9952f' });
  r.add(box(1.5, 1.1, .05, gold, -2.2, 2.0, -4.56)); r.add(N(geo.plane(1.3, .9), mat({ tex: T.painting() })).at(-2.2, 2.55, -4.52));
  r.add(box(.7, .9, .05, gold, -.4, 2.2, -4.56)); r.add(N(geo.plane(.55, .75), mat({ color: '#e9c46a' })).at(-.4, 2.65, -4.52));
  return { root: r, env: env({ clear: '#2f2a2a', fog: '#2f2a2a', fogR: [14, 40], sky: '#c7b39a', ground: '#5a3f33', lcol: '#a89070', ldir: [-.3, -1, -.6],
    point: { pos: [-5.6, 2.2, -3], col: hexRGB('#ffcc77').map(v => v * 1.6), range: 7 } }), bounds: 9 };
}

function jardin() {
  const r = new Node(), rnd = rng(7);
  sky(r, T.skyGradient([[0, '#3a8fe8'], [.55, '#8fd0ff'], [1, '#d8f0ff']]));
  const sun = N(geo.plane(9, 9), mat({ tex: T.glow('255,250,210'), additive: true, unlit: true, fog: false })).at(18, 22, -48); sun.billboard = true; r.add(sun);
  floor(r, T.grass(), 80, 40, 12);
  r.add(N(geo.plane(26, 1.6), mat({ color: '#c8b48a' })).rot(-Math.PI / 2, 0, 0).at(0, .01, 2.6));
  // maison
  const wallM = mat({ tex: T.houseWall() }), roofM = mat({ color: '#a84a32' }), sh = mat({ tex: T.shutters() });
  r.add(box(14, 5, 6, wallM, -1, 0, -14));
  r.add(N(geo.roof(14.6, 2.6, 6.6), roofM).at(-1, 5, -14));
  for (const x of [-6, -2.5, 1, 4.5]) { r.add(N(geo.plane(1.4, 1.4), sh).at(x, 3.2, -10.97)); r.add(N(geo.plane(1.4, 1.4), sh).at(x, 1.2, -10.97)); }
  r.add(box(1.2, 2.2, .1, mat({ color: '#5a3a24' }), 2.75, 0, -10.95));
  // clôture
  const fence = mat({ color: '#e8dcc4' });
  for (let x = -16; x <= 16; x += 1.1) r.add(box(.16, 1.2, .1, fence, x, 0, -6));
  for (const y of [.35, .9]) r.add(box(33, .12, .06, fence, 0, y, -5.95));
  // arbres
  const trunk = mat({ color: '#6b4426' }), leaf = mat({ color: '#3f8f3a' }), leaf2 = mat({ color: '#2f7a33' });
  for (const [x, z, s] of [[-9, -4.5, 1.2], [9.5, -4, 1.1], [-14, -9, 1.5], [13, -10, 1.4], [-5, -20, 1.6], [7, -22, 1.8]]) {
    r.add(N(geo.cyl(.14 * s, .2 * s, 2.2 * s, 6), trunk).at(x, 1.1 * s, z));
    r.add(N(geo.sphere(1.1 * s, 6, 4), leaf).at(x, 2.6 * s, z));
    r.add(N(geo.sphere(.8 * s, 6, 4), leaf2).at(x + .6 * s, 3.2 * s, z + .3));
  }
  // buissons + fleurs
  for (let i = 0; i < 14; i++) {
    const x = -12 + i * 1.9 + rnd() * .6;
    r.add(N(geo.sphere(.45 + rnd() * .2, 6, 4), leaf2).at(x, .25, -5.5 + rnd() * .3));
    r.add(N(geo.sphere(.09, 5, 4), mat({ color: ['#ff6b8b', '#ffd23f', '#ffffff', '#b07bff'][i % 4] })).at(x + .2, .55, -5.2));
  }
  // nuages
  const cloud = mat({ color: '#ffffff', unlit: true, fog: false });
  for (const [x, y, z, s] of [[-20, 16, -45, 3], [5, 19, -50, 2.4], [25, 15, -42, 2.8]]) for (const [dx, dy, ss] of [[0, 0, 1], [s * .9, -.2, .7], [-s * .9, -.3, .75], [s * .3, s * .35, .7]]) r.add(N(geo.sphere(s * ss, 8, 5), cloud).at(x + dx, y + dy, z).scl(1, .55, .6));
  return { root: r, env: env({ clear: '#8fd0ff', fog: '#b9e2ff', fogR: [18, 70], sky: '#c9e6ff', ground: '#5c7a3e', lcol: '#fff2d6', ldir: [-.5, -1, -.4] }), bounds: 12 };
}

function paris() {
  const r = new Node(), rnd = rng(11);
  sky(r, T.stars([[0, '#150e36'], [.4, '#47205f'], [.75, '#c2456b'], [1, '#ff9a4d']]));
  const sun = N(geo.plane(16, 16), mat({ tex: T.glow('255,200,120'), additive: true, unlit: true, fog: false })).at(10, 6, -55); sun.billboard = true; r.add(sun);
  r.add(N(geo.disc(3.2, 20), mat({ color: '#ffd27a', unlit: true, fog: false })).at(10, 6, -56));
  floor(r, T.zinc(), 24, 10, 4, '#d8d4f0');
  r.add(box(24, .3, .2, mat({ color: '#a79ad6' }), 0, -.15, -5));
  // cheminées sur notre toit
  const brick = mat({ tex: T.bricks() }), pot = mat({ color: '#c46a3f' });
  for (const [x, z] of [[-7.5, -3.8], [7.2, -3.6], [-3, -4.4]]) { r.add(box(1, 1.6, .7, brick, x, 0, z)); for (let i = 0; i < 3; i++) r.add(N(geo.cyl(.08, .1, .35, 6), pot).at(x - .3 + i * .3, 1.78, z)); }
  // immeubles
  const roofM = mat({ color: '#3a3660' });
  const fac = [T.facade(1, '#d9c7a8', '#ffcf7a'), T.facade(2, '#cbb79a', '#ffb36b'), T.facade(3, '#e0d2b8', '#ffd88a')];
  for (let i = 0; i < 26; i++) {
    const x = -40 + i * 3.4 + rnd(), z = -10 - rnd() * 22, h = 4 + rnd() * 6, w = 2.6 + rnd() * 1.6;
    const fm = mat({ tex: fac[i % 3] });
    const b = N(geo.box(w, h, 3), fm).at(x, h / 2 - 4, z); r.add(b);
    r.add(N(geo.roof(w + .2, 1.4, 3.2), roofM).at(x, h - 4, z));
    if (rnd() < .7) r.add(box(.4, .9, .4, brick, x + w * .25, h - 3.4, z));
  }
  // tour Eiffel
  const tw = mat({ color: '#3a2457' }), ex = -14, ez = -60;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) r.add(N(geo.box(.8, 14, .8), tw).at(ex + sx * 3, 3, ez + sz * 3).rot(-sz * .2, 0, sx * .2));
  r.add(box(8, .6, 8, tw, ex, 9, ez));
  r.add(N(geo.cyl(.6, 2.6, 16, 4), tw).at(ex, 17, ez).rot(0, Math.PI / 4, 0));
  r.add(box(3.4, .5, 3.4, tw, ex, 17, ez));
  r.add(N(geo.cyl(.08, .6, 8, 4), tw).at(ex, 29, ez));
  return { root: r, env: env({ clear: '#47205f', fog: '#6b2f66', fogR: [16, 75], sky: '#8f6fb8', ground: '#3a2a50', lcol: '#ffb37a', ldir: [-.6, -.7, -.5] }), bounds: 10 };
}

function photo(img) {
  const r = new Node();
  floor(r, T.planks(), 30, 14, 4, '#9a8a80');
  r.add(N(geo.plane(22, 11), mat({ tex: T.photoBackdrop(img), unlit: true, fog: false })).at(0, 4.6, -7));
  return { root: r, env: env({ clear: '#1a1626', fog: '#1a1626', fogR: [30, 60], sky: '#c9c0d8', ground: '#4a4050', lcol: '#cfc6b8' }), bounds: 10 };
}

export function buildStage(id, img) {
  if (id === 'jardin') return jardin();
  if (id === 'paris') return paris();
  if (id === 'photo') return photo(img);
  return salon();
}
