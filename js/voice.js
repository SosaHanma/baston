// Voix de la famille : enregistrées au micro ou importées, gardées dans le navigateur (IndexedDB)
import { audioCtx, audioInit } from './audio.js';
import { store } from './store.js';

export const SLOTS = [['coup', "Cri d'attaque"], ['pouvoir', 'Pouvoir'], ['aie', 'Aïe (touché)'], ['ko', 'K.O.'], ['victoire', 'Victoire']];
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => { const r = indexedDB.open('baston-voix', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return dbp;
}
async function tx(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode), st = t.objectStore('clips'), r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); }
export const saveClip = (id, slot, blob) => tx('readwrite', s => s.put(blob, id + ':' + slot)).then(() => { buffers.delete(id + ':' + slot); });
export const getClip = (id, slot) => tx('readonly', s => s.get(id + ':' + slot));
export const delClip = (id, slot) => tx('readwrite', s => s.delete(id + ':' + slot)).then(() => buffers.delete(id + ':' + slot));

const buffers = new Map();
// prépare les voix des deux combattants avant le combat
export async function preload(ids) {
  const AC = audioCtx(); if (!AC) return;
  for (const id of ids) for (const [slot] of SLOTS) {
    const k = id + ':' + slot; if (buffers.has(k)) continue;
    try { const b = await getClip(id, slot); if (b) buffers.set(k, await AC.decodeAudioData(await b.arrayBuffer())); } catch (e) { }
  }
}
const playing = new Map();
export function play(id, slot, delayFrames = 0) {
  const AC = audioCtx(), buf = buffers.get(id + ':' + slot);
  if (!AC || !buf || !store.opts.sound) return;
  const prev = playing.get(id); if (prev && slot === 'coup') return; // pas de cris qui se chevauchent
  try { if (prev) prev.stop(); } catch (e) { }
  const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = 1; s.buffer = buf; s.connect(g).connect(AC.destination);
  s.onended = () => { if (playing.get(id) === s) playing.delete(id); };
  s.start(AC.currentTime + delayFrames / 60); playing.set(id, s);
}
export async function playBlob(blob) { audioInit(); const AC = audioCtx(); if (!AC || !blob) return; const b = await AC.decodeAudioData(await blob.arrayBuffer()); const s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(); }

// enregistrement au micro (3 secondes max)
let rec = null;
export async function record(onStop) {
  if (rec) { rec.stop(); return; }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [], mr = new MediaRecorder(stream); rec = mr;
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); rec = null; onStop(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); };
  mr.start(); setTimeout(() => { if (mr.state === 'recording') mr.stop(); }, 3000);
}
export const recording = () => !!rec;
