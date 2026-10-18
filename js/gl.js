// Mini moteur 3D WebGL façon PS2 : éclairage par sommet, brouillard,
// rendu basse résolution puis agrandi avec tramage de couleurs.

/* ---------------- Maths ---------------- */
export const m4 = {
  create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b, o) {
    for (let i = 0; i < 4; i++) {
      const a0 = a[i], a1 = a[i + 4], a2 = a[i + 8], a3 = a[i + 12];
      o[i] = a0 * b[0] + a1 * b[1] + a2 * b[2] + a3 * b[3];
      o[i + 4] = a0 * b[4] + a1 * b[5] + a2 * b[6] + a3 * b[7];
      o[i + 8] = a0 * b[8] + a1 * b[9] + a2 * b[10] + a3 * b[11];
      o[i + 12] = a0 * b[12] + a1 * b[13] + a2 * b[14] + a3 * b[15];
    }
    return o;
  },
  persp(fovy, aspect, near, far, o = new Float32Array(16)) {
    const f = 1 / Math.tan(fovy / 2); o.fill(0);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) / (near - far); o[11] = -1; o[14] = 2 * far * near / (near - far);
    return o;
  },
  lookAt(e, t, up, o = new Float32Array(16)) {
    let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2];
    let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[4] = xy; o[8] = xz; o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
    o[1] = yx; o[5] = yy; o[9] = yz; o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
    o[2] = zx; o[6] = zy; o[10] = zz; o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
    o[3] = 0; o[7] = 0; o[11] = 0; o[15] = 1;
    return o;
  },
  // rotation Y puis X puis Z (R = Ry·Rx·Rz), puis échelle
  compose(o, p, r, s) {
    const cy = Math.cos(r[1]), sy = Math.sin(r[1]), cx = Math.cos(r[0]), sx = Math.sin(r[0]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
    const r00 = cy * cz + sy * sx * sz, r01 = -cy * sz + sy * sx * cz, r02 = sy * cx;
    const r10 = cx * sz, r11 = cx * cz, r12 = -sx;
    const r20 = -sy * cz + cy * sx * sz, r21 = sy * sz + cy * sx * cz, r22 = cy * cx;
    o[0] = r00 * s[0]; o[1] = r10 * s[0]; o[2] = r20 * s[0]; o[3] = 0;
    o[4] = r01 * s[1]; o[5] = r11 * s[1]; o[6] = r21 * s[1]; o[7] = 0;
    o[8] = r02 * s[2]; o[9] = r12 * s[2]; o[10] = r22 * s[2]; o[11] = 0;
    o[12] = p[0]; o[13] = p[1]; o[14] = p[2]; o[15] = 1;
    return o;
  },
  normal(m, o) {
    const a00 = m[0], a01 = m[4], a02 = m[8], a10 = m[1], a11 = m[5], a12 = m[9], a20 = m[2], a21 = m[6], a22 = m[10];
    const c00 = a11 * a22 - a12 * a21, c01 = -(a10 * a22 - a12 * a20), c02 = a10 * a21 - a11 * a20;
    const c10 = -(a01 * a22 - a02 * a21), c11 = a00 * a22 - a02 * a20, c12 = -(a00 * a21 - a01 * a20);
    const c20 = a01 * a12 - a02 * a11, c21 = -(a00 * a12 - a02 * a10), c22 = a00 * a11 - a01 * a10;
    const det = a00 * c00 + a01 * c01 + a02 * c02, k = det ? 1 / det : 1;
    o[0] = c00 * k; o[1] = c10 * k; o[2] = c20 * k; o[3] = c01 * k; o[4] = c11 * k; o[5] = c21 * k; o[6] = c02 * k; o[7] = c12 * k; o[8] = c22 * k;
    return det;
  },
};

