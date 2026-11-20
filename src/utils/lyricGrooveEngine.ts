import { Chord, Note, Scale } from 'tonal';

export type MoodStyleId =
  | 'pop-ballad'
  | 'neo-soul'
  | 'lofi-chill'
  | 'rnb'
  | 'acoustic';

export type BackingInstrumentId = 'rhodes' | 'guitar-strum' | 'piano-ballad';
export type DrumPatternId = 'none' | 'lofi' | 'boombap';
export type MelodyInstrumentId = 'piano' | 'synth' | 'guitar';
export type SectionKind =
  | 'Intro'
  | 'Verse'
  | 'Pre-Chorus'
  | 'Chorus'
  | 'Bridge'
  | 'Outro';

export interface SongSection {
  id: string;
  kind: SectionKind;
  label: string;
  bars: 2 | 4 | 8;
  text: string;
}

export interface MelodyNote {
  id: string;
  sectionId: string;
  midi: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export interface SketchpadDraft {
  id: string;
  title: string;
  keyRoot: string;
  scaleMode: 'major' | 'minor';
  mood: MoodStyleId;
  bpm: number;
  backingInstrument: BackingInstrumentId;
  drumPattern: DrumPatternId;
  melodyInstrument: MelodyInstrumentId;
  scaleSnap: boolean;
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  updatedAt: number;
}

export interface AnchoredChord {
  symbol: string;
  charIndex: number;
  wordIndex: number;
  beatOffset: number;
  voicingShift: number;
}

export interface AnalyzedLyricWord {
  raw: string;
  clean: string;
  toneClass: 'bang' | 'trac';
  rhymeKey: string;
  rhymeGroupId: number | null;
  isDoubleRhyme: boolean;
}

export interface AnalyzedLyricLine {
  lineIndex: number;
  rawLine: string;
  lyricOnlyLine: string;
  syllableCount: number;
  chords: AnchoredChord[];
  words: AnalyzedLyricWord[];
}

export interface RhymeFamilySummary {
  groupId: number;
  rhymeKey: string;
  toneClass: 'bang' | 'trac';
  words: string[];
  count: number;
}

export interface ChordSuggestion {
  symbol: string;
  roleLabel: string;
  reason: string;
  notes: string[];
  colorLevel: 'Cơ bản' | 'Hợp âm màu' | 'II-V-I' | 'Hợp âm mượn';
}

export interface ScheduledChordEvent {
  sectionId: string;
  symbol: string;
  startBeat: number;
  durationBeats: number;
  notes: string[];
  bassNote: string;
}

export interface PitchFrame {
  timeSec: number;
  freqHz: number;
  clarity: number;
}

export const MOOD_STYLE_OPTIONS: Array<{
  id: MoodStyleId;
  label: string;
  desc: string;
  defaultBpm: number;
  defaultBacking: BackingInstrumentId;
  defaultDrums: DrumPatternId;
}> = [
  {
    id: 'lofi-chill',
    label: 'Lo-fi Chill',
    desc: 'Ấm áp, maj7 & m9 thư giãn',
    defaultBpm: 82,
    defaultBacking: 'rhodes',
    defaultDrums: 'lofi',
  },
  {
    id: 'pop-ballad',
    label: 'Pop Ballad',
    desc: 'Dễ nghe, add9 & sus4 truyền cảm',
    defaultBpm: 74,
    defaultBacking: 'piano-ballad',
    defaultDrums: 'none',
  },
  {
    id: 'neo-soul',
    label: 'Neo-Soul / Jazz',
    desc: 'Vòng II-V-I, m9, 13th giàu màu sắc',
    defaultBpm: 88,
    defaultBacking: 'rhodes',
    defaultDrums: 'boombap',
  },
  {
    id: 'rnb',
    label: 'R&B',
    desc: 'Groove mượt, hợp âm mượn & m7',
    defaultBpm: 92,
    defaultBacking: 'rhodes',
    defaultDrums: 'boombap',
  },
  {
    id: 'acoustic',
    label: 'Acoustic',
    desc: 'Guitar rải mộc mạc, gần gũi',
    defaultBpm: 96,
    defaultBacking: 'guitar-strum',
    defaultDrums: 'none',
  },
];

export const KEY_ROOT_OPTIONS = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export const SECTION_KIND_OPTIONS: SectionKind[] = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Outro',
];

const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

