import assert from 'node:assert/strict';
import test from 'node:test';
import {
  alignSectionLyricsToMelody,
  analyzeSectionLyrics,
  ARPEGGIO_PATTERN_META,
  buildChordTimeline,
  buildDraftVersionEntry,
  buildMidiFileBytes,
  buildProfilePlaylist,
  buildSynchronizedLyricEvents,
  classifyVietnameseTone,
  cloneSketchpadDraft,
  COMPUTER_KEY_TO_MIDI,
  countVietnameseSyllables,
  createBlankDraft,
  createStarterDrafts,
  encodePcmToWav,
  extractSectionBarSlots,
  extractVietnameseRhymeKey,
  generateHarmonicMelodyForSection,
  getDiatonicChordForPianoKey,
  getDraftStyleLabel,
  getScaleNotes,
  getShortcutLabelsForOctave,
  hasDraftUnsavedChanges,
  isSectionMelodyMuted,
  midiToNoteName,
  normalizeKeyRoot,
  parseChordsFromLine,
  parseSectionKaraokeLines,
  PIANO_MAX_MIDI,
  PIANO_MIN_MIDI,
  pickMonotonicVoiceSlot,
  PROGRESSION_PRESETS,
  quantizePitchFramesToNotes,
  reorderSongSections,
  resolveBeatsPerBar,
  resolveChordVoicingNotes,
  resolveComputerKeyToMidi,
  resolveMelodyPlaybackMode,
  resolvePairedInstrumentsForBacking,
  resolvePairedInstrumentsForMelody,
  resolvePianistVoicing,
  restoreDraftFromVersion,
  RHYTHM_STYLE_META,
  sanitizePartSchedule,
  snapFrequencyToScaleMidi,
  snapMidiToScale,
  SONG_IDEA_TEMPLATES,
  suggestNextChords,
  summarizeDraftChanges,
  transposeChordSymbol,
  transposeDraftAll,
  transposeDraftToKey,
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

  const starter = createStarterDrafts().find((d) => d.id === 'draft-dem-pho-mua-piano')!;
  assert.ok(starter);
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
  const starter = createStarterDrafts().find((d) => d.id === 'draft-dem-pho-mua-piano')!;
  assert.ok(starter);
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
  const starter = createStarterDrafts().find((d) => d.id === 'draft-dem-pho-mua-piano')!;
  assert.ok(starter);
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

test('Deprecated tracks draft-khach-vang-lai and draft-khoang-cach-hai-ta-am are completely removed', () => {
  const starterIds = new Set(createStarterDrafts().map((d) => d.id));
  const playlistIds = new Set(buildProfilePlaylist().map((d) => d.id));
  assert.equal(starterIds.has('draft-khach-vang-lai'), false);
  assert.equal(starterIds.has('draft-khoang-cach-hai-ta-am'), false);
  assert.equal(playlistIds.has('draft-khach-vang-lai'), false);
  assert.equal(playlistIds.has('draft-khoang-cach-hai-ta-am'), false);
});

test('Sheet song draft-phia-sau-mot-co-gai transcribes 9 sections (Fm -> F#m modulation), chords, lyrics, and vocal melody', () => {
  const starters = createStarterDrafts();
  const psmcg = starters.find((d) => d.id === 'draft-phia-sau-mot-co-gai');
  assert.ok(psmcg, 'draft-phia-sau-mot-co-gai must exist in createStarterDrafts');
  assert.equal(psmcg.keyRoot, 'F');
  assert.equal(psmcg.scaleMode, 'minor');
  assert.equal(psmcg.mood, 'pop-ballad');
  assert.equal(psmcg.bpm, 72);
  assert.equal(psmcg.drumPattern, 'ballad');
  assert.equal(psmcg.backingPattern, 'auto-song');
  assert.equal(psmcg.melodyMuted, false);
  assert.equal(psmcg.sections.length, 9);

  const timeline = buildChordTimeline(psmcg.sections, {
    backingPattern: psmcg.backingPattern,
    chordArpStyles: psmcg.chordArpStyles,
    songMood: psmcg.mood,
    melodyNotes: psmcg.melodyNotes,
  });
  assert.equal(timeline.totalBeats, 256); // 64 bars * 4 beats
  for (const ch of [
    'Dbmaj7',
    'Eb',
    'Cm7',
    'Fm7',
    'Bbm7',
    'C7',
    'Abmaj7',
    'Gm7b5',
    'Bm7',
    'C#7',
    'Dmaj7',
    'E',
    'C#m7',
    'F#m7',
    'F#m',
  ]) {
    assert.ok(timeline.events.some((e) => e.symbol === ch), `Missing chord ${ch}`);
    assert.equal(resolveChordVoicingNotes(ch).valid, true, `Invalid chord ${ch}`);
  }

  // Chorus Up 1 (+1 semitone modulation into F#m) mirrors Chorus 1 notes + 1 semitone
  const c1 = psmcg.melodyNotes.filter((n) => n.sectionId === 'sec-psmcg-chorus-1');
  const cu1 = psmcg.melodyNotes.filter((n) => n.sectionId === 'sec-psmcg-chorus-up-1');
  assert.equal(c1.length, cu1.length);
  for (let i = 0; i < c1.length; i++) {
    assert.equal(cu1[i].midi, c1[i].midi + 1);
    assert.equal(cu1[i].startBeat, c1[i].startBeat);
  }

  // Synchronized words align directly onto melody note beat slots
  const syncedWords = alignSectionLyricsToMelody(
    psmcg.sections[3],
    psmcg.melodyNotes.filter((n) => n.sectionId === 'sec-psmcg-chorus-1'),
    0
  );
  assert.ok(syncedWords.some((w) => w.text === 'bước' && w.startBeat === 0));
  assert.ok(syncedWords.some((w) => w.text === 'sống' && Math.abs(w.startBeat - 16) < 0.05));

  const songWords = buildSynchronizedLyricEvents(psmcg.sections, psmcg.melodyNotes);
  assert.ok(songWords.length >= 90);
  for (let i = 1; i < songWords.length; i++) {
    assert.ok(
      songWords[i].absStart >= songWords[i - 1].absStart - 0.001,
      `Lyric word ${songWords[i].text} regressed before ${songWords[i - 1].text}`
    );
  }
});

test('Tone C 2/4 sheet song draft-thang-tu-la-loi-noi-doi-cua-em transcribes all 11 sections, 176 beats, chords, and melody', () => {
  const starters = createStarterDrafts();
  const thangTu = starters.find((d) => d.id === 'draft-thang-tu-la-loi-noi-doi-cua-em');
  assert.ok(thangTu, 'draft-thang-tu-la-loi-noi-doi-cua-em must exist');
  assert.equal(thangTu.keyRoot, 'C');
  assert.equal(thangTu.scaleMode, 'major');
  assert.equal(thangTu.timeSignature, '2/4');
  assert.equal(thangTu.bpm, 72);
  assert.equal(thangTu.drumPattern, 'none');
  assert.equal(thangTu.backingPattern, 'auto-song');
  assert.equal(thangTu.sections.length, 11);

  const beatsPerBar = resolveBeatsPerBar(thangTu.timeSignature);
  assert.equal(beatsPerBar, 2);

  const timeline = buildChordTimeline(thangTu.sections, {
    backingPattern: thangTu.backingPattern,
    chordArpStyles: thangTu.chordArpStyles,
    songMood: thangTu.mood,
    beatsPerBar,
  });
  assert.equal(timeline.totalBeats, 176);
  for (const ch of [
    'F',
    'G7/F',
    'Em',
    'Am',
    'Dm7',
    'G',
    'Asus4',
    'A',
    'Fmaj7',
    'Cmaj7',
    'C7/G',
    'Em7',
    'C',
    'Fm',
    'D#dim7',
    'C/E',
    'Ddim7',
  ]) {
    assert.ok(timeline.events.some((e) => e.symbol === ch), `Missing sheet chord ${ch}`);
    assert.equal(resolveChordVoicingNotes(ch).valid, true, `Chord ${ch} failed voicing`);
  }
  assert.equal(resolveChordVoicingNotes('D#°7').valid, true);
  assert.equal(resolveChordVoicingNotes('D°7').valid, true);

  for (const sec of thangTu.sections) {
    const secNotes = thangTu.melodyNotes.filter((n) => n.sectionId === sec.id);
    assert.ok(secNotes.length >= 15, `Expected >= 15 notes in ${sec.id}, got ${secNotes.length}`);
  }

  // Verse 1A opening: "Mùa xuân có em như chưa bắt đầu" = F4 G4 A4 G4 F4 E4 E4 D4 E4
  const v1a = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-verse-1a');
  assert.deepEqual(
    v1a.slice(0, 9).map((n) => n.midi),
    [65, 67, 69, 67, 65, 64, 64, 62, 64]
  );

  // Verse 2A iconic motif: "Khúc nhạc hòa cùng" = E4 A4 G4 A4
  const v2a = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-verse-2a');
  assert.deepEqual(
    v2a.slice(0, 4).map((n) => n.midi),
    [64, 69, 67, 69]
  );

  // Chorus 1B (Fine) & 2B end on sustained A5(81) hold
  const c1b = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-chorus-1b');
  assert.equal(c1b[c1b.length - 1].midi, 81);
  assert.ok(c1b[c1b.length - 1].durationBeats >= 2.5);

  const c2b = thangTu.melodyNotes.filter((n) => n.sectionId === 'sec-tt-chorus-2b');
  assert.equal(c2b[c2b.length - 1].midi, 81);
});

test('All flagship songs maintain 1:1 chord-to-syllable synchronization and unhurried note durations', () => {
  const starters = createStarterDrafts();
  const targets = [
    'draft-phia-sau-mot-co-gai',
    'draft-di-vang-nhat-nhoa',
    'draft-thang-tu-la-loi-noi-doi-cua-em',
  ];
  for (const id of targets) {
    const draft = starters.find((d) => d.id === id);
    assert.ok(draft, `Missing starter ${id}`);
    const beatsPerBar = resolveBeatsPerBar(draft.timeSignature);
    for (const sec of draft.sections) {
      if (sec.kind === 'Intro') continue;
      const sectionBeats = sec.bars * beatsPerBar;
      const sched = sec.chordSchedule ?? [];
      const tagMatches = Array.from(sec.text.matchAll(/\[([^\]]+)\]([^\s[\n]*)/g));
      assert.equal(
        sched.length,
        tagMatches.length,
        `${id}/${sec.id}: chordSchedule length (${sched.length}) must match [Chord] tag count (${tagMatches.length})`
      );

      const secNotes = draft.melodyNotes.filter((n) => n.sectionId === sec.id);
      for (const note of secNotes) {
        assert.ok(
          note.startBeat >= 0 && note.startBeat + note.durationBeats <= sectionBeats + 0.05,
          `${id}/${sec.id}: note ${note.id} spills past ${sectionBeats} beats`
        );
        assert.ok(
          note.durationBeats >= 0.2,
          `${id}/${sec.id}: note ${note.id} too rushed (${note.durationBeats} beats)`
        );
      }

      tagMatches.forEach((m, idx) => {
        const chordItem = sched[idx];
        assert.ok(
          chordItem.startBeat >= 0 && chordItem.startBeat < sectionBeats,
          `${id}/${sec.id}: chord ${chordItem.symbol} out of bounds`
        );
        const attachedSyllable = m[2].trim();
        if (attachedSyllable.length > 0 && !attachedSyllable.startsWith('(')) {
          const matchingNote = secNotes.find(
            (n) => Math.abs(n.startBeat - chordItem.startBeat) <= 0.05
          );
          assert.ok(
            matchingNote,
            `${id}/${sec.id}: [${chordItem.symbol}]${attachedSyllable} at beat ${chordItem.startBeat} does not align with a vocal melodyNote`
          );
        }
      });

      const karaokeLines = parseSectionKaraokeLines(sec, beatsPerBar);
      assert.ok(karaokeLines.length >= 1, `${id}/${sec.id}: expected parsed karaoke lines`);
    }
  }
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

test('Piano range spans C2 (36) through B5 (83) and C6 (84) across keyboard shortcuts and scale clamping', () => {
  assert.equal(PIANO_MIN_MIDI, 36);
  assert.equal(midiToNoteName(PIANO_MIN_MIDI), 'C2');
  assert.equal(PIANO_MAX_MIDI, 84);
  assert.equal(midiToNoteName(83), 'B5');
  assert.equal(midiToNoteName(PIANO_MAX_MIDI), 'C6');

  // Octave shift -1 maps Z..M / Q..I starting from C2
  assert.equal(resolveComputerKeyToMidi('z', -1), 36); // C2
  assert.equal(resolveComputerKeyToMidi('i', -1), 60); // C4

  // Octave shift 0 preserves C3..E5 default layout
  assert.equal(resolveComputerKeyToMidi('z', 0), 48); // C3
  assert.equal(resolveComputerKeyToMidi('q', 0), 60); // C4
  assert.equal(resolveComputerKeyToMidi('i', 0), 72); // C5
  assert.equal(resolveComputerKeyToMidi('p', 0), 76); // E5

  // Octave shift +1 reaches B5 (83) and C6 (84) while guarding out-of-range keys above C6
  assert.equal(resolveComputerKeyToMidi('q', 1), 72); // C5
  assert.equal(resolveComputerKeyToMidi('u', 1), 83); // B5
  assert.equal(resolveComputerKeyToMidi('i', 1), 84); // C6
  assert.equal(resolveComputerKeyToMidi('o', 1), null); // Above C6

  const highLabels = getShortcutLabelsForOctave(1);
  assert.equal(highLabels[83], 'U');
  assert.equal(highLabels[84], 'I');

  // Scale snapping preserves C2 low register and B5/C6 high register
  assert.equal(snapMidiToScale(36, 'C', 'major'), 36);
  assert.equal(snapMidiToScale(83, 'C', 'major'), 83);
  assert.equal(snapMidiToScale(84, 'C', 'major'), 84);

  // Transposing preserves C2..C6 bounds without clamping to C3
  const [starter] = createStarterDrafts();
  const lowNoteDraft = {
    ...starter,
    melodyNotes: [{ id: 'low-c3', sectionId: starter.sections[0].id, midi: 48, startBeat: 0, durationBeats: 1, velocity: 0.8 }],
  };
  const downOctave = transposeDraftAll(lowNoteDraft, -12);
  assert.equal(downOctave.melodyNotes[0].midi, 36); // C2 preserved
});

test('buildProfilePlaylist orders latest flagship tracks first and includes custom studio drafts', () => {
  const defaultPlaylist = buildProfilePlaylist();
  assert.ok(defaultPlaylist.length >= 7);
  assert.equal(defaultPlaylist[0].id, 'draft-phia-sau-mot-co-gai');
  assert.equal(defaultPlaylist[1].id, 'draft-di-vang-nhat-nhoa');
  assert.equal(defaultPlaylist[2].id, 'draft-thang-tu-la-loi-noi-doi-cua-em');
  assert.equal(defaultPlaylist[3].id, 'draft-dem-pho-mua-piano');
  assert.equal(defaultPlaylist[0].drumPattern, 'ballad');
  assert.equal(defaultPlaylist[0].melodyMuted, false);
  assert.equal(defaultPlaylist[1].drumPattern, 'ballad');
  assert.equal(getDraftStyleLabel(defaultPlaylist[0]), 'Ballad Beat');
  assert.equal(getDraftStyleLabel(defaultPlaylist[1]), 'Ballad Beat');
  assert.ok(defaultPlaylist.some((d) => d.id === 'lofi-midnight-cafe'));

  // Custom draft saved more recently in Studio takes top spot while preserving all starters
  const starters = createStarterDrafts();
  const customLatest = {
    ...createBlankDraft(9),
    id: 'draft-custom-latest',
    title: 'Bản Demo Mới Nhất',
    updatedAt: starters[0].updatedAt + 120_000,
  };
  const syncedPlaylist = buildProfilePlaylist([...starters, customLatest]);
  assert.equal(syncedPlaylist[0].id, 'draft-custom-latest');
  assert.equal(syncedPlaylist[1].id, 'draft-phia-sau-mot-co-gai');
});

test('draft-di-vang-nhat-nhoa transcribes Tone Em 4/4 sheet sections, chords, lyrics, and vocal melody', () => {
  const starters = createStarterDrafts();
  const song = starters.find((d) => d.id === 'draft-di-vang-nhat-nhoa');
  assert.ok(song, 'Expected draft-di-vang-nhat-nhoa starter draft');
  assert.equal(song.keyRoot, 'E');
  assert.equal(song.scaleMode, 'minor');
  assert.equal(song.bpm, 74);
  assert.equal(song.melodyMuted, false);
  assert.equal(song.melodyPlaybackMode, 'all');

  // 5 sections: Intro(8) + Verse1(8) + Verse2(8) + Chorus(8) + Outro(4) = 36 bars
  assert.equal(song.sections.length, 5);
  assert.equal(song.sections[0].bars, 8);
  assert.equal(
    song.sections.reduce((sum, sec) => sum + sec.bars, 0),
    36
  );

  const chordSet = new Set(
    song.sections.flatMap((sec) => (sec.chordSchedule ?? []).map((ev) => ev.symbol))
  );
  for (const required of ['Em', 'Em/B', 'Am', 'Am/E', 'Dm', 'D7', 'G', 'B7', 'G7', 'C', 'Bm', 'D']) {
    assert.ok(chordSet.has(required), `Expected sheet chord ${required} in draft-di-vang-nhat-nhoa`);
  }

  const allText = song.sections.map((s) => s.text).join('\n');
  assert.ok(allText.includes('Chờ người tình lỡ'));
  assert.ok(allText.includes('Vào mùa trăng đó'));
  assert.ok(allText.includes('Tình đầu gặp gỡ'));
  assert.ok(allText.includes('[Em]đuối em cho rằng'));
  assert.ok(allText.includes('thuyền [D]đã sang [Em]bờ'));

  // Every melody note stays within section beat bounds and PIANO_MIN_MIDI..PIANO_MAX_MIDI
  const sectionBounds = new Map(song.sections.map((s) => [s.id, s.bars * 4]));
  assert.ok(song.melodyNotes.length >= 150);
  for (const note of song.melodyNotes) {
    const limit = sectionBounds.get(note.sectionId);
    assert.ok(limit !== undefined, `Unknown sectionId ${note.sectionId}`);
    assert.ok(
      note.startBeat >= 0 && note.startBeat + note.durationBeats <= limit + 0.001,
      `Note ${note.id} (${note.startBeat} + ${note.durationBeats}) exceeds section bounds ${limit}`
    );
    assert.ok(
      note.midi >= PIANO_MIN_MIDI && note.midi <= PIANO_MAX_MIDI,
      `Note ${note.id} MIDI ${note.midi} out of piano bounds`
    );
  }
});

test('Flexible chords-only melody muting supports all, intro-only, off (all muted), and per-section overrides', () => {
  assert.equal(resolveMelodyPlaybackMode({ melodyMuted: false }), 'all');
  assert.equal(resolveMelodyPlaybackMode({ melodyMuted: true }), 'intro-only');
  assert.equal(resolveMelodyPlaybackMode({ melodyMuted: true, melodyPlaybackMode: 'off' }), 'off');

  const intro = { id: 'sec-i', kind: 'Intro' as const };
  const verse = { id: 'sec-v', kind: 'Verse' as const };
  const chorus = { id: 'sec-c', kind: 'Chorus' as const };

  // 'off': zero melody notes anywhere (chords-only everywhere, including Intro)
  assert.equal(isSectionMelodyMuted(intro, 'off', []), true);
  assert.equal(isSectionMelodyMuted(verse, 'off', []), true);
  assert.equal(isSectionMelodyMuted(chorus, 'off', []), true);

  // 'intro-only': instrumental Intro stays audible while vocal sections stay muted
  assert.equal(isSectionMelodyMuted(intro, 'intro-only', []), false);
  assert.equal(isSectionMelodyMuted(verse, 'intro-only', []), true);
  assert.equal(isSectionMelodyMuted(chorus, 'intro-only', []), true);

  // 'all' with custom mutedMelodySectionIds lets user mute any specific section freely
  assert.equal(isSectionMelodyMuted(intro, 'all', ['sec-v']), false);
  assert.equal(isSectionMelodyMuted(verse, 'all', ['sec-v']), true);
  assert.equal(isSectionMelodyMuted(chorus, 'all', ['sec-v']), false);
});

test('Core 10 arpeggios, 20 accompaniment rhythm styles, time signatures, and transposeDraftToKey work accurately', () => {
  const core44 = ARPEGGIO_PATTERN_META.filter((p) => p.group === 'Nhóm 4/4');
  const core3468 = ARPEGGIO_PATTERN_META.filter((p) => p.group === 'Nhóm 3/4 & 6/8');
  assert.equal(core44.length, 6);
  assert.equal(core3468.length, 4);

  assert.equal(RHYTHM_STYLE_META.length, 21);
  const ballad24 = RHYTHM_STYLE_META.find((s) => s.id === 'ballad-24');
  assert.ok(ballad24);
  assert.equal(ballad24.meter, '2/4');

  const bolero = RHYTHM_STYLE_META.find((s) => s.id === 'bolero-44');
  assert.ok(bolero);
  assert.equal(bolero.meter, '4/4');

  const slowRock = RHYTHM_STYLE_META.find((s) => s.id === 'slow-rock-68');
  assert.ok(slowRock);
  assert.equal(slowRock.meter, '6/8');
  assert.equal(resolveBeatsPerBar(slowRock.meter), 3);
  assert.equal(resolveBeatsPerBar('2/4'), 2);
  assert.equal(resolveBeatsPerBar('3/4'), 3);
  assert.equal(resolveBeatsPerBar('4/4'), 4);

  const starters = createStarterDrafts();
  const baseDraft = starters.find((d) => d.id === 'draft-thang-tu-la-loi-noi-doi-cua-em')!;
  const ballad24Draft = { ...baseDraft, drumPattern: 'ballad-24' as const };
  assert.equal(getDraftStyleLabel(ballad24Draft), 'Ballad 2/4');
  const boleroDraft = { ...baseDraft, drumPattern: 'bolero-44' as const };
  assert.equal(getDraftStyleLabel(boleroDraft), 'Bolero');

  assert.equal(normalizeKeyRoot('C#'), 'Db');
  assert.equal(normalizeKeyRoot('Gb'), 'F#');
  const { draft: inD, semitones } = transposeDraftToKey(baseDraft, 'D');
  assert.equal(semitones, 2);
  assert.equal(inD.keyRoot, 'D');
  assert.ok(inD.sections[0].text.includes('[G]'));
  assert.ok(inD.sections[0].text.includes('[Bm]'));
  assert.equal(inD.sections[0].chordSchedule?.[0].symbol, 'G');
  assert.equal(inD.melodyNotes[0].midi, baseDraft.melodyNotes[0].midi + 2);
});

test('resolvePairedInstrumentsForBacking and resolvePairedInstrumentsForMelody synchronize guitar and piano tones', () => {
  assert.deepEqual(resolvePairedInstrumentsForBacking('guitar-strum', 'piano'), {
    backingInstrument: 'guitar-strum',
    melodyInstrument: 'guitar',
  });
  assert.deepEqual(resolvePairedInstrumentsForBacking('piano-ballad', 'guitar'), {
    backingInstrument: 'piano-ballad',
    melodyInstrument: 'piano',
  });
  assert.deepEqual(resolvePairedInstrumentsForBacking('rhodes', 'synth'), {
    backingInstrument: 'rhodes',
    melodyInstrument: 'synth',
  });
  assert.deepEqual(resolvePairedInstrumentsForBacking('rhodes', 'guitar'), {
    backingInstrument: 'rhodes',
    melodyInstrument: 'piano',
  });

  assert.deepEqual(resolvePairedInstrumentsForMelody('guitar', 'piano-ballad'), {
    backingInstrument: 'guitar-strum',
    melodyInstrument: 'guitar',
  });
  assert.deepEqual(resolvePairedInstrumentsForMelody('piano', 'guitar-strum'), {
    backingInstrument: 'piano-ballad',
    melodyInstrument: 'piano',
  });
  assert.deepEqual(resolvePairedInstrumentsForMelody('synth', 'guitar-strum'), {
    backingInstrument: 'guitar-strum',
    melodyInstrument: 'synth',
  });
});

test('pickMonotonicVoiceSlot prevents StateTimeline collisions on overlapping hits and future restarts', () => {
  // Reuses idle voice whose lastEndTime has already elapsed
  assert.deepEqual(
    pickMonotonicVoiceSlot([{ lastEndTime: 1.5 }, { lastEndTime: 0.4 }], 1.0, 4),
    { index: 1, action: 'reuse' }
  );

  // Grows pool when all existing voices overlap (e.g. fast 16th-note kicks with 0.5s envelope release)
  assert.deepEqual(
    pickMonotonicVoiceSlot([{ lastEndTime: 1.5 }, { lastEndTime: 1.62 }], 1.25, 4),
    { index: 2, action: 'grow' }
  );

  // Replaces stale future-scheduled voice when pool reaches maxVoices (e.g. rapid track switch/audition restart)
  assert.deepEqual(
    pickMonotonicVoiceSlot(
      [{ lastEndTime: 18.0 }, { lastEndTime: 15.2 }, { lastEndTime: 16.5 }],
      10.1,
      3
    ),
    { index: 1, action: 'replace' }
  );
});

test('sanitizePartSchedule sorts events chronologically and clamps swing offsets within loop bounds', () => {
  const dirty: Array<[number, string]> = [
    [3.9999, 'late-swing'],
    [1.5, 'mid'],
    [-0.02, 'early'],
    [0.5, 'second'],
    [Number.NaN, 'invalid'],
  ];
  const loopCleaned = sanitizePartSchedule(dirty, 4.0, true);
  assert.deepEqual(loopCleaned, [
    [0, 'early'],
    [0.5, 'second'],
    [1.5, 'mid'],
    [3.998, 'late-swing'],
  ]);

  const nonLoopCleaned = sanitizePartSchedule(dirty, 4.0, false);
  assert.equal(nonLoopCleaned[3][0], 3.9999);
});

test('cloneSketchpadDraft, summarizeDraftChanges, and hasDraftUnsavedChanges track edits accurately and support revert', () => {
  const [starter] = createStarterDrafts();
  const baseline = cloneSketchpadDraft(starter);
  const working = cloneSketchpadDraft(starter);

  // Changing updatedAt alone or mutating working copy later must not leak into baseline
  working.updatedAt = baseline.updatedAt + 9999;
  assert.equal(hasDraftUnsavedChanges(working, baseline), false);
  assert.deepEqual(summarizeDraftChanges(working, baseline), []);

  // Mutate title, BPM, and lyric text -> must detect all categories without touching baseline
  working.title = 'Tiêu Đề Đã Sửa';
  working.bpm = baseline.bpm + 10;
  working.sections[0].text = '[Am]Một câu hát mới';
  working.melodyNotes.push({
    id: 'extra-note',
    sectionId: working.sections[0].id,
    midi: 64,
    startBeat: 0,
    durationBeats: 1,
    velocity: 0.85,
  });

  assert.equal(baseline.title, starter.title);
  assert.equal(baseline.bpm, starter.bpm);
  assert.equal(baseline.sections[0].text, starter.sections[0].text);
  assert.equal(baseline.melodyNotes.length, starter.melodyNotes.length);

  assert.equal(hasDraftUnsavedChanges(working, baseline), true);
  assert.deepEqual(summarizeDraftChanges(working, baseline), [
    'Tên bài hát',
    'Nhạc cụ, điệu & BPM',
    'Lời & hợp âm',
    'Nốt giai điệu',
  ]);

  // Reverting back to cloned baseline clears unsaved changes cleanly
  const reverted = cloneSketchpadDraft(baseline);
  assert.equal(hasDraftUnsavedChanges(reverted, baseline), false);
});

test('buildDraftVersionEntry and restoreDraftFromVersion archive immutable versions and support rollback', () => {
  const [starter] = createStarterDrafts();
  const v1 = buildDraftVersionEntry(starter, [], [], 'Bản lưu gốc');
  assert.equal(v1.versionNumber, 1);
  assert.equal(v1.note, 'Bản lưu gốc');
  assert.equal(v1.snapshot.title, starter.title);

  // Edit v2
  const editedV2 = cloneSketchpadDraft(starter);
  editedV2.title = `${starter.title} · Bản phối 2`;
  editedV2.bpm = starter.bpm + 12;
  const v2Changes = summarizeDraftChanges(editedV2, v1.snapshot);
  const v2 = buildDraftVersionEntry(editedV2, [v1], v2Changes);
  assert.equal(v2.versionNumber, 2);
  assert.equal(v2.note, 'Sửa: Tên bài hát · Nhạc cụ, điệu & BPM');
  assert.deepEqual(v2.changeTags, ['Tên bài hát', 'Nhạc cụ, điệu & BPM']);

  // Edit v3 with custom note
  const editedV3 = cloneSketchpadDraft(editedV2);
  editedV3.sections[0].text = '[Am]Lời mới hoàn toàn';
  const v3 = buildDraftVersionEntry(editedV3, [v2, v1], ['Lời & hợp âm'], 'Viết lại Verse 1');
  assert.equal(v3.versionNumber, 3);
  assert.equal(v3.note, 'Viết lại Verse 1');

  // Roll back to v1 and mutate restored copy — v1 snapshot must stay intact
  const rolledBack = restoreDraftFromVersion(v1);
  assert.equal(rolledBack.title, starter.title);
  assert.equal(rolledBack.bpm, starter.bpm);
  assert.equal(hasDraftUnsavedChanges(rolledBack, v3.snapshot), true);

  rolledBack.title = 'Thay đổi sau khi rollback';
  assert.equal(v1.snapshot.title, starter.title);
});