/* ---------------- Géométries ---------------- */
function G(pos, nor, uv, idx) { return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint16Array(idx) }; }
export const geo = {
  box(w, h, d) {
    const P = [], N = [], U = [], I = [];
    const faces = [
      [[1, 0, 0], [0, 0, -1], [0, 1, 0], w / 2, d, h],
      [[-1, 0, 0], [0, 0, 1], [0, 1, 0], w / 2, d, h],
      [[0, 1, 0], [1, 0, 0], [0, 0, -1], h / 2, w, d],
      [[0, -1, 0], [1, 0, 0], [0, 0, 1], h / 2, w, d],
      [[0, 0, 1], [1, 0, 0], [0, 1, 0], d / 2, w, h],
      [[0, 0, -1], [-1, 0, 0], [0, 1, 0], d / 2, w, h],
    ];
    for (const [n, u, v, off, su, sv] of faces) {
      const b = P.length / 3;
      for (const [a, c, tu, tv] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) {
        P.push(n[0] * off + u[0] * a * su / 2 + v[0] * c * sv / 2, n[1] * off + u[1] * a * su / 2 + v[1] * c * sv / 2, n[2] * off + u[2] * a * su / 2 + v[2] * c * sv / 2);
        N.push(...n); U.push(tu, tv);
      }
      I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    return G(P, N, U, I);
  },
  cyl(rt, rb, h, seg = 8, open = false, ts = 0, tl = Math.PI * 2, hs = 1) {
    const P = [], N = [], U = [], I = [], rows = [];
    const slope = (rb - rt) / h;
    for (let y = 0; y <= hs; y++) {
      const v = y / hs, r = v * (rb - rt) + rt, row = [];
      for (let x = 0; x <= seg; x++) {
        const u = x / seg, t = u * tl + ts, s = Math.sin(t), c = Math.cos(t);
        row.push(P.length / 3); P.push(r * s, -v * h + h / 2, r * c);
        const l = Math.hypot(s, slope, c); N.push(s / l, slope / l, c / l); U.push(u, 1 - v);
      }
      rows.push(row);
    }
    for (let x = 0; x < seg; x++) for (let y = 0; y < hs; y++) {
      const a = rows[y][x], b = rows[y + 1][x], c = rows[y + 1][x + 1], d = rows[y][x + 1];
      I.push(a, b, d, b, c, d);
    }
    if (!open) for (const top of [true, false]) {
      const r = top ? rt : rb; if (r <= 0) continue;
      const sign = top ? 1 : -1, c0 = P.length / 3;
      P.push(0, h / 2 * sign, 0); N.push(0, sign, 0); U.push(.5, .5);
      const ring = [];
      for (let x = 0; x <= seg; x++) {
        const t = x / seg * tl + ts, s = Math.sin(t), c = Math.cos(t);
        ring.push(P.length / 3); P.push(r * s, h / 2 * sign, r * c); N.push(0, sign, 0); U.push(c * .5 + .5, s * .5 * sign + .5);
      }
      for (let x = 0; x < seg; x++) top ? I.push(ring[x], ring[x + 1], c0) : I.push(ring[x + 1], ring[x], c0);
    }
    return G(P, N, U, I);
  },
  sphere(r, ws = 10, hs = 8, ps = 0, pl = Math.PI * 2, ts = 0, tl = Math.PI) {
    const P = [], N = [], U = [], I = [], grid = [];
    for (let iy = 0; iy <= hs; iy++) {
      const v = iy / hs, th = ts + v * tl, row = [];
      for (let ix = 0; ix <= ws; ix++) {
        const u = ix / ws, ph = ps + u * pl;
        const x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
        row.push(P.length / 3); P.push(x * r, y * r, z * r); N.push(x, y, z); U.push(u, 1 - v);
      }
      grid.push(row);
    }
    for (let iy = 0; iy < hs; iy++) for (let ix = 0; ix < ws; ix++) {
      const a = grid[iy][ix + 1], b = grid[iy][ix], c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
      I.push(a, b, d, b, c, d);
    }
    return G(P, N, U, I);
  },
  plane(w, h, ru = 1, rv = 1) {
    return G([-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [0, 0, ru, 0, ru, rv, 0, rv], [0, 1, 2, 0, 2, 3]);
  },
  disc(r, seg = 16) {
    const P = [0, 0, 0], N = [0, 0, 1], U = [.5, .5], I = [];
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); P.push(c * r, s * r, 0); N.push(0, 0, 1); U.push(c * .5 + .5, s * .5 + .5); }
    for (let i = 1; i <= seg; i++) I.push(0, i, i + 1);
    return G(P, N, U, I);
  },
  // prisme triangulaire (toit) : base w×d, hauteur h, faîtage selon X
  roof(w, h, d) {
    const x = w / 2, z = d / 2, P = [], N = [], U = [], I = [];
    const quad = (a, b, c, e, n) => { const k = P.length / 3; P.push(...a, ...b, ...c, ...e); for (let i = 0; i < 4; i++) N.push(...n); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    const tri = (a, b, c, n) => { const k = P.length / 3; P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) N.push(...n); U.push(0, 0, 1, 0, .5, 1); I.push(k, k + 1, k + 2); };
    const l = Math.hypot(h, z);
    quad([-x, 0, z], [x, 0, z], [x, h, 0], [-x, h, 0], [0, z / l, h / l]);
    quad([x, 0, -z], [-x, 0, -z], [-x, h, 0], [x, h, 0], [0, z / l, -h / l]);
    tri([x, 0, z], [x, 0, -z], [x, h, 0], [1, 0, 0]);
    tri([-x, 0, -z], [-x, 0, z], [-x, h, 0], [-1, 0, 0]);
    return G(P, N, U, I);
  },
};