const PITCH_NAMES_SHARP = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export function stripChordTags(line: string): string {
  return line
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeChordInput(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

/**
 * Counts spoken syllables in a line (optimized for Vietnamese where each word token = 1 syllable,
 * while ignoring inline [Am7] chord markers and punctuation).
 */
export function countVietnameseSyllables(rawLine: string): number {
  const cleanLine = stripChordTags(rawLine);
  if (!cleanLine) return 0;
  const tokens = cleanLine
    .replace(/[.,!?;:"'()\-–—…/\\@#$%^&*~`+=<>[\]{}|]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token));
  return tokens.length;
}

const TRAC_CODEPOINTS = /[\u0301\u0309\u0303\u0323]/; // acute, hook above, tilde, dot below

/**
 * Classifies a Vietnamese syllable into Thanh Bằng (ngang / huyền) or Thanh Trắc (sắc / hỏi / ngã / nặng).
 */
export function classifyVietnameseTone(word: string): 'bang' | 'trac' {
  const nfd = word.normalize('NFD');
  return TRAC_CODEPOINTS.test(nfd) ? 'trac' : 'bang';
}

const VIET_VOWEL_BASE_MAP: Record<string, string> = {
  á: 'a', à: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ắ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'â', ấ: 'â', ầ: 'â', ẩ: 'â', ẫ: 'â', ậ: 'â',
  é: 'e', è: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'ê', ế: 'ê', ề: 'ê', ể: 'ê', ễ: 'ê', ệ: 'ê',
  í: 'i', ì: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ó: 'o', ò: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'ô', ố: 'ô', ồ: 'ô', ổ: 'ô', ỗ: 'ô', ộ: 'ô',
  ơ: 'ơ', ớ: 'ơ', ờ: 'ơ', ở: 'ơ', ỡ: 'ơ', ợ: 'ơ',
  ú: 'u', ù: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'ư', ứ: 'ư', ừ: 'ư', ử: 'ư', ữ: 'ư', ự: 'ư',
  ý: 'i', ỳ: 'i', ỷ: 'i', ỹ: 'i', ỵ: 'i', y: 'i',
};

function stripToneMarksKeepQuality(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => VIET_VOWEL_BASE_MAP[ch] ?? ch)
    .join('');
}

/**
 * Extracts the rhyme tail ("vần") from a Vietnamese (or Latin) word by removing initial onset consonants
 * and neutralizing tonal diacritics while preserving vowel quality (â/ê/ô/ơ/ư).
 */
export function extractVietnameseRhymeKey(rawWord: string): string {
  const cleaned = rawWord
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  if (!cleaned) return '';

  const normalized = stripToneMarksKeepQuality(cleaned);
  // Handle special Vietnamese onsets: qu, gi, ngh, ng, nh, ch, kh, ph, th, tr, gh
  let body = normalized;
  if (body.startsWith('qu') && body.length > 2) {
    body = 'u' + body.slice(2);
  } else if (body.startsWith('gi') && body.length > 2 && /[aâeêioôơuư]/.test(body[2])) {
    body = body.slice(2);
  } else {
    body = body.replace(/^(ngh|ng|nh|ch|kh|ph|th|tr|gh|[bcdfghklmnpqrstvwxzđ])+/u, '');
  }

  if (!body) {
    // Words like "gì" or single vowel
    const vowels = normalized.match(/[aâeêioôơuư]+$/);
    body = vowels ? vowels[0] : normalized;
  }

  // In Vietnamese rhyming (vần thông), medial glide 'o'/'u' before a/e/ê/i rhymes cleanly with the core vowel
  // e.g. "nhòa" / "xa" / "hoa" / "ta" -> "a", "quên" / "bên" -> "ên"
  if (/^[ou][aeêi]/.test(body) && body !== 'oi' && body !== 'ui') {
    body = body.slice(1);
  }

  return body;
}

export function parseChordsFromLine(rawLine: string, lineBeats = 4): {
  lyricOnlyLine: string;
  chords: AnchoredChord[];
} {
  const chords: AnchoredChord[] = [];
  let lyricOnly = '';
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawLine)) !== null) {
    lyricOnly += rawLine.slice(lastIndex, match.index);
    const symbol = normalizeChordInput(match[1]);
    if (symbol) {
      const wordsBefore = lyricOnly
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      chords.push({
        symbol,
        charIndex: lyricOnly.length,
        wordIndex: wordsBefore,
        beatOffset: 0,
        voicingShift: 0,
      });
    }
    lastIndex = match.index + match[0].length;
  }
  lyricOnly += rawLine.slice(lastIndex);

  const totalChars = Math.max(1, lyricOnly.trim().length);
  chords.forEach((chord, idx) => {
    if (lyricOnly.trim().length === 0) {
      chord.beatOffset = Number(((idx / Math.max(1, chords.length)) * lineBeats).toFixed(2));
    } else {
      const ratio = Math.min(0.95, chord.charIndex / totalChars);
      // Quantize cleanly to half-beat grid
      chord.beatOffset = Math.round(ratio * lineBeats * 2) / 2;
    }
  });

  return {
    lyricOnlyLine: lyricOnly.replace(/\s+/g, ' ').trim(),
    chords,
  };
}

