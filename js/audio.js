// Bruitages synthétisés (aucun fichier son) : chaque impact est construit en couches
// (choc grave + claquement + tissu + souffle), passe par un compresseur et une réverbération de pièce,
// et varie légèrement à chaque coup pour ne jamais sonner pareil.
import { store } from './store.js';
let AC = null, noiseBuf = null, out = null, wet = null, dry = null;
const R = Math.random, vary = (v, k = .12) => v * (1 + (R() * 2 - 1) * k);
export const audioCtx = () => AC;
export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const n = AC.sampleRate * 1; noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
    const ch = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    // chaîne de sortie : compresseur + réverbération courte de pièce
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = .002; comp.release.value = .18;
    const master = AC.createGain(); master.gain.value = .9; comp.connect(master).connect(AC.destination);
    const conv = AC.createConvolver(); conv.buffer = roomIR(.75, 2.6);
    wet = AC.createGain(); wet.gain.value = .22; dry = AC.createGain(); dry.gain.value = 1;
    out = AC.createGain(); out.connect(dry).connect(comp); out.connect(conv).connect(wet).connect(comp);
  } catch (e) { AC = null; }
}
function roomIR(sec, decay) {
  const len = AC.sampleRate * sec, b = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1); }
  return b;
}
const now = () => AC.currentTime;
function env(g, t, a, peak, dur, curve = .001) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(curve, t + a + dur); }
function tone(type, f1, f2, dur, vol, delay = 0, a = .002) {
  const t = now() + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  env(g, t, a, vol, dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + a + .05);
}
function noise(dur, vol, freq, q = 1, delay = 0, type = 'bandpass', a = .001, f2) {
  const t = now() + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; s.playbackRate.value = .8 + R() * .4; f.type = type; f.frequency.setValueAtTime(freq, t); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur); f.Q.value = q;
  env(g, t, a, vol, dur); s.connect(f).connect(g).connect(out); s.start(t, R() * .4); s.stop(t + dur + a + .05);
}
// choc corporel : grave + claquement + tissu ; force 0..1
function impact(force, bright = 1) {
  const k = force;
  tone('sine', vary(140 + 40 * k), 38, vary(.12 + .16 * k), .55 + .4 * k);                // poids du coup
  tone('triangle', vary(260), 70, .06 + .05 * k, .25 * k);                                 // corps
  noise(.035 + .03 * k, .7 * bright, vary(2400), .8, 0, 'bandpass');                       // claquement
  noise(.09 + .1 * k, .45, vary(700), .6, .004, 'bandpass', .002, 220);                     // chair / tissu
  noise(.05, .25 * bright, vary(6000), 1, 0, 'highpass');                                   // crépitement aigu
  if (k > .7) { noise(.35, .35, 180, .7, .01, 'lowpass', .004, 60); tone('sine', 70, 30, .4, .5, .01); } // sub-basse des gros coups
}
export function sfx(k, force = .5) {
  if (!store.opts.sound || !AC) return;
  try {
    switch (k) {
      case 'hit': impact(Math.min(1, .35 + force * .5)); break;
      case 'big': impact(1, 1.2); noise(.5, .25, 1200, .5, .03, 'bandpass', .01, 300); break;
      case 'block': noise(.05, .5, vary(3200), 2.5, 0, 'bandpass'); tone('triangle', vary(520), 300, .07, .25); noise(.12, .2, 900, .8, .005); break;
      case 'whoosh': noise(vary(.13), .22, vary(900), 1.4, 0, 'bandpass', .03, vary(2600)); break;
      case 'whooshBig': noise(.2, .32, 500, 1.2, 0, 'bandpass', .04, 2200); noise(.16, .12, 3000, 1, .03, 'highpass', .02); break;
      case 'step': noise(.04, .08, vary(400), 1.5, 0, 'bandpass'); break;
      case 'land': tone('sine', 110, 40, .12, .35); noise(.12, .25, 500, .8, 0, 'lowpass', .002, 150); break;
      case 'fall': tone('sine', 90, 30, .35, .7); noise(.4, .45, 400, .6, 0, 'lowpass', .002, 80); noise(.25, .2, 1500, .8, .05, 'bandpass'); break;
      case 'fire': tone('sawtooth', 220, 660, .22, .1); noise(.25, .2, 1200, .8, 0, 'bandpass', .01, 3000); break;
      case 'power': tone('sawtooth', 110, 880, .55, .12, 0, .05); tone('square', 220, 1320, .55, .04, 0, .05); noise(.5, .22, 300, .6, 0, 'bandpass', .1, 4000); tone('sine', 55, 40, .9, .45, 0, .02); break;
      case 'flash': noise(.25, .4, 5000, .5, 0, 'highpass'); tone('sine', 2400, 1800, .2, .15); break;
      case 'meow': tone('sawtooth', vary(700), 1100, .12, .1); tone('sawtooth', 1100, 600, .25, .1, .12); break;
      case 'toy': tone('square', vary(900), 600, .08, .08); noise(.05, .2, 2000, 2); break;
      case 'ko': impact(1, 1.3); tone('sine', 60, 25, 1.2, .6, .02); noise(1, .2, 300, .5, .05, 'lowpass', .02, 60); tone('square', 440, 55, .9, .08, .1); break;
      case 'round': tone('square', 523, 523, .12, .1); tone('square', 784, 784, .2, .1, .14); break;
      case 'fight': tone('square', 392, 392, .1, .12); tone('square', 523, 523, .1, .12, .11); tone('square', 784, 784, .3, .12, .22); noise(.4, .15, 3000, .5, .22, 'highpass'); break;
      case 'move': tone('square', 660, 660, .04, .05); break;
      case 'ok': tone('square', 880, 1320, .09, .07); break;
      case 'back': tone('square', 440, 300, .09, .06); break;
    }
  } catch (e) { }
}
