import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computePianoFilterCurve,
  computePianoStereoPan,
  getPianoRegisterProfile,
  midiToFrequency,
} from './grandPianoEngine.ts';

test('midiToFrequency returns exact 12-TET pitch frequencies across piano registers', () => {
  assert.equal(midiToFrequency(69), 440); // A4
  assert.ok(Math.abs(midiToFrequency(60) - 261.625565) < 0.001); // C4
  assert.equal(midiToFrequency(57), 220); // A3
  assert.equal(midiToFrequency(81), 880); // A5
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

  // Bass strings sustain significantly longer and carry stronger 2nd/3rd copper-wound harmonics than treble
  assert.ok(lowBass.decaySec > tenor.decaySec && tenor.decaySec > treble.decaySec);
  assert.ok(lowBass.harmonics[1] > lowBass.harmonics[0]);
  assert.equal(tenor.harmonics[0], 1);
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