export function analyzeSectionLyrics(section: SongSection): {
  lines: AnalyzedLyricLine[];
  rhymeFamilies: RhymeFamilySummary[];
  totalChords: number;
  totalSyllables: number;
} {
  const rawLines = section.text.split(/\r?\n/);
  const beatsPerLine = Math.max(2, (section.bars * 4) / Math.max(1, rawLines.filter((l) => l.trim().length > 0).length));

  const parsedLines = rawLines.map((rawLine, lineIndex) => {
    const { lyricOnlyLine, chords } = parseChordsFromLine(rawLine, beatsPerLine);
    const wordsRaw = lyricOnlyLine
      ? lyricOnlyLine.split(/\s+/).filter(Boolean)
      : [];
    const words: AnalyzedLyricWord[] = wordsRaw.map((raw) => {
      const clean = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      return {
        raw,
        clean,
        toneClass: classifyVietnameseTone(clean),
        rhymeKey: extractVietnameseRhymeKey(clean),
        rhymeGroupId: null,
        isDoubleRhyme: false,
      };
    });

    return {
      lineIndex,
      rawLine,
      lyricOnlyLine,
      syllableCount: countVietnameseSyllables(rawLine),
      chords,
      words,
    };
  });

  // Collect frequency of rhyme keys (prioritizing line-ending words + repeated cadence words)
  const rhymeBuckets = new Map<string, { words: Set<string>; count: number; toneClass: 'bang' | 'trac'; hasLineEnd: boolean }>();

  parsedLines.forEach((line) => {
    line.words.forEach((word, wIdx) => {
      if (!word.rhymeKey || word.rhymeKey.length < 1) return;
      const isLineEnd = wIdx === line.words.length - 1;
      const existing = rhymeBuckets.get(word.rhymeKey);
      if (existing) {
        existing.count += 1;
        existing.words.add(word.clean.toLowerCase());
        if (isLineEnd) existing.hasLineEnd = true;
      } else {
        rhymeBuckets.set(word.rhymeKey, {
          words: new Set([word.clean.toLowerCase()]),
          count: 1,
          toneClass: word.toneClass,
          hasLineEnd: isLineEnd,
        });
      }
    });
  });

  // Detect double rhymes (vần đôi) at the last 2 words of lines
  const doubleRhymeCounts = new Map<string, number>();
  parsedLines.forEach((line) => {
    if (line.words.length >= 2) {
      const a = line.words[line.words.length - 2].rhymeKey;
      const b = line.words[line.words.length - 1].rhymeKey;
      if (a && b) {
        const pairKey = `${a}+${b}`;
        doubleRhymeCounts.set(pairKey, (doubleRhymeCounts.get(pairKey) ?? 0) + 1);
      }
    }
  });

  // Rank qualifying rhyme families (appear >= 2 times, preferring line-endings)
  const rankedFamilies = Array.from(rhymeBuckets.entries())
    .filter(([, bucket]) => bucket.count >= 2 && (bucket.hasLineEnd || bucket.words.size >= 2))
    .sort((a, b) => {
      if (a[1].hasLineEnd !== b[1].hasLineEnd) return a[1].hasLineEnd ? -1 : 1;
      return b[1].count - a[1].count;
    })
    .slice(0, 6);

  const keyToGroupId = new Map<string, number>();
  const rhymeFamilies: RhymeFamilySummary[] = rankedFamilies.map(([rhymeKey, bucket], idx) => {
    const groupId = idx + 1;
    keyToGroupId.set(rhymeKey, groupId);
    return {
      groupId,
      rhymeKey,
      toneClass: bucket.toneClass,
      words: Array.from(bucket.words),
      count: bucket.count,
    };
  });

  parsedLines.forEach((line) => {
    line.words.forEach((word, idx) => {
      const gid = keyToGroupId.get(word.rhymeKey) ?? null;
      word.rhymeGroupId = gid;
      if (idx >= line.words.length - 2 && line.words.length >= 2) {
        const pairKey = `${line.words[line.words.length - 2].rhymeKey}+${line.words[line.words.length - 1].rhymeKey}`;
        if ((doubleRhymeCounts.get(pairKey) ?? 0) >= 2) {
          word.isDoubleRhyme = true;
        }
      }
    });
  });

  const totalChords = parsedLines.reduce((acc, l) => acc + l.chords.length, 0);
  const totalSyllables = parsedLines.reduce((acc, l) => acc + l.syllableCount, 0);

  return {
    lines: parsedLines,
    rhymeFamilies,
    totalChords,
    totalSyllables,
  };
}

/**
 * Resolves playable piano/synth MIDI note names (e.g. ['A3', 'C4', 'E4', 'G4']) for any chord symbol.
 * Supports voicing shifts (0 = root, 1 = 1st inv, 2 = 2nd inv, 3 = drop-2 wide).
 */
export function resolveChordVoicingNotes(symbol: string, voicingShift = 0): {
  valid: boolean;
  notes: string[];
  bassNote: string;
  normalizedSymbol: string;
} {
  const clean = normalizeChordInput(symbol);
  if (!clean) {
    return { valid: false, notes: [], bassNote: 'C3', normalizedSymbol: '' };
  }

  // Handle slash bass chords e.g. Fmaj7/G or C/E
  const [mainPart, slashBass] = clean.split('/');
  const parsed = Chord.get(mainPart);
  if (!parsed || parsed.empty || parsed.notes.length === 0) {
    return { valid: false, notes: [], bassNote: 'C3', normalizedSymbol: clean };
  }

  let pitchClasses = parsed.notes.map((n) => SHARP_TO_FLAT[n] ?? n);
  // Assign ascending octave 3/4 voicings cleanly
  const midiNotes: number[] = [];
  let currentOctave = 3;
  let lastMidi = 0;

  pitchClasses.forEach((pc, idx) => {
    let midi = Note.midi(`${pc}${currentOctave}`) ?? 60;
    if (idx > 0 && midi <= lastMidi) {
      currentOctave += 1;
      midi = Note.midi(`${pc}${currentOctave}`) ?? midi + 12;
    }
    if (midi < 52) {
      midi += 12;
    }
    midiNotes.push(midi);
    lastMidi = midi;
  });

  const shift = ((voicingShift % 4) + 4) % 4;
  if (shift === 1 && midiNotes.length > 1) {
    midiNotes[0] += 12;
  } else if (shift === 2 && midiNotes.length > 2) {
    midiNotes[0] += 12;
    midiNotes[1] += 12;
  } else if (shift === 3 && midiNotes.length >= 3) {
    // Open drop-2 voicing: raise second-highest or spread root/5th
    midiNotes[1] += 12;
  }

  midiNotes.sort((a, b) => a - b);
  const notes = midiNotes.map((m) => Note.fromMidi(m) || 'C4');
  const rootPc = slashBass ? slashBass : pitchClasses[0];
  const bassMidi = Note.midi(`${rootPc}2`) ?? Note.midi(`${rootPc}3`) ?? 48;
  const bassNote = Note.fromMidi(bassMidi < 36 ? bassMidi + 12 : bassMidi) || 'C3';

  return {
    valid: true,
    notes,
    bassNote,
    normalizedSymbol: clean,
  };
}

export function getScaleNotes(keyRoot: string, scaleMode: 'major' | 'minor'): string[] {
  const scaleName = `${keyRoot} ${scaleMode}`;
  const scale = Scale.get(scaleName);
  return scale.notes.length > 0 ? scale.notes : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
}