/* ---------------- Scène ---------------- */
export class Node {
  constructor(mesh = null, mat = null) {
    this.p = [0, 0, 0]; this.r = [0, 0, 0]; this.s = [1, 1, 1];
    this.children = []; this.parent = null; this.mesh = mesh; this.mat = mat; this.visible = true;
    this.local = m4.create(); this.world = m4.create(); this.billboard = false;
  }
  add(...cs) { for (const c of cs) { if (c.parent) c.parent.remove(c); c.parent = this; this.children.push(c); } return this; }
  remove(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parent = null; }
  at(x, y, z) { this.p[0] = x; this.p[1] = y; this.p[2] = z; return this; }
  rot(x, y, z) { this.r[0] = x; this.r[1] = y; this.r[2] = z; return this; }
  scl(x, y = x, z = x) { this.s[0] = x; this.s[1] = y; this.s[2] = z; return this; }
  worldPos() { return [this.world[12], this.world[13], this.world[14]]; }
}
// matériau : couleur, texture, sans éclairage, transparence
export function mat(o = {}) {
  return { color: hexRGB(o.color ?? '#ffffff'), tex: o.tex || null, unlit: !!o.unlit, alpha: o.alpha ?? 1, transparent: !!(o.transparent || (o.alpha ?? 1) < 1 || o.additive),
    additive: !!o.additive, double: !!o.double, depthWrite: o.depthWrite ?? !(o.transparent || o.additive), fog: o.fog ?? true };
}
export function hexRGB(h) {
  if (Array.isArray(h)) return h;
  if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g); return [m[0] / 255, m[1] / 255, m[2] / 255]; }
  const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
export function setColor(m, h) { m.color = hexRGB(h); }

