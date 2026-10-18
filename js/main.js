// Baston de Famille — écrans, boucle de jeu
import { CHARS, POWERS, STAGES } from './data.js';
import { store, cust, save, saveDecor, img, readPhoto } from './store.js';
import { poll, pads, fightInput, menuInput, endFrame, setTyping } from './input.js';
import { audioInit, sfx } from './audio.js';
import { View } from './view.js';
import { faceTexFor } from './ps2char.js';
import { Fight, Fighter } from './game.js';
import { cvs, drawFaceCanvas, realFace, realCatFace, photoBackdrop } from './textures.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const TAU = Math.PI * 2;
let toastT = null;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3800); }
const saveWarn = () => toast('Les photos sont trop lourdes pour être toutes gardées sur cet ordi.');
const animate = f => Fight.prototype.animate.call(null, f);
const byId = id => CHARS.find(c => c.id === id) || CHARS[0];

let view;
try { view = new View($('#c3'), $('#hud')); }
catch (e) { $('#fatal').hidden = false; $('#fatalMsg').textContent = "Ton navigateur n'arrive pas à afficher la 3D (WebGL). Essaie avec Chrome, Edge ou Firefox à jour."; throw e; }

let screen = 'title', mode = 'cpu', fight = null, paused = false;
const isTouch = matchMedia('(pointer:coarse)').matches;
const touch = { held: {}, pressed: new Set() };
setTyping(() => screen === 'workshop');

/* ---------------- menus génériques ---------------- */
class Menu {
  constructor(el, onAct) {
    this.items = [...el.querySelectorAll('button')]; this.i = 0; this.onAct = onAct;
    this.items.forEach((b, k) => {
      b.addEventListener('mouseenter', () => this.set(k));
      b.addEventListener('click', () => { audioInit(); this.set(k); sfx('ok'); onAct(b.dataset.act); });
    });
    this.set(0);
  }
  set(k) { this.i = (k + this.items.length) % this.items.length; this.items.forEach((b, j) => b.classList.toggle('on', j === this.i)); }
  handle(m) {
    if (m.up) { this.set(this.i - 1); sfx('move'); }
    if (m.down) { this.set(this.i + 1); sfx('move'); }
    if (m.ok || m.start) { sfx('ok'); this.onAct(this.items[this.i].dataset.act); }
  }
}
function showScreen(name) {
  screen = name;
  for (const id of ['title', 'select', 'options']) $('#' + id).hidden = id !== name;
  $('#workshop').hidden = name !== 'workshop';
  $('#pause').hidden = true; $('#results').hidden = true;
  $('#pauseBtn').hidden = !(name === 'fight' && isTouch);
  $('#touch').hidden = !(name === 'fight' && isTouch);
}

/* ---------------- vitrine 3D (titre / sélection) ---------------- */
const show = { ids: [null, null], f: [null, null], orbit: 0 };
function altColor(c) { return c.toLowerCase() === '#3fb8ff' ? '#ff5a3d' : '#3fb8ff'; }
function setShow(side, id, other) {
  const def = byId(id), c = cust(id);
  const col = side === 1 && id === other ? altColor(c.color) : null;
  if (show.ids[side] === id && show.col?.[side] === col && !show.dirty) return;
  view.setFighter(side, def, c, col);
  const f = new Fighter(def, c, side, col); f.x = side ? 700 : 260; show.f[side] = f; show.ids[side] = id;
  (show.col || (show.col = []))[side] = col;
}
function tickShow(lively) {
  show.f.forEach((f, s) => {
    if (!f) return;
    f.t++;
    if (lively && !f.move && f.state !== 'win' && Math.random() < .012) { f.move = ['punch', 'kick', 'fire', 'ckick'][Math.floor(Math.random() * 4)]; f.mt = 0; }
    if (f.move) { f.mt++; if (f.mt > 34) f.move = null; }
    animate(f); view.sync(s, f);
  });
}