export function getDiatonicChordsForKey(
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  mood: MoodStyleId
): string[] {
  const notes = getScaleNotes(keyRoot, scaleMode);
  if (notes.length < 7) return ['Cmaj7', 'Am7', 'Fmaj7', 'G7'];

  const [n1, n2, n3, n4, n5, n6, n7] = notes;
  const isColorful = mood === 'neo-soul' || mood === 'lofi-chill' || mood === 'rnb';

  if (scaleMode === 'major') {
    if (isColorful) {
      return [
        `${n1}maj7`,
        `${n2}m9`,
        `${n3}m7`,
        `${n4}maj7`,
        `${n5}13`,
        `${n6}m7`,
        `${n7}m7b5`,
      ];
    }
    if (mood === 'pop-ballad') {
      return [
        `${n1}add9`,
        `${n2}m7`,
        `${n3}m7`,
        `${n4}maj7`,
        `${n5}sus4`,
        `${n6}m7`,
        `${n5}/${n7}`,
      ];
    }
    return [n1, `${n2}m`, `${n3}m`, n4, n5, `${n6}m`, `${n7}dim`];
  }

  // Minor key diatonic palette
  if (isColorful) {
    return [
      `${n1}m9`,
      `${n2}m7b5`,
      `${n3}maj7`,
      `${n4}m7`,
      `${n5}m7`,
      `${n6}maj7`,
      `${n7}7`,
    ];
  }
  return [`${n1}m7`, `${n2}m7b5`, `${n3}maj7`, `${n4}m7`, `${n5}m`, `${n6}maj7`, `${n7}`];
}

/**
 * Suggests 5 harmonically strong next chords based on key, mood style, and current chord.
 */
