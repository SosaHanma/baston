// Sauvegarde locale (photos, couleurs, options) : rien n'est envoyé en ligne
import { CHARS, POWERS } from './data.js';
const KEY = 'baston3d-v1', KEY_DECOR = 'baston3d-decor';

export const store = {
  chars: {},
  opts: { diff: 'normal', gfx: 'ps2', time: 99, rounds: 2, sound: true, padSwap: false },
  last: { p1: 'moi', p2: 'frere', stage: 'videoclub' },
  stagePhoto: null,
};
try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (s) { Object.assign(store.opts, s.opts || {}); Object.assign(store.last, s.last || {}); store.chars = s.chars || {}; }
  store.stagePhoto = localStorage.getItem(KEY_DECOR);
  if (store.opts.look !== 3) { store.opts.gfx = 'ps2'; store.opts.look = 3; }
  if (!['vhs', 'ps1', 'ps2', 'hd'].includes(store.opts.gfx)) store.opts.gfx = 'ps2';
} catch (e) { }

export function cust(id) {
  const d = CHARS.find(c => c.id === id);
  const c = store.chars[id] || (store.chars[id] = {});
  const def = { name: d.name, color: d.color, color2: d.color2, skin: d.skin, hairCol: d.hairCol, power: d.power, photo: null, zoom: 1, ox: 0, oy: 0, photo2: null, zoom2: 1, ox2: 0, oy2: 0 };
  const OLD = { moi: 'Moi', frere: 'Frère', petit: 'Petit frère', soeur1: 'Sœur 1', soeur2: 'Sœur 2', chats: 'Les Chats' };
  if (c.name === OLD[id]) c.name = d.name;
  if (c.v !== 2) { // anciennes couleurs vives par défaut -> nouvelles couleurs réalistes
    const OC = { moi: ['#e8452c', '#1f2433', '#d9a27a', '#2a1d16'], frere: ['#2d6cdf', '#20242c', '#c98d63', '#1b1410'], petit: ['#34c46a', '#f2c94c', '#e0aa82', '#3a2618'],
      soeur1: ['#d94fa3', '#2a2140', '#e3b08c', '#4a2a1a'], soeur2: ['#8b5cf6', '#f4f0ff', '#e8b996', '#20140e'], chats: ['#f2a65a', '#5c5470', '#f2a65a', '#5c5470'] }[id] || [];
    ['color', 'color2', 'skin', 'hairCol'].forEach((k, i) => { if (c[k] && c[k] === OC[i]) delete c[k]; });
    c.v = 2;
  }
  if (c.v === 2) { // palette PS2 ternie : on remplace les couleurs par défaut de la version précédente
    const O2 = { moi: ['#2b2b31', '#3d5a86', '#c48f69', '#16100c'], frere: ['#6e1f24', '#25272d', '#b98060', '#120d0a'], petit: ['#3a6aa8', '#4d4339', '#cf9c76', '#22160f'],
      soeur1: ['#4a3024', '#283650', '#d6a07c', '#24150d'], soeur2: ['#a85d77', '#2a2a30', '#d9a582', '#140c08'] }[id] || [];
    ['color', 'color2', 'skin', 'hairCol'].forEach((k, i) => { if (c[k] === O2[i]) c[k] = d[k]; });
    c.v = 3;
  }
  for (const k in def) if (c[k] === undefined) c[k] = def[k];
  if (!POWERS[c.power]) c.power = d.power;
  return c;
}
CHARS.forEach(c => cust(c.id));

let t = null, warned = false;
export function save(onFail) {
  clearTimeout(t);
  t = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ chars: store.chars, opts: store.opts, last: store.last })); }
    catch (e) { if (!warned) { warned = true; onFail && onFail(); } }
  }, 250);
}
export function saveDecor(url) {
  store.stagePhoto = url;
  try { if (url) localStorage.setItem(KEY_DECOR, url); else localStorage.removeItem(KEY_DECOR); return true; } catch (e) { return false; }
}

// images décodées, mises en cache par URL
const imgs = new Map();
export function img(url, onload) {
  if (!url) return null;
  let im = imgs.get(url);
  if (!im) { im = new Image(); im.onload = () => onload && onload(im); im.src = url; imgs.set(url, im); }
  return im.complete && im.naturalWidth ? im : null;
}
export function readPhoto(file, max, cb, onErr) {
  const fr = new FileReader();
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .86));
    };
    im.onerror = onErr; im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
