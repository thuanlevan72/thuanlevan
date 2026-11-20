import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeSectionLyrics,
  buildChordTimeline,
  buildMidiFileBytes,
  classifyVietnameseTone,
  countVietnameseSyllables,
  createStarterDrafts,
  encodePcmToWav,
  extractVietnameseRhymeKey,
  parseChordsFromLine,
  quantizePitchFramesToNotes,
  reorderSongSections,
  resolveChordVoicingNotes,
  snapFrequencyToScaleMidi,
  suggestNextChords,
} from './lyricGrooveEngine.ts';

test('countVietnameseSyllables and parseChordsFromLine ignore inline chord tags and anchor beats cleanly', () => {
  const line = '[Am7]Nghe giọt mưa [Fmaj7]rơi ngoài hiên [Dm9]đêm nay!';
  assert.equal(countVietnameseSyllables(line), 8);

  const parsed = parseChordsFromLine(line, 4);
  assert.equal(parsed.lyricOnlyLine, 'Nghe giọt mưa rơi ngoài hiên đêm nay!');
  assert.equal(parsed.chords.length, 3);
  assert.deepEqual(
    parsed.chords.map((c) => c.symbol),
    ['Am7', 'Fmaj7', 'Dm9']
  );
  assert.equal(parsed.chords[0].beatOffset, 0);
  assert.ok(parsed.chords[1].beatOffset > 0 && parsed.chords[2].beatOffset >= parsed.chords[1].beatOffset);
});

test('classifyVietnameseTone and extractVietnameseRhymeKey cluster Vietnamese Bằng/Trắc & rhymes accurately', () => {
  assert.equal(classifyVietnameseTone('mưa'), 'bang');
  assert.equal(classifyVietnameseTone('trời'), 'bang');
  assert.equal(classifyVietnameseTone('nắng'), 'trac');
  assert.equal(classifyVietnameseTone('những'), 'trac');

  assert.equal(extractVietnameseRhymeKey('mưa'), extractVietnameseRhymeKey('trưa'));
  assert.equal(extractVietnameseRhymeKey('đêm'), extractVietnameseRhymeKey('êm'));
  assert.equal(extractVietnameseRhymeKey('xa'), extractVietnameseRhymeKey('nhòa'));

  const analysis = analyzeSectionLyrics({
    id: 'test-sec',
    kind: 'Verse',
    label: 'Verse',
    bars: 4,
    text: '[Am7]Đèn vàng hắt qua [Em7]khung cửa quen\n[Fmaj7]Nhịp tim bỗng ngân [Cmaj7]lên dịu êm\n[Dm9]Ngồi bên hiên mưa [G13]rơi thêm mềm',
  });

  assert.equal(analysis.lines.length, 3);
  assert.equal(analysis.totalChords, 6);
  assert.ok(analysis.rhymeFamilies.length >= 1);
});

test('suggestNextChords returns 5 valid harmonic next-chord suggestions per mood style', () => {
  const neoSoul = suggestNextChords('Dm9', 'C', 'major', 'neo-soul');
  assert.equal(neoSoul.length, 5);
  assert.ok(neoSoul.some((s) => s.colorLevel === 'II-V-I'));
  assert.ok(neoSoul.every((s) => s.notes.length >= 3));

  const lofi = suggestNextChords('Am7', 'C', 'major', 'lofi-chill');
  assert.equal(lofi.length, 5);

  const acoustic = suggestNextChords('Fadd9', 'F', 'major', 'acoustic');
  assert.equal(acoustic.length, 5);

  const minorKey = suggestNextChords('Am7', 'A', 'minor', 'rnb');
  assert.equal(minorKey.length, 5);
});

test('resolveChordVoicingNotes supports color chords, slash chords, and voicing inversions', () => {
  const root = resolveChordVoicingNotes('Fmaj7', 0);
  const inv1 = resolveChordVoicingNotes('Fmaj7', 1);
  assert.equal(root.valid, true);
  assert.equal(inv1.valid, true);
  assert.equal(root.notes.length, 4);
  assert.notDeepEqual(root.notes, inv1.notes);

  const slash = resolveChordVoicingNotes('G/B', 0);
  assert.equal(slash.valid, true);
  assert.ok(slash.bassNote.startsWith('B'));

  const invalid = resolveChordVoicingNotes('???', 0);
  assert.equal(invalid.valid, false);
});

test('snapFrequencyToScaleMidi and quantizePitchFramesToNotes snap humming frequencies cleanly into active scale', () => {
  // 440Hz = A4 (MIDI 69) is in C major; 466.16Hz = A#4 (MIDI 70) must snap to 69 or 71 (A4 or B4)
  const snappedC = snapFrequencyToScaleMidi(466.16, 'C', 'major', true);
  assert.ok(snappedC === 69 || snappedC === 71, `Expected A4(69) or B4(71), got ${snappedC}`);

  const unsnapped = snapFrequencyToScaleMidi(466.16, 'C', 'major', false);
  assert.equal(unsnapped, 70);

  const quantized = quantizePitchFramesToNotes(
    [
      { timeSec: 0.0, freqHz: 261.63, clarity: 0.92 },
      { timeSec: 0.12, freqHz: 262.1, clarity: 0.91 },
      { timeSec: 0.25, freqHz: 293.66, clarity: 0.95 },
      { timeSec: 0.4, freqHz: 329.63, clarity: 0.94 },
    ],
    120,
    'sec-chorus-1',
    16,
    'C',
    'major',
    true
  );
  assert.ok(quantized.length >= 2);
  assert.ok(quantized.every((n) => n.sectionId === 'sec-chorus-1' && n.midi >= 48 && n.midi <= 84));
});

test('buildChordTimeline, reorderSongSections, buildMidiFileBytes, and encodePcmToWav produce valid structured outputs', () => {
  const [starter] = createStarterDrafts();
  const timeline = buildChordTimeline(starter.sections);
  assert.ok(timeline.events.length >= 10);
  assert.equal(timeline.totalBeats, 48); // 3 sections * 4 bars * 4 beats

  const reordered = reorderSongSections(starter.sections, 0, 2);
  assert.equal(reordered[2].id, starter.sections[0].id);

  const midiBytes = buildMidiFileBytes(starter);
  // Check SMF header 'MThd'
  assert.equal(String.fromCharCode(...midiBytes.slice(0, 4)), 'MThd');
  // Check track chunk 'MTrk'
  assert.equal(String.fromCharCode(...midiBytes.slice(14, 18)), 'MTrk');
  assert.ok(midiBytes.length > 64);

  const wavBytes = encodePcmToWav([new Float32Array([0, 0.5, -0.5, 0])], 44100);
  assert.equal(String.fromCharCode(...wavBytes.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...wavBytes.slice(8, 12)), 'WAVE');
  assert.equal(wavBytes.length, 44 + 4 * 2);
});