export function suggestNextChords(
  currentChordSymbol: string,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  mood: MoodStyleId
): ChordSuggestion[] {
  const notes = getScaleNotes(keyRoot, scaleMode);
  const [n1, n2, n3, n4, n5, n6, n7] = notes;
  const cleanCurrent = normalizeChordInput(currentChordSymbol).toLowerCase();

  const candidateSpecs: Array<{
    symbol: string;
    roleLabel: string;
    reason: string;
    colorLevel: ChordSuggestion['colorLevel'];
  }> = [];

  const isDominant =
    cleanCurrent.includes('7') &&
    !cleanCurrent.includes('maj7') &&
    !cleanCurrent.includes('m7');
  const isTwo = cleanCurrent.startsWith(n2.toLowerCase());
  const isFour = cleanCurrent.startsWith(n4.toLowerCase());
  const isSix = cleanCurrent.startsWith(n6.toLowerCase());

  if (scaleMode === 'major') {
    if (isTwo) {
      candidateSpecs.push(
        {
          symbol: mood === 'neo-soul' ? `${n5}13` : `${n5}7`,
          roleLabel: 'V (II-V-I)',
          reason: `Hoàn thiện vòng II-V-I dẫn về chủ âm ${n1}`,
          colorLevel: 'II-V-I',
        },
        {
          symbol: `${n5}sus4`,
          roleLabel: 'V treo',
          reason: 'Tạo độ mở êm ái trước khi giải quyết về I',
          colorLevel: 'Hợp âm màu',
        }
      );
    } else if (isDominant) {
      candidateSpecs.push(
        {
          symbol: mood === 'acoustic' ? `${n1}add9` : `${n1}maj7`,
          roleLabel: 'Giải quyết về I',
          reason: `Về chủ âm ${n1} êm mượt theo chuỗi V → I`,
          colorLevel: 'II-V-I',
        },
        {
          symbol: `${n6}m9`,
          roleLabel: 'Giải quyết giả (VI)',
          reason: 'Đánh lừa tai nghe sang bậc VI đầy sâu lắng',
          colorLevel: 'Hợp âm màu',
        }
      );
    } else if (isFour) {
      candidateSpecs.push(
        {
          symbol: `${n4}m6`,
          roleLabel: 'IV thứ mượn',
          reason: 'Hợp âm mượn bậc IV thứ — cực hợp câu kết cảm xúc',
          colorLevel: 'Hợp âm mượn',
        },
        {
          symbol: mood === 'neo-soul' ? `${n5}9sus4` : `${n5}/${n7}`,
          roleLabel: 'Dẫn sang V',
          reason: 'Nâng cao trào từ IV lên V',
          colorLevel: 'Hợp âm màu',
        }
      );
    } else if (isSix) {
      candidateSpecs.push(
        {
          symbol: `${n4}maj7`,
          roleLabel: 'IV ấm áp',
          reason: 'Chuyển tiếp quen thuộc VI → IV trong Pop & Lo-fi',
          colorLevel: 'Hợp âm màu',
        },
        {
          symbol: `${n2}m9`,
          roleLabel: 'II (Mở II-V-I)',
          reason: 'Khởi động chuỗi chuyển II-V-I giàu chất Jazz',
          colorLevel: 'II-V-I',
        }
      );
    }

    // Mood-flavored universal options to fill up to 5 distinct suggestions
    const pool: typeof candidateSpecs =
      mood === 'neo-soul'
        ? [
            { symbol: `${n2}m9`, roleLabel: 'Bậc II9', reason: 'Màu Neo-Soul mềm mại chuẩn bị V', colorLevel: 'II-V-I' },
            { symbol: `${n5}13`, roleLabel: 'Bậc V13', reason: 'Mở rộng nốt 13 đậm chất Jazz/R&B', colorLevel: 'II-V-I' },
            { symbol: `${n3}m7`, roleLabel: 'Bậc III7', reason: 'Nối giữa chủ âm I sang VI mượt mà', colorLevel: 'Hợp âm màu' },
            { symbol: `${n6}m9`, roleLabel: 'Bậc VI9', reason: 'Chiều sâu trầm lắng cho câu verse', colorLevel: 'Hợp âm màu' },
            { symbol: `${n4}maj7`, roleLabel: 'Bậc IVmaj7', reason: 'Tạo không gian bay bổng sáng sủa', colorLevel: 'Hợp âm màu' },
            { symbol: `${n4}m7`, roleLabel: 'IVm7 mượn', reason: 'Chuyển màu buồn ngọt ngào khi hết điệp khúc', colorLevel: 'Hợp âm mượn' },
          ]
        : mood === 'lofi-chill'
        ? [
            { symbol: `${n4}maj7`, roleLabel: 'IVmaj7 chill', reason: 'Hợp âm đặc trưng của Lo-fi chill ban đêm', colorLevel: 'Hợp âm màu' },
            { symbol: `${n3}m7`, roleLabel: 'IIIm7 êm', reason: 'Giữ mạch hòa âm trôi nhẹ không gắt', colorLevel: 'Hợp âm màu' },
            { symbol: `${n6}m7`, roleLabel: 'VIm7 sâu', reason: 'Cân bằng sáng tối tinh tế', colorLevel: 'Cơ bản' },
            { symbol: `${n2}m9`, roleLabel: 'IIm9', reason: 'Thêm nốt bậc 9 tạo độ mờ ảo Rhodes', colorLevel: 'II-V-I' },
            { symbol: `${n5}13`, roleLabel: 'V13 dẫn', reason: 'Quay vòng mượt lại ô nhịp đầu', colorLevel: 'II-V-I' },
            { symbol: `${n1}maj7`, roleLabel: 'Imaj7 chủ âm', reason: 'Trở về điểm tựa êm ái nhất của bài', colorLevel: 'Hợp âm màu' },
            { symbol: `${n4}m6`, roleLabel: 'IVm6 mượn', reason: 'Tạo dư âm hoài niệm kiểu Lo-fi Tokyo', colorLevel: 'Hợp âm mượn' },
          ]
        : mood === 'rnb'
        ? [
            { symbol: `${n4}maj7`, roleLabel: 'IVmaj7', reason: 'Bệ phóng groove R&B hiện đại', colorLevel: 'Hợp âm màu' },
            { symbol: `${n3}7`, roleLabel: 'III7 mượn', reason: 'Át phụ dẫn cực hút sang VIm7', colorLevel: 'Hợp âm mượn' },
            { symbol: `${n6}m9`, roleLabel: 'VIm9', reason: 'Tạo điểm nhấn vocal run / ngân giọng', colorLevel: 'Hợp âm màu' },
            { symbol: `${n2}m7`, roleLabel: 'IIm7', reason: 'Mở đầu Turnaround R&B kinh điển', colorLevel: 'II-V-I' },
            { symbol: `${n5}9sus4`, roleLabel: 'V9sus4', reason: 'Lơ lửng tinh tế trước khi vào Chorus', colorLevel: 'Hợp âm màu' },
            { symbol: `${n1}maj7`, roleLabel: 'Imaj7', reason: 'Điểm dừng mượt trên phách mạnh', colorLevel: 'Hợp âm màu' },
          ]
        : mood === 'acoustic'
        ? [
            { symbol: `${n5}`, roleLabel: 'Bậc V', reason: 'Mộc mạc, rõ nhịp rải guitar', colorLevel: 'Cơ bản' },
            { symbol: `${n6}m7`, roleLabel: 'Bậc VIm7', reason: 'Giữ dây buông vang tự nhiên trên đàn', colorLevel: 'Cơ bản' },
            { symbol: `${n4}add9`, roleLabel: 'IVadd9', reason: 'Sáng dây treble khi rải arpeggio', colorLevel: 'Hợp âm màu' },
            { symbol: `${n1}add9`, roleLabel: 'Iadd9', reason: 'Chủ âm mở rộng thoáng đãng', colorLevel: 'Hợp âm màu' },
            { symbol: `${n2}m7`, roleLabel: 'IIm7', reason: 'Chuyển đoạn nhẹ trước Pre-Chorus', colorLevel: 'Cơ bản' },
            { symbol: `${n3}m7`, roleLabel: 'IIIm7', reason: 'Bậc III chuyển nhẹ sang IV hoặc VI', colorLevel: 'Cơ bản' },
          ]
        : [
            { symbol: `${n5}`, roleLabel: 'Bậc V', reason: 'Mở rộng cao trào Pop Ballad', colorLevel: 'Cơ bản' },
            { symbol: `${n6}m`, roleLabel: 'Bậc VI', reason: 'Chuyển cảm xúc sang hồi ức sâu lắng', colorLevel: 'Cơ bản' },
            { symbol: `${n4}maj7`, roleLabel: 'IVmaj7', reason: 'Nâng tông dịu dàng trước điệp khúc', colorLevel: 'Hợp âm màu' },
            { symbol: `${n2}m7`, roleLabel: 'IIm7', reason: 'Bước đệm cổ điển trước V', colorLevel: 'II-V-I' },
            { symbol: `${n4}m`, roleLabel: 'IV thứ mượn', reason: 'Điểm nhấn day dứt cuối đoạn', colorLevel: 'Hợp âm mượn' },
            { symbol: `${n1}add9`, roleLabel: 'Iadd9 chủ âm', reason: 'Khép câu hát sáng và dễ nhớ', colorLevel: 'Hợp âm màu' },
          ];

    candidateSpecs.push(...pool);
  } else {
    // Minor scale suggestions
    candidateSpecs.push(
      { symbol: `${n6}maj7`, roleLabel: 'bVImaj7', reason: 'Mở rộng không gian rộng lớn từ hợp âm thứ', colorLevel: 'Hợp âm màu' },
      { symbol: `${n3}maj7`, roleLabel: 'bIIImaj7', reason: 'Điểm sáng song song (Relative Major)', colorLevel: 'Hợp âm màu' },
      { symbol: mood === 'neo-soul' ? `${n4}m9` : `${n4}m7`, roleLabel: 'IVm', reason: 'Màu trầm buồn chuẩn Ballad / Lo-fi thứ', colorLevel: 'Hợp âm màu' },
      { symbol: `${n7}7`, roleLabel: 'bVII7', reason: 'Backdoor dominant dẫn quay lại Im7', colorLevel: 'Hợp âm mượn' },
      { symbol: `${n5}7`, roleLabel: 'V7 hòa âm', reason: 'Át trưởng mượn tạo lực hút cực mạnh về chủ âm', colorLevel: 'Hợp âm mượn' },
      { symbol: `${n2}m7b5`, roleLabel: 'IIm7b5', reason: 'Nửa giảm mở đầu vòng II-V-I thứ', colorLevel: 'II-V-I' }
    );
  }

  const seen = new Set<string>([cleanCurrent]);
  const finalSuggestions: ChordSuggestion[] = [];

  for (const spec of candidateSpecs) {
    const norm = spec.symbol.toLowerCase();
    if (seen.has(norm)) continue;
    const voicing = resolveChordVoicingNotes(spec.symbol);
    if (!voicing.valid) continue;
    seen.add(norm);
    finalSuggestions.push({
      ...spec,
      notes: voicing.notes,
    });
    if (finalSuggestions.length === 5) break;
  }

  return finalSuggestions;
}

