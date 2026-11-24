import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildGuitarChordVoicing,
  computeGuitarSampledTimbreCurve,
  findNearestGuitarSample,
  getGuitarStringPhysics,
  GUITAR_SAMPLE_MANIFEST,
  synthesizePluckedStringSamples,
} from './acousticGuitarEngine';
import { midiToFrequency } from './grandPianoEngine';

test('GUITAR_SAMPLE_MANIFEST covers all 37 chromatic notes D2..D5 backed by self-hosted MP3 files', () => {
  assert.equal(GUITAR_SAMPLE_MANIFEST.length, 37);
  for (const spec of GUITAR_SAMPLE_MANIFEST) {
    assert.ok(spec.url.startsWith('/audio/guitar/') && spec.url.endsWith('.mp3'));
    const diskPath = path.join(process.cwd(), 'public', spec.url.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Missing guitar MP3 sample on disk: ${diskPath}`);
    assert.ok(fs.statSync(diskPath).size > 5000, `Guitar MP3 sample too small: ${diskPath}`);
  }
});

test('findNearestGuitarSample returns exact 1:1 pitch playback across D2..D5 guitar range', () => {
  for (let midi = 38; midi <= 74; midi++) {
    const match = findNearestGuitarSample(midi);
    assert.equal(match.semitoneOffset, 0);
    assert.equal(match.playbackRate, 1);
  }
  const highHarmonic = findNearestGuitarSample(77); // F5
  assert.equal(highHarmonic.sample.key, 'D5');
  assert.equal(highHarmonic.semitoneOffset, 3);
});

test('buildGuitarChordVoicing creates open 6-string fretboard spacing free of muddy low clusters', () => {
  const chord = buildGuitarChordVoicing([48], [60, 64, 67]); // C major
  assert.ok(chord.length >= 4);
  assert.equal(chord[0], 48); // C3 bass string
  for (let i = 1; i < chord.length; i++) {
    assert.ok(chord[i] > chord[i - 1], 'Strings should ascend strictly low to high');
    assert.ok(chord[i] - chord[i - 1] >= 3, 'Strings avoid tight semitone/whole-step mud');
  }
});

test('computeGuitarSampledTimbreCurve preserves warm fingerstyle low vel and crisp pick shimmer on forte', () => {
  const soft = computeGuitarSampledTimbreCurve(midiToFrequency(64), 0.3, 'backing');
  const forte = computeGuitarSampledTimbreCurve(midiToFrequency(64), 0.92, 'melody');
  assert.ok(forte.attackCutoffHz > soft.attackCutoffHz * 1.4);
  assert.ok(forte.sustainCutoffHz > soft.sustainCutoffHz * 1.3);
});

test('getGuitarStringPhysics tunes decay and brightness by string register and articulation', () => {
  const lowBass = getGuitarStringPhysics(40, 'backing'); // E2
  const highLead = getGuitarStringPhysics(76, 'melody'); // E5

  assert.ok(lowBass.lossFactor > highLead.lossFactor);
  assert.ok(lowBass.bodyDurationSec > highLead.bodyDurationSec);
  assert.ok(highLead.brightness > lowBass.brightness || highLead.pickPosition < lowBass.pickPosition);
});

test('synthesizePluckedStringSamples produces bounded, DC-balanced, pitched acoustic waveforms', () => {
  const sr = 44100;
  const freq = midiToFrequency(52); // E3 guitar string
  const samples = synthesizePluckedStringSamples(freq, sr, 1.5, {
    lossFactor: 0.9964,
    brightness: 0.45,
    pickPosition: 0.2,
    seed: 101,
  });

  assert.equal(samples.length, Math.round(sr * 1.5));

  let maxAbs = 0;
  let earlyEnergy = 0;
  let lateEnergy = 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    assert.ok(Number.isFinite(s));
    const a = Math.abs(s);
    if (a > maxAbs) maxAbs = a;
    sum += s;
    if (i < sr * 0.25) earlyEnergy += s * s;
    if (i > sr * 1.1) lateEnergy += s * s;
  }

  assert.ok(maxAbs > 0.2 && maxAbs <= 0.7, `Unexpected peak amplitude: ${maxAbs}`);
  assert.ok(Math.abs(sum / samples.length) < 0.02, 'Waveform should stay DC-balanced');
  assert.ok(earlyEnergy > lateEnergy * 2.5, 'Plucked string should decay naturally over time');
});
