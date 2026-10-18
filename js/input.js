// Clavier + manettes, pour les combats et les menus
import { store } from './store.js';

const P1 = { u: ['KeyW'], l: ['KeyA'], d: ['KeyS'], r: ['KeyD'], p: ['KeyF'], k: ['KeyG'], s: ['KeyH'], x: ['KeyJ'] };
const P2 = { u: ['ArrowUp'], l: ['ArrowLeft'], d: ['ArrowDown'], r: ['ArrowRight'], p: ['KeyK', 'Numpad1'], k: ['KeyL', 'Numpad2'], s: ['KeyO', 'Numpad3'], x: ['KeyP', 'Numpad0'] };
const SOLO = {}; for (const k in P1) SOLO[k] = [...P1[k], ...P2[k]];
const MENU = {
  any: { up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], ok: ['Enter', 'Space', 'KeyF', 'KeyK', 'NumpadEnter'], back: ['Escape', 'Backspace', 'KeyG', 'KeyL'], start: ['Enter'] },
  1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], ok: ['KeyF', 'Enter', 'Space'], back: ['KeyG', 'Escape'], start: ['Enter'] },
  2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], ok: ['KeyK', 'Numpad1', 'NumpadEnter'], back: ['KeyL', 'Numpad2', 'Backspace'], start: [] },
};
export const ALL = new Set([...Object.values(P1).flat(), ...Object.values(P2).flat(), 'Space']);

const held = new Set(), pressed = new Set();
let typing = () => false;
addEventListener('keydown', e => {
  if (typing()) return;
  if (ALL.has(e.code) || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) pressed.add(e.code);
  held.add(e.code);
});
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', () => held.clear());

// ---- manettes ----
export const pads = { list: [], blocked: false };
try { if (document.featurePolicy && document.featurePolicy.allowsFeature && !document.featurePolicy.allowsFeature('gamepad')) pads.blocked = true; } catch (e) { }
if (!navigator.getGamepads) pads.blocked = true;
const prev = {}, acc = {};
function state(p) {
  const b = i => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > .5)), ax = p.axes || [];
  return { l: b(14) || ax[0] < -.5, r: b(15) || ax[0] > .5, u: b(12) || ax[1] < -.6, d: b(13) || ax[1] > .6,
    p: b(2), k: b(0), s: b(1), x: b(3) || b(5) || b(7), start: b(9), select: b(8), a: b(0), b: b(1) };
}
export function poll() {
  let raw = [];
  if (!pads.blocked) { try { raw = [...navigator.getGamepads()].filter(p => p && p.connected); } catch (e) { pads.blocked = true; } }
  pads.list = raw.map(p => {
    const s = state(p), pv = prev[p.index] || {}, pr = {};
    for (const k in s) pr[k] = s[k] && !pv[k];
    prev[p.index] = s;
    const a = acc[p.index] || (acc[p.index] = {});
    for (const k in pr) if (pr[k]) a[k] = 1;
    return { index: p.index, id: p.id, held: s, press: pr };
  });
}
function padsFor(player, solo) {
  if (solo) return player === 1 ? pads.list : [];
  const j = player === 1 ? (store.opts.padSwap ? 1 : 0) : (store.opts.padSwap ? 0 : 1);
  return pads.list[j] ? [pads.list[j]] : [];
}
export function blank() { return { l: 0, r: 0, u: 0, d: 0, press: { p: 0, k: 0, s: 0, x: 0 } }; }
export function fightInput(player, solo, touch) {
  const M = solo ? SOLO : player === 1 ? P1 : P2, i = blank();
  for (const k of ['l', 'r', 'u', 'd']) i[k] = M[k].some(c => held.has(c));
  for (const k of ['p', 'k', 's', 'x']) i.press[k] = M[k].some(c => pressed.has(c));
  for (const p of padsFor(player, solo)) {
    for (const k of ['l', 'r', 'u', 'd']) i[k] = i[k] || p.held[k];
    const a = acc[p.index] || {}; for (const k of ['p', 'k', 's', 'x']) i.press[k] = i.press[k] || !!a[k];
  }
  if (touch && player === 1) { for (const k of ['l', 'r', 'u', 'd']) i[k] = i[k] || touch.held[k]; for (const k of ['p', 'k', 's', 'x']) i.press[k] = i.press[k] || touch.pressed.has(k); if (touch.pressed.has('u')) i.u = 1; }
  return i;
}
// directions de menu avec répétition quand on reste appuyé
const rep = {};
export function menuInput(who = 'any', solo = true) {
  const M = MENU[who], o = {};
  for (const k in M) o[k] = M[k].some(c => pressed.has(c));
  const list = who === 'any' ? pads.list : padsFor(who, false);
  for (const p of list) {
    const a = acc[p.index] || {};
    o.ok = o.ok || !!a.a; o.back = o.back || !!a.b; o.start = o.start || !!a.start; o.select = o.select || !!a.select;
    for (const [k, d] of [['up', 'u'], ['down', 'd'], ['left', 'l'], ['right', 'r']]) {
      const key = who + k + p.index;
      if (p.held[d]) { rep[key] = (rep[key] || 0) + 1; if (rep[key] === 1 || (rep[key] > 18 && rep[key] % 6 === 0)) o[k] = true; } else rep[key] = 0;
    }
  }
  return o;
}
export function endFrame() { pressed.clear(); for (const k in acc) acc[k] = {}; }
export function setTyping(fn) { typing = fn; }
export function anyHeld() { return held.size > 0; }
