// Personnages façon PS2 (2000-2005) : visage sculpté par géométrie, cheveux en masses et mèches,
// vêtements à facettes, textures peintes basse résolution, ternes et un peu usées.
import { Node, geo, mat, smoothNormals } from './gl.js';
import { cvs, bump } from './textures.js';

const TAU = Math.PI * 2;
const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mk = (P, U, I) => ({ pos: new Float32Array(P), nor: new Float32Array(smoothNormals(P, I)), uv: new Float32Array(U), idx: new Uint16Array(I) });
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const N = (g, m) => new Node(g, m);

/* ===================== Tête sculptée ===================== */
// repère : X = avant (visage), Y = haut, Z = côté. Projection de face pour la texture (et plus tard la photo).
export const HEAD = { male: { rx: .102, ry: .118, rz: .079, jaw: .3, chin: .026, nose: 1, brow: 1, cheek: 1 },
  female: { rx: .096, ry: .112, rz: .073, jaw: .46, chin: .009, nose: .75, brow: .5, cheek: 1.2 },
  kid: { rx: .098, ry: .114, rz: .08, jaw: .44, chin: .006, nose: .6, brow: .4, cheek: .8 } };
function shapeHead(ux, uy, uz, h, asym = 1) {
  const front = Math.max(0, ux), az = Math.abs(uz), sz = Math.sign(uz) || 1, side = uz > 0 ? asym : 1;
  let x = ux * h.rx, y = uy * h.ry, z = uz * h.rz;
  if (ux < 0) x *= 1.07 + .05 * Math.max(0, uy);                       // arrière du crâne
  x *= 1 - .07 * front * front * sstep(-.5, .3, uy);                   // visage plus plat que le crâne
  const lower = sstep(-.2, -.98, uy);
  z *= 1 - h.jaw * lower * (.55 + .45 * front);                       // mâchoire qui se resserre
  z *= 1 - .14 * gauss(uy, -.9, .12) * front;                         // menton
  if (ux < 0) x *= 1 - .34 * sstep(-.3, -.95, uy);                    // nuque
  x *= 1 - .07 * lower * (1 - front);
  z += sz * .011 * gauss(uy, -.6, .13) * gauss(az, .74, .18) * side;  // angle de mâchoire
  x += h.chin * gauss(uy, -.86, .11) * gauss(uz, 0, .28) * front;     // menton
  y -= .006 * gauss(uy, -.95, .08) * front;
  x += .007 * h.cheek * gauss(uy, -.14, .12) * gauss(az, .58, .15) * front * side; // pommettes
  z += sz * .006 * h.cheek * gauss(uy, -.12, .14) * gauss(az, .66, .16);
  x -= .004 * gauss(uy, -.42, .1) * gauss(az, .55, .14) * front;      // creux des joues
  x -= .016 * gauss(uy, .0, .085) * gauss(az, .36, .12) * front;      // orbites
  x += .016 * h.brow * gauss(uy, .15, .065) * gauss(az, .32, .26) * front; // arcades
  z -= sz * .006 * gauss(uy, .2, .14) * gauss(ux, .5, .2);            // tempes
  const prof = uy > .12 ? .003 : uy > -.33 ? .008 + (.12 - uy) / .45 * .04 : Math.max(0, .048 - (-.33 - uy) / .12 * .046);
  x += h.nose * prof * gauss(uz, 0, .1) * front * front;              // nez
  x += h.nose * .009 * gauss(uy, -.38, .06) * gauss(az, .15, .06) * front; // ailes du nez
  x -= .006 * gauss(uy, -.61, .04) * gauss(uz, 0, .27) * front;       // bouche
  x += .004 * gauss(uy, -.55, .035) * gauss(uz, 0, .22) * front;
  x += .004 * gauss(uy, -.68, .04) * gauss(uz, 0, .2) * front;
  return [x, y, z];
}
export function headGeo(h, asym = 1.04, seg = 26, rings = 18) {
  const P = [], U = [], I = [];
  for (let j = 0; j <= rings; j++) {
    const ph = j / rings * Math.PI, uy = Math.cos(ph), rr = Math.sin(ph);
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * TAU, ux = Math.sin(t) * rr, uz = Math.cos(t) * rr;
      const [x, y, z] = shapeHead(ux, uy, uz, h, asym);
      const uf = .5 - z / (2.3 * h.rz), kb = sstep(.05, -.4, ux);
      P.push(x, y, z); U.push(Math.max(.02, Math.min(.98, uf * (1 - kb) + (.5 - Math.sign(z || 1) * .48) * kb)), .5 + y / (2.15 * h.ry));
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  return mk(P, U, I);
}
// coupe de cheveux : coque qui suit le crâne jusqu'à la ligne d'implantation
export function hairGeo(h, style, seg = 26, rings = 9) {
  const P = [], U = [], I = [], rnd = rng(style.length * 13 + 5);
  const line = ux => style === 'long' ? (ux > 0 ? .2 + .3 * ux : -.95) : style === 'buzz' ? (ux > 0 ? .15 + .35 * ux : .0 + .5 * ux) : (ux > 0 ? .08 + .4 * ux : -.02 + .3 * ux);
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= seg; i++) {
    const t = i / seg * TAU, sx = Math.sin(t), sz0 = Math.cos(t);
    const lim = Math.acos(Math.max(-1, Math.min(1, line(sx)))), ph = j / rings * lim;
    const uy = Math.cos(ph), rr = Math.sin(ph), ux = sx * rr, uz = sz0 * rr;
    let [x, y, z] = shapeHead(ux, uy, uz, h, 1);
    const thick = style === 'buzz' ? .004 : style === 'kid' ? .011 : .007;
    let vol = thick + (style === 'buzz' ? 0 : .012 * Math.max(0, uy) + .002 * Math.max(0, -ux));
    if (style !== 'buzz') vol += .006 * Math.max(0, Math.sin(t * 7 + ph * 4)) * Math.max(0, uy) + .008 * Math.max(0, ux) * Math.max(0, uy - .4); // mèches en masses + houppe
    const l = Math.hypot(x / h.rx, y / h.ry, z / h.rz) || 1;
    x += x / l / h.rx * vol * h.rx / .1; y += y / l / h.ry * vol * h.ry / .1; z += z / l / h.rz * vol * h.rz / .1;
    if (j === rings && style !== 'buzz') { const tuft = .006 * Math.sin(t * 9 + rnd() * .5) + .004 * (rnd() - .5); y -= Math.abs(tuft); }
    P.push(x, y, z); U.push(i / seg * 3, 1 - j / rings);
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  return mk(P, U, I);
}
// mèche géométrique : coin aplati et effilé (comme sur les modèles de l'époque)
export function strandGeo(len, w, th) {
  const P = [0, 0, -w / 2, 0, 0, w / 2, 0, th, 0, len, -th * .3, 0], U = [0, 0, 1, 0, .5, .3, .5, 1];
  const I = [0, 1, 3, 1, 2, 3, 2, 0, 3, 0, 2, 1];
  return { pos: new Float32Array(P), nor: new Float32Array(smoothNormals(P, I)), uv: new Float32Array(U), idx: new Uint16Array(I) };
}
// oreille simplifiée
function earGeo() {
  const pr = [[.032, 0, 0], [.026, .007, .015], [.008, .009, .021], [-.012, .008, .018], [-.026, .006, .01], [-.032, 0, 0]];
  return geo.lathe(pr, 8);
}

/* ===================== Textures peintes ===================== */
function grain(g, w, h, n, a, rnd) { for (let i = 0; i < n; i++) { g.fillStyle = rnd() < .5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * .8})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } }
// visage peint : sert tant qu'il n'y a pas de photo
export function paintFace(skin, opt = {}) {
  return (g, S) => {
    const rnd = rng(opt.seed || 7), k = S / 128;
    const P = (u, v) => [S * u, S * v];
    g.fillStyle = skin; g.fillRect(0, 0, S, S);
    grain(g, S, S, 900 * k, .05, rnd);
    const sh = (u, v, rx, ry, col) => { const [x, y] = P(u, v), gr = g.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry) * S); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); g.translate(-x, -y); g.fillRect(0, 0, S, S); g.restore(); };
    for (const s of [-1, 1]) {
      sh(.5 + s * .3, .64, .1, .14, 'rgba(70,35,25,.22)');         // creux des joues
      sh(.5 + s * .17, .545, .07, .03, 'rgba(60,30,30,.28)');        // cernes
      sh(.5 + s * .17, .49, .09, .04, 'rgba(40,20,15,.2)');         // ombre des orbites
    }
    sh(.5, .73, .05, .035, 'rgba(70,35,25,.25)');                    // sous le nez
    sh(.5, .87, .12, .04, 'rgba(60,30,20,.18)');                    // sous la lèvre / menton
    if (opt.stubble) { g.fillStyle = 'rgba(35,25,20,.16)'; g.beginPath(); g.ellipse(S * .5, S * .84, S * .25, S * .12, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(S * .5, S * .755, S * .12, S * .02, 0, 0, TAU); g.fill(); grain(g, S, S, 0, 0, rnd); for (let i = 0; i < 400 * k; i++) { const a = rnd() * TAU, r = rnd(); g.fillStyle = 'rgba(25,18,14,.35)'; g.fillRect(S * (.5 + Math.cos(a) * .25 * r), S * (.84 + Math.sin(a) * .12 * r), 1, 1); } }
    // yeux : simples, mats, paupières lourdes
    const ey = .5, ex = .175;
    for (const s of [-1, 1]) {
      const asy = s > 0 ? .006 : 0, [x, y] = P(.5 + s * ex, ey + asy);
      g.fillStyle = '#c9c2b6'; g.beginPath(); g.ellipse(x, y, S * .06, S * .022, 0, 0, TAU); g.fill();
      g.fillStyle = opt.iris || '#3a2618'; g.beginPath(); g.arc(x + s * -S * .004, y + S * .002, S * .017, 0, TAU); g.fill();
      g.fillStyle = '#100a08'; g.beginPath(); g.arc(x + s * -S * .004, y + S * .002, S * .007, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(30,18,14,.85)'; g.lineWidth = S * .014; g.beginPath(); g.ellipse(x, y + S * .004, S * .058, S * .02, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.strokeStyle = 'rgba(60,35,30,.35)'; g.lineWidth = S * .008; g.beginPath(); g.ellipse(x, y + S * .006, S * .055, S * .018, 0, .1, Math.PI - .1); g.stroke();
      // sourcils sobres, légèrement froncés
      const [bx, by] = P(.5 + s * .17, .43 + (s > 0 ? -.006 : 0));
      g.strokeStyle = opt.brow || 'rgba(30,20,15,.85)'; g.lineWidth = S * (opt.fem ? .016 : .024); g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx - s * S * .075, by + S * .006); g.quadraticCurveTo(bx, by - S * .012, bx + s * S * .065, by + (opt.fem ? -.004 : .004) * S); g.stroke();
    }
    // nez : ombres latérales + narines
    sh(.5, .6, .03, .09, 'rgba(255,230,210,.12)');
    g.fillStyle = 'rgba(40,20,15,.55)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(S * (.5 + s * .028), S * .705, S * .013, S * .006, 0, 0, TAU); g.fill(); }
    // bouche peu détaillée
    const my = .79;
    g.fillStyle = opt.lip || 'rgba(120,70,62,.6)'; g.beginPath(); g.ellipse(S * .5, S * (my + .012), S * .07, S * .014, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(50,25,22,.7)'; g.lineWidth = S * .01; g.beginPath(); g.moveTo(S * .43, S * my); g.quadraticCurveTo(S * .5, S * (my + .004), S * .57, S * (my - .003)); g.stroke();
    // bords : se fond dans la couleur de peau
  };
}
export function hairTexPS2(seed = 3) {
  const c = cvs(64, 64, true), g = c.getContext('2d'), rnd = rng(seed);
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 180; i++) { const x = rnd() * 64, y = rnd() * 64; g.strokeStyle = rnd() < .6 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.22)'; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y + 5 + rnd() * 9); g.stroke(); }
  return c;
}
// tissu usé : coutures, usure, salissures (en gris, teinté par la couleur du matériau)
export function wornCloth(kind, seed = 11) {
  const c = cvs(128, 64, true), g = c.getContext('2d'), rnd = rng(seed + kind.length * 7);
  g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 128, 64);
  grain(g, 128, 64, 1400, .07, rnd);
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,255,255,${.04 + rnd() * .05})`; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 64, 6 + rnd() * 14, 3 + rnd() * 8, rnd() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(40,30,20,${.06 + rnd() * .06})`; g.beginPath(); g.ellipse(rnd() * 128, 30 + rnd() * 34, 5 + rnd() * 10, 3 + rnd() * 6, rnd() * 3, 0, TAU); g.fill(); }
  // plis peints
  for (let i = 0; i < 8; i++) { const y = rnd() * 64, x = rnd() * 128; g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y + (rnd() - .5) * 6, x + 18 + rnd() * 10, y + (rnd() - .5) * 8); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 1.5, 64); g.fillRect(63.5, 0, 1.5, 64);
  if (kind === 'jacket') {
    g.fillStyle = 'rgba(15,15,15,.7)'; g.fillRect(31, 0, 2, 64); g.fillStyle = 'rgba(170,165,150,.55)'; for (let y = 1; y < 64; y += 3) g.fillRect(31.5, y, 1, 1.5);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (const x of [14, 40]) g.strokeRect(x, 16, 12, 10);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 56, 128, 8); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < 128; x += 3) g.fillRect(x, 56, 1, 8);
  }
  if (kind === 'pants') { g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (const x of [12, 52]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 10); g.stroke(); } g.fillStyle = 'rgba(150,110,60,.4)'; g.fillRect(32, 0, 1, 64); g.fillRect(96, 0, 1, 64); }
  if (kind === 'leather') { for (let i = 0; i < 20; i++) { g.strokeStyle = 'rgba(255,240,220,.12)'; g.beginPath(); const x = rnd() * 128, y = rnd() * 64; g.moveTo(x, y); g.lineTo(x + rnd() * 10, y + (rnd() - .5) * 3); g.stroke(); } }
  if (kind === 'rib') { g.fillStyle = 'rgba(0,0,0,.22)'; for (let x = 0; x < 128; x += 3) g.fillRect(x, 0, 1, 64); }
  return c;
}
function skinTex(seed = 5) { const c = cvs(32, 32, true), g = c.getContext('2d'), rnd = rng(seed); g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, 32, 32); grain(g, 32, 32, 220, .06, rnd); return c; }

