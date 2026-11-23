import { Chord, Interval, Note, Scale } from 'tonal';

export type MoodStyleId =
  | 'pop-ballad'
  | 'neo-soul'
  | 'lofi-chill'
  | 'rnb'
  | 'acoustic';

export type BackingInstrumentId = 'rhodes' | 'guitar-strum' | 'piano-ballad';
export type ConcreteArpeggioPatternId =
  | 'ballad-wave'
  | 'lofi-broken'
  | 'rising-arp'
  | 'falling-arp'
  | 'pinch-plucked'
  | 'rich-block'
  | 'pop-comp';
export type ArpeggioPatternId = 'auto-song' | ConcreteArpeggioPatternId;
export type BackingPatternId = 'ballad-arpeggio' | ArpeggioPatternId;
export type DrumPatternId = 'none' | 'lofi' | 'boombap';
export type MelodyInstrumentId = 'piano' | 'synth' | 'guitar';
export type SectionKind =
  | 'Intro'
  | 'Verse'
  | 'Pre-Chorus'
  | 'Chorus'
  | 'Interlude'
  | 'Bridge'
  | 'Outro';

export interface SectionChordBeatItem {
  symbol: string;
  startBeat: number;
  durationBeats: number;
  arpPattern?: ConcreteArpeggioPatternId;
}

export interface SongSection {
  id: string;
  kind: SectionKind;
  label: string;
  bars: 2 | 4 | 8;
  text: string;
  chordSchedule?: SectionChordBeatItem[];
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
  backingPattern?: BackingPatternId;
  chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
  sustainPedal?: boolean;
  metronomeEnabled?: boolean;
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
  eventIndexInSection: number;
  symbol: string;
  startBeat: number;
  durationBeats: number;
  arpPattern: ConcreteArpeggioPatternId;
  notes: string[];
  bassNote: string;
  rightHandMidis?: number[];
  bassMidis?: number[];
}

export const ARPEGGIO_PATTERN_META: Array<{
  id: ConcreteArpeggioPatternId;
  shortLabel: string;
  label: string;
  desc: string;
}> = [
  {
    id: 'ballad-wave',
    shortLabel: 'Sóng 1-5-8',
    label: 'Rải Sóng Ballad (1-5-8-10)',
    desc: 'Tay trái rải Bass–5–8, tay phải buông giai điệu đệm mượt',
  },
  {
    id: 'lofi-broken',
    shortLabel: 'Rải Lofi',
    label: 'Rải Lofi Trì Hoãn (Đan xen)',
    desc: 'Bass trầm ấm kết hợp nốt đệm rải nhẹ có khoảng nghỉ lofi',
  },
  {
    id: 'rising-arp',
    shortLabel: 'Móc lên',
    label: 'Rải Móc Lên (Bass → Ngọn)',
    desc: 'Đánh nối tiếp từng nốt từ trầm lên cao kiểu đàn dây / piano mở đầu',
  },
  {
    id: 'falling-arp',
    shortLabel: 'Buông xuống',
    label: 'Rải Buông Xuống (Cao → Trầm)',
    desc: 'Ngân nốt cao sáng rồi rải rơi dần xuống giữ độ sâu lắng',
  },
  {
    id: 'pinch-plucked',
    shortLabel: 'Móc đôi',
    label: 'Móc Đôi Acoustic (Bass + Đôi)',
    desc: 'Móc đồng thời bass + nốt cao ở phách mạnh, xen kẽ nốt giữa nhịp',
  },
  {
    id: 'rich-block',
    shortLabel: 'Dày 2 tay',
    label: 'Chặn Hợp Âm Dày (2 Tay)',
    desc: 'Bấm trọn khối hợp âm mở rộng, giàu lực cho điệp khúc cao trào',
  },
  {
    id: 'pop-comp',
    shortLabel: 'Pop/R&B',
    label: 'Nhấn Nhịp Pop/R&B',
    desc: 'Đệm chập nhịp hiện đại, giữ groove chắc và có độ nảy',
  },
];

export function resolveConcreteArpPattern(
  pattern?: BackingPatternId | null
): ConcreteArpeggioPatternId | null {
  if (!pattern || pattern === 'auto-song') return null;
  if (pattern === 'ballad-arpeggio') return 'ballad-wave';
  return pattern;
}

export function resolveAutoArpeggioForChord(opts: {
  sectionKind: SectionKind;
  durationBeats: number;
  eventIndexInSection: number;
  totalEventsInSection: number;
  songMood?: MoodStyleId;
  explicitItemArp?: ConcreteArpeggioPatternId;
}): ConcreteArpeggioPatternId {
  if (opts.explicitItemArp) return opts.explicitItemArp;

  const { sectionKind, durationBeats, eventIndexInSection, totalEventsInSection, songMood } = opts;
  const isFinalCadence =
    totalEventsInSection > 1 && eventIndexInSection >= totalEventsInSection - 1;

  if (durationBeats <= 1.75) {
    return eventIndexInSection % 2 === 0 ? 'pinch-plucked' : 'falling-arp';
  }

  if (songMood === 'lofi-chill') {
    if (sectionKind === 'Intro') {
      const cycle: ConcreteArpeggioPatternId[] = [
        'rising-arp',
        'lofi-broken',
        'falling-arp',
        'ballad-wave',
      ];
      return cycle[eventIndexInSection % cycle.length];
    }
    if (sectionKind === 'Chorus') {
      if (isFinalCadence) return 'rich-block';
      const cycle: ConcreteArpeggioPatternId[] = [
        'ballad-wave',
        'lofi-broken',
        'rich-block',
        'pop-comp',
      ];
      return cycle[eventIndexInSection % cycle.length];
    }
    if (sectionKind === 'Interlude' || sectionKind === 'Outro') {
      const cycle: ConcreteArpeggioPatternId[] = ['falling-arp', 'lofi-broken', 'rising-arp'];
      return cycle[eventIndexInSection % cycle.length];
    }
    const cycle: ConcreteArpeggioPatternId[] = ['lofi-broken', 'pinch-plucked', 'ballad-wave'];
    return cycle[eventIndexInSection % cycle.length];
  }

  if (songMood === 'neo-soul' || songMood === 'rnb') {
    const cycle: ConcreteArpeggioPatternId[] = [
      'lofi-broken',
      'pop-comp',
      'rich-block',
      'falling-arp',
    ];
    return cycle[eventIndexInSection % cycle.length];
  }

  switch (sectionKind) {
    case 'Intro': {
      const cycle: ConcreteArpeggioPatternId[] = ['rising-arp', 'falling-arp', 'ballad-wave'];
      return cycle[eventIndexInSection % cycle.length];
    }
    case 'Verse': {
      const cycle: ConcreteArpeggioPatternId[] = [
        'ballad-wave',
        'pinch-plucked',
        'falling-arp',
        'rising-arp',
      ];
      return cycle[eventIndexInSection % cycle.length];
    }
    case 'Pre-Chorus': {
      if (isFinalCadence) return 'rich-block';
      const cycle: ConcreteArpeggioPatternId[] = ['rising-arp', 'ballad-wave', 'pop-comp'];
      return cycle[eventIndexInSection % cycle.length];
    }
    case 'Chorus': {
      if (isFinalCadence) return 'rich-block';
      const cycle: ConcreteArpeggioPatternId[] = [
        'rich-block',
        'ballad-wave',
        'rising-arp',
        'pinch-plucked',
      ];
      return cycle[eventIndexInSection % cycle.length];
    }
    case 'Bridge': {
      if (isFinalCadence) return 'rich-block';
      const cycle: ConcreteArpeggioPatternId[] = ['pinch-plucked', 'rising-arp', 'ballad-wave'];
      return cycle[eventIndexInSection % cycle.length];
    }
    case 'Interlude':
    case 'Outro': {
      const cycle: ConcreteArpeggioPatternId[] = ['falling-arp', 'rising-arp', 'ballad-wave'];
      return cycle[eventIndexInSection % cycle.length];
    }
    default:
      return 'ballad-wave';
  }
}

export interface PianistVoicing {
  valid: boolean;
  normalizedSymbol: string;
  bassMidis: number[];
  rightHandMidis: number[];
  bassNote: string;
  notes: string[];
}

export interface ProgressionPreset {
  id: string;
  label: string;
  desc: string;
  moodHint: MoodStyleId;
  buildChords: (keyRoot: string, scaleMode: 'major' | 'minor') => string[];
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
  'Interlude',
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

export interface KaraokeSegment {
  chordSymbol: string | null;
  lyricText: string;
  startBeat: number;
  endBeat: number;
}

export interface KaraokeLine {
  lineIndex: number;
  startBeat: number;
  endBeat: number;
  segments: KaraokeSegment[];
}

/**
 * Splits a section's chord-annotated lyrics into beat-accurate karaoke segments
 * aligned identically with buildChordTimeline() so UI can light up every [Chord] + lyric slice live.
 */
export function parseSectionKaraokeLines(section: SongSection): KaraokeLine[] {
  const rawLines = section.text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];
  const sectionBeats = section.bars * 4;
  const beatsPerLine = sectionBeats / rawLines.length;
  const schedule = section.chordSchedule;
  let globalChordIdx = 0;