/**
 * Extracts a linear beat-aligned chord schedule across sections for instant loop playback.
 */
export function buildChordTimeline(sections: SongSection[]): {
  events: ScheduledChordEvent[];
  totalBeats: number;
} {
  const events: ScheduledChordEvent[] = [];
  let cursorBeat = 0;

  sections.forEach((section) => {
    const sectionBeats = section.bars * 4;
    const rawLines = section.text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const sectionChords: Array<{ symbol: string; rawBeat: number }> = [];

    if (rawLines.length > 0) {
      const beatsPerLine = sectionBeats / rawLines.length;
      rawLines.forEach((line, lineIdx) => {
        const parsed = parseChordsFromLine(line, beatsPerLine);
        parsed.chords.forEach((ch) => {
          sectionChords.push({
            symbol: ch.symbol,
            rawBeat: lineIdx * beatsPerLine + ch.beatOffset,
          });
        });
      });
    }

    if (sectionChords.length === 0) {
      cursorBeat += sectionBeats;
      return;
    }

    // Ensure sorted strictly & compute durations cleanly
    sectionChords.sort((a, b) => a.rawBeat - b.rawBeat);
    // Snap starting chord cleanly to bar/half-bar feel if close to 0
    if (sectionChords[0].rawBeat < 1) {
      sectionChords[0].rawBeat = 0;
    }

    for (let i = 0; i < sectionChords.length; i++) {
      const startLocal = Math.max(0, Math.min(sectionBeats - 0.5, sectionChords[i].rawBeat));
      const nextLocal =
        i + 1 < sectionChords.length
          ? Math.max(startLocal + 0.5, sectionChords[i + 1].rawBeat)
          : sectionBeats;
      const durationBeats = Math.max(0.5, nextLocal - startLocal);
      const voicing = resolveChordVoicingNotes(sectionChords[i].symbol);
      if (voicing.valid) {
        events.push({
          sectionId: section.id,
          symbol: sectionChords[i].symbol,
          startBeat: cursorBeat + startLocal,
          durationBeats,
          notes: voicing.notes,
          bassNote: voicing.bassNote,
        });
      }
    }

    cursorBeat += sectionBeats;
  });

  return { events, totalBeats: Math.max(4, cursorBeat) };
}

export function freqToExactMidi(freqHz: number): number {
  if (!Number.isFinite(freqHz) || freqHz <= 0) return 60;
  return 69 + 12 * Math.log2(freqHz / 440);
}

export function midiToNoteName(midi: number): string {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const pc = PITCH_NAMES_SHARP[((rounded % 12) + 12) % 12];
  return `${pc}${octave}`;
}

/**
 * Snaps a raw MIDI number to the nearest pitch belonging to the active Song Scale.
 */
export function snapMidiToScale(
  rawMidi: number,
  keyRoot: string,
  scaleMode: 'major' | 'minor'
): number {
  const rounded = Math.round(rawMidi);
  const scaleNotes = getScaleNotes(keyRoot, scaleMode);
  const allowedSemitones = new Set(
    scaleNotes
      .map((n) => Note.chroma(n))
      .filter((c): c is number => typeof c === 'number')
  );
  if (allowedSemitones.size === 0) return rounded;

  let bestMidi = rounded;
  let bestDiff = Infinity;
  for (let delta = -2; delta <= 2; delta++) {
    const candidate = rounded + delta;
    const chroma = ((candidate % 12) + 12) % 12;
    if (allowedSemitones.has(chroma)) {
      const diff = Math.abs(rawMidi - candidate);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMidi = candidate;
      }
    }
  }
  return Math.max(48, Math.min(84, bestMidi));
}

export function snapFrequencyToScaleMidi(
  freqHz: number,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  scaleSnap: boolean
): number {
  const rawMidi = freqToExactMidi(freqHz);
  const clamped = Math.max(48, Math.min(84, rawMidi));
  return scaleSnap ? snapMidiToScale(clamped, keyRoot, scaleMode) : Math.round(clamped);
}

/**
 * Quantizes continuous pitch frames captured from Pitchy autocorrelation into discrete
 * rhythmic Piano Roll MIDI notes snapped to 1/4 beat (16th-note) steps and active scale.
 */