/* ---------------- écran titre ---------------- */
let started = false;
const titleMenu = new Menu($('#titleMenu'), act => {
  if (act === 'cpu' || act === '2p') { mode = act; openSelect(); }
  else if (act === 'workshop') openWorkshop();
  else if (act === 'options') openOptions();
});
function openTitle() {
  showScreen('title'); show.dirty = true;
  const ids = CHARS.map(c => c.id).sort(() => Math.random() - .5);
  setShow(0, ids[0], ids[1]); setShow(1, ids[1], ids[0]); show.dirty = false;
  view.setStage(['chambre', 'videoclub', 'parking', 'wc'][Math.floor(Math.random() * 4)]);
  $('#titleMenu').hidden = !started; $('#pressStart').hidden = started;
}
$('#title').addEventListener('click', e => { if (!started) { audioInit(); started = true; sfx('ok'); openTitle(); } });
function titleFrame() {
  const m = menuInput('any');
  if (!started) { if (m.ok || m.start) { audioInit(); started = true; sfx('ok'); openTitle(); } }
  else titleMenu.handle(m);
  show.orbit += .004; tickShow(true);
  view.camShow(-.3, .3, show.orbit);
}
function padText() {
  if (pads.blocked) return 'Les manettes sont bloquées par ce navigateur. Utilise Chrome ou Edge.';
  if (!pads.list.length) return 'Branche une manette et appuie sur un de ses boutons pour jouer avec.';
  return pads.list.map((p, i) => `Manette ${i + 1} : <b>${p.id.replace(/\(.*?\)/g, '').trim().slice(0, 30) || 'prête'}</b>`).join(' · ');
}