  // Pre-scan all lines to extract chord matches and optional schedule alignment
  const lineSpecs = rawLines.map((line, lineIdx) => {
    const regex = /\[([^\]]+)\]/g;
    const matches: Array<{
      symbol: string;
      index: number;
      end: number;
      schedStart?: number;
      schedDur?: number;
    }> = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      const clean = normalizeChordInput(m[1]);
      if (clean) {
        const schedItem = schedule?.[globalChordIdx];
        globalChordIdx++;
        matches.push({
          symbol: clean,
          index: m.index,
          end: m.index + m[0].length,
          schedStart: schedItem?.startBeat,
          schedDur: schedItem?.durationBeats,
        });
      }
    }
    return { line, lineIdx, matches };
  });

  return lineSpecs.map((spec, idx) => {
    const { line, lineIdx, matches } = spec;
    const defaultStart = lineIdx * beatsPerLine;
    const defaultEnd = defaultStart + beatsPerLine;

    const estimatePickupStart = (
      schedBeat: number,
      rawLine: string,
      firstIdx: number,
      fallbackFloor: number
    ) => {
      const prefixWords = rawLine
        .slice(0, firstIdx)
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (prefixWords === 0) return schedBeat;
      const estimatedLead = Math.max(0.5, prefixWords * 0.65);
      return Math.max(0, fallbackFloor, Math.min(schedBeat, schedBeat - estimatedLead));
    };

    // If section.chordSchedule matches chords, derive line boundaries smoothly from schedule
    const firstSched = matches.find((c) => typeof c.schedStart === 'number')?.schedStart;
    const nextSpec = lineSpecs[idx + 1];
    const nextFirstSched = nextSpec?.matches.find(
      (c) => typeof c.schedStart === 'number'
    )?.schedStart;

    const lineStart =
      typeof firstSched === 'number'
        ? estimatePickupStart(firstSched, line, matches[0].index, defaultStart)
        : defaultStart;
    const lineEnd =
      typeof nextFirstSched === 'number'
        ? Math.max(
            lineStart + 0.5,
            estimatePickupStart(
              nextFirstSched,
              nextSpec.line,
              nextSpec.matches[0].index,
              (idx + 1) * beatsPerLine
            )
          )
        : idx === lineSpecs.length - 1
        ? sectionBeats
        : defaultEnd;

    if (matches.length === 0) {
      return {
        lineIndex: lineIdx,
        startBeat: lineStart,
        endBeat: lineEnd,
        segments: [
          {
            chordSymbol: null,
            lyricText: line.trim(),
            startBeat: lineStart,
            endBeat: lineEnd,
          },
        ],
      };
    }

    const totalLen = Math.max(1, line.length);
    const lineSpan = Math.max(0.5, lineEnd - lineStart);
    const segments: KaraokeSegment[] = [];

    if (matches[0].index > 0) {
      const prefix = line.slice(0, matches[0].index);
      const firstChordBeat =
        typeof matches[0].schedStart === 'number'
          ? matches[0].schedStart
          : lineStart + (matches[0].index / totalLen) * lineSpan;
      if (prefix.trim().length > 0) {
        const prefixStart = Math.max(0, Math.min(lineStart, firstChordBeat));
        segments.push({
          chordSymbol: null,
          lyricText: prefix,
          startBeat: prefixStart,
          endBeat: Math.max(prefixStart + 0.1, firstChordBeat),
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const next = i + 1 < matches.length ? matches[i + 1] : null;
      const nextStartIdx = next ? next.index : totalLen;
      const segText = line.slice(cur.end, nextStartIdx);
      const segStart =
        typeof cur.schedStart === 'number'
          ? cur.schedStart
          : i === 0 && cur.index < 3
          ? lineStart
          : lineStart + (cur.index / totalLen) * lineSpan;
      const segEnd = next
        ? typeof next.schedStart === 'number'
          ? next.schedStart
          : lineStart + (next.index / totalLen) * lineSpan
        : lineEnd;

      segments.push({
        chordSymbol: cur.symbol,
        lyricText: segText,
        startBeat: segStart,
        endBeat: Math.max(segStart + 0.1, segEnd),
      });
    }

    const computedStart = segments[0]?.startBeat ?? lineStart;
    const computedEnd = segments[segments.length - 1]?.endBeat ?? lineEnd;

    return {
      lineIndex: lineIdx,
      startBeat: computedStart,
      endBeat: computedEnd,
      segments,
    };
  });
}

/**
 * Resolves two-hand Concert Grand Piano voicings with optional smooth voice leading
 * against the previous chord's right-hand MIDI positions.
 */
export function resolvePianistVoicing(
  symbol: string,
  voicingShift = 0,
  previousRightHandMidis?: number[]
): PianistVoicing {
  const clean = normalizeChordInput(symbol);
  if (!clean) {
    return {
      valid: false,
      normalizedSymbol: '',
      bassMidis: [48],
      rightHandMidis: [],
      bassNote: 'C3',
      notes: [],
    };
  }

  const [mainPart, slashBass] = clean.split('/');
  const parsed = Chord.get(mainPart);
  if (!parsed || parsed.empty || parsed.notes.length === 0) {
    return {
      valid: false,
      normalizedSymbol: clean,
      bassMidis: [48],
      rightHandMidis: [],
      bassNote: 'C3',
      notes: [],
    };
  }

  const pitchClasses = parsed.notes.map((n) => SHARP_TO_FLAT[n] ?? n);
  const chromas = pitchClasses
    .map((pc) => Note.chroma(pc))
    .filter((c): c is number => typeof c === 'number');

  // Left hand bass: C2–B2 (MIDI 36..47) + gentle fifth strictly below C3-F#3 so it stays beneath RH harmony
  const rootPc = slashBass ? SHARP_TO_FLAT[slashBass] ?? slashBass : pitchClasses[0];
  let bassRootMidi = Note.midi(`${rootPc}2`) ?? Note.midi(`${rootPc}3`) ?? 48;
  while (bassRootMidi < 36) bassRootMidi += 12;
  while (bassRootMidi > 47) bassRootMidi -= 12;

  const bassMidis = [bassRootMidi, bassRootMidi + 7];

  // Right hand chord backing built 1 full octave below melody (C3..D4 / MIDI 48..62)
  const buildInversionMidis = (invIndex: number): number[] => {
    const base: number[] = [];
    const oct = 3;
    let last = 0;
    pitchClasses.forEach((pc, idx) => {
      let m = Note.midi(`${pc}${oct}`) ?? 48;
      if (idx === 0 && m > 56) m -= 12;
      if (idx > 0) {
        while (m <= last) m += 12;
      }
      while (m < 46) m += 12;
      base.push(m);
      last = m;
    });

    const shift = ((invIndex % 4) + 4) % 4;
    if (shift === 1 && base.length > 1) {
      base[0] += 12;
    } else if (shift === 2 && base.length > 2) {
      base[0] += 12;
      base[1] += 12;
    } else if (shift === 3 && base.length >= 3) {
      // Open Drop-2 spread voicing within backing octave
      base[1] += 12;
    }
    base.sort((a, b) => a - b);

    // Keep backing chord register cleanly ~1 octave below melody (MIDI 44..62, avg 49..57)
    let positioned = [...base];
    if (shift > 0 && Math.max(...positioned) > 62 && Math.min(...positioned) - 12 >= 41) {
      positioned = positioned.map((m) => m - 12);
    }
    let guard = 0;
    while (
      guard++ < 8 &&
      (positioned.reduce((s, v) => s + v, 0) / Math.max(1, positioned.length) > 57 ||
        Math.max(...positioned) > 62)
    ) {
      const highest = positioned[positioned.length - 1];
      if (highest - 12 >= 45 && !positioned.includes(highest - 12)) {
        positioned[positioned.length - 1] = highest - 12;
        positioned.sort((a, b) => a - b);
      } else if (Math.min(...positioned) - 12 >= 41) {
        positioned = positioned.map((m) => m - 12);
      } else {
        break;
      }
    }
    const avg = positioned.reduce((s, v) => s + v, 0) / Math.max(1, positioned.length);
    if (avg < 49) {
      positioned = positioned.map((m) => m + 12);
    }
    return positioned;
  };

  let rightHandMidis = buildInversionMidis(voicingShift);

  // Automatic smooth voice leading when previous chord is provided and shift == 0
  if (
    voicingShift === 0 &&
    previousRightHandMidis &&
    previousRightHandMidis.length > 0 &&
    chromas.length > 0
  ) {
    const prevAvg =
      previousRightHandMidis.reduce((s, v) => s + v, 0) /
      previousRightHandMidis.length;
    const prevSet = new Set(previousRightHandMidis);
    let bestCandidate = rightHandMidis;
    let bestScore = Infinity;

    for (let inv = 0; inv < 4; inv++) {
      const cand = buildInversionMidis(inv);
      const candAvg = cand.reduce((s, v) => s + v, 0) / Math.max(1, cand.length);
      const candMax = Math.max(...cand);
      const commonTones = cand.filter((m) => prevSet.has(m)).length;
      const rangePenalty = (candAvg < 49 || candAvg > 58 ? 8 : 0) + (candMax > 62 ? 6 : 0);
      const score = Math.abs(candAvg - prevAvg) - commonTones * 2.2 + rangePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }
    rightHandMidis = bestCandidate;
  }

  const notes = rightHandMidis.map((m) => Note.fromMidi(m) || 'C4');
  const bassNote = Note.fromMidi(bassRootMidi) || 'C3';

  return {
    valid: true,
    normalizedSymbol: clean,
    bassMidis,
    rightHandMidis,
    bassNote,
    notes,
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
  const res = resolvePianistVoicing(symbol, voicingShift);
  return {
    valid: res.valid,
    notes: res.notes,
    bassNote: res.bassNote,
    normalizedSymbol: res.normalizedSymbol,
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
 * Extracts a linear beat-aligned chord schedule across sections with smooth pianist voice leading.
 */
export function buildChordTimeline(
  sections: SongSection[],
  options?: {
    backingPattern?: BackingPatternId;
    chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
    songMood?: MoodStyleId;
    melodyNotes?: MelodyNote[];
  }
): {
  events: ScheduledChordEvent[];
  totalBeats: number;
} {
  const events: ScheduledChordEvent[] = [];
  let cursorBeat = 0;
  let prevRightHandMidis: number[] | undefined;
  const forcedPattern = resolveConcreteArpPattern(options?.backingPattern);

  sections.forEach((section) => {
    const sectionBeats = section.bars * 4;
    const sectionChords: Array<{
      symbol: string;
      rawBeat: number;
      explicitDuration?: number;
      explicitItemArp?: ConcreteArpeggioPatternId;
    }> = [];

    if (section.chordSchedule && section.chordSchedule.length > 0) {
      section.chordSchedule.forEach((item) => {
        const clean = normalizeChordInput(item.symbol);
        if (clean) {
          sectionChords.push({
            symbol: clean,
            rawBeat: item.startBeat,
            explicitDuration: item.durationBeats,
            explicitItemArp: item.arpPattern,
          });
        }
      });
    } else {
      const rawLines = section.text.split(/\r?\n/).filter((l) => l.trim().length > 0);
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
      sectionChords.sort((a, b) => a.rawBeat - b.rawBeat);
      if (sectionChords.length > 0 && sectionChords[0].rawBeat < 1) {
        sectionChords[0].rawBeat = 0;
      }
    }

    if (sectionChords.length === 0) {
      cursorBeat += sectionBeats;
      return;
    }

    sectionChords.sort((a, b) => a.rawBeat - b.rawBeat);

    for (let i = 0; i < sectionChords.length; i++) {
      const startLocal = Math.max(0, Math.min(sectionBeats - 0.5, sectionChords[i].rawBeat));
      const nextLocal =
        i + 1 < sectionChords.length
          ? Math.max(startLocal + 0.5, sectionChords[i + 1].rawBeat)
          : sectionBeats;
      const durationBeats =
        typeof sectionChords[i].explicitDuration === 'number'
          ? Math.max(0.5, Math.min(sectionBeats - startLocal, sectionChords[i].explicitDuration!))
          : Math.max(0.5, nextLocal - startLocal);

      const overrideKey = `${section.id}:${i}`;
      const arpPattern: ConcreteArpeggioPatternId =
        options?.chordArpStyles?.[overrideKey] ??
        forcedPattern ??
        resolveAutoArpeggioForChord({
          sectionKind: section.kind,
          durationBeats,
          eventIndexInSection: i,
          totalEventsInSection: sectionChords.length,
          songMood: options?.songMood,
          explicitItemArp: sectionChords[i].explicitItemArp,
        });

      const voicing = resolvePianistVoicing(
        sectionChords[i].symbol,
        0,
        prevRightHandMidis
      );
      if (voicing.valid) {
        let adjustedRightMidis = [...voicing.rightHandMidis];
        if (options?.melodyNotes && options.melodyNotes.length > 0) {
          const overlapping = options.melodyNotes.filter(
            (n) =>
              n.sectionId === section.id &&
              n.startBeat + n.durationBeats > startLocal &&
              n.startBeat < startLocal + durationBeats
          );
          if (overlapping.length > 0) {
            const minMel = Math.min(...overlapping.map((n) => n.midi));
            const ceiling = Math.max(52, minMel - 2);
            adjustedRightMidis = adjustedRightMidis
              .map((m) => (m > ceiling && m - 12 >= 44 ? m - 12 : m))
              .sort((a, b) => a - b)
              .filter((m, idx, arr) => idx === 0 || m !== arr[idx - 1]);
          }
        }
        const adjustedNotes = adjustedRightMidis.map(
          (m) => Note.fromMidi(m) || 'C3'
        );
        prevRightHandMidis = adjustedRightMidis;
        events.push({
          sectionId: section.id,
          eventIndexInSection: i,
          symbol: sectionChords[i].symbol,
          startBeat: cursorBeat + startLocal,
          durationBeats,
          arpPattern,
          notes: adjustedNotes,
          bassNote: voicing.bassNote,
          rightHandMidis: adjustedRightMidis,
          bassMidis: voicing.bassMidis,
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

export const PIANO_MIN_MIDI = 36; // C2
export const PIANO_MAX_MIDI = 84; // C6 (covers C2..B5..C6)

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
  return Math.max(PIANO_MIN_MIDI, Math.min(PIANO_MAX_MIDI, bestMidi));
}

export function snapFrequencyToScaleMidi(
  freqHz: number,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  scaleSnap: boolean
): number {
  const rawMidi = freqToExactMidi(freqHz);
  const clamped = Math.max(PIANO_MIN_MIDI, Math.min(PIANO_MAX_MIDI, rawMidi));
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

  // Channel 0: Backing Chords (strictly below melody register)
  const { events: chordEvents } = buildChordTimeline(draft.sections, {
    backingPattern: draft.backingPattern,
    chordArpStyles: draft.chordArpStyles,
    songMood: draft.mood,
    melodyNotes: draft.melodyNotes,
  });
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

const CLEAN_NOTE_NAMES_BY_CHROMA = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

function transposePitchClassClean(pc: string, semitones: number): string {
  const chroma = Note.chroma(pc);
  if (typeof chroma !== 'number') {
    return Note.transpose(pc, Interval.fromSemitones(semitones)) || pc;
  }
  const targetChroma = (((chroma + semitones) % 12) + 12) % 12;
  return CLEAN_NOTE_NAMES_BY_CHROMA[targetChroma];
}

export function transposeChordSymbol(symbol: string, semitones: number): string {
  const clean = normalizeChordInput(symbol);
  if (!clean || semitones === 0) return clean;
  const [mainPart, slashBass] = clean.split('/');
  const rootMatch = mainPart.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!rootMatch) return clean;

  const root = `${rootMatch[1].toUpperCase()}${rootMatch[2]}`;
  const quality = rootMatch[3];
  const nextRoot = transposePitchClassClean(root, semitones);

  if (slashBass) {
    const bassMatch = slashBass.match(/^([A-Ga-g])([#b]?)$/);
    if (bassMatch) {
      const nextBass = transposePitchClassClean(
        `${bassMatch[1].toUpperCase()}${bassMatch[2]}`,
        semitones
      );
      return `${nextRoot}${quality}/${nextBass}`;
    }
  }
  return `${nextRoot}${quality}`;
}

export function transposeDraftAll(
  draft: SketchpadDraft,
  semitones: number
): SketchpadDraft {
  if (semitones === 0) return draft;
  const currentChroma = Note.chroma(draft.keyRoot) ?? 0;
  const nextChroma = (((currentChroma + semitones) % 12) + 12) % 12;
  const nextKeyRoot =
    KEY_ROOT_OPTIONS.find((k) => Note.chroma(k) === nextChroma) ??
    CLEAN_NOTE_NAMES_BY_CHROMA[nextChroma];

  return {
    ...draft,
    keyRoot: nextKeyRoot,
    sections: draft.sections.map((sec) => ({
      ...sec,
      text: sec.text.replace(/\[([^\]]+)\]/g, (_m, inner) => {
        return `[${transposeChordSymbol(String(inner), semitones)}]`;
      }),
      chordSchedule: sec.chordSchedule?.map((item) => ({
        ...item,
        symbol: transposeChordSymbol(item.symbol, semitones),
      })),
    })),
    melodyNotes: draft.melodyNotes.map((n) => ({
      ...n,
      midi: Math.max(PIANO_MIN_MIDI, Math.min(PIANO_MAX_MIDI, n.midi + semitones)),
    })),
  };
}

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    id: 'vpop-ballad',
    label: 'Ballad Việt Quốc Dân',
    desc: 'VIm7 – IVmaj7 – Iadd9 – V/VII',
    moodHint: 'pop-ballad',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [`${n[0]}m7`, `${n[5]}maj7`, `${n[2]}maj7`, `${n[6]}7`];
      }
      return [`${n[5]}m7`, `${n[3]}maj7`, `${n[0]}add9`, `${n[4]}/${n[6]}`];
    },
  },
  {
    id: 'royal-road',
    label: 'City Pop / Lofi (Royal Road)',
    desc: 'IVmaj7 – V13 – IIIm7 – VIm9',
    moodHint: 'lofi-chill',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [`${n[3]}m9`, `${n[6]}13`, `${n[2]}maj7`, `${n[0]}m9`];
      }
      return [`${n[3]}maj7`, `${n[4]}13`, `${n[2]}m7`, `${n[5]}m9`];
    },
  },
  {
    id: 'neosoul-251',
    label: 'Neo-Soul II–V–I–VI',
    desc: 'IIm9 – V13 – Imaj7 – VI7',
    moodHint: 'neo-soul',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [`${n[1]}m7b5`, `${n[4]}7`, `${n[0]}m9`, `${n[5]}maj7`];
      }
      return [`${n[1]}m9`, `${n[4]}13`, `${n[0]}maj7`, `${n[5]}7`];
    },
  },
  {
    id: 'canon-modern',
    label: 'Canon Ballad 8 Nhịp',
    desc: 'I – V/VII – VIm7 – IIIm7 – IVmaj7 – I/III – IIm7 – Vsus4',
    moodHint: 'pop-ballad',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [
          `${n[0]}m7`,
          `${n[4]}/${n[6]}`,
          `${n[5]}maj7`,
          `${n[2]}maj7`,
          `${n[3]}m7`,
          `${n[0]}m7`,
          `${n[1]}m7b5`,
          `${n[4]}7`,
        ];
      }
      return [
        `${n[0]}add9`,
        `${n[4]}/${n[6]}`,
        `${n[5]}m7`,
        `${n[2]}m7`,
        `${n[3]}maj7`,
        `${n[0]}/${n[2]}`,
        `${n[1]}m7`,
        `${n[4]}sus4`,
      ];
    },
  },
  {
    id: 'rnb-borrowed',
    label: 'R&B Sâu Lắng (IVm6)',
    desc: 'IVmaj7 – IVm6 – IIIm7 – VIm9',
    moodHint: 'rnb',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [`${n[5]}maj7`, `${n[3]}m6`, `${n[2]}maj7`, `${n[4]}7`];
      }
      return [`${n[3]}maj7`, `${n[3]}m6`, `${n[2]}m7`, `${n[5]}m9`];
    },
  },
  {
    id: 'jazz-turnaround',
    label: 'Vòng Quán Cũ (I–VI–II–V)',
    desc: 'Imaj7 – VIm9 – IIm9 – V13',
    moodHint: 'lofi-chill',
    buildChords: (keyRoot, scaleMode) => {
      const n = getScaleNotes(keyRoot, scaleMode);
      if (scaleMode === 'minor') {
        return [`${n[0]}m9`, `${n[5]}maj7`, `${n[1]}m7b5`, `${n[4]}7`];
      }
      return [`${n[0]}maj7`, `${n[5]}m9`, `${n[1]}m9`, `${n[4]}13`];
    },
  },
];

export const COMPUTER_KEY_TO_MIDI: Record<string, number> = {
  z: 48, // C3
  s: 49,
  x: 50,
  d: 51,
  c: 52,
  v: 53,
  g: 54,
  b: 55,
  h: 56,
  n: 57,
  j: 58,
  m: 59, // B3
  q: 60, // C4
  '2': 61,
  w: 62,
  '3': 63,
  e: 64,
  r: 65,
  '5': 66,
  t: 67,
  '6': 68,
  y: 69,
  '7': 70,
  u: 71, // B4
  i: 72, // C5
  '9': 73,
  o: 74,
  '0': 75,
  p: 76, // E5
};

/**
 * Resolves a computer keystroke into a playable MIDI note within C2 (36) .. C6 (84),
 * shifting by octaveOffset (-1 = C2..E4, 0 = C3..E5, +1 = C4..C6).
 */
export function resolveComputerKeyToMidi(
  key: string,
  octaveOffset = 0
): number | null {
  const baseMidi = COMPUTER_KEY_TO_MIDI[key.toLowerCase()];
  if (typeof baseMidi !== 'number') return null;
  const clampedOffset = Math.max(-1, Math.min(1, Math.round(octaveOffset)));
  const shifted = baseMidi + clampedOffset * 12;
  if (shifted < PIANO_MIN_MIDI || shifted > PIANO_MAX_MIDI) return null;
  return shifted;
}

export function getShortcutLabelsForOctave(
  octaveOffset = 0
): Record<number, string> {
  const labels: Record<number, string> = {};
  Object.keys(COMPUTER_KEY_TO_MIDI).forEach((key) => {
    const midi = resolveComputerKeyToMidi(key, octaveOffset);
    if (midi !== null && !labels[midi]) {
      labels[midi] = key.toUpperCase();
    }
  });
  return labels;
}

export interface SectionBarSlot {
  barIndex: number;
  primaryChord: string;
  secondaryChord: string | null;
  hasExplicitChord: boolean;
  arpPattern: ConcreteArpeggioPatternId;
  eventIndex: number;
}

export function extractSectionBarSlots(
  section: SongSection,
  fallbackChord = 'Cmaj7',
  options?: {
    backingPattern?: BackingPatternId;
    chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
    songMood?: MoodStyleId;
  }
): SectionBarSlot[] {
  const { events } = buildChordTimeline([section], options);
  const slots: SectionBarSlot[] = [];
  let runningChord = events[0]?.symbol ?? fallbackChord;
  let runningArp: ConcreteArpeggioPatternId =
    events[0]?.arpPattern ?? resolveConcreteArpPattern(options?.backingPattern) ?? 'ballad-wave';

  for (let b = 0; b < section.bars; b++) {
    const barStart = b * 4;
    const barEnd = (b + 1) * 4;
    const inBar = events.filter(
      (ev) => ev.startBeat >= barStart - 0.01 && ev.startBeat < barEnd - 0.01
    );
    if (inBar.length > 0) {
      runningChord = inBar[0].symbol;
      runningArp = inBar[0].arpPattern;
      slots.push({
        barIndex: b,
        primaryChord: inBar[0].symbol,
        secondaryChord: inBar[1]?.symbol ?? null,
        hasExplicitChord: true,
        arpPattern: inBar[0].arpPattern,
        eventIndex: inBar[0].eventIndexInSection,
      });
    } else {
      slots.push({
        barIndex: b,
        primaryChord: runningChord,
        secondaryChord: null,
        hasExplicitChord: false,
        arpPattern: runningArp,
        eventIndex: -1,
      });
    }
  }
  return slots;
}

/**
 * Replaces or inserts the primary chord for a given bar index cleanly inside section.text
 * without disturbing surrounding Vietnamese lyrics.
 */
export function updateBarChordInSectionText(
  section: SongSection,
  barIndex: number,
  newChord: string
): string {
  const cleanChord = normalizeChordInput(newChord);
  if (!cleanChord) return section.text;

  const lines = section.text.split(/\r?\n/);
  const nonEmptyIndices = lines
    .map((l, idx) => (l.trim().length > 0 ? idx : -1))
    .filter((i) => i >= 0);

  if (nonEmptyIndices.length === 0) {
    const built: string[] = [];
    for (let b = 0; b < section.bars; b++) {
      built.push(b === barIndex ? `[${cleanChord}]Viết lời tại đây` : '[...]');
    }
    return built.join('\n');
  }

  const beatsPerLine = (section.bars * 4) / nonEmptyIndices.length;
  const barStartBeat = barIndex * 4;
  const barEndBeat = barStartBeat + 4;

  // Locate first chord tag whose timeline beat falls in [barStartBeat, barEndBeat)
  let targetLineIdx = -1;
  let targetMatchStart = -1;
  let targetMatchLen = 0;

  for (let posIdx = 0; posIdx < nonEmptyIndices.length; posIdx++) {
    const lineIdx = nonEmptyIndices[posIdx];
    const lineText = lines[lineIdx];
    const lineBaseBeat = posIdx * beatsPerLine;
    const parsed = parseChordsFromLine(lineText, beatsPerLine);

    const chordInBarIdx = parsed.chords.findIndex((c) => {
      const globalBeat = lineBaseBeat + c.beatOffset;
      return globalBeat >= barStartBeat - 0.01 && globalBeat < barEndBeat - 0.01;
    });

    if (chordInBarIdx >= 0) {
      let count = 0;
      const regex = /\[([^\]]+)\]/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(lineText)) !== null) {
        if (count === chordInBarIdx) {
          targetLineIdx = lineIdx;
          targetMatchStart = m.index;
          targetMatchLen = m[0].length;
          break;
        }
        count += 1;
      }
      if (targetLineIdx >= 0) break;
    }
  }

  if (targetLineIdx >= 0 && targetMatchStart >= 0) {
    const line = lines[targetLineIdx];
    lines[targetLineIdx] =
      line.slice(0, targetMatchStart) +
      `[${cleanChord}]` +
      line.slice(targetMatchStart + targetMatchLen);
    return lines.join('\n');
  }

  // Otherwise prepend [newChord] at the best matching line for that bar
  const approxPosIdx = Math.min(
    nonEmptyIndices.length - 1,
    Math.floor(barStartBeat / Math.max(0.5, beatsPerLine))
  );
  const insertLineIdx = nonEmptyIndices[approxPosIdx] ?? 0;
  lines[insertLineIdx] = `[${cleanChord}]${lines[insertLineIdx]}`;
  return lines.join('\n');
}