export function quantizePitchFramesToNotes(
  frames: PitchFrame[],
  bpm: number,
  sectionId: string,
  totalSectionBeats: number,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  scaleSnap: boolean
): MelodyNote[] {
  if (frames.length === 0) return [];
  const beatsPerSec = bpm / 60;
  const gridStep = 0.25; // 16th note quantization

  interface BucketNote {
    midi: number;
    startBeat: number;
    endBeat: number;
  }

  const rawBuckets: BucketNote[] = [];

  for (const frame of frames) {
    if (frame.clarity < 0.72 || frame.freqHz < 75 || frame.freqHz > 1100) continue;
    const snappedMidi = snapFrequencyToScaleMidi(
      frame.freqHz,
      keyRoot,
      scaleMode,
      scaleSnap
    );
    const beatPos = (frame.timeSec * beatsPerSec) % totalSectionBeats;
    const qBeat = Math.floor(beatPos / gridStep) * gridStep;

    const last = rawBuckets[rawBuckets.length - 1];
    if (
      last &&
      last.midi === snappedMidi &&
      qBeat >= last.startBeat &&
      qBeat - last.endBeat <= 0.5
    ) {
      last.endBeat = Math.max(last.endBeat, qBeat + gridStep);
    } else {
      rawBuckets.push({
        midi: snappedMidi,
        startBeat: qBeat,
        endBeat: qBeat + gridStep,
      });
    }
  }

  // Filter ultra-tiny transient blips < 0.25 beat and cap overlaps
  const result: MelodyNote[] = [];
  rawBuckets.forEach((b, idx) => {
    const dur = Math.max(0.25, Math.min(4, Number((b.endBeat - b.startBeat).toFixed(2))));
    if (dur >= 0.25) {
      result.push({
        id: `hum-${sectionId}-${idx}-${Math.round(b.startBeat * 100)}`,
        sectionId,
        midi: b.midi,
        startBeat: Number(b.startBeat.toFixed(2)),
        durationBeats: dur,
        velocity: 0.85,
      });
    }
  });

  return result;
}

export function reorderSongSections(
  sections: SongSection[],
  fromIndex: number,
  toIndex: number
): SongSection[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sections.length ||
    toIndex >= sections.length ||
    fromIndex === toIndex
  ) {
    return sections;
  }
  const copy = [...sections];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function writeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

/**
 * Generates a valid Standard MIDI File (SMF Format 0) byte array containing
 * tempo, chords, and vocal melody notes so users can drop it straight into any DAW.
 */
export function buildMidiFileBytes(draft: SketchpadDraft): Uint8Array {
  const ticksPerBeat = 480;
  const mpqn = Math.round(60_000_000 / Math.max(40, Math.min(240, draft.bpm)));

  interface MidiEvent {
    tick: number;
    data: number[];
  }

  const events: MidiEvent[] = [
    {
      tick: 0,
      data: [0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff],
    },
  ];

  // Channel 0: Backing Chords
  const { events: chordEvents } = buildChordTimeline(draft.sections);
  chordEvents.forEach((ch) => {
    const startTick = Math.round(ch.startBeat * ticksPerBeat);
    const endTick = Math.round((ch.startBeat + ch.durationBeats) * ticksPerBeat);
    const midis = ch.notes
      .map((n) => Note.midi(n))
      .filter((m): m is number => typeof m === 'number');
    midis.forEach((m) => {
      events.push({ tick: startTick, data: [0x90, m & 0x7f, 74] });
      events.push({ tick: endTick, data: [0x80, m & 0x7f, 0] });
    });
  });

  // Channel 1: Melody Notes mapped by section offset
  let sectionBeatOffset = 0;
  draft.sections.forEach((sec) => {
    const notes = draft.melodyNotes.filter((n) => n.sectionId === sec.id);
    notes.forEach((note) => {
      const startTick = Math.round((sectionBeatOffset + note.startBeat) * ticksPerBeat);
      const endTick = Math.round(
        (sectionBeatOffset + note.startBeat + note.durationBeats) * ticksPerBeat
      );
      events.push({
        tick: startTick,
        data: [0x91, note.midi & 0x7f, Math.round(note.velocity * 110)],
      });
      events.push({ tick: endTick, data: [0x81, note.midi & 0x7f, 0] });
    });
    sectionBeatOffset += sec.bars * 4;
  });

  events.sort((a, b) => a.tick - b.tick);

  const trackBytes: number[] = [];
  let prevTick = 0;
  for (const ev of events) {
    const delta = Math.max(0, ev.tick - prevTick);
    trackBytes.push(...writeVarLen(delta), ...ev.data);
    prevTick = ev.tick;
  }
  // End of track meta event
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  const trackLen = trackBytes.length;
  const header = [
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // len 6
    0x00, 0x00, // format 0
    0x00, 0x01, // 1 track
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    (trackLen >> 24) & 0xff,
    (trackLen >> 16) & 0xff,
    (trackLen >> 8) & 0xff,
    trackLen & 0xff,
  ];

  return new Uint8Array([...header, ...trackBytes]);
}

/**
 * Encodes stereo/mono Float32 PCM channel arrays into a 16-bit PCM WAV binary buffer.
 */
export function encodePcmToWav(
  channels: Float32Array[],
  sampleRate: number
): Uint8Array {
  const numChannels = Math.max(1, Math.min(2, channels.length));
  const length = channels[0]?.length ?? 0;
  const dataBytes = length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}