/* ---------------- Rendu ---------------- */
const VS = `attribute vec3 aPos;attribute vec3 aNor;attribute vec2 aUv;
uniform mat4 uModel,uVP;uniform mat3 uNM;uniform vec3 uLDir,uLCol,uSky,uGround,uPPos,uPCol,uEye;uniform float uPRange,uUnlit;
varying vec2 vUv;varying vec3 vLight;varying float vDepth;
void main(){vec4 wp=uModel*vec4(aPos,1.);vec3 n=normalize(uNM*aNor);
vec3 L=mix(uGround,uSky,n.y*.5+.5)+uLCol*max(dot(n,-uLDir),0.);
if(uPRange>0.){vec3 pl=uPPos-wp.xyz;float d=length(pl);float at=clamp(1.-d/uPRange,0.,1.);L+=uPCol*max(dot(n,pl/max(d,.001)),0.)*at*at;}
vLight=mix(L,vec3(1.),uUnlit);vUv=aUv;vDepth=distance(wp.xyz,uEye);gl_Position=uVP*wp;}`;
const FS = `precision mediump float;uniform sampler2D uTex;uniform float uUseTex,uAlpha,uFogOn;uniform vec3 uColor,uFogCol;uniform vec2 uFog;
varying vec2 vUv;varying vec3 vLight;varying float vDepth;
void main(){vec4 t=uUseTex>.5?texture2D(uTex,vUv):vec4(1.);vec3 c=uColor*t.rgb*vLight;float a=t.a*uAlpha;if(a<.03)discard;
float f=uFogOn*clamp((vDepth-uFog.x)/(uFog.y-uFog.x),0.,1.);gl_FragColor=vec4(mix(c,uFogCol,f),a);}`;
const PVS = `attribute vec2 aP;varying vec2 vUv;void main(){vUv=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}`;
const PFS = `precision mediump float;uniform sampler2D uT;uniform float uDither,uLevels;uniform vec2 uRes;varying vec2 vUv;
float b2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
void main(){vec3 c=texture2D(uT,vUv).rgb;
if(uDither>0.){vec2 px=floor(vUv*uRes);c+=(b4(px)-.5)*uDither/uLevels;c=floor(c*uLevels+.5)/uLevels;}
vec2 q=vUv-.5;c*=1.-dot(q,q)*.45;gl_FragColor=vec4(c,1.);}`;

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('webgl');
    this.gl = gl; this.canvas = canvas;
    this.prog = this.program(VS, FS);
    this.post = this.program(PVS, PFS);
    const p = this.prog; this.u = {};
    for (const n of ['uModel', 'uVP', 'uNM', 'uLDir', 'uLCol', 'uSky', 'uGround', 'uPPos', 'uPCol', 'uEye', 'uPRange', 'uUnlit', 'uTex', 'uUseTex', 'uAlpha', 'uFogOn', 'uColor', 'uFogCol', 'uFog']) this.u[n] = gl.getUniformLocation(p, n);
    this.a = { pos: gl.getAttribLocation(p, 'aPos'), nor: gl.getAttribLocation(p, 'aNor'), uv: gl.getAttribLocation(p, 'aUv') };
    this.pu = { uT: gl.getUniformLocation(this.post, 'uT'), uDither: gl.getUniformLocation(this.post, 'uDither'), uLevels: gl.getUniformLocation(this.post, 'uLevels'), uRes: gl.getUniformLocation(this.post, 'uRes') };
    this.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.white = this.texFromPixels(new Uint8Array([255, 255, 255, 255]), 1, 1);
    this.meshCache = new Map(); this.texCache = new WeakMap();
    this.vp = new Float32Array(16); this.tmp = new Float32Array(16); this.nm = new Float32Array(9);
    this.fbo = null; this.iw = 0; this.ih = 0; this.dither = 1;
  }
  program(vs, fs) {
    const gl = this.gl, mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  mesh(g) {
    let m = this.meshCache.get(g); if (m) return m;
    const gl = this.gl, buf = (d, t = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, gl.STATIC_DRAW); return b; };
    m = { pos: buf(g.pos), nor: buf(g.nor), uv: buf(g.uv), idx: buf(g.idx, gl.ELEMENT_ARRAY_BUFFER), n: g.idx.length };
    this.meshCache.set(g, m); return m;
  }
  texFromPixels(px, w, h) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
  }
  // texture depuis un canvas ; tex.version permet de la remettre à jour
  tex(c) {
    const gl = this.gl; let e = this.texCache.get(c);
    if (e && e.v === (c._v || 0)) return e.t;
    const t = e ? e.t : gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const pot = (c.width & (c.width - 1)) === 0 && (c.height & (c.height - 1)) === 0;
    if (pot && c._repeat) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, c._nearest ? gl.NEAREST : gl.LINEAR);
    this.texCache.set(c, { t, v: c._v || 0 }); return t;
  }
  setInternal(w, h) {
    const gl = this.gl; if (w === this.iw && h === this.ih) return; this.iw = w; this.ih = h;
    if (!this.fbo) { this.fbo = gl.createFramebuffer(); this.ft = gl.createTexture(); this.rb = gl.createRenderbuffer(); }
    gl.bindTexture(gl.TEXTURE_2D, this.ft); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.ft, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  updateWorld(n, parent) {
    m4.compose(n.local, n.p, n.r, n.s);
    if (parent) m4.mul(parent, n.local, n.world); else n.world.set(n.local);
    for (const c of n.children) this.updateWorld(c, n.world);
  }
  collect(n, out) { if (!n.visible) return; if (n.mesh) out.push(n); for (const c of n.children) this.collect(c, out); }
  render(scene, cam, env) {
    const gl = this.gl, u = this.u, a = this.a;
    this.updateWorld(scene, null);
    m4.mul(cam.proj, cam.view, this.vp);
    const items = []; this.collect(scene, items);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, this.iw, this.ih);
    const cc = env.clear; gl.clearColor(cc[0], cc[1], cc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(u.uVP, false, this.vp);
    gl.uniform3fv(u.uLDir, env.ldir); gl.uniform3fv(u.uLCol, env.lcol); gl.uniform3fv(u.uSky, env.sky); gl.uniform3fv(u.uGround, env.ground);
    gl.uniform3fv(u.uEye, cam.eye); gl.uniform3fv(u.uFogCol, env.fogCol); gl.uniform2f(u.uFog, env.fog[0], env.fog[1]);
    if (env.point) { gl.uniform3fv(u.uPPos, env.point.pos); gl.uniform3fv(u.uPCol, env.point.col); gl.uniform1f(u.uPRange, env.point.range); } else gl.uniform1f(u.uPRange, 0);
    gl.uniform1i(u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
    const opaque = [], trans = [];
    for (const n of items) (n.mat.transparent ? trans : opaque).push(n);
    const e = cam.eye;
    for (const n of trans) { const w = n.world; n._d = (w[12] - e[0]) ** 2 + (w[13] - e[1]) ** 2 + (w[14] - e[2]) ** 2; }
    trans.sort((x, y) => y._d - x._d + (x.mat.order || 0) - (y.mat.order || 0));
    gl.disable(gl.BLEND); gl.depthMask(true);
    for (const n of opaque) this.draw(n, cam);
    gl.enable(gl.BLEND);
    for (const n of trans) {
      if (n.mat.additive) gl.blendFunc(gl.SRC_ALPHA, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(n.mat.depthWrite); this.draw(n, cam);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    // passe finale : agrandissement + tramage
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.useProgram(this.post);
    gl.bindTexture(gl.TEXTURE_2D, this.ft); gl.uniform1i(this.pu.uT, 0);
    gl.uniform1f(this.pu.uDither, this.dither); gl.uniform1f(this.pu.uLevels, 31); gl.uniform2f(this.pu.uRes, this.iw, this.ih);
    const ap = gl.getAttribLocation(this.post, 'aP');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    for (const k of ['pos', 'nor', 'uv']) if (a[k] >= 0 && a[k] !== ap) gl.disableVertexAttribArray(a[k]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(ap);
  }
  draw(n, cam) {
    const gl = this.gl, u = this.u, a = this.a, m = this.mesh(n.mesh), mt = n.mat;
    let w = n.world;
    if (n.billboard) {
      const v = cam.view, t = this.tmp, sx = Math.hypot(w[0], w[1], w[2]), sy = Math.hypot(w[4], w[5], w[6]);
      t[0] = v[0] * sx; t[1] = v[4] * sx; t[2] = v[8] * sx; t[3] = 0;
      t[4] = v[1] * sy; t[5] = v[5] * sy; t[6] = v[9] * sy; t[7] = 0;
      t[8] = v[2]; t[9] = v[6]; t[10] = v[10]; t[11] = 0;
      t[12] = w[12]; t[13] = w[13]; t[14] = w[14]; t[15] = 1; w = t;
    }
    const det = m4.normal(w, this.nm);
    gl.uniformMatrix4fv(u.uModel, false, w); gl.uniformMatrix3fv(u.uNM, false, this.nm);
    if (mt.double) gl.disable(gl.CULL_FACE); else { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(det < 0 ? gl.CW : gl.CCW); }
    gl.uniform3fv(u.uColor, mt.color); gl.uniform1f(u.uAlpha, mt.alpha); gl.uniform1f(u.uUnlit, mt.unlit ? 1 : 0); gl.uniform1f(u.uFogOn, mt.fog ? 1 : 0);
    if (mt.tex) { gl.bindTexture(gl.TEXTURE_2D, this.tex(mt.tex)); gl.uniform1f(u.uUseTex, 1); } else { gl.bindTexture(gl.TEXTURE_2D, this.white); gl.uniform1f(u.uUseTex, 0); }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.pos); gl.enableVertexAttribArray(a.pos); gl.vertexAttribPointer(a.pos, 3, gl.FLOAT, false, 0, 0);
    if (a.nor >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, m.nor); gl.enableVertexAttribArray(a.nor); gl.vertexAttribPointer(a.nor, 3, gl.FLOAT, false, 0, 0); }
    if (a.uv >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, m.uv); gl.enableVertexAttribArray(a.uv); gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, 0, 0); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.idx); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
  }
  project(cam, x, y, z) {
    const v = this.vp, cx = v[0] * x + v[4] * y + v[8] * z + v[12], cy = v[1] * x + v[5] * y + v[9] * z + v[13], cw = v[3] * x + v[7] * y + v[11] * z + v[15];
    return [(cx / cw * .5 + .5), (1 - (cy / cw * .5 + .5)), cw];
  }
}