/**
 * Maps any piano MIDI note to the lush diatonic chord at that scale degree (for 1-Key Chord Mode).
 */
export function getDiatonicChordForPianoKey(
  midi: number,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  mood: MoodStyleId
): string {
  const scaleNotes = getScaleNotes(keyRoot, scaleMode);
  const diatonicChords = getDiatonicChordsForKey(keyRoot, scaleMode, mood);
  const chroma = ((midi % 12) + 12) % 12;

  let bestDegreeIdx = 0;
  let bestDist = Infinity;
  scaleNotes.forEach((pc, idx) => {
    const c = Note.chroma(pc);
    if (typeof c !== 'number') return;
    const rawDiff = Math.abs(chroma - c);
    const dist = Math.min(rawDiff, 12 - rawDiff);
    if (dist < bestDist) {
      bestDist = dist;
      bestDegreeIdx = idx;
    }
  });

  return diatonicChords[bestDegreeIdx] ?? diatonicChords[0] ?? 'Cmaj7';
}

const MELODY_RHYTHM_PATTERNS: Array<
  Array<{ offset: number; dur: number; chordTonePrefer: number }>
> = [
  [
    { offset: 0, dur: 1.5, chordTonePrefer: 2 },
    { offset: 1.5, dur: 0.5, chordTonePrefer: 1 },
    { offset: 2, dur: 1, chordTonePrefer: 3 },
    { offset: 3, dur: 1, chordTonePrefer: 0 },
  ],
  [
    { offset: 0, dur: 1, chordTonePrefer: 1 },
    { offset: 1, dur: 1, chordTonePrefer: 2 },
    { offset: 2, dur: 1.5, chordTonePrefer: 0 },
    { offset: 3.5, dur: 0.5, chordTonePrefer: 1 },
  ],
  [
    { offset: 0, dur: 2, chordTonePrefer: 2 },
    { offset: 2, dur: 1, chordTonePrefer: 1 },
    { offset: 3, dur: 1, chordTonePrefer: 0 },
  ],
  [
    { offset: 0, dur: 1, chordTonePrefer: 0 },
    { offset: 1, dur: 0.5, chordTonePrefer: 1 },
    { offset: 1.5, dur: 1.5, chordTonePrefer: 2 },
    { offset: 3, dur: 1, chordTonePrefer: 1 },
  ],
];

/**
 * Generates an expressive, singable Piano/Vocal melody aligned with the section's chords & key scale.
 */
export function generateHarmonicMelodyForSection(
  section: SongSection,
  keyRoot: string,
  scaleMode: 'major' | 'minor',
  variationSeed = 0
): MelodyNote[] {
  const { events } = buildChordTimeline([section]);
  const totalBeats = section.bars * 4;
  const fallbackVoicing = resolvePianistVoicing(
    scaleMode === 'minor' ? `${keyRoot}m7` : `${keyRoot}maj7`,
    0
  );

  const notes: MelodyNote[] = [];
  let prevMidi = 69;

  for (let b = 0; b < section.bars; b++) {
    const barStart = b * 4;
    const isLastBar = b === section.bars - 1;
    const pattern =
      MELODY_RHYTHM_PATTERNS[(b + Math.abs(variationSeed)) % MELODY_RHYTHM_PATTERNS.length];

    pattern.forEach((step, sIdx) => {
      const beat = barStart + step.offset;
      if (beat >= totalBeats) return;
      // Leave graceful vocal breath at end of final bar
      if (isLastBar && sIdx === pattern.length - 1 && step.offset >= 2.5) {
        return;
      }

      const activeChord =
        [...events]
          .reverse()
          .find((ev) => ev.startBeat <= beat + 0.05) ?? null;

      const poolMidis =
        activeChord?.rightHandMidis && activeChord.rightHandMidis.length > 0
          ? activeChord.rightHandMidis
          : fallbackVoicing.rightHandMidis;

      const rawPick =
        poolMidis[(step.chordTonePrefer + variationSeed) % poolMidis.length] ?? 67;
      let targetMidi = rawPick;
      while (targetMidi < 62) targetMidi += 12;
      while (targetMidi > 77) targetMidi -= 12;

      // Smooth contour: avoid wide jumps > 7 semitones
      if (Math.abs(targetMidi - prevMidi) > 7) {
        if (targetMidi > prevMidi && targetMidi - 12 >= 60) targetMidi -= 12;
        else if (targetMidi < prevMidi && targetMidi + 12 <= 79) targetMidi += 12;
      }

      // Snap passing weak-beat note cleanly inside active scale
      const finalMidi = snapMidiToScale(targetMidi, keyRoot, scaleMode);
      prevMidi = finalMidi;

      const dur = isLastBar && beat >= totalBeats - 2 ? Math.min(2, totalBeats - beat) : step.dur;
      notes.push({
        id: `auto-${section.id}-${b}-${sIdx}-${variationSeed}`,
        sectionId: section.id,
        midi: finalMidi,
        startBeat: beat,
        durationBeats: Math.max(0.5, dur),
        velocity: sIdx === 0 ? 0.88 : sIdx === 2 ? 0.84 : 0.76,
      });
    });
  }

  return notes;
}

export interface SongIdeaTemplate {
  id: string;
  label: string;
  subtitle: string;
  keyRoot: string;
  scaleMode: 'major' | 'minor';
  mood: MoodStyleId;
  bpm: number;
  backingInstrument: BackingInstrumentId;
  backingPattern: BackingPatternId;
  drumPattern: DrumPatternId;
  sectionText: string;
}

export const SONG_IDEA_TEMPLATES: SongIdeaTemplate[] = [
  {
    id: 'idea-ballad-mua',
    label: 'Ballad Đêm Mưa',
    subtitle: 'Grand Piano rải · C Trưởng · 72 BPM',
    keyRoot: 'C',
    scaleMode: 'major',
    mood: 'pop-ballad',
    bpm: 72,
    backingInstrument: 'piano-ballad',
    backingPattern: 'ballad-arpeggio',
    drumPattern: 'none',
    sectionText:
      '[Am9]Ngoài hiên mưa rơi [Fmaj7]nhẹ phím đàn\n' +
      '[Cadd9]Gửi theo câu hát [G/B]chút mơ màng\n' +
      '[Dm9]Bàn tay khẽ chạm [G13]nỗi nhớ sang\n' +
      '[Cmaj7]Dịu dàng khép lại [G7]ánh đèn vàng',
  },
  {
    id: 'idea-citypop-lofi',
    label: 'City Pop Phố Khuya',
    subtitle: 'Grand Piano dày · F Trưởng · 86 BPM',
    keyRoot: 'F',
    scaleMode: 'major',
    mood: 'lofi-chill',
    bpm: 86,
    backingInstrument: 'piano-ballad',
    backingPattern: 'pop-comp',
    drumPattern: 'lofi',
    sectionText:
      '[Bbmaj7]Chuyến xe đêm lướt [C13]qua ánh đèn\n' +
      '[Am7]Phố quen bỗng hóa [Dm9]giấc mơ êm\n' +
      '[Gm9]Còn lại dư âm [C9sus4]giữa nhịp tim\n' +
      '[Fmaj7]Vài dòng thư gửi [F7]gió đi tìm',
  },
  {
    id: 'idea-neosoul-smooth',
    label: 'Neo-Soul Hoàng Hôn',
    subtitle: 'Rhodes + Hợp âm màu · Eb Trưởng · 88 BPM',
    keyRoot: 'Eb',
    scaleMode: 'major',
    mood: 'neo-soul',
    bpm: 88,
    backingInstrument: 'rhodes',
    backingPattern: 'rich-block',
    drumPattern: 'boombap',
    sectionText:
      '[Fm9]Nắng nghiêng qua góc [Bb13]quán quen rồi\n' +
      '[Ebmaj7]Khẽ ngân giai điệu [Cm9]ấm bờ môi\n' +
      '[Fm9]Chậm lại một nhịp [Bb7]để thấy thôi\n' +
      '[Ebmaj7]Bình yên tan nhẹ [G7]giữa mây trôi',
  },
  {
    id: 'idea-acoustic-chieu',
    label: 'Acoustic Tự Sự',
    subtitle: 'Guitar Mộc & Piano · G Trưởng · 94 BPM',
    keyRoot: 'G',
    scaleMode: 'major',
    mood: 'acoustic',
    bpm: 94,
    backingInstrument: 'guitar-strum',
    backingPattern: 'ballad-arpeggio',
    drumPattern: 'none',
    sectionText:
      '[Gadd9]Chiều buông tiếng gió [D/F#]hát bên đồi\n' +
      '[Em7]Kể lại chuyện cũ [Bm7]tháng năm trôi\n' +
      '[Cmaj7]Bật dây đàn sáng [G/B]ấm lưng trời\n' +
      '[Am7]Hát câu mộc mạc [Dsus4]chẳng đổi dời',
  },
];

