import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeSectionLyrics,
  buildChordTimeline,
  buildMidiFileBytes,
  classifyVietnameseTone,
  COMPUTER_KEY_TO_MIDI,
  countVietnameseSyllables,
  createStarterDrafts,
  encodePcmToWav,
  extractSectionBarSlots,
  extractVietnameseRhymeKey,
  generateHarmonicMelodyForSection,
  getDiatonicChordForPianoKey,
  getScaleNotes,
  parseChordsFromLine,
  PROGRESSION_PRESETS,
  quantizePitchFramesToNotes,
  reorderSongSections,
  resolveChordVoicingNotes,
  resolvePianistVoicing,
  snapFrequencyToScaleMidi,
  SONG_IDEA_TEMPLATES,
  suggestNextChords,
  transposeChordSymbol,
  transposeDraftAll,
  updateBarChordInSectionText,
} from './lyricGrooveEngine.ts';
import { Note } from 'tonal';

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

test('resolveChordVoicingNotes and resolvePianistVoicing produce two-hand voicings with smooth voice leading', () => {
  const root = resolveChordVoicingNotes('Fmaj7', 0);
  const inv1 = resolveChordVoicingNotes('Fmaj7', 1);
  assert.equal(root.valid, true);
  assert.equal(inv1.valid, true);
  assert.equal(root.notes.length, 4);
  assert.notDeepEqual(root.notes, inv1.notes);

  const slash = resolveChordVoicingNotes('G/B', 0);
  assert.equal(slash.valid, true);
  assert.ok(slash.bassNote.startsWith('B'));

  const first = resolvePianistVoicing('Cmaj7', 0);
  const nextSmooth = resolvePianistVoicing('G13', 0, first.rightHandMidis);
  assert.equal(nextSmooth.valid, true);
  assert.ok(first.bassMidis.length === 2 && first.bassMidis[0] >= 36 && first.bassMidis[0] <= 48);
  const avgDiff =
    Math.abs(
      first.rightHandMidis.reduce((s, v) => s + v, 0) / first.rightHandMidis.length -
        nextSmooth.rightHandMidis.reduce((s, v) => s + v, 0) / nextSmooth.rightHandMidis.length
    );
  assert.ok(avgDiff <= 8, `Expected smooth voice leading center distance <= 8 semitones, got ${avgDiff}`);

  const invalid = resolveChordVoicingNotes('???', 0);
  assert.equal(invalid.valid, false);
});

test('transposeChordSymbol and transposeDraftAll shift key, slash chords, lyrics tags, and MIDI notes cleanly', () => {
  assert.equal(transposeChordSymbol('Am9', 2), 'Bm9');
  assert.equal(transposeChordSymbol('G/B', 1), 'Ab/C');
  assert.equal(transposeChordSymbol('Fmaj7', -1), 'Emaj7');

  const [starter] = createStarterDrafts();
  assert.equal(starter.backingInstrument, 'piano-ballad');
  assert.equal(starter.melodyInstrument, 'piano');

  const transposedUp = transposeDraftAll(starter, 2);
  assert.equal(transposedUp.keyRoot, 'D');
  assert.ok(transposedUp.sections[0].text.includes('[Bm9]'));
  assert.equal(transposedUp.melodyNotes[0].midi, starter.melodyNotes[0].midi + 2);
});

test('PROGRESSION_PRESETS and COMPUTER_KEY_TO_MIDI generate valid chords and C3-C5 key mapping', () => {
  assert.ok(PROGRESSION_PRESETS.length >= 6);
  for (const preset of PROGRESSION_PRESETS) {
    const majorChords = preset.buildChords('C', 'major');
    const minorChords = preset.buildChords('A', 'minor');
    assert.ok(majorChords.length >= 4 && minorChords.length >= 4);
    for (const sym of [...majorChords, ...minorChords]) {
      assert.equal(resolveChordVoicingNotes(sym, 0).valid, true, `Invalid chord in preset ${preset.id}: ${sym}`);
    }
  }

  assert.equal(COMPUTER_KEY_TO_MIDI.z, 48); // C3
  assert.equal(COMPUTER_KEY_TO_MIDI.q, 60); // C4
  assert.equal(COMPUTER_KEY_TO_MIDI.i, 72); // C5
});

test('snapFrequencyToScaleMidi and quantizePitchFramesToNotes snap humming frequencies cleanly into active scale', () => {
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
  assert.ok(timeline.events.every((ev) => Array.isArray(ev.rightHandMidis) && Array.isArray(ev.bassMidis)));

  const reordered = reorderSongSections(starter.sections, 0, 2);
  assert.equal(reordered[2].id, starter.sections[0].id);

  const midiBytes = buildMidiFileBytes(starter);
  assert.equal(String.fromCharCode(...midiBytes.slice(0, 4)), 'MThd');
  assert.equal(String.fromCharCode(...midiBytes.slice(14, 18)), 'MTrk');
  assert.ok(midiBytes.length > 64);

  const wavBytes = encodePcmToWav([new Float32Array([0, 0.5, -0.5, 0])], 44100);
  assert.equal(String.fromCharCode(...wavBytes.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...wavBytes.slice(8, 12)), 'WAVE');
  assert.equal(wavBytes.length, 44 + 4 * 2);
});

