import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computePianoFilterCurve,
  computePianoStereoPan,
  computeSampledTimbreCurve,
  findNearestPianoSample,
  getPianoRegisterProfile,
  midiToFrequency,
  PIANO_SAMPLE_MANIFEST,
} from './grandPianoEngine.ts';

test('midiToFrequency returns exact 12-TET pitch frequencies across piano registers', () => {
  assert.equal(midiToFrequency(69), 440); // A4
  assert.ok(Math.abs(midiToFrequency(60) - 261.625565) < 0.001); // C4
  assert.equal(midiToFrequency(57), 220); // A3
  assert.equal(midiToFrequency(81), 880); // A5
});

test('PIANO_SAMPLE_MANIFEST covers full 88-key range with valid self-hosted MP3 URLs', () => {
  assert.equal(PIANO_SAMPLE_MANIFEST.length, 30);
  assert.equal(PIANO_SAMPLE_MANIFEST[0].midi, 21); // A0
  assert.equal(PIANO_SAMPLE_MANIFEST[PIANO_SAMPLE_MANIFEST.length - 1].midi, 108); // C8
  for (const sample of PIANO_SAMPLE_MANIFEST) {
    assert.ok(sample.url.startsWith('/audio/piano/'));
    assert.ok(sample.url.endsWith('.mp3'));
  }
});

test('findNearestPianoSample maps every key from C2..C6 within +/-2 semitones of real recording', () => {
  const c4 = findNearestPianoSample(60);
  assert.equal(c4.sample.key, 'C4');
  assert.equal(c4.semitoneOffset, 0);
  assert.equal(c4.playbackRate, 1);

  const d4 = findNearestPianoSample(62);
  assert.ok(Math.abs(d4.semitoneOffset) <= 2);
  assert.ok(d4.playbackRate > 0.89 && d4.playbackRate < 1.13);

  for (let midi = 21; midi <= 108; midi++) {
    const match = findNearestPianoSample(midi);
    assert.ok(Math.abs(match.semitoneOffset) <= 2, `Expected offset <= 2 for midi ${midi}`);
  }
});

test('computeSampledTimbreCurve opens shimmer cleanly on forte while keeping pianissimo warm', () => {
  const soft = computeSampledTimbreCurve(261.63, 0.22, false);
  const loud = computeSampledTimbreCurve(261.63, 0.92, true);
  assert.ok(loud.attackCutoffHz > soft.attackCutoffHz);
  assert.ok(loud.sustainCutoffHz > soft.sustainCutoffHz);
  assert.ok(loud.attackCutoffHz >= 10000);
});

test('getPianoRegisterProfile assigns distinct acoustic harmonic profiles per register band', () => {
  const lowBass = getPianoRegisterProfile(36); // C2
  const highBass = getPianoRegisterProfile(48); // C3
  const tenor = getPianoRegisterProfile(60); // C4
  const alto = getPianoRegisterProfile(72); // C5
  const treble = getPianoRegisterProfile(84); // C6

  assert.equal(lowBass.band, 'bass-low');
  assert.equal(highBass.band, 'bass-high');
  assert.equal(tenor.band, 'tenor');
  assert.equal(alto.band, 'alto');
  assert.equal(treble.band, 'treble');

  assert.ok(lowBass.decaySec > tenor.decaySec && tenor.decaySec > treble.decaySec);
  assert.ok(lowBass.strikeDecaySec > tenor.strikeDecaySec && tenor.strikeDecaySec > treble.strikeDecaySec);
  assert.ok(lowBass.harmonics[1] > lowBass.harmonics[0]);
  assert.equal(tenor.harmonics[0], 1);
  assert.equal(tenor.coreHarmonics[1], 0);
  assert.ok(tenor.strikeHarmonics.length >= 6);
  assert.ok(lowBass.inharmonicityCents > treble.inharmonicityCents);
});

test('computePianoStereoPan maps low notes left, middle C centered, high treble right', () => {
  assert.equal(computePianoStereoPan(60), 0);
  assert.ok(computePianoStereoPan(36) < 0);
  assert.ok(computePianoStereoPan(84) > 0);
  assert.ok(Math.abs(computePianoStereoPan(24)) <= 0.32);
  assert.ok(Math.abs(computePianoStereoPan(108)) <= 0.32);
});

test('computePianoFilterCurve couples brightness to velocity and settles warmly after hammer attack', () => {
  const soft = computePianoFilterCurve(261.63, 0.25);
  const loud = computePianoFilterCurve(261.63, 0.95);

  assert.ok(loud.startHz > soft.startHz);
  assert.ok(loud.settleHz > soft.settleHz);
  assert.ok(loud.startHz > loud.settleHz && loud.settleHz > loud.tailHz);
  assert.ok(soft.decayTimeSec > 0.1);
});
