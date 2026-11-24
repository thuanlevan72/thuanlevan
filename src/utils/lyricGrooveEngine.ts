import { Chord, Interval, Note, Scale } from 'tonal';

export type MoodStyleId =
  | 'pop-ballad'
  | 'neo-soul'
  | 'lofi-chill'
  | 'rnb'
  | 'acoustic';

export type BackingInstrumentId = 'rhodes' | 'guitar-strum' | 'piano-ballad';
export type TimeSignatureId = '4/4' | '2/4' | '3/4' | '6/8';

export type CoreArpeggioPatternId =
  | 'arp-ballad-1'
  | 'arp-ballad-2'
  | 'arp-ballad-3'
  | 'arp-country-folk'
  | 'arp-ballad-drive'
  | 'arp-percussive-slap'
  | 'arp-valse-even'
  | 'arp-valse-boom-chat'
  | 'arp-slow-rock-68'
  | 'arp-bossa-funky';

export type ConcreteArpeggioPatternId =
  | CoreArpeggioPatternId
  | 'ballad-wave'
  | 'lofi-broken'
  | 'rising-arp'
  | 'falling-arp'
  | 'pinch-plucked'
  | 'rich-block'
  | 'pop-comp';
export type ArpeggioPatternId = 'auto-song' | ConcreteArpeggioPatternId;
export type BackingPatternId = 'ballad-arpeggio' | ArpeggioPatternId;

export type RhythmStyle20Id =
  | 'pop-ballad-44'
  | 'ballad-24'
  | 'slow-ballad-44'
  | 'slow-surf-44'
  | 'blue-44'
  | 'fox-24'
  | 'march-24'
  | 'bolero-44'
  | 'rumba-44'
  | 'habenera-44'
  | 'tango-44'
  | 'bossa-nova-44'
  | 'disco-44'
  | 'pop-rock-44'
  | 'funk-44'
  | 'reggae-44'
  | 'chachacha-44'
  | 'twist-44'
  | 'valse-34'
  | 'boston-34'
  | 'slow-rock-68';

export type DrumPatternId = 'none' | 'lofi' | 'boombap' | 'ballad' | RhythmStyle20Id;
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

export type MelodyPlaybackMode = 'all' | 'intro-only' | 'off';

export interface SketchpadDraft {
  id: string;
  title: string;
  keyRoot: string;
  scaleMode: 'major' | 'minor';
  timeSignature?: TimeSignatureId;
  mood: MoodStyleId;
  bpm: number;
  backingInstrument: BackingInstrumentId;
  backingPattern?: BackingPatternId;
  chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
  sustainPedal?: boolean;
  metronomeEnabled?: boolean;
  drumPattern: DrumPatternId;
  melodyInstrument: MelodyInstrumentId;
  melodyMuted?: boolean;
  melodyPlaybackMode?: MelodyPlaybackMode;
  mutedMelodySectionIds?: string[];
  scaleSnap: boolean;
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  updatedAt: number;
}

export function resolveBeatsPerBar(timeSignature?: TimeSignatureId | null): number {
  switch (timeSignature) {
    case '2/4':
      return 2;
    case '3/4':
    case '6/8':
      return 3;
    case '4/4':
    default:
      return 4;
  }
}

export function resolveMelodyPlaybackMode(
  draft: Pick<SketchpadDraft, 'melodyPlaybackMode' | 'melodyMuted'>
): MelodyPlaybackMode {
  if (
    draft.melodyPlaybackMode === 'all' ||
    draft.melodyPlaybackMode === 'intro-only' ||
    draft.melodyPlaybackMode === 'off'
  ) {
    return draft.melodyPlaybackMode;
  }
  return draft.melodyMuted ? 'intro-only' : 'all';
}

