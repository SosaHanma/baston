// Textures dessinées à la main dans des canvas (petites, floues : style PS2)
const TAU = Math.PI * 2;
export function cvs(w, h, repeat = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; c._repeat = repeat; return c; }
export function bump(c) { c._v = (c._v || 0) + 1; }
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function noise(g, w, h, n, col, rnd, size = 2) { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(rnd() * w, rnd() * h, size, size); }

/* ---------- Visages ---------- */
// photo recadrée, bords fondus pour se mêler à la peau de la tête
export function drawFaceCanvas(c, img, crop, fallback) {
  const g = c.getContext('2d'), S = c.width, r = S / 2;
  g.clearRect(0, 0, S, S);
  if (img) {
    const sc = Math.max(S / img.width, S / img.height) * (crop.zoom || 1), w = img.width * sc, h = img.height * sc;
    g.drawImage(img, r - w / 2 + (crop.ox || 0) * r, r - h / 2 + (crop.oy || 0) * r, w, h);
    g.globalCompositeOperation = 'destination-in';
    const gr = g.createRadialGradient(r, r, r * .55, r, r, r);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.62, 'rgba(0,0,0,1)'); gr.addColorStop(.94, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'source-over';
  } else fallback(g, S);
  bump(c);
}
export function cartoonHuman(look) {
  return (g, S) => {
    const r = S / 2, ink = '#1a1226';
    for (const s of [-1, 1]) {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(r + s * r * .3, r * .95, r * .14, r * .17, 0, 0, TAU); g.fill();
      g.fillStyle = ink; g.beginPath(); g.arc(r + s * r * .3 + r * .03, r * 1.0, r * .075, 0, TAU); g.fill();
      g.strokeStyle = ink; g.lineWidth = r * .07; g.lineCap = 'round'; g.beginPath(); g.moveTo(r + s * r * .47, r * .68); g.lineTo(r + s * r * .14, r * .76); g.stroke();
    }
    g.fillStyle = 'rgba(200,80,80,.35)'; g.beginPath(); g.arc(r - r * .5, r * 1.3, r * .12, 0, TAU); g.arc(r + r * .5, r * 1.3, r * .12, 0, TAU); g.fill();
    g.strokeStyle = ink; g.lineWidth = r * .07;
    if (look === 'kid') { g.fillStyle = '#7a2230'; g.beginPath(); g.arc(r, r * 1.35, r * .2, 0, Math.PI); g.fill(); }
    else { g.beginPath(); g.arc(r, r * 1.3, r * .22, .25, Math.PI - .25); g.stroke(); }
  };
}
export function cartoonCat(eye = '#7ed957') {
  return (g, S) => {
    const r = S / 2, ink = '#1a1226';
    for (const s of [-1, 1]) {
      g.fillStyle = eye; g.beginPath(); g.ellipse(r + s * r * .32, r * .92, r * .16, r * .2, s * .25, 0, TAU); g.fill();
      g.fillStyle = ink; g.beginPath(); g.ellipse(r + s * r * .32, r * .92, r * .04, r * .16, 0, 0, TAU); g.fill();
    }
    g.fillStyle = '#ff8fa8'; g.beginPath(); g.moveTo(r - r * .1, r * 1.18); g.lineTo(r + r * .1, r * 1.18); g.lineTo(r, r * 1.3); g.fill();
    g.strokeStyle = ink; g.lineWidth = r * .04;
    g.beginPath(); g.moveTo(r, r * 1.3); g.lineTo(r, r * 1.4); g.arc(r - r * .1, r * 1.4, r * .1, 0, Math.PI); g.moveTo(r, r * 1.4); g.arc(r + r * .1, r * 1.4, r * .1, Math.PI, 0, true); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = r * .025;
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(r + s * r * .2, r * 1.3 + k * r * .05); g.lineTo(r + s * r * .85, r * 1.24 + k * r * .14); g.stroke(); }
  };
}