/* ---------------- sélection ---------------- */
const sel = { phase: 'pick', cur: [0, 1], done: [false, false], stage: 0 };
const tileFaces = new Map();
function tileCanvas(def) {
  const c = cust(def.id), out = cvs(160, 160), g = out.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 160); bg.addColorStop(0, def.kind === 'cats' ? c.color : c.skin); bg.addColorStop(1, '#120e22');
  g.fillStyle = bg; g.fillRect(0, 0, 160, 160);
  let fc;
  if (def.kind === 'cats') { fc = cvs(128, 128); drawFaceCanvas(fc, img(c.photo, () => buildTiles()), c, realCatFace('#c9a43a')); g.drawImage(fc, 16, 6, 128, 128); }
  else { fc = faceTexFor(def, c, img, () => buildTiles()); g.save(); g.beginPath(); g.ellipse(80, 80, 62, 76, 0, 0, TAU); g.clip(); g.drawImage(fc, 4, 2, 152, 160); if (!c.photo) { g.fillStyle = c.hairCol; g.beginPath(); g.ellipse(80, 22, 70, 42, 0, 0, TAU); g.fill(); } g.restore(); }
  if (def.kind === 'cats') { const f2 = cvs(128, 128); drawFaceCanvas(f2, img(c.photo2, () => buildTiles()), { zoom: c.zoom2, ox: c.ox2, oy: c.oy2 }, realCatFace('#9ccf4f')); g.drawImage(fc, -4, 20, 100, 100); g.drawImage(f2, 64, 20, 100, 100); }
  return out;
}
function buildTiles() {
  const gr = $('#selGrid'); gr.innerHTML = '';
  CHARS.forEach((def, i) => {
    const b = document.createElement('button'); b.className = 'tile'; b.dataset.i = i;
    const cv = tileCanvas(def); cv.className = '';
    b.appendChild(cv); const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = cust(def.id).name; b.appendChild(nm);
    b.addEventListener('click', () => { audioInit(); tileClick(i); });
    gr.appendChild(b);
  });
  renderSel();
}
function openSelect() {
  sel.cur = [Math.max(0, CHARS.findIndex(c => c.id === store.last.p1)), Math.max(0, CHARS.findIndex(c => c.id === store.last.p2))];
  sel.done = [false, false]; sel.phase = 'pick'; sel.stage = Math.max(0, STAGES.findIndex(s => s.id === store.last.stage));
  showScreen('select'); buildTiles(); view.setStage(STAGES[sel.stage].id); syncSelModels();
}
function syncSelModels() { const a = CHARS[sel.cur[0]].id, b = CHARS[sel.cur[1]].id; setShow(0, a, b); setShow(1, b, a); }
function renderSel() {
  $$('.tile').forEach((t, i) => {
    t.classList.toggle('c1', sel.cur[0] === i); t.classList.toggle('c2', sel.cur[1] === i && (mode === '2p' || sel.done[0]));
    t.querySelectorAll('.tag').forEach(x => x.remove());
    if (sel.cur[0] === i) t.insertAdjacentHTML('beforeend', '<span class="tag t1">1P</span>');
    if (sel.cur[1] === i && (mode === '2p' || sel.done[0])) t.insertAdjacentHTML('beforeend', `<span class="tag t2">${mode === 'cpu' ? 'ORDI' : '2P'}</span>`);
  });
  const info = (el, k) => {
    const def = CHARS[sel.cur[k]], c = cust(def.id), P = POWERS[c.power];
    const who = k === 0 ? 'Joueur 1' : mode === 'cpu' ? 'Ordi' : 'Joueur 2';
    const hidden = k === 1 && mode === 'cpu' && !sel.done[0];
    el.hidden = hidden;
    el.innerHTML = `<div class="who">${who}</div><div class="big">${esc(c.name)}</div><div class="tg">${def.tag} · Spécial : ${def.projName}</div>
      <div class="pw">${P.name}</div><div class="pd">${P.desc}</div>${sel.done[k] ? '<div class="ok">Prêt !</div>' : ''}`;
  };
  info($('#info1'), 0); info($('#info2'), 1);
  $('#selTitle').textContent = sel.phase === 'stage' ? 'Choix du décor' : mode === 'cpu' && sel.done[0] ? "Choix de l'adversaire" : 'Choix des combattants';
  $('#selGrid').hidden = sel.phase === 'stage'; $('#stagePick').hidden = sel.phase !== 'stage'; $('#selHint').hidden = sel.phase === 'stage';
  $('#stageName').textContent = STAGES[sel.stage].name;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function nav(k, m) {
  let c = sel.cur[k], n = CHARS.length;
  if (m.left) c = (c + n - 1) % n; if (m.right) c = (c + 1) % n;
  if (m.up) c = (c + n - 3) % n; if (m.down) c = (c + 3) % n;
  if (c !== sel.cur[k]) { sel.cur[k] = c; sfx('move'); syncSelModels(); renderSel(); }
}
function confirm(k) {
  sel.done[k] = true; sfx('ok'); show.f[k] && (show.f[k].state = 'win');
  if (sel.done[0] && sel.done[1]) sel.phase = 'stage';
  renderSel();
}
function unconfirm(k) { sel.done[k] = false; if (show.f[k]) show.f[k].state = 'idle'; sel.phase = 'pick'; sfx('back'); renderSel(); }
function tileClick(i) {
  if (sel.phase !== 'pick') return;
  const k = mode === 'cpu' ? (sel.done[0] ? 1 : 0) : (sel.done[0] ? 1 : 0);
  sel.cur[k] = i; syncSelModels(); confirm(k);
}
function selectFrame() {
  if (sel.phase === 'stage') {
    const m = menuInput('any');
    if (m.left || m.right) { sel.stage = (sel.stage + (m.right ? 1 : STAGES.length - 1)) % STAGES.length; sfx('move'); view.setStage(STAGES[sel.stage].id); renderSel(); }
    if (m.ok || m.start) { sfx('ok'); startFight(); }
    else if (m.back) unconfirm(1);
  } else if (mode === 'cpu') {
    const m = menuInput('any'), k = sel.done[0] ? 1 : 0;
    nav(k, m);
    if (m.ok || m.start) confirm(k);
    else if (m.back) { if (sel.done[0]) unconfirm(0); else { sfx('back'); openTitle(); } }
  } else {
    for (const k of [0, 1]) {
      const m = menuInput(k + 1);
      if (!sel.done[k]) nav(k, m);
      if ((m.ok || m.start) && !sel.done[k]) confirm(k);
      else if (m.back) { if (sel.done[k]) unconfirm(k); else if (!sel.done[0] && !sel.done[1]) { sfx('back'); openTitle(); return; } }
    }
  }
  tickShow(false);
  view.camShow(-1.3, 1.3, null);
}
$$('#stagePick .arr').forEach((a, i) => a.addEventListener('click', () => { sel.stage = (sel.stage + (i ? 1 : STAGES.length - 1)) % STAGES.length; view.setStage(STAGES[sel.stage].id); renderSel(); }));
$('#stageName').addEventListener('click', () => startFight());

/* ---------------- combat ---------------- */
function startFight() {
  const d1 = CHARS[sel.cur[0]], d2 = CHARS[sel.cur[1]];
  store.last = { p1: d1.id, p2: d2.id, stage: STAGES[sel.stage].id }; save(saveWarn);
  fight = new Fight(d1, cust(d1.id), d2, cust(d2.id), { diff: store.opts.diff, time: store.opts.time, rounds: store.opts.rounds });
  view.setStage(STAGES[sel.stage].id);
  view.setFighter(0, d1, cust(d1.id)); view.setFighter(1, d2, cust(d2.id), fight.f2.color);
  show.ids = [null, null]; view.clearFX(); paused = false; acc = 0;
  showScreen('fight');
}
function restartFight() {
  const o = fight.opts, a = fight.f1, b = fight.f2;
  fight = new Fight(a.def, a.c, b.def, b.c, o); view.setFighter(1, b.def, b.c, fight.f2.color); view.setFighter(0, a.def, a.c);
  view.clearFX(); paused = false; showScreen('fight');
}
function setPause(p) { paused = p; $('#pause').hidden = !p; if (p) pauseMenu.set(0); }
const pauseMenu = new Menu($('#pauseMenu'), act => {
  if (act === 'resume') setPause(false);
  else if (act === 'restart') restartFight();
  else if (act === 'select') openSelect();
  else if (act === 'title') openTitle();
});
const resMenu = new Menu($('#resMenu'), act => {
  if (act === 'restart') restartFight();
  else if (act === 'select') openSelect();
  else if (act === 'title') openTitle();
});
$('#pauseBtn').addEventListener('click', () => setPause(!paused));
addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (screen === 'fight' && fight && fight.phase !== 'over') { setPause(!paused); }
    else if (screen === 'workshop') closeWorkshop();
  }
});
let acc = 0, sub = 0;
function fightFrame(dt) {
  if (fight.phase === 'over') { resMenu.handle(menuInput('any')); endFrame(); }
  else if (paused) { const m = menuInput('any'); if (m.start) setPause(false); else pauseMenu.handle(m); endFrame(); }
  else {
    if (menuInput('any').start) { setPause(true); endFrame(); }
    else {
      acc += dt;
      while (acc >= 1000 / 60) {
        acc -= 1000 / 60;
        if (fight.slow > 0) { fight.slow--; if (++sub % 3) continue; }
        const i1 = fightInput(1, mode === 'cpu', touch), i2 = mode === 'cpu' ? fight.ai(fight.f2, fight.f1) : fightInput(2, false);
        fight.tick(i1, i2); endFrame(); touch.pressed.clear();
      }
    }
  }
  animate(fight.f1); animate(fight.f2);
  view.sync(0, fight.f1); view.sync(1, fight.f2); view.syncFX(fight); view.camFight(fight);
  while (fight.events.length) if (fight.events.shift() === 'over') {
    const w = fight.winner; $('#winTxt').textContent = `${w.c.name} remporte le combat !`; $('#results').hidden = false; resMenu.set(0); $('#pauseBtn').hidden = true;
  }
}