export function createStarterDrafts(): SketchpadDraft[] {
  const now = Date.now();
  return [
    {
      id: 'draft-mua-ban-cong',
      title: 'Mưa Ban Công (Lo-fi Demo)',
      keyRoot: 'C',
      scaleMode: 'major',
      mood: 'lofi-chill',
      bpm: 84,
      backingInstrument: 'rhodes',
      drumPattern: 'lofi',
      melodyInstrument: 'piano',
      scaleSnap: true,
      updatedAt: now,
      sections: [
        {
          id: 'sec-intro-1',
          kind: 'Intro',
          label: 'Intro — Rhodes Mưa Rơi',
          bars: 4,
          text: '[Am9]Nghe giọt mưa [Fmaj7]rơi ngoài hiên\n[Dm9]Khói cà phê [G13]tan vào đêm',
        },
        {
          id: 'sec-verse-1',
          kind: 'Verse',
          label: 'Verse 1 — Phố Khuya',
          bars: 4,
          text:
            '[Am7]Đèn vàng hắt qua [Em7]khung cửa quen\n' +
            '[Fmaj7]Nhịp tim bỗng ngân [Cmaj7]lên dịu êm\n' +
            '[Dm9]Viết vội mấy câu [G13]ca bên thềm\n' +
            '[Em7]Chờ ngày nắng hong [Am7]khô nỗi niềm',
        },
        {
          id: 'sec-chorus-1',
          kind: 'Chorus',
          label: 'Chorus — Giai Điệu Điệp Khúc',
          bars: 4,
          text:
            '[Fmaj7]Gửi làn gió mang [G13]theo tiếng ca\n' +
            '[Em7]Vượt thành phố đêm [Am9]đông rất xa\n' +
            '[Dm9]Dù mai nắng hay [G7]mưa nhạt nhòa\n' +
            '[Cmaj7]Vẫn còn khúc nhạc [C7]trong tim ta',
        },
      ],
      melodyNotes: [
        { id: 'm1', sectionId: 'sec-chorus-1', midi: 69, startBeat: 0, durationBeats: 1, velocity: 0.85 },
        { id: 'm2', sectionId: 'sec-chorus-1', midi: 71, startBeat: 1, durationBeats: 0.5, velocity: 0.8 },
        { id: 'm3', sectionId: 'sec-chorus-1', midi: 72, startBeat: 1.5, durationBeats: 1.5, velocity: 0.9 },
        { id: 'm4', sectionId: 'sec-chorus-1', midi: 74, startBeat: 3, durationBeats: 1, velocity: 0.85 },
        { id: 'm5', sectionId: 'sec-chorus-1', midi: 76, startBeat: 4, durationBeats: 1.5, velocity: 0.92 },
        { id: 'm6', sectionId: 'sec-chorus-1', midi: 74, startBeat: 5.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'm7', sectionId: 'sec-chorus-1', midi: 72, startBeat: 6, durationBeats: 2, velocity: 0.86 },
        { id: 'm8', sectionId: 'sec-chorus-1', midi: 69, startBeat: 8, durationBeats: 1, velocity: 0.85 },
        { id: 'm9', sectionId: 'sec-chorus-1', midi: 72, startBeat: 9, durationBeats: 1, velocity: 0.88 },
        { id: 'm10', sectionId: 'sec-chorus-1', midi: 74, startBeat: 10, durationBeats: 2, velocity: 0.9 },
        { id: 'm11', sectionId: 'sec-chorus-1', midi: 72, startBeat: 12, durationBeats: 3, velocity: 0.85 },
      ],
    },
    {
      id: 'draft-anh-den-do-thi',
      title: 'Ánh Đèn Đô Thị (Neo-Soul)',
      keyRoot: 'F',
      scaleMode: 'major',
      mood: 'neo-soul',
      bpm: 88,
      backingInstrument: 'rhodes',
      drumPattern: 'boombap',
      melodyInstrument: 'synth',
      scaleSnap: true,
      updatedAt: now - 60_000,
      sections: [
        {
          id: 'sec-ns-verse',
          kind: 'Verse',
          label: 'Verse — Nhịp Đèn Đỏ',
          bars: 4,
          text:
            '[Gm9]Bước xuống phố lúc [C13]tám giờ tối\n' +
            '[Fmaj7]Ánh kính vỡ phản [Dm9]chiếu lưng đồi\n' +
            '[Gm9]Nhấc chiếc mic thử [C7]hát vài câu\n' +
            '[Am7]Bỗng thấy hết mọi [Dm7]nỗi u sầu',
        },
        {
          id: 'sec-ns-chorus',
          kind: 'Chorus',
          label: 'Chorus — Groove Bay',
          bars: 4,
          text:
            '[Bbmaj7]Nhịp trống gõ thật [C13]chậm bên tai\n' +
            '[Am7]Từng hợp âm mở [Dm9]lối tương lai\n' +
            '[Gm9]Chẳng cần nghĩ chuyện [C9sus4]đúng hay sai\n' +
            '[Fmaj7]Chỉ cần viết trọn [F7]khúc hát này',
        },
      ],
      melodyNotes: [
        { id: 'ns1', sectionId: 'sec-ns-chorus', midi: 70, startBeat: 0, durationBeats: 1.5, velocity: 0.86 },
        { id: 'ns2', sectionId: 'sec-ns-chorus', midi: 72, startBeat: 1.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ns3', sectionId: 'sec-ns-chorus', midi: 74, startBeat: 2, durationBeats: 2, velocity: 0.9 },
        { id: 'ns4', sectionId: 'sec-ns-chorus', midi: 77, startBeat: 4, durationBeats: 1, velocity: 0.92 },
        { id: 'ns5', sectionId: 'sec-ns-chorus', midi: 76, startBeat: 5, durationBeats: 1, velocity: 0.86 },
        { id: 'ns6', sectionId: 'sec-ns-chorus', midi: 74, startBeat: 6, durationBeats: 2, velocity: 0.88 },
      ],
    },
  ];
}

export function createBlankDraft(index = 1): SketchpadDraft {
  return {
    id: `draft-custom-${Date.now()}-${index}`,
    title: `Ý Tưởng Nháp #${index}`,
    keyRoot: 'C',
    scaleMode: 'major',
    mood: 'pop-ballad',
    bpm: 78,
    backingInstrument: 'piano-ballad',
    drumPattern: 'none',
    melodyInstrument: 'piano',
    scaleSnap: true,
    updatedAt: Date.now(),
    sections: [
      {
        id: `sec-blank-${Date.now()}`,
        kind: 'Verse',
        label: 'Verse 1',
        bars: 4,
        text: '[Cmaj7]Gõ lời bài hát tại [Am7]đây\n[Fmaj7]Chèn hợp âm bằng ngoặc [G7]vuông',
      },
    ],
    melodyNotes: [],
  };
}