export function createStarterDrafts(): SketchpadDraft[] {
  const now = Date.now();
  return [
    {
      id: 'draft-dem-pho-mua-piano',
      title: 'Đêm Phố Mưa (Grand Piano Ballad)',
      keyRoot: 'C',
      scaleMode: 'major',
      mood: 'pop-ballad',
      bpm: 74,
      backingInstrument: 'piano-ballad',
      backingPattern: 'ballad-arpeggio',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'none',
      melodyInstrument: 'piano',
      scaleSnap: true,
      updatedAt: now,
      sections: [
        {
          id: 'sec-piano-intro',
          kind: 'Intro',
          label: 'Intro — Piano Rải Nhẹ',
          bars: 4,
          text: '[Am9]Tiếng dương cầm vang [Fmaj7]lên giữa khuya\n[Cadd9]Ánh đèn đường hắt [G/B]bóng mưa qua thềm',
        },
        {
          id: 'sec-piano-verse',
          kind: 'Verse',
          label: 'Verse 1 — Lời Tự Sự',
          bars: 4,
          text:
            '[Am7]Phố vắng tênh bước [Em7]chân khẽ trôi\n' +
            '[Fmaj7]Kỷ niệm xưa bỗng [Cadd9]quay về thôi\n' +
            '[Dm7]Giữ lại chút ấm [G/B]áp bờ môi\n' +
            '[Fmaj7]Nghe bản nhạc cũ [Gsus4]vẫn ngân [G]hoài',
        },
        {
          id: 'sec-piano-chorus',
          kind: 'Chorus',
          label: 'Chorus — Cao Trào Piano Grand',
          bars: 4,
          text:
            '[Fmaj7]Nếu một mai cơn [G13]gió ngừng bay\n' +
            '[Em7]Ta gặp nhau dưới [Am9]hiên chiều nay\n' +
            '[Dm9]Để hợp âm còn [Fm6]vang vòng tay\n' +
            '[Cmaj7]Viết tiếp khúc hát [G7]chưa từng phai',
        },
      ],
      melodyNotes: [
        // Intro
        { id: 'gpi1', sectionId: 'sec-piano-intro', midi: 72, startBeat: 0, durationBeats: 1.5, velocity: 0.72 },
        { id: 'gpi2', sectionId: 'sec-piano-intro', midi: 76, startBeat: 1.5, durationBeats: 0.5, velocity: 0.68 },
        { id: 'gpi3', sectionId: 'sec-piano-intro', midi: 74, startBeat: 2, durationBeats: 2, velocity: 0.76 },
        { id: 'gpi4', sectionId: 'sec-piano-intro', midi: 72, startBeat: 4, durationBeats: 1.5, velocity: 0.74 },
        { id: 'gpi5', sectionId: 'sec-piano-intro', midi: 69, startBeat: 5.5, durationBeats: 2.5, velocity: 0.7 },
        { id: 'gpi6', sectionId: 'sec-piano-intro', midi: 72, startBeat: 8, durationBeats: 1.5, velocity: 0.76 },
        { id: 'gpi7', sectionId: 'sec-piano-intro', midi: 74, startBeat: 9.5, durationBeats: 0.5, velocity: 0.72 },
        { id: 'gpi8', sectionId: 'sec-piano-intro', midi: 76, startBeat: 10, durationBeats: 2, velocity: 0.78 },
        { id: 'gpi9', sectionId: 'sec-piano-intro', midi: 74, startBeat: 12, durationBeats: 3, velocity: 0.72 },
        // Verse
        { id: 'gpv1', sectionId: 'sec-piano-verse', midi: 69, startBeat: 0, durationBeats: 1, velocity: 0.78 },
        { id: 'gpv2', sectionId: 'sec-piano-verse', midi: 72, startBeat: 1, durationBeats: 1, velocity: 0.8 },
        { id: 'gpv3', sectionId: 'sec-piano-verse', midi: 71, startBeat: 2, durationBeats: 2, velocity: 0.76 },
        { id: 'gpv4', sectionId: 'sec-piano-verse', midi: 69, startBeat: 4, durationBeats: 1.5, velocity: 0.78 },
        { id: 'gpv5', sectionId: 'sec-piano-verse', midi: 72, startBeat: 5.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'gpv6', sectionId: 'sec-piano-verse', midi: 74, startBeat: 6, durationBeats: 2, velocity: 0.82 },
        { id: 'gpv7', sectionId: 'sec-piano-verse', midi: 69, startBeat: 8, durationBeats: 1, velocity: 0.78 },
        { id: 'gpv8', sectionId: 'sec-piano-verse', midi: 71, startBeat: 9, durationBeats: 1, velocity: 0.8 },
        { id: 'gpv9', sectionId: 'sec-piano-verse', midi: 72, startBeat: 10, durationBeats: 2, velocity: 0.82 },
        { id: 'gpv10', sectionId: 'sec-piano-verse', midi: 74, startBeat: 12, durationBeats: 3.5, velocity: 0.84 },
        // Chorus
        { id: 'gp1', sectionId: 'sec-piano-chorus', midi: 69, startBeat: 0, durationBeats: 1, velocity: 0.84 },
        { id: 'gp2', sectionId: 'sec-piano-chorus', midi: 72, startBeat: 1, durationBeats: 1, velocity: 0.88 },
        { id: 'gp3', sectionId: 'sec-piano-chorus', midi: 74, startBeat: 2, durationBeats: 1.5, velocity: 0.92 },
        { id: 'gp4', sectionId: 'sec-piano-chorus', midi: 76, startBeat: 3.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'gp5', sectionId: 'sec-piano-chorus', midi: 79, startBeat: 4, durationBeats: 2, velocity: 0.94 },
        { id: 'gp6', sectionId: 'sec-piano-chorus', midi: 76, startBeat: 6, durationBeats: 1, velocity: 0.85 },
        { id: 'gp7', sectionId: 'sec-piano-chorus', midi: 74, startBeat: 7, durationBeats: 1, velocity: 0.82 },
        { id: 'gp8', sectionId: 'sec-piano-chorus', midi: 72, startBeat: 8, durationBeats: 1.5, velocity: 0.88 },
        { id: 'gp9', sectionId: 'sec-piano-chorus', midi: 74, startBeat: 9.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'gp10', sectionId: 'sec-piano-chorus', midi: 76, startBeat: 10, durationBeats: 2, velocity: 0.9 },
        { id: 'gp11', sectionId: 'sec-piano-chorus', midi: 72, startBeat: 12, durationBeats: 3.5, velocity: 0.86 },
      ],
    },
    {
      id: 'draft-khoang-cach-hai-ta-am',
      title: 'Khoảng Cách Hai Ta · Em Đau Lắm Đấy (Tone Am)',
      keyRoot: 'A',
      scaleMode: 'minor',
      mood: 'lofi-chill',
      bpm: 86,
      backingInstrument: 'piano-ballad',
      backingPattern: 'auto-song',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'lofi',
      melodyInstrument: 'piano',
      scaleSnap: true,
      updatedAt: now + 10_000,
      sections: [
        {
          id: 'sec-kcht-intro',
          kind: 'Intro',
          label: 'Intro — Canon Lofi (Am)',
          bars: 8,
          text:
            '[Fmaj7] [G] [Em7] [Am7] [Dm7] [G] [Cmaj7]\n' +
            '[Fmaj7] [G] [Em7] [Am7] [Dm7] [G] [Asus4] [A]',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'G', startBeat: 2, durationBeats: 2, arpPattern: 'lofi-broken' },
            { symbol: 'Em7', startBeat: 4, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'Am7', startBeat: 6, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8, durationBeats: 2, arpPattern: 'lofi-broken' },
            { symbol: 'G', startBeat: 10, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 12, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Fmaj7', startBeat: 16, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 18, durationBeats: 2, arpPattern: 'lofi-broken' },
            { symbol: 'Em7', startBeat: 20, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Am7', startBeat: 22, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 24, durationBeats: 2, arpPattern: 'lofi-broken' },
            { symbol: 'G', startBeat: 26, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'Asus4', startBeat: 28, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'A', startBeat: 30, durationBeats: 2, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-kcht-verse-1',
          kind: 'Verse',
          label: 'Verse 1 — Dường Như Khoảng Cách',
          bars: 8,
          text:
            'Dường [Am]như khoảng cách hai ta\n' +
            'Làm [Em7]em gục ngã anh à\n' +
            'Từ [Fmaj7]lâu anh muốn để [G]lại\n' +
            'Sau lưng [Am]tất cả',
          chordSchedule: [
            { symbol: 'Am', startBeat: 0.75, durationBeats: 7.25, arpPattern: 'lofi-broken' },
            { symbol: 'Em7', startBeat: 8.75, durationBeats: 7.25, arpPattern: 'pinch-plucked' },
            { symbol: 'Fmaj7', startBeat: 16.75, durationBeats: 3.25, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 20.0, durationBeats: 4.0, arpPattern: 'falling-arp' },
            { symbol: 'Am', startBeat: 25.5, durationBeats: 6.5, arpPattern: 'lofi-broken' },
          ],
        },
        {
          id: 'sec-kcht-verse-2',
          kind: 'Verse',
          label: 'Verse 2 — Lòng Anh Ao Ước',
          bars: 8,
          text:
            'Lòng [Am]anh ao ước một người\n' +
            'Sẽ [Em7]cho anh những tiếng cười\n' +
            'Nào ngờ [Fmaj7]đâu sau tiếng cười [G]ấy\n' +
            'Nỗi đau [Am]nhận lấy',
          chordSchedule: [
            { symbol: 'Am', startBeat: 0.75, durationBeats: 7.25, arpPattern: 'pinch-plucked' },
            { symbol: 'Em7', startBeat: 8.75, durationBeats: 7.25, arpPattern: 'lofi-broken' },
            { symbol: 'Fmaj7', startBeat: 17.3, durationBeats: 2.95, arpPattern: 'rising-arp' },
            { symbol: 'G', startBeat: 20.25, durationBeats: 3.75, arpPattern: 'falling-arp' },
            { symbol: 'Am', startBeat: 25.5, durationBeats: 6.5, arpPattern: 'ballad-wave' },
          ],
        },
        {
          id: 'sec-kcht-pre-1',
          kind: 'Pre-Chorus',
          label: 'Pre-Chorus 1 — Em Đau Lắm Đấy',
          bars: 8,
          text:
            'Ngày anh [Fmaj7]đi nắng vẫn soi lối\n' +
            'Cớ sao lòng [Em7]em có những bão giông\n' +
            'Nhìn anh [Dm7]bước đi bên người [G]ấy\n' +
            'Em đau [Cmaj7]lắm đấy',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 1.3, durationBeats: 6.7, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 9.8, durationBeats: 6.2, arpPattern: 'lofi-broken' },
            { symbol: 'Dm7', startBeat: 17.3, durationBeats: 3.1, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 20.4, durationBeats: 3.6, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 25.5, durationBeats: 6.5, arpPattern: 'falling-arp' },
          ],
        },
        {
          id: 'sec-kcht-pre-2',
          kind: 'Pre-Chorus',
          label: 'Pre-Chorus 2 — Chẳng Sao Đâu',
          bars: 8,
          text:
            'Đừng lo [Fmaj7]lắng một người như [G]em\n' +
            'Chẳng sao [Em7]đâu nỗi buồn qua [Am7]nhanh\n' +
            'Nào ngờ [Dm7]quên một người thầm [Em7]yêu\n' +
            'Lại khó [Am]thế này',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 1.3, durationBeats: 3.2, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 4.5, durationBeats: 3.5, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 9.3, durationBeats: 3.2, arpPattern: 'pinch-plucked' },
            { symbol: 'Am7', startBeat: 12.5, durationBeats: 3.5, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 17.3, durationBeats: 3.2, arpPattern: 'lofi-broken' },
            { symbol: 'Em7', startBeat: 20.5, durationBeats: 3.5, arpPattern: 'rising-arp' },
            { symbol: 'Am', startBeat: 25.5, durationBeats: 6.5, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-kcht-chorus-1',
          kind: 'Chorus',
          label: 'Chorus 1 — Nhìn Người Mình Yêu',
          bars: 8,
          text:
            'Nhìn người mình [Fmaj7]yêu đau đớn như [G]vậy\n' +
            'Lòng em vỡ [Em7]tan sau lưng anh [Am]đấy\n' +
            'Người dành nhớ [Dm7]thương, cả đời vấn [G]vương\n' +
            'Cô ta đâu [Cmaj7]thấy',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 1.8, durationBeats: 3.1, arpPattern: 'rich-block' },
            { symbol: 'G', startBeat: 4.9, durationBeats: 3.1, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 9.8, durationBeats: 3.1, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 12.9, durationBeats: 3.1, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 17.8, durationBeats: 3.6, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 21.4, durationBeats: 2.6, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 25.5, durationBeats: 6.5, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-kcht-chorus-2',
          kind: 'Chorus',
          label: 'Chorus 2 — Chạy Về Bên Em',
          bars: 8,
          text:
            'Chạy về bên [Fmaj7]em, em vẫn ở [G]đây\n' +
            'Chẳng đành nhìn [Em7]anh nước mắt rơi [Am7]đầy\n' +
            'Ôm những cơn [Dm7]đau nỗi buồn em [Em7]giấu âm thầm phía [Fmaj7]sau\n' +
            'Dối [Em7]lòng em chẳng sao [Asus4]đâu [A]',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 1.8, durationBeats: 3.4, arpPattern: 'rich-block' },
            { symbol: 'G', startBeat: 5.2, durationBeats: 2.8, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 9.8, durationBeats: 3.1, arpPattern: 'ballad-wave' },
            { symbol: 'Am7', startBeat: 12.9, durationBeats: 3.1, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 17.65, durationBeats: 2.5, arpPattern: 'pinch-plucked' },
            { symbol: 'Em7', startBeat: 20.15, durationBeats: 2.5, arpPattern: 'rising-arp' },
            { symbol: 'Fmaj7', startBeat: 22.65, durationBeats: 1.35, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 24.75, durationBeats: 3.0, arpPattern: 'falling-arp' },
            { symbol: 'Asus4', startBeat: 27.75, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'A', startBeat: 29.75, durationBeats: 2.25, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-kcht-interlude',
          kind: 'Interlude',
          label: 'Interlude — Chẳng Biết Đâu',
          bars: 8,
          text:
            '[Fmaj13]Chẳng biết đâu, em chẳng biết [Cmaj13]đâu\n' +
            'Nỗi [Fmaj13]buồn anh in [Am9]sâu\n' +
            'Nơi bỏ chạy [Fmaj7]quay lưng, em thật sự [G]đau lòng nhớ về [Cmaj7]anh [Am]\n' +
            'Nơi bình yên [Dm7]nơi đây chỉ có [Em7]em chờ [Fmaj7]anh [G] [Asus4] [A]',
          chordSchedule: [
            { symbol: 'Fmaj13', startBeat: 0.0, durationBeats: 5.1, arpPattern: 'lofi-broken' },
            { symbol: 'Cmaj13', startBeat: 5.1, durationBeats: 2.9, arpPattern: 'falling-arp' },
            { symbol: 'Fmaj13', startBeat: 8.75, durationBeats: 2.75, arpPattern: 'rising-arp' },
            { symbol: 'Am9', startBeat: 11.5, durationBeats: 4.5, arpPattern: 'lofi-broken' },
            { symbol: 'Fmaj7', startBeat: 17.5, durationBeats: 2.95, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 20.45, durationBeats: 2.15, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 22.6, durationBeats: 0.7, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 23.3, durationBeats: 0.7, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 25.5, durationBeats: 2.1, arpPattern: 'lofi-broken' },
            { symbol: 'Em7', startBeat: 27.6, durationBeats: 1.2, arpPattern: 'rising-arp' },
            { symbol: 'Fmaj7', startBeat: 28.8, durationBeats: 0.85, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 29.65, durationBeats: 0.75, arpPattern: 'falling-arp' },
            { symbol: 'Asus4', startBeat: 30.4, durationBeats: 0.8, arpPattern: 'pinch-plucked' },
            { symbol: 'A', startBeat: 31.2, durationBeats: 0.8, arpPattern: 'rich-block' },
          ],
        },
      ],
      melodyNotes: [
        // 1. Intro (8 bars = 32 beats, 35 notes — iconic Canon-Am Lofi hook)
        { id: 'kci-1', sectionId: 'sec-kcht-intro', midi: 76, startBeat: 0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'kci-2', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 1.0, durationBeats: 0.5, velocity: 0.72 },
        { id: 'kci-3', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 1.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'kci-4', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 2.0, durationBeats: 1.0, velocity: 0.75 },
        { id: 'kci-5', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 3.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'kci-6', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 4.0, durationBeats: 1.0, velocity: 0.75 },
        { id: 'kci-7', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 5.0, durationBeats: 0.5, velocity: 0.72 },
        { id: 'kci-8', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 5.5, durationBeats: 0.5, velocity: 0.7 },
        { id: 'kci-9', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 6.0, durationBeats: 1.25, velocity: 0.78 },
        { id: 'kci-10', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 7.25, durationBeats: 0.75, velocity: 0.72 },
        { id: 'kci-11', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 8.0, durationBeats: 1.0, velocity: 0.74 },
        { id: 'kci-12', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 9.0, durationBeats: 0.5, velocity: 0.74 },
        { id: 'kci-13', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 9.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'kci-14', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 10.0, durationBeats: 1.0, velocity: 0.75 },
        { id: 'kci-15', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 11.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'kci-16', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 12.0, durationBeats: 2.0, velocity: 0.8 },
        { id: 'kci-17', sectionId: 'sec-kcht-intro', midi: 76, startBeat: 14.5, durationBeats: 1.25, velocity: 0.74 },
        { id: 'kci-18', sectionId: 'sec-kcht-intro', midi: 77, startBeat: 16.0, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kci-19', sectionId: 'sec-kcht-intro', midi: 76, startBeat: 16.75, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kci-20', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 17.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'kci-21', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 18.0, durationBeats: 1.25, velocity: 0.76 },
        { id: 'kci-22', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 19.25, durationBeats: 0.75, velocity: 0.72 },
        { id: 'kci-23', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 20.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'kci-24', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 21.0, durationBeats: 1.0, velocity: 0.74 },
        { id: 'kci-25', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 22.0, durationBeats: 1.25, velocity: 0.76 },
        { id: 'kci-26', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 23.25, durationBeats: 0.75, velocity: 0.72 },
        { id: 'kci-27', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 24.0, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kci-28', sectionId: 'sec-kcht-intro', midi: 72, startBeat: 24.75, durationBeats: 0.75, velocity: 0.74 },
        { id: 'kci-29', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 25.5, durationBeats: 0.5, velocity: 0.72 },
        { id: 'kci-30', sectionId: 'sec-kcht-intro', midi: 71, startBeat: 26.0, durationBeats: 1.25, velocity: 0.76 },
        { id: 'kci-31', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 27.25, durationBeats: 0.75, velocity: 0.74 },
        { id: 'kci-32', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 28.0, durationBeats: 1.0, velocity: 0.74 },
        { id: 'kci-33', sectionId: 'sec-kcht-intro', midi: 74, startBeat: 29.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'kci-34', sectionId: 'sec-kcht-intro', midi: 73, startBeat: 30.0, durationBeats: 1.25, velocity: 0.78 },
        { id: 'kci-35', sectionId: 'sec-kcht-intro', midi: 69, startBeat: 31.25, durationBeats: 0.75, velocity: 0.72 },

        // 2. Verse 1 (8 bars = 32 beats, 8 beats per lyric line — locked 1:1 with chordSchedule)
        { id: 'kcv1-1', sectionId: 'sec-kcht-verse-1', midi: 64, startBeat: 0.0, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcv1-2', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 0.75, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcv1-3', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 1.5, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv1-4', sectionId: 'sec-kcht-verse-1', midi: 72, startBeat: 2.25, durationBeats: 0.75, velocity: 0.86 },
        { id: 'kcv1-5', sectionId: 'sec-kcht-verse-1', midi: 71, startBeat: 3.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv1-6', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 3.75, durationBeats: 2.5, velocity: 0.8 },
        { id: 'kcv1-7', sectionId: 'sec-kcht-verse-1', midi: 64, startBeat: 8.0, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kcv1-8', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 8.75, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv1-9', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 9.5, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcv1-10', sectionId: 'sec-kcht-verse-1', midi: 71, startBeat: 10.25, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcv1-11', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 11.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv1-12', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 11.75, durationBeats: 2.5, velocity: 0.78 },
        { id: 'kcv1-13', sectionId: 'sec-kcht-verse-1', midi: 64, startBeat: 16.0, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kcv1-14', sectionId: 'sec-kcht-verse-1', midi: 65, startBeat: 16.75, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv1-15', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 17.5, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv1-16', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 18.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv1-17', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 19.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'kcv1-18', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 20.0, durationBeats: 2.5, velocity: 0.82 },
        { id: 'kcv1-19', sectionId: 'sec-kcht-verse-1', midi: 64, startBeat: 24.0, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kcv1-20', sectionId: 'sec-kcht-verse-1', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv1-21', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 25.5, durationBeats: 1.0, velocity: 0.84 },
        { id: 'kcv1-22', sectionId: 'sec-kcht-verse-1', midi: 69, startBeat: 26.5, durationBeats: 3.75, velocity: 0.82 },

        // 3. Verse 2 (8 bars = 32 beats)
        { id: 'kcv2-1', sectionId: 'sec-kcht-verse-2', midi: 64, startBeat: 0.0, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcv2-2', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 0.75, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcv2-3', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 1.5, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv2-4', sectionId: 'sec-kcht-verse-2', midi: 72, startBeat: 2.25, durationBeats: 0.75, velocity: 0.86 },
        { id: 'kcv2-5', sectionId: 'sec-kcht-verse-2', midi: 71, startBeat: 3.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv2-6', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 3.75, durationBeats: 2.5, velocity: 0.8 },
        { id: 'kcv2-7', sectionId: 'sec-kcht-verse-2', midi: 64, startBeat: 8.0, durationBeats: 0.75, velocity: 0.76 },
        { id: 'kcv2-8', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 8.75, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcv2-9', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 9.5, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcv2-10', sectionId: 'sec-kcht-verse-2', midi: 71, startBeat: 10.25, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcv2-11', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 11.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv2-12', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 11.75, durationBeats: 2.5, velocity: 0.78 },
        { id: 'kcv2-13', sectionId: 'sec-kcht-verse-2', midi: 64, startBeat: 16.0, durationBeats: 0.65, velocity: 0.76 },
        { id: 'kcv2-14', sectionId: 'sec-kcht-verse-2', midi: 64, startBeat: 16.65, durationBeats: 0.65, velocity: 0.76 },
        { id: 'kcv2-15', sectionId: 'sec-kcht-verse-2', midi: 65, startBeat: 17.3, durationBeats: 0.85, velocity: 0.82 },
        { id: 'kcv2-16', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 18.15, durationBeats: 0.65, velocity: 0.84 },
        { id: 'kcv2-17', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 18.8, durationBeats: 0.65, velocity: 0.82 },
        { id: 'kcv2-18', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 19.45, durationBeats: 0.8, velocity: 0.8 },
        { id: 'kcv2-19', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 20.25, durationBeats: 2.5, velocity: 0.84 },
        { id: 'kcv2-20', sectionId: 'sec-kcht-verse-2', midi: 64, startBeat: 24.0, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcv2-21', sectionId: 'sec-kcht-verse-2', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcv2-22', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 25.5, durationBeats: 1.0, velocity: 0.84 },
        { id: 'kcv2-23', sectionId: 'sec-kcht-verse-2', midi: 69, startBeat: 26.5, durationBeats: 3.75, velocity: 0.82 },

        // 4. Pre-Chorus 1 (8 bars = 32 beats)
        { id: 'kcp1-1', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 0.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp1-2', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 0.65, durationBeats: 0.65, velocity: 0.82 },
        { id: 'kcp1-3', sectionId: 'sec-kcht-pre-1', midi: 72, startBeat: 1.3, durationBeats: 1.0, velocity: 0.86 },
        { id: 'kcp1-4', sectionId: 'sec-kcht-pre-1', midi: 72, startBeat: 2.3, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcp1-5', sectionId: 'sec-kcht-pre-1', midi: 71, startBeat: 3.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcp1-6', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 3.75, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcp1-7', sectionId: 'sec-kcht-pre-1', midi: 72, startBeat: 4.5, durationBeats: 2.25, velocity: 0.86 },
        { id: 'kcp1-8', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 8.0, durationBeats: 0.6, velocity: 0.78 },
        { id: 'kcp1-9', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 8.6, durationBeats: 0.6, velocity: 0.8 },
        { id: 'kcp1-10', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 9.2, durationBeats: 0.6, velocity: 0.82 },
        { id: 'kcp1-11', sectionId: 'sec-kcht-pre-1', midi: 71, startBeat: 9.8, durationBeats: 0.9, velocity: 0.86 },
        { id: 'kcp1-12', sectionId: 'sec-kcht-pre-1', midi: 71, startBeat: 10.7, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcp1-13', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 11.4, durationBeats: 0.7, velocity: 0.8 },
        { id: 'kcp1-14', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 12.1, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcp1-15', sectionId: 'sec-kcht-pre-1', midi: 71, startBeat: 12.85, durationBeats: 2.0, velocity: 0.84 },
        { id: 'kcp1-16', sectionId: 'sec-kcht-pre-1', midi: 65, startBeat: 16.0, durationBeats: 0.65, velocity: 0.78 },
        { id: 'kcp1-17', sectionId: 'sec-kcht-pre-1', midi: 65, startBeat: 16.65, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp1-18', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 17.3, durationBeats: 0.85, velocity: 0.84 },
        { id: 'kcp1-19', sectionId: 'sec-kcht-pre-1', midi: 69, startBeat: 18.15, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kcp1-20', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 18.9, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcp1-21', sectionId: 'sec-kcht-pre-1', midi: 65, startBeat: 19.65, durationBeats: 0.75, velocity: 0.78 },
        { id: 'kcp1-22', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 20.4, durationBeats: 2.35, velocity: 0.84 },
        { id: 'kcp1-23', sectionId: 'sec-kcht-pre-1', midi: 64, startBeat: 24.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcp1-24', sectionId: 'sec-kcht-pre-1', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcp1-25', sectionId: 'sec-kcht-pre-1', midi: 72, startBeat: 25.5, durationBeats: 1.25, velocity: 0.88 },
        { id: 'kcp1-26', sectionId: 'sec-kcht-pre-1', midi: 72, startBeat: 26.75, durationBeats: 3.5, velocity: 0.86 },

        // 5. Pre-Chorus 2 (8 bars = 32 beats)
        { id: 'kcp2-1', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 0.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp2-2', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 0.65, durationBeats: 0.65, velocity: 0.82 },
        { id: 'kcp2-3', sectionId: 'sec-kcht-pre-2', midi: 72, startBeat: 1.3, durationBeats: 0.95, velocity: 0.86 },
        { id: 'kcp2-4', sectionId: 'sec-kcht-pre-2', midi: 72, startBeat: 2.25, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcp2-5', sectionId: 'sec-kcht-pre-2', midi: 74, startBeat: 2.95, durationBeats: 0.75, velocity: 0.88 },
        { id: 'kcp2-6', sectionId: 'sec-kcht-pre-2', midi: 71, startBeat: 3.7, durationBeats: 0.8, velocity: 0.84 },
        { id: 'kcp2-7', sectionId: 'sec-kcht-pre-2', midi: 74, startBeat: 4.5, durationBeats: 2.25, velocity: 0.88 },
        { id: 'kcp2-8', sectionId: 'sec-kcht-pre-2', midi: 67, startBeat: 8.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp2-9', sectionId: 'sec-kcht-pre-2', midi: 67, startBeat: 8.65, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp2-10', sectionId: 'sec-kcht-pre-2', midi: 71, startBeat: 9.3, durationBeats: 0.95, velocity: 0.84 },
        { id: 'kcp2-11', sectionId: 'sec-kcht-pre-2', midi: 71, startBeat: 10.25, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcp2-12', sectionId: 'sec-kcht-pre-2', midi: 72, startBeat: 10.95, durationBeats: 0.75, velocity: 0.86 },
        { id: 'kcp2-13', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 11.7, durationBeats: 0.8, velocity: 0.82 },
        { id: 'kcp2-14', sectionId: 'sec-kcht-pre-2', midi: 72, startBeat: 12.5, durationBeats: 2.25, velocity: 0.86 },
        { id: 'kcp2-15', sectionId: 'sec-kcht-pre-2', midi: 65, startBeat: 16.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp2-16', sectionId: 'sec-kcht-pre-2', midi: 65, startBeat: 16.65, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcp2-17', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 17.3, durationBeats: 0.95, velocity: 0.84 },
        { id: 'kcp2-18', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 18.25, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcp2-19', sectionId: 'sec-kcht-pre-2', midi: 71, startBeat: 18.95, durationBeats: 0.75, velocity: 0.86 },
        { id: 'kcp2-20', sectionId: 'sec-kcht-pre-2', midi: 67, startBeat: 19.7, durationBeats: 0.8, velocity: 0.82 },
        { id: 'kcp2-21', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 20.5, durationBeats: 2.25, velocity: 0.86 },
        { id: 'kcp2-22', sectionId: 'sec-kcht-pre-2', midi: 64, startBeat: 24.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcp2-23', sectionId: 'sec-kcht-pre-2', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kcp2-24', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 25.5, durationBeats: 1.25, velocity: 0.88 },
        { id: 'kcp2-25', sectionId: 'sec-kcht-pre-2', midi: 69, startBeat: 26.75, durationBeats: 3.5, velocity: 0.86 },

        // 6. Chorus 1 (8 bars = 32 beats)
        { id: 'kc1-1', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 0.0, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kc1-2', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 0.6, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kc1-3', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 1.2, durationBeats: 0.6, velocity: 0.9 },
        { id: 'kc1-4', sectionId: 'sec-kcht-chorus-1', midi: 79, startBeat: 1.8, durationBeats: 1.0, velocity: 0.94 },
        { id: 'kc1-5', sectionId: 'sec-kcht-chorus-1', midi: 79, startBeat: 2.8, durationBeats: 0.7, velocity: 0.92 },
        { id: 'kc1-6', sectionId: 'sec-kcht-chorus-1', midi: 77, startBeat: 3.5, durationBeats: 0.7, velocity: 0.9 },
        { id: 'kc1-7', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 4.2, durationBeats: 0.7, velocity: 0.88 },
        { id: 'kc1-8', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 4.9, durationBeats: 2.0, velocity: 0.88 },
        { id: 'kc1-9', sectionId: 'sec-kcht-chorus-1', midi: 71, startBeat: 8.0, durationBeats: 0.6, velocity: 0.84 },
        { id: 'kc1-10', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 8.6, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kc1-11', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 9.2, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kc1-12', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 9.8, durationBeats: 1.0, velocity: 0.92 },
        { id: 'kc1-13', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 10.8, durationBeats: 0.7, velocity: 0.9 },
        { id: 'kc1-14', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 11.5, durationBeats: 0.7, velocity: 0.88 },
        { id: 'kc1-15', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 12.2, durationBeats: 0.7, velocity: 0.86 },
        { id: 'kc1-16', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 12.9, durationBeats: 2.0, velocity: 0.88 },
        { id: 'kc1-17', sectionId: 'sec-kcht-chorus-1', midi: 69, startBeat: 16.0, durationBeats: 0.6, velocity: 0.84 },
        { id: 'kc1-18', sectionId: 'sec-kcht-chorus-1', midi: 71, startBeat: 16.6, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kc1-19', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 17.2, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kc1-20', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 17.8, durationBeats: 1.25, velocity: 0.9 },
        { id: 'kc1-21', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 19.4, durationBeats: 0.65, velocity: 0.88 },
        { id: 'kc1-22', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 20.05, durationBeats: 0.65, velocity: 0.86 },
        { id: 'kc1-23', sectionId: 'sec-kcht-chorus-1', midi: 71, startBeat: 20.7, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kc1-24', sectionId: 'sec-kcht-chorus-1', midi: 74, startBeat: 21.4, durationBeats: 1.85, velocity: 0.88 },
        { id: 'kc1-25', sectionId: 'sec-kcht-chorus-1', midi: 71, startBeat: 24.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kc1-26', sectionId: 'sec-kcht-chorus-1', midi: 72, startBeat: 24.75, durationBeats: 0.75, velocity: 0.88 },
        { id: 'kc1-27', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 25.5, durationBeats: 1.0, velocity: 0.92 },
        { id: 'kc1-28', sectionId: 'sec-kcht-chorus-1', midi: 76, startBeat: 26.5, durationBeats: 3.75, velocity: 0.88 },

        // 7. Chorus 2 (8 bars = 32 beats)
        { id: 'kc2-1', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 0.0, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kc2-2', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 0.6, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kc2-3', sectionId: 'sec-kcht-chorus-2', midi: 76, startBeat: 1.2, durationBeats: 0.6, velocity: 0.9 },
        { id: 'kc2-4', sectionId: 'sec-kcht-chorus-2', midi: 79, startBeat: 1.8, durationBeats: 1.1, velocity: 0.94 },
        { id: 'kc2-5', sectionId: 'sec-kcht-chorus-2', midi: 77, startBeat: 3.2, durationBeats: 0.65, velocity: 0.9 },
        { id: 'kc2-6', sectionId: 'sec-kcht-chorus-2', midi: 76, startBeat: 3.85, durationBeats: 0.65, velocity: 0.88 },
        { id: 'kc2-7', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 4.5, durationBeats: 0.7, velocity: 0.86 },
        { id: 'kc2-8', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 5.2, durationBeats: 1.8, velocity: 0.88 },
        { id: 'kc2-9', sectionId: 'sec-kcht-chorus-2', midi: 71, startBeat: 8.0, durationBeats: 0.6, velocity: 0.84 },
        { id: 'kc2-10', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 8.6, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kc2-11', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 9.2, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kc2-12', sectionId: 'sec-kcht-chorus-2', midi: 76, startBeat: 9.8, durationBeats: 1.0, velocity: 0.92 },
        { id: 'kc2-13', sectionId: 'sec-kcht-chorus-2', midi: 76, startBeat: 10.8, durationBeats: 0.7, velocity: 0.9 },
        { id: 'kc2-14', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 11.5, durationBeats: 0.7, velocity: 0.88 },
        { id: 'kc2-15', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 12.2, durationBeats: 0.7, velocity: 0.86 },
        { id: 'kc2-16', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 12.9, durationBeats: 2.0, velocity: 0.88 },
        { id: 'kc2-17', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 16.0, durationBeats: 0.55, velocity: 0.84 },
        { id: 'kc2-18', sectionId: 'sec-kcht-chorus-2', midi: 71, startBeat: 16.55, durationBeats: 0.55, velocity: 0.86 },
        { id: 'kc2-19', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 17.1, durationBeats: 0.55, velocity: 0.88 },
        { id: 'kc2-20', sectionId: 'sec-kcht-chorus-2', midi: 74, startBeat: 17.65, durationBeats: 0.85, velocity: 0.9 },
        { id: 'kc2-21', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 18.5, durationBeats: 0.55, velocity: 0.88 },
        { id: 'kc2-22', sectionId: 'sec-kcht-chorus-2', midi: 71, startBeat: 19.05, durationBeats: 0.55, velocity: 0.86 },
        { id: 'kc2-23', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 19.6, durationBeats: 0.55, velocity: 0.84 },
        { id: 'kc2-24', sectionId: 'sec-kcht-chorus-2', midi: 71, startBeat: 20.15, durationBeats: 0.85, velocity: 0.88 },
        { id: 'kc2-25', sectionId: 'sec-kcht-chorus-2', midi: 72, startBeat: 21.0, durationBeats: 0.55, velocity: 0.88 },
        { id: 'kc2-26', sectionId: 'sec-kcht-chorus-2', midi: 71, startBeat: 21.55, durationBeats: 0.55, velocity: 0.86 },
        { id: 'kc2-27', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 22.1, durationBeats: 0.55, velocity: 0.84 },
        { id: 'kc2-28', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 22.65, durationBeats: 1.15, velocity: 0.86 },
        { id: 'kc2-29', sectionId: 'sec-kcht-chorus-2', midi: 67, startBeat: 24.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kc2-30', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 24.75, durationBeats: 0.75, velocity: 0.84 },
        { id: 'kc2-31', sectionId: 'sec-kcht-chorus-2', midi: 67, startBeat: 25.5, durationBeats: 0.75, velocity: 0.82 },
        { id: 'kc2-32', sectionId: 'sec-kcht-chorus-2', midi: 64, startBeat: 26.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kc2-33', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 27.0, durationBeats: 0.75, velocity: 0.86 },
        { id: 'kc2-34', sectionId: 'sec-kcht-chorus-2', midi: 69, startBeat: 27.75, durationBeats: 3.5, velocity: 0.88 },

        // 8. Interlude (8 bars = 32 beats)
        { id: 'kcin-1', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 0.0, durationBeats: 0.7, velocity: 0.84 },
        { id: 'kcin-2', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 0.7, durationBeats: 0.7, velocity: 0.8 },
        { id: 'kcin-3', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 1.4, durationBeats: 1.35, velocity: 0.84 },
        { id: 'kcin-4', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 3.15, durationBeats: 0.65, velocity: 0.82 },
        { id: 'kcin-5', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 3.8, durationBeats: 0.65, velocity: 0.8 },
        { id: 'kcin-6', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 4.45, durationBeats: 0.65, velocity: 0.82 },
        { id: 'kcin-7', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 5.1, durationBeats: 2.0, velocity: 0.84 },
        { id: 'kcin-8', sectionId: 'sec-kcht-interlude', midi: 67, startBeat: 8.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'kcin-9', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 8.75, durationBeats: 1.0, velocity: 0.84 },
        { id: 'kcin-10', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 9.75, durationBeats: 0.85, velocity: 0.84 },
        { id: 'kcin-11', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 10.6, durationBeats: 0.9, velocity: 0.86 },
        { id: 'kcin-12', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 11.5, durationBeats: 2.75, velocity: 0.84 },
        { id: 'kcin-13', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 16.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-14', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 16.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-15', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 17.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'kcin-16', sectionId: 'sec-kcht-interlude', midi: 74, startBeat: 17.5, durationBeats: 0.65, velocity: 0.88 },
        { id: 'kcin-17', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 18.15, durationBeats: 0.8, velocity: 0.86 },
        { id: 'kcin-18', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 18.95, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-19', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 19.45, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-20', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 19.95, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-21', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 20.45, durationBeats: 0.65, velocity: 0.86 },
        { id: 'kcin-22', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 21.1, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-23', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 21.6, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-24', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 22.1, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-25', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 22.6, durationBeats: 1.2, velocity: 0.86 },
        { id: 'kcin-26', sectionId: 'sec-kcht-interlude', midi: 65, startBeat: 24.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'kcin-27', sectionId: 'sec-kcht-interlude', midi: 67, startBeat: 24.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-28', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 25.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-29', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 25.5, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kcin-30', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 26.1, durationBeats: 0.5, velocity: 0.88 },
        { id: 'kcin-31', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 26.6, durationBeats: 0.5, velocity: 0.84 },
        { id: 'kcin-32', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 27.1, durationBeats: 0.5, velocity: 0.82 },
        { id: 'kcin-33', sectionId: 'sec-kcht-interlude', midi: 71, startBeat: 27.6, durationBeats: 0.6, velocity: 0.86 },
        { id: 'kcin-34', sectionId: 'sec-kcht-interlude', midi: 72, startBeat: 28.2, durationBeats: 0.6, velocity: 0.88 },
        { id: 'kcin-35', sectionId: 'sec-kcht-interlude', midi: 69, startBeat: 28.8, durationBeats: 2.5, velocity: 0.86 },
      ],
    },
    {
      id: 'draft-thang-tu-la-loi-noi-doi-cua-em',
      title: 'Tháng Tư Là Lời Nói Dối Của Em (Tone C)',
      keyRoot: 'C',
      scaleMode: 'major',
      mood: 'pop-ballad',
      bpm: 72,
      backingInstrument: 'piano-ballad',
      backingPattern: 'auto-song',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'none',
      melodyInstrument: 'piano',
      scaleSnap: true,
      updatedAt: now + 20_000,
      sections: [
        {
          id: 'sec-tt-intro',
          kind: 'Intro',
          label: 'Intro — Piano Tháng Tư',
          bars: 4,
          text:
            '[Fmaj7] [Fm] [C/E] [F#dim]\n' +
            '[Dm7] [C/E] [Fmaj7] [G7]',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'Fm', startBeat: 2, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'C/E', startBeat: 4, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'F#dim', startBeat: 6, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 8, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'C/E', startBeat: 10, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'Fmaj7', startBeat: 12, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'G7', startBeat: 14, durationBeats: 2, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-verse-1',
          kind: 'Verse',
          label: '1. Mùa Xuân Có Em',
          bars: 8,
          text:
            '[F]Mùa xuân có [G]em như chưa bắt [Em7]đầu [Am7]\n' +
            '[Dm7]Và cơn gió [G]như khẽ mơn man [Am7]lay từng nhành hoa rơi\n' +
            '[Fmaj7]Em đã bước [G]tới như em đã [Em7]từng [Am7]\n' +
            '[Dm7]Chạy trốn với [Em7]anh đến cánh đồng [Asus4]xanh [A]',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 2.0, durationBeats: 2.55, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 4.55, durationBeats: 1.45, arpPattern: 'falling-arp' },
            { symbol: 'Am7', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 1.8, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 9.8, durationBeats: 2.2, arpPattern: 'falling-arp' },
            { symbol: 'Am7', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'rising-arp' },
            { symbol: 'Fmaj7', startBeat: 16.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 18.0, durationBeats: 2.6, arpPattern: 'pinch-plucked' },
            { symbol: 'Em7', startBeat: 20.6, durationBeats: 1.4, arpPattern: 'falling-arp' },
            { symbol: 'Am7', startBeat: 22.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Dm7', startBeat: 24.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 26.0, durationBeats: 2.65, arpPattern: 'pinch-plucked' },
            { symbol: 'Asus4', startBeat: 28.65, durationBeats: 1.35, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 30.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-verse-2',
          kind: 'Verse',
          label: '2. Khúc Nhạc Nắng Chiều',
          bars: 8,
          text:
            'Khúc [Fmaj7]nhạc hoà cùng nắng [G]chiều dịu dàng để [Em7]mình gần lại [Am7]mãi\n' +
            'Nói [Dm7]lời thì thầm những [G]điều thật thà đã [Cmaj7]giữ trong tim mình [C7]\n' +
            'Những [Fmaj7]chặng đường dài ngỡ [G]mình mệt nhoài đã [Em7]một lần gục [Am]ngã\n' +
            'Tháng [Dm7]tư có em ở [Em7]đây nhìn tôi mỉm [Asus4]cười [A]',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0.45, durationBeats: 1.95, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 2.4, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em7', startBeat: 4.4, durationBeats: 1.6, arpPattern: 'pinch-plucked' },
            { symbol: 'Am7', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.45, durationBeats: 1.95, arpPattern: 'lofi-broken' },
            { symbol: 'G', startBeat: 10.4, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 12.4, durationBeats: 2.3, arpPattern: 'ballad-wave' },
            { symbol: 'C7', startBeat: 14.7, durationBeats: 1.3, arpPattern: 'pinch-plucked' },
            { symbol: 'Fmaj7', startBeat: 16.45, durationBeats: 1.95, arpPattern: 'rising-arp' },
            { symbol: 'G', startBeat: 18.4, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Em7', startBeat: 20.4, durationBeats: 1.6, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 22.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 24.55, durationBeats: 2.25, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 26.8, durationBeats: 2.35, arpPattern: 'rising-arp' },
            { symbol: 'Asus4', startBeat: 29.15, durationBeats: 1.1, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 30.25, durationBeats: 1.75, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-1',
          kind: 'Chorus',
          label: 'ĐK 1 — Những Cánh Hoa',
          bars: 8,
          text:
            'Những cánh hoa phai [F]tàn thật [F6]nhanh, em có bay [Em7]xa, em có đi [Am7]xa mãi\n' +
            'Tháng tư đôi khi [Dm7]thật mong [G7]manh để mình nói [C]ra những câu chân thật [C7]\n' +
            'Giá như tôi một [Fmaj7]lần tin [Fm6]em, cô gái tôi [Em7]thương, này hoá theo [Ebdim]mây gió\n' +
            'Để [Dm7]lại tháng [Em7]tư ở [Asus4]đó [A]',
          chordSchedule: [
            { symbol: 'F', startBeat: 1.6, durationBeats: 1.0, arpPattern: 'rich-block' },
            { symbol: 'F6', startBeat: 2.6, durationBeats: 2.15, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 4.75, durationBeats: 2.1, arpPattern: 'falling-arp' },
            { symbol: 'Am7', startBeat: 6.85, durationBeats: 1.15, arpPattern: 'rising-arp' },
            { symbol: 'Dm7', startBeat: 9.7, durationBeats: 1.0, arpPattern: 'ballad-wave' },
            { symbol: 'G7', startBeat: 10.7, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'C', startBeat: 12.7, durationBeats: 2.45, arpPattern: 'rich-block' },
            { symbol: 'C7', startBeat: 15.15, durationBeats: 0.85, arpPattern: 'pinch-plucked' },
            { symbol: 'Fmaj7', startBeat: 17.6, durationBeats: 1.0, arpPattern: 'rich-block' },
            { symbol: 'Fm6', startBeat: 18.6, durationBeats: 2.15, arpPattern: 'falling-arp' },
            { symbol: 'Em7', startBeat: 20.75, durationBeats: 2.1, arpPattern: 'ballad-wave' },
            { symbol: 'Ebdim', startBeat: 22.85, durationBeats: 1.15, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 24.65, durationBeats: 1.45, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 26.1, durationBeats: 1.5, arpPattern: 'rising-arp' },
            { symbol: 'Asus4', startBeat: 27.6, durationBeats: 2.6, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 30.2, durationBeats: 1.8, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-bridge',
          kind: 'Bridge',
          label: 'Bridge — Và Tôi Sẽ Sống',
          bars: 8,
          text:
            '[F]Và tôi sẽ [G]sống như những [Em]gì em từng [Am]mơ\n' +
            '[F]Và tôi sẽ [G]bước tiếp trên con [Em]mình đã chọn [Am]\n' +
            '[F]Và khi tôi [G]chết sẽ mỉm [Em]cười khi gặp [Am]em\n' +
            'Khẽ [F]chào cô gái tháng [G]tư của [Asus4]tôi [A]',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 1.7, arpPattern: 'pinch-plucked' },
            { symbol: 'G', startBeat: 1.7, durationBeats: 1.75, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 3.45, durationBeats: 1.85, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 5.3, durationBeats: 2.7, arpPattern: 'falling-arp' },
            { symbol: 'F', startBeat: 8.0, durationBeats: 1.7, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 9.7, durationBeats: 2.3, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 14.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'F', startBeat: 16.0, durationBeats: 1.7, arpPattern: 'rich-block' },
            { symbol: 'G', startBeat: 17.7, durationBeats: 1.8, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 19.5, durationBeats: 1.8, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 21.3, durationBeats: 2.7, arpPattern: 'falling-arp' },
            { symbol: 'F', startBeat: 24.55, durationBeats: 2.5, arpPattern: 'rising-arp' },
            { symbol: 'G', startBeat: 27.05, durationBeats: 1.3, arpPattern: 'ballad-wave' },
            { symbol: 'Asus4', startBeat: 28.35, durationBeats: 1.65, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 30.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-2',
          kind: 'Chorus',
          label: 'ĐK 2 — Những Kỷ Niệm',
          bars: 8,
          text:
            'Những kỷ niệm phai [F]tàn thật [F6]nhanh, em đã bay [Em7]xa, em đã đi [Am7]xa mãi\n' +
            'Tháng tư đôi khi [Dm]thật mong [G]manh để mình nói [C]ra những câu chân thật [C7]\n' +
            'Giá như tôi một [F]lần tin [Fm]em, cô gái tôi [Em7]thương, nay hoá theo [Ebdim]mây gió\n' +
            'Để [Dm]lại tháng [Em7]tư xa [Asus4]mãi [A]',
          chordSchedule: [
            { symbol: 'F', startBeat: 1.6, durationBeats: 1.0, arpPattern: 'rich-block' },
            { symbol: 'F6', startBeat: 2.6, durationBeats: 2.15, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 4.75, durationBeats: 2.1, arpPattern: 'falling-arp' },
            { symbol: 'Am7', startBeat: 6.85, durationBeats: 1.15, arpPattern: 'rising-arp' },
            { symbol: 'Dm', startBeat: 9.7, durationBeats: 1.0, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 10.7, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'C', startBeat: 12.7, durationBeats: 2.45, arpPattern: 'rich-block' },
            { symbol: 'C7', startBeat: 15.15, durationBeats: 0.85, arpPattern: 'pinch-plucked' },
            { symbol: 'F', startBeat: 17.6, durationBeats: 1.0, arpPattern: 'rich-block' },
            { symbol: 'Fm', startBeat: 18.6, durationBeats: 2.15, arpPattern: 'falling-arp' },
            { symbol: 'Em7', startBeat: 20.75, durationBeats: 2.1, arpPattern: 'ballad-wave' },
            { symbol: 'Ebdim', startBeat: 22.85, durationBeats: 1.15, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm', startBeat: 24.65, durationBeats: 1.45, arpPattern: 'ballad-wave' },
            { symbol: 'Em7', startBeat: 26.1, durationBeats: 1.65, arpPattern: 'rising-arp' },
            { symbol: 'Asus4', startBeat: 27.75, durationBeats: 2.25, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 30.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-outro',
          kind: 'Outro',
          label: 'Outro — Tháng Tư Mình Anh',
          bars: 4,
          text: 'Để [Fmaj7]lại tháng [Em7]tư mình [Am]anh [Fmaj7] [G] [Am]',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0.65, durationBeats: 1.5, arpPattern: 'falling-arp' },
            { symbol: 'Em7', startBeat: 2.15, durationBeats: 1.6, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 3.75, durationBeats: 4.25, arpPattern: 'ballad-wave' },
            { symbol: 'Fmaj7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Am', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'falling-arp' },
          ],
        },
      ],
      melodyNotes: [
        // 1. Intro (4 bars = 16 beats, 29 singing piano notes)
        { id: 'tti-1', sectionId: 'sec-tt-intro', midi: 76, startBeat: 0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-2', sectionId: 'sec-tt-intro', midi: 74, startBeat: 0.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-3', sectionId: 'sec-tt-intro', midi: 72, startBeat: 1.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-4', sectionId: 'sec-tt-intro', midi: 69, startBeat: 1.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'tti-5', sectionId: 'sec-tt-intro', midi: 68, startBeat: 2.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-6', sectionId: 'sec-tt-intro', midi: 72, startBeat: 2.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-7', sectionId: 'sec-tt-intro', midi: 74, startBeat: 3.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-8', sectionId: 'sec-tt-intro', midi: 72, startBeat: 3.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'tti-9', sectionId: 'sec-tt-intro', midi: 67, startBeat: 4.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-10', sectionId: 'sec-tt-intro', midi: 72, startBeat: 4.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-11', sectionId: 'sec-tt-intro', midi: 76, startBeat: 5.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'tti-12', sectionId: 'sec-tt-intro', midi: 79, startBeat: 5.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'tti-13', sectionId: 'sec-tt-intro', midi: 75, startBeat: 6.0, durationBeats: 0.75, velocity: 0.78 },
        { id: 'tti-14', sectionId: 'sec-tt-intro', midi: 72, startBeat: 6.75, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-15', sectionId: 'sec-tt-intro', midi: 69, startBeat: 7.25, durationBeats: 0.75, velocity: 0.74 },
        { id: 'tti-16', sectionId: 'sec-tt-intro', midi: 65, startBeat: 8.0, durationBeats: 0.5, velocity: 0.74 },
        { id: 'tti-17', sectionId: 'sec-tt-intro', midi: 69, startBeat: 8.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-18', sectionId: 'sec-tt-intro', midi: 72, startBeat: 9.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-19', sectionId: 'sec-tt-intro', midi: 76, startBeat: 9.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'tti-20', sectionId: 'sec-tt-intro', midi: 76, startBeat: 10.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-21', sectionId: 'sec-tt-intro', midi: 74, startBeat: 10.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-22', sectionId: 'sec-tt-intro', midi: 72, startBeat: 11.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-23', sectionId: 'sec-tt-intro', midi: 67, startBeat: 11.5, durationBeats: 0.5, velocity: 0.72 },
        { id: 'tti-24', sectionId: 'sec-tt-intro', midi: 69, startBeat: 12.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'tti-25', sectionId: 'sec-tt-intro', midi: 72, startBeat: 12.5, durationBeats: 0.75, velocity: 0.78 },
        { id: 'tti-26', sectionId: 'sec-tt-intro', midi: 76, startBeat: 13.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'tti-27', sectionId: 'sec-tt-intro', midi: 74, startBeat: 14.0, durationBeats: 0.65, velocity: 0.78 },
        { id: 'tti-28', sectionId: 'sec-tt-intro', midi: 72, startBeat: 14.65, durationBeats: 0.65, velocity: 0.76 },
        { id: 'tti-29', sectionId: 'sec-tt-intro', midi: 71, startBeat: 15.3, durationBeats: 0.7, velocity: 0.74 },

        // 2. Verse 1 (8 bars = 32 beats, locked 1:1 with chordSchedule)
        { id: 'ttv1-1', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 0.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'ttv1-2', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 0.65, durationBeats: 0.65, velocity: 0.82 },
        { id: 'ttv1-3', sectionId: 'sec-tt-verse-1', midi: 72, startBeat: 1.3, durationBeats: 0.7, velocity: 0.85 },
        { id: 'ttv1-4', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 2.0, durationBeats: 0.85, velocity: 0.84 },
        { id: 'ttv1-5', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 2.85, durationBeats: 0.6, velocity: 0.8 },
        { id: 'ttv1-6', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 3.45, durationBeats: 0.55, velocity: 0.78 },
        { id: 'ttv1-7', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 4.0, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv1-8', sectionId: 'sec-tt-verse-1', midi: 64, startBeat: 4.55, durationBeats: 2.0, velocity: 0.78 },
        { id: 'ttv1-9', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 8.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1-10', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 8.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv1-11', sectionId: 'sec-tt-verse-1', midi: 72, startBeat: 9.0, durationBeats: 0.8, velocity: 0.85 },
        { id: 'ttv1-12', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 9.8, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv1-13', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 10.35, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1-14', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 10.85, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1-15', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 11.35, durationBeats: 0.65, velocity: 0.78 },
        { id: 'ttv1-16', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 12.0, durationBeats: 0.6, velocity: 0.8 },
        { id: 'ttv1-17', sectionId: 'sec-tt-verse-1', midi: 62, startBeat: 12.6, durationBeats: 0.5, velocity: 0.76 },
        { id: 'ttv1-18', sectionId: 'sec-tt-verse-1', midi: 64, startBeat: 13.1, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv1-19', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 13.6, durationBeats: 0.55, velocity: 0.8 },
        { id: 'ttv1-20', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 14.15, durationBeats: 1.5, velocity: 0.82 },
        { id: 'ttv1-21', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 16.0, durationBeats: 0.65, velocity: 0.82 },
        { id: 'ttv1-22', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 16.65, durationBeats: 0.65, velocity: 0.84 },
        { id: 'ttv1-23', sectionId: 'sec-tt-verse-1', midi: 72, startBeat: 17.3, durationBeats: 0.7, velocity: 0.86 },
        { id: 'ttv1-24', sectionId: 'sec-tt-verse-1', midi: 74, startBeat: 18.0, durationBeats: 0.9, velocity: 0.88 },
        { id: 'ttv1-25', sectionId: 'sec-tt-verse-1', midi: 72, startBeat: 18.9, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv1-26', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 19.5, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv1-27', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 20.05, durationBeats: 0.55, velocity: 0.8 },
        { id: 'ttv1-28', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 20.6, durationBeats: 2.0, velocity: 0.78 },
        { id: 'ttv1-29', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 24.0, durationBeats: 0.65, velocity: 0.8 },
        { id: 'ttv1-30', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 24.65, durationBeats: 0.65, velocity: 0.82 },
        { id: 'ttv1-31', sectionId: 'sec-tt-verse-1', midi: 72, startBeat: 25.3, durationBeats: 0.7, velocity: 0.86 },
        { id: 'ttv1-32', sectionId: 'sec-tt-verse-1', midi: 71, startBeat: 26.0, durationBeats: 0.9, velocity: 0.84 },
        { id: 'ttv1-33', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 26.9, durationBeats: 0.6, velocity: 0.82 },
        { id: 'ttv1-34', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 27.5, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv1-35', sectionId: 'sec-tt-verse-1', midi: 67, startBeat: 28.05, durationBeats: 0.6, velocity: 0.8 },
        { id: 'ttv1-36', sectionId: 'sec-tt-verse-1', midi: 69, startBeat: 28.65, durationBeats: 2.5, velocity: 0.84 },

        // 3. Verse 2 (8 bars = 32 beats — warm chest register <= 76(E5), locked to chordSchedule)
        { id: 'ttv2-1', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 0.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-2', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 0.45, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-3', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 1.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-4', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 1.45, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttv2-5', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 1.9, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2-6', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 2.4, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2-7', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 3.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-8', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 3.45, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2-9', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 3.95, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttv2-10', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 4.4, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2-11', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 5.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2-12', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 5.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2-13', sectionId: 'sec-tt-verse-2', midi: 76, startBeat: 6.0, durationBeats: 1.75, velocity: 0.88 },
        { id: 'ttv2-14', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 8.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-15', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 8.45, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-16', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 9.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-17', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 9.45, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttv2-18', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 9.9, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2-19', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 10.4, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2-20', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 11.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-21', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 11.45, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2-22', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 11.95, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-23', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 12.4, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv2-24', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 12.95, durationBeats: 0.45, velocity: 0.78 },
        { id: 'ttv2-25', sectionId: 'sec-tt-verse-2', midi: 62, startBeat: 13.4, durationBeats: 0.45, velocity: 0.76 },
        { id: 'ttv2-26', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 13.85, durationBeats: 1.75, velocity: 0.82 },
        { id: 'ttv2-27', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 16.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-28', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 16.45, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-29', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 17.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-30', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 17.45, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttv2-31', sectionId: 'sec-tt-verse-2', midi: 64, startBeat: 17.9, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2-32', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 18.4, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2-33', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 19.0, durationBeats: 0.45, velocity: 0.8 },
        { id: 'ttv2-34', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 19.45, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2-35', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 19.95, durationBeats: 0.45, velocity: 0.84 },
        { id: 'ttv2-36', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 20.4, durationBeats: 0.6, velocity: 0.86 },
        { id: 'ttv2-37', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 21.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2-38', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 21.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2-39', sectionId: 'sec-tt-verse-2', midi: 76, startBeat: 22.0, durationBeats: 1.75, velocity: 0.88 },
        { id: 'ttv2-40', sectionId: 'sec-tt-verse-2', midi: 72, startBeat: 24.0, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttv2-41', sectionId: 'sec-tt-verse-2', midi: 71, startBeat: 24.55, durationBeats: 0.6, velocity: 0.86 },
        { id: 'ttv2-42', sectionId: 'sec-tt-verse-2', midi: 72, startBeat: 25.15, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttv2-43', sectionId: 'sec-tt-verse-2', midi: 71, startBeat: 25.7, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-44', sectionId: 'sec-tt-verse-2', midi: 72, startBeat: 26.25, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttv2-45', sectionId: 'sec-tt-verse-2', midi: 71, startBeat: 26.8, durationBeats: 0.7, velocity: 0.86 },
        { id: 'ttv2-46', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 27.5, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-47', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 28.05, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2-48', sectionId: 'sec-tt-verse-2', midi: 67, startBeat: 28.6, durationBeats: 0.55, velocity: 0.82 },
        { id: 'ttv2-49', sectionId: 'sec-tt-verse-2', midi: 69, startBeat: 29.15, durationBeats: 2.35, velocity: 0.86 },

        // 4. ĐK 1 (8 bars = 32 beats — comma breath pauses & sustained A5(81) on "đó")
        { id: 'ttc1-1', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 0.0, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-2', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 0.4, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc1-3', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 0.8, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc1-4', sectionId: 'sec-tt-chorus-1', midi: 71, startBeat: 1.2, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttc1-5', sectionId: 'sec-tt-chorus-1', midi: 69, startBeat: 1.6, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc1-6', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 2.15, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1-7', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 2.6, durationBeats: 0.75, velocity: 0.9 },
        { id: 'ttc1-8', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 3.55, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1-9', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 3.95, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc1-10', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 4.35, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-11', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 4.75, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc1-12', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 5.65, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1-13', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 6.05, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc1-14', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 6.45, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-15', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 6.85, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc1-16', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 7.3, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc1-17', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 8.0, durationBeats: 0.42, velocity: 0.88 },
        { id: 'ttc1-18', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 8.42, durationBeats: 0.42, velocity: 0.86 },
        { id: 'ttc1-19', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 8.84, durationBeats: 0.42, velocity: 0.86 },
        { id: 'ttc1-20', sectionId: 'sec-tt-chorus-1', midi: 71, startBeat: 9.26, durationBeats: 0.44, velocity: 0.84 },
        { id: 'ttc1-21', sectionId: 'sec-tt-chorus-1', midi: 69, startBeat: 9.7, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc1-22', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 10.25, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1-23', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 10.7, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc1-24', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 11.4, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc1-25', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 11.82, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc1-26', sectionId: 'sec-tt-chorus-1', midi: 84, startBeat: 12.24, durationBeats: 0.46, velocity: 0.94 },
        { id: 'ttc1-27', sectionId: 'sec-tt-chorus-1', midi: 83, startBeat: 12.7, durationBeats: 0.55, velocity: 0.92 },
        { id: 'ttc1-28', sectionId: 'sec-tt-chorus-1', midi: 84, startBeat: 13.25, durationBeats: 0.42, velocity: 0.94 },
        { id: 'ttc1-29', sectionId: 'sec-tt-chorus-1', midi: 83, startBeat: 13.67, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc1-30', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 14.09, durationBeats: 0.41, velocity: 0.88 },
        { id: 'ttc1-31', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 14.5, durationBeats: 0.95, velocity: 0.86 },
        { id: 'ttc1-32', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 16.0, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-33', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 16.4, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc1-34', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 16.8, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc1-35', sectionId: 'sec-tt-chorus-1', midi: 71, startBeat: 17.2, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttc1-36', sectionId: 'sec-tt-chorus-1', midi: 69, startBeat: 17.6, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc1-37', sectionId: 'sec-tt-chorus-1', midi: 72, startBeat: 18.15, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1-38', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 18.6, durationBeats: 0.75, velocity: 0.9 },
        { id: 'ttc1-39', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 19.55, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1-40', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 19.95, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc1-41', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 20.35, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-42', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 20.75, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc1-43', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 21.65, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1-44', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 22.05, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc1-45', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 22.45, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1-46', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 22.85, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc1-47', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 23.3, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc1-48', sectionId: 'sec-tt-chorus-1', midi: 67, startBeat: 24.0, durationBeats: 0.65, velocity: 0.84 },
        { id: 'ttc1-49', sectionId: 'sec-tt-chorus-1', midi: 69, startBeat: 24.65, durationBeats: 0.75, velocity: 0.86 },
        { id: 'ttc1-50', sectionId: 'sec-tt-chorus-1', midi: 76, startBeat: 25.4, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc1-51', sectionId: 'sec-tt-chorus-1', midi: 74, startBeat: 26.1, durationBeats: 0.75, velocity: 0.88 },
        { id: 'ttc1-52', sectionId: 'sec-tt-chorus-1', midi: 79, startBeat: 26.85, durationBeats: 0.75, velocity: 0.92 },
        { id: 'ttc1-53', sectionId: 'sec-tt-chorus-1', midi: 81, startBeat: 27.6, durationBeats: 3.4, velocity: 0.94 },

        // 5. Bridge (8 bars = 32 beats, locked 1:1 with chordSchedule)
        { id: 'ttb-1', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 0.0, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttb-2', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 0.55, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttb-3', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 1.1, durationBeats: 0.6, velocity: 0.88 },
        { id: 'ttb-4', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 1.7, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttb-5', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 2.4, durationBeats: 0.5, velocity: 0.86 },
        { id: 'ttb-6', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 2.9, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttb-7', sectionId: 'sec-tt-bridge', midi: 67, startBeat: 3.45, durationBeats: 0.65, velocity: 0.84 },
        { id: 'ttb-8', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 4.1, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttb-9', sectionId: 'sec-tt-bridge', midi: 67, startBeat: 4.65, durationBeats: 0.65, velocity: 0.82 },
        { id: 'ttb-10', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 5.3, durationBeats: 2.35, velocity: 0.88 },
        { id: 'ttb-11', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 8.0, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttb-12', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 8.55, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttb-13', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 9.1, durationBeats: 0.6, velocity: 0.88 },
        { id: 'ttb-14', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 9.7, durationBeats: 0.65, velocity: 0.9 },
        { id: 'ttb-15', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 10.35, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttb-16', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 10.9, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttb-17', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 11.45, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttb-18', sectionId: 'sec-tt-bridge', midi: 67, startBeat: 12.0, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttb-19', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 12.6, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttb-20', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 13.2, durationBeats: 2.4, velocity: 0.88 },
        { id: 'ttb-21', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 16.0, durationBeats: 0.55, velocity: 0.86 },
        { id: 'ttb-22', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 16.55, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttb-23', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 17.1, durationBeats: 0.6, velocity: 0.9 },
        { id: 'ttb-24', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 17.7, durationBeats: 0.7, velocity: 0.92 },
        { id: 'ttb-25', sectionId: 'sec-tt-bridge', midi: 76, startBeat: 18.4, durationBeats: 0.55, velocity: 0.94 },
        { id: 'ttb-26', sectionId: 'sec-tt-bridge', midi: 76, startBeat: 18.95, durationBeats: 0.55, velocity: 0.94 },
        { id: 'ttb-27', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 19.5, durationBeats: 0.65, velocity: 0.9 },
        { id: 'ttb-28', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 20.15, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttb-29', sectionId: 'sec-tt-bridge', midi: 71, startBeat: 20.7, durationBeats: 0.6, velocity: 0.86 },
        { id: 'ttb-30', sectionId: 'sec-tt-bridge', midi: 69, startBeat: 21.3, durationBeats: 2.4, velocity: 0.88 },
        { id: 'ttb-31', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 24.0, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttb-32', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 24.55, durationBeats: 0.65, velocity: 0.9 },
        { id: 'ttb-33', sectionId: 'sec-tt-bridge', midi: 76, startBeat: 25.2, durationBeats: 0.6, velocity: 0.92 },
        { id: 'ttb-34', sectionId: 'sec-tt-bridge', midi: 76, startBeat: 25.8, durationBeats: 0.6, velocity: 0.92 },
        { id: 'ttb-35', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 26.4, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttb-36', sectionId: 'sec-tt-bridge', midi: 72, startBeat: 27.05, durationBeats: 0.65, velocity: 0.86 },
        { id: 'ttb-37', sectionId: 'sec-tt-bridge', midi: 74, startBeat: 27.7, durationBeats: 0.65, velocity: 0.9 },
        { id: 'ttb-38', sectionId: 'sec-tt-bridge', midi: 73, startBeat: 28.35, durationBeats: 2.75, velocity: 0.88 },

        // 6. ĐK 2 (8 bars = 32 beats — ending on warm B4(71) -> C#5(73) Picardy cadence)
        { id: 'ttc2-1', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 0.0, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-2', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 0.4, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc2-3', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 0.8, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc2-4', sectionId: 'sec-tt-chorus-2', midi: 71, startBeat: 1.2, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttc2-5', sectionId: 'sec-tt-chorus-2', midi: 69, startBeat: 1.6, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc2-6', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 2.15, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2-7', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 2.6, durationBeats: 0.75, velocity: 0.9 },
        { id: 'ttc2-8', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 3.55, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2-9', sectionId: 'sec-tt-chorus-2', midi: 79, startBeat: 3.95, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc2-10', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 4.35, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-11', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 4.75, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc2-12', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 5.65, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2-13', sectionId: 'sec-tt-chorus-2', midi: 79, startBeat: 6.05, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc2-14', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 6.45, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-15', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 6.85, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc2-16', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 7.3, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc2-17', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 8.0, durationBeats: 0.42, velocity: 0.88 },
        { id: 'ttc2-18', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 8.42, durationBeats: 0.42, velocity: 0.86 },
        { id: 'ttc2-19', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 8.84, durationBeats: 0.42, velocity: 0.86 },
        { id: 'ttc2-20', sectionId: 'sec-tt-chorus-2', midi: 71, startBeat: 9.26, durationBeats: 0.44, velocity: 0.84 },
        { id: 'ttc2-21', sectionId: 'sec-tt-chorus-2', midi: 69, startBeat: 9.7, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc2-22', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 10.25, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2-23', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 10.7, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc2-24', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 11.4, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc2-25', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 11.82, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc2-26', sectionId: 'sec-tt-chorus-2', midi: 84, startBeat: 12.24, durationBeats: 0.46, velocity: 0.94 },
        { id: 'ttc2-27', sectionId: 'sec-tt-chorus-2', midi: 83, startBeat: 12.7, durationBeats: 0.55, velocity: 0.92 },
        { id: 'ttc2-28', sectionId: 'sec-tt-chorus-2', midi: 84, startBeat: 13.25, durationBeats: 0.42, velocity: 0.94 },
        { id: 'ttc2-29', sectionId: 'sec-tt-chorus-2', midi: 83, startBeat: 13.67, durationBeats: 0.42, velocity: 0.9 },
        { id: 'ttc2-30', sectionId: 'sec-tt-chorus-2', midi: 79, startBeat: 14.09, durationBeats: 0.41, velocity: 0.88 },
        { id: 'ttc2-31', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 14.5, durationBeats: 0.95, velocity: 0.86 },
        { id: 'ttc2-32', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 16.0, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-33', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 16.4, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc2-34', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 16.8, durationBeats: 0.4, velocity: 0.86 },
        { id: 'ttc2-35', sectionId: 'sec-tt-chorus-2', midi: 71, startBeat: 17.2, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttc2-36', sectionId: 'sec-tt-chorus-2', midi: 69, startBeat: 17.6, durationBeats: 0.55, velocity: 0.88 },
        { id: 'ttc2-37', sectionId: 'sec-tt-chorus-2', midi: 72, startBeat: 18.15, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2-38', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 18.6, durationBeats: 0.75, velocity: 0.9 },
        { id: 'ttc2-39', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 19.55, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2-40', sectionId: 'sec-tt-chorus-2', midi: 79, startBeat: 19.95, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc2-41', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 20.35, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-42', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 20.75, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc2-43', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 21.65, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2-44', sectionId: 'sec-tt-chorus-2', midi: 79, startBeat: 22.05, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc2-45', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 22.45, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2-46', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 22.85, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc2-47', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 23.3, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc2-48', sectionId: 'sec-tt-chorus-2', midi: 67, startBeat: 24.0, durationBeats: 0.65, velocity: 0.84 },
        { id: 'ttc2-49', sectionId: 'sec-tt-chorus-2', midi: 69, startBeat: 24.65, durationBeats: 0.75, velocity: 0.86 },
        { id: 'ttc2-50', sectionId: 'sec-tt-chorus-2', midi: 76, startBeat: 25.4, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc2-51', sectionId: 'sec-tt-chorus-2', midi: 74, startBeat: 26.1, durationBeats: 0.75, velocity: 0.88 },
        { id: 'ttc2-52', sectionId: 'sec-tt-chorus-2', midi: 71, startBeat: 26.85, durationBeats: 0.9, velocity: 0.88 },
        { id: 'ttc2-53', sectionId: 'sec-tt-chorus-2', midi: 73, startBeat: 27.75, durationBeats: 3.25, velocity: 0.9 },

        // 7. Outro (4 bars = 16 beats — "Để lại tháng tư mình anh [Fmaj7] [G] [Am]")
        { id: 'tto-1', sectionId: 'sec-tt-outro', midi: 67, startBeat: 0.0, durationBeats: 0.65, velocity: 0.82 },
        { id: 'tto-2', sectionId: 'sec-tt-outro', midi: 69, startBeat: 0.65, durationBeats: 0.75, velocity: 0.84 },
        { id: 'tto-3', sectionId: 'sec-tt-outro', midi: 76, startBeat: 1.4, durationBeats: 0.75, velocity: 0.88 },
        { id: 'tto-4', sectionId: 'sec-tt-outro', midi: 74, startBeat: 2.15, durationBeats: 0.75, velocity: 0.86 },
        { id: 'tto-5', sectionId: 'sec-tt-outro', midi: 71, startBeat: 2.9, durationBeats: 0.85, velocity: 0.84 },
        { id: 'tto-6', sectionId: 'sec-tt-outro', midi: 69, startBeat: 3.75, durationBeats: 3.75, velocity: 0.86 },
        { id: 'tto-7', sectionId: 'sec-tt-outro', midi: 76, startBeat: 8.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'tto-8', sectionId: 'sec-tt-outro', midi: 74, startBeat: 9.0, durationBeats: 1.0, velocity: 0.74 },
        { id: 'tto-9', sectionId: 'sec-tt-outro', midi: 72, startBeat: 10.0, durationBeats: 2.0, velocity: 0.72 },
        { id: 'tto-10', sectionId: 'sec-tt-outro', midi: 69, startBeat: 12.0, durationBeats: 4.0, velocity: 0.76 },
      ],
    },
    {
      id: 'draft-mua-ban-cong',
      title: 'Mưa Ban Công (Lo-fi Demo)',
      keyRoot: 'C',
      scaleMode: 'major',
      mood: 'lofi-chill',
      bpm: 84,
      backingInstrument: 'rhodes',
      backingPattern: 'rich-block',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'lofi',
      melodyInstrument: 'piano',
      scaleSnap: true,
      updatedAt: now - 30_000,
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
        // Intro lo-fi chill rhodes motif
        { id: 'mi1', sectionId: 'sec-intro-1', midi: 72, startBeat: 0, durationBeats: 1.5, velocity: 0.7 },
        { id: 'mi2', sectionId: 'sec-intro-1', midi: 76, startBeat: 1.5, durationBeats: 0.5, velocity: 0.65 },
        { id: 'mi3', sectionId: 'sec-intro-1', midi: 74, startBeat: 2, durationBeats: 2, velocity: 0.72 },
        { id: 'mi4', sectionId: 'sec-intro-1', midi: 69, startBeat: 4, durationBeats: 1.5, velocity: 0.7 },
        { id: 'mi5', sectionId: 'sec-intro-1', midi: 72, startBeat: 5.5, durationBeats: 2.5, velocity: 0.68 },
        { id: 'mi6', sectionId: 'sec-intro-1', midi: 74, startBeat: 8, durationBeats: 1.5, velocity: 0.72 },
        { id: 'mi7', sectionId: 'sec-intro-1', midi: 72, startBeat: 9.5, durationBeats: 0.5, velocity: 0.66 },
        { id: 'mi8', sectionId: 'sec-intro-1', midi: 71, startBeat: 10, durationBeats: 2, velocity: 0.7 },
        { id: 'mi9', sectionId: 'sec-intro-1', midi: 69, startBeat: 12, durationBeats: 3, velocity: 0.68 },
        // Verse lo-fi chill motif
        { id: 'mv1', sectionId: 'sec-verse-1', midi: 72, startBeat: 0, durationBeats: 1, velocity: 0.74 },
        { id: 'mv2', sectionId: 'sec-verse-1', midi: 71, startBeat: 1, durationBeats: 1, velocity: 0.7 },
        { id: 'mv3', sectionId: 'sec-verse-1', midi: 69, startBeat: 2, durationBeats: 2, velocity: 0.76 },
        { id: 'mv4', sectionId: 'sec-verse-1', midi: 67, startBeat: 4, durationBeats: 1.5, velocity: 0.72 },
        { id: 'mv5', sectionId: 'sec-verse-1', midi: 69, startBeat: 5.5, durationBeats: 0.5, velocity: 0.68 },
        { id: 'mv6', sectionId: 'sec-verse-1', midi: 72, startBeat: 6, durationBeats: 2, velocity: 0.76 },
        { id: 'mv7', sectionId: 'sec-verse-1', midi: 74, startBeat: 8, durationBeats: 1.5, velocity: 0.74 },
        { id: 'mv8', sectionId: 'sec-verse-1', midi: 72, startBeat: 9.5, durationBeats: 0.5, velocity: 0.7 },
        { id: 'mv9', sectionId: 'sec-verse-1', midi: 71, startBeat: 10, durationBeats: 2, velocity: 0.74 },
        { id: 'mv10', sectionId: 'sec-verse-1', midi: 69, startBeat: 12, durationBeats: 3, velocity: 0.72 },
        // Chorus
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
      backingPattern: 'pop-comp',
      sustainPedal: true,
      metronomeEnabled: false,
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
    bpm: 76,
    backingInstrument: 'piano-ballad',
    backingPattern: 'auto-song',
    sustainPedal: true,
    metronomeEnabled: false,
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

export function createMidnightCafeLofiTrack(updatedAt = Date.now() - 90_000): SketchpadDraft {
  const secId = 'sec-lofi-cafe-1';
  const melody: MelodyNote[] = [
    { id: 'lf-1', sectionId: secId, midi: 69, startBeat: 0.5, durationBeats: 1.5, velocity: 0.65 },
    { id: 'lf-2', sectionId: secId, midi: 72, startBeat: 2.5, durationBeats: 1.0, velocity: 0.62 },
    { id: 'lf-3', sectionId: secId, midi: 71, startBeat: 4.0, durationBeats: 2.0, velocity: 0.66 },
    { id: 'lf-4', sectionId: secId, midi: 67, startBeat: 6.5, durationBeats: 1.5, velocity: 0.6 },
    { id: 'lf-5', sectionId: secId, midi: 69, startBeat: 8.5, durationBeats: 1.5, velocity: 0.64 },
    { id: 'lf-6', sectionId: secId, midi: 64, startBeat: 10.5, durationBeats: 1.5, velocity: 0.58 },
    { id: 'lf-7', sectionId: secId, midi: 67, startBeat: 12.0, durationBeats: 2.5, velocity: 0.62 },
    { id: 'lf-8', sectionId: secId, midi: 62, startBeat: 14.5, durationBeats: 1.5, velocity: 0.56 },
  ];
  return {
    id: 'lofi-midnight-cafe',
    title: 'Cà Phê Đêm 2AM (Lo-fi Rhodes)',
    keyRoot: 'C',
    scaleMode: 'major',
    mood: 'lofi-chill',
    bpm: 74,
    backingInstrument: 'rhodes',
    backingPattern: 'rich-block',
    sustainPedal: true,
    metronomeEnabled: false,
    drumPattern: 'lofi',
    melodyInstrument: 'piano',
    scaleSnap: true,
    sections: [
      {
        id: secId,
        kind: 'Verse',
        label: 'Lo-fi Chill Loop',
        bars: 4,
        text: '[Fmaj9]Hơi ấm tách cà phê [Em7]đêm khuya\n[Dm9]Ánh đèn vàng nhẹ rơi [Cmaj9]bên hiên',
      },
    ],
    melodyNotes: melody,
    updatedAt,
  };
}

export function getDraftStyleLabel(draft: SketchpadDraft): string {
  if (draft.backingInstrument === 'piano-ballad' && draft.drumPattern === 'none') {
    return 'Grand Piano';
  }
  switch (draft.mood) {
    case 'lofi-chill':
      return 'Lo-fi Chill';
    case 'neo-soul':
      return 'Neo-Soul';
    case 'rnb':
      return 'R&B';
    case 'acoustic':
      return 'Acoustic';
    case 'pop-ballad':
    default:
      return 'Ballad';
  }
}

const STARTER_PLAYLIST_PRIORITY: Record<string, number> = {
  'draft-thang-tu-la-loi-noi-doi-cua-em': 6,
  'draft-khoang-cach-hai-ta-am': 5,
  'draft-dem-pho-mua-piano': 4,
  'draft-mua-ban-cong': 3,
  'draft-anh-den-do-thi': 2,
  'lofi-midnight-cafe': 1,
};

export function buildProfilePlaylist(studioDrafts?: SketchpadDraft[]): SketchpadDraft[] {
  const starters = createStarterDrafts();
  const merged = new Map<string, SketchpadDraft>();

  for (const starter of starters) {
    merged.set(starter.id, starter);
  }
  if (Array.isArray(studioDrafts)) {
    for (const draft of studioDrafts) {
      if (draft && draft.id && Array.isArray(draft.sections) && draft.sections.length > 0) {
        merged.set(draft.id, draft);
      }
    }
  }
  if (!merged.has('lofi-midnight-cafe')) {
    const oldestUpdated = Array.from(merged.values()).reduce(
      (min, item) => Math.min(min, item.updatedAt || Date.now()),
      Date.now()
    );
    merged.set('lofi-midnight-cafe', createMidnightCafeLofiTrack(oldestUpdated - 30_000));
  }

  return Array.from(merged.values())
    .filter((d) => Array.isArray(d.sections) && d.sections.length > 0)
    .sort((a, b) => {
      const timeDiff = (b.updatedAt || 0) - (a.updatedAt || 0);
      if (Math.abs(timeDiff) > 500) {
        return timeDiff;
      }
      const priA = STARTER_PLAYLIST_PRIORITY[a.id] ?? 0;
      const priB = STARTER_PLAYLIST_PRIORITY[b.id] ?? 0;
      return priB - priA;
    });
}

