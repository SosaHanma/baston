// Planche de présentation d'un modèle : face, 3/4, profil, dos, gros plan visage, rotation libre
import { Renderer, Node, geo, mat, m4, hexRGB } from './gl.js';
import { buildPS2Human } from './ps2char.js';

const cv = document.getElementById('c'), R = new Renderer(cv);
const scene = new Node();
const DEF = { id: 'fiche', build: 'normal', hair: 'short', top: 'jacket', scale: 1 };
const C = { color: '#2e2d2b', color2: '#3b4150', skin: '#b48a70', hairCol: '#1e1712', shoe: '#3a2c22', tee: '#5c5b4c', zoom: 1, ox: 0, oy: 0 };
const rig = buildPS2Human(DEF, C, null);
scene.add(rig.root);
// sol + fond neutres
scene.add(new Node(geo.disc(1.2, 32), mat({ color: '#5a5955', spec: .02 })).rot(-Math.PI / 2, 0, 0));
scene.add(new Node(geo.sphere(30, 16, 8), mat({ color: '#6a6a66', unlit: true, double: true, fog: false })));

// pose neutre de modélisation (bras légèrement écartés)
rig.root.at(0, .95, 0);
for (const [a, s] of [[rig.aF, 1], [rig.aB, -1]]) { a.sh.r[0] = -s * .2; a.sh.r[2] = .02; a.el.r[2] = .12; }
for (const [l, s] of [[rig.lF, 1], [rig.lB, -1]]) { l.hp.r[0] = -s * .04; l.ft.r[0] = s * .04; }
rig.head.r[1] = 0;

const env = { clear: hexRGB('#6a6a66'), fogCol: hexRGB('#6a6a66'), fog: [40, 80], ldir: norm([-.45, -.6, -.65]), lcol: hexRGB('#bdb8ae'), sky: hexRGB('#77746e'), ground: hexRGB('#3c3a36'),
  points: [{ pos: [2.5, 2, 2.5], col: [.35, .36, .4], range: 8 }, { pos: [-1.5, 2.2, -2.5], col: [.4, .4, .42], range: 6 }], expo: 1 };
const QP = new URLSearchParams(location.search);
if (QP.has('nopts')) env.points = [];
if (QP.has('nodir')) env.lcol = [0, 0, 0];
function norm(v) { const l = Math.hypot(...v); return v.map(x => x / l); }

const VIEWS = {
  face: { yaw: -Math.PI / 2, label: 'Vue de face' },
  troisquarts: { yaw: -Math.PI / 4, label: 'Vue de trois quarts' },
  profil: { yaw: 0, label: 'Vue de profil' },
  dos: { yaw: Math.PI / 2, label: 'Vue de dos' },
  visage: { yaw: -Math.PI / 2 + .35, label: 'Gros plan du visage', close: true },
  visageface: { yaw: -Math.PI / 2, label: 'Visage de face', close: true },
  visageprofil: { yaw: 0, label: 'Visage de profil', close: true },
  tourne: { yaw: null, label: 'Rotation libre (glisse pour tourner)' },
};
let view = (location.hash.slice(1) in VIEWS) ? location.hash.slice(1) : 'troisquarts', yaw = VIEWS[view].yaw ?? -Math.PI / 4, drag = null;
const nav = document.getElementById('nav');
for (const k in VIEWS) { const b = document.createElement('button'); b.textContent = VIEWS[k].label.replace('Vue de ', '').replace(' (glisse pour tourner)', ''); b.onclick = () => { location.hash = k; }; b.dataset.k = k; nav.appendChild(b); }
addEventListener('hashchange', () => { const k = location.hash.slice(1); if (k in VIEWS) { view = k; if (VIEWS[k].yaw != null) yaw = VIEWS[k].yaw; } });
cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: yaw }; cv.setPointerCapture(e.pointerId); if (view !== 'visage') { view = 'tourne'; } });
cv.addEventListener('pointermove', e => { if (drag) yaw = drag.y + (e.clientX - drag.x) * .01; });
cv.addEventListener('pointerup', () => drag = null);
if (new URLSearchParams(location.search).has('hidenav')) { nav.hidden = true; document.getElementById('lbl').hidden = true; }

const cam = { view: new Float32Array(16), proj: new Float32Array(16), eye: [0, 1, 5] };
function frame(t) {
  requestAnimationFrame(frame);
  const dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  R.setInternal(w, h); R.dither = 0;
  if (view === 'tourne' && !drag) yaw += .006;
  rig.body.r[1] = yaw;
  R.updateWorld(scene, null);
  const hw = rig.head.world, hy = hw[13];
  const asp = w / h;
  if (VIEWS[view].close) { cam.eye = [0, hy + .02, .95]; m4.lookAt(cam.eye, [0, hy - .01, 0], [0, 1, 0], cam.view); }
  else { const dist = Math.max(4.6, 4.6 / Math.min(1, asp * .8)); cam.eye = [0, 1.05, dist]; m4.lookAt(cam.eye, [0, .92, 0], [0, 1, 0], cam.view); }
  m4.persp(26 * Math.PI / 180, asp, .05, 100, cam.proj);
  R.render(scene, cam, env);
  document.getElementById('lbl').textContent = 'Modèle de base masculin — ' + VIEWS[view].label;
  nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === view));
}
requestAnimationFrame(frame);
window.__fiche = { rig };
