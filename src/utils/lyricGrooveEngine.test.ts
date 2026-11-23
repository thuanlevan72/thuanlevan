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
  parseSectionKaraokeLines,
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

test('Tone Am song draft-khoang-cach-hai-ta-am resolves all 8 sections, lofi-chill groove, and authentic notes', () => {
  const starters = createStarterDrafts();
  const amSong = starters.find((d) => d.id === 'draft-khoang-cach-hai-ta-am');
  assert.ok(amSong, 'draft-khoang-cach-hai-ta-am must exist in createStarterDrafts');
  assert.equal(amSong.keyRoot, 'A');
  assert.equal(amSong.scaleMode, 'minor');
  assert.equal(amSong.mood, 'lofi-chill');
  assert.equal(amSong.bpm, 74);
  assert.equal(amSong.drumPattern, 'lofi');
  assert.equal(amSong.backingPattern, 'auto-song');
  assert.equal(amSong.sections.length, 8);
  assert.equal(amSong.sections[7].kind, 'Interlude');

  const timeline = buildChordTimeline(amSong.sections, {
    backingPattern: amSong.backingPattern,
    chordArpStyles: amSong.chordArpStyles,
    songMood: amSong.mood,
  });
  assert.equal(timeline.totalBeats, 144);
  assert.ok(timeline.events.some((e) => e.symbol === 'Fmaj13'));
  assert.ok(timeline.events.some((e) => e.symbol === 'Cmaj13'));
  assert.ok(timeline.events.some((e) => e.symbol === 'Asus4'));

  // Auto-song uses multiple distinct arpeggio patterns across the song
  const distinctArps = new Set(timeline.events.map((e) => e.arpPattern));
  assert.ok(distinctArps.size >= 4, `Expected >= 4 distinct arp patterns, got ${distinctArps.size}`);

  // Every single section in draft-khoang-cach-hai-ta-am must carry full syllable-level melody notes
  for (const sec of amSong.sections) {
    const secNotes = amSong.melodyNotes.filter((n) => n.sectionId === sec.id);
    assert.ok(secNotes.length >= 20, `Expected >= 20 melody notes in ${sec.id}, got ${secNotes.length}`);
  }
  // Verse 1 opening motif: E4-A4-A4-C5-B4-A4 ("Dường như khoảng cách hai ta")
  const v1Notes = amSong.melodyNotes.filter((n) => n.sectionId === 'sec-kcht-verse-1');
  assert.deepEqual(
    v1Notes.slice(0, 6).map((n) => n.midi),
    [64, 69, 69, 72, 71, 69]
  );

  // Karaoke teleprompter parser extracts chord-aligned segments per line using chordSchedule
  const chorusLines = parseSectionKaraokeLines(amSong.sections[5]);
  assert.ok(chorusLines.length >= 3);
  assert.ok(chorusLines[0].segments.some((s) => s.chordSymbol === 'Fmaj7'));
  assert.ok(chorusLines[0].endBeat > chorusLines[0].startBeat);
  assert.equal(chorusLines[0].startBeat, 0);
});

test('Tone C song draft-thang-tu-la-loi-noi-doi-cua-em resolves all 192 beats, chords, and authentic vocal registers', () => {
  const starters = createStarterDrafts();
  const thangTu = starters.find((d) => d.id === 'draft-thang-tu-la-loi-noi-doi-cua-em');
  assert.ok(thangTu, 'draft-thang-tu-la-loi-noi-doi-cua-em must exist');
  assert.equal(thangTu.keyRoot, 'C');
  assert.equal(thangTu.scaleMode, 'major');
  assert.equal(thangTu.bpm, 67);
  assert.equal(thangTu.drumPattern, 'none');
  assert.equal(thangTu.backingPattern, 'auto-song');
  assert.equal(thangTu.sections.length, 7);

  const timeline = buildChordTimeline(thangTu.sections, {
    backingPattern: thangTu.backingPattern,
    chordArpStyles: thangTu.chordArpStyles,
    songMood: thangTu.mood,
  });
  assert.equal(timeline.totalBeats, 192);
  for (const ch of ['Fmaj7', 'Fm', 'C/E', 'F#dim', 'Fm6', 'Ebdim', 'Asus4', 'A']) {
    assert.ok(timeline.events.some((e) => e.symbol === ch), `Missing chord ${ch}`);
    assert.equal(resolveChordVoicingNotes(ch).valid, true, `Chord ${ch} failed voicing`);
  }

  for (const sec of thangTu.sections) {
    const secNotes = thangTu.melodyNotes.filter((n) => n.sectionId === sec.id);
    assert.ok(secNotes.length >= 10, `Expected >= 10 notes in ${sec.id}, got ${secNotes.length}`);
  }

  // Verse 1 opening: "Mùa xuân có em như chưa bắt đầu" = A4 B4 C5 B4 A4 G4 A4 E4
  const v1 = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-verse-1');
  assert.deepEqual(
    v1.slice(0, 8).map((n) => n.midi),
    [69, 71, 72, 71, 69, 67, 69, 64]
  );

  // Verse 2 warm chest register <= E5 (76)
  const v2 = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-verse-2');
  assert.ok(v2.every((n) => n.midi <= 76), 'Verse 2 notes should stay in chest register <= E5(76)');

  // Chorus 1 ends on sustained A5(81) hold
  const c1 = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-chorus-1');
  assert.equal(c1[c1.length - 1].midi, 81);
  assert.ok(c1[c1.length - 1].durationBeats >= 2.5);

  // Chorus 2 ends on B4(71) -> C#5(73) Picardy cadence
  const c2 = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-chorus-2');
  assert.deepEqual(
    c2.slice(-2).map((n) => n.midi),
    [71, 73]
  );
});