export function isSectionMelodyMuted(
  section: Pick<SongSection, 'id' | 'kind'>,
  mode: MelodyPlaybackMode,
  mutedSectionIds?: string[]
): boolean {
  if (mode === 'off') return true;
  if (Array.isArray(mutedSectionIds) && mutedSectionIds.includes(section.id)) {
    return true;
  }
  if (
    mode === 'intro-only' &&
    section.kind !== 'Intro' &&
    section.kind !== 'Interlude'
  ) {
    return true;
  }
  return false;
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

export interface ArpeggioPatternMetaItem {
  id: ConcreteArpeggioPatternId;
  order?: number;
  group: 'Nhóm 4/4' | 'Nhóm 3/4 & 6/8' | 'Studio mở rộng';
  recommendedMeter?: TimeSignatureId;
  formula: string;
  shortLabel: string;
  label: string;
  desc: string;
  isCore: boolean;
}

export const ARPEGGIO_PATTERN_META: ArpeggioPatternMetaItem[] = [
  // 10 kiểu rải hợp âm cốt lõi — Nhóm 4/4 (6 kiểu)
  {
    id: 'arp-ballad-1',
    order: 1,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B - 3 - 2 - 1',
    shortLabel: 'Ballad 1',
    label: '1. Rải xuôi cơ bản (Ballad 1)',
    desc: 'B - 3 - 2 - 1 · 4 nốt đen chậm rãi, dùng cho đoạn mở đầu sâu lắng',
    isCore: true,
  },
  {
    id: 'arp-ballad-2',
    order: 2,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B - 3 - 2 - 3 - 1 - 3 - 2 - 3',
    shortLabel: 'Ballad 2',
    label: '2. Rải tiến – lùi (Ballad 2 / V-Pop)',
    desc: 'B - 3 - 2 - 3 - 1 - 3 - 2 - 3 · 8 nốt móc đơn quốc dân cho hầu hết nhạc trẻ ballad',
    isCore: true,
  },
  {
    id: 'arp-ballad-3',
    order: 3,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B - 3 - (2+1) - 3 - (2+1) - 3',
    shortLabel: 'Ballad 3',
    label: '3. Rải chập dây (Ballad 3)',
    desc: 'B - 3 - (2+1) - 3 - (2+1) - 3 · Móc cùng lúc dây 1 & 2 tạo độ dày ấm',
    isCore: true,
  },
  {
    id: 'arp-country-folk',
    order: 4,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B1 - (3+2+1) - B2 - (3+2+1)',
    shortLabel: 'Country/Folk',
    label: '4. Rải tách bass – chập nhịp (Country / Folk)',
    desc: 'B1 - (3+2+1) - B2 - (3+2+1) · Đánh luân phiên 2 nốt bass xen kẽ chập hợp âm',
    isCore: true,
  },
  {
    id: 'arp-ballad-drive',
    order: 5,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B - 3 - 2 - 1 - 2 - 3 - 2 - 1',
    shortLabel: 'Móc kép dồn',
    label: '5. Rải móc kép dồn (Ballad cao trào)',
    desc: 'B - 3 - 2 - 1 - 2 - 3 - 2 - 1 · Tiết tấu nhanh, dày tiếng trước khi vào điệp khúc',
    isCore: true,
  },
  {
    id: 'arp-percussive-slap',
    order: 6,
    group: 'Nhóm 4/4',
    recommendedMeter: '4/4',
    formula: 'B - 3 - 2 - [Đập] - 3 - 2 - 1 - [Đập]',
    shortLabel: 'Đập thùng',
    label: '6. Rải kết hợp đập thùng (Percussive / Slap)',
    desc: 'B - 3 - 2 - [Đập] - 3 - 2 - 1 - [Đập] · Tạo tiếng trống giả nhịp 2 & 4 ngay trên đàn',
    isCore: true,
  },
  // 10 kiểu rải hợp âm cốt lõi — Nhóm 3/4 & 6/8 (4 kiểu)
  {
    id: 'arp-valse-even',
    order: 7,
    group: 'Nhóm 3/4 & 6/8',
    recommendedMeter: '3/4',
    formula: 'B - 3 - 2 - 1 - 2 - 3',
    shortLabel: 'Valse 3 đều',
    label: '7. Rải 3 phách đều (Valse / Boston chậm)',
    desc: 'B - 3 - 2 - 1 - 2 - 3 · 6 nốt móc đơn đều nhau cho nhịp 3/4 trữ tình',
    isCore: true,
  },
  {
    id: 'arp-valse-boom-chat',
    order: 8,
    group: 'Nhóm 3/4 & 6/8',
    recommendedMeter: '3/4',
    formula: 'B - (3+2+1) - (3+2+1)',
    shortLabel: 'Bùm-Chát-Chát',
    label: '8. Rải Valse truyền thống (Bùm - Chát - Chát)',
    desc: 'B - (3+2+1) - (3+2+1) · 1 phách trầm ấm, 2 phách cao nhẹ bay bổng',
    isCore: true,
  },
  {
    id: 'arp-slow-rock-68',
    order: 9,
    group: 'Nhóm 3/4 & 6/8',
    recommendedMeter: '6/8',
    formula: 'B - 3 - 2 - 1 - 2 - 3 (6/8)',
    shortLabel: 'Slow Rock 6/8',
    label: '9. Rải Slow Rock chuẩn (nhịp 6/8)',
    desc: 'B - 3 - 2 - 1 - 2 - 3 · Nhấn mạnh vào phách 1 và phách 4 dập dìu',
    isCore: true,
  },
  {
    id: 'arp-bossa-funky',
    order: 10,
    group: 'Nhóm 3/4 & 6/8',
    recommendedMeter: '4/4',
    formula: 'Đảo phách · Ngắt tiếng (Mute)',
    shortLabel: 'Đảo phách',
    label: '10. Rải đảo phách / ngắt tiếng (Bossa / Funky)',
    desc: 'Rải nốt xen kẽ ngắt tiếng (staccato/mute), tạo độ nảy và groove phóng khoáng',
    isCore: true,
  },
  // Kiểu rải Piano / Studio mở rộng (tương thích ngược)
  {
    id: 'ballad-wave',
    group: 'Studio mở rộng',
    formula: '1 - 5 - 8 - 10',
    shortLabel: 'Sóng 1-5-8',
    label: 'Rải Sóng Ballad (1-5-8-10)',
    desc: 'Tay trái rải Bass–5–8, tay phải buông giai điệu đệm mượt',
    isCore: false,
  },
  {
    id: 'lofi-broken',
    group: 'Studio mở rộng',
    formula: 'Bass · Trì hoãn',
    shortLabel: 'Rải Lofi',
    label: 'Rải Lofi Trì Hoãn (Đan xen)',
    desc: 'Bass trầm ấm kết hợp nốt đệm rải nhẹ có khoảng nghỉ lofi',
    isCore: false,
  },
  {
    id: 'rising-arp',
    group: 'Studio mở rộng',
    formula: 'Bass → Ngọn',
    shortLabel: 'Móc lên',
    label: 'Rải Móc Lên (Bass → Ngọn)',
    desc: 'Đánh nối tiếp từng nốt từ trầm lên cao kiểu đàn dây / piano mở đầu',
    isCore: false,
  },
  {
    id: 'falling-arp',
    group: 'Studio mở rộng',
    formula: 'Cao → Trầm',
    shortLabel: 'Buông xuống',
    label: 'Rải Buông Xuống (Cao → Trầm)',
    desc: 'Ngân nốt cao sáng rồi rải rơi dần xuống giữ độ sâu lắng',
    isCore: false,
  },
  {
    id: 'pinch-plucked',
    group: 'Studio mở rộng',
    formula: 'Bass + Đôi',
    shortLabel: 'Móc đôi',
    label: 'Móc Đôi Acoustic (Bass + Đôi)',
    desc: 'Móc đồng thời bass + nốt cao ở phách mạnh, xen kẽ nốt giữa nhịp',
    isCore: false,
  },
  {
    id: 'rich-block',
    group: 'Studio mở rộng',
    formula: 'Chặn 2 tay',
    shortLabel: 'Dày 2 tay',
    label: 'Chặn Hợp Âm Dày (2 Tay)',
    desc: 'Bấm trọn khối hợp âm mở rộng, giàu lực cho điệp khúc cao trào',
    isCore: false,
  },
  {
    id: 'pop-comp',
    group: 'Studio mở rộng',
    formula: 'Chập Pop/R&B',
    shortLabel: 'Pop/R&B',
    label: 'Nhấn Nhịp Pop/R&B',
    desc: 'Đệm chập nhịp hiện đại, giữ groove chắc và có độ nảy',
    isCore: false,
  },
];

export interface RhythmStyleMetaItem {
  id: RhythmStyle20Id;
  order: number;
  group:
    | 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ'
    | 'Nhóm 2 · Nhạc Bolero & Nhạc xưa'
    | 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh'
    | 'Nhóm 4 · Nhạc 3 phách & 6 phách';
  label: string;
  meter: TimeSignatureId;
  characteristic: string;
  genres: string;
  recommendedBpm: number;
  recommendedArp: ConcreteArpeggioPatternId;
}

export const RHYTHM_STYLE_META: RhythmStyleMetaItem[] = [
  // Nhóm 1: Nhạc nhẹ, Trữ tình & Nhạc trẻ
  {
    id: 'pop-ballad-44',
    order: 1,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '1. Ballad (Pop Ballad)',
    meter: '4/4',
    characteristic: 'Êm ái, tự sự, dễ biến tấu rải hoặc quạt',
    genres: 'Nhạc trẻ V-Pop, US-UK trữ tình',
    recommendedBpm: 74,
    recommendedArp: 'arp-ballad-2',
  },
  {
    id: 'ballad-24',
    order: 2,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '1B. Ballad 2/4',
    meter: '2/4',
    characteristic: 'Ballad nhịp 2/4 êm ái, dìu dặt (Bùm - Chát - lơi nhẹ)',
    genres: 'Ballad V-Pop 2/4, Tháng Tư Là Lời Nói Dối Của Em',
    recommendedBpm: 72,
    recommendedArp: 'arp-ballad-2',
  },
  {
    id: 'slow-ballad-44',
    order: 2,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '2. Slow (Slow Ballad)',
    meter: '4/4',
    characteristic: 'Rất chậm, thưa nốt, dàn trải sâu lắng',
    genres: 'Nhạc tình ca buồn, tiền chiến chậm',
    recommendedBpm: 62,
    recommendedArp: 'arp-ballad-1',
  },
  {
    id: 'slow-surf-44',
    order: 3,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '3. Surf (Slow Surf)',
    meter: '4/4',
    characteristic: 'Đánh móc đơn đều (8 phách nhỏ), nhẹ nhàng',
    genres: 'Nhạc Trịnh, nhạc xưa êm dịu',
    recommendedBpm: 78,
    recommendedArp: 'arp-ballad-2',
  },
  {
    id: 'blue-44',
    order: 4,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '4. Blue',
    meter: '4/4',
    characteristic: 'Có độ luyến láy swing, nhấn vào phách 2 và 4',
    genres: 'Nhạc trữ tình sâu lắng, Jazz nhẹ',
    recommendedBpm: 76,
    recommendedArp: 'arp-ballad-3',
  },
  {
    id: 'fox-24',
    order: 5,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '5. Fox',
    meter: '2/4',
    characteristic: 'Nhịp đi đều 2 phách (Bùm - Chát)',
    genres: 'Nhạc thiếu nhi, nhạc vui tươi đơn giản',
    recommendedBpm: 108,
    recommendedArp: 'arp-country-folk',
  },
  {
    id: 'march-24',
    order: 6,
    group: 'Nhóm 1 · Nhạc nhẹ, Trữ tình & Nhạc trẻ',
    label: '6. March (Hành khúc)',
    meter: '2/4',
    characteristic: 'Mạnh mẽ, dứt khoát, rộn ràng',
    genres: 'Nhạc cách mạng, cổ động',
    recommendedBpm: 116,
    recommendedArp: 'arp-country-folk',
  },
  // Nhóm 2: Nhạc Bolero & Nhạc xưa
  {
    id: 'bolero-44',
    order: 7,
    group: 'Nhóm 2 · Nhạc Bolero & Nhạc xưa',
    label: '7. Bolero',
    meter: '4/4',
    characteristic: 'Tiết tấu đặc trưng "Bùm - chát - bùm - bùm - chát"',
    genres: 'Nhạc vàng, Bolero trữ tình',
    recommendedBpm: 74,
    recommendedArp: 'arp-ballad-3',
  },
  {
    id: 'rumba-44',
    order: 8,
    group: 'Nhóm 2 · Nhạc Bolero & Nhạc xưa',
    label: '8. Rumba',
    meter: '4/4',
    characteristic: 'Tương tự Bolero nhưng nhấn phách mềm và lơi hơn',
    genres: 'Nhạc trữ tình, nhạc Pháp lời Việt',
    recommendedBpm: 82,
    recommendedArp: 'arp-ballad-3',
  },
  {
    id: 'habenera-44',
    order: 9,
    group: 'Nhóm 2 · Nhạc Bolero & Nhạc xưa',
    label: '9. Habenera',
    meter: '4/4',
    characteristic: 'Nốt bass chấm dôi tạo cảm giác lả lướt (3+3+2)',
    genres: 'Nhạc cổ điển, trữ tình sang trọng',
    recommendedBpm: 84,
    recommendedArp: 'arp-bossa-funky',
  },
  {
    id: 'tango-44',
    order: 10,
    group: 'Nhóm 2 · Nhạc Bolero & Nhạc xưa',
    label: '10. Tango',
    meter: '4/4',
    characteristic: 'Dứt khoát, ngắt tiếng đột ngột, kịch tính',
    genres: 'Nhạc xưa, nhạc khiêu vũ cổ điển',
    recommendedBpm: 112,
    recommendedArp: 'arp-bossa-funky',
  },
  {
    id: 'bossa-nova-44',
    order: 11,
    group: 'Nhóm 2 · Nhạc Bolero & Nhạc xưa',
    label: '11. Bossa Nova',
    meter: '4/4',
    characteristic: 'Đảo phách tinh tế, thư giãn, phóng khoáng',
    genres: 'Nhạc chill, Acoustic quán cà phê',
    recommendedBpm: 94,
    recommendedArp: 'arp-bossa-funky',
  },
  // Nhóm 3: Nhạc sôi động, Tiết tấu nhanh
  {
    id: 'disco-44',
    order: 12,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '12. Disco',
    meter: '4/4',
    characteristic: 'Sôi động, kick 4/4 đều tay, mở hi-hat phách và',
    genres: 'Nhạc dance, pop sôi động, remix',
    recommendedBpm: 120,
    recommendedArp: 'pop-comp',
  },
  {
    id: 'pop-rock-44',
    order: 13,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '13. Pop Rock',
    meter: '4/4',
    characteristic: 'Trống chắc khỏe, snare dồn phách 2 & 4, quạt dày',
    genres: 'Pop Rock, Rock Ballad sôi nổi',
    recommendedBpm: 114,
    recommendedArp: 'arp-ballad-drive',
  },
  {
    id: 'funk-44',
    order: 14,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '14. Funk / Funky',
    meter: '4/4',
    characteristic: 'Nhấn móc kép đảo phách, ngắt tiếng nảy giàu năng lượng',
    genres: 'Funk Pop, Nu-Disco, R&B Groove',
    recommendedBpm: 106,
    recommendedArp: 'arp-bossa-funky',
  },
  {
    id: 'reggae-44',
    order: 15,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '15. Reggae',
    meter: '4/4',
    characteristic: 'Đánh nghịch phách (phách và), trống one-drop phách 3',
    genres: 'Reggae chill, Acoustic biển đảo',
    recommendedBpm: 88,
    recommendedArp: 'arp-bossa-funky',
  },
  {
    id: 'chachacha-44',
    order: 16,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '16. Cha-cha-cha',
    meter: '4/4',
    characteristic: 'Nhịp Latin 1 - 2 - 3 - cha-cha-1 rộn rã',
    genres: 'Nhạc khiêu vũ Latin, nhạc xuân sôi nổi',
    recommendedBpm: 116,
    recommendedArp: 'arp-percussive-slap',
  },
  {
    id: 'twist-44',
    order: 17,
    group: 'Nhóm 3 · Nhạc sôi động, Tiết tấu nhanh',
    label: '17. Twist / Rock & Roll',
    meter: '4/4',
    characteristic: 'Sôi động cổ điển, nhấn snare 2 & 4 + 8th cuốn hút',
    genres: 'Rock & Roll, nhạc retro thập niên 60-70',
    recommendedBpm: 132,
    recommendedArp: 'arp-country-folk',
  },
  // Nhóm 4: Nhạc 3 phách & 6 phách
  {
    id: 'valse-34',
    order: 18,
    group: 'Nhóm 4 · Nhạc 3 phách & 6 phách',
    label: '18. Valse (Waltz)',
    meter: '3/4',
    characteristic: 'Nhịp 3/4 "Bùm - Chát - Chát" nhẹ nhàng bay bổng',
    genres: 'Nhạc trữ tình 3/4, khiêu vũ cổ điển',
    recommendedBpm: 92,
    recommendedArp: 'arp-valse-boom-chat',
  },
  {
    id: 'boston-34',
    order: 19,
    group: 'Nhóm 4 · Nhạc 3 phách & 6 phách',
    label: '19. Boston',
    meter: '3/4',
    characteristic: 'Valse chậm trữ tình, thưa và sâu lắng',
    genres: 'Tình ca 3/4 chậm, nhạc tiền chiến',
    recommendedBpm: 72,
    recommendedArp: 'arp-valse-even',
  },
  {
    id: 'slow-rock-68',
    order: 20,
    group: 'Nhóm 4 · Nhạc 3 phách & 6 phách',
    label: '20. Slow Rock',
    meter: '6/8',
    characteristic: 'Nhịp 6/8 dập dìu 6 phách, nhấn phách 1 và phách 4',
    genres: 'Slow Rock Việt, Ballad 6/8 cổ điển',
    recommendedBpm: 68,
    recommendedArp: 'arp-slow-rock-68',
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
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export function normalizeKeyRoot(rawKey: string): string {
  const trimmed = rawKey.trim();
  const direct = KEY_ROOT_OPTIONS.find((k) => k === trimmed);
  if (direct) return direct;
  const chroma = Note.chroma(trimmed);
  if (typeof chroma === 'number') {
    return KEY_ROOT_OPTIONS[chroma] ?? 'C';
  }
  return 'C';
}

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

export function analyzeSectionLyrics(
  section: SongSection,
  beatsPerBar = 4
): {
  lines: AnalyzedLyricLine[];
  rhymeFamilies: RhymeFamilySummary[];
  totalChords: number;
  totalSyllables: number;
} {
  const rawLines = section.text.split(/\r?\n/);
  const beatsPerLine = Math.max(
    2,
    (section.bars * beatsPerBar) /
      Math.max(1, rawLines.filter((l) => l.trim().length > 0).length)
  );

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
export function parseSectionKaraokeLines(
  section: SongSection,
  beatsPerBar = 4
): KaraokeLine[] {
  const rawLines = section.text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];
  const sectionBeats = section.bars * beatsPerBar;
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

export interface SynchronizedLyricWord {
  text: string;
  chordSymbol: string | null;
  sectionId: string;
  lineIndex: number;
  segIndex: number;
  wordIndex: number;
  startBeat: number;
  endBeat: number;
  absStart: number;
  absEnd: number;
}

/**
 * Aligns every Vietnamese word/syllable inside a section directly onto its MelodyNote beat slots
 * within each [Chord] segment so Audio, Chords, Piano Roll, and Timeline Lyrics stay 100% locked.
 */
export function alignSectionLyricsToMelody(
  section: SongSection,
  sectionMelodyNotes: MelodyNote[],
  sectionAbsStartBeat = 0,
  beatsPerBar = 4
): SynchronizedLyricWord[] {
  const karaokeLines = parseSectionKaraokeLines(section, beatsPerBar);
  if (karaokeLines.length === 0) return [];

  const sortedNotes = [...sectionMelodyNotes]
    .filter((n) => n.sectionId === section.id)
    .sort((a, b) => a.startBeat - b.startBeat);

  const sectionLimit = section.bars * beatsPerBar;
  const wordsOut: SynchronizedLyricWord[] = [];

  karaokeLines.forEach((line) => {
    line.segments.forEach((seg, segIndex) => {
      const tokens = seg.lyricText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      if (tokens.length === 0) return;

      const segStart = Math.max(0, Math.min(sectionLimit, seg.startBeat));
      const segEnd = Math.max(segStart + 0.25, Math.min(sectionLimit, seg.endBeat));
      const notesInSeg = sortedNotes.filter(
        (n) => n.startBeat >= segStart - 0.15 && n.startBeat < segEnd - 0.04
      );

      // Pure descriptive parenthetical cues like "(Dạo: Chủ đề điệp khúc)" stay intact on segment start
      const isCueLabel =
        seg.lyricText.trim().startsWith('(') && seg.lyricText.trim().includes(')');
      if (isCueLabel) {
        const startBeat = notesInSeg[0]?.startBeat ?? segStart;
        wordsOut.push({
          text: seg.lyricText.trim(),
          chordSymbol: seg.chordSymbol,
          sectionId: section.id,
          lineIndex: line.lineIndex,
          segIndex,
          wordIndex: 0,
          startBeat,
          endBeat: segEnd,
          absStart: sectionAbsStartBeat + startBeat,
          absEnd: sectionAbsStartBeat + segEnd,
        });
        return;
      }

      if (notesInSeg.length > 0) {
        for (let wIdx = 0; wIdx < tokens.length; wIdx++) {
          const mappedIdx =
            tokens.length === 1
              ? 0
              : notesInSeg.length === tokens.length
              ? wIdx
              : Math.min(
                  notesInSeg.length - 1,
                  Math.floor((wIdx * notesInSeg.length) / tokens.length)
                );
          const anchorNote = notesInSeg[mappedIdx];
          const nextMappedIdx =
            wIdx + 1 < tokens.length
              ? notesInSeg.length === tokens.length
                ? wIdx + 1
                : Math.min(
                    notesInSeg.length - 1,
                    Math.floor(((wIdx + 1) * notesInSeg.length) / tokens.length)
                  )
              : -1;

          let wStart = anchorNote.startBeat;
          if (wIdx > 0 && wordsOut.length > 0) {
            const prevSameSeg = wordsOut[wordsOut.length - 1];
            if (
              prevSameSeg.sectionId === section.id &&
              prevSameSeg.lineIndex === line.lineIndex &&
              prevSameSeg.segIndex === segIndex &&
              wStart <= prevSameSeg.startBeat + 0.05
            ) {
              // Spread evenly within remaining slot when multiple words share 1 sustained note
              const remainingSpan = Math.max(0.25, segEnd - prevSameSeg.startBeat);
              const remainingWords = tokens.length - wIdx + 1;
              wStart = prevSameSeg.startBeat + remainingSpan / remainingWords;
              prevSameSeg.endBeat = wStart;
              prevSameSeg.absEnd = sectionAbsStartBeat + wStart;
            }
          }

          const rawEnd =
            nextMappedIdx >= 0 && notesInSeg[nextMappedIdx].startBeat > wStart + 0.05
              ? notesInSeg[nextMappedIdx].startBeat
              : Math.min(segEnd, Math.max(wStart + 0.25, anchorNote.startBeat + anchorNote.durationBeats));

          wordsOut.push({
            text: tokens[wIdx],
            chordSymbol: wIdx === 0 ? seg.chordSymbol : null,
            sectionId: section.id,
            lineIndex: line.lineIndex,
            segIndex,
            wordIndex: wIdx,
            startBeat: wStart,
            endBeat: Math.max(wStart + 0.15, rawEnd),
            absStart: sectionAbsStartBeat + wStart,
            absEnd: sectionAbsStartBeat + Math.max(wStart + 0.15, rawEnd),
          });
        }
      } else {
        const span = Math.max(0.25, segEnd - segStart);
        const step = span / tokens.length;
        tokens.forEach((word, wIdx) => {
          const wStart = segStart + wIdx * step;
          const wEnd = wStart + step;
          wordsOut.push({
            text: word,
            chordSymbol: wIdx === 0 ? seg.chordSymbol : null,
            sectionId: section.id,
            lineIndex: line.lineIndex,
            segIndex,
            wordIndex: wIdx,
            startBeat: wStart,
            endBeat: wEnd,
            absStart: sectionAbsStartBeat + wStart,
            absEnd: sectionAbsStartBeat + wEnd,
          });
        });
      }
    });
  });

  return wordsOut;
}

/**
 * Builds song-wide word/syllable events locked to melody notes across all ordered sections.
 */
export function buildSynchronizedLyricEvents(
  sections: SongSection[],
  melodyNotes: MelodyNote[],
  beatsPerBar = 4
): SynchronizedLyricWord[] {
  const allWords: SynchronizedLyricWord[] = [];
  let cursor = 0;
  sections.forEach((sec) => {
    allWords.push(...alignSectionLyricsToMelody(sec, melodyNotes, cursor, beatsPerBar));
    cursor += sec.bars * beatsPerBar;
  });
  return allWords;
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

  const [rawMainPart, slashBass] = clean.split('/');
  const mainPart = rawMainPart.replace(/°/g, 'dim');
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
    beatsPerBar?: number;
  }
): {
  events: ScheduledChordEvent[];
  totalBeats: number;
} {
  const events: ScheduledChordEvent[] = [];
  let cursorBeat = 0;
  let prevRightHandMidis: number[] | undefined;
  const forcedPattern = resolveConcreteArpPattern(options?.backingPattern);
  const beatsPerBar = options?.beatsPerBar ?? 4;

  sections.forEach((section) => {
    const sectionBeats = section.bars * beatsPerBar;
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

  const beatsPerBar = resolveBeatsPerBar(draft.timeSignature);
  // Channel 0: Backing Chords (strictly below melody register)
  const { events: chordEvents } = buildChordTimeline(draft.sections, {
    backingPattern: draft.backingPattern,
    chordArpStyles: draft.chordArpStyles,
    songMood: draft.mood,
    melodyNotes: draft.melodyNotes,
    beatsPerBar,
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
    sectionBeatOffset += sec.bars * beatsPerBar;
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

/**
 * Transposes the entire song draft (keyRoot, inline [Chord] tags, chordSchedule, and melodyNotes)
 * to a target key root using the shortest musical semitone distance in [-6, +6].
 */
export function transposeDraftToKey(
  draft: SketchpadDraft,
  targetKeyRoot: string
): { draft: SketchpadDraft; semitones: number } {
  const canonicalTarget = normalizeKeyRoot(targetKeyRoot);
  const fromChroma = Note.chroma(draft.keyRoot);
  const toChroma = Note.chroma(canonicalTarget);

  if (typeof fromChroma !== 'number' || typeof toChroma !== 'number') {
    return {
      draft: { ...draft, keyRoot: canonicalTarget },
      semitones: 0,
    };
  }

  const rawDiff = (((toChroma - fromChroma) % 12) + 12) % 12;
  if (rawDiff === 0) {
    return {
      draft: { ...draft, keyRoot: canonicalTarget },
      semitones: 0,
    };
  }

  let semitones = rawDiff > 6 ? rawDiff - 12 : rawDiff;
  if (rawDiff === 6 && draft.melodyNotes.length > 0) {
    const avgMidi =
      draft.melodyNotes.reduce((sum, n) => sum + n.midi, 0) / draft.melodyNotes.length;
    semitones = avgMidi > 71 ? -6 : 6;
  }

  const transposed = transposeDraftAll(draft, semitones);
  return {
    draft: {
      ...transposed,
      keyRoot: canonicalTarget,
    },
    semitones,
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
    beatsPerBar?: number;
  }
): SectionBarSlot[] {
  const beatsPerBar = options?.beatsPerBar ?? 4;
  const { events } = buildChordTimeline([section], options);
  const slots: SectionBarSlot[] = [];
  let runningChord = events[0]?.symbol ?? fallbackChord;
  let runningArp: ConcreteArpeggioPatternId =
    events[0]?.arpPattern ?? resolveConcreteArpPattern(options?.backingPattern) ?? 'ballad-wave';

  for (let b = 0; b < section.bars; b++) {
    const barStart = b * beatsPerBar;
    const barEnd = (b + 1) * beatsPerBar;
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
  newChord: string,
  beatsPerBar = 4
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

  const beatsPerLine = (section.bars * beatsPerBar) / nonEmptyIndices.length;
  const barStartBeat = barIndex * beatsPerBar;
  const barEndBeat = barStartBeat + beatsPerBar;

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
  variationSeed = 0,
  beatsPerBar = 4
): MelodyNote[] {
  const { events } = buildChordTimeline([section], { beatsPerBar });
  const totalBeats = section.bars * beatsPerBar;
  const fallbackVoicing = resolvePianistVoicing(
    scaleMode === 'minor' ? `${keyRoot}m7` : `${keyRoot}maj7`,
    0
  );

  const notes: MelodyNote[] = [];
  let prevMidi = 69;

  for (let b = 0; b < section.bars; b++) {
    const barStart = b * beatsPerBar;
    const isLastBar = b === section.bars - 1;
    const pattern =
      MELODY_RHYTHM_PATTERNS[(b + Math.abs(variationSeed)) % MELODY_RHYTHM_PATTERNS.length];

    pattern.forEach((step, sIdx) => {
      if (step.offset >= beatsPerBar) return;
      const beat = barStart + step.offset;
      if (beat >= totalBeats) return;
      // Leave graceful vocal breath at end of final bar
      if (isLastBar && sIdx === pattern.length - 1 && step.offset >= beatsPerBar - 1.5) {
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
      id: 'draft-phia-sau-mot-co-gai',
      title: 'Phía Sau Một Cô Gái — Soobin Hoàng Sơn (Sheet Fm → F#m)',
      keyRoot: 'F',
      scaleMode: 'minor',
      mood: 'pop-ballad',
      bpm: 72,
      backingInstrument: 'piano-ballad',
      backingPattern: 'auto-song',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'ballad',
      melodyInstrument: 'piano',
      melodyMuted: false,
      melodyPlaybackMode: 'all',
      mutedMelodySectionIds: [],
      scaleSnap: true,
      updatedAt: now + 60_000,
      sections: [
        {
          id: 'sec-psmcg-intro',
          kind: 'Intro',
          label: 'Intro — Piano Chủ Đề (Tone Fm · 4/4)',
          bars: 8,
          text:
            '[Dbmaj7](Dạo Piano: F5-Eb5-Ab5-G5) [Eb]... [Cm7]... [Fm7]...\n' +
            '[Bbm7](Điệp khúc dạo) [Cm7]... [Fm7]... Nhiều khi',
          chordSchedule: [
            { symbol: 'Dbmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Eb', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Cm7', startBeat: 8, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Fm7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Bbm7', startBeat: 16, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Cm7', startBeat: 20, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Fm7', startBeat: 24, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Fm7', startBeat: 28, durationBeats: 4, arpPattern: 'pinch-plucked' },
          ],
        },
        {
          id: 'sec-psmcg-verse-1',
          kind: 'Verse',
          label: 'Verse — Anh Mong Được Một Lần Nói Ra',
          bars: 8,
          text:
            '[Dbmaj7]anh mong được một lần nói [Eb]ra hết tất cả thay\n' +
            '[Fm7]vì... Ngồi lặng\n' +
            '[Bbm7]im nghe em kể về anh ta [C7]bằng đôi mắt lấp\n' +
            '[Fm7]lánh... Đôi',
          chordSchedule: [
            { symbol: 'Dbmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Eb', startBeat: 4, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Fm7', startBeat: 8, durationBeats: 8, arpPattern: 'rising-arp' },
            { symbol: 'Bbm7', startBeat: 16, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C7', startBeat: 20, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Fm7', startBeat: 24, durationBeats: 8, arpPattern: 'rising-arp' },
          ],
        },
        {
          id: 'sec-psmcg-pre',
          kind: 'Pre-Chorus',
          label: 'Pre-Chorus — Đôi Lúc Em Tránh Ánh Mắt',
          bars: 8,
          text:
            '[Bbm7]lúc em tránh ánh mắt của anh [Eb] vì dường như lúc nào\n' +
            '[Abmaj7] em cũng hiểu thấu lòng anh. [Dbmaj7] Không\n' +
            '[Gm7b5]thể ngắt lời càng không [C7]thể để giọt lệ nào được\n' +
            '[Fm7]rơi. Nếu anh lùi',
          chordSchedule: [
            { symbol: 'Bbm7', startBeat: 0, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Eb', startBeat: 4, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Abmaj7', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Dbmaj7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Gm7b5', startBeat: 16, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'C7', startBeat: 20, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Fm7', startBeat: 24, durationBeats: 8, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-psmcg-chorus-1',
          kind: 'Chorus',
          label: 'Điệp Khúc 1 — Cả Nguồn Sống Bỗng Chốc Thu Bé Lại',
          bars: 8,
          text:
            '[Dbmaj7]bước về sau, để [Eb]thấy em rõ hơn để có thể\n' +
            '[Cm7]ngắm em từ xa âu [Fm7]yếm hơn. Cả nguồn\n' +
            '[Bbm7]sống bỗng chốc thu bé lại [C7] vừa bằng một cô\n' +
            '[Fm7]gái. [Eb] Hay anh vẫn',
          chordSchedule: [
            { symbol: 'Dbmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Eb', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Cm7', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Fm7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Bbm7', startBeat: 16, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'C7', startBeat: 20, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Fm7', startBeat: 24, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Eb', startBeat: 28, durationBeats: 4, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-psmcg-chorus-2',
          kind: 'Chorus',
          label: 'Điệp Khúc 2 — Ánh Mắt Anh Hồn Nhiên Đến Lạ',
          bars: 8,
          text:
            '[Dbmaj7]sẽ lặng lẽ kế [Eb] bên, dù không nắm\n' +
            '[Cm7]tay nhưng đường chung mãi [Fm7]mãi. [Fm7] Và từ\n' +
            '[Bbm7]ấy ánh mắt anh hồn [Cm7]nhiên đến\n' +
            '[Fm7]lạ.',
          chordSchedule: [
            { symbol: 'Dbmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Eb', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Cm7', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Fm7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Fm7', startBeat: 16, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Bbm7', startBeat: 20, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Cm7', startBeat: 24, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Fm7', startBeat: 28, durationBeats: 4, arpPattern: 'rising-arp' },
          ],
        },
        {
          id: 'sec-psmcg-bridge',
          kind: 'Bridge',
          label: 'Giang Tấu — Chuyển Tông Fm → F#m (+½ Cung)',
          bars: 4,
          text:
            '[Bbm] (Dạo chuyển tông)\n' +
            '[Cm] (Nâng cao trào)\n' +
            '[Bm7] (Lên tông F#m)\n' +
            '[C#7] Nếu anh lùi',
          chordSchedule: [
            { symbol: 'Bbm', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Cm', startBeat: 4, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Bm7', startBeat: 8, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'C#7', startBeat: 12, durationBeats: 4, arpPattern: 'pinch-plucked' },
          ],
        },
        {
          id: 'sec-psmcg-chorus-up-1',
          kind: 'Chorus',
          label: 'Điệp Khúc Cao Trào (Tone F#m) — Bước Về Sau',
          bars: 8,
          text:
            '[Dmaj7]bước về sau, để [E]thấy em rõ hơn để có thể\n' +
            '[C#m7]ngắm em từ xa âu [F#m7]yếm hơn. Cả nguồn\n' +
            '[Bm7]sống bỗng chốc thu bé lại [C#7] vừa bằng một cô\n' +
            '[F#m7]gái. [E] Hay anh vẫn',
          chordSchedule: [
            { symbol: 'Dmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'E', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C#m7', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'F#m7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Bm7', startBeat: 16, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'C#7', startBeat: 20, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'F#m7', startBeat: 24, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'E', startBeat: 28, durationBeats: 4, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-psmcg-chorus-up-2',
          kind: 'Chorus',
          label: 'Điệp Khúc Cuối (Tone F#m) — Hồn Nhiên Đến Lạ',
          bars: 8,
          text:
            '[Dmaj7]sẽ lặng lẽ kế [E] bên, dù không nắm\n' +
            '[C#m7]tay nhưng đường chung mãi [F#m7]mãi. [F#m7] Và từ\n' +
            '[Bm7]ấy ánh mắt anh hồn [C#m7]nhiên đến\n' +
            '[F#m7]lạ.',
          chordSchedule: [
            { symbol: 'Dmaj7', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'E', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C#m7', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'F#m7', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'F#m7', startBeat: 16, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Bm7', startBeat: 20, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'C#m7', startBeat: 24, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'F#m7', startBeat: 28, durationBeats: 4, arpPattern: 'rising-arp' },
          ],
        },
        {
          id: 'sec-psmcg-outro',
          kind: 'Outro',
          label: 'Outro — Vì Sao Anh Không Thể Gặp Em Sớm Hơn',
          bars: 4,
          text: '[C#7] Vì [Dmaj7]sao anh không thể gặp được [E]em sớm [F#m]hơn.',
          chordSchedule: [
            { symbol: 'C#7', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Dmaj7', startBeat: 4, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'E', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'F#m', startBeat: 12, durationBeats: 4, arpPattern: 'rising-arp' },
          ],
        },
      ],
      melodyNotes: [
        // 1. Intro (8 bars = 32 beats, Tone Fm — F5-Eb5-Ab5-G5 motif)
        { id: 'psmi-1', sectionId: 'sec-psmcg-intro', midi: 77, startBeat: 0.0, durationBeats: 1.5, velocity: 0.84 },
        { id: 'psmi-2', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 1.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'psmi-3', sectionId: 'sec-psmcg-intro', midi: 80, startBeat: 2.0, durationBeats: 1.0, velocity: 0.88 },
        { id: 'psmi-4', sectionId: 'sec-psmcg-intro', midi: 79, startBeat: 3.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'psmi-5', sectionId: 'sec-psmcg-intro', midi: 77, startBeat: 4.0, durationBeats: 1.5, velocity: 0.84 },
        { id: 'psmi-6', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 5.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'psmi-7', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 6.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'psmi-8', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 7.0, durationBeats: 1.0, velocity: 0.8 },
        { id: 'psmi-9', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 8.0, durationBeats: 1.5, velocity: 0.84 },
        { id: 'psmi-10', sectionId: 'sec-psmcg-intro', midi: 73, startBeat: 9.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'psmi-11', sectionId: 'sec-psmcg-intro', midi: 73, startBeat: 10.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'psmi-12', sectionId: 'sec-psmcg-intro', midi: 72, startBeat: 10.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'psmi-13', sectionId: 'sec-psmcg-intro', midi: 70, startBeat: 11.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'psmi-14', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 11.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'psmi-15', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 12.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'psmi-16', sectionId: 'sec-psmcg-intro', midi: 65, startBeat: 13.0, durationBeats: 0.5, velocity: 0.74 },
        { id: 'psmi-17', sectionId: 'sec-psmcg-intro', midi: 65, startBeat: 13.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'psmi-18', sectionId: 'sec-psmcg-intro', midi: 65, startBeat: 14.0, durationBeats: 0.5, velocity: 0.74 },
        { id: 'psmi-19', sectionId: 'sec-psmcg-intro', midi: 67, startBeat: 14.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'psmi-20', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 15.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'psmi-21', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 16.0, durationBeats: 1.5, velocity: 0.8 },
        { id: 'psmi-22', sectionId: 'sec-psmcg-intro', midi: 70, startBeat: 17.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'psmi-23', sectionId: 'sec-psmcg-intro', midi: 72, startBeat: 18.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'psmi-24', sectionId: 'sec-psmcg-intro', midi: 75, startBeat: 19.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'psmi-25', sectionId: 'sec-psmcg-intro', midi: 73, startBeat: 20.0, durationBeats: 1.5, velocity: 0.82 },
        { id: 'psmi-26', sectionId: 'sec-psmcg-intro', midi: 73, startBeat: 21.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'psmi-27', sectionId: 'sec-psmcg-intro', midi: 70, startBeat: 22.0, durationBeats: 1.5, velocity: 0.8 },
        { id: 'psmi-28', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 23.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'psmi-29', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 24.0, durationBeats: 4.0, velocity: 0.8 },
        { id: 'psmi-30', sectionId: 'sec-psmcg-intro', midi: 68, startBeat: 28.0, durationBeats: 2.0, velocity: 0.72 },
        { id: 'psmi-31', sectionId: 'sec-psmcg-intro', midi: 65, startBeat: 31.0, durationBeats: 0.5, velocity: 0.78 }, // Nhiều
        { id: 'psmi-32', sectionId: 'sec-psmcg-intro', midi: 67, startBeat: 31.5, durationBeats: 0.5, velocity: 0.8 }, // khi

        // 2. Verse 1 (8 bars = 32 beats)
        { id: 'psmv-1', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 0.0, durationBeats: 0.5, velocity: 0.82 }, // anh
        { id: 'psmv-2', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 }, // mong
        { id: 'psmv-3', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 1.0, durationBeats: 0.5, velocity: 0.8 }, // được
        { id: 'psmv-4', sectionId: 'sec-psmcg-verse-1', midi: 72, startBeat: 1.5, durationBeats: 0.5, velocity: 0.86 }, // một
        { id: 'psmv-5', sectionId: 'sec-psmcg-verse-1', midi: 72, startBeat: 2.0, durationBeats: 1.0, velocity: 0.86 }, // lần
        { id: 'psmv-6', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 3.0, durationBeats: 1.0, velocity: 0.82 }, // nói
        { id: 'psmv-7', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 4.0, durationBeats: 1.5, velocity: 0.84 }, // ra
        { id: 'psmv-8', sectionId: 'sec-psmcg-verse-1', midi: 72, startBeat: 5.5, durationBeats: 0.5, velocity: 0.86 }, // hết
        { id: 'psmv-9', sectionId: 'sec-psmcg-verse-1', midi: 72, startBeat: 6.0, durationBeats: 0.5, velocity: 0.84 }, // tất
        { id: 'psmv-10', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 6.5, durationBeats: 0.5, velocity: 0.82 }, // cả
        { id: 'psmv-11', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 7.0, durationBeats: 1.0, velocity: 0.8 }, // thay
        { id: 'psmv-12', sectionId: 'sec-psmcg-verse-1', midi: 67, startBeat: 8.0, durationBeats: 5.5, velocity: 0.82 }, // vì...
        { id: 'psmv-13', sectionId: 'sec-psmcg-verse-1', midi: 65, startBeat: 15.0, durationBeats: 0.5, velocity: 0.78 }, // Ngồi
        { id: 'psmv-14', sectionId: 'sec-psmcg-verse-1', midi: 67, startBeat: 15.5, durationBeats: 0.5, velocity: 0.8 }, // lặng
        { id: 'psmv-15', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 16.0, durationBeats: 0.5, velocity: 0.82 }, // im
        { id: 'psmv-16', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 16.5, durationBeats: 0.5, velocity: 0.8 }, // nghe
        { id: 'psmv-17', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 17.0, durationBeats: 0.5, velocity: 0.8 }, // em
        { id: 'psmv-18', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 17.5, durationBeats: 0.5, velocity: 0.8 }, // kể
        { id: 'psmv-19', sectionId: 'sec-psmcg-verse-1', midi: 67, startBeat: 18.0, durationBeats: 1.0, velocity: 0.78 }, // về
        { id: 'psmv-20', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 19.0, durationBeats: 0.5, velocity: 0.8 }, // anh
        { id: 'psmv-21', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 19.5, durationBeats: 0.5, velocity: 0.84 }, // ta
        { id: 'psmv-22', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 20.0, durationBeats: 0.5, velocity: 0.84 }, // bằng
        { id: 'psmv-23', sectionId: 'sec-psmcg-verse-1', midi: 68, startBeat: 20.5, durationBeats: 0.5, velocity: 0.8 }, // đôi
        { id: 'psmv-24', sectionId: 'sec-psmcg-verse-1', midi: 67, startBeat: 21.0, durationBeats: 2.0, velocity: 0.8 }, // mắt
        { id: 'psmv-25', sectionId: 'sec-psmcg-verse-1', midi: 64, startBeat: 23.0, durationBeats: 1.0, velocity: 0.78 }, // lấp
        { id: 'psmv-26', sectionId: 'sec-psmcg-verse-1', midi: 65, startBeat: 24.0, durationBeats: 6.0, velocity: 0.8 }, // lánh...
        { id: 'psmv-27', sectionId: 'sec-psmcg-verse-1', midi: 70, startBeat: 31.5, durationBeats: 0.5, velocity: 0.82 }, // Đôi

        // 3. Pre-Chorus (8 bars = 32 beats)
        { id: 'psmp-1', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 0.0, durationBeats: 0.5, velocity: 0.86 }, // lúc
        { id: 'psmp-2', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 0.5, durationBeats: 0.5, velocity: 0.84 }, // em
        { id: 'psmp-3', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 1.0, durationBeats: 0.5, velocity: 0.84 }, // tránh
        { id: 'psmp-4', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 1.5, durationBeats: 0.5, velocity: 0.84 }, // ánh
        { id: 'psmp-5', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 2.0, durationBeats: 1.0, velocity: 0.86 }, // mắt
        { id: 'psmp-6', sectionId: 'sec-psmcg-pre', midi: 70, startBeat: 3.0, durationBeats: 0.5, velocity: 0.82 }, // của
        { id: 'psmp-7', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 3.5, durationBeats: 2.0, velocity: 0.86 }, // anh
        { id: 'psmp-8', sectionId: 'sec-psmcg-pre', midi: 73, startBeat: 5.5, durationBeats: 0.5, velocity: 0.88 }, // vì
        { id: 'psmp-9', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 6.0, durationBeats: 0.5, velocity: 0.84 }, // dường
        { id: 'psmp-10', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 6.5, durationBeats: 0.5, velocity: 0.84 }, // như
        { id: 'psmp-11', sectionId: 'sec-psmcg-pre', midi: 73, startBeat: 7.0, durationBeats: 0.5, velocity: 0.88 }, // lúc
        { id: 'psmp-12', sectionId: 'sec-psmcg-pre', midi: 72, startBeat: 7.5, durationBeats: 1.5, velocity: 0.86 }, // nào
        { id: 'psmp-13', sectionId: 'sec-psmcg-pre', midi: 70, startBeat: 9.0, durationBeats: 0.5, velocity: 0.84 }, // em
        { id: 'psmp-14', sectionId: 'sec-psmcg-pre', midi: 70, startBeat: 9.5, durationBeats: 0.5, velocity: 0.82 }, // cũng
        { id: 'psmp-15', sectionId: 'sec-psmcg-pre', midi: 70, startBeat: 10.0, durationBeats: 0.5, velocity: 0.84 }, // hiểu
        { id: 'psmp-16', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 10.5, durationBeats: 0.5, velocity: 0.8 }, // thấu
        { id: 'psmp-17', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 11.0, durationBeats: 0.5, velocity: 0.78 }, // lòng
        { id: 'psmp-18', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 11.5, durationBeats: 3.5, velocity: 0.82 }, // anh.
        { id: 'psmp-19', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 15.5, durationBeats: 0.5, velocity: 0.82 }, // Không
        { id: 'psmp-20', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 16.0, durationBeats: 0.5, velocity: 0.82 }, // thể
        { id: 'psmp-21', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 16.5, durationBeats: 0.5, velocity: 0.82 }, // ngắt
        { id: 'psmp-22', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 17.0, durationBeats: 1.5, velocity: 0.84 }, // lời
        { id: 'psmp-23', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 18.5, durationBeats: 0.5, velocity: 0.8 }, // càng
        { id: 'psmp-24', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 19.0, durationBeats: 1.0, velocity: 0.82 }, // không
        { id: 'psmp-25', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 20.0, durationBeats: 0.5, velocity: 0.8 }, // thể
        { id: 'psmp-26', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 20.5, durationBeats: 0.5, velocity: 0.8 }, // để
        { id: 'psmp-27', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 21.0, durationBeats: 0.5, velocity: 0.78 }, // giọt
        { id: 'psmp-28', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 21.5, durationBeats: 0.5, velocity: 0.78 }, // lệ
        { id: 'psmp-29', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 22.0, durationBeats: 1.5, velocity: 0.8 }, // nào
        { id: 'psmp-30', sectionId: 'sec-psmcg-pre', midi: 64, startBeat: 23.5, durationBeats: 0.5, velocity: 0.78 }, // được
        { id: 'psmp-31', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 24.0, durationBeats: 3.0, velocity: 0.82 }, // rơi.
        { id: 'psmp-32', sectionId: 'sec-psmcg-pre', midi: 68, startBeat: 29.5, durationBeats: 0.5, velocity: 0.84 }, // Nếu
        { id: 'psmp-33', sectionId: 'sec-psmcg-pre', midi: 67, startBeat: 30.0, durationBeats: 1.0, velocity: 0.82 }, // anh
        { id: 'psmp-34', sectionId: 'sec-psmcg-pre', midi: 65, startBeat: 31.0, durationBeats: 1.0, velocity: 0.8 }, // lùi

        // 4. Chorus 1 (8 bars = 32 beats, Tone Fm)
        { id: 'psmc1-1', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 0.0, durationBeats: 1.5, velocity: 0.9 }, // bước
        { id: 'psmc1-2', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 1.5, durationBeats: 1.0, velocity: 0.92 }, // về
        { id: 'psmc1-3', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 2.5, durationBeats: 1.0, velocity: 0.88 }, // sau,
        { id: 'psmc1-4', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 3.5, durationBeats: 0.5, velocity: 0.82 }, // để
        { id: 'psmc1-5', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 4.0, durationBeats: 0.5, velocity: 0.86 }, // thấy
        { id: 'psmc1-6', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 4.5, durationBeats: 0.5, velocity: 0.86 }, // em
        { id: 'psmc1-7', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 5.0, durationBeats: 0.5, velocity: 0.86 }, // rõ
        { id: 'psmc1-8', sectionId: 'sec-psmcg-chorus-1', midi: 70, startBeat: 5.5, durationBeats: 1.0, velocity: 0.84 }, // hơn
        { id: 'psmc1-9', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 6.5, durationBeats: 0.5, velocity: 0.86 }, // để
        { id: 'psmc1-10', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 7.0, durationBeats: 0.5, velocity: 0.88 }, // có
        { id: 'psmc1-11', sectionId: 'sec-psmcg-chorus-1', midi: 79, startBeat: 7.5, durationBeats: 0.5, velocity: 0.92 }, // thể
        { id: 'psmc1-12', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 8.0, durationBeats: 1.0, velocity: 0.88 }, // ngắm
        { id: 'psmc1-13', sectionId: 'sec-psmcg-chorus-1', midi: 79, startBeat: 9.0, durationBeats: 0.5, velocity: 0.92 }, // em
        { id: 'psmc1-14', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 9.5, durationBeats: 0.5, velocity: 0.9 }, // từ
        { id: 'psmc1-15', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 10.0, durationBeats: 1.5, velocity: 0.88 }, // xa
        { id: 'psmc1-16', sectionId: 'sec-psmcg-chorus-1', midi: 73, startBeat: 11.5, durationBeats: 0.5, velocity: 0.84 }, // âu
        { id: 'psmc1-17', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 12.0, durationBeats: 1.0, velocity: 0.86 }, // yếm
        { id: 'psmc1-18', sectionId: 'sec-psmcg-chorus-1', midi: 70, startBeat: 13.0, durationBeats: 1.5, velocity: 0.82 }, // hơn.
        { id: 'psmc1-19', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 15.0, durationBeats: 0.5, velocity: 0.82 }, // Cả
        { id: 'psmc1-20', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 15.5, durationBeats: 0.5, velocity: 0.84 }, // nguồn
        { id: 'psmc1-21', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 16.0, durationBeats: 1.0, velocity: 0.92 }, // sống
        { id: 'psmc1-22', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 17.0, durationBeats: 0.5, velocity: 0.9 }, // bỗng
        { id: 'psmc1-23', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 17.5, durationBeats: 0.5, velocity: 0.92 }, // chốc
        { id: 'psmc1-24', sectionId: 'sec-psmcg-chorus-1', midi: 79, startBeat: 18.0, durationBeats: 0.5, velocity: 0.94 }, // (luyến)
        { id: 'psmc1-25', sectionId: 'sec-psmcg-chorus-1', midi: 77, startBeat: 18.5, durationBeats: 0.5, velocity: 0.9 }, // thu
        { id: 'psmc1-26', sectionId: 'sec-psmcg-chorus-1', midi: 75, startBeat: 19.0, durationBeats: 0.5, velocity: 0.88 }, // bé
        { id: 'psmc1-27', sectionId: 'sec-psmcg-chorus-1', midi: 73, startBeat: 19.5, durationBeats: 2.0, velocity: 0.86 }, // lại
        { id: 'psmc1-28', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 21.5, durationBeats: 0.5, velocity: 0.84 }, // vừa
        { id: 'psmc1-29', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 22.0, durationBeats: 0.5, velocity: 0.84 }, // bằng
        { id: 'psmc1-30', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 22.5, durationBeats: 0.5, velocity: 0.84 }, // một
        { id: 'psmc1-31', sectionId: 'sec-psmcg-chorus-1', midi: 70, startBeat: 23.0, durationBeats: 1.0, velocity: 0.86 }, // cô
        { id: 'psmc1-32', sectionId: 'sec-psmcg-chorus-1', midi: 72, startBeat: 24.0, durationBeats: 3.5, velocity: 0.88 }, // gái.
        { id: 'psmc1-33', sectionId: 'sec-psmcg-chorus-1', midi: 68, startBeat: 29.5, durationBeats: 0.5, velocity: 0.84 }, // Hay
        { id: 'psmc1-34', sectionId: 'sec-psmcg-chorus-1', midi: 67, startBeat: 30.0, durationBeats: 1.0, velocity: 0.82 }, // anh
        { id: 'psmc1-35', sectionId: 'sec-psmcg-chorus-1', midi: 65, startBeat: 31.0, durationBeats: 1.0, velocity: 0.8 }, // vẫn

        // 5. Chorus 2 (8 bars = 32 beats, Tone Fm)
        { id: 'psmc2-1', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 0.0, durationBeats: 1.5, velocity: 0.9 }, // sẽ
        { id: 'psmc2-2', sectionId: 'sec-psmcg-chorus-2', midi: 77, startBeat: 1.5, durationBeats: 0.5, velocity: 0.92 }, // lặng
        { id: 'psmc2-3', sectionId: 'sec-psmcg-chorus-2', midi: 79, startBeat: 2.0, durationBeats: 1.5, velocity: 0.94 }, // lẽ
        { id: 'psmc2-4', sectionId: 'sec-psmcg-chorus-2', midi: 77, startBeat: 3.5, durationBeats: 1.0, velocity: 0.9 }, // kế
        { id: 'psmc2-5', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 4.5, durationBeats: 0.5, velocity: 0.88 }, // bên,
        { id: 'psmc2-6', sectionId: 'sec-psmcg-chorus-2', midi: 73, startBeat: 5.0, durationBeats: 1.0, velocity: 0.86 }, // dù
        { id: 'psmc2-7', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 6.0, durationBeats: 1.0, velocity: 0.88 }, // không
        { id: 'psmc2-8', sectionId: 'sec-psmcg-chorus-2', midi: 77, startBeat: 7.0, durationBeats: 1.0, velocity: 0.9 }, // nắm
        { id: 'psmc2-9', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 8.0, durationBeats: 1.0, velocity: 0.88 }, // tay
        { id: 'psmc2-10', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 9.0, durationBeats: 0.5, velocity: 0.88 }, // nhưng
        { id: 'psmc2-11', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 9.5, durationBeats: 0.5, velocity: 0.88 }, // đường
        { id: 'psmc2-12', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 10.0, durationBeats: 1.5, velocity: 0.88 }, // chung
        { id: 'psmc2-13', sectionId: 'sec-psmcg-chorus-2', midi: 80, startBeat: 11.5, durationBeats: 0.5, velocity: 0.94 }, // mãi
        { id: 'psmc2-14', sectionId: 'sec-psmcg-chorus-2', midi: 80, startBeat: 12.0, durationBeats: 1.0, velocity: 0.92 }, // mãi.
        { id: 'psmc2-15', sectionId: 'sec-psmcg-chorus-2', midi: 79, startBeat: 13.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'psmc2-16', sectionId: 'sec-psmcg-chorus-2', midi: 77, startBeat: 13.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'psmc2-17', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 14.0, durationBeats: 2.0, velocity: 0.86 },
        { id: 'psmc2-18', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 16.0, durationBeats: 2.0, velocity: 0.82 },
        { id: 'psmc2-19', sectionId: 'sec-psmcg-chorus-2', midi: 68, startBeat: 19.0, durationBeats: 0.5, velocity: 0.84 }, // Và
        { id: 'psmc2-20', sectionId: 'sec-psmcg-chorus-2', midi: 70, startBeat: 19.5, durationBeats: 0.5, velocity: 0.86 }, // từ
        { id: 'psmc2-21', sectionId: 'sec-psmcg-chorus-2', midi: 72, startBeat: 20.0, durationBeats: 1.0, velocity: 0.88 }, // ấy
        { id: 'psmc2-22', sectionId: 'sec-psmcg-chorus-2', midi: 73, startBeat: 21.0, durationBeats: 0.5, velocity: 0.88 }, // ánh
        { id: 'psmc2-23', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 21.5, durationBeats: 1.0, velocity: 0.9 }, // mắt
        { id: 'psmc2-24', sectionId: 'sec-psmcg-chorus-2', midi: 73, startBeat: 22.5, durationBeats: 0.5, velocity: 0.88 }, // anh
        { id: 'psmc2-25', sectionId: 'sec-psmcg-chorus-2', midi: 72, startBeat: 23.0, durationBeats: 1.0, velocity: 0.86 }, // hồn
        { id: 'psmc2-26', sectionId: 'sec-psmcg-chorus-2', midi: 73, startBeat: 24.0, durationBeats: 2.0, velocity: 0.88 }, // nhiên
        { id: 'psmc2-27', sectionId: 'sec-psmcg-chorus-2', midi: 75, startBeat: 26.0, durationBeats: 2.0, velocity: 0.9 }, // đến
        { id: 'psmc2-28', sectionId: 'sec-psmcg-chorus-2', midi: 77, startBeat: 28.0, durationBeats: 4.0, velocity: 0.92 }, // lạ.

        // 6. Bridge (4 bars = 16 beats — Modulation Fm -> F#m)
        { id: 'psmb-1', sectionId: 'sec-psmcg-bridge', midi: 68, startBeat: 0.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'psmb-2', sectionId: 'sec-psmcg-bridge', midi: 70, startBeat: 1.0, durationBeats: 1.0, velocity: 0.8 },
        { id: 'psmb-3', sectionId: 'sec-psmcg-bridge', midi: 72, startBeat: 2.0, durationBeats: 2.0, velocity: 0.82 },
        { id: 'psmb-4', sectionId: 'sec-psmcg-bridge', midi: 72, startBeat: 4.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'psmb-5', sectionId: 'sec-psmcg-bridge', midi: 73, startBeat: 5.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'psmb-6', sectionId: 'sec-psmcg-bridge', midi: 75, startBeat: 6.0, durationBeats: 2.0, velocity: 0.86 },
        { id: 'psmb-7', sectionId: 'sec-psmcg-bridge', midi: 74, startBeat: 8.0, durationBeats: 1.0, velocity: 0.86 },
        { id: 'psmb-8', sectionId: 'sec-psmcg-bridge', midi: 76, startBeat: 9.0, durationBeats: 1.0, velocity: 0.88 },
        { id: 'psmb-9', sectionId: 'sec-psmcg-bridge', midi: 78, startBeat: 10.0, durationBeats: 2.0, velocity: 0.9 },
        { id: 'psmb-10', sectionId: 'sec-psmcg-bridge', midi: 73, startBeat: 12.0, durationBeats: 1.0, velocity: 0.86 },
        { id: 'psmb-11', sectionId: 'sec-psmcg-bridge', midi: 69, startBeat: 13.5, durationBeats: 0.5, velocity: 0.86 }, // Nếu (F#m)
        { id: 'psmb-12', sectionId: 'sec-psmcg-bridge', midi: 68, startBeat: 14.0, durationBeats: 1.0, velocity: 0.84 }, // anh
        { id: 'psmb-13', sectionId: 'sec-psmcg-bridge', midi: 66, startBeat: 15.0, durationBeats: 1.0, velocity: 0.82 }, // lùi

        // 7. Chorus Up 1 (8 bars = 32 beats, Tone F#m, exact +1 semitone)
        { id: 'psmu1-1', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 0.0, durationBeats: 1.5, velocity: 0.92 }, // bước
        { id: 'psmu1-2', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 1.5, durationBeats: 1.0, velocity: 0.94 }, // về
        { id: 'psmu1-3', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 2.5, durationBeats: 1.0, velocity: 0.9 }, // sau,
        { id: 'psmu1-4', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 3.5, durationBeats: 0.5, velocity: 0.84 }, // để
        { id: 'psmu1-5', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 4.0, durationBeats: 0.5, velocity: 0.88 }, // thấy
        { id: 'psmu1-6', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 4.5, durationBeats: 0.5, velocity: 0.88 }, // em
        { id: 'psmu1-7', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 5.0, durationBeats: 0.5, velocity: 0.88 }, // rõ
        { id: 'psmu1-8', sectionId: 'sec-psmcg-chorus-up-1', midi: 71, startBeat: 5.5, durationBeats: 1.0, velocity: 0.86 }, // hơn
        { id: 'psmu1-9', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 6.5, durationBeats: 0.5, velocity: 0.88 }, // để
        { id: 'psmu1-10', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 7.0, durationBeats: 0.5, velocity: 0.9 }, // có
        { id: 'psmu1-11', sectionId: 'sec-psmcg-chorus-up-1', midi: 80, startBeat: 7.5, durationBeats: 0.5, velocity: 0.94 }, // thể
        { id: 'psmu1-12', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 8.0, durationBeats: 1.0, velocity: 0.9 }, // ngắm
        { id: 'psmu1-13', sectionId: 'sec-psmcg-chorus-up-1', midi: 80, startBeat: 9.0, durationBeats: 0.5, velocity: 0.94 }, // em
        { id: 'psmu1-14', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 9.5, durationBeats: 0.5, velocity: 0.92 }, // từ
        { id: 'psmu1-15', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 10.0, durationBeats: 1.5, velocity: 0.9 }, // xa
        { id: 'psmu1-16', sectionId: 'sec-psmcg-chorus-up-1', midi: 74, startBeat: 11.5, durationBeats: 0.5, velocity: 0.86 }, // âu
        { id: 'psmu1-17', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 12.0, durationBeats: 1.0, velocity: 0.88 }, // yếm
        { id: 'psmu1-18', sectionId: 'sec-psmcg-chorus-up-1', midi: 71, startBeat: 13.0, durationBeats: 1.5, velocity: 0.84 }, // hơn.
        { id: 'psmu1-19', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 15.0, durationBeats: 0.5, velocity: 0.84 }, // Cả
        { id: 'psmu1-20', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 15.5, durationBeats: 0.5, velocity: 0.86 }, // nguồn
        { id: 'psmu1-21', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 16.0, durationBeats: 1.0, velocity: 0.94 }, // sống
        { id: 'psmu1-22', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 17.0, durationBeats: 0.5, velocity: 0.92 }, // bỗng
        { id: 'psmu1-23', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 17.5, durationBeats: 0.5, velocity: 0.94 }, // chốc
        { id: 'psmu1-24', sectionId: 'sec-psmcg-chorus-up-1', midi: 80, startBeat: 18.0, durationBeats: 0.5, velocity: 0.95 },
        { id: 'psmu1-25', sectionId: 'sec-psmcg-chorus-up-1', midi: 78, startBeat: 18.5, durationBeats: 0.5, velocity: 0.92 }, // thu
        { id: 'psmu1-26', sectionId: 'sec-psmcg-chorus-up-1', midi: 76, startBeat: 19.0, durationBeats: 0.5, velocity: 0.9 }, // bé
        { id: 'psmu1-27', sectionId: 'sec-psmcg-chorus-up-1', midi: 74, startBeat: 19.5, durationBeats: 2.0, velocity: 0.88 }, // lại
        { id: 'psmu1-28', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 21.5, durationBeats: 0.5, velocity: 0.86 }, // vừa
        { id: 'psmu1-29', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 22.0, durationBeats: 0.5, velocity: 0.86 }, // bằng
        { id: 'psmu1-30', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 22.5, durationBeats: 0.5, velocity: 0.86 }, // một
        { id: 'psmu1-31', sectionId: 'sec-psmcg-chorus-up-1', midi: 71, startBeat: 23.0, durationBeats: 1.0, velocity: 0.88 }, // cô
        { id: 'psmu1-32', sectionId: 'sec-psmcg-chorus-up-1', midi: 73, startBeat: 24.0, durationBeats: 3.5, velocity: 0.9 }, // gái.
        { id: 'psmu1-33', sectionId: 'sec-psmcg-chorus-up-1', midi: 69, startBeat: 29.5, durationBeats: 0.5, velocity: 0.86 }, // Hay
        { id: 'psmu1-34', sectionId: 'sec-psmcg-chorus-up-1', midi: 68, startBeat: 30.0, durationBeats: 1.0, velocity: 0.84 }, // anh
        { id: 'psmu1-35', sectionId: 'sec-psmcg-chorus-up-1', midi: 66, startBeat: 31.0, durationBeats: 1.0, velocity: 0.82 }, // vẫn

        // 8. Chorus Up 2 (8 bars = 32 beats, Tone F#m, exact +1 semitone)
        { id: 'psmu2-1', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 0.0, durationBeats: 1.5, velocity: 0.92 }, // sẽ
        { id: 'psmu2-2', sectionId: 'sec-psmcg-chorus-up-2', midi: 78, startBeat: 1.5, durationBeats: 0.5, velocity: 0.94 }, // lặng
        { id: 'psmu2-3', sectionId: 'sec-psmcg-chorus-up-2', midi: 80, startBeat: 2.0, durationBeats: 1.5, velocity: 0.95 }, // lẽ
        { id: 'psmu2-4', sectionId: 'sec-psmcg-chorus-up-2', midi: 78, startBeat: 3.5, durationBeats: 1.0, velocity: 0.92 }, // kế
        { id: 'psmu2-5', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 4.5, durationBeats: 0.5, velocity: 0.9 }, // bên,
        { id: 'psmu2-6', sectionId: 'sec-psmcg-chorus-up-2', midi: 74, startBeat: 5.0, durationBeats: 1.0, velocity: 0.88 }, // dù
        { id: 'psmu2-7', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 6.0, durationBeats: 1.0, velocity: 0.9 }, // không
        { id: 'psmu2-8', sectionId: 'sec-psmcg-chorus-up-2', midi: 78, startBeat: 7.0, durationBeats: 1.0, velocity: 0.92 }, // nắm
        { id: 'psmu2-9', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 8.0, durationBeats: 1.0, velocity: 0.9 }, // tay
        { id: 'psmu2-10', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 9.0, durationBeats: 0.5, velocity: 0.9 }, // nhưng
        { id: 'psmu2-11', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 9.5, durationBeats: 0.5, velocity: 0.9 }, // đường
        { id: 'psmu2-12', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 10.0, durationBeats: 1.5, velocity: 0.9 }, // chung
        { id: 'psmu2-13', sectionId: 'sec-psmcg-chorus-up-2', midi: 81, startBeat: 11.5, durationBeats: 0.5, velocity: 0.95 }, // mãi
        { id: 'psmu2-14', sectionId: 'sec-psmcg-chorus-up-2', midi: 81, startBeat: 12.0, durationBeats: 1.0, velocity: 0.94 }, // mãi.
        { id: 'psmu2-15', sectionId: 'sec-psmcg-chorus-up-2', midi: 80, startBeat: 13.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'psmu2-16', sectionId: 'sec-psmcg-chorus-up-2', midi: 78, startBeat: 13.5, durationBeats: 0.5, velocity: 0.88 },
        { id: 'psmu2-17', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 14.0, durationBeats: 2.0, velocity: 0.88 },
        { id: 'psmu2-18', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 16.0, durationBeats: 2.0, velocity: 0.84 },
        { id: 'psmu2-19', sectionId: 'sec-psmcg-chorus-up-2', midi: 69, startBeat: 19.0, durationBeats: 0.5, velocity: 0.86 }, // Và
        { id: 'psmu2-20', sectionId: 'sec-psmcg-chorus-up-2', midi: 71, startBeat: 19.5, durationBeats: 0.5, velocity: 0.88 }, // từ
        { id: 'psmu2-21', sectionId: 'sec-psmcg-chorus-up-2', midi: 73, startBeat: 20.0, durationBeats: 1.0, velocity: 0.9 }, // ấy
        { id: 'psmu2-22', sectionId: 'sec-psmcg-chorus-up-2', midi: 74, startBeat: 21.0, durationBeats: 0.5, velocity: 0.9 }, // ánh
        { id: 'psmu2-23', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 21.5, durationBeats: 1.0, velocity: 0.92 }, // mắt
        { id: 'psmu2-24', sectionId: 'sec-psmcg-chorus-up-2', midi: 74, startBeat: 22.5, durationBeats: 0.5, velocity: 0.9 }, // anh
        { id: 'psmu2-25', sectionId: 'sec-psmcg-chorus-up-2', midi: 73, startBeat: 23.0, durationBeats: 1.0, velocity: 0.88 }, // hồn
        { id: 'psmu2-26', sectionId: 'sec-psmcg-chorus-up-2', midi: 74, startBeat: 24.0, durationBeats: 2.0, velocity: 0.9 }, // nhiên
        { id: 'psmu2-27', sectionId: 'sec-psmcg-chorus-up-2', midi: 76, startBeat: 26.0, durationBeats: 2.0, velocity: 0.92 }, // đến
        { id: 'psmu2-28', sectionId: 'sec-psmcg-chorus-up-2', midi: 78, startBeat: 28.0, durationBeats: 4.0, velocity: 0.94 }, // lạ.

        // 9. Outro (4 bars = 16 beats, Tone F#m)
        { id: 'psmo-1', sectionId: 'sec-psmcg-outro', midi: 69, startBeat: 3.5, durationBeats: 0.5, velocity: 0.82 }, // Vì
        { id: 'psmo-2', sectionId: 'sec-psmcg-outro', midi: 74, startBeat: 4.0, durationBeats: 0.5, velocity: 0.86 }, // sao
        { id: 'psmo-3', sectionId: 'sec-psmcg-outro', midi: 74, startBeat: 4.5, durationBeats: 0.5, velocity: 0.84 }, // anh
        { id: 'psmo-4', sectionId: 'sec-psmcg-outro', midi: 74, startBeat: 5.0, durationBeats: 0.5, velocity: 0.84 }, // không
        { id: 'psmo-5', sectionId: 'sec-psmcg-outro', midi: 74, startBeat: 5.5, durationBeats: 0.5, velocity: 0.84 }, // thể
        { id: 'psmo-6', sectionId: 'sec-psmcg-outro', midi: 76, startBeat: 6.0, durationBeats: 0.5, velocity: 0.86 }, // (luyến)
        { id: 'psmo-7', sectionId: 'sec-psmcg-outro', midi: 73, startBeat: 6.5, durationBeats: 0.5, velocity: 0.84 }, // gặp
        { id: 'psmo-8', sectionId: 'sec-psmcg-outro', midi: 71, startBeat: 7.0, durationBeats: 1.0, velocity: 0.82 }, // được
        { id: 'psmo-9', sectionId: 'sec-psmcg-outro', midi: 71, startBeat: 8.0, durationBeats: 2.0, velocity: 0.82 }, // em
        { id: 'psmo-10', sectionId: 'sec-psmcg-outro', midi: 76, startBeat: 10.0, durationBeats: 2.0, velocity: 0.84 }, // sớm
        { id: 'psmo-11', sectionId: 'sec-psmcg-outro', midi: 78, startBeat: 12.0, durationBeats: 4.0, velocity: 0.86 }, // hơn.
      ],
    },
    {
      id: 'draft-di-vang-nhat-nhoa',
      title: 'Dĩ Vãng Nhạt Nhòa (Sheet Tone Em · Beat Ballad)',
      keyRoot: 'E',
      scaleMode: 'minor',
      mood: 'pop-ballad',
      bpm: 74,
      backingInstrument: 'piano-ballad',
      backingPattern: 'auto-song',
      sustainPedal: true,
      metronomeEnabled: false,
      drumPattern: 'ballad',
      melodyInstrument: 'piano',
      melodyMuted: false,
      melodyPlaybackMode: 'all',
      mutedMelodySectionIds: [],
      scaleSnap: true,
      updatedAt: now + 45_000,
      sections: [
        {
          id: 'sec-dvnn-intro',
          kind: 'Intro',
          label: 'Intro — Chủ Đề Điệp Khúc (Tone Em · 4/4)',
          bars: 8,
          text:
            '[Em](Dạo: Chủ đề điệp khúc) [Am]... [C]... [D] [G7]\n' +
            '[Em](Trống & Bass vào nhịp) [Bm]... [C] [D] [Em] [B7]',
          chordSchedule: [
            { symbol: 'Em', startBeat: 0, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Am', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'D', startBeat: 12, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'G7', startBeat: 14, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 16, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Bm', startBeat: 20, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'C', startBeat: 24, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'D', startBeat: 26, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 28, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'B7', startBeat: 30, durationBeats: 2, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-dvnn-verse-1',
          kind: 'Verse',
          label: 'Lời 1 — Chờ Người Tình Lỡ',
          bars: 8,
          text:
            '[Em]Chờ người tình lỡ. Là tình [Em/B]đầu tình rực rỡ. Tình trong dĩ\n' +
            '[Am]vãng nhạt nhòa... [Am/E]\n' +
            '[Dm]Vào mùa trăng đó. [D7]Nàng từ phương xa về như giấc\n' +
            '[G]mơ... [B7]',
          chordSchedule: [
            { symbol: 'Em', startBeat: 0, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Em/B', startBeat: 4, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 8, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Am/E', startBeat: 12, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Dm', startBeat: 16, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'D7', startBeat: 20, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'G', startBeat: 24, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'B7', startBeat: 28, durationBeats: 4, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-dvnn-verse-2',
          kind: 'Verse',
          label: 'Lời 2 — Tình Đầu Gặp Gỡ',
          bars: 8,
          text:
            '[Em]Tình đầu gặp gỡ. Rồi trọn [Em/B]đời còn nhớ tình tha thiết\n' +
            '[Am]đắm say... [Am/E] [G7] Ánh\n' +
            '[C]mắt ngây thơ như ru hồn. Rũ [Am]áo phong sương em [Bm]vui tình\n' +
            '[Em]duyên... [Em/B] Lúc đắm',
          chordSchedule: [
            { symbol: 'Em', startBeat: 0, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Em/B', startBeat: 4, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 8, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Am/E', startBeat: 12, durationBeats: 2, arpPattern: 'ballad-wave' },
            { symbol: 'G7', startBeat: 14, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'C', startBeat: 16, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'Am', startBeat: 20, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'Bm', startBeat: 22, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 24, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Em/B', startBeat: 28, durationBeats: 4, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-dvnn-chorus',
          kind: 'Chorus',
          label: 'ĐK — Lúc Đắm Đuối Em Cho Rằng',
          bars: 8,
          text:
            '[Em]đuối em cho rằng tình ta như ánh [Am]trăng rằm. Chứ đâu\n' +
            '[C]biết dòng đời lắm nhiều con sóng [D]phũ phàng... [G7] Cho lứa\n' +
            '[Em]đôi chia phôi đợi chờ cho nhau mãi [Bm]thương nhớ... Cho đến\n' +
            '[C]nay em thuyền [D]đã sang [Em]bờ.',
          chordSchedule: [
            { symbol: 'Em', startBeat: 0, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Am', startBeat: 4, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C', startBeat: 8, durationBeats: 4, arpPattern: 'rising-arp' },
            { symbol: 'D', startBeat: 12, durationBeats: 2, arpPattern: 'falling-arp' },
            { symbol: 'G7', startBeat: 14, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 16, durationBeats: 4, arpPattern: 'rich-block' },
            { symbol: 'Bm', startBeat: 20, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'C', startBeat: 24, durationBeats: 2, arpPattern: 'rising-arp' },
            { symbol: 'D', startBeat: 26, durationBeats: 2, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 28, durationBeats: 4, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-dvnn-outro',
          kind: 'Outro',
          label: 'Outro — Thuyền Đã Sang Bờ',
          bars: 4,
          text: '[Am]Cho đến nay em [Bm]thuyền đã sang [Em]bờ... [Em]',
          chordSchedule: [
            { symbol: 'Am', startBeat: 0, durationBeats: 4, arpPattern: 'falling-arp' },
            { symbol: 'Bm', startBeat: 4, durationBeats: 4, arpPattern: 'pinch-plucked' },
            { symbol: 'Em', startBeat: 8, durationBeats: 4, arpPattern: 'ballad-wave' },
            { symbol: 'Em', startBeat: 12, durationBeats: 4, arpPattern: 'falling-arp' },
          ],
        },
      ],
      melodyNotes: [
        // 1. Intro (8 bars = 32 beats — iconic Chorus-theme Piano Intro in singing octave B4..E5/E4..E5)
        // Bars 1–4: "Lúc đắm đuối em cho rằng tình ta như ánh trăng rằm / Chứ đâu biết dòng đời lắm nhiều con sóng phũ phàng"
        { id: 'dvnni-1', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 0.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-2', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 0.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-3', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 1.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'dvnni-4', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 1.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'dvnni-5', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 2.0, durationBeats: 0.5, velocity: 0.74 },
        { id: 'dvnni-6', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 2.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-7', sectionId: 'sec-dvnn-intro', midi: 69, startBeat: 3.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-8', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 3.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnni-9', sectionId: 'sec-dvnn-intro', midi: 69, startBeat: 4.0, durationBeats: 1.5, velocity: 0.82 },
        { id: 'dvnni-10', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 5.5, durationBeats: 1.5, velocity: 0.76 },
        { id: 'dvnni-11', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 7.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'dvnni-12', sectionId: 'sec-dvnn-intro', midi: 66, startBeat: 7.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'dvnni-13', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 8.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnni-14', sectionId: 'sec-dvnn-intro', midi: 72, startBeat: 8.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnni-15', sectionId: 'sec-dvnn-intro', midi: 72, startBeat: 9.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-16', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 9.5, durationBeats: 1.0, velocity: 0.8 },
        { id: 'dvnni-17', sectionId: 'sec-dvnn-intro', midi: 66, startBeat: 10.5, durationBeats: 0.5, velocity: 0.76 },
        { id: 'dvnni-18', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 11.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-19', sectionId: 'sec-dvnn-intro', midi: 69, startBeat: 11.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-20', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 12.0, durationBeats: 1.5, velocity: 0.78 },
        { id: 'dvnni-21', sectionId: 'sec-dvnn-intro', midi: 62, startBeat: 13.5, durationBeats: 1.5, velocity: 0.76 },
        { id: 'dvnni-22', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 15.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-23', sectionId: 'sec-dvnn-intro', midi: 72, startBeat: 15.5, durationBeats: 0.5, velocity: 0.8 },
        // Bars 5–8: "Cho lứa đôi chia phôi đợi chờ cho nhau mãi thương nhớ / Cho đến nay em thuyền đã sang bờ" + turnaround
        { id: 'dvnni-24', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 16.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnni-25', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 16.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-26', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 17.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-27', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 17.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-28', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 18.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-29', sectionId: 'sec-dvnn-intro', midi: 66, startBeat: 18.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-30', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 19.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnni-31', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 19.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnni-32', sectionId: 'sec-dvnn-intro', midi: 69, startBeat: 20.0, durationBeats: 1.5, velocity: 0.84 },
        { id: 'dvnni-33', sectionId: 'sec-dvnn-intro', midi: 76, startBeat: 21.5, durationBeats: 0.5, velocity: 0.88 },
        { id: 'dvnni-34', sectionId: 'sec-dvnn-intro', midi: 74, startBeat: 22.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'dvnni-35', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 23.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnni-36', sectionId: 'sec-dvnn-intro', midi: 72, startBeat: 23.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnni-37', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 24.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'dvnni-38', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.8 },
        { id: 'dvnni-39', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 25.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnni-40', sectionId: 'sec-dvnn-intro', midi: 67, startBeat: 26.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'dvnni-41', sectionId: 'sec-dvnn-intro', midi: 66, startBeat: 27.0, durationBeats: 1.0, velocity: 0.8 },
        { id: 'dvnni-42', sectionId: 'sec-dvnn-intro', midi: 64, startBeat: 28.0, durationBeats: 2.0, velocity: 0.82 },
        { id: 'dvnni-43', sectionId: 'sec-dvnn-intro', midi: 66, startBeat: 30.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'dvnni-44', sectionId: 'sec-dvnn-intro', midi: 71, startBeat: 31.0, durationBeats: 1.0, velocity: 0.78 },

        // 2. Verse 1 (8 bars = 32 beats, 100% sheet-verified Tone Em)
        // Bar 1 [Em]: B3 B3 B3 G4 | B3 B3
        { id: 'dvnnv1-1', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 0.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-2', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-3', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 1.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv1-4', sectionId: 'sec-dvnn-verse-1', midi: 67, startBeat: 1.5, durationBeats: 2.0, velocity: 0.88 },
        { id: 'dvnnv1-5', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 3.5, durationBeats: 0.25, velocity: 0.76 },
        { id: 'dvnnv1-6', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 3.75, durationBeats: 0.25, velocity: 0.76 },
        // Bar 2 [Em/B]: B3 B3 B3 G4 | G4 A4 B4
        { id: 'dvnnv1-7', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 4.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-8', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 4.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-9', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 5.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv1-10', sectionId: 'sec-dvnn-verse-1', midi: 67, startBeat: 5.5, durationBeats: 1.0, velocity: 0.86 },
        { id: 'dvnnv1-11', sectionId: 'sec-dvnn-verse-1', midi: 67, startBeat: 6.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv1-12', sectionId: 'sec-dvnn-verse-1', midi: 69, startBeat: 7.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnv1-13', sectionId: 'sec-dvnn-verse-1', midi: 71, startBeat: 7.5, durationBeats: 0.5, velocity: 0.88 },
        // Bar 3–4 [Am] -> [Am/E]: C5 C4 D4 C4 (tie across barline)
        { id: 'dvnnv1-14', sectionId: 'sec-dvnn-verse-1', midi: 72, startBeat: 8.0, durationBeats: 1.5, velocity: 0.9 },
        { id: 'dvnnv1-15', sectionId: 'sec-dvnn-verse-1', midi: 60, startBeat: 9.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'dvnnv1-16', sectionId: 'sec-dvnn-verse-1', midi: 62, startBeat: 10.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-17', sectionId: 'sec-dvnn-verse-1', midi: 60, startBeat: 10.5, durationBeats: 5.0, velocity: 0.84 },
        // Bar 5 [Dm]: B3 B3 B3 F4 ("Vào mùa trăng đó")
        { id: 'dvnnv1-18', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 16.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-19', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 16.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv1-20', sectionId: 'sec-dvnn-verse-1', midi: 59, startBeat: 17.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv1-21', sectionId: 'sec-dvnn-verse-1', midi: 65, startBeat: 17.5, durationBeats: 2.5, velocity: 0.86 },
        // Bar 6 [D7]: F#4 F#4 G4 A4 | G4 A4 C5 ("Nàng từ phương xa về như giấc")
        { id: 'dvnnv1-22', sectionId: 'sec-dvnn-verse-1', midi: 66, startBeat: 20.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv1-23', sectionId: 'sec-dvnn-verse-1', midi: 66, startBeat: 20.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv1-24', sectionId: 'sec-dvnn-verse-1', midi: 67, startBeat: 21.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv1-25', sectionId: 'sec-dvnn-verse-1', midi: 69, startBeat: 21.5, durationBeats: 1.0, velocity: 0.88 },
        { id: 'dvnnv1-26', sectionId: 'sec-dvnn-verse-1', midi: 67, startBeat: 22.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv1-27', sectionId: 'sec-dvnn-verse-1', midi: 69, startBeat: 23.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnv1-28', sectionId: 'sec-dvnn-verse-1', midi: 72, startBeat: 23.5, durationBeats: 0.5, velocity: 0.88 },
        // Bar 7–8 [G] -> [B7]: B4 ("mơ.")
        { id: 'dvnnv1-29', sectionId: 'sec-dvnn-verse-1', midi: 71, startBeat: 24.0, durationBeats: 6.0, velocity: 0.88 },

        // 3. Verse 2 (8 bars = 32 beats, 100% sheet-verified Tone Em)
        // Bar 9 [Em]: B3 B3 B3 G4 | B3 B3
        { id: 'dvnnv2-1', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 0.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv2-2', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 0.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv2-3', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 1.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv2-4', sectionId: 'sec-dvnn-verse-2', midi: 67, startBeat: 1.5, durationBeats: 2.0, velocity: 0.88 },
        { id: 'dvnnv2-5', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 3.5, durationBeats: 0.25, velocity: 0.76 },
        { id: 'dvnnv2-6', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 3.75, durationBeats: 0.25, velocity: 0.76 },
        // Bar 10 [Em/B]: B3 B3 G4 | G4 A4 B4
        { id: 'dvnnv2-7', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 4.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv2-8', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 4.5, durationBeats: 1.0, velocity: 0.82 },
        { id: 'dvnnv2-9', sectionId: 'sec-dvnn-verse-2', midi: 67, startBeat: 5.5, durationBeats: 1.0, velocity: 0.86 },
        { id: 'dvnnv2-10', sectionId: 'sec-dvnn-verse-2', midi: 67, startBeat: 6.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv2-11', sectionId: 'sec-dvnn-verse-2', midi: 69, startBeat: 7.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnv2-12', sectionId: 'sec-dvnn-verse-2', midi: 71, startBeat: 7.5, durationBeats: 0.5, velocity: 0.88 },
        // Bar 11–12 [Am] -> [Am/E] -> [G7]: A4 ("đắm") A4 ("say.") ... B4 ("Ánh")
        { id: 'dvnnv2-13', sectionId: 'sec-dvnn-verse-2', midi: 69, startBeat: 8.0, durationBeats: 1.5, velocity: 0.88 },
        { id: 'dvnnv2-14', sectionId: 'sec-dvnn-verse-2', midi: 69, startBeat: 9.5, durationBeats: 4.5, velocity: 0.86 },
        { id: 'dvnnv2-15', sectionId: 'sec-dvnn-verse-2', midi: 71, startBeat: 15.5, durationBeats: 0.5, velocity: 0.86 },
        // Bar 13 [C]: B4 G4 G4 E4 E4 C4 A4 ("mắt ngây thơ như ru hồn. Rũ")
        { id: 'dvnnv2-16', sectionId: 'sec-dvnn-verse-2', midi: 71, startBeat: 16.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'dvnnv2-17', sectionId: 'sec-dvnn-verse-2', midi: 67, startBeat: 16.5, durationBeats: 0.5, velocity: 0.85 },
        { id: 'dvnnv2-18', sectionId: 'sec-dvnn-verse-2', midi: 67, startBeat: 17.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv2-19', sectionId: 'sec-dvnn-verse-2', midi: 64, startBeat: 17.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv2-20', sectionId: 'sec-dvnn-verse-2', midi: 64, startBeat: 18.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv2-21', sectionId: 'sec-dvnn-verse-2', midi: 60, startBeat: 18.5, durationBeats: 1.0, velocity: 0.82 },
        { id: 'dvnnv2-22', sectionId: 'sec-dvnn-verse-2', midi: 69, startBeat: 19.5, durationBeats: 0.5, velocity: 0.86 },
        // Bar 14 [Am] -> [Bm]: A4 F#4 F#4 D4 D4 B3 ("áo phong sương em vui tình")
        { id: 'dvnnv2-23', sectionId: 'sec-dvnn-verse-2', midi: 69, startBeat: 20.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnv2-24', sectionId: 'sec-dvnn-verse-2', midi: 66, startBeat: 20.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnv2-25', sectionId: 'sec-dvnn-verse-2', midi: 66, startBeat: 21.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnv2-26', sectionId: 'sec-dvnn-verse-2', midi: 62, startBeat: 21.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'dvnnv2-27', sectionId: 'sec-dvnn-verse-2', midi: 62, startBeat: 22.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'dvnnv2-28', sectionId: 'sec-dvnn-verse-2', midi: 59, startBeat: 23.0, durationBeats: 1.0, velocity: 0.8 },
        // Bar 15–16 [Em] -> [Em/B]: E4 ("duyên.") + pickup B4 B4 ("Lúc đắm")
        { id: 'dvnnv2-29', sectionId: 'sec-dvnn-verse-2', midi: 64, startBeat: 24.0, durationBeats: 7.0, velocity: 0.86 },
        { id: 'dvnnv2-30', sectionId: 'sec-dvnn-verse-2', midi: 71, startBeat: 31.5, durationBeats: 0.25, velocity: 0.84 },
        { id: 'dvnnv2-31', sectionId: 'sec-dvnn-verse-2', midi: 71, startBeat: 31.75, durationBeats: 0.25, velocity: 0.86 },

        // 4. Chorus (8 bars = 32 beats, 100% sheet-verified Page 2)
        // Bar 17 [Em]: B4 G4 G4 E4 E4 G4 A4 B4
        { id: 'dvnnc-1', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 0.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'dvnnc-2', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 0.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnc-3', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 1.0, durationBeats: 0.5, velocity: 0.85 },
        { id: 'dvnnc-4', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 1.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-5', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 2.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-6', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 2.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnc-7', sectionId: 'sec-dvnn-chorus', midi: 69, startBeat: 3.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'dvnnc-8', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 3.5, durationBeats: 0.5, velocity: 0.9 },
        // Bar 18 [Am]: A4 D4 G4 A4 ("trăng rằm. Chứ đâu")
        { id: 'dvnnc-9', sectionId: 'sec-dvnn-chorus', midi: 69, startBeat: 4.0, durationBeats: 1.5, velocity: 0.9 },
        { id: 'dvnnc-10', sectionId: 'sec-dvnn-chorus', midi: 62, startBeat: 5.5, durationBeats: 2.0, velocity: 0.85 },
        { id: 'dvnnc-11', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 7.5, durationBeats: 0.25, velocity: 0.82 },
        { id: 'dvnnc-12', sectionId: 'sec-dvnn-chorus', midi: 69, startBeat: 7.75, durationBeats: 0.25, velocity: 0.84 },
        // Bar 19 [C]: B4 C4 C4 G4 F#4 G4 A4 ("biết dòng đời lắm nhiều con sóng")
        { id: 'dvnnc-13', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 8.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'dvnnc-14', sectionId: 'sec-dvnn-chorus', midi: 60, startBeat: 8.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnc-15', sectionId: 'sec-dvnn-chorus', midi: 60, startBeat: 9.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'dvnnc-16', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 9.5, durationBeats: 1.0, velocity: 0.88 },
        { id: 'dvnnc-17', sectionId: 'sec-dvnn-chorus', midi: 66, startBeat: 10.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-18', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 11.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnc-19', sectionId: 'sec-dvnn-chorus', midi: 69, startBeat: 11.5, durationBeats: 0.5, velocity: 0.88 },
        // Bar 20 [D] -> [G7]: E4(1.5 "phũ") D4(2.0 "phàng.") B4 C5 ("Cho lứa")
        { id: 'dvnnc-20', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 12.0, durationBeats: 1.5, velocity: 0.86 },
        { id: 'dvnnc-21', sectionId: 'sec-dvnn-chorus', midi: 62, startBeat: 13.5, durationBeats: 2.0, velocity: 0.86 },
        { id: 'dvnnc-22', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 15.5, durationBeats: 0.25, velocity: 0.86 },
        { id: 'dvnnc-23', sectionId: 'sec-dvnn-chorus', midi: 72, startBeat: 15.75, durationBeats: 0.25, velocity: 0.88 },
        // Bar 21 [Em]: B4 G4 G4 E4 E4 F#4 G4 B4
        { id: 'dvnnc-24', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 16.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'dvnnc-25', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 16.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnc-26', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 17.0, durationBeats: 0.5, velocity: 0.85 },
        { id: 'dvnnc-27', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 17.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-28', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 18.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-29', sectionId: 'sec-dvnn-chorus', midi: 66, startBeat: 18.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'dvnnc-30', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 19.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'dvnnc-31', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 19.5, durationBeats: 0.5, velocity: 0.9 },
        // Bar 22 [Bm]: A4 E5 D5 | B4 C5 ("thương nhớ... Cho đến")
        { id: 'dvnnc-32', sectionId: 'sec-dvnn-chorus', midi: 69, startBeat: 20.0, durationBeats: 1.5, velocity: 0.9 },
        { id: 'dvnnc-33', sectionId: 'sec-dvnn-chorus', midi: 76, startBeat: 21.5, durationBeats: 0.5, velocity: 0.94 },
        { id: 'dvnnc-34', sectionId: 'sec-dvnn-chorus', midi: 74, startBeat: 22.0, durationBeats: 0.75, velocity: 0.9 },
        { id: 'dvnnc-35', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 23.5, durationBeats: 0.25, velocity: 0.86 },
        { id: 'dvnnc-36', sectionId: 'sec-dvnn-chorus', midi: 72, startBeat: 23.75, durationBeats: 0.25, velocity: 0.88 },
        // Bar 23–24 [C] -> [D] -> [Em]: B4(0.75 "nay") G4(0.75 "em") E4(0.5 "thuyền") G4(1.0 "đã") F#4(1.0 "sang") E4(4.0 "bờ.")
        { id: 'dvnnc-37', sectionId: 'sec-dvnn-chorus', midi: 71, startBeat: 24.0, durationBeats: 0.75, velocity: 0.9 },
        { id: 'dvnnc-38', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 24.75, durationBeats: 0.75, velocity: 0.86 },
        { id: 'dvnnc-39', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 25.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'dvnnc-40', sectionId: 'sec-dvnn-chorus', midi: 67, startBeat: 26.0, durationBeats: 1.0, velocity: 0.88 },
        { id: 'dvnnc-41', sectionId: 'sec-dvnn-chorus', midi: 66, startBeat: 27.0, durationBeats: 1.0, velocity: 0.88 },
        { id: 'dvnnc-42', sectionId: 'sec-dvnn-chorus', midi: 64, startBeat: 28.0, durationBeats: 4.0, velocity: 0.9 },

        // 5. Outro (4 bars = 16 beats — expressive piano echo of "Cho đến nay em thuyền đã sang bờ")
        { id: 'dvnno-1', sectionId: 'sec-dvnn-outro', midi: 71, startBeat: 0.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'dvnno-2', sectionId: 'sec-dvnn-outro', midi: 72, startBeat: 0.75, durationBeats: 0.75, velocity: 0.82 },
        { id: 'dvnno-3', sectionId: 'sec-dvnn-outro', midi: 69, startBeat: 1.5, durationBeats: 1.5, velocity: 0.8 },
        { id: 'dvnno-4', sectionId: 'sec-dvnn-outro', midi: 67, startBeat: 3.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'dvnno-5', sectionId: 'sec-dvnn-outro', midi: 71, startBeat: 4.0, durationBeats: 1.0, velocity: 0.8 },
        { id: 'dvnno-6', sectionId: 'sec-dvnn-outro', midi: 69, startBeat: 5.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'dvnno-7', sectionId: 'sec-dvnn-outro', midi: 67, startBeat: 6.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'dvnno-8', sectionId: 'sec-dvnn-outro', midi: 66, startBeat: 7.0, durationBeats: 1.0, velocity: 0.76 },
        { id: 'dvnno-9', sectionId: 'sec-dvnn-outro', midi: 64, startBeat: 8.0, durationBeats: 2.0, velocity: 0.8 },
        { id: 'dvnno-10', sectionId: 'sec-dvnn-outro', midi: 71, startBeat: 10.0, durationBeats: 2.0, velocity: 0.78 },
        { id: 'dvnno-11', sectionId: 'sec-dvnn-outro', midi: 76, startBeat: 12.0, durationBeats: 4.0, velocity: 0.78 },
      ],
    },
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
      id: 'draft-thang-tu-la-loi-noi-doi-cua-em',
      title: 'Tháng Tư Là Lời Nói Dối Của Em (Tone C)',
      keyRoot: 'C',
      scaleMode: 'major',
      timeSignature: '2/4',
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
          id: 'sec-tt-verse-1a',
          kind: 'Verse',
          label: '1A. Mùa Xuân Có Em (Ô 1–8)',
          bars: 8,
          text:
            '[F] Mùa xuân có [G7/F]em như chưa [Em]bắt [Am]đầu\n' +
            '[Dm7] Và cơn [G]gió đang khẽ mơn man lay từng nhành [Am]hoa rơi',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 2.0, arpPattern: 'arp-ballad-1' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'arp-ballad-1' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Am', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'rising-arp' },
          ],
        },
        {
          id: 'sec-tt-verse-1b',
          kind: 'Verse',
          label: '1B. Em Đã Bước Tới (Ô 9–16)',
          bars: 8,
          text:
            '[F] Em đã bước [G7/F]tới như em [Em]đã [Am]từng\n' +
            '[Dm7]Chạy trốn với anh trên [Em]cánh đồng [Asus4]xanh [A]',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 2.0, arpPattern: 'arp-ballad-1' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 4.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Em', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Asus4', startBeat: 14.0, durationBeats: 1.0, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 15.0, durationBeats: 1.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-verse-2a',
          kind: 'Verse',
          label: '2A. Khúc Nhạc Nắng Chiều (Ô 17–24)',
          bars: 8,
          text:
            '[Fmaj7]Khúc nhạc hòa cùng nắng chiều dịu dàng [Em]để mình gần lại [Am]mãi\n' +
            'Nói lời [Dm7]thì thầm những điều [G]thật thà đã [Cmaj7]giữ trong tim mình [C7/G] Những',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0.0, durationBeats: 4.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'lofi-broken' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Cmaj7', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'C7/G', startBeat: 14.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
          ],
        },
        {
          id: 'sec-tt-verse-2b',
          kind: 'Verse',
          label: '2B. Tháng Tư Mỉm Cười (Ô 25–32)',
          bars: 8,
          text:
            '[Fmaj7]chặng đường dài ngỡ mình mệt nhoài [Em]đã một lần gục [Am]ngã\n' +
            'Tháng [Dm7]tư có em [Em]ở đây nhìn tôi [Asus4]mỉm [A]cười',
          chordSchedule: [
            { symbol: 'Fmaj7', startBeat: 0.0, durationBeats: 4.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Asus4', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 14.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-1a',
          kind: 'Chorus',
          label: 'ĐK 1A — Những Cánh Hoa (𝄋 Ô 33–40)',
          bars: 8,
          text:
            'Những cánh hoa [F]phai tàn thật [G7/F]nhanh, em có [Em7]bay xa, em có [Am]đi xa mãi\n' +
            'Tháng tư đôi khi [Dm7]thật mong [G]manh để mình nói [C]ra những câu chân thật',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.6, durationBeats: 1.4, arpPattern: 'rich-block' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'arp-ballad-3' },
            { symbol: 'Em7', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Dm7', startBeat: 9.0, durationBeats: 1.0, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'arp-ballad-drive' },
            { symbol: 'C', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-1b',
          kind: 'Chorus',
          label: 'ĐK 1B — Mây Gió Tháng Tư (Fine Ô 41–48)',
          bars: 8,
          text:
            'Giá như tôi một [F]lần tin [Fm]em, cô gái [Em]tôi thương, nay hóa theo [D#dim7]mây gió\n' +
            'Để [Dm7]lại tháng [Em]tư ở [A]đó',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.9, durationBeats: 1.3, arpPattern: 'rich-block' },
            { symbol: 'Fm', startBeat: 2.2, durationBeats: 1.8, arpPattern: 'falling-arp' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'arp-ballad-3' },
            { symbol: 'D#dim7', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Em', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'A', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-interlude',
          kind: 'Interlude',
          label: 'Gian Tấu — Piano Solo (Ô 49–57)',
          bars: 8,
          text:
            '[F](Piano solo chủ đề) [Fm](Chuyển thứ sâu lắng) [C/E](Đỉnh cao giai điệu) [Ddim7](Đi lên) [Dm7](Chạy ngón) [G](Dẫn cầu nối)',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 3.0, arpPattern: 'rising-arp' },
            { symbol: 'Fm', startBeat: 3.0, durationBeats: 3.0, arpPattern: 'falling-arp' },
            { symbol: 'C/E', startBeat: 6.0, durationBeats: 4.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'Ddim7', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'arp-ballad-drive' },
            { symbol: 'G', startBeat: 14.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-bridge-a',
          kind: 'Bridge',
          label: 'Bridge 1 — Và Tôi Sẽ Sống (Ô 58–64)',
          bars: 8,
          text:
            '[F] Và tôi sẽ [G7/F]sống như những [Em]gì em từng [Am]mơ\n' +
            '[Dm7] Và tôi sẽ [G]bước tiếp trên con đường mình [Am]đã chọn',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'arp-ballad-2' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'arp-ballad-drive' },
            { symbol: 'Am', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'falling-arp' },
          ],
        },
        {
          id: 'sec-tt-bridge-b',
          kind: 'Bridge',
          label: 'Bridge 2 — Cô Gái Tháng Tư (D.S. Ô 65–72)',
          bars: 8,
          text:
            '[F] Và khi tôi [G7/F]chết sẽ mỉm [Em]cười khi gặp [Am]em\n' +
            '[Dm7] Khẽ chào cô gái [Em]tháng tư của [Asus4]tôi [A] (Những kỷ niệm)',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.0, durationBeats: 2.0, arpPattern: 'rich-block' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Em', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Asus4', startBeat: 12.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'A', startBeat: 14.0, durationBeats: 2.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-2a',
          kind: 'Chorus',
          label: 'ĐK 2A — Những Kỷ Niệm Phai (D.S. al Fine)',
          bars: 8,
          text:
            'Những kỷ niệm [F]phai tàn thật [G7/F]nhanh, em đã [Em7]bay xa, em đã [Am]đi xa mãi\n' +
            'Tháng tư đôi khi [Dm7]thật mong [G]manh để mình nói [C]ra những câu chân thật',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.6, durationBeats: 1.4, arpPattern: 'rich-block' },
            { symbol: 'G7/F', startBeat: 2.0, durationBeats: 2.0, arpPattern: 'arp-ballad-3' },
            { symbol: 'Em7', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'falling-arp' },
            { symbol: 'Am', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'Dm7', startBeat: 9.0, durationBeats: 1.0, arpPattern: 'ballad-wave' },
            { symbol: 'G', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'arp-ballad-drive' },
            { symbol: 'C', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'rich-block' },
          ],
        },
        {
          id: 'sec-tt-chorus-2b',
          kind: 'Chorus',
          label: 'ĐK 2B — Tháng Tư Mình Anh (Fine)',
          bars: 8,
          text:
            'Giá như tôi một [F]lần tin [Fm]em, cô gái [Em]tôi thương, nay hóa theo [D#dim7]mây gió\n' +
            'Để [Dm7]lại tháng [Em]tư mình [A]anh',
          chordSchedule: [
            { symbol: 'F', startBeat: 0.9, durationBeats: 1.3, arpPattern: 'rich-block' },
            { symbol: 'Fm', startBeat: 2.2, durationBeats: 1.8, arpPattern: 'falling-arp' },
            { symbol: 'Em', startBeat: 4.0, durationBeats: 2.0, arpPattern: 'arp-ballad-3' },
            { symbol: 'D#dim7', startBeat: 6.0, durationBeats: 2.0, arpPattern: 'pinch-plucked' },
            { symbol: 'Dm7', startBeat: 8.0, durationBeats: 2.0, arpPattern: 'ballad-wave' },
            { symbol: 'Em', startBeat: 10.0, durationBeats: 2.0, arpPattern: 'rising-arp' },
            { symbol: 'A', startBeat: 12.0, durationBeats: 4.0, arpPattern: 'falling-arp' },
          ],
        },
      ],
      melodyNotes: [
        // 1A. Verse 1A (2/4, 8 bars = 16 beats: Ô 1–8)
        { id: 'ttv1a-1', sectionId: 'sec-tt-verse-1a', midi: 65, startBeat: 1.0, durationBeats: 0.33, velocity: 0.78 },
        { id: 'ttv1a-2', sectionId: 'sec-tt-verse-1a', midi: 67, startBeat: 1.33, durationBeats: 0.33, velocity: 0.8 },
        { id: 'ttv1a-3', sectionId: 'sec-tt-verse-1a', midi: 69, startBeat: 1.66, durationBeats: 0.34, velocity: 0.84 },
        { id: 'ttv1a-4', sectionId: 'sec-tt-verse-1a', midi: 67, startBeat: 2.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'ttv1a-5', sectionId: 'sec-tt-verse-1a', midi: 65, startBeat: 2.75, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv1a-6', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 3.25, durationBeats: 0.75, velocity: 0.76 },
        { id: 'ttv1a-7', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 4.0, durationBeats: 0.75, velocity: 0.8 },
        { id: 'ttv1a-8', sectionId: 'sec-tt-verse-1a', midi: 62, startBeat: 4.75, durationBeats: 1.25, velocity: 0.76 },
        { id: 'ttv1a-9', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 6.0, durationBeats: 2.0, velocity: 0.8 },
        { id: 'ttv1a-10', sectionId: 'sec-tt-verse-1a', midi: 62, startBeat: 9.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv1a-11', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 9.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1a-12', sectionId: 'sec-tt-verse-1a', midi: 65, startBeat: 10.0, durationBeats: 0.75, velocity: 0.82 },
        { id: 'ttv1a-13', sectionId: 'sec-tt-verse-1a', midi: 65, startBeat: 10.75, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1a-14', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 11.25, durationBeats: 0.4, velocity: 0.78 },
        { id: 'ttv1a-15', sectionId: 'sec-tt-verse-1a', midi: 62, startBeat: 11.65, durationBeats: 0.35, velocity: 0.76 },
        { id: 'ttv1a-16', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 12.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1a-17', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 12.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1a-18', sectionId: 'sec-tt-verse-1a', midi: 62, startBeat: 13.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'ttv1a-19', sectionId: 'sec-tt-verse-1a', midi: 60, startBeat: 13.5, durationBeats: 0.5, velocity: 0.74 },
        { id: 'ttv1a-20', sectionId: 'sec-tt-verse-1a', midi: 62, startBeat: 14.0, durationBeats: 0.5, velocity: 0.76 },
        { id: 'ttv1a-21', sectionId: 'sec-tt-verse-1a', midi: 64, startBeat: 14.5, durationBeats: 1.5, velocity: 0.8 },

        // 1B. Verse 1B (2/4, 8 bars = 16 beats: Ô 9–16)
        { id: 'ttv1b-1', sectionId: 'sec-tt-verse-1b', midi: 65, startBeat: 1.0, durationBeats: 0.33, velocity: 0.8 },
        { id: 'ttv1b-2', sectionId: 'sec-tt-verse-1b', midi: 67, startBeat: 1.33, durationBeats: 0.33, velocity: 0.82 },
        { id: 'ttv1b-3', sectionId: 'sec-tt-verse-1b', midi: 69, startBeat: 1.66, durationBeats: 0.34, velocity: 0.84 },
        { id: 'ttv1b-4', sectionId: 'sec-tt-verse-1b', midi: 67, startBeat: 2.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'ttv1b-5', sectionId: 'sec-tt-verse-1b', midi: 65, startBeat: 2.75, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1b-6', sectionId: 'sec-tt-verse-1b', midi: 64, startBeat: 3.25, durationBeats: 0.75, velocity: 0.78 },
        { id: 'ttv1b-7', sectionId: 'sec-tt-verse-1b', midi: 67, startBeat: 4.0, durationBeats: 1.0, velocity: 0.82 },
        { id: 'ttv1b-8', sectionId: 'sec-tt-verse-1b', midi: 64, startBeat: 5.0, durationBeats: 1.0, velocity: 0.78 },
        { id: 'ttv1b-9', sectionId: 'sec-tt-verse-1b', midi: 64, startBeat: 6.0, durationBeats: 1.5, velocity: 0.8 },
        { id: 'ttv1b-10', sectionId: 'sec-tt-verse-1b', midi: 62, startBeat: 8.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv1b-11', sectionId: 'sec-tt-verse-1b', midi: 64, startBeat: 8.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv1b-12', sectionId: 'sec-tt-verse-1b', midi: 65, startBeat: 9.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv1b-13', sectionId: 'sec-tt-verse-1b', midi: 62, startBeat: 9.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv1b-14', sectionId: 'sec-tt-verse-1b', midi: 65, startBeat: 10.0, durationBeats: 1.5, velocity: 0.82 },
        { id: 'ttv1b-15', sectionId: 'sec-tt-verse-1b', midi: 67, startBeat: 12.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'ttv1b-16', sectionId: 'sec-tt-verse-1b', midi: 67, startBeat: 13.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'ttv1b-17', sectionId: 'sec-tt-verse-1b', midi: 69, startBeat: 14.0, durationBeats: 1.0, velocity: 0.86 },
        { id: 'ttv1b-18', sectionId: 'sec-tt-verse-1b', midi: 69, startBeat: 15.0, durationBeats: 1.0, velocity: 0.84 },

        // 2A. Verse 2A (2/4, 8 bars = 16 beats: Ô 17–24)
        { id: 'ttv2a-1', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 0.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2a-2', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 0.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-3', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 1.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-4', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 1.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-5', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 2.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2a-6', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 2.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-7', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 3.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-8', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 3.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-9', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 4.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-10', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 4.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-11', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 5.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-12', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 5.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-13', sectionId: 'sec-tt-verse-2a', midi: 76, startBeat: 6.0, durationBeats: 1.0, velocity: 0.88 },
        { id: 'ttv2a-14', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 7.4, durationBeats: 0.3, velocity: 0.78 },
        { id: 'ttv2a-15', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 7.7, durationBeats: 0.3, velocity: 0.82 },
        { id: 'ttv2a-16', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 8.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2a-17', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 8.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-18', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 9.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-19', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 9.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2a-20', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 10.0, durationBeats: 0.65, velocity: 0.82 },
        { id: 'ttv2a-21', sectionId: 'sec-tt-verse-2a', midi: 69, startBeat: 10.65, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2a-22', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 11.25, durationBeats: 0.75, velocity: 0.82 },
        { id: 'ttv2a-23', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 12.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-24', sectionId: 'sec-tt-verse-2a', midi: 67, startBeat: 12.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2a-25', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 13.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttv2a-26', sectionId: 'sec-tt-verse-2a', midi: 62, startBeat: 13.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttv2a-27', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 14.0, durationBeats: 1.25, velocity: 0.82 },
        { id: 'ttv2a-28', sectionId: 'sec-tt-verse-2a', midi: 64, startBeat: 15.5, durationBeats: 0.5, velocity: 0.8 },

        // 2B. Verse 2B (2/4, 8 bars = 16 beats: Ô 25–32)
        { id: 'ttv2b-1', sectionId: 'sec-tt-verse-2b', midi: 64, startBeat: 0.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2b-2', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 0.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-3', sectionId: 'sec-tt-verse-2b', midi: 67, startBeat: 1.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2b-4', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 1.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-5', sectionId: 'sec-tt-verse-2b', midi: 64, startBeat: 2.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2b-6', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 2.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-7', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 3.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'ttv2b-8', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 4.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-9', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 4.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-10', sectionId: 'sec-tt-verse-2b', midi: 67, startBeat: 5.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2b-11', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 5.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-12', sectionId: 'sec-tt-verse-2b', midi: 76, startBeat: 6.0, durationBeats: 1.35, velocity: 0.88 },
        { id: 'ttv2b-13', sectionId: 'sec-tt-verse-2b', midi: 72, startBeat: 7.45, durationBeats: 0.55, velocity: 0.84 },
        { id: 'ttv2b-14', sectionId: 'sec-tt-verse-2b', midi: 72, startBeat: 8.0, durationBeats: 0.65, velocity: 0.86 },
        { id: 'ttv2b-15', sectionId: 'sec-tt-verse-2b', midi: 71, startBeat: 8.65, durationBeats: 0.6, velocity: 0.84 },
        { id: 'ttv2b-16', sectionId: 'sec-tt-verse-2b', midi: 72, startBeat: 9.25, durationBeats: 0.75, velocity: 0.86 },
        { id: 'ttv2b-17', sectionId: 'sec-tt-verse-2b', midi: 71, startBeat: 10.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-18', sectionId: 'sec-tt-verse-2b', midi: 72, startBeat: 10.5, durationBeats: 0.5, velocity: 0.86 },
        { id: 'ttv2b-19', sectionId: 'sec-tt-verse-2b', midi: 71, startBeat: 11.0, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttv2b-20', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 11.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttv2b-21', sectionId: 'sec-tt-verse-2b', midi: 67, startBeat: 12.0, durationBeats: 2.0, velocity: 0.84 },
        { id: 'ttv2b-22', sectionId: 'sec-tt-verse-2b', midi: 69, startBeat: 14.0, durationBeats: 1.75, velocity: 0.86 },

        // ĐK 1A (2/4, 8 bars = 16 beats: Ô 33–40)
        { id: 'ttc1a-1', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 0.0, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc1a-2', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 0.2, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc1a-3', sectionId: 'sec-tt-chorus-1a', midi: 72, startBeat: 0.4, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc1a-4', sectionId: 'sec-tt-chorus-1a', midi: 69, startBeat: 0.6, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc1a-5', sectionId: 'sec-tt-chorus-1a', midi: 72, startBeat: 1.1, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1a-6', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 1.55, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc1a-7', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 2.0, durationBeats: 0.9, velocity: 0.9 },
        { id: 'ttc1a-8', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 3.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'ttc1a-9', sectionId: 'sec-tt-chorus-1a', midi: 79, startBeat: 3.5, durationBeats: 0.5, velocity: 0.92 },
        { id: 'ttc1a-10', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 4.0, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1a-11', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 4.45, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc1a-12', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 5.2, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1a-13', sectionId: 'sec-tt-chorus-1a', midi: 79, startBeat: 5.6, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc1a-14', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 6.0, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1a-15', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 6.4, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc1a-16', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 6.8, durationBeats: 1.0, velocity: 0.9 },
        { id: 'ttc1a-17', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 8.0, durationBeats: 0.25, velocity: 0.88 },
        { id: 'ttc1a-18', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 8.25, durationBeats: 0.25, velocity: 0.86 },
        { id: 'ttc1a-19', sectionId: 'sec-tt-chorus-1a', midi: 72, startBeat: 8.5, durationBeats: 0.25, velocity: 0.86 },
        { id: 'ttc1a-20', sectionId: 'sec-tt-chorus-1a', midi: 71, startBeat: 8.75, durationBeats: 0.25, velocity: 0.84 },
        { id: 'ttc1a-21', sectionId: 'sec-tt-chorus-1a', midi: 69, startBeat: 9.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc1a-22', sectionId: 'sec-tt-chorus-1a', midi: 72, startBeat: 9.5, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc1a-23', sectionId: 'sec-tt-chorus-1a', midi: 74, startBeat: 10.0, durationBeats: 0.9, velocity: 0.9 },
        { id: 'ttc1a-24', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 11.0, durationBeats: 0.33, velocity: 0.9 },
        { id: 'ttc1a-25', sectionId: 'sec-tt-chorus-1a', midi: 79, startBeat: 11.33, durationBeats: 0.33, velocity: 0.92 },
        { id: 'ttc1a-26', sectionId: 'sec-tt-chorus-1a', midi: 84, startBeat: 11.66, durationBeats: 0.34, velocity: 0.94 },
        { id: 'ttc1a-27', sectionId: 'sec-tt-chorus-1a', midi: 83, startBeat: 12.0, durationBeats: 0.55, velocity: 0.92 },
        { id: 'ttc1a-28', sectionId: 'sec-tt-chorus-1a', midi: 84, startBeat: 12.55, durationBeats: 0.45, velocity: 0.94 },
        { id: 'ttc1a-29', sectionId: 'sec-tt-chorus-1a', midi: 83, startBeat: 13.0, durationBeats: 0.45, velocity: 0.92 },
        { id: 'ttc1a-30', sectionId: 'sec-tt-chorus-1a', midi: 79, startBeat: 13.45, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc1a-31', sectionId: 'sec-tt-chorus-1a', midi: 76, startBeat: 14.0, durationBeats: 1.5, velocity: 0.88 },

        // ĐK 1B (2/4, 8 bars = 16 beats: Ô 41–48 Fine)
        { id: 'ttc1b-1', sectionId: 'sec-tt-chorus-1b', midi: 76, startBeat: 0.0, durationBeats: 0.22, velocity: 0.88 },
        { id: 'ttc1b-2', sectionId: 'sec-tt-chorus-1b', midi: 74, startBeat: 0.22, durationBeats: 0.22, velocity: 0.86 },
        { id: 'ttc1b-3', sectionId: 'sec-tt-chorus-1b', midi: 72, startBeat: 0.44, durationBeats: 0.22, velocity: 0.86 },
        { id: 'ttc1b-4', sectionId: 'sec-tt-chorus-1b', midi: 71, startBeat: 0.66, durationBeats: 0.24, velocity: 0.84 },
        { id: 'ttc1b-5', sectionId: 'sec-tt-chorus-1b', midi: 69, startBeat: 0.9, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc1b-6', sectionId: 'sec-tt-chorus-1b', midi: 72, startBeat: 1.55, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc1b-7', sectionId: 'sec-tt-chorus-1b', midi: 74, startBeat: 2.2, durationBeats: 0.85, velocity: 0.9 },
        { id: 'ttc1b-8', sectionId: 'sec-tt-chorus-1b', midi: 76, startBeat: 3.15, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc1b-9', sectionId: 'sec-tt-chorus-1b', midi: 79, startBeat: 3.55, durationBeats: 0.45, velocity: 0.92 },
        { id: 'ttc1b-10', sectionId: 'sec-tt-chorus-1b', midi: 74, startBeat: 4.0, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc1b-11', sectionId: 'sec-tt-chorus-1b', midi: 74, startBeat: 4.45, durationBeats: 0.6, velocity: 0.9 },
        { id: 'ttc1b-12', sectionId: 'sec-tt-chorus-1b', midi: 76, startBeat: 5.1, durationBeats: 0.3, velocity: 0.9 },
        { id: 'ttc1b-13', sectionId: 'sec-tt-chorus-1b', midi: 79, startBeat: 5.4, durationBeats: 0.3, velocity: 0.92 },
        { id: 'ttc1b-14', sectionId: 'sec-tt-chorus-1b', midi: 76, startBeat: 5.7, durationBeats: 0.3, velocity: 0.9 },
        { id: 'ttc1b-15', sectionId: 'sec-tt-chorus-1b', midi: 72, startBeat: 6.0, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc1b-16', sectionId: 'sec-tt-chorus-1b', midi: 69, startBeat: 6.65, durationBeats: 0.75, velocity: 0.86 },
        { id: 'ttc1b-17', sectionId: 'sec-tt-chorus-1b', midi: 67, startBeat: 7.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttc1b-18', sectionId: 'sec-tt-chorus-1b', midi: 69, startBeat: 8.0, durationBeats: 0.9, velocity: 0.88 },
        { id: 'ttc1b-19', sectionId: 'sec-tt-chorus-1b', midi: 76, startBeat: 9.0, durationBeats: 1.0, velocity: 0.9 },
        { id: 'ttc1b-20', sectionId: 'sec-tt-chorus-1b', midi: 74, startBeat: 10.0, durationBeats: 0.95, velocity: 0.9 },
        { id: 'ttc1b-21', sectionId: 'sec-tt-chorus-1b', midi: 79, startBeat: 11.0, durationBeats: 1.0, velocity: 0.92 },
        { id: 'ttc1b-22', sectionId: 'sec-tt-chorus-1b', midi: 81, startBeat: 12.0, durationBeats: 3.5, velocity: 0.94 },

        // Gian tấu Piano Solo (2/4, 8 bars = 16 beats: Ô 49–57)
        { id: 'tti-1', sectionId: 'sec-tt-interlude', midi: 69, startBeat: 0.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-2', sectionId: 'sec-tt-interlude', midi: 70, startBeat: 1.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'tti-3', sectionId: 'sec-tt-interlude', midi: 71, startBeat: 1.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'tti-4', sectionId: 'sec-tt-interlude', midi: 76, startBeat: 2.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'tti-5', sectionId: 'sec-tt-interlude', midi: 68, startBeat: 3.5, durationBeats: 0.5, velocity: 0.78 },
        { id: 'tti-6', sectionId: 'sec-tt-interlude', midi: 70, startBeat: 4.0, durationBeats: 0.5, velocity: 0.8 },
        { id: 'tti-7', sectionId: 'sec-tt-interlude', midi: 72, startBeat: 4.5, durationBeats: 0.5, velocity: 0.82 },
        { id: 'tti-8', sectionId: 'sec-tt-interlude', midi: 75, startBeat: 5.0, durationBeats: 1.0, velocity: 0.84 },
        { id: 'tti-9', sectionId: 'sec-tt-interlude', midi: 79, startBeat: 6.0, durationBeats: 1.5, velocity: 0.88 },
        { id: 'tti-10', sectionId: 'sec-tt-interlude', midi: 72, startBeat: 7.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'tti-11', sectionId: 'sec-tt-interlude', midi: 74, startBeat: 8.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'tti-12', sectionId: 'sec-tt-interlude', midi: 76, startBeat: 8.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'tti-13', sectionId: 'sec-tt-interlude', midi: 79, startBeat: 9.0, durationBeats: 0.5, velocity: 0.86 },
        { id: 'tti-14', sectionId: 'sec-tt-interlude', midi: 76, startBeat: 9.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'tti-15', sectionId: 'sec-tt-interlude', midi: 81, startBeat: 10.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'tti-16', sectionId: 'sec-tt-interlude', midi: 83, startBeat: 10.5, durationBeats: 0.5, velocity: 0.9 },
        { id: 'tti-17', sectionId: 'sec-tt-interlude', midi: 84, startBeat: 11.0, durationBeats: 0.5, velocity: 0.92 },
        { id: 'tti-18', sectionId: 'sec-tt-interlude', midi: 83, startBeat: 11.5, durationBeats: 0.5, velocity: 0.88 },
        { id: 'tti-19', sectionId: 'sec-tt-interlude', midi: 84, startBeat: 12.0, durationBeats: 0.25, velocity: 0.9 },
        { id: 'tti-20', sectionId: 'sec-tt-interlude', midi: 83, startBeat: 12.25, durationBeats: 0.25, velocity: 0.88 },
        { id: 'tti-21', sectionId: 'sec-tt-interlude', midi: 81, startBeat: 12.5, durationBeats: 0.25, velocity: 0.86 },
        { id: 'tti-22', sectionId: 'sec-tt-interlude', midi: 79, startBeat: 12.75, durationBeats: 0.25, velocity: 0.84 },
        { id: 'tti-23', sectionId: 'sec-tt-interlude', midi: 77, startBeat: 13.0, durationBeats: 0.25, velocity: 0.82 },
        { id: 'tti-24', sectionId: 'sec-tt-interlude', midi: 76, startBeat: 13.25, durationBeats: 0.25, velocity: 0.8 },
        { id: 'tti-25', sectionId: 'sec-tt-interlude', midi: 74, startBeat: 13.5, durationBeats: 0.25, velocity: 0.78 },
        { id: 'tti-26', sectionId: 'sec-tt-interlude', midi: 72, startBeat: 13.75, durationBeats: 0.25, velocity: 0.76 },
        { id: 'tti-27', sectionId: 'sec-tt-interlude', midi: 79, startBeat: 14.0, durationBeats: 1.5, velocity: 0.84 },

        // Bridge 1 (2/4, 8 bars = 16 beats: Ô 58–64)
        { id: 'ttba-1', sectionId: 'sec-tt-bridge-a', midi: 65, startBeat: 0.75, durationBeats: 0.4, velocity: 0.82 },
        { id: 'ttba-2', sectionId: 'sec-tt-bridge-a', midi: 67, startBeat: 1.15, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttba-3', sectionId: 'sec-tt-bridge-a', midi: 69, startBeat: 1.55, durationBeats: 0.45, velocity: 0.86 },
        { id: 'ttba-4', sectionId: 'sec-tt-bridge-a', midi: 67, startBeat: 2.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'ttba-5', sectionId: 'sec-tt-bridge-a', midi: 65, startBeat: 2.75, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttba-6', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 3.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'ttba-7', sectionId: 'sec-tt-bridge-a', midi: 67, startBeat: 4.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'ttba-8', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 4.75, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttba-9', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 5.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'ttba-10', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 6.0, durationBeats: 2.0, velocity: 0.82 },
        { id: 'ttba-11', sectionId: 'sec-tt-bridge-a', midi: 62, startBeat: 8.75, durationBeats: 0.4, velocity: 0.78 },
        { id: 'ttba-12', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 9.15, durationBeats: 0.4, velocity: 0.8 },
        { id: 'ttba-13', sectionId: 'sec-tt-bridge-a', midi: 65, startBeat: 9.55, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttba-14', sectionId: 'sec-tt-bridge-a', midi: 65, startBeat: 10.0, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttba-15', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 10.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttba-16', sectionId: 'sec-tt-bridge-a', midi: 62, startBeat: 11.0, durationBeats: 0.33, velocity: 0.78 },
        { id: 'ttba-17', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 11.33, durationBeats: 0.33, velocity: 0.8 },
        { id: 'ttba-18', sectionId: 'sec-tt-bridge-a', midi: 62, startBeat: 11.66, durationBeats: 0.34, velocity: 0.78 },
        { id: 'ttba-19', sectionId: 'sec-tt-bridge-a', midi: 60, startBeat: 12.0, durationBeats: 0.65, velocity: 0.76 },
        { id: 'ttba-20', sectionId: 'sec-tt-bridge-a', midi: 62, startBeat: 12.65, durationBeats: 0.65, velocity: 0.78 },
        { id: 'ttba-21', sectionId: 'sec-tt-bridge-a', midi: 64, startBeat: 13.3, durationBeats: 2.2, velocity: 0.82 },

        // Bridge 2 (2/4, 8 bars = 16 beats: Ô 65–72 -> D.S. al Fine)
        { id: 'ttbb-1', sectionId: 'sec-tt-bridge-b', midi: 65, startBeat: 0.75, durationBeats: 0.4, velocity: 0.82 },
        { id: 'ttbb-2', sectionId: 'sec-tt-bridge-b', midi: 67, startBeat: 1.15, durationBeats: 0.4, velocity: 0.84 },
        { id: 'ttbb-3', sectionId: 'sec-tt-bridge-b', midi: 69, startBeat: 1.55, durationBeats: 0.45, velocity: 0.86 },
        { id: 'ttbb-4', sectionId: 'sec-tt-bridge-b', midi: 67, startBeat: 2.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'ttbb-5', sectionId: 'sec-tt-bridge-b', midi: 65, startBeat: 2.75, durationBeats: 0.5, velocity: 0.82 },
        { id: 'ttbb-6', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 3.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'ttbb-7', sectionId: 'sec-tt-bridge-b', midi: 67, startBeat: 4.0, durationBeats: 0.75, velocity: 0.84 },
        { id: 'ttbb-8', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 4.75, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttbb-9', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 5.25, durationBeats: 0.75, velocity: 0.8 },
        { id: 'ttbb-10', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 6.0, durationBeats: 1.75, velocity: 0.82 },
        { id: 'ttbb-11', sectionId: 'sec-tt-bridge-b', midi: 62, startBeat: 8.25, durationBeats: 0.4, velocity: 0.78 },
        { id: 'ttbb-12', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 8.65, durationBeats: 0.4, velocity: 0.8 },
        { id: 'ttbb-13', sectionId: 'sec-tt-bridge-b', midi: 65, startBeat: 9.05, durationBeats: 0.45, velocity: 0.82 },
        { id: 'ttbb-14', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 9.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttbb-15', sectionId: 'sec-tt-bridge-b', midi: 62, startBeat: 10.0, durationBeats: 0.5, velocity: 0.78 },
        { id: 'ttbb-16', sectionId: 'sec-tt-bridge-b', midi: 64, startBeat: 10.5, durationBeats: 0.5, velocity: 0.8 },
        { id: 'ttbb-17', sectionId: 'sec-tt-bridge-b', midi: 67, startBeat: 11.0, durationBeats: 0.9, velocity: 0.84 },
        { id: 'ttbb-18', sectionId: 'sec-tt-bridge-b', midi: 69, startBeat: 12.0, durationBeats: 1.8, velocity: 0.86 },
        { id: 'ttbb-19', sectionId: 'sec-tt-bridge-b', midi: 69, startBeat: 14.0, durationBeats: 1.25, velocity: 0.84 },
        { id: 'ttbb-20', sectionId: 'sec-tt-bridge-b', midi: 76, startBeat: 15.35, durationBeats: 0.3, velocity: 0.84 },
        { id: 'ttbb-21', sectionId: 'sec-tt-bridge-b', midi: 74, startBeat: 15.65, durationBeats: 0.3, velocity: 0.82 },

        // ĐK 2A (D.S. al Fine, 2/4, 8 bars = 16 beats)
        { id: 'ttc2a-1', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 0.0, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc2a-2', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 0.2, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc2a-3', sectionId: 'sec-tt-chorus-2a', midi: 72, startBeat: 0.4, durationBeats: 0.2, velocity: 0.86 },
        { id: 'ttc2a-4', sectionId: 'sec-tt-chorus-2a', midi: 69, startBeat: 0.6, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc2a-5', sectionId: 'sec-tt-chorus-2a', midi: 72, startBeat: 1.1, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2a-6', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 1.55, durationBeats: 0.45, velocity: 0.9 },
        { id: 'ttc2a-7', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 2.0, durationBeats: 0.9, velocity: 0.9 },
        { id: 'ttc2a-8', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 3.0, durationBeats: 0.5, velocity: 0.9 },
        { id: 'ttc2a-9', sectionId: 'sec-tt-chorus-2a', midi: 79, startBeat: 3.5, durationBeats: 0.5, velocity: 0.92 },
        { id: 'ttc2a-10', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 4.0, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2a-11', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 4.45, durationBeats: 0.7, velocity: 0.9 },
        { id: 'ttc2a-12', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 5.2, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2a-13', sectionId: 'sec-tt-chorus-2a', midi: 79, startBeat: 5.6, durationBeats: 0.4, velocity: 0.92 },
        { id: 'ttc2a-14', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 6.0, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2a-15', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 6.4, durationBeats: 0.4, velocity: 0.88 },
        { id: 'ttc2a-16', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 6.8, durationBeats: 1.0, velocity: 0.9 },
        { id: 'ttc2a-17', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 8.0, durationBeats: 0.25, velocity: 0.88 },
        { id: 'ttc2a-18', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 8.25, durationBeats: 0.25, velocity: 0.86 },
        { id: 'ttc2a-19', sectionId: 'sec-tt-chorus-2a', midi: 72, startBeat: 8.5, durationBeats: 0.25, velocity: 0.86 },
        { id: 'ttc2a-20', sectionId: 'sec-tt-chorus-2a', midi: 71, startBeat: 8.75, durationBeats: 0.25, velocity: 0.84 },
        { id: 'ttc2a-21', sectionId: 'sec-tt-chorus-2a', midi: 69, startBeat: 9.0, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc2a-22', sectionId: 'sec-tt-chorus-2a', midi: 72, startBeat: 9.5, durationBeats: 0.5, velocity: 0.88 },
        { id: 'ttc2a-23', sectionId: 'sec-tt-chorus-2a', midi: 74, startBeat: 10.0, durationBeats: 0.9, velocity: 0.9 },
        { id: 'ttc2a-24', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 11.0, durationBeats: 0.33, velocity: 0.9 },
        { id: 'ttc2a-25', sectionId: 'sec-tt-chorus-2a', midi: 79, startBeat: 11.33, durationBeats: 0.33, velocity: 0.92 },
        { id: 'ttc2a-26', sectionId: 'sec-tt-chorus-2a', midi: 84, startBeat: 11.66, durationBeats: 0.34, velocity: 0.94 },
        { id: 'ttc2a-27', sectionId: 'sec-tt-chorus-2a', midi: 83, startBeat: 12.0, durationBeats: 0.55, velocity: 0.92 },
        { id: 'ttc2a-28', sectionId: 'sec-tt-chorus-2a', midi: 84, startBeat: 12.55, durationBeats: 0.45, velocity: 0.94 },
        { id: 'ttc2a-29', sectionId: 'sec-tt-chorus-2a', midi: 83, startBeat: 13.0, durationBeats: 0.45, velocity: 0.92 },
        { id: 'ttc2a-30', sectionId: 'sec-tt-chorus-2a', midi: 79, startBeat: 13.45, durationBeats: 0.55, velocity: 0.9 },
        { id: 'ttc2a-31', sectionId: 'sec-tt-chorus-2a', midi: 76, startBeat: 14.0, durationBeats: 1.5, velocity: 0.88 },

        // ĐK 2B (Fine: Để lại tháng tư mình anh, 2/4, 8 bars = 16 beats)
        { id: 'ttc2b-1', sectionId: 'sec-tt-chorus-2b', midi: 76, startBeat: 0.0, durationBeats: 0.22, velocity: 0.88 },
        { id: 'ttc2b-2', sectionId: 'sec-tt-chorus-2b', midi: 74, startBeat: 0.22, durationBeats: 0.22, velocity: 0.86 },
        { id: 'ttc2b-3', sectionId: 'sec-tt-chorus-2b', midi: 72, startBeat: 0.44, durationBeats: 0.22, velocity: 0.86 },
        { id: 'ttc2b-4', sectionId: 'sec-tt-chorus-2b', midi: 71, startBeat: 0.66, durationBeats: 0.24, velocity: 0.84 },
        { id: 'ttc2b-5', sectionId: 'sec-tt-chorus-2b', midi: 69, startBeat: 0.9, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc2b-6', sectionId: 'sec-tt-chorus-2b', midi: 72, startBeat: 1.55, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc2b-7', sectionId: 'sec-tt-chorus-2b', midi: 74, startBeat: 2.2, durationBeats: 0.85, velocity: 0.9 },
        { id: 'ttc2b-8', sectionId: 'sec-tt-chorus-2b', midi: 76, startBeat: 3.15, durationBeats: 0.4, velocity: 0.9 },
        { id: 'ttc2b-9', sectionId: 'sec-tt-chorus-2b', midi: 79, startBeat: 3.55, durationBeats: 0.45, velocity: 0.92 },
        { id: 'ttc2b-10', sectionId: 'sec-tt-chorus-2b', midi: 74, startBeat: 4.0, durationBeats: 0.45, velocity: 0.88 },
        { id: 'ttc2b-11', sectionId: 'sec-tt-chorus-2b', midi: 74, startBeat: 4.45, durationBeats: 0.6, velocity: 0.9 },
        { id: 'ttc2b-12', sectionId: 'sec-tt-chorus-2b', midi: 76, startBeat: 5.1, durationBeats: 0.3, velocity: 0.9 },
        { id: 'ttc2b-13', sectionId: 'sec-tt-chorus-2b', midi: 79, startBeat: 5.4, durationBeats: 0.3, velocity: 0.92 },
        { id: 'ttc2b-14', sectionId: 'sec-tt-chorus-2b', midi: 76, startBeat: 5.7, durationBeats: 0.3, velocity: 0.9 },
        { id: 'ttc2b-15', sectionId: 'sec-tt-chorus-2b', midi: 72, startBeat: 6.0, durationBeats: 0.65, velocity: 0.88 },
        { id: 'ttc2b-16', sectionId: 'sec-tt-chorus-2b', midi: 69, startBeat: 6.65, durationBeats: 0.75, velocity: 0.86 },
        { id: 'ttc2b-17', sectionId: 'sec-tt-chorus-2b', midi: 67, startBeat: 7.5, durationBeats: 0.5, velocity: 0.84 },
        { id: 'ttc2b-18', sectionId: 'sec-tt-chorus-2b', midi: 69, startBeat: 8.0, durationBeats: 0.9, velocity: 0.88 },
        { id: 'ttc2b-19', sectionId: 'sec-tt-chorus-2b', midi: 76, startBeat: 9.0, durationBeats: 1.0, velocity: 0.9 },
        { id: 'ttc2b-20', sectionId: 'sec-tt-chorus-2b', midi: 74, startBeat: 10.0, durationBeats: 0.95, velocity: 0.9 },
        { id: 'ttc2b-21', sectionId: 'sec-tt-chorus-2b', midi: 79, startBeat: 11.0, durationBeats: 1.0, velocity: 0.92 },
        { id: 'ttc2b-22', sectionId: 'sec-tt-chorus-2b', midi: 81, startBeat: 12.0, durationBeats: 3.5, velocity: 0.92 },
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
    melodyMuted: false,
    melodyPlaybackMode: 'all',
    mutedMelodySectionIds: [],
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
  const style20 = RHYTHM_STYLE_META.find((r) => r.id === draft.drumPattern);
  if (style20) {
    return style20.label.replace(/^\d+[A-Za-z]?\.\s*/, '');
  }
  if (draft.backingInstrument === 'piano-ballad' && draft.drumPattern === 'ballad') {
    return 'Ballad Beat';
  }
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

export function resolvePairedInstrumentsForBacking(
  backingInstrument: BackingInstrumentId,
  currentMelody?: MelodyInstrumentId
): {
  backingInstrument: BackingInstrumentId;
  melodyInstrument: MelodyInstrumentId;
} {
  if (backingInstrument === 'guitar-strum') {
    return { backingInstrument: 'guitar-strum', melodyInstrument: 'guitar' };
  }
  if (backingInstrument === 'piano-ballad') {
    return { backingInstrument: 'piano-ballad', melodyInstrument: 'piano' };
  }
  return {
    backingInstrument: 'rhodes',
    melodyInstrument: currentMelody === 'synth' ? 'synth' : 'piano',
  };
}

export function resolvePairedInstrumentsForMelody(
  melodyInstrument: MelodyInstrumentId,
  currentBacking: BackingInstrumentId
): {
  backingInstrument: BackingInstrumentId;
  melodyInstrument: MelodyInstrumentId;
} {
  if (melodyInstrument === 'guitar') {
    return { backingInstrument: 'guitar-strum', melodyInstrument: 'guitar' };
  }
  if (melodyInstrument === 'piano') {
    return { backingInstrument: 'piano-ballad', melodyInstrument: 'piano' };
  }
  return { backingInstrument: currentBacking, melodyInstrument: 'synth' };
}

const STARTER_PLAYLIST_PRIORITY: Record<string, number> = {
  'draft-phia-sau-mot-co-gai': 9,
  'draft-di-vang-nhat-nhoa': 8,
  'draft-thang-tu-la-loi-noi-doi-cua-em': 6,
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