// texture de tête : peau peinte, puis la photo (si elle existe) fondue par-dessus au centre
export function headTexture(c, photo, crop, painter) {
  const g = c.getContext('2d'), S = c.width;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S); painter(g, S);
  if (photo) {
    const t = cvs(S, S), h = t.getContext('2d'), r = S / 2;
    const sc = Math.max(S / photo.width, S / photo.height) * (crop.zoom || 1), w = photo.width * sc, hh = photo.height * sc;
    h.drawImage(photo, r - w / 2 + (crop.ox || 0) * r, r - hh / 2 + (crop.oy || 0) * r, w, hh);
    h.globalCompositeOperation = 'destination-in';
    const gr = h.createRadialGradient(r, r * 1.05, r * .45, r, r * 1.05, r * .92);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); h.fillStyle = gr; h.fillRect(0, 0, S, S);
    g.drawImage(t, 0, 0);
  }
  bump(c);
}

/* ===================== Modèle complet ===================== */
const CACHE = new Map();
const cg = (k, f) => CACHE.get(k) || (CACHE.set(k, f()), CACHE.get(k));
const TX = {};
const tx = (k, f) => TX[k] || (TX[k] = f());
const BUILDS = {
  normal: { w: 1, d: 1, head: 'male', hs: 1.17 }, big: { w: 1.14, d: 1.16, head: 'male', hs: 1.2 },
  slim: { w: .9, d: .95, head: 'female', hs: 1.14, fem: 1 }, kid: { w: .96, d: 1, head: 'kid', hs: 1.3, kid: 1 },
};
function jacketProfile(w, d, fem) {
  const s = fem ? .88 : 1;
  return [[.68, .05, .06], [.64, .07, .1], [.6, .09, .17 * s], [.55, .108, .218 * s], [.47, .12, .21 * s], [.37, .12, .185 * (fem ? .95 : 1)], [.27, .113, .17 * (fem ? .9 : 1)],
    [.17, .11, .166 * (fem ? .9 : 1)], [.07, .116, .172], [-.01, .12, .178], [-.035, .1, .15]].map(([y, x, z]) => [y, x * d, z * w]);
}
function pelvisProfile(w, d, fem) {
  return [[.08, .1, fem ? .15 : .155], [0, .107, fem ? .168 : .161], [-.07, .1, fem ? .165 : .157], [-.12, .086, .13], [-.155, .05, .075], [-.166, 0, 0]].map(([y, x, z]) => [y, x * d, z * w]);
}
export function buildPS2Human(def, c, img) {
  const B = BUILDS[def.build] || BUILDS.normal, w = B.w, d = B.d, fem = !!B.fem, H = HEAD[B.head];
  const top = def.top || 'jacket', hair = def.hair || 'short', bottom = def.bottom || 'jeans', tee = top === 'tshirt', shorts = bottom === 'shorts';
  const m = {
    jacket: mat({ color: c.color, tex: tx('jk' + top, () => wornCloth(top === 'jacket' ? 'jacket' : top === 'leather' ? 'leather' : 'cloth', 21)), spec: top === 'leather' ? .1 : .03, shin: 12 }),
    sleeve: mat({ color: c.color, tex: tx('sl', () => wornCloth('cloth', 23)), spec: .03, shin: 8 }),
    rib: mat({ color: c.color, tex: tx('rib', () => wornCloth('rib', 25)), spec: .02 }),
    pants: mat({ color: c.color2, tex: tx('pt', () => wornCloth('pants', 31)), spec: .03, shin: 8 }),
    boot: mat({ color: def.shoe || c.shoe || '#3a2c22', tex: tx('lt', () => wornCloth('leather', 41)), spec: .12, shin: 18 }), sole: mat({ color: '#2a2622', spec: .02 }),
    skin: mat({ color: c.skin, tex: tx('sk', () => skinTex()), spec: .04, shin: 10 }),
    hair: mat({ color: c.hairCol, tex: tx('hr', () => hairTexPS2()), spec: .06, shin: 14, double: true }),
    tee: mat({ color: c.tee || '#5c5b4c', spec: .02 }),
    phone: mat({ color: '#15121c', spec: .3, shin: 40 }), screen: mat({ color: '#e6f6ff', unlit: true }),
  };
  const faceC = cvs(128, 128);
  m.face = mat({ tex: faceC, spec: .04, shin: 10 });
  const painter = paintFace(c.skin, { stubble: !fem && !B.kid, fem, seed: def.id ? def.id.length : 7 });
  const redrawFace = () => headTexture(faceC, img ? img(c.photo, redrawFace) : null, { zoom: c.zoom, ox: c.ox, oy: c.oy }, painter);
  redrawFace();
  const root = new Node(), body = new Node(); root.add(body);
  const hips = new Node(); body.add(hips);
  hips.add(N(cg('pel' + w + d + fem, () => geo.lathe(pelvisProfile(w, d, fem), 12)), m.pants));
  const torso = new Node(); hips.add(torso);
  torso.add(N(cg('jk' + w + d + fem, () => geo.lathe(jacketProfile(w, d, fem), 12)), m.jacket));
  torso.add(N(cg('col' + w, () => geo.lathe([[.73, .07, .078], [.69, .078, .09], [.65, .088, .11 * w], [.61, .095, .128 * w]], 12)), m.jacket));
  if (top === 'jacket') for (const z of [-1, 1]) torso.add(N(cg('pk', () => geo.box(.018, .055, .075)), m.sleeve).at(.112 * d, .44, z * .085 * w).rot(0, 0, -.12));
  if (top === 'hoodie') { torso.add(N(cg('hood' + w, () => geo.lathe([[.74, .02, .03], [.72, .07, .09], [.66, .1, .13 * w], [.6, .08, .12 * w], [.57, .03, .05]], 10)), m.jacket).at(-.06 * d, 0, 0).scl(.9, 1, 1));
    torso.add(N(cg('pouch' + w, () => geo.box(.02, .1, .2 * w)), m.sleeve).at(.11 * d, .13, 0)); }
  torso.add(N(cg('neckP', () => geo.limb(.09, .056, .06, 10)), m.skin).at(0, .79, 0));
  // tête
  const head = new Node().at(0, .735 + H.ry * B.hs, 0); torso.add(head);
  const hs = new Node().scl(B.hs); head.add(hs);
  hs.add(N(cg('head' + B.head, () => headGeo(H)), m.face));
  for (const z of [-1, 1]) hs.add(N(cg('ear', () => earGeo()), m.skin).at(-.008, -.008, z * H.rz * .95).rot(0, 0, -.12).scl(1, 1, 1));
  if (hair !== 'none') {
    const style = hair === 'buzz' ? 'buzz' : hair === 'long' || hair === 'ponytail' ? 'long' : hair === 'kid' ? 'kid' : 'short';
    hs.add(N(cg('hair' + B.head + style, () => hairGeo(H, style)), m.hair));
    if (style === 'long') {
      hs.add(N(cg('back' + B.head, () => geo.lathe([[.02, .09, .085], [-.06, .085, .09], [-.16, .07, .1], [-.24, .05, .1], [-.27, .02, .08]], 10)), m.hair).at(-.03, 0, 0).scl(.9, 1, 1));
      for (const z of [-1, 1]) hs.add(N(cg('lock', () => geo.box(.03, .2, .03)), m.hair).at(.03, -.07, z * H.rz * 1.02).rot(0, 0, .08));
    }
  }
  let tail = null;
  if (hair === 'ponytail') { tail = new Node().at(-H.rx * 1.05, H.ry * .25, 0); hs.add(tail); tail.add(N(cg('pony', () => geo.limb(.22, .03, .012, 8)), m.hair)); }
  // bras
  const arm = z => {
    const sh = new Node().at(0, .53, z * .205 * w * (fem ? .88 : 1)); torso.add(sh);
    if (tee) { sh.add(N(cg('uaS' + w, () => geo.limb(.29, .05 * w, .043 * w, 10)), m.skin)); sh.add(N(cg('slv' + w, () => geo.limb(.14, .064 * w, .058 * w, 10)), m.sleeve)); }
    else sh.add(N(cg('ua' + w, () => geo.limb(.29, .058 * w, .05 * w, 10)), m.sleeve));
    const el = new Node().at(0, -.29, 0); sh.add(el);
    if (tee) el.add(N(cg('faS' + w, () => geo.limb(.26, .043 * w, .034 * w, 10)), m.skin));
    else { el.add(N(cg('fa' + w, () => geo.limb(.25, .05 * w, .045 * w, 10)), m.sleeve));
      el.add(N(cg('cuff' + w, () => geo.lathe([[-.2, .048 * w, .05 * w], [-.27, .046 * w, .048 * w]], 10)), m.rib)); }
    const hand = new Node().at(0, -.28, 0); el.add(hand);
    hand.add(N(cg('palm', () => geo.box(.03, .085, .075)), m.skin).at(0, -.035, 0));
    hand.add(N(cg('fing', () => geo.box(.026, .065, .07)), m.skin).at(.01, -.098, 0).rot(0, 0, .3));
    hand.add(N(cg('thumb', () => geo.box(.022, .05, .022)), m.skin).at(.02, -.03, .04).rot(.35, 0, .25));
    return { sh, el, hand };
  };
  const leg = z => {
    const hp = new Node().at(0, -.06, z * .09 * w); hips.add(hp);
    hp.add(N(cg('th' + w, () => geo.limb(.43, .09 * w, .068 * w, 10)), m.pants));
    const kn = new Node().at(0, -.43, 0); hp.add(kn);
    kn.add(N(cg((shorts ? 'shS' : 'sh') + w, () => geo.limb(.4, shorts ? .06 * w : .068 * w, shorts ? .046 * w : .058 * w, 10)), shorts ? m.skin : m.pants));
    if (shorts) { kn.add(N(cg('sock', () => geo.lathe([[-.3, .05, .05], [-.4, .052, .052]], 10)), m.sole)); }
    const ft = new Node().at(0, -.42, 0); kn.add(ft);
    ft.add(N(cg('shaft', () => geo.lathe([[.07, .056, .056], [.0, .06, .058], [-.04, .066, .062]], 10)), m.boot));
    ft.add(N(cg('boot', () => geo.box(.2, .085, .1)), m.boot).at(.04, -.045, 0));
    ft.add(N(cg('toe', () => geo.sphere(1, 10, 6)), m.boot).at(.13, -.05, 0).scl(.055, .042, .05));
    ft.add(N(cg('sole2', () => geo.box(.27, .028, .11)), m.sole).at(.05, -.095, 0));
    return { hp, kn, ft };
  };
  const aB = arm(-1), lB = leg(-1), lF = leg(1), aF = arm(1);
  const phone = new Node().at(.045, -.33, 0); aF.el.add(phone); phone.visible = false;
  phone.add(N(cg('phone', () => geo.box(.022, .15, .075)), m.phone));
  phone.add(N(cg('screen', () => geo.box(.026, .125, .06)), m.screen).at(.003, 0, 0));
  body.scl(def.scale || 1);
  return { kind: 'human', root, body, hips, torso, head, aF, aB, lF, lB, tail, phone, m, faceC, redrawFace, hr: H.ry, scale: def.scale || 1 };
}

// aperçu du visage (atelier, cases de sélection) : même texture que la tête du modèle
export function faceTexFor(def, c, img, onload, size = 128) {
  const B = BUILDS[def.build] || BUILDS.normal, fem = !!B.fem;
  const cv = cvs(size, size);
  const draw = () => headTexture(cv, img ? img(c.photo, () => { draw(); onload && onload(); }) : null, { zoom: c.zoom, ox: c.ox, oy: c.oy },
    paintFace(c.skin, { stubble: !fem && !B.kid, fem, seed: def.id ? def.id.length : 7 }));
  draw(); return cv;
}
