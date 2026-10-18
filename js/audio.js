// Bruitages synthétisés (aucun fichier son)
import { store } from './store.js';
let AC = null, noiseBuf = null;
export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const n = AC.sampleRate * .5; noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
    const ch = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function tone(type, f1, f2, dur, vol, delay = 0) {
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol, freq, q = 1, delay = 0) {
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur);
}
export function sfx(k) {
  if (!store.opts.sound || !AC) return;
  try {
    switch (k) {
      case 'hit': noise(.14, .5, 900, .7); tone('sine', 160, 45, .16, .6); break;
      case 'big': noise(.3, .6, 500, .5); tone('square', 120, 30, .35, .35); break;
      case 'block': noise(.06, .3, 2600, 3); tone('triangle', 900, 700, .05, .15); break;
      case 'whoosh': noise(.09, .12, 1800, 1.2); break;
      case 'fire': tone('sawtooth', 220, 660, .22, .12); noise(.2, .12, 1200, .8); break;
      case 'power': tone('sawtooth', 110, 880, .5, .16); tone('square', 220, 1320, .5, .06); noise(.4, .2, 3000, .6); break;
      case 'flash': noise(.25, .4, 5000, .5); tone('sine', 2400, 1800, .2, .2); break;
      case 'meow': tone('sawtooth', 700, 1100, .12, .12); tone('sawtooth', 1100, 600, .25, .12, .12); break;
      case 'toy': tone('square', 900, 600, .08, .1); break;
      case 'ko': tone('square', 440, 55, .9, .18); noise(.5, .4, 400, .5); break;
      case 'round': tone('square', 523, 523, .12, .12); tone('square', 784, 784, .2, .12, .14); break;
      case 'fight': tone('square', 392, 392, .1, .14); tone('square', 523, 523, .1, .14, .11); tone('square', 784, 784, .3, .14, .22); break;
      case 'move': tone('square', 660, 660, .04, .06); break;
      case 'ok': tone('square', 880, 1320, .09, .08); break;
      case 'back': tone('square', 440, 300, .09, .07); break;
    }
  } catch (e) { }
}