/* ---------- Matières ---------- */
export function planks() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(3);
  for (let i = 0; i < 4; i++) { const y = i * 32; g.fillStyle = ['#8a5a36', '#7c4f2f', '#93613a', '#82552f'][i]; g.fillRect(0, y, 128, 32);
    g.fillStyle = 'rgba(40,20,8,.6)'; g.fillRect(0, y, 128, 2); const off = (i * 47) % 128; g.fillRect(off, y, 2, 32); g.fillRect((off + 64) % 128, y, 2, 32);
    g.strokeStyle = 'rgba(60,30,10,.25)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(0, y + 6 + k * 5 + rnd() * 2); g.bezierCurveTo(40, y + 4 + k * 5, 90, y + 9 + k * 5, 128, y + 6 + k * 5); g.stroke(); } }
  return c;
}
export function wallpaper() {
  const c = cvs(128, 128, true), g = c.getContext('2d');
  g.fillStyle = '#2f6b6a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#377a78'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 128);
  g.fillStyle = 'rgba(255,241,220,.16)'; for (let x = 8; x < 128; x += 32) for (let y = 8; y < 128; y += 32) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.fill(); }
  return c;
}
export function grass() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(9);
  g.fillStyle = '#4f9a3c'; g.fillRect(0, 0, 128, 128);
  noise(g, 128, 128, 900, 'rgba(30,90,30,.5)', rnd, 2); noise(g, 128, 128, 500, 'rgba(140,200,90,.45)', rnd, 2); noise(g, 128, 128, 14, '#f4f0dc', rnd, 3);
  return c;
}
export function zinc() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(5);
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#6d6a93'); gr.addColorStop(.5, '#7c79a3'); gr.addColorStop(1, '#6d6a93');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(30,25,55,.6)'; g.fillRect(0, 0, 3, 128); g.fillRect(64, 0, 3, 128);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(3, 0, 1, 128); g.fillRect(67, 0, 1, 128);
  noise(g, 128, 128, 200, 'rgba(20,15,40,.18)', rnd, 2);
  return c;
}
export function bricks() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(13);
  g.fillStyle = '#5a2a30'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 16 - 16; x < 128; x += 32) { g.fillStyle = `rgb(${130 + rnd() * 40 | 0},${55 + rnd() * 20 | 0},${50 + rnd() * 15 | 0})`; g.fillRect(x + 1, y + 1, 30, 14); }
  return c;
}
export function facade(seed, base, win) {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let y = 10; y < 128; y += 32) for (let x = 8; x < 128; x += 30) {
    g.fillStyle = rnd() < .45 ? win : 'rgba(20,15,40,.75)'; g.fillRect(x, y, 14, 20);
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x - 2, y + 20, 18, 3);
  }
  return c;
}
export function skyGradient(stops) {
  const c = cvs(4, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256); return c;
}
export function stars(base) {
  const c = cvs(512, 256), g = c.getContext('2d'), rnd = rng(17);
  const gr = g.createLinearGradient(0, 0, 0, 256); for (const [o, col] of base) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,245,225,${.3 + rnd() * .7})`; const y = rnd() * 130; g.fillRect(rnd() * 512, y, rnd() < .15 ? 2 : 1, rnd() < .15 ? 2 : 1); }
  return c;
}
export function glow(col = '255,220,140') {
  const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(.35, `rgba(${col},.55)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