test('extractSectionBarSlots and updateBarChordInSectionText swap bar chords while preserving Vietnamese lyrics', () => {
  const section = {
    id: 'sec-bar-test',
    kind: 'Chorus' as const,
    label: 'Chorus',
    bars: 4 as const,
    text:
      '[Fmaj7]Nếu một mai cơn [G13]gió ngừng bay\n' +
      '[Em7]Ta gặp nhau dưới [Am9]hiên chiều nay\n' +
      '[Dm9]Để hợp âm còn [Fm6]vang vòng tay\n' +
      '[Cmaj7]Viết tiếp khúc hát [G7]chưa từng phai',
  };

  const slots = extractSectionBarSlots(section, 'Cmaj7');
  assert.equal(slots.length, 4);
  assert.equal(slots[0].primaryChord, 'Fmaj7');
  assert.equal(slots[0].secondaryChord, 'G13');
  assert.equal(slots[1].primaryChord, 'Em7');
  assert.equal(slots[2].primaryChord, 'Dm9');
  assert.equal(slots[3].primaryChord, 'Cmaj7');

  const updatedText = updateBarChordInSectionText(section, 1, 'Cadd9');
  assert.ok(updatedText.includes('[Cadd9]Ta gặp nhau dưới [Am9]hiên chiều nay'));
  assert.ok(updatedText.includes('[Fmaj7]Nếu một mai cơn [G13]gió ngừng bay'));
  const updatedSlots = extractSectionBarSlots({ ...section, text: updatedText }, 'Cmaj7');
  assert.equal(updatedSlots[1].primaryChord, 'Cadd9');
});

test('getDiatonicChordForPianoKey maps scale degrees to playable chords cleanly', () => {
  const cMajorRoot = getDiatonicChordForPianoKey(60, 'C', 'major', 'pop-ballad'); // C4 -> Cadd9
  const aMinorSixth = getDiatonicChordForPianoKey(69, 'C', 'major', 'pop-ballad'); // A4 -> Am7
  assert.equal(cMajorRoot, 'Cadd9');
  assert.equal(aMinorSixth, 'Am7');
  assert.equal(resolveChordVoicingNotes(cMajorRoot).valid, true);

  const minorTonic = getDiatonicChordForPianoKey(69, 'A', 'minor', 'neo-soul'); // A4 -> Am9
  assert.equal(minorTonic, 'Am9');
  assert.equal(resolveChordVoicingNotes(minorTonic).valid, true);
});

test('generateHarmonicMelodyForSection creates singable in-scale melody aligned with chord bars', () => {
  const [starter] = createStarterDrafts();
  const chorus = starter.sections[2];
  const allowedChromas = new Set(
    getScaleNotes('C', 'major')
      .map((n) => Note.chroma(n))
      .filter((c): c is number => typeof c === 'number')
  );

  const take1 = generateHarmonicMelodyForSection(chorus, 'C', 'major', 1);
  const take2 = generateHarmonicMelodyForSection(chorus, 'C', 'major', 2);

  assert.ok(take1.length >= 8);
  assert.ok(take2.length >= 8);
  assert.notDeepEqual(
    take1.map((n) => n.midi),
    take2.map((n) => n.midi)
  );
  for (const note of take1) {
    assert.equal(note.sectionId, chorus.id);
    assert.ok(note.startBeat >= 0 && note.startBeat < chorus.bars * 4);
    assert.ok(note.midi >= 60 && note.midi <= 79);
    assert.ok(allowedChromas.has(((note.midi % 12) + 12) % 12));
  }
});

test('SONG_IDEA_TEMPLATES provide 4 complete style starters with valid chords', () => {
  assert.equal(SONG_IDEA_TEMPLATES.length, 4);
  for (const tpl of SONG_IDEA_TEMPLATES) {
    assert.ok(tpl.bpm >= 60 && tpl.bpm <= 140);
    const dummySection = {
      id: `sec-${tpl.id}`,
      kind: 'Chorus' as const,
      label: tpl.label,
      bars: 4 as const,
      text: tpl.sectionText,
    };
    const slots = extractSectionBarSlots(dummySection);
    assert.equal(slots.length, 4);
    for (const slot of slots) {
      assert.equal(
        resolveChordVoicingNotes(slot.primaryChord).valid,
        true,
        `Invalid chord ${slot.primaryChord} in template ${tpl.id}`
      );
    }
  }
});
