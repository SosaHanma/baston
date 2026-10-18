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