export function blob() {
  const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(.6, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
export function football() {
  const c = cvs(128, 64), g = c.getContext('2d');
  g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#16131f';
  const hex = (x, y, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); };
  for (let i = 0; i < 6; i++) { hex(i * 22 + 10, 18, 7); hex(i * 22 + 21, 44, 7); }
  return c;
}
export function fur(col) {
  const c = cvs(64, 64, true), g = c.getContext('2d'), rnd = rng(21);
  g.fillStyle = col; g.fillRect(0, 0, 64, 64); noise(g, 64, 64, 300, 'rgba(0,0,0,.12)', rnd, 1); noise(g, 64, 64, 200, 'rgba(255,255,255,.12)', rnd, 1);
  return c;
}
export function rug() {
  const c = cvs(128, 128), g = c.getContext('2d');
  g.fillStyle = '#b8323f'; g.beginPath(); g.arc(64, 64, 64, 0, TAU); g.fill();
  g.strokeStyle = '#e9b44c'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke();
  g.strokeStyle = '#7a1f2a'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 40, 0, TAU); g.stroke();
  g.fillStyle = '#e9b44c'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.arc(64 + Math.cos(a) * 24, 64 + Math.sin(a) * 24, 4, 0, TAU); g.fill(); }
  return c;
}
export function windowNight() {
  const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, '#0f1a40'); gr.addColorStop(1, '#3b4f8f'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#f5e9c8'; g.beginPath(); g.arc(44, 16, 8, 0, TAU); g.fill(); g.fillStyle = '#0f1a40'; g.beginPath(); g.arc(40, 14, 7, 0, TAU); g.fill();
  g.fillStyle = '#1c2450'; for (let i = 0; i < 6; i++) g.fillRect(i * 11, 46 - (i % 3) * 6, 10, 20);
  g.fillStyle = '#ffcf7a'; g.fillRect(4, 52, 2, 3); g.fillRect(26, 48, 2, 3); g.fillRect(48, 54, 2, 3);
  return c;
}
export function tvScreen() {
  const c = cvs(64, 32), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 64, 32);
  gr.addColorStop(0, '#2c6fa8'); gr.addColorStop(1, '#13284a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 32);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(4, 2); g.lineTo(24, 2); g.lineTo(10, 30); g.lineTo(4, 30); g.fill();
  return c;
}
export function painting() {
  const c = cvs(64, 64), g = c.getContext('2d');
  g.fillStyle = '#f3e2bd'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#e0603a'; g.beginPath(); g.arc(24, 34, 14, 0, TAU); g.fill();
  g.fillStyle = '#2f6b6a'; g.beginPath(); g.arc(42, 26, 10, 0, TAU); g.fill(); g.fillStyle = '#e9b44c'; g.fillRect(10, 50, 44, 4);
  return c;
}
export function houseWall() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(31);
  g.fillStyle = '#efe0c6'; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 400, 'rgba(120,90,60,.12)', rnd, 2);
  return c;
}
export function shutters() {
  const c = cvs(64, 64), g = c.getContext('2d');
  g.fillStyle = '#3d7a9c'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffd88a'; g.fillRect(14, 8, 36, 48);
  g.fillStyle = '#efe3cf'; g.fillRect(30, 8, 4, 48); g.fillRect(14, 30, 36, 4);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 4; y < 64; y += 6) { g.fillRect(0, y, 12, 2); g.fillRect(52, y, 12, 2); }
  return c;
}
export function photoBackdrop(img) {
  const c = cvs(1024, 512), g = c.getContext('2d');
  if (img) { const sc = Math.max(1024 / img.width, 512 / img.height), w = img.width * sc, h = img.height * sc; g.drawImage(img, (1024 - w) / 2, (512 - h) / 2, w, h); }
  else { const gr = g.createRadialGradient(512, 200, 40, 512, 260, 620); gr.addColorStop(0, '#7a64c8'); gr.addColorStop(1, '#1d1640'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let x = 0; x <= 1024; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); } for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    g.fillStyle = '#fff1dc'; g.font = '44px "Russo One", Impact, sans-serif'; g.textAlign = 'center'; g.fillText('Mets ta photo de décor dans l\'Atelier', 512, 200); }
  return c;
}