test('Multi-pattern arpeggio resolution supports auto-song variety and per-chord overrides', () => {
  const plainSection = {
    id: 'sec-arp-test',
    kind: 'Verse' as const,
    label: 'Verse',
    bars: 4 as const,
    text:
      '[Fmaj7]Câu một [G]đây\n' +
      '[Fmaj7]Câu hai [Am]này\n' +
      '[Fmaj7]Câu ba [Dm7]ơi\n' +
      '[Fmaj7]Câu bốn [G]xong',
  };

  // Same chord [Fmaj7] gets varied arpeggio styles across different bars under 'auto-song'
  const autoTimeline = buildChordTimeline([plainSection], {
    backingPattern: 'auto-song',
    songMood: 'pop-ballad',
  });
  const fmaj7Arps = autoTimeline.events
    .filter((e) => e.symbol === 'Fmaj7')
    .map((e) => e.arpPattern);
  assert.equal(fmaj7Arps.length, 4);
  assert.ok(new Set(fmaj7Arps).size >= 2, 'Same chord Fmaj7 should vary arpeggio styles in auto-song mode');

  // Per-chord override in chordArpStyles takes highest precedence over both auto-song and explicit global pattern
  const overrideMap = { 'sec-arp-test:2': 'pinch-plucked' as const };
  const overriddenTimeline = buildChordTimeline([plainSection], {
    backingPattern: 'rich-block',
    chordArpStyles: overrideMap,
    songMood: 'pop-ballad',
  });
  assert.equal(overriddenTimeline.events[0].arpPattern, 'rich-block');
  assert.equal(overriddenTimeline.events[2].arpPattern, 'pinch-plucked');

  const slots = extractSectionBarSlots(plainSection, 'Cmaj7', {
    backingPattern: 'rich-block',
    chordArpStyles: overrideMap,
    songMood: 'pop-ballad',
  });
  assert.equal(slots[1].arpPattern, 'pinch-plucked');
});

test('Chord accompaniment register stays cleanly below melody register (~1 octave separation)', () => {
  const starters = createStarterDrafts();
  for (const draft of starters) {
    const { events } = buildChordTimeline(draft.sections, {
      backingPattern: draft.backingPattern,
      chordArpStyles: draft.chordArpStyles,
      songMood: draft.mood,
      melodyNotes: draft.melodyNotes,
    });
    for (const ev of events) {
      const rhMax = Math.max(...(ev.rightHandMidis ?? [0]));
      const bassMax = Math.max(...(ev.bassMidis ?? [0]));
      assert.ok(
        rhMax <= 62,
        `Backing chord ${ev.symbol} top note ${rhMax} crept into melody octave in ${draft.id}`
      );
      assert.ok(
        bassMax <= 55,
        `Backing bass ${ev.symbol} fifth ${bassMax} crept too high in ${draft.id}`
      );
    }

    // Verify average backing pitch is well below average melody pitch (~1 octave separation)
    if (draft.melodyNotes.length > 0 && events.length > 0) {
      const avgMelody =
        draft.melodyNotes.reduce((s, n) => s + n.midi, 0) / draft.melodyNotes.length;
      const allBacking = events.flatMap((e) => e.rightHandMidis ?? []);
      const avgBacking = allBacking.reduce((s, m) => s + m, 0) / allBacking.length;
      assert.ok(
        avgMelody - avgBacking >= 10,
        `Expected >= 10 semitones separation between melody (${avgMelody.toFixed(1)}) and chords (${avgBacking.toFixed(1)}) in ${draft.id}`
      );
    }
  }
});


