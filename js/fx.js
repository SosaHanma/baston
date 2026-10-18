// Effets spéciaux 3D : particules groupées (lueurs, anneaux, étoiles, fumée, traînées)
// Toutes les positions sont en mètres dans le monde. Les pouvoirs se composent avec ces briques.
import { cvs } from './textures.js';

const TAU = Math.PI * 2, R = Math.random;
function atlas() {
  const c = cvs(256, 64), g = c.getContext('2d');
  // 0 : lueur douce
  let gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  // 1 : anneau
  gr = g.createRadialGradient(96, 32, 18, 96, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(64, 0, 64, 64);
  // 2 : étoile / éclat
  g.save(); g.translate(160, 32);
  for (const [w, l] of [[3, 30], [2, 20]]) for (let i = 0; i < 4; i++) { g.rotate(i ? Math.PI / 2 : (l === 20 ? Math.PI / 4 : 0)); const lg = g.createLinearGradient(-l, 0, l, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(-l, -w / 2, 2 * l, w); }
  g.restore();
  gr = g.createRadialGradient(160, 32, 0, 160, 32, 10); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(128, 0, 64, 64);
  // 3 : fumée
  for (let i = 0; i < 9; i++) { const x = 224 + (R() - .5) * 24, y = 32 + (R() - .5) * 24, r = 10 + R() * 12; gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(192, 0, 64, 64); }
  return c;
}
const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const C = c => typeof c === 'string' ? hex(c) : c;

export class FX {
  constructor() { this.list = []; this.tex = atlas(); this.add = new Float32Array(9 * 6 * 3000); this.alp = new Float32Array(9 * 6 * 1500); }
  clear() { this.list = []; }
  spawn(o) {
    if (this.list.length > 2800) return;
    const p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 30, size: .2, size1: null, col: [1, 1, 1], col1: null, alpha: 1, cell: 0, add: true, drag: 1, grav: 0, rot: R() * TAU, rotv: 0, streak: 0, ...o };
    p.col = C(p.col); if (p.col1) p.col1 = C(p.col1); p.max = p.life; this.list.push(p); return p;
  }
  update() {
    for (const p of this.list) { p.vx *= p.drag; p.vy = p.vy * p.drag - p.grav; p.vz *= p.drag; p.x += p.vx; p.y += p.vy; p.z += p.vz; p.rot += p.rotv; p.life--; }
    this.list = this.list.filter(p => p.life > 0);
  }
  // remplit les tampons et dessine (appelé pendant le rendu)
  draw(Rd, view) {
    const rx = view[0], ry = view[4], rz = view[8], ux = view[1], uy = view[5], uz = view[9], fx = -view[2], fy = -view[6], fz = -view[10];
    let na = 0, nb = 0;
    for (const p of this.list) {
      const t = 1 - p.life / p.max, s = p.size1 != null ? p.size + (p.size1 - p.size) * t : p.size;
      const a = p.alpha * (t < .1 ? t / .1 : 1) * (1 - Math.pow(t, 2));
      const col = p.col1 ? [p.col[0] + (p.col1[0] - p.col[0]) * t, p.col[1] + (p.col1[1] - p.col[1]) * t, p.col[2] + (p.col1[2] - p.col[2]) * t] : p.col;
      let ax, ay, az, bx, by, bz;
      if (p.streak) {
        let dx = p.vx, dy = p.vy, dz = p.vz; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
        let sx = dy * fz - dz * fy, sy = dz * fx - dx * fz, sz = dx * fy - dy * fx; const sl = Math.hypot(sx, sy, sz) || 1;
        const L = p.streak * Math.min(1, l * 8) + s * .5, Wd = s * .5;
        ax = dx * L; ay = dy * L; az = dz * L; bx = sx / sl * Wd; by = sy / sl * Wd; bz = sz / sl * Wd;
      } else {
        const c = Math.cos(p.rot) * s, sn = Math.sin(p.rot) * s;
        ax = rx * c + ux * sn; ay = ry * c + uy * sn; az = rz * c + uz * sn; bx = -rx * sn + ux * c; by = -ry * sn + uy * c; bz = -rz * sn + uz * c;
      }
      const buf = p.add ? this.add : this.alp, o = (p.add ? na : nb) * 9, u0 = p.cell * .25, u1 = u0 + .25;
      const V = [[-1, -1, u0, 0], [1, -1, u1, 0], [1, 1, u1, 1], [-1, -1, u0, 0], [1, 1, u1, 1], [-1, 1, u0, 1]];
      for (let k = 0; k < 6; k++) {
        const [i, j, u, v] = V[k], q = o + k * 9;
        buf[q] = p.x + ax * i + bx * j; buf[q + 1] = p.y + ay * i + by * j; buf[q + 2] = p.z + az * i + bz * j;
        buf[q + 3] = u; buf[q + 4] = v; buf[q + 5] = col[0]; buf[q + 6] = col[1]; buf[q + 7] = col[2]; buf[q + 8] = a;
      }
      if (p.add) na += 6; else nb += 6;
    }
    Rd.particles(this.alp, nb, this.tex, false);
    Rd.particles(this.add, na, this.tex, true);
  }

  /* ---------- briques d'effets ---------- */
  glow(x, y, z, col, size = .5, life = 10) { return this.spawn({ x, y, z, col, size, size1: size * 1.4, life, cell: 0 }); }
  sparks(x, y, z, col, n = 14, sp = .09) {
    for (let i = 0; i < n; i++) { const a = R() * TAU, b = (R() - .5) * 1.2, v = sp * (.4 + R()); this.spawn({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: b * v, life: 14 + R() * 12, size: .035, streak: .12, col, col1: [1, .4, .1], drag: .9, grav: .002 }); }
  }
  ring(x, y, z, col, size = 1.2, life = 16) { this.spawn({ x, y, z, col, size: size * .2, size1: size, life, cell: 1, alpha: .55 }); }
  star(x, y, z, col, size = .8, life = 12) { this.spawn({ x, y, z, col, size, size1: size * .3, life, cell: 2, rotv: .05 }); }
  hit(x, y, z, col, big) {
    this.glow(x, y, z, '#fff4e0', big ? .5 : .28, big ? 10 : 7);
    this.star(x, y, z, col, big ? .9 : .45, big ? 12 : 9);
    this.sparks(x, y, z, big ? '#ffd23f' : col, big ? 30 : 14, big ? .14 : .09);
    this.ring(x, y, z, col, big ? 1.8 : .8, big ? 18 : 12);
    if (big) for (let i = 0; i < 8; i++) this.smoke(x, y, z, .35, '#706860');
  }
  smoke(x, y, z, size = .4, col = '#6a6460', life = 50) {
    this.spawn({ x: x + (R() - .5) * .3, y: y + (R() - .5) * .2, z: z + (R() - .5) * .3, vx: (R() - .5) * .02, vy: .006 + R() * .01, vz: (R() - .5) * .02, size, size1: size * 2.4, life: life * (.7 + R() * .6), cell: 3, add: false, col, alpha: .35, drag: .97, rotv: (R() - .5) * .03 });
  }
  dust(x, y = .05, z = 0, n = 5) { for (let i = 0; i < n; i++) this.spawn({ x: x + (R() - .5) * .3, y, z: z + (R() - .5) * .3, vx: (R() - .5) * .03, vy: .004 + R() * .006, vz: (R() - .5) * .02, size: .12, size1: .4, life: 28, cell: 3, add: false, col: '#9a9088', alpha: .5, drag: .94 }); }
  fire(x, y, z, n = 3, scale = 1) {
    for (let i = 0; i < n; i++) this.spawn({ x: x + (R() - .5) * .15 * scale, y, z: z + (R() - .5) * .15 * scale, vx: (R() - .5) * .01, vy: (.02 + R() * .02) * scale, vz: (R() - .5) * .01, size: .13 * scale, size1: .03, life: 16 + R() * 10, col: '#ffd27a', col1: '#c42a08', alpha: .8, drag: .97 });
    if (R() < .3) this.smoke(x, y + .3 * scale, z, .2 * scale, '#3a3430', 40);
  }
  aura(x, y0, h, col, n = 3) {
    for (let i = 0; i < n; i++) { const a = R() * TAU, r = .25 + R() * .15; this.spawn({ x: x + Math.cos(a) * r, y: y0 + R() * h * .3, z: Math.sin(a) * r * .6, vy: .025 + R() * .025, size: .07, size1: .015, life: 28 + R() * 14, col, col1: '#ffffff', alpha: .8, drag: .99 }); }
  }
  trail(x, y, z, col, size = .25, life = 12) { this.spawn({ x: x + (R() - .5) * .04, y: y + (R() - .5) * .04, z, size, size1: .02, life, col, alpha: .7 }); }
  lightning(x1, y1, x2, y2, col = '#9fd8ff', seg = 10) {
    let px = x1, py = y1;
    for (let i = 1; i <= seg; i++) {
      const t = i / seg, nx = x1 + (x2 - x1) * t + (i < seg ? (R() - .5) * .35 : 0), ny = y1 + (y2 - y1) * t + (i < seg ? (R() - .5) * .35 : 0);
      const mx = (px + nx) / 2, my = (py + ny) / 2;
      this.spawn({ x: mx, y: my, z: .05, vx: (nx - px) * .001, vy: (ny - py) * .001, streak: Math.hypot(nx - px, ny - py) * .5, size: .06, life: 7, col: '#ffffff', col1: col });
      px = nx; py = ny;
    }
  }
  spiral(x, y0, h, col, t, n = 4) {
    for (let i = 0; i < n; i++) { const a = t * .5 + i * TAU / n, y = y0 + (i / n) * h; this.spawn({ x: x + Math.cos(a) * .55, y, z: Math.sin(a) * .55, vx: -Math.sin(a) * .04, vy: .01, vz: Math.cos(a) * .04, streak: .25, size: .05, life: 14, col, col1: '#ffffff', alpha: .8 }); }
  }
  slash(x, y, z, dir, col = '#ff4fd0') {
    for (let k = -1; k <= 1; k++) this.spawn({ x: x + k * .07, y: y + k * .05, z: .1, vx: dir * .02, vy: -.03, streak: .35, size: .05, life: 10, col: '#ffffff', col1: col });
    this.glow(x, y, z, col, .5, 8);
  }
  portal(x, y, z, col) { this.ring(x, y, z, col, 2.2, 30); this.star(x, y, z, '#ffffff', 1.4, 22); for (let i = 0; i < 16; i++) this.spawn({ x, y, z, vx: (R() - .5) * .08, vy: (R() - .5) * .08, vz: (R() - .5) * .04, size: .06, life: 30, col, col1: '#ffffff', cell: 2, rotv: .1 }); }
  flashStar(x, y, z) { this.glow(x, y, z, '#ffffff', 1.2, 14); this.star(x, y, z, '#e8f6ff', 2.4, 18); this.ring(x, y, z, '#cfeaff', 2.4, 16); }
}