/* ================= Style réaliste (persos + décors de nuit) ================= */
// visage par défaut réaliste (en attendant la photo)
export function realFace(kind = 'adult', fem = false) {
  return (g, S) => {
    const r = S / 2, k = kind === 'kid';
    const sh = g.createRadialGradient(r, r * 1.05, r * .2, r, r, r);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.75, 'rgba(0,0,0,.05)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(0, 0, S, S);
    const ey = r * (k ? .98 : .9), ex = r * (k ? .3 : .27);
    for (const s of [-1, 1]) {
      g.fillStyle = 'rgba(60,35,25,.85)'; g.beginPath(); g.ellipse(r + s * ex, ey - r * .17, r * .15, r * .035, s * -.12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2ece4'; g.beginPath(); g.ellipse(r + s * ex, ey, r * .1, r * .05, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a2e1c'; g.beginPath(); g.arc(r + s * ex, ey, r * .045, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#120c08'; g.beginPath(); g.arc(r + s * ex, ey, r * .02, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(40,20,12,.7)'; g.lineWidth = r * .02; g.beginPath(); g.ellipse(r + s * ex, ey, r * .1, r * .05, 0, Math.PI, Math.PI * 2); g.stroke();
      if (fem) { g.lineWidth = r * .025; g.beginPath(); g.moveTo(r + s * (ex + r * .1), ey - r * .01); g.lineTo(r + s * (ex + r * .14), ey - r * .05); g.stroke(); }
    }
    g.fillStyle = 'rgba(90,50,30,.22)'; g.beginPath(); g.moveTo(r - r * .04, ey + r * .02); g.lineTo(r - r * .07, ey + r * .3); g.lineTo(r + r * .07, ey + r * .3); g.lineTo(r + r * .03, ey + r * .02); g.fill();
    g.fillStyle = 'rgba(60,30,20,.45)'; g.beginPath(); g.ellipse(r - r * .05, ey + r * .31, r * .03, r * .015, 0, 0, Math.PI * 2); g.ellipse(r + r * .05, ey + r * .31, r * .03, r * .015, 0, 0, Math.PI * 2); g.fill();
    const my = ey + r * (k ? .48 : .52);
    g.fillStyle = fem ? 'rgba(170,70,80,.75)' : 'rgba(140,70,60,.6)';
    g.beginPath(); g.ellipse(r, my, r * .15, r * .035, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,20,20,.6)'; g.lineWidth = r * .015; g.beginPath(); g.moveTo(r - r * .15, my); g.quadraticCurveTo(r, my + r * .015, r + r * .15, my); g.stroke();
    if (!fem && !k) { g.fillStyle = 'rgba(40,25,20,.12)'; g.beginPath(); g.ellipse(r, my + r * .12, r * .38, r * .22, 0, 0, Math.PI * 2); g.fill(); }
  };
}
export function realCatFace(eye = '#9ccf4f') {
  return (g, S) => {
    const r = S / 2;
    for (const s of [-1, 1]) {
      g.fillStyle = eye; g.beginPath(); g.ellipse(r + s * r * .3, r * .9, r * .13, r * .1, s * .3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0d0a08'; g.beginPath(); g.ellipse(r + s * r * .3, r * .9, r * .03, r * .09, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(20,12,8,.8)'; g.lineWidth = r * .03; g.beginPath(); g.ellipse(r + s * r * .3, r * .9, r * .13, r * .1, s * .3, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(r + s * r * .3 - r * .04, r * .86, r * .02, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(r, r * 1.3, r * .3, r * .2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c97a86'; g.beginPath(); g.moveTo(r - r * .08, r * 1.16); g.lineTo(r + r * .08, r * 1.16); g.lineTo(r, r * 1.26); g.fill();
    g.strokeStyle = 'rgba(30,20,15,.7)'; g.lineWidth = r * .025;
    g.beginPath(); g.moveTo(r, r * 1.26); g.lineTo(r, r * 1.34); g.moveTo(r, r * 1.34); g.quadraticCurveTo(r - r * .08, r * 1.42, r - r * .14, r * 1.36); g.moveTo(r, r * 1.34); g.quadraticCurveTo(r + r * .08, r * 1.42, r + r * .14, r * 1.36); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = r * .012;
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(r + s * r * .18, r * 1.3 + k * r * .04); g.lineTo(r + s * r * .9, r * 1.24 + k * r * .12); g.stroke(); }
  };
}
// tissus (en niveaux de gris : la couleur du perso vient du matériau)
export function cloth(kind) {
  const c = cvs(256, 128, true), g = c.getContext('2d'), rnd = rng(kind.length * 31 + 7);
  g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.08)'; g.fillRect(rnd() * 256, rnd() * 128, 1, 1); }
  // plis du tissu
  for (let i = 0; i < 14; i++) { const y = rnd() * 128, x = rnd() * 256, gr = g.createLinearGradient(0, y - 4, 0, y + 4); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 30, y - 4, 60 + rnd() * 40, 8); }
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 0, 2, 128); g.fillRect(127, 0, 2, 128);
  if (kind === 'hoodie') { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5; for (const x of [57, 71]) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 1, 22, x - 1, 40); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x - 2, 38, 4, 6); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(30, 92, 68, 3); g.fillRect(30, 92, 3, 36); g.fillRect(95, 92, 3, 36); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 118, 256, 10); }
  if (kind === 'tshirt') { g.fillStyle = 'rgba(255,255,255,.88)'; g.font = 'bold 15px Impact, sans-serif'; g.textAlign = 'center'; g.fillText('BASTON', 64, 52); g.fillRect(44, 58, 40, 3); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, 0, 256, 4); }
  if (kind === 'jacket') { g.fillStyle = 'rgba(20,20,20,.6)'; g.fillRect(62, 0, 4, 128); g.fillStyle = 'rgba(200,200,200,.7)'; for (let y = 2; y < 128; y += 5) g.fillRect(63, y, 2, 2);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(40, 0); g.lineTo(62, 26); g.lineTo(62, 0); g.fill(); g.beginPath(); g.moveTo(88, 0); g.lineTo(66, 26); g.lineTo(66, 0); g.fill();
    g.fillRect(24, 80, 26, 3); g.fillRect(78, 80, 26, 3); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(70, 10, 20, 100); }
  if (kind === 'jeans') { g.fillStyle = '#d2d9e6'; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 4000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(15,25,60,.13)' : 'rgba(255,255,255,.16)'; g.fillRect(rnd() * 256, rnd() * 128, 2, 1); }
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(rnd() * 256, rnd() * 128, 30, 4); }
    g.fillStyle = 'rgba(190,130,50,.75)'; g.fillRect(0, 0, 1.5, 128); g.fillRect(128, 0, 1.5, 128); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(40, 0, 50, 2); }
  if (kind === 'jogging') { g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(251, 0, 5, 128); g.fillRect(0, 0, 5, 128); g.fillRect(124, 0, 8, 128); }
  return c;
}
export function hairTex() {
  const c = cvs(64, 64, true), g = c.getContext('2d'), rnd = rng(77);
  g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 260; i++) { g.strokeStyle = rnd() < .5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.2)'; g.lineWidth = 1; const x = rnd() * 64, y = rnd() * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 4, y + 6 + rnd() * 8); g.stroke(); }
  return c;
}
export function tabby(stripes = true) {
  const c = cvs(64, 64, true), g = c.getContext('2d'), rnd = rng(55);
  g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 64, 64);
  if (stripes) { g.fillStyle = 'rgba(0,0,0,.28)'; for (let x = 0; x < 64; x += 11) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 5, 32, x - 2, 64); g.lineTo(x + 4, 64); g.quadraticCurveTo(x + 10, 32, x + 4, 0); g.fill(); } }
  noise(g, 64, 64, 500, 'rgba(0,0,0,.1)', rnd, 1); noise(g, 64, 64, 300, 'rgba(255,255,255,.18)', rnd, 1);
  return c;
}
/* ---------- décors ---------- */
export function lino() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(101);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#b9b39d' : '#8e8a7c'; g.fillRect(x * 32, y * 32, 32, 32); }
  noise(g, 128, 128, 900, 'rgba(40,35,25,.12)', rnd, 2);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(50,40,25,.1)'; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 128, 8 + rnd() * 20, 4 + rnd() * 10, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 32, 0, 1, 128); g.fillRect(0, i * 32, 128, 1); }
  return c;
}
export function ceilingTiles() {
  const c = cvs(64, 64, true), g = c.getContext('2d'), rnd = rng(5);
  g.fillStyle = '#9a988e'; g.fillRect(0, 0, 64, 64); noise(g, 64, 64, 400, 'rgba(0,0,0,.12)', rnd, 1);
  g.fillStyle = '#5f5d57'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 0, 2, 64); g.fillRect(31, 0, 2, 64); g.fillRect(0, 31, 64, 2);
  return c;
}
export function paintWall(base = '#6f7a6a') {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(19);
  g.fillStyle = base; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 1400, 'rgba(0,0,0,.08)', rnd, 2); noise(g, 128, 128, 500, 'rgba(255,255,255,.05)', rnd, 2);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(40,30,10,.08)'; g.fillRect(rnd() * 128, rnd() * 60 + 60, 3 + rnd() * 6, 30 + rnd() * 40); }
  return c;
}
export function vhsShelf() {
  const c = cvs(256, 128, true), g = c.getContext('2d'), rnd = rng(61);
  g.fillStyle = '#2a2420'; g.fillRect(0, 0, 256, 128);
  const cols = ['#c0392b', '#1f3a93', '#f1c40f', '#111111', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1', '#2c3e50', '#d35400', '#16a085', '#7f8c8d'];
  for (let row = 0; row < 4; row++) {
    const y = row * 32; g.fillStyle = '#4a3d33'; g.fillRect(0, y + 28, 256, 4);
    let x = 2; while (x < 254) { const w = 7 + (rnd() * 3 | 0); g.fillStyle = cols[rnd() * cols.length | 0]; g.fillRect(x, y + 3, w - 1, 25);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 1, y + 6, w - 3, 2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 1, y + 12 + (rnd() * 6 | 0), w - 3, 6); x += w; }
  }
  return c;
}
export function poster(title, sub, hue) {
  const c = cvs(64, 96), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 96);
  gr.addColorStop(0, `hsl(${hue},60%,20%)`); gr.addColorStop(1, '#050305'); g.fillStyle = gr; g.fillRect(0, 0, 64, 96);
  g.fillStyle = `hsl(${hue},80%,55%)`; g.beginPath(); g.arc(32, 46, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#050305'; g.beginPath(); g.ellipse(32, 60, 11, 20, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(32, 36, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f4ead2'; g.font = 'bold 9px Impact, sans-serif'; g.textAlign = 'center';
  title.split('\n').forEach((l, i) => g.fillText(l, 32, 12 + i * 10));
  g.font = '6px sans-serif'; g.fillStyle = 'rgba(244,234,210,.7)'; g.fillText(sub, 32, 90);
  g.strokeStyle = '#d8d0c0'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 94);
  return c;
}
export function neon(text, col = '#ff3fa4') {
  const c = cvs(512, 128), g = c.getContext('2d');
  g.font = 'italic 84px "Russo One", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 24; g.strokeStyle = col; g.lineWidth = 6; g.strokeText(text, 256, 66);
  g.shadowBlur = 0; g.fillStyle = '#fff2fa'; g.fillText(text, 256, 66); g.lineWidth = 2; g.strokeText(text, 256, 66);
  return c;
}
export function crtStatic() {
  const c = cvs(64, 48), g = c.getContext('2d'), rnd = rng(7);
  g.fillStyle = '#3a4a8a'; g.fillRect(0, 0, 64, 48); for (let i = 0; i < 900; i++) { const v = rnd() * 255 | 0; g.fillStyle = `rgba(${v},${v},${v},.6)`; g.fillRect(rnd() * 64, rnd() * 48, 1, 1); }
  g.fillStyle = '#ffffff'; g.font = '8px monospace'; g.fillText('PLAY ▶', 4, 10);
  return c;
}
export function asphalt() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(33);
  g.fillStyle = '#3a3a3e'; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 2500, 'rgba(0,0,0,.18)', rnd, 1); noise(g, 128, 128, 1500, 'rgba(255,255,255,.07)', rnd, 1);
  g.strokeStyle = 'rgba(15,15,18,.6)'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { let x = rnd() * 128, y = rnd() * 128; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - .5) * 30; y += (rnd() - .5) * 30; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(10,10,14,.25)'; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 128, 10 + rnd() * 14, 6 + rnd() * 8, 0, 0, Math.PI * 2); g.fill(); }
  return c;
}
export function brickDark() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(41);
  g.fillStyle = '#2a2224'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 12) for (let x = (y / 12 % 2) * 14 - 14; x < 128; x += 28) { const v = 70 + rnd() * 30 | 0; g.fillStyle = `rgb(${v + 20},${v - 20},${v - 25})`; g.fillRect(x + 1, y + 1, 26, 10); }
  noise(g, 128, 128, 600, 'rgba(0,0,0,.2)', rnd, 2);
  return c;
}
export function shopWindow() {
  const c = cvs(128, 64), g = c.getContext('2d'), sh = vhsShelf();
  g.drawImage(sh, 0, 0, 128, 64); g.fillStyle = 'rgba(255,230,170,.35)'; g.fillRect(0, 0, 128, 64);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(10, 0); g.lineTo(40, 0); g.lineTo(20, 64); g.lineTo(0, 64); g.fill();
  return c;
}
export function carGlass() {
  const c = cvs(32, 32), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 32, 32);
  gr.addColorStop(0, '#2a3346'); gr.addColorStop(.5, '#121722'); gr.addColorStop(1, '#3a465c'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return c;
}
export function whiteTiles() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(71);
  g.fillStyle = '#8f9590'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) { const v = 205 + rnd() * 25 | 0; g.fillStyle = `rgb(${v},${v + 3},${v - 4})`; g.fillRect(x + 1, y + 1, 14, 14); }
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(120,100,50,.12)'; g.fillRect(rnd() * 128, rnd() * 128, 4 + rnd() * 10, 10 + rnd() * 40); }
  return c;
}
export function floorTiles() {
  const c = cvs(128, 128, true), g = c.getContext('2d'), rnd = rng(17);
  g.fillStyle = '#2b2e2c'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) { const v = 90 + rnd() * 30 | 0; g.fillStyle = `rgb(${v},${v + 6},${v + 2})`; g.fillRect(x + .5, y + .5, 7, 7); }
  noise(g, 128, 128, 400, 'rgba(0,0,0,.15)', rnd, 2);
  return c;
}
export function wcSign() {
  const c = cvs(64, 64), g = c.getContext('2d');
  g.fillStyle = '#1e5aa8'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffffff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WC', 32, 34);
  return c;
}
export function graffiti() {
  const c = cvs(128, 64), g = c.getContext('2d');
  g.font = 'italic bold 20px Impact, sans-serif'; g.fillStyle = 'rgba(30,30,30,.75)'; g.save(); g.rotate(-.08); g.fillText('TIRE LA CHASSE !', 6, 34); g.restore();
  g.strokeStyle = 'rgba(30,30,30,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(100, 46, 9, 0, Math.PI * 2); g.stroke();
  return c;
}