/* ---------------- options ---------------- */
const OPTS = [
  { k: 'diff', label: "Difficulté de l'ordi", vals: ['facile', 'normal', 'difficile'], txt: { facile: 'Facile', normal: 'Normal', difficile: 'Difficile' } },
  { k: 'gfx', label: 'Graphismes', vals: ['vhs', 'ps1', 'ps2', 'hd'], txt: { vhs: 'Rétro cassette VHS', ps1: 'Rétro PS1', ps2: 'PS2 propre', hd: 'Haute définition' } },
  { k: 'time', label: "Durée d'une manche", vals: [60, 99, 0], txt: { 60: '60 secondes', 99: '99 secondes', 0: 'Illimitée' } },
  { k: 'rounds', label: 'Manches pour gagner', vals: [1, 2, 3], txt: { 1: '1', 2: '2', 3: '3' } },
  { k: 'sound', label: 'Son', vals: [true, false], txt: { true: 'Oui', false: 'Non' } },
  { k: 'padSwap', label: 'Manettes J1 et J2', vals: [false, true], txt: { false: 'Normales', true: 'Inversées' } },
  { act: 'fs', label: 'Plein écran', txt: 'Basculer' },
  { act: 'classic', label: 'Ancienne version 2D', txt: 'Ouvrir' },
];
let optI = 0;
function openOptions() { showScreen('options'); optI = 0; renderOpts(); }
function renderOpts() {
  const L = $('#optList'); L.innerHTML = '';
  OPTS.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt' + (i === optI ? ' on' : '') + (o.act ? ' action' : '');
    b.innerHTML = `<span>${o.label}</span><b>${o.act ? o.txt : o.txt[String(store.opts[o.k])]}</b>`;
    b.addEventListener('mouseenter', () => { optI = i; renderOpts(); });
    b.addEventListener('click', () => { optI = i; optChange(1, true); });
    L.appendChild(b);
  });
}
function optChange(d, click) {
  const o = OPTS[optI];
  if (o.act) { if (o.act === 'fs') fullscreen(); else location.href = 'classic/'; return; }
  const i = o.vals.indexOf(store.opts[o.k]); store.opts[o.k] = o.vals[(i + d + o.vals.length) % o.vals.length];
  if (o.k === 'gfx') view.resize();
  sfx('move'); save(saveWarn); renderOpts();
}
function optionsFrame() {
  const m = menuInput('any');
  if (m.up) { optI = (optI + OPTS.length - 1) % OPTS.length; sfx('move'); renderOpts(); }
  if (m.down) { optI = (optI + 1) % OPTS.length; sfx('move'); renderOpts(); }
  if (m.left) optChange(-1); if (m.right) optChange(1);
  if (m.ok && OPTS[optI].act) optChange(1);
  if (m.back) { sfx('back'); openTitle(); }
  show.orbit += .003; tickShow(true); view.camShow(-.3, .3, show.orbit);
}
function fullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => { }); return; }
  if (!el.requestFullscreen) { toast("Le plein écran n'est pas disponible ici. Appuie sur F11."); return; }
  el.requestFullscreen().catch(() => toast("Le plein écran n'est pas disponible ici. Appuie sur F11."));
}

