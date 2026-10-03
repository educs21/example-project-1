// Generates the app's sound effects as WAV files: node scripts/make-sounds.js
const fs = require('fs');
const path = require('path');
const RATE = 44100;

function render(notes, total) {
  const samples = new Float32Array(Math.floor(RATE * total));
  for (const { freq, start, dur, vol = 0.5 } of notes) {
    const from = Math.floor(start * RATE);
    const len = Math.floor(dur * RATE);
    for (let i = 0; i < len && from + i < samples.length; i++) {
      const t = i / RATE;
      const env = Math.min(1, i / (0.005 * RATE)) * Math.exp(-4 * (t / dur));
      const tone = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
      samples[from + i] += tone * env * vol;
    }
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767 * 0.8, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const out = path.join(__dirname, '..', 'assets', 'sounds');
// Check-off chime: E5 -> A5
fs.writeFileSync(path.join(out, 'chime.wav'), wav(render([
  { freq: 659.25, start: 0, dur: 0.25 },
  { freq: 880, start: 0.09, dur: 0.45 },
], 0.6)));
// Challenge fanfare: C5 E5 G5 C6 (held)
fs.writeFileSync(path.join(out, 'fanfare.wav'), wav(render([
  { freq: 523.25, start: 0, dur: 0.4 },
  { freq: 659.25, start: 0.15, dur: 0.4 },
  { freq: 783.99, start: 0.3, dur: 0.4 },
  { freq: 1046.5, start: 0.45, dur: 1.1, vol: 0.6 },
], 1.7)));