/* ---------- chambre ---------- */
export function damask() {
  const c = cvs(256, 256, true), g = c.getContext('2d'), rnd = rng(201);
  g.fillStyle = '#b8ad97'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(120,105,80,.35)'; g.lineWidth = 3;
  for (let y = 0; y < 256; y += 64) for (let x = (y / 64 % 2) * 32; x < 256 + 32; x += 64) { g.beginPath(); g.ellipse(x, y + 32, 10, 22, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, y + 6); g.quadraticCurveTo(x + 18, y + 32, x, y + 58); g.quadraticCurveTo(x - 18, y + 32, x, y + 6); g.stroke(); }
  noise(g, 256, 256, 3000, 'rgba(0,0,0,.05)', rnd, 2);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(80,60,30,.05)'; g.fillRect(rnd() * 256, 150 + rnd() * 100, 10 + rnd() * 30, 60); }
  return c;
}
export function carpet() {
  const c = cvs(256, 256, true), g = c.getContext('2d'), rnd = rng(211);
  g.fillStyle = '#6e6a63'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12000; i++) { const v = rnd(); g.fillStyle = v < .4 ? 'rgba(0,0,0,.14)' : v < .8 ? 'rgba(255,255,255,.08)' : 'rgba(120,90,60,.12)'; g.fillRect(rnd() * 256, rnd() * 256, 1, 1); }
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(40,30,20,.08)'; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 20 + rnd() * 30, 10 + rnd() * 20, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
export function nightCity() {
  const c = cvs(256, 256), g = c.getContext('2d'), rnd = rng(221), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#0a1024'); gr.addColorStop(.6, '#1a2440'); gr.addColorStop(1, '#2a2a3a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9; i++) { const x = i * 30 - 10 + rnd() * 10, h = 60 + rnd() * 110, w = 26 + rnd() * 14; g.fillStyle = `rgb(${16 + rnd() * 10 | 0},${18 + rnd() * 10 | 0},${30 + rnd() * 10 | 0})`; g.fillRect(x, 256 - h, w, h);
    for (let y = 256 - h + 6; y < 250; y += 9) for (let xx = x + 3; xx < x + w - 4; xx += 7) if (rnd() < .35) { g.fillStyle = rnd() < .7 ? 'rgba(255,214,140,.9)' : 'rgba(170,200,255,.8)'; g.fillRect(xx, y, 3, 4); } }
  g.fillStyle = 'rgba(255,170,90,.8)'; for (let i = 0; i < 6; i++) g.fillRect(rnd() * 256, 238 + rnd() * 12, 2, 2);
  g.fillStyle = 'rgba(240,240,255,.8)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * 256, rnd() * 80, 1, 1);
  return c;
}
export function tapestry() {
  const c = cvs(128, 256), g = c.getContext('2d'), rnd = rng(231);
  g.fillStyle = '#6a1418'; g.fillRect(0, 0, 128, 256);
  g.strokeStyle = '#c9a050'; g.lineWidth = 4; g.strokeRect(8, 8, 112, 240); g.lineWidth = 2; g.strokeRect(16, 16, 96, 224);
  g.fillStyle = '#1e2a4a'; g.fillRect(22, 22, 84, 212);
  for (let y = 36; y < 230; y += 28) for (let x = 36; x < 100; x += 28) { g.fillStyle = '#9a2a24'; g.beginPath(); g.moveTo(x + 7, y - 9); g.lineTo(x + 16, y); g.lineTo(x + 7, y + 9); g.lineTo(x - 2, y); g.fill(); g.fillStyle = '#d9b260'; g.fillRect(x + 5, y - 2, 4, 4); }
  noise(g, 128, 256, 2500, 'rgba(0,0,0,.15)', rnd, 1);
  g.fillStyle = '#d9c7a0'; for (let x = 4; x < 124; x += 4) g.fillRect(x, 250, 2, 6);
  return c;
}
export function woodDark() {
  const c = cvs(256, 128, true), g = c.getContext('2d'), rnd = rng(241);
  g.fillStyle = '#4a2f1e'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 60; i++) { g.strokeStyle = rnd() < .5 ? 'rgba(20,10,5,.25)' : 'rgba(120,80,50,.18)'; g.lineWidth = 1 + rnd() * 2; const y = rnd() * 128; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (rnd() - .5) * 10, 170, y + (rnd() - .5) * 10, 256, y + (rnd() - .5) * 6); g.stroke(); }
  return c;
}
export function quilt() {
  const c = cvs(256, 256, true), g = c.getContext('2d'), rnd = rng(251);
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, y, 256, 2); }
  for (let x = 0; x < 256; x += 32) { g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(x, 0, 2, 256); }
  noise(g, 256, 256, 3000, 'rgba(0,0,0,.05)', rnd, 1);
  return c;
}
export function photoFrame(seed) {
  const c = cvs(64, 64), g = c.getContext('2d'), rnd = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, `hsl(${rnd() * 360},30%,55%)`); gr.addColorStop(1, `hsl(${rnd() * 360},25%,25%)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(30,20,15,.6)'; g.beginPath(); g.arc(24, 30, 8, 0, Math.PI * 2); g.arc(42, 32, 7, 0, Math.PI * 2); g.fill(); g.fillRect(14, 38, 20, 26); g.fillRect(34, 39, 17, 25);
  return c;
}