/* ---------------- atelier ---------------- */
function openWorkshop() { showScreen('workshop'); buildWorkshop(); }
function closeWorkshop() { show.dirty = true; openTitle(); }
$('#wsBack').addEventListener('click', closeWorkshop);
function paintPreview(cv, def, c, two) {
  const g = cv.getContext('2d'), S = cv.width, r = S / 2;
  g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(r, r, r - 4, 0, TAU); g.clip();
  g.fillStyle = def.kind === 'cats' ? (two ? c.color2 : c.color) : c.skin; g.fillRect(0, 0, S, S);
  let fc;
  if (def.kind === 'cats') { fc = cvs(256, 256); const crop = two ? { zoom: c.zoom2, ox: c.ox2, oy: c.oy2 } : c;
    drawFaceCanvas(fc, img(two ? c.photo2 : c.photo, () => paintPreview(cv, def, c, two)), crop, realCatFace(two ? '#9ccf4f' : '#c9a43a')); }
  else fc = faceTexFor(def, c, img, () => paintPreview(cv, def, c, two), 256);
  g.drawImage(fc, 0, 0, S, S); g.restore();
  g.lineWidth = 6; g.strokeStyle = c.color; g.beginPath(); g.arc(r, r, r - 4, 0, TAU); g.stroke();
}
function faceBox(def, c, two, label) {
  const k = two ? '2' : '', box = document.createElement('div'); box.className = 'facebox';
  box.innerHTML = `${label ? `<span>${label}</span>` : ''}<canvas class="face" width="260" height="260"></canvas>
    <label class="zoom">Zoom<input type="range" min="1" max="3" step="0.05" value="${c['zoom' + k] || 1}"></label>
    <label class="btn file">${c['photo' + k] ? 'Changer la photo' : 'Choisir une photo'}<input type="file" accept="image/*"></label>`;
  const cv = box.querySelector('canvas'), zm = box.querySelector('input[type=range]'), fi = box.querySelector('input[type=file]');
  const redraw = () => paintPreview(cv, def, c, two);
  zm.oninput = () => { c['zoom' + k] = +zm.value; redraw(); save(saveWarn); };
  fi.onchange = () => { const f = fi.files[0]; if (!f) return; readPhoto(f, 420, url => { c['photo' + k] = url; c['zoom' + k] = 1; c['ox' + k] = 0; c['oy' + k] = 0; zm.value = 1; fi.parentElement.firstChild.textContent = 'Changer la photo'; redraw(); save(saveWarn); }, () => toast("Cette image n'a pas pu être lue. Essaie une photo en JPG ou PNG.")); fi.value = ''; };
  let drag = null;
  cv.addEventListener('pointerdown', e => { if (!c['photo' + k]) return; drag = { x: e.clientX, y: e.clientY, ox: c['ox' + k], oy: c['oy' + k] }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; const r = cv.clientWidth / 2; c['ox' + k] = Math.max(-2, Math.min(2, drag.ox + (e.clientX - drag.x) / r)); c['oy' + k] = Math.max(-2, Math.min(2, drag.oy + (e.clientY - drag.y) / r)); redraw(); });
  const end = () => { if (drag) { drag = null; save(saveWarn); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => { if (!c['photo' + k]) return; e.preventDefault(); c['zoom' + k] = Math.max(1, Math.min(3, (c['zoom' + k] || 1) - e.deltaY * .002)); zm.value = c['zoom' + k]; redraw(); save(saveWarn); }, { passive: false });
  redraw(); box.redraw = redraw;
  return box;
}
function buildWorkshop() {
  const G = $('#wsGrid'); G.innerHTML = '';
  const powOpts = Object.entries(POWERS).map(([k, p]) => `<option value="${k}">${p.name} (jauge ${p.cost} %)</option>`).join('');
  CHARS.forEach(def => {
    const c = cust(def.id), cats = def.kind === 'cats';
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<h3>${esc(CHARS.find(x => x.id === def.id).name)}</h3><div class="tg">${def.tag}${cats ? ' · une photo par chat' : ''}</div>
      <div class="faces${cats ? ' duo' : ''}"></div><div class="hint">Glisse la photo pour centrer le visage, molette pour zoomer</div>
      <input class="name" maxlength="20" aria-label="Nom affiché">
      <div class="colors">${cats
        ? `<label>Pelage 1<input type="color" data-k="color"></label><label>Pelage 2<input type="color" data-k="color2"></label>`
        : `<label>Haut<input type="color" data-k="color"></label><label>Bas<input type="color" data-k="color2"></label><label>Peau<input type="color" data-k="skin"></label><label>Cheveux<input type="color" data-k="hairCol"></label>`}</div>
      <label class="fld">Pouvoir<select>${powOpts}</select></label><p class="pd"></p>`;
    const faces = card.querySelector('.faces'), boxes = [faceBox(def, c, false, cats ? def.catNames[0] + ' (le gros)' : '')];
    if (cats) boxes.push(faceBox(def, c, true, def.catNames[1] + ' (le petit)'));
    boxes.forEach(b => faces.appendChild(b));
    const nm = card.querySelector('.name'); nm.value = c.name; nm.oninput = () => { c.name = nm.value || def.name; save(saveWarn); };
    card.querySelectorAll('input[type=color]').forEach(inp => { inp.value = c[inp.dataset.k]; inp.oninput = () => { c[inp.dataset.k] = inp.value; boxes.forEach(b => b.redraw()); save(saveWarn); }; });
    const ps = card.querySelector('select'), pd = card.querySelector('.pd');
    const desc = () => { const P = POWERS[c.power]; pd.innerHTML = `${P.desc} <b>Coûte ${P.cost} % de jauge.</b>`; };
    ps.value = c.power; desc(); ps.onchange = () => { c.power = ps.value; desc(); save(saveWarn); };
    G.appendChild(card);
  });
  paintDecor();
}
function paintDecor() {
  const cv = $('#decorPrev'), g = cv.getContext('2d');
  g.drawImage(photoBackdrop(img(store.stagePhoto, paintDecor)), 0, 0, cv.width, cv.height);
  $('#decorDel').hidden = !store.stagePhoto;
}
$('#decorFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  readPhoto(f, 1280, url => { if (!saveDecor(url)) toast("La photo de décor est trop lourde pour être gardée après fermeture."); paintDecor(); if (view.stageId === 'photo') view.setStage('photo', true); }, () => toast("Cette image n'a pas pu être lue."));
  e.target.value = '';
});
$('#decorDel').addEventListener('click', () => { saveDecor(null); paintDecor(); });

/* ---------------- tactile ---------------- */
$$('#touch button').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); touch.held[k] = true; touch.pressed.add(k); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) { } audioInit(); };
  const off = () => { touch.held[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

/* ---------------- boucle ---------------- */
let last = 0, frameN = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min(100, ts - (last || ts)); last = ts; frameN++;
  poll();
  if (screen === 'workshop') { endFrame(); return; }
  const sc = screen;
  if (sc === 'title') titleFrame();
  else if (sc === 'select') selectFrame();
  else if (sc === 'options') optionsFrame();
  if (sc === 'fight' && screen === 'fight') fightFrame(dt); else endFrame();
  view.render();
  if (screen === 'fight') view.drawFight(fight); else view.hudBegin();
  if (screen !== 'workshop') view.osd(screen === 'fight');
  if (frameN % 30 === 0 && screen === 'title') $('#padLine').innerHTML = padText();
}
addEventListener('resize', () => view.resize());
addEventListener('gamepadconnected', () => toast('Manette connectée'));
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'fight' && fight && fight.phase !== 'over') setPause(true); });
if (document.fonts) document.fonts.load('20px "Russo One"').catch(() => { });
window.__baston = { get fight() { return fight; }, get screen() { return screen; }, view };
openTitle();
$('#padLine').innerHTML = padText();
requestAnimationFrame(loop);
