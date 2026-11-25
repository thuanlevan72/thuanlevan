// Complete 4-Act Psychological Horror Narrative, Stealth & 4-Ending Engine for:
// THANH MINH: HỌC VIỆN CÔ SƠN (清明)

export type ThanhMinhScreenMode =
  | 'title'
  | 'playing'
  | 'paused'
  | 'ending_cutscene'
  | 'gameover';

export type RealmMode = 'yang' | 'yin'; // Dương giới vs Âm giới (đỏ thẫm & đen trắng)

export type ActNumber = 1 | 2 | 3 | 4;

export type SceneId =
  | 'classroom_12b'
  | 'corridor_act1'
  | 'infirmary_wing'
  | 'teachers_office'
  | 'flooded_courtyard'
  | 'dorm_hall'
  | 'broadcast_room'
  | 'library_archive'
  | 'darkroom'
  | 'auditorium'
  | 'music_classroom'
  | 'prison_cells'
  | 'roof_belltower'
  | 'ruined_hall_1986'
  | 'final_interrogation';

export type OfferingItemId =
  | 'incense_bundle'
  | 'infirmary_key'
  | 'lantern_oil'
  | 'teachers_key'
  | 'spirit_money'
  | 'radio_battery'
  | 'darkroom_key'
  | 'red_ribbon'
  | 'music_sheet'
  | 'bell_mallet'
  | 'wine_cup';

export interface InventoryItem {
  id: OfferingItemId;
  name: string;
  description: string;
}

export interface KeepsakeDef {
  id: string;
  title: string;
  act: ActNumber;
  subtitle: string;
  description: string;
  diaryText: string;
}

export interface StoryLoreEntry {
  id: string;
  act: ActNumber;
  title: string;
  location: string;
  speaker: string;
  quote: string;
  body: string;
  secretBody?: string;
}

export type GhostVariant = 'paper_hat' | 'tongue_warden' | 'auditor_specter' | 'librarian_wraith';

export interface GhostEntity {
  id: string;
  kind: 'paper_hat' | 'tongue_warden';
  variant?: GhostVariant;
  name: string;
  placardText: string;
  scene: SceneId;
  x: number;
  minX: number;
  maxX: number;
  vx: number;
  facing: 1 | -1;
  pacified: boolean;
  alerted?: boolean;
}

export interface HotspotDef {
  id: string;
  scene: SceneId;
  x: number;
  label: string;
  realm: 'both' | RealmMode;
  kind:
    | 'door'
    | 'pickup'
    | 'keepsake'
    | 'lore'
    | 'sanity_shrine'
    | 'memorial_1986'
    | 'wuxing_altar'
    | 'clock_puzzle'
    | 'flagpole_corpse'
    | 'radio'
    | 'illogical_door'
    | 'bookshelf_cipher'
    | 'darkroom_tray'
    | 'puppet_stage'
    | 'piano_puzzle'
    | 'prison_crack'
    | 'cipher_box'
    | 'bronze_bell'
    | 'mirror_1980'
    | 'interrogation_chair';
  targetScene?: SceneId;
  targetX?: number;
  requiredFlag?: string;
  requiredItem?: OfferingItemId;
  blockedHint?: string;
  itemReward?: InventoryItem;
  keepsakeId?: string;
  loreId?: string;
  dialogueText?: string;
}

export type ActiveModalType =
  | 'none'
  | 'journal'
  | 'memory_echo'
  | 'wuxing_puzzle'
  | 'clock_puzzle'
  | 'cipher_lock'
  | 'radio_tuner'
  | 'bookshelf_cipher'
  | 'darkroom_reveal'
  | 'puppet_theatre'
  | 'piano_puzzle'
  | 'interrogation_trial';

export type EndingId =
  | 'none'
  | 'ending_1_loop' // Kẻ Vô Can (Bad — Vòng lặp)
  | 'ending_2_ashes' // Tro Tàn Hèn Nhát (Bad — Tự hủy)
  | 'ending_3_late_qingming' // Tiết Thanh Minh Muộn (Normal)
  | 'ending_4_dawn_coson'; // Bình Minh Cô Sơn (True Ending + 1986 Epilogue)

export interface DeathCutsceneState {
  active: boolean;
  killerKind: 'paper_hat' | 'tongue_warden';
  killerVariant?: GhostVariant;
  killerName: string;
  timer: number;
  duration: number;
  storyWhisper: string;
  respawnX: number;
}

export type PianoNoteId = 'Do' | 'Re' | 'Mi' | 'Sol' | 'La';

export interface ThanhMinhState {
  act: ActNumber;
  scene: SceneId;
  realm: RealmMode;
  playerX: number;
  playerFacing: 1 | -1;
  walkPhase: number;

  // Stealth, Run Stamina & Sanity
  holdingBreath: boolean;
  breathStamina: number; // 0..100
  gaspPenaltyTimer: number;
  runStamina: number; // 0..100
  isRunning: boolean;
  isMoving: boolean;
  exhausted: boolean;
  sanity: number; // 0..100
  sanityBottomCount: number;
  gazeExposure: number; // 0..100

  // Inventory & Hidden Story Variables
  inventory: OfferingItemId[];
  collectedKeepsakeIds: string[]; // 10 total -> 100%
  collectedLoreIds: string[]; // 18 environmental memory echoes
  activeLoreId: string | null;
  flags: Record<string, boolean>;

  // Interactive Puzzles
  wuxingSequence: string[]; // Kim -> Thủy -> Hỏa
  clockHour: number; // 1..12 (target: 2)
  clockMinute: number; // 0..55 step 5 (target: 15 -> 02:15)
  clockSolved: boolean;
  cipherDigits: [number, number, number]; // 4-0-5
  cipherSolved: boolean;
  radioFrequency: number; // Act 2: 104.7 MHz | Act 3 secret: 109.2 MHz
  radioTunedAct2: boolean;
  radioSecretAct3Solved: boolean;
  bookshelfOrder: [number, number, number]; // target [0, 1, 2]
  bookshelfSolved: boolean;
  puppetOrder: [number, number, number, number]; // target [0, 1, 2, 3]
  puppetsSolved: boolean;
  pianoSequence: PianoNoteId[]; // target ['Do', 'Mi', 'Sol', 'Re']
  pianoSolved: boolean;
  bellRings: number; // 0..3

  // Hồi 4 Interrogation
  interrogationStep: 0 | 1 | 2 | 3;
  confessionAnswers: boolean[];

  // Restrained Peripheral Horror & Psychological Dread System
  horrorPulseTimer: number;
  activePhantomX: number | null;
  activePhantomTimer: number;
  activePhantomKind: 'peeker' | 'shadow_child' | null;
  audioVacuumTimer: number;
  pendingDreadBeat: 'sub_bass_ambush' | 'door_slam_behind' | null;
  panicTimer: number;
  doorJamTimer: number;
  lanternSputterTimer: number;
  fakeoutKind: 'black_cat' | 'falling_book' | null;
  fakeoutX: number | null;
  fakeoutTimer: number;
  postFakeoutAmbushTimer: number;
  dreadCycleCount: number;
  modalReadTimer: number;
  uiIntrusionTimer: number;
  sceneVisitCounts: Partial<Record<SceneId, number>>;

  // Entities & UI
  ghosts: GhostEntity[];
  deathCutscene: DeathCutsceneState | null;
  activeModal: ActiveModalType;
  activeHotspotId: string | null;
  subtitleText: string;
  subtitleTimer: number;
  ending: EndingId;
  endingTimer: number;
  loopCount: number;
}

export interface ThanhMinhInput {
  dt: number;
  moveDir: -1 | 0 | 1;
  holdingBreath: boolean;
  sprinting?: boolean;
}

export interface ThanhMinhEvents {
  footstep: boolean;
  gasped: boolean;
  exhaustedNow?: boolean;
  sanityCollapsed: boolean;
  ghostAlerted: boolean;
  killedByGhostKind: 'paper_hat' | 'tongue_warden' | null;
  horrorEvent?:
    | 'knock'
    | 'sting'
    | 'whisper'
    | 'vacuum_start'
    | 'sub_bass_ambush'
    | 'fakeout_cat'
    | 'fakeout_book'
    | 'footstep_behind'
    | 'ui_intrusion'
    | null;
  horrorPan?: number;
}

// Baseline speeds before the deliberate -35% Detention-style pacing reduction
export const LEGACY_MOVEMENT_SPEEDS = {
  walk: 154,
  run: 248,
  holdBreath: 92,
  exhausted: 88,
} as const;

export const SPEED_SCALE_FACTOR = 0.65; // -35% speed on walk, run, breath-hold & fatigued walk

export const MOVEMENT_SPEEDS = {
  walk: LEGACY_MOVEMENT_SPEEDS.walk * SPEED_SCALE_FACTOR, // 100.1 px/s
  run: LEGACY_MOVEMENT_SPEEDS.run * SPEED_SCALE_FACTOR, // 161.2 px/s
  holdBreath: LEGACY_MOVEMENT_SPEEDS.holdBreath * SPEED_SCALE_FACTOR, // 59.8 px/s
  exhausted: LEGACY_MOVEMENT_SPEEDS.exhausted * SPEED_SCALE_FACTOR, // 57.2 px/s
} as const;

export const SCENE_META: Record<
  SceneId,
  { minX: number; maxX: number; act: ActNumber; title: string; subtitle: string }
> = {
  classroom_12b: {
    minX: 65,
    maxX: 1680,
    act: 1,
    title: 'Lớp Học 12B — Đêm Mưa Bão',
    subtitle: 'Hồi 1 · Bóng Tối & Bùa Trắng',
  },
  corridor_act1: {
    minX: 60,
    maxX: 2320,
    act: 1,
    title: 'Hành Lang Tầng 2 — Vong Hồn Mũ Giấy',
    subtitle: 'Hồi 1 · Bóng Tối & Bùa Trắng',
  },
  infirmary_wing: {
    minX: 65,
    maxX: 1760,
    act: 1,
    title: 'Phòng Y Tế Cũ — Đồng Hồ Chết Đứng',
    subtitle: 'Hồi 1 · Giờ Cầu Cô Sơn Sập',
  },
  teachers_office: {
    minX: 65,
    maxX: 1640,
    act: 1,
    title: 'Văn Phòng Thầy Trần Mặc — Mảnh Giấy Còn Thiếu',
    subtitle: 'Hồi 1 · Lời Hẹn Bị Hiểu Lầm',
  },
  flooded_courtyard: {
    minX: 60,
    maxX: 2080,
    act: 1,
    title: 'Sân Trường Ngập Lũ — Cột Cờ Đẫm Mưa',
    subtitle: 'Cao Trào Hồi 1 · Kẻ Phản Bội Vẫn Còn Trong Trường',
  },
  dorm_hall: {
    minX: 60,
    maxX: 2300,
    act: 2,
    title: 'Ký Túc Xá Nữ — Kiến Trúc Phi Logic',
    subtitle: 'Hồi 2 · Chiếc Radio & Ký Ức Đổ Máu',
  },
  broadcast_room: {
    minX: 65,
    maxX: 1640,
    act: 2,
    title: 'Phòng Phát Thanh & Kho Sách Cấm',
    subtitle: 'Hồi 2 · Tần Số Âm Dương',
  },
  library_archive: {
    minX: 65,
    maxX: 1860,
    act: 2,
    title: 'Thư Viện Cấm & Gác Xép Bùa Chú',
    subtitle: 'Hồi 2 · Di Sản Nhóm Đọc Sách',
  },
  darkroom: {
    minX: 65,
    maxX: 1660,
    act: 2,
    title: 'Phòng Rửa Ảnh Tối — Ánh Đèn Đỏ',
    subtitle: 'Cao Trào Hồi 2 · Quỷ Sai Cắt Lưỡi',
  },
  auditorium: {
    minX: 60,
    maxX: 2220,
    act: 3,
    title: 'Hội Trường Lớn — Sân Khấu Bì Ảnh Hí',
    subtitle: 'Hồi 3 · Đối Diện Tội Ác',
  },
  music_classroom: {
    minX: 65,
    maxX: 1780,
    act: 3,
    title: 'Phòng Nhạc Cũ — Dương Cầm Đứt Dây',
    subtitle: 'Hồi 3 · Khúc Nhạc Đêm Giới Nghiêm',
  },
  prison_cells: {
    minX: 60,
    maxX: 1920,
    act: 3,
    title: 'Khu Biệt Giam & Hành Lang Lạnh',
    subtitle: 'Hồi 3 · Lời Nhắn Của Tô Dao',
  },
  roof_belltower: {
    minX: 60,
    maxX: 1960,
    act: 3,
    title: 'Sân Thượng & Tháp Chuông Đổ Nát',
    subtitle: 'Cao Trào Hồi 3 · Tiếng Chuông Tiết Thanh Minh',
  },
  ruined_hall_1986: {
    minX: 60,
    maxX: 1980,
    act: 4,
    title: 'Học Viện Cô Sơn Hoang Tàn (20 Năm Sau)',
    subtitle: 'Hồi 4 · Phiên Tòa Của Linh Hồn',
  },
  final_interrogation: {
    minX: 65,
    maxX: 1540,
    act: 4,
    title: 'Phòng Thẩm Vấn Cuối Cùng',
    subtitle: 'Hồi 4 · Đối Diện Chính Mình',
  },
};

export const INVENTORY_ITEMS: Record<OfferingItemId, InventoryItem> = {
  incense_bundle: {
    id: 'incense_bundle',
    name: 'Bó Nhang Trầm & Vàng Mã',
    description: 'Dùng cho nghi lễ Ngũ Hành tại bàn thờ hành lang tầng 2.',
  },
  infirmary_key: {
    id: 'infirmary_key',
    name: 'Chìa Khóa Phòng Y Tế',
    description: 'Chìa sắt nhỏ gắn thẻ chữ thập đỏ hoen gỉ.',
  },
  lantern_oil: {
    id: 'lantern_oil',
    name: 'Bình Dầu Đèn Bão Cô Sơn',
    description: 'Dầu hỏa nguyên chất giúp giữ lửa qua cơn mưa bão xuống Sân Trường.',
  },
  teachers_key: {
    id: 'teachers_key',
    name: 'Chìa Khóa Văn Phòng Thầy Trần Mặc',
    description: 'Chìa đồng có móc thẻ gỗ ghi chữ “Tổ Văn 1967”.',
  },
  spirit_money: {
    id: 'spirit_money',
    name: 'Xấp Tiền Vàng Mã Cháy Dở',
    description: 'Vàng mã vương lại bên hiên sân trường ngập nước.',
  },
  radio_battery: {
    id: 'radio_battery',
    name: 'Pin Đèn Cũ & Cuộn Băng Cối',
    description: 'Cấp nguồn cho chiếc đài bán dẫn cũ trong phòng phát thanh.',
  },
  darkroom_key: {
    id: 'darkroom_key',
    name: 'Chìa Khóa Phòng Rửa Ảnh',
    description: 'Chìa đồng dính vết thuốc rửa ảnh đỏ sẫm.',
  },
  red_ribbon: {
    id: 'red_ribbon',
    name: 'Dải Ruy-Băng Đỏ Của Tô Dao',
    description: 'Dải lụa đỏ đánh dấu những cuốn sách cấm của bốn thầy trò.',
  },
  music_sheet: {
    id: 'music_sheet',
    name: 'Trang Bản Nhạc “Tiếng Sáo Cô Sơn”',
    description: 'Ký âm 4 nốt đầu khúc nhạc thầy Trần và Tô Dao thường đệm: Đồ → Mi → Sol → Rê.',
  },
  bell_mallet: {
    id: 'bell_mallet',
    name: 'Vồ Gỗ Tháp Chuông Cô Sơn',
    description: 'Chiếc vồ gỗ sồi dùng để thỉnh chiếc chuông đồng nứt trên sân thượng.',
  },
  wine_cup: {
    id: 'wine_cup',
    name: 'Chén Rượu Tế Thanh Minh',
    description: 'Chén rượu trắng dâng trước cửa Phòng Thẩm Vấn cuối cùng.',
  },
};

// 10 Truth Keepsakes (Kỷ vật sự thật) -> determines Ending percentage (0%..100%)
export const TRUTH_KEEPSAKES: readonly KeepsakeDef[] = [
  {
    id: 'ks-1-linjing-badge',
    act: 1,
    title: 'Kỷ vật 1/10 — Thẻ Học Sinh Của Lâm Tĩnh',
    subtitle: 'Góc bàn Lớp 12B · Nhóm Đọc Sách Bị Cấm',
    description: 'Tấm thẻ học sinh rách góc kẹp tờ giấy viết tay bài thơ bị cấm của thầy Trần Mặc.',
    diaryText:
      'Cha mẹ vừa bị bắt dưới thị trấn vì xuất thân trí thức. Chỉ có lớp học văn của thầy Trần Mặc và Tô Dao khiến mình còn thấy ấm áp... Nhưng vì sao ánh mắt thầy luôn dừng lại lâu hơn trên trang vở của Tô Dao?',
  },
  {
    id: 'ks-2-newspaper',
    act: 1,
    title: 'Kỷ vật 2/10 — Tờ Báo Đấu Tố Nhàu Nát',
    subtitle: 'Dưới chân cột cờ sân trường · Trương Vệ Quốc',
    description: 'Mẩu báo tuyên truyền rách tả tơi thấm nước mưa đỏ ngầu.',
    diaryText:
      'Trương Vệ Quốc (18 tuổi), đội trưởng đội tự vệ học sinh, đã chặn mình ở góc cầu thang: "Nhà mày là thành phần xấu. Giao danh sách nhóm đọc sách của lão Trần ra, tao tha cho."',
  },
  {
    id: 'ks-3-burned-poetry',
    act: 2,
    title: 'Kỷ vật 3/10 — Cuốn Sổ Thơ Chép Tay Cháy Dở',
    subtitle: 'Nhà kho sau Thư Viện Cấm (chỉ hiện ở Âm Giới)',
    description: 'Cuốn sổ chép thơ cổ điển bị đốt sém một nửa, trang đầu ghi tên thầy Trần Mặc và Tô Dao.',
    diaryText:
      'Đêm hôm đó, mình đứng ngoài khe cửa nghe lén thầy Trần Mặc thì thầm với Tô Dao rằng thầy đã chuẩn bị giấy tờ cho Tô Dao trốn về quê. Không có tên mình trong tấm vé đó... Cơn ghen tuông và sợ hãi đã làm mắt mình tối sầm lại.',
  },
  {
    id: 'ks-4-negative-film',
    act: 2,
    title: 'Kỷ vật 4/10 — Tấm Phim Âm Bản Đêm Giao Nộp',
    subtitle: 'Khay thuốc hiện hình · Phòng Rửa Ảnh Tối',
    description: 'Tấm phim âm bản ghi lại khoảnh khắc bàn tay run rẩy đưa tờ danh sách cho Trương Vệ Quốc.',
    diaryText:
      'Dưới ánh đèn đỏ, bức ảnh tự hiện ra rõ mồn một: Không ai cầm dao kề cổ ép tay mình viết hết cả danh sách — chính nỗi hèn nhát và ích kỷ của mình đã điền từng cái tên.',
  },
  {
    id: 'ks-5-todao-note',
    act: 3,
    title: 'Kỷ vật 5/10 — Mẩu Giấy Của Tô Dao Trong Phòng Giam',
    subtitle: 'Khe gạch phòng biệt giam · Hồi 3',
    description: 'Mảnh giấy nhỏ thấm máu khô, nét chữ vội vàng nhưng dịu dàng đến thắt lòng.',
    diaryText:
      '"Tĩnh, đừng sợ, tớ đốt tờ giấy có tên cậu rồi. Đội tự vệ không biết cậu cũng tham gia nhóm đâu. Ráng sống tiếp thay phần tớ nhé." — Tô Dao đã chịu tra tấn đến chết mà không hề nhắc nửa lời về mình.',
  },
  {
    id: 'ks-6-tranmac-pen',
    act: 4,
    title: 'Kỷ vật 6/10 — Cây Bút Máy & Chiếc Áo Đồng Phục Cũ',
    subtitle: 'Đống đổ nát Cô Sơn 20 năm sau · Hồi 4',
    description: 'Cây bút máy gãy ngòi của thầy Trần Mặc cùng cuốn sổ ghi sự thật còn nguyên vẹn trên bàn học.',
    diaryText:
      '20 năm trôi qua (1986), em trai Tô Dao vẫn lặn lội lên núi tìm hài cốt chị. Chỉ khi đối diện trọn vẹn tội lỗi, sự thật mới có thể minh oan cho thầy Trần Mặc và Tô Dao.',
  },
  {
    id: 'ks-7-tranmac-pass',
    act: 1,
    title: 'Kỷ vật 7/10 — Tấm Giấy Thông Hành Có Tên Lâm Tĩnh',
    subtitle: 'Hộp Khóa Số Bàn Làm Việc Thầy Trần Mặc · Hồi 1',
    description: 'Tờ giấy thông hành thứ hai cất kỹ trong hộp khóa 4-0-5 của thầy Trần Mặc — nét mực chưa ráo.',
    diaryText:
      'Hóa ra đêm đó thầy Trần không hề bỏ rơi mình! Thầy đã chuẩn bị sẵn một tấm vé rời khỏi núi mang tên “Lâm Tĩnh”, định chờ tan cuộc họp tự vệ sẽ lén trao cho cả hai đứa... Vậy mà cơn ghen tuông mù quáng đã đẩy thầy vào chỗ chết.',
  },
  {
    id: 'ks-8-rooftop-letter',
    act: 3,
    title: 'Kỷ vật 8/10 — Bức Thư Chưa Kịp Gửi Trên Sân Thượng',
    subtitle: 'Chân Tháp Chuông Cô Sơn · Cao trào Hồi 3',
    description: 'Phong thư ố vàng đặt dưới chân chuông đồng, mặt sau vẽ nhành hoa mai năm cánh.',
    diaryText:
      'Trên sân thượng gió bão, tiếng chuông đồng vang lên đánh thức trang thư cuối của Tô Dao gửi cha mẹ: “Nếu con không về kịp tiết Thanh Minh năm nay, xin hãy coi Tĩnh như con gái nhỏ trong nhà — bạn ấy cô độc hơn con rất nhiều.”',
  },
  {
    id: 'ks-9-medical-slip',
    act: 1,
    title: 'Kỷ vật 9/10 — Phiếu Khám Bệnh & Hoa Mai Ép Khô',
    subtitle: 'Tủ Thuốc Phòng Y Tế Cũ · Hồi 1',
    description: 'Đơn thuốc cảm mạo đề tên Tô Dao nhưng bên trong lại ghi liều thuốc an thần cho Lâm Tĩnh.',
    diaryText:
      'Trong những đêm Lâm Tĩnh mất ngủ vì hoảng loạn, Tô Dao đã giả vờ ốm để xin y tá phần thuốc ngủ dịu nhẹ và nhường cả phần bánh cháo nóng cho bạn, giấu kỹ trong hộc tủ bên chiếc đồng hồ dừng lúc 02:15.',
  },
  {
    id: 'ks-10-reading-club-seal',
    act: 2,
    title: 'Kỷ vật 10/10 — Ấn Triện Đá Nhóm Đọc Sách Cô Sơn',
    subtitle: 'Giá Sách Bí Mật Thư Viện Cấm · Hồi 2',
    description: 'Con dấu đá xanh khắc bốn chữ “Cô Sơn Tri Âm”, đáy dấu còn dính mực son.',
    diaryText:
      'Thầy Trần Mặc tự tay khắc con dấu này cho cả bốn thầy trò vào mùa thu 1966. Thầy nói: “Dù chữ nghĩa bị cấm đoán, lòng người biết thương nhau thì ngọn đèn đọc sách vẫn chưa bao giờ tắt.”',
  },
];

export const STORY_LORE_ENTRIES: readonly StoryLoreEntry[] = [
  {
    id: 'lore-1-blackboard',
    act: 1,
    title: 'Nét Phấn Của Tô Dao Trên Bảng Đen',
    location: 'Lớp Học 12B · Mùa mưa 1967',
    speaker: 'Ký ức của Lâm Tĩnh',
    quote: '“Dẫu đêm dài che khuất đỉnh Cô Sơn, trang thơ vẫn nhớ tên người đọc.”',
    body: 'Giữa những dòng khẩu hiệu sơn đỏ gạch chéo nham nhở, góc dưới bảng đen vẫn còn nét phấn nghiêng thanh mảnh của Tô Dao. Trước khi cơn bão cắt đứt cây cầu dưới chân núi, cô ấy luôn chừa chỗ bên cạnh bàn mình cho Lâm Tĩnh mỗi giờ tan học.',
  },
  {
    id: 'lore-2-tranmac-margin',
    act: 1,
    title: 'Lời Phê Bên Lề Bài Luận Văn',
    location: 'Hành Lang Tầng 2 · Sổ ghi chép rơi',
    speaker: 'Thầy Trần Mặc',
    quote: '“Tĩnh viết câu chữ rất có hồn, chỉ đừng để nỗi sợ khiến em thu mình vào bóng tối.”',
    body: 'Tờ giấy kiểm tra bị vò nát dưới chân tường còn in dấu mực xanh quen thuộc của Thầy Trần Mặc. Thầy vốn biết gia cảnh Lâm Tĩnh đang bị cô lập dưới thị trấn nên thường nán lại sau giờ học, lặng lẽ để lại sách văn học ngoại quốc trong ngăn bàn em — điều mà trong cơn tự ti, Lâm Tĩnh lại tưởng thầy chỉ thiên vị Tô Dao.',
  },
  {
    id: 'lore-3-courtyard-glass',
    act: 1,
    title: 'Mảnh Thủy Tinh Dính Máu Dưới Mưa',
    location: 'Sân Trường Ngập Lũ · Bục cột cờ',
    speaker: 'Hồi ức Đêm Đấu Tố',
    quote: '“Ai ném đá trước, người đó sẽ được xóa tên khỏi bảng đen.”',
    body: 'Dưới lớp bùn đỏ trước cột cờ còn lấp ló những mảnh chai vỡ. Đêm ấy, Trương Vệ Quốc bắt Thầy Trần Mặc quỳ gối trên đống thủy tinh dưới mưa tầm tã để buộc tội “truyền bá tư tưởng đồi trụy”. Khi dòng lũ đỏ tràn qua núi, chính sự cuồng tín của đội tự vệ đã quay sang xé xác kẻ đứng đầu.',
  },
  {
    id: 'lore-4-todao-scarf',
    act: 2,
    title: 'Chiếc Khăn Len Hoa Mai Đan Dở',
    location: 'Ký Túc Xá Nữ · Giường tầng sát cửa sổ',
    speaker: 'Tô Dao',
    quote: '“Tháng tư trên núi lạnh lắm, sinh nhật Tĩnh tớ sẽ đan xong kịp cho cậu.”',
    body: 'Trên chiếc gối ẩm mục nằm gọn cuộn len đỏ thẫm kẹp chiếc kim đan bằng tre và mẩu giấy gấp hình cánh hoa mai. Hóa ra tờ giấy thầy Trần Mặc chuẩn bị cho Tô Dao trốn về quê còn chừa sẵn một dòng trống viết tên “Lâm Tĩnh” bằng bút chì mờ — Tô Dao chưa bao giờ định bỏ bạn lại một mình.',
  },
  {
    id: 'lore-5-yin-draft',
    act: 2,
    title: 'Bốn Tờ Giấy Tố Cáo Bị Vò Nát',
    location: 'Ký Túc Xá Nữ (Âm Giới)',
    speaker: 'Tiếng nói trong bóng tối',
    quote: '“Nét chữ run rẩy gạch đi viết lại bốn lần, nhưng cuối cùng vẫn ký tên giao nộp.”',
    body: 'Trong sắc đỏ thẫm của Âm Giới, bốn tờ giấy nháp lơ lửng quanh hành lang. Tờ thứ nhất chỉ ghi tên thầy Trần, tờ thứ hai gạch tên Tô Dao đi... nhưng đến tờ cuối cùng, nỗi ghen tuông và cơn hoảng loạn khi nghe tin cha mẹ bị bắt đã khiến ngòi bút điền trọn cả nhóm đọc sách.',
  },
  {
    id: 'lore-6-forbidden-list',
    act: 2,
    title: 'Tro Sách Cấm Sau Tủ Phát Thanh',
    location: 'Phòng Phát Thanh · Góc kho sách cũ',
    speaker: 'Nhóm Đọc Sách Cô Sơn',
    quote: '“Khi người ta đốt sách, tro bụi vẫn giữ nguyên hơi ấm của những đêm thức trắng.”',
    body: 'Lẫn trong đống tro đen sau tủ băng cối là bìa cháy sém của những cuốn “Truyện Kiều”, tập thơ Tagore và sổ tay dịch thuật viết tay. Mỗi đêm thứ Bảy, bốn thầy trò từng chong ngọn đèn dầu nhỏ ở đây, truyền tai nhau nghe đài sóng ngắn phát nhạc cổ điển giữa núi rừng tịch mịch.',
  },
  {
    id: 'lore-7-darkroom-ledger',
    act: 2,
    title: 'Hồ Sơ Ngầm Của Trương Vệ Quốc',
    location: 'Phòng Rửa Ảnh Tối · Ngăn tủ khóa đồng',
    speaker: 'Hồ sơ mật Đội Tự Vệ',
    quote: '“Dù con bé họ Lâm có khai hay không, lệnh bắt nhà nó đã ký từ tuần trước rồi.”',
    body: 'Bức thư lệnh úa vàng trong ngăn kéo phòng rửa ảnh phơi bày sự thật tàn nhẫn nhất: lời hứa “tha cho gia đình” của Trương Vệ Quốc ngay từ đầu chỉ là cái bẫy.',
    secretBody:
      'NHỜ MỞ KHÓA BẰNG CHÌA ĐỒNG: Bạn rút ra tờ công văn đóng dấu đỏ dưới đáy ngăn kéo. Gia đình Lâm Tĩnh thực chất đã bị định tội trước đêm mưa bão — sự phản bội của Lâm Tĩnh không hề cứu được cha mẹ, mà chỉ tự tay đẩy người thầy và người bạn thân nhất xuống vực thẳm.',
  },
  {
    id: 'lore-8-auditorium-slap',
    act: 3,
    title: 'Sự Im Lặng Của Thầy Trần Mặc Trên Bục',
    location: 'Hội Trường Lớn · Dưới chân khán đài',
    speaker: 'Thầy Trần Mặc',
    quote: '“Không sao đâu, Tĩnh... Đừng để hận thù biến em thành giống bọn họ.”',
    body: 'Giữa tiếng gào thét của hàng trăm học sinh trong hội trường, Trương Vệ Quốc dí chiếc loa sắt vào mặt Lâm Tĩnh, bắt cô tát thầy giáo mình để chứng minh “đã đoạn tuyệt với trí thức phản động”. Cái tát giáng xuống trong nước mắt, còn thầy Trần Mặc chỉ lặng lẽ nhặt cặp kính vỡ và khẽ gật đầu tha thứ.',
  },
  {
    id: 'lore-9-prison-scratches',
    act: 3,
    title: 'Bài Thơ Khắc Bằng Móng Tay Trên Tường Giam',
    location: 'Khu Biệt Giam · Bức tường rêu ẩm',
    speaker: 'Tô Dao & Thầy Trần Mặc',
    quote: '“Thanh Minh mưa bụi rơi đầy lối / Nếu còn ngày mai, xin nhớ tên nhau.”',
    body: 'Những vết cào rỉ máu trên gạch lạnh ghép thành hai câu thơ viết dở của Thầy Trần Mặc và nét chữ trả lời của Tô Dao bên dưới. Họ biết mình khó lòng qua khỏi đêm ấy, nhưng đến hơi thở cuối cùng vẫn không một lời oán trách cô bạn cùng lớp.',
  },
  {
    id: 'lore-10-to-vien-1986',
    act: 4,
    title: 'Lời Kể Của Tô Viễn Năm 1986',
    location: 'Bia Đá Rêu Phong · Cô Sơn 20 Năm Sau',
    speaker: 'Tô Viễn (Em trai Tô Dao)',
    quote: '“Chị tôi dặn nếu có một ngày sương tan, hãy mang giúp chị bó hoa cúc trắng lên sân thượng.”',
    body: 'Hai mươi năm sau biến cố (1986), Tô Viễn — cậu em trai nhỏ năm nào của Tô Dao — vẫn đều đặn mỗi tiết Thanh Minh trèo lên ngôi trường đổ nát trên đỉnh Cô Sơn. Anh đặt hoa cúc trắng trước tấm bia đá dựng tạm cho chị và Thầy Trần Mặc.',
    secretBody:
      'SAU KHI DÂNG CHÉN RƯỢU TẾ & VÀNG MÃ: Tô Viễn lặng lẽ cúi đầu giữa làn khói hương. Anh kể rằng năm 1979 chính quyền đã phục hồi danh dự cho Thầy Trần Mặc, nhưng bức thư cuối cùng của chị Tô Dao vẫn còn thiếu một trang sự thật — chỉ chờ linh hồn Lâm Tĩnh tự mình bước ra khỏi vòng lặp mặc cảm.',
  },
  {
    id: 'lore-11-teachers-desk',
    act: 1,
    title: 'Nhật Ký Công Tác Tổ Văn Năm 1967',
    location: 'Văn Phòng Thầy Trần Mặc · Góc bàn đèn dầu',
    speaker: 'Thầy Trần Mặc',
    quote: '“Mật mã hộp gỗ: Ngày Tiết Thanh Minh 04/05 (4 - 0 - 5) — ngày bốn thầy trò lập Nhóm Đọc Sách Cô Sơn.”',
    body: 'Trang đầu cuốn sổ bọc vải xanh bị xé mất một góc nhưng vẫn rõ dòng ghi chú bằng bút chì kim. Thầy Trần Mặc cẩn thận ghi tên từng học trò cùng những cuốn thơ chép tay thầy định giữ lại trước kỳ thanh trừng.',
  },
  {
    id: 'lore-12-rooftop-storm',
    act: 3,
    title: 'Tiếng Chuông Đứt Quãng Trong Đêm Bão',
    location: 'Sân Thượng Cô Sơn · Lan can hướng vực thẳm',
    speaker: 'Ký ức đêm 04/05/1967',
    quote: '“Ba hồi chuông tiễn biệt — đừng để oan hồn lạc lối giữa màn mưa Cô Sơn.”',
    body: 'Cây chuông đồng cổ trên sân thượng vốn chỉ gióng lên mỗi sáng khai giảng và tiết Thanh Minh. Đêm cơn lũ đỏ tràn qua cây cầu độc mộc, người gác chuông bỏ chạy trước, chỉ còn những học sinh bị giam cầm vọng nghe tiếng kim loại rên xiết trong gió.',
  },
  {
    id: 'lore-13-bell-echo',
    act: 3,
    title: 'Dấu Giày Nhỏ Dưới Chân Tháp Chuông',
    location: 'Tháp Chuông Đổ Nát · Bậc thềm đá',
    speaker: 'Tô Dao & Lâm Tĩnh',
    quote: '“Sợ hãi không có tội, nhưng đổ máu người khác để giữ bình yên cho riêng mình thì có.”',
    body: 'Trước khi bị đội tự vệ giải đi, Tô Dao từng lén chạy lên sân thượng cột dải ruy-băng đỏ lên quai chuông để làm dấu cho Lâm Tĩnh trốn theo đường mòn sau núi. Nhưng cô bạn đã đứng dưới chân cầu thang không dám bước lên.',
  },
  {
    id: 'lore-14-threshold-silence',
    act: 4,
    title: 'Bốn Bước Chân Cuối Trước Ngưỡng Cửa',
    location: 'Phòng Thẩm Vấn Cuối Cùng · Ngưỡng cửa gỗ đen',
    speaker: 'Bóng Ma Trong Gương',
    quote: '“Suốt hai mươi năm qua, em chưa từng bước ra khỏi căn phòng đêm hôm ấy.”',
    body: 'Trên mặt bàn gỗ chỉ đặt một ngọn đèn dầu sắp cạn, một tờ giấy trắng và chiếc ghế trống. Phiên tòa lần này không có Trương Vệ Quốc hay bất kỳ họng súng nào — chỉ có Lâm Tĩnh đứng trước tòa án lương tâm của chính mình.',
  },
  {
    id: 'lore-15-infirmary-log',
    act: 1,
    title: 'Sổ Trực Y Tá Đêm Bão Cô Sơn',
    location: 'Phòng Y Tế Cũ · Bàn khám ẩm mốc',
    speaker: 'Bà Tư (Y tá trường)',
    quote: '“02 giờ 15 phút sáng — cầu gỗ chân núi gãy nhịp, đồng hồ hành lang ngừng chạy.”',
    body: 'Trang sổ trực nhòe mực nước mưa ghi lại thời khắc đỉnh Cô Sơn hoàn toàn bị cô lập khỏi thế giới bên ngoài: 02:15 sáng. Sau dòng chữ đó, bà y tá vội vã viết dở tên hai học sinh chưa kịp rời ký túc xá.',
  },
  {
    id: 'lore-16-banned-poetry',
    act: 2,
    title: 'Trang Mục Lục Sách Cấm Của Thầy Trần',
    location: 'Thư Viện Cấm · Bàn đọc sách cuối dãy',
    speaker: 'Thầy Trần Mặc',
    quote: '“Thứ tự truyền đọc mỗi đêm: I. Truyện Kiều → II. Tập Thơ Tagore → III. Nhật Ký Mưa Cô Sơn.”',
    body: 'Thầy Trần Mặc luôn dặn học trò xếp ba tập sách gối đầu theo đúng trình tự ấy sau lưng tủ gỗ để tránh tai mắt đội tự vệ. Từng dòng chú giải bên lề đều mang nét chữ mềm mại đầy trân trọng đối với từng học sinh.',
  },
  {
    id: 'lore-17-reading-club-oath',
    act: 2,
    title: 'Lời Thề Dưới Ánh Đèn Dầu Thư Viện',
    location: 'Thư Viện Cấm (Âm Giới)',
    speaker: 'Ký ức Nhóm Đọc Sách',
    quote: '“Dẫu ngày mai sân trường nổi gió, bốn người chúng ta không ai bỏ rơi ai.”',
    body: 'Trong ánh đỏ rợn người của Âm Giới, bóng bốn người ngồi quây quanh bàn gỗ thư viện hiện lên rồi tan biến như khói. Lâm Tĩnh nhận ra mình từng mỉm cười thật lòng ở đây — trước khi nỗi sợ hãi biến cô thành kẻ phản bội.',
  },
  {
    id: 'lore-18-piano-duet',
    act: 3,
    title: 'Bản Nhạc “Tiếng Sáo Cô Sơn” Còn Dang Dở',
    location: 'Phòng Nhạc Cũ · Giá đàn dương cầm',
    speaker: 'Tô Dao & Thầy Trần Mặc',
    quote: '“Bốn phím ngà đầu tiên: Đồ → Mi → Sol → Rê — nghe như tiếng gió lùa qua rặng thông.”',
    body: 'Mỗi chiều thứ Sáu sau giờ tự học, Tô Dao thường gõ nhẹ từng phím đàn dương cầm cũ lệch dây, còn Thầy Trần Mặc ngồi bên cửa sổ đọc khẽ nhịp thơ cổ. Khi phím đàn cất tiếng trở lại giữa đêm mưa 1967, cánh cửa dẫn sang khu biệt giam từ từ hé mở.',
  },
];

export const SCENE_HOTSPOTS: readonly HotspotDef[] = [
  // HỒI 1 — LỚP HỌC 12B (65..1680)
  {
    id: 'hs-12b-ks1',
    scene: 'classroom_12b',
    x: 260,
    label: 'Bàn học của Lâm Tĩnh — Thẻ học sinh & Nhật ký',
    realm: 'both',
    kind: 'keepsake',
    keepsakeId: 'ks-1-linjing-badge',
  },
  {
    id: 'hs-12b-lore1',
    scene: 'classroom_12b',
    x: 680,
    label: 'Bảng đen Lớp 12B — Nét phấn của Tô Dao',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-1-blackboard',
  },
  {
    id: 'hs-12b-incense',
    scene: 'classroom_12b',
    x: 1120,
    label: 'Tủ gỗ cuối lớp — Bó Nhang & Vàng Mã',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.incense_bundle,
    dialogueText: 'Bạn lấy bó nhang trầm và vàng mã từ tủ giáo cụ.',
  },
  {
    id: 'hs-12b-door',
    scene: 'classroom_12b',
    x: 1590,
    label: 'Cửa ra Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 140,
  },

  // HỒI 1 — HÀNH LANG TẦNG 2 (60..2320)
  {
    id: 'hs-cor1-back',
    scene: 'corridor_act1',
    x: 100,
    label: 'Quay lại Lớp 12B',
    realm: 'both',
    kind: 'door',
    targetScene: 'classroom_12b',
    targetX: 1510,
  },
  {
    id: 'hs-cor1-infirmary-key',
    scene: 'corridor_act1',
    x: 340,
    label: 'Bảng tin hành lang — Chìa Khóa Phòng Y Tế',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.infirmary_key,
    dialogueText: 'Bạn gỡ được Chìa Khóa Phòng Y Tế chữ thập đỏ treo sau tờ thông báo giới nghiêm.',
  },
  {
    id: 'hs-cor1-lore2',
    scene: 'corridor_act1',
    x: 560,
    label: 'Trang sổ điểm rơi — Lời phê Thầy Trần Mặc',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-2-tranmac-margin',
  },
  {
    id: 'hs-cor1-to-infirmary',
    scene: 'corridor_act1',
    x: 780,
    label: 'Cửa Phòng Y Tế Cũ',
    realm: 'both',
    kind: 'door',
    targetScene: 'infirmary_wing',
    targetX: 140,
    requiredItem: 'infirmary_key',
    blockedHint: 'Phòng Y Tế khóa trái. Hãy kiểm tra bảng tin đầu hành lang để tìm chìa khóa chữ thập đỏ.',
  },
  {
    id: 'hs-cor1-teacher-key',
    scene: 'corridor_act1',
    x: 1040,
    label: 'Hốc tủ giáo án — Chìa Khóa Văn Phòng Thầy Trần Mặc',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.teachers_key,
    dialogueText: 'Bạn nhặt được Chìa Khóa Văn Phòng Thầy Trần Mặc giấu dưới tập bài văn cũ.',
  },
  {
    id: 'hs-cor1-altar',
    scene: 'corridor_act1',
    x: 1360,
    label: 'Bàn Thờ Ngũ Hành (Bùa trắng phủ kín)',
    realm: 'both',
    kind: 'wuxing_altar',
    dialogueText: 'Cần đốt vàng mã và thắp nhang theo đúng thứ tự Ngũ Hành: Kim → Thủy → Hỏa.',
  },
  {
    id: 'hs-cor1-to-office',
    scene: 'corridor_act1',
    x: 1720,
    label: 'Cửa Văn Phòng Thầy Trần Mặc',
    realm: 'both',
    kind: 'door',
    targetScene: 'teachers_office',
    targetX: 140,
    requiredItem: 'teachers_key',
    blockedHint: 'Cửa Văn Phòng Thầy Trần bị khóa. Hãy tìm Chìa Khóa ở hốc tủ giáo án hành lang tầng 2.',
  },
  {
    id: 'hs-cor1-shrine',
    scene: 'corridor_act1',
    x: 1980,
    label: 'Bát hương hành lang (Tĩnh tâm +12 Tỉnh táo)',
    realm: 'both',
    kind: 'sanity_shrine',
    dialogueText: 'Làn khói nhang trầm nhẹ nhàng xua bớt nỗi hoảng loạn.',
  },
  {
    id: 'hs-cor1-gate',
    scene: 'corridor_act1',
    x: 2230,
    label: 'Cổng sắt cầu thang xuống Sân Trường',
    realm: 'both',
    kind: 'door',
    targetScene: 'flooded_courtyard',
    targetX: 140,
    requiredFlag: 'wuxing_solved',
    requiredItem: 'lantern_oil',
    blockedHint:
      'Cần hoàn thành nghi lễ Ngũ Hành (bàn thờ) VÀ lấy Dầu Đèn Bão trong Phòng Y Tế để xuống sân mưa.',
  },

  // HỒI 1 — PHÒNG Y TẾ CŨ (65..1760)
  {
    id: 'hs-inf-back',
    scene: 'infirmary_wing',
    x: 100,
    label: 'Quay ra Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 780,
  },
  {
    id: 'hs-inf-lore15',
    scene: 'infirmary_wing',
    x: 520,
    label: 'Sổ Trực Y Tá — Ghi chép giờ cầu sập',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-15-infirmary-log',
  },
  {
    id: 'hs-inf-clock',
    scene: 'infirmary_wing',
    x: 1020,
    label: 'Đồng Hồ Quả Lắc Chết Đứng & Tủ Thuốc Khóa',
    realm: 'both',
    kind: 'clock_puzzle',
  },
  {
    id: 'hs-inf-shrine',
    scene: 'infirmary_wing',
    x: 1520,
    label: 'Giường bệnh cạnh cửa sổ mưa (Nghỉ lấy lại bình tĩnh)',
    realm: 'both',
    kind: 'sanity_shrine',
    dialogueText: 'Bạn hít một hơi sâu hương thảo dược còn sót lại trên gối.',
  },

  // HỒI 1 — VĂN PHÒNG THẦY TRẦN MẶC (65..1640)
  {
    id: 'hs-office-back',
    scene: 'teachers_office',
    x: 100,
    label: 'Quay ra Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 1720,
  },
  {
    id: 'hs-office-lore11',
    scene: 'teachers_office',
    x: 640,
    label: 'Sổ công tác Tổ Văn 1967 — Gợi ý mật mã hộp gỗ',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-11-teachers-desk',
  },
  {
    id: 'hs-office-cipher',
    scene: 'teachers_office',
    x: 1260,
    label: 'Hộp Khóa Số 3 Chữ Số trên Bàn Thầy Trần Mặc',
    realm: 'both',
    kind: 'cipher_box',
    keepsakeId: 'ks-7-tranmac-pass',
  },

  // HỒI 1 — SÂN TRƯỜNG NGẬP LŨ (60..2080)
  {
    id: 'hs-court-back',
    scene: 'flooded_courtyard',
    x: 100,
    label: 'Quay lên Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 2150,
  },
  {
    id: 'hs-court-money',
    scene: 'flooded_courtyard',
    x: 420,
    label: 'Chậu đồng cạnh hiên — Xấp Tiền Vàng Mã Cháy Dở',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.spirit_money,
    dialogueText: 'Bạn nhặt lại xấp tiền vàng mã còn nguyên vẹn dưới mái hiên ngập nước.',
  },
  {
    id: 'hs-court-lore3',
    scene: 'flooded_courtyard',
    x: 780,
    label: 'Mảnh thủy tinh vỡ dưới mưa bão',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-3-courtyard-glass',
  },
  {
    id: 'hs-court-flagpole',
    scene: 'flooded_courtyard',
    x: 1140,
    label: 'Cột Cờ Giữa Sân Trường (Xác treo ngược)',
    realm: 'both',
    kind: 'flagpole_corpse',
    keepsakeId: 'ks-2-newspaper',
    dialogueText:
      'Trương Vệ Quốc bị treo ngược trên cột cờ, miệng nhét đầy giấy báo cũ. Loa phóng thanh rè rè: "Kẻ phản bội vẫn còn trốn trong trường."',
  },
  {
    id: 'hs-court-battery',
    scene: 'flooded_courtyard',
    x: 1560,
    label: 'Trạm loa phóng thanh — Pin đài cũ',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.radio_battery,
    dialogueText: 'Bạn nhặt được hộp pin khô còn sót dưới chân loa phóng thanh.',
  },
  {
    id: 'hs-court-to-dorm',
    scene: 'flooded_courtyard',
    x: 1990,
    label: 'Lối sang Khu Ký Túc Xá Nữ (Hồi 2)',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 140,
    requiredFlag: 'act1_climax_seen',
    blockedHint: 'Hãy kiểm tra cột cờ giữa sân trường trước khi rời khỏi sân mưa.',
  },

  // HỒI 2 — KÝ TÚC XÁ NỮ (60..2300)
  {
    id: 'hs-dorm-back',
    scene: 'dorm_hall',
    x: 100,
    label: 'Quay lại Sân Trường',
    realm: 'both',
    kind: 'door',
    targetScene: 'flooded_courtyard',
    targetX: 1900,
  },
  {
    id: 'hs-dorm-lore4',
    scene: 'dorm_hall',
    x: 420,
    label: 'Giường tầng của Tô Dao — Khăn len hoa mai đan dở',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-4-todao-scarf',
  },
  {
    id: 'hs-dorm-illogical',
    scene: 'dorm_hall',
    x: 780,
    label: 'Cửa phòng ngủ — Dẫn thẳng sang Phòng Phát Thanh',
    realm: 'both',
    kind: 'illogical_door',
    targetScene: 'broadcast_room',
    targetX: 140,
    dialogueText: 'Bạn mở cửa phòng ngủ nữ sinh... nhưng phía sau lại là Phòng Phát Thanh tối om.',
  },
  {
    id: 'hs-dorm-lore5',
    scene: 'dorm_hall',
    x: 1140,
    label: 'Bốn tờ giấy tố cáo vò nát (Âm Giới)',
    realm: 'yin',
    kind: 'lore',
    loreId: 'lore-5-yin-draft',
  },
  {
    id: 'hs-dorm-shrine',
    scene: 'dorm_hall',
    x: 1440,
    label: 'Góc bàn thờ nhỏ ký túc xá (Tĩnh tâm +12 Tỉnh táo)',
    realm: 'both',
    kind: 'sanity_shrine',
    dialogueText: 'Tiếng gió gào dịu lại đôi chút khi bạn đặt tay lên khung gỗ cũ.',
  },
  {
    id: 'hs-dorm-to-library',
    scene: 'dorm_hall',
    x: 1780,
    label: 'Lối vào Thư Viện Cấm & Gác Xép',
    realm: 'both',
    kind: 'door',
    targetScene: 'library_archive',
    targetX: 140,
    requiredFlag: 'radio_act2_tuned',
    blockedHint:
      'Cánh cửa Thư Viện bị kiến trúc phi logic khóa chặt. Hãy qua Phòng Phát Thanh dò Đài Bán Dẫn 104.7 MHz trước.',
  },
  {
    id: 'hs-dorm-to-darkroom',
    scene: 'dorm_hall',
    x: 2210,
    label: 'Cửa Phòng Rửa Ảnh Tối',
    realm: 'both',
    kind: 'door',
    targetScene: 'darkroom',
    targetX: 140,
    requiredFlag: 'library_books_solved',
    blockedHint:
      'Cần giải mã Giá Sách Nhóm Đọc Sách trong Thư Viện Cấm để mở niêm phong Phòng Rửa Ảnh.',
  },

  // HỒI 2 — PHÒNG PHÁT THANH (65..1640)
  {
    id: 'hs-broad-exit',
    scene: 'broadcast_room',
    x: 100,
    label: 'Bước ra Khu Ký Túc Xá',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 780,
  },
  {
    id: 'hs-broad-lore6',
    scene: 'broadcast_room',
    x: 500,
    label: 'Đống tro sách cấm sau tủ phát thanh',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-6-forbidden-list',
  },
  {
    id: 'hs-broad-radio',
    scene: 'broadcast_room',
    x: 940,
    label: 'Chiếc Đài Bán Dẫn Cũ (Dò tần số Âm – Dương)',
    realm: 'both',
    kind: 'radio',
  },
  {
    id: 'hs-broad-key',
    scene: 'broadcast_room',
    x: 1440,
    label: 'Ngăn kéo bàn phát thanh — Chìa khóa Phòng Rửa Ảnh',
    realm: 'yin',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.darkroom_key,
    dialogueText: 'Trong Âm giới, bạn tìm thấy chìa khóa đồng Phòng Rửa Ảnh nằm dưới cuộn băng.',
  },

  // HỒI 2 — THƯ VIỆN CẤM & GÁC XÉP (65..1860)
  {
    id: 'hs-lib-back',
    scene: 'library_archive',
    x: 100,
    label: 'Quay lại Khu Ký Túc Xá',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 1780,
  },
  {
    id: 'hs-lib-lore16',
    scene: 'library_archive',
    x: 460,
    label: 'Bàn đọc sách cuối dãy — Mục lục Sách Cấm',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-16-banned-poetry',
  },
  {
    id: 'hs-lib-lore17',
    scene: 'library_archive',
    x: 840,
    label: 'Bóng đèn dầu nhóm đọc sách (Âm Giới)',
    realm: 'yin',
    kind: 'lore',
    loreId: 'lore-17-reading-club-oath',
  },
  {
    id: 'hs-lib-ks3',
    scene: 'library_archive',
    x: 1220,
    label: 'Nhà kho sau thư viện — Sổ Thơ Chép Tay Cháy Dở (Âm Giới)',
    realm: 'yin',
    kind: 'keepsake',
    keepsakeId: 'ks-3-burned-poetry',
  },
  {
    id: 'hs-lib-bookshelf',
    scene: 'library_archive',
    x: 1640,
    label: 'Giá Sách Bí Mật Nhóm Đọc Sách Cô Sơn',
    realm: 'both',
    kind: 'bookshelf_cipher',
  },

  // HỒI 2 — PHÒNG RỬA ẢNH TỐI (65..1660)
  {
    id: 'hs-dark-back',
    scene: 'darkroom',
    x: 100,
    label: 'Quay lại Ký Túc Xá',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 2120,
  },
  {
    id: 'hs-dark-lore7',
    scene: 'darkroom',
    x: 560,
    label: 'Ngăn tủ hồ sơ mật Đội Tự Vệ',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-7-darkroom-ledger',
  },
  {
    id: 'hs-dark-tray',
    scene: 'darkroom',
    x: 1080,
    label: 'Khay thuốc hiện hình dưới ánh đèn đỏ',
    realm: 'both',
    kind: 'darkroom_tray',
    keepsakeId: 'ks-4-negative-film',
  },
  {
    id: 'hs-dark-to-auditorium',
    scene: 'darkroom',
    x: 1570,
    label: 'Cánh cửa Hội Trường Lớn (Hồi 3)',
    realm: 'both',
    kind: 'door',
    targetScene: 'auditorium',
    targetX: 140,
    requiredFlag: 'act2_climax_seen',
    blockedHint: 'Hãy kiểm tra khay thuốc rửa ảnh dưới ánh đèn đỏ trước.',
  },

  // HỒI 3 — HỘI TRƯỜNG LỚN (60..2220)
  {
    id: 'hs-aud-back',
    scene: 'auditorium',
    x: 100,
    label: 'Quay lại Phòng Rửa Ảnh',
    realm: 'both',
    kind: 'door',
    targetScene: 'darkroom',
    targetX: 1480,
  },
  {
    id: 'hs-aud-radio-secret',
    scene: 'auditorium',
    x: 460,
    label: 'Máy thu sóng dự phòng góc sân khấu (Giải mã bí mật Hồi 3)',
    realm: 'both',
    kind: 'radio',
  },
  {
    id: 'hs-aud-lore8',
    scene: 'auditorium',
    x: 840,
    label: 'Chân bục đấu tố — Ký ức cái tát trong mưa',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-8-auditorium-slap',
  },
  {
    id: 'hs-aud-sheet',
    scene: 'auditorium',
    x: 1220,
    label: 'Hàng ghế đầu — Trang Bản Nhạc “Tiếng Sáo Cô Sơn”',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.music_sheet,
    dialogueText: 'Bạn nhặt được bản nhạc viết tay của Tô Dao: Đồ → Mi → Sol → Rê.',
  },
  {
    id: 'hs-aud-puppets',
    scene: 'auditorium',
    x: 1620,
    label: 'Sân Khấu Bì Ảnh Hí Khổng Lồ',
    realm: 'both',
    kind: 'puppet_stage',
  },
  {
    id: 'hs-aud-to-music',
    scene: 'auditorium',
    x: 2130,
    label: 'Lối vào Phòng Nhạc Cũ',
    realm: 'both',
    kind: 'door',
    targetScene: 'music_classroom',
    targetX: 140,
    requiredFlag: 'puppets_solved',
    blockedHint: 'Cần tái hiện đầy đủ 4 màn kịch rối bóng Bì Ảnh Hí để mở lối sang Phòng Nhạc Cũ.',
  },

  // HỒI 3 — PHÒNG NHẠC CŨ (65..1780)
  {
    id: 'hs-music-back',
    scene: 'music_classroom',
    x: 100,
    label: 'Quay lại Hội Trường Lớn',
    realm: 'both',
    kind: 'door',
    targetScene: 'auditorium',
    targetX: 2040,
  },
  {
    id: 'hs-music-lore18',
    scene: 'music_classroom',
    x: 520,
    label: 'Giá chép nhạc bảng đen — Ký ức chiều thứ Sáu',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-18-piano-duet',
  },
  {
    id: 'hs-music-piano',
    scene: 'music_classroom',
    x: 1060,
    label: 'Đàn Dương Cầm Đứt Dây (Gõ khúc nhạc Cô Sơn)',
    realm: 'both',
    kind: 'piano_puzzle',
  },
  {
    id: 'hs-music-to-prison',
    scene: 'music_classroom',
    x: 1690,
    label: 'Hành lang xuống Khu Biệt Giam',
    realm: 'both',
    kind: 'door',
    targetScene: 'prison_cells',
    targetX: 140,
    requiredFlag: 'piano_solved',
    blockedHint: 'Hãy đàn đúng 4 nốt (Đồ → Mi → Sol → Rê) trên Dương Cầm để mở khóa lối xuống Khu Biệt Giam.',
  },

  // HỒI 3 — KHU BIỆT GIAM (60..1920)
  {
    id: 'hs-pris-back',
    scene: 'prison_cells',
    x: 100,
    label: 'Quay lại Phòng Nhạc Cũ',
    realm: 'both',
    kind: 'door',
    targetScene: 'music_classroom',
    targetX: 1600,
  },
  {
    id: 'hs-pris-lore9',
    scene: 'prison_cells',
    x: 460,
    label: 'Vết cào thơ trên bức tường gạch ẩm',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-9-prison-scratches',
  },
  {
    id: 'hs-pris-crack',
    scene: 'prison_cells',
    x: 880,
    label: 'Khe gạch phòng biệt giam của Tô Dao',
    realm: 'both',
    kind: 'prison_crack',
    keepsakeId: 'ks-5-todao-note',
  },
  {
    id: 'hs-pris-mallet',
    scene: 'prison_cells',
    x: 1280,
    label: 'Góc phòng gác — Vồ Gỗ Tháp Chuông Cô Sơn',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.bell_mallet,
    dialogueText: 'Bạn nhặt được Vồ Gỗ sồi nặng trịch để thỉnh chiếc chuông đồng trên sân thượng.',
  },
  {
    id: 'hs-pris-shrine',
    scene: 'prison_cells',
    x: 1560,
    label: 'Ngọn nến tàn cuối hành lang (Tĩnh tâm +12 Tỉnh táo)',
    realm: 'both',
    kind: 'sanity_shrine',
    dialogueText: 'Ánh nến nhỏ giúp nhịp tim bạn lắng xuống trước khi bước lên sân thượng.',
  },
  {
    id: 'hs-pris-to-rooftop',
    scene: 'prison_cells',
    x: 1830,
    label: 'Cầu thang sắt lên Sân Thượng & Tháp Chuông (Cao trào Hồi 3)',
    realm: 'both',
    kind: 'door',
    targetScene: 'roof_belltower',
    targetX: 140,
    requiredFlag: 'act3_climax_seen',
    blockedHint: 'Hãy tìm mẩu giấy Tô Dao giấu trong khe gạch phòng giam trước khi lên sân thượng.',
  },

  // HỒI 3 — SÂN THƯỢNG & THÁP CHUÔNG (60..1960)
  {
    id: 'hs-roof-back',
    scene: 'roof_belltower',
    x: 100,
    label: 'Quay xuống Khu Biệt Giam',
    realm: 'both',
    kind: 'door',
    targetScene: 'prison_cells',
    targetX: 1740,
  },
  {
    id: 'hs-roof-lore12',
    scene: 'roof_belltower',
    x: 520,
    label: 'Lan can sân thượng nhìn xuống vực lũ đỏ',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-12-rooftop-storm',
  },
  {
    id: 'hs-roof-bell',
    scene: 'roof_belltower',
    x: 1040,
    label: 'Chuông Đồng Cô Sơn (Thỉnh 3 hồi chuông Thanh Minh)',
    realm: 'both',
    kind: 'bronze_bell',
    keepsakeId: 'ks-8-rooftop-letter',
  },
  {
    id: 'hs-roof-lore13',
    scene: 'roof_belltower',
    x: 1480,
    label: 'Dải ruy-băng đỏ trên bậc đá tháp chuông',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-13-bell-echo',
  },
  {
    id: 'hs-roof-to-1986',
    scene: 'roof_belltower',
    x: 1870,
    label: 'Bước qua Màn Sương 20 Năm Sau (Hồi 4)',
    realm: 'both',
    kind: 'door',
    targetScene: 'ruined_hall_1986',
    targetX: 140,
    requiredFlag: 'bell_ritual_done',
    blockedHint: 'Hãy dùng Vồ Gỗ (tìm ở Khu Biệt Giam) thỉnh đủ 3 hồi Chuông Đồng để tan màn sương năm 1967.',
  },

  // HỒI 4 — CÔ SƠN HOANG TÀN 1986 (60..1980)
  {
    id: 'hs-1986-back',
    scene: 'ruined_hall_1986',
    x: 100,
    label: 'Quay lại Sân Thượng Cô Sơn',
    realm: 'both',
    kind: 'door',
    targetScene: 'roof_belltower',
    targetX: 1780,
  },
  {
    id: 'hs-1986-wine',
    scene: 'ruined_hall_1986',
    x: 420,
    label: 'Bệ cửa sổ rêu — Chén Rượu Tế Thanh Minh',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.wine_cup,
    dialogueText: 'Bạn nhặt được chén rượu trắng Thanh Minh để tưởng nhớ người đã khuất.',
  },
  {
    id: 'hs-1986-pen',
    scene: 'ruined_hall_1986',
    x: 780,
    label: 'Bàn học phủ rêu — Cây bút máy & Áo đồng phục cũ',
    realm: 'both',
    kind: 'keepsake',
    keepsakeId: 'ks-6-tranmac-pen',
  },
  {
    id: 'hs-1986-memorial',
    scene: 'ruined_hall_1986',
    x: 1140,
    label: 'Bia đá Thanh Minh (1986) — Tô Viễn, em trai Tô Dao',
    realm: 'both',
    kind: 'memorial_1986',
    loreId: 'lore-10-to-vien-1986',
  },
  {
    id: 'hs-1986-mirror',
    scene: 'ruined_hall_1986',
    x: 1500,
    label: 'Tấm gương nứt vỡ (Ngôi trường sau 20 năm)',
    realm: 'both',
    kind: 'mirror_1980',
    dialogueText: 'Trong gương, ngôi trường đã sụp đổ thành đống hoang tàn thập niên 1980. Bạn nhận ra mình đã chết từ 20 năm trước...',
  },
  {
    id: 'hs-1986-to-trial',
    scene: 'ruined_hall_1986',
    x: 1890,
    label: 'Cửa Phòng Thẩm Vấn Cuối Cùng',
    realm: 'both',
    kind: 'door',
    targetScene: 'final_interrogation',
    targetX: 140,
  },

  // HỒI 4 — PHÒNG THẨM VẤN CUỐI CÙNG (65..1540)
  {
    id: 'hs-trial-lore14',
    scene: 'final_interrogation',
    x: 560,
    label: 'Ngưỡng cửa đen — Nhật ký cuối cùng của Lâm Tĩnh',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-14-threshold-silence',
  },
  {
    id: 'hs-trial-chair',
    scene: 'final_interrogation',
    x: 1180,
    label: 'Ngồi vào ghế đối diện Bóng Ma Lâm Tĩnh',
    realm: 'both',
    kind: 'interrogation_chair',
  },
];

export function createInitialThanhMinhState(loopCount = 1): ThanhMinhState {
  return {
    act: 1,
    scene: 'classroom_12b',
    realm: 'yang',
    playerX: 145,
    playerFacing: 1,
    walkPhase: 0,

    holdingBreath: false,
    breathStamina: 100,
    gaspPenaltyTimer: 0,
    runStamina: 100,
    isRunning: false,
    isMoving: false,
    exhausted: false,
    sanity: 100,
    sanityBottomCount: 0,
    gazeExposure: 0,

    inventory: [],
    collectedKeepsakeIds: [],
    collectedLoreIds: [],
    activeLoreId: null,
    flags: {},

    wuxingSequence: [],
    clockHour: 12,
    clockMinute: 0,
    clockSolved: false,
    cipherDigits: [0, 0, 0],
    cipherSolved: false,
    radioFrequency: 88.5,
    radioTunedAct2: false,
    radioSecretAct3Solved: false,
    bookshelfOrder: [1, 2, 0],
    bookshelfSolved: false,
    puppetOrder: [2, 0, 3, 1],
    puppetsSolved: false,
    pianoSequence: [],
    pianoSolved: false,
    bellRings: 0,

    interrogationStep: 0,
    confessionAnswers: [],

    horrorPulseTimer: 7.5,
    activePhantomX: null,
    activePhantomTimer: 0,
    activePhantomKind: null,
    audioVacuumTimer: 0,
    pendingDreadBeat: null,
    panicTimer: 0,
    doorJamTimer: 0,
    lanternSputterTimer: 0,
    fakeoutKind: null,
    fakeoutX: null,
    fakeoutTimer: 0,
    postFakeoutAmbushTimer: 0,
    dreadCycleCount: 0,
    modalReadTimer: 0,
    uiIntrusionTimer: 0,
    sceneVisitCounts: { classroom_12b: 1 },

    ghosts: [
      {
        id: 'ghost-act1-paperhat',
        kind: 'paper_hat',
        variant: 'paper_hat',
        name: 'Vong Hồn Mũ Giấy',
        placardText: 'PHẢN ĐỘNG',
        scene: 'corridor_act1',
        x: 1220,
        minX: 380,
        maxX: 2040,
        vx: 38,
        facing: 1,
        pacified: false,
      },
      {
        id: 'ghost-act1-infirmary',
        kind: 'paper_hat',
        variant: 'paper_hat',
        name: 'Bóng Ma Phòng Y Tế',
        placardText: 'BỆNH HOẠN',
        scene: 'infirmary_wing',
        x: 960,
        minX: 300,
        maxX: 1520,
        vx: -34,
        facing: -1,
        pacified: false,
      },
      {
        id: 'ghost-act2-tonguewarden',
        kind: 'tongue_warden',
        variant: 'tongue_warden',
        name: 'Quỷ Sai Cắt Lưỡi',
        placardText: 'VU KHỐNG',
        scene: 'dorm_hall',
        x: 1320,
        minX: 360,
        maxX: 2040,
        vx: -46,
        facing: -1,
        pacified: false,
      },
      {
        id: 'ghost-act2-librarian',
        kind: 'paper_hat',
        variant: 'librarian_wraith',
        name: 'Thủ Thư Đốt Sách',
        placardText: 'CẤM THƯ',
        scene: 'library_archive',
        x: 1080,
        minX: 320,
        maxX: 1620,
        vx: -40,
        facing: -1,
        pacified: false,
      },
      {
        id: 'ghost-act3-auditor',
        kind: 'tongue_warden',
        variant: 'auditor_specter',
        name: 'Ác Linh Tự Vệ — Trương Vệ Quốc',
        placardText: 'ĐẤU TỐ',
        scene: 'auditorium',
        x: 1420,
        minX: 460,
        maxX: 1960,
        vx: -42,
        facing: -1,
        pacified: false,
      },
      {
        id: 'ghost-act3-cellwarden',
        kind: 'tongue_warden',
        variant: 'tongue_warden',
        name: 'Cai Ngục Biệt Giam',
        placardText: 'BIỆT GIAM',
        scene: 'prison_cells',
        x: 1060,
        minX: 340,
        maxX: 1640,
        vx: 44,
        facing: 1,
        pacified: false,
      },
      {
        id: 'ghost-act3-rooftop',
        kind: 'paper_hat',
        variant: 'paper_hat',
        name: 'Oan Hồn Tháp Chuông',
        placardText: 'CÁO GIÁC',
        scene: 'roof_belltower',
        x: 1220,
        minX: 360,
        maxX: 1720,
        vx: -38,
        facing: -1,
        pacified: false,
      },
    ],

    deathCutscene: null,
    activeModal: 'none',
    activeHotspotId: null,
    subtitleText:
      loopCount > 1
        ? `Vòng lặp thứ ${loopCount}... Bạn lại tỉnh dậy trên bàn học Lớp 12B giữa tiếng mưa bão.`
        : 'Đêm mưa bão năm 1967. Lâm Tĩnh tỉnh dậy trong Lớp 12B trống rỗng, cây cầu nối núi Cô Sơn đã bị dòng lũ đỏ cuốn trôi.',
    subtitleTimer: 6.0,
    ending: 'none',
    endingTimer: 0,
    loopCount,
  };
}

export function findNearbyHotspot(state: ThanhMinhState): HotspotDef | null {
  let best: HotspotDef | null = null;
  let bestDist = 78;
  for (const hs of SCENE_HOTSPOTS) {
    if (hs.scene !== state.scene) continue;
    if (hs.realm !== 'both' && hs.realm !== state.realm) continue;
    const d = Math.abs(hs.x - state.playerX);
    if (d < bestDist) {
      bestDist = d;
      best = hs;
    }
  }
  return best;
}

export function toggleRealmShift(state: ThanhMinhState): {
  next: ThanhMinhState;
  shifted: boolean;
} {
  if (!state.radioTunedAct2) {
    return {
      next: {
        ...state,
        subtitleText: 'Cần dò đúng tần số Đài Bán Dẫn (104.7 MHz) ở Phòng Phát Thanh trước khi chuyển sang Âm Giới.',
        subtitleTimer: 3.8,
      },
      shifted: false,
    };
  }
  const nextRealm: RealmMode = state.realm === 'yang' ? 'yin' : 'yang';
  return {
    next: {
      ...state,
      realm: nextRealm,
      subtitleText:
        nextRealm === 'yin'
          ? 'Sóng nhiễu kéo không gian sang Âm Giới đỏ thẫm — ký ức bị che giấu dần hiện hình.'
          : 'Không gian trở về thực tại u tối của Học Viện Cô Sơn.',
      subtitleTimer: 3.4,
    },
    shifted: true,
  };
}

export function interactWithHotspot(state: ThanhMinhState): ThanhMinhState {
  if (state.ending !== 'none' || state.activeModal !== 'none') return state;
  const hs = findNearbyHotspot(state);
  if (!hs) return state;

  if ((hs.kind === 'door' || hs.kind === 'illogical_door') && hs.targetScene) {
    if ((state.doorJamTimer ?? 0) > 0) {
      return {
        ...state,
        subtitleText:
          'Tay nắm cửa bị bóp chặt từ bên kia — cơn hoảng loạn khiến cánh cửa kẹt cứng trong giây lát!',
        subtitleTimer: 3.0,
      };
    }
    if (hs.requiredItem && !state.inventory.includes(hs.requiredItem)) {
      return {
        ...state,
        subtitleText: hs.blockedHint ?? 'Cánh cửa bị khóa.',
        subtitleTimer: 4.4,
      };
    }
    if (hs.requiredFlag && !state.flags[hs.requiredFlag]) {
      return {
        ...state,
        subtitleText: hs.blockedHint ?? 'Cánh cửa bị khóa.',
        subtitleTimer: 4.2,
      };
    }
    const targetMeta = SCENE_META[hs.targetScene];
    const nextVisits = {
      ...(state.sceneVisitCounts ?? {}),
      [hs.targetScene]: ((state.sceneVisitCounts ?? {})[hs.targetScene] ?? 0) + 1,
    };
    return {
      ...state,
      scene: hs.targetScene,
      act: targetMeta.act,
      playerX: hs.targetX ?? 140,
      activePhantomX: null,
      activePhantomTimer: 0,
      audioVacuumTimer: 0,
      pendingDreadBeat: null,
      fakeoutKind: null,
      fakeoutX: null,
      fakeoutTimer: 0,
      sceneVisitCounts: nextVisits,
      subtitleText: hs.dialogueText ?? `Bước vào ${targetMeta.title}.`,
      subtitleTimer: 3.8,
    };
  }

  if (hs.kind === 'pickup' && hs.itemReward) {
    if (state.inventory.includes(hs.itemReward.id)) {
      return { ...state, subtitleText: 'Không còn gì ở đây nữa.', subtitleTimer: 2.4 };
    }
    return {
      ...state,
      inventory: [...state.inventory, hs.itemReward.id],
      subtitleText: `Nhặt được: ${hs.itemReward.name}. ${hs.dialogueText ?? ''}`,
      subtitleTimer: 4.0,
    };
  }

  if (hs.kind === 'keepsake' && hs.keepsakeId) {
    const already = state.collectedKeepsakeIds.includes(hs.keepsakeId);
    const ks = TRUTH_KEEPSAKES.find((k) => k.id === hs.keepsakeId);
    return {
      ...state,
      collectedKeepsakeIds: already
        ? state.collectedKeepsakeIds
        : [...state.collectedKeepsakeIds, hs.keepsakeId],
      activeModal: 'journal',
      activeHotspotId: hs.id,
      subtitleText: ks ? `Thu thập ${ks.title}` : '',
      subtitleTimer: 4.0,
    };
  }

  if (hs.kind === 'lore' && hs.loreId) {
    const entry = STORY_LORE_ENTRIES.find((l) => l.id === hs.loreId);
    const already = state.collectedLoreIds.includes(hs.loreId);
    const unlockedDrawer =
      hs.loreId === 'lore-7-darkroom-ledger' && state.inventory.includes('darkroom_key');
    return {
      ...state,
      collectedLoreIds: already ? state.collectedLoreIds : [...state.collectedLoreIds, hs.loreId],
      activeLoreId: hs.loreId,
      flags: unlockedDrawer
        ? { ...state.flags, darkroom_drawer_opened: true }
        : state.flags,
      activeModal: 'memory_echo',
      activeHotspotId: hs.id,
      subtitleText: entry
        ? unlockedDrawer
          ? `Mở khóa bằng Chìa Đồng: ${entry.title}`
          : `Mảnh ký ức: ${entry.title}`
        : '',
      subtitleTimer: 4.5,
    };
  }

  if (hs.kind === 'sanity_shrine') {
    const flagKey = `shrine_${hs.id}`;
    if (state.flags[flagKey]) {
      return {
        ...state,
        subtitleText: 'Hơi ấm tại đây đã cạn, chỉ còn tiếng mưa rơi ngoài hiên.',
        subtitleTimer: 3.0,
      };
    }
    return {
      ...state,
      flags: { ...state.flags, [flagKey]: true },
      sanity: Math.min(100, state.sanity + 14),
      subtitleText: `${hs.dialogueText ?? 'Tâm trí dịu lại đôi chút.'} (+14 Tỉnh táo)`,
      subtitleTimer: 4.2,
    };
  }

  if (hs.kind === 'memorial_1986' && hs.loreId) {
    const already = state.collectedLoreIds.includes(hs.loreId);
    const hasOfferings =
      state.inventory.includes('wine_cup') || state.inventory.includes('spirit_money');
    const didTributeNow = hasOfferings && !state.flags.offered_qingming_tribute;
    return {
      ...state,
      collectedLoreIds: already ? state.collectedLoreIds : [...state.collectedLoreIds, hs.loreId],
      activeLoreId: hs.loreId,
      flags: didTributeNow
        ? { ...state.flags, offered_qingming_tribute: true }
        : state.flags,
      sanity: didTributeNow ? Math.min(100, state.sanity + 18) : state.sanity,
      activeModal: 'memory_echo',
      activeHotspotId: hs.id,
      subtitleText: didTributeNow
        ? 'Bạn dâng chén rượu Thanh Minh & vàng mã. Tô Viễn khẽ gật đầu — tâm trí dịu lại (+18 Tỉnh táo).'
        : 'Tô Viễn (1986) lặng lẽ đặt nhành cúc trắng bên bia đá rêu phong trên đỉnh Cô Sơn.',
      subtitleTimer: 5.5,
    };
  }

  if (hs.kind === 'flagpole_corpse') {
    const inv = state.collectedKeepsakeIds.includes('ks-2-newspaper')
      ? state.collectedKeepsakeIds
      : [...state.collectedKeepsakeIds, 'ks-2-newspaper'];
    return {
      ...state,
      collectedKeepsakeIds: inv,
      flags: { ...state.flags, act1_climax_seen: true },
      sanity: Math.max(15, state.sanity - 14),
      subtitleText: hs.dialogueText ?? '',
      subtitleTimer: 6.2,
    };
  }

  if (hs.kind === 'wuxing_altar') {
    if (state.flags.wuxing_solved) {
      return {
        ...state,
        subtitleText: 'Bàn thờ Ngũ Hành đã cháy bùng ngọn lửa thanh tẩy, vong hồn hành lang đã tan biến.',
        subtitleTimer: 3.4,
      };
    }
    return {
      ...state,
      activeModal: 'wuxing_puzzle',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'clock_puzzle') {
    if (state.clockSolved) {
      return {
        ...state,
        activeModal: 'journal',
        activeHotspotId: hs.id,
        subtitleText: 'Tủ thuốc 02:15 đã mở. Bạn đã lấy Bình Dầu Đèn Bão và Phiếu Khám Bệnh.',
        subtitleTimer: 3.8,
      };
    }
    return {
      ...state,
      activeModal: 'clock_puzzle',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'bookshelf_cipher') {
    return {
      ...state,
      activeModal: 'bookshelf_cipher',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'piano_puzzle') {
    return {
      ...state,
      activeModal: 'piano_puzzle',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'radio') {
    if (state.scene === 'broadcast_room' && !state.inventory.includes('radio_battery')) {
      return {
        ...state,
        subtitleText: 'Đài bán dẫn hết pin! Hãy tìm Pin Đèn Cũ dưới trạm loa Sân Trường.',
        subtitleTimer: 4.0,
      };
    }
    return {
      ...state,
      activeModal: 'radio_tuner',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'darkroom_tray') {
    const nextKs = state.collectedKeepsakeIds.includes('ks-4-negative-film')
      ? state.collectedKeepsakeIds
      : [...state.collectedKeepsakeIds, 'ks-4-negative-film'];
    return {
      ...state,
      collectedKeepsakeIds: nextKs,
      flags: { ...state.flags, act2_climax_seen: true },
      activeModal: 'darkroom_reveal',
      activeHotspotId: hs.id,
      sanity: Math.max(15, state.sanity - 12),
    };
  }

  if (hs.kind === 'puppet_stage') {
    return {
      ...state,
      activeModal: 'puppet_theatre',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'prison_crack') {
    const nextKs = state.collectedKeepsakeIds.includes('ks-5-todao-note')
      ? state.collectedKeepsakeIds
      : [...state.collectedKeepsakeIds, 'ks-5-todao-note'];
    return {
      ...state,
      collectedKeepsakeIds: nextKs,
      flags: { ...state.flags, act3_climax_seen: true },
      activeModal: 'journal',
      activeHotspotId: hs.id,
      subtitleText: 'Tô Dao: "Tĩnh, đừng sợ, tớ đốt tên cậu rồi. Ráng sống tiếp nhé."',
      subtitleTimer: 5.5,
    };
  }

  if (hs.kind === 'cipher_box') {
    if (state.cipherSolved) {
      return {
        ...state,
        activeModal: 'journal',
        activeHotspotId: hs.id,
        subtitleText: 'Hộp khóa gỗ 4-0-5 đã mở. Tấm giấy thông hành mang tên Lâm Tĩnh nằm trong sổ kỷ vật.',
        subtitleTimer: 4.0,
      };
    }
    return {
      ...state,
      activeModal: 'cipher_lock',
      activeHotspotId: hs.id,
    };
  }

  if (hs.kind === 'bronze_bell') {
    if (state.flags.bell_ritual_done) {
      return {
        ...state,
        subtitleText: 'Ba hồi chuông Thanh Minh đã ngân vang — lối sang Cô Sơn năm 1986 đã mở.',
        subtitleTimer: 3.6,
      };
    }
    if (!state.inventory.includes('bell_mallet')) {
      return {
        ...state,
        subtitleText: 'Chiếc chuông đồng nứt quá nặng để đánh bằng tay. Cần tìm Vồ Gỗ Tháp Chuông ở Khu Biệt Giam.',
        subtitleTimer: 4.4,
      };
    }
    const nextRings = Math.min(3, state.bellRings + 1);
    const completed = nextRings >= 3;
    const nextKs =
      completed && !state.collectedKeepsakeIds.includes('ks-8-rooftop-letter')
        ? [...state.collectedKeepsakeIds, 'ks-8-rooftop-letter']
        : state.collectedKeepsakeIds;
    const ringMessages = [
      'HỒI CHUÔNG THỨ NHẤT (1/3): Tiếng đồng rạn ngân dài giữa màn mưa — gió bỗng lặng đi một nhịp...',
      'HỒI CHUÔNG THỨ HAI (2/3): Tiếng bước chân khẽ lướt sau lưng. Giọng Tô Dao thoảng qua: “Tĩnh ơi...”',
      'HỒI CHUÔNG THỨ BA (3/3): Oan hồn tan vào màn sương. Một bức thư úa vàng rơi ra dưới chân chuông đồng!',
    ];
    return {
      ...state,
      bellRings: nextRings,
      collectedKeepsakeIds: nextKs,
      flags: completed ? { ...state.flags, bell_ritual_done: true } : state.flags,
      ghosts: completed
        ? state.ghosts.map((g) => (g.scene === 'roof_belltower' ? { ...g, pacified: true } : g))
        : state.ghosts,
      activeModal: completed ? 'journal' : 'none',
      activeHotspotId: completed ? hs.id : null,
      subtitleText: ringMessages[nextRings - 1],
      subtitleTimer: 5.5,
    };
  }

  if (hs.kind === 'mirror_1980') {
    return {
      ...state,
      flags: { ...state.flags, saw_20_years_ruin: true },
      subtitleText: hs.dialogueText ?? '',
      subtitleTimer: 5.5,
    };
  }

  if (hs.kind === 'interrogation_chair') {
    return {
      ...state,
      activeModal: 'interrogation_trial',
      activeHotspotId: hs.id,
      interrogationStep: 0,
      confessionAnswers: [],
    };
  }

  return state;
}

export function setInfirmaryClock(
  state: ThanhMinhState,
  hour: number,
  minute: number
): { next: ThanhMinhState; solved: boolean } {
  const cleanHour = ((Math.round(hour) - 1 + 12) % 12) + 1; // 1..12
  const cleanMinute = ((Math.round(minute / 5) * 5) % 60 + 60) % 60; // 0..55 step 5
  const solved = cleanHour === 2 && cleanMinute === 15;

  if (solved) {
    const nextInv = state.inventory.includes('lantern_oil')
      ? state.inventory
      : [...state.inventory, 'lantern_oil' as OfferingItemId];
    const nextKs = state.collectedKeepsakeIds.includes('ks-9-medical-slip')
      ? state.collectedKeepsakeIds
      : [...state.collectedKeepsakeIds, 'ks-9-medical-slip'];
    return {
      next: {
        ...state,
        clockHour: cleanHour,
        clockMinute: cleanMinute,
        clockSolved: true,
        inventory: nextInv,
        collectedKeepsakeIds: nextKs,
        flags: { ...state.flags, clock_solved: true },
        ghosts: state.ghosts.map((g) =>
          g.scene === 'infirmary_wing' ? { ...g, pacified: true } : g
        ),
        sanity: Math.min(100, state.sanity + 16),
        activeModal: 'journal',
        subtitleText:
          'Kim đồng hồ chạm 02:15! Tủ thuốc bật mở — bạn nhận được Bình Dầu Đèn Bão & Phiếu Khám Bệnh của Tô Dao.',
        subtitleTimer: 5.5,
      },
      solved: true,
    };
  }

  return {
    next: {
      ...state,
      clockHour: cleanHour,
      clockMinute: cleanMinute,
    },
    solved: false,
  };
}

export function swapBookshelfSlots(
  state: ThanhMinhState,
  idxA: number,
  idxB: number
): ThanhMinhState {
  const nextOrder = [...state.bookshelfOrder] as [number, number, number];
  const tmp = nextOrder[idxA];
  nextOrder[idxA] = nextOrder[idxB];
  nextOrder[idxB] = tmp;

  const solved = nextOrder[0] === 0 && nextOrder[1] === 1 && nextOrder[2] === 2;
  if (!solved) {
    return {
      ...state,
      bookshelfOrder: nextOrder,
      subtitleText: 'Xếp lại 3 cuốn sách cấm theo đúng thứ tự đêm đọc sách (Kiều → Tagore → Nhật Ký Cô Sơn).',
      subtitleTimer: 3.8,
    };
  }

  const nextInv = state.inventory.includes('red_ribbon')
    ? state.inventory
    : [...state.inventory, 'red_ribbon' as OfferingItemId];
  const nextKs = state.collectedKeepsakeIds.includes('ks-10-reading-club-seal')
    ? state.collectedKeepsakeIds
    : [...state.collectedKeepsakeIds, 'ks-10-reading-club-seal'];

  return {
    ...state,
    bookshelfOrder: nextOrder,
    bookshelfSolved: true,
    inventory: nextInv,
    collectedKeepsakeIds: nextKs,
    flags: { ...state.flags, library_books_solved: true },
    ghosts: state.ghosts.map((g) =>
      g.scene === 'library_archive' ? { ...g, pacified: true } : g
    ),
    subtitleText:
      'Giá sách dịch chuyển hé lộ Ấn Triện Nhóm Đọc Sách & Dải Ruy-Băng Đỏ! Cửa Phòng Rửa Ảnh đã mở niêm phong.',
    subtitleTimer: 5.2,
  };
}

export function pressPianoKey(
  state: ThanhMinhState,
  note: PianoNoteId
): { next: ThanhMinhState; solved: boolean; reset: boolean } {
  if (state.pianoSolved) {
    return { next: state, solved: true, reset: false };
  }
  const target: readonly PianoNoteId[] = ['Do', 'Mi', 'Sol', 'Re'];
  const nextSeq = [...state.pianoSequence, note];
  const idx = nextSeq.length - 1;

  if (nextSeq[idx] !== target[idx]) {
    return {
      next: {
        ...state,
        pianoSequence: [],
        subtitleText: 'Dây đàn đứt lạc nhịp! Thứ tự đúng của “Tiếng Sáo Cô Sơn”: Đồ → Mi → Sol → Rê.',
        subtitleTimer: 3.6,
      },
      solved: false,
      reset: true,
    };
  }

  if (nextSeq.length === target.length) {
    const nextLore = state.collectedLoreIds.includes('lore-18-piano-duet')
      ? state.collectedLoreIds
      : [...state.collectedLoreIds, 'lore-18-piano-duet'];
    return {
      next: {
        ...state,
        pianoSequence: nextSeq,
        pianoSolved: true,
        collectedLoreIds: nextLore,
        flags: { ...state.flags, piano_solved: true },
        activeModal: 'none',
        activeHotspotId: null,
        subtitleText:
          'Khúc nhạc “Tiếng Sáo Cô Sơn” ngân lên giữa đêm mưa! Cửa xuống Khu Biệt Giam đã mở khóa.',
        subtitleTimer: 5.0,
      },
      solved: true,
      reset: false,
    };
  }

  return {
    next: {
      ...state,
      pianoSequence: nextSeq,
    },
    solved: false,
    reset: false,
  };
}

export function setCipherDigit(
  state: ThanhMinhState,
  slot: 0 | 1 | 2,
  digit: number
): { next: ThanhMinhState; solved: boolean } {
  const cleanDigit = ((Math.round(digit) % 10) + 10) % 10;
  const nextDigits = [...state.cipherDigits] as [number, number, number];
  nextDigits[slot] = cleanDigit;
  const solved = nextDigits[0] === 4 && nextDigits[1] === 0 && nextDigits[2] === 5;

  if (solved) {
    const nextKs = state.collectedKeepsakeIds.includes('ks-7-tranmac-pass')
      ? state.collectedKeepsakeIds
      : [...state.collectedKeepsakeIds, 'ks-7-tranmac-pass'];
    return {
      next: {
        ...state,
        cipherDigits: nextDigits,
        cipherSolved: true,
        collectedKeepsakeIds: nextKs,
        flags: { ...state.flags, teachers_cipher_solved: true },
        activeModal: 'journal',
        subtitleText:
          'Mở khóa 4-0-5 thành công! Bên trong là tấm giấy thông hành có tên Lâm Tĩnh do thầy Trần viết sẵn...',
        subtitleTimer: 5.5,
      },
      solved: true,
    };
  }

  return {
    next: {
      ...state,
      cipherDigits: nextDigits,
    },
    solved: false,
  };
}

export function submitWuxingElement(
  state: ThanhMinhState,
  element: 'Kim' | 'Thủy' | 'Hỏa'
): { next: ThanhMinhState; solved: boolean; reset: boolean } {
  if (!state.inventory.includes('incense_bundle')) {
    return {
      next: {
        ...state,
        subtitleText: 'Bạn chưa có Bó Nhang & Vàng Mã (tìm trong tủ gỗ Lớp 12B)!',
        subtitleTimer: 3.5,
      },
      solved: false,
      reset: false,
    };
  }

  const target = ['Kim', 'Thủy', 'Hỏa'];
  const nextSeq = [...state.wuxingSequence, element];
  const idx = nextSeq.length - 1;

  if (nextSeq[idx] !== target[idx]) {
    return {
      next: {
        ...state,
        wuxingSequence: [],
        sanity: Math.max(10, state.sanity - 10),
        subtitleText: 'Sai thứ tự Ngũ Hành! Khói nhang tắt phụt (Thứ tự đúng: Kim → Thủy → Hỏa).',
        subtitleTimer: 3.6,
      },
      solved: false,
      reset: true,
    };
  }

  if (nextSeq.length === 3) {
    return {
      next: {
        ...state,
        wuxingSequence: nextSeq,
        flags: { ...state.flags, wuxing_solved: true },
        ghosts: state.ghosts.map((g) => (g.scene === 'corridor_act1' ? { ...g, pacified: true } : g)),
        activeModal: 'none',
        activeHotspotId: null,
        subtitleText: 'Nghi lễ Ngũ Hành hoàn tất! Vong hồn tan biến — hãy kiểm tra Phòng Y Tế tìm dầu đèn trước khi xuống sân trường.',
        subtitleTimer: 4.8,
      },
      solved: true,
      reset: false,
    };
  }

  return {
    next: {
      ...state,
      wuxingSequence: nextSeq,
    },
    solved: false,
    reset: false,
  };
}

export function setRadioFrequency(state: ThanhMinhState, freq: number): ThanhMinhState {
  const clamped = Math.round(Math.max(88.0, Math.min(112.0, freq)) * 10) / 10;

  if (state.act <= 2 && Math.abs(clamped - 104.7) <= 0.35) {
    return {
      ...state,
      radioFrequency: 104.7,
      radioTunedAct2: true,
      realm: 'yin',
      flags: { ...state.flags, radio_act2_tuned: true },
      subtitleText:
        'Khớp sóng 104.7 MHz! Không gian rạn nứt sang Âm Giới — nhấn [Q] bất cứ lúc nào để chuyển đổi Âm / Dương!',
      subtitleTimer: 5.5,
    };
  }

  if (state.act >= 3 && Math.abs(clamped - 109.2) <= 0.35) {
    return {
      ...state,
      radioFrequency: 109.2,
      radioSecretAct3Solved: true,
      flags: { ...state.flags, radio_secret_act3: true },
      subtitleText:
        'Giải mã thành công Tần Số Bí Mật 109.2 MHz! Tiếng đọc thơ của Thầy Trần Mặc và Tô Dao vang vọng trong ký ức...',
      subtitleTimer: 5.5,
    };
  }

  return {
    ...state,
    radioFrequency: clamped,
  };
}

export function swapPuppetSlots(state: ThanhMinhState, idxA: number, idxB: number): ThanhMinhState {
  const nextOrder = [...state.puppetOrder] as [number, number, number, number];
  const tmp = nextOrder[idxA];
  nextOrder[idxA] = nextOrder[idxB];
  nextOrder[idxB] = tmp;

  const solved =
    nextOrder[0] === 0 && nextOrder[1] === 1 && nextOrder[2] === 2 && nextOrder[3] === 3;

  return {
    ...state,
    puppetOrder: nextOrder,
    puppetsSolved: solved || state.puppetsSolved,
    flags: solved ? { ...state.flags, puppets_solved: true } : state.flags,
    ghosts: solved
      ? state.ghosts.map((g) => (g.scene === 'auditorium' ? { ...g, pacified: true } : g))
      : state.ghosts,
    subtitleText: solved
      ? 'Toàn bộ bi kịch đêm đấu tố đã hiện rõ sau màn rối Bì Ảnh Hí. Ác Linh Tự Vệ tan biến, cửa Phòng Nhạc Cũ đã mở.'
      : 'Sắp xếp 4 màn rối da lừa theo đúng trình tự đêm phản bội.',
    subtitleTimer: 4.5,
  };
}

export function evaluateFinalEnding(state: ThanhMinhState, finalConfess: boolean): EndingId {
  const allHonest =
    finalConfess && state.confessionAnswers.every((ans) => ans === true);

  if (!allHonest) {
    return 'ending_1_loop';
  }

  const ratio = state.collectedKeepsakeIds.length / TRUTH_KEEPSAKES.length; // 0..1

  if (
    state.collectedKeepsakeIds.length === TRUTH_KEEPSAKES.length &&
    state.radioSecretAct3Solved &&
    state.sanityBottomCount === 0
  ) {
    return 'ending_4_dawn_coson';
  }

  if (ratio < 0.5 || state.sanityBottomCount >= 2) {
    return 'ending_2_ashes';
  }

  return 'ending_3_late_qingming';
}

export function answerInterrogationStep(
  state: ThanhMinhState,
  admitGuilt: boolean
): ThanhMinhState {
  const nextAnswers = [...state.confessionAnswers, admitGuilt];
  if (state.interrogationStep < 3) {
    return {
      ...state,
      interrogationStep: (state.interrogationStep + 1) as 0 | 1 | 2 | 3,
      confessionAnswers: nextAnswers,
    };
  }

  const chosenEnding = evaluateFinalEnding(
    { ...state, confessionAnswers: nextAnswers },
    admitGuilt
  );

  let subtitle = '';
  if (chosenEnding === 'ending_1_loop') {
    subtitle =
      'Bóng ma đối diện mỉm cười lạnh lẽo. Mọi cánh cửa biến mất — tiếng còi báo động hú vang, vòng lặp địa ngục khởi động lại...';
  } else if (chosenEnding === 'ending_2_ashes') {
    subtitle =
      'Lâm Tĩnh châm lửa thiêu rụi linh hồn cùng ngôi trường. Những tiếng khóc oán hận vẫn vang vọng trong đống tro tàn...';
  } else if (chosenEnding === 'ending_3_late_qingming') {
    subtitle =
      'Sương mù tan biến lúc bình minh. Trước hai ngôi mộ đất vô danh trong rừng thông, bạn đốt xấp vàng mã rồi lặng lẽ tan vào nắng sớm...';
  } else {
    subtitle =
      'Linh hồn Thầy Trần Mặc và Tô Dao hiền hòa khoác lên vai bạn chiếc áo đồng phục cũ. Năm 1986, cuốn sổ sự thật đã được tìm thấy để minh oan cho thầy và bạn.';
  }

  return {
    ...state,
    confessionAnswers: nextAnswers,
    activeModal: 'none',
    activeHotspotId: null,
    ending: chosenEnding,
    endingTimer: 0,
    subtitleText: subtitle,
    subtitleTimer: 8.0,
  };
}

export function tickThanhMinhSimulation(
  prev: ThanhMinhState,
  input: ThanhMinhInput
): { next: ThanhMinhState; events: ThanhMinhEvents } {
  const dt = Math.min(0.06, Math.max(0.001, input.dt));
  const events: ThanhMinhEvents = {
    footstep: false,
    gasped: false,
    sanityCollapsed: false,
    ghostAlerted: false,
    killedByGhostKind: null,
    horrorEvent: null,
  };

  if (prev.ending !== 'none') {
    return {
      next: { ...prev, endingTimer: prev.endingTimer + dt },
      events,
    };
  }

  if (prev.deathCutscene?.active) {
    const nextTimer = prev.deathCutscene.timer + dt;
    if (nextTimer >= prev.deathCutscene.duration) {
      return {
        next: {
          ...prev,
          deathCutscene: null,
          playerX: prev.deathCutscene.respawnX,
          sanity: 52,
          breathStamina: 85,
          runStamina: 90,
          isRunning: false,
          isMoving: false,
          exhausted: false,
          gazeExposure: 0,
          gaspPenaltyTimer: 0,
          holdingBreath: false,
          subtitleText: 'Bạn giật mình choàng tỉnh trong mồ hôi lạnh — không thể chết khi tội lỗi vẫn chưa được gọi tên.',
          subtitleTimer: 4.5,
        },
        events,
      };
    }
    return {
      next: {
        ...prev,
        deathCutscene: { ...prev.deathCutscene, timer: nextTimer },
      },
      events,
    };
  }

  if (prev.activeModal !== 'none') {
    const canIntrudeModal =
      prev.scene !== 'final_interrogation' &&
      (prev.activeModal === 'journal' ||
        prev.activeModal === 'memory_echo' ||
        prev.activeModal === 'radio_tuner');
    let modalReadTimer = canIntrudeModal ? (prev.modalReadTimer ?? 0) + dt : 0;
    let uiIntrusionTimer = Math.max(0, (prev.uiIntrusionTimer ?? 0) - dt);
    let modalSanity = prev.sanity;
    let modalSputter = Math.max(0, (prev.lanternSputterTimer ?? 0) - dt);
    let postFakeoutAmbushTimer = prev.postFakeoutAmbushTimer ?? 0;

    if (canIntrudeModal && modalReadTimer >= 4.8 && uiIntrusionTimer <= 0) {
      modalReadTimer = -7.5;
      uiIntrusionTimer = 2.4;
      modalSanity = Math.max(8, modalSanity - 4);
      modalSputter = Math.max(modalSputter, 1.8);
      postFakeoutAmbushTimer = Math.max(postFakeoutAmbushTimer, 1.5);
      events.horrorEvent = 'ui_intrusion';
      events.horrorPan = -prev.playerFacing * 0.85;
    }

    return {
      next: {
        ...prev,
        isRunning: false,
        isMoving: false,
        modalReadTimer,
        uiIntrusionTimer,
        sanity: modalSanity,
        lanternSputterTimer: modalSputter,
        postFakeoutAmbushTimer,
      },
      events,
    };
  }

  const meta = SCENE_META[prev.scene];
  let {
    playerX,
    playerFacing,
    walkPhase,
    holdingBreath,
    breathStamina,
    gaspPenaltyTimer,
    runStamina,
    isRunning,
    isMoving,
    exhausted,
    sanity,
    sanityBottomCount,
    gazeExposure,
    horrorPulseTimer,
    activePhantomX,
    activePhantomTimer,
    activePhantomKind,
    subtitleText,
    subtitleTimer,
  } = prev;
  let audioVacuumTimer = prev.audioVacuumTimer ?? 0;
  let pendingDreadBeat = prev.pendingDreadBeat ?? null;
  let panicTimer = Math.max(0, (prev.panicTimer ?? 0) - dt);
  let doorJamTimer = Math.max(0, (prev.doorJamTimer ?? 0) - dt);
  let lanternSputterTimer = Math.max(0, (prev.lanternSputterTimer ?? 0) - dt);
  let fakeoutKind = prev.fakeoutKind ?? null;
  let fakeoutX = prev.fakeoutX ?? null;
  let fakeoutTimer = prev.fakeoutTimer ?? 0;
  let postFakeoutAmbushTimer = prev.postFakeoutAmbushTimer ?? 0;
  let dreadCycleCount = prev.dreadCycleCount ?? 0;
  const uiIntrusionTimer = Math.max(0, (prev.uiIntrusionTimer ?? 0) - dt);

  subtitleTimer = Math.max(0, subtitleTimer - dt);
  if (subtitleTimer <= 0) subtitleText = '';
  gaspPenaltyTimer = Math.max(0, gaspPenaltyTimer - dt);

  // Pillar 1 & 4: Audio Vacuum countdown -> Sub-Bass Dread Ambush with real gameplay stakes
  let ambushAlertTrigger = false;
  if (audioVacuumTimer > 0) {
    audioVacuumTimer = Math.max(0, audioVacuumTimer - dt);
    if (audioVacuumTimer <= 0 && pendingDreadBeat) {
      const behindSign: 1 | -1 = playerFacing === 1 ? -1 : 1;
      const pan = behindSign * 0.88;
      if (activePhantomX === null) {
        const spawnX = Math.max(meta.minX + 32, Math.min(meta.maxX - 32, playerX + behindSign * 148));
        if (Math.abs(spawnX - playerX) > 90) {
          activePhantomX = spawnX;
          activePhantomTimer = 3.0;
          activePhantomKind = 'shadow_child';
        }
      }
      events.horrorEvent = pendingDreadBeat === 'door_slam_behind' ? 'footstep_behind' : 'sub_bass_ambush';
      events.horrorPan = pan;
      sanity = Math.max(6, sanity - 11);
      panicTimer = 3.8;
      lanternSputterTimer = 1.9;
      doorJamTimer = 2.8;
      ambushAlertTrigger = true;
      pendingDreadBeat = null;
      if (!subtitleText) {
        subtitleText =
          'Khoảng lặng chết chóc vỡ tan — tiếng bước chân nặng trịch sát sau gáy khiến ngọn đèn dầu chập chờn!';
        subtitleTimer = 3.4;
      }
    }
  }

  // Pillar 3: Mundane fake-out visual runner + post-relaxation ambush trigger
  if (fakeoutTimer > 0) {
    fakeoutTimer = Math.max(0, fakeoutTimer - dt);
    if (fakeoutX !== null && fakeoutKind === 'black_cat') {
      fakeoutX += playerFacing * 190 * dt;
    }
    if (fakeoutTimer <= 0) {
      fakeoutKind = null;
      fakeoutX = null;
    }
  }

  if (postFakeoutAmbushTimer > 0) {
    postFakeoutAmbushTimer = Math.max(0, postFakeoutAmbushTimer - dt);
    if (postFakeoutAmbushTimer <= 0 && audioVacuumTimer <= 0 && prev.scene !== 'final_interrogation') {
      audioVacuumTimer = 1.35;
      pendingDreadBeat = 'sub_bass_ambush';
      events.horrorEvent = 'vacuum_start';
    }
  }

  if (activePhantomTimer > 0 && activePhantomX !== null) {
    activePhantomTimer = Math.max(0, activePhantomTimer - dt);
    const effectiveFacing: 1 | -1 =
      input.moveDir !== 0 ? (input.moveDir > 0 ? 1 : -1) : playerFacing;
    const lookingAtPhantom =
      (activePhantomX > playerX && effectiveFacing === 1) ||
      (activePhantomX < playerX && effectiveFacing === -1);
    const distPhantom = Math.abs(activePhantomX - playerX);
    if ((lookingAtPhantom && distPhantom < 230) || distPhantom < 85 || activePhantomTimer <= 0) {
      if (lookingAtPhantom && distPhantom < 230 && activePhantomTimer > 0.2) {
        events.horrorEvent = 'sting';
        events.horrorPan = activePhantomX > playerX ? 0.72 : -0.72;
        sanity = Math.max(5, sanity - 7);
        panicTimer = Math.max(panicTimer, 2.8);
        lanternSputterTimer = Math.max(lanternSputterTimer, 1.35);
        if (activePhantomKind === 'shadow_child') {
          doorJamTimer = Math.max(doorJamTimer, 2.2);
        }
      }
      activePhantomX = null;
      activePhantomTimer = 0;
      activePhantomKind = null;
    }
  }

  horrorPulseTimer -= dt;
  if (horrorPulseTimer <= 0 && prev.scene !== 'final_interrogation') {
    const isUnsafeScene = prev.scene !== 'classroom_12b' || subtitleTimer <= 0;
    dreadCycleCount += 1;
    const cyclePhase = dreadCycleCount % 3;

    if (isUnsafeScene && activePhantomX === null) {
      if (cyclePhase === 1) {
        const behindOffset = -playerFacing * (195 + ((Math.round(prev.walkPhase * 17) % 5) * 14));
        const candidateX = Math.max(meta.minX + 30, Math.min(meta.maxX - 30, playerX + behindOffset));
        if (Math.abs(candidateX - playerX) > 130) {
          activePhantomX = candidateX;
          activePhantomTimer = 3.2;
          activePhantomKind = prev.act >= 2 ? 'shadow_child' : 'peeker';
          events.horrorEvent = prev.realm === 'yin' ? 'whisper' : 'knock';
          events.horrorPan = -playerFacing * 0.88;
          if (!subtitleText) {
            subtitleText =
              prev.realm === 'yin'
                ? 'Có tiếng thì thầm lạnh buốt ngay phía sau ánh đèn dầu...'
                : 'Cộc... cộc... Tiếng gõ khe khẽ vang lên từ góc tối phía sau.';
            subtitleTimer = 3.0;
          }
        }
      } else if (cyclePhase === 2) {
        const isCat = dreadCycleCount % 2 === 0;
        fakeoutKind = isCat ? 'black_cat' : 'falling_book';
        fakeoutX = Math.max(
          meta.minX + 40,
          Math.min(meta.maxX - 40, playerX + playerFacing * (isCat ? 115 : 145))
        );
        fakeoutTimer = 1.9;
        postFakeoutAmbushTimer = 3.2;
        events.horrorEvent = isCat ? 'fakeout_cat' : 'fakeout_book';
        events.horrorPan = playerFacing * 0.65;
        if (!subtitleText) {
          subtitleText = isCat
            ? 'Một con mèo đen vụt qua chân tường... Chỉ là tiếng động thường thôi sao?'
            : 'Bịch! Cuốn sổ cũ rơi xuống sàn phía trước — chỉ là gió lùa thôi sao?';
          subtitleTimer = 2.6;
        }
      } else if (audioVacuumTimer <= 0) {
        audioVacuumTimer = 1.45;
        pendingDreadBeat = 'sub_bass_ambush';
        events.horrorEvent = 'vacuum_start';
      }
    }
    horrorPulseTimer = prev.realm === 'yin' || sanity < 65 ? 9.5 : 13.5;
  }

  if (input.holdingBreath && gaspPenaltyTimer <= 0) {
    holdingBreath = true;
    breathStamina = Math.max(0, breathStamina - 22 * dt);
    if (breathStamina <= 0) {
      holdingBreath = false;
      gaspPenaltyTimer = 2.4;
      events.gasped = true;
      subtitleText = 'Nín thở quá lâu! Bạn hổn hển hít hơi — Vong hồn đã phát hiện ra tiếng động!';
      subtitleTimer = 3.2;
    }
  } else {
    holdingBreath = false;
    breathStamina = Math.min(100, breathStamina + 28 * dt);
  }

  // Run Stamina & Exhaustion system balanced for expanded wide maps
  isMoving = input.moveDir !== 0;
  const wantsRun =
    Boolean(input.sprinting) && isMoving && !holdingBreath && !exhausted && runStamina > 0;
  if (wantsRun) {
    isRunning = true;
    runStamina = Math.max(0, runStamina - 22 * dt);
    if (runStamina <= 0) {
      isRunning = false;
      exhausted = true;
      events.exhaustedNow = true;
      subtitleText =
        'Hết sức bền! Lâm Tĩnh thở dốc kiệt sức, không thể chạy tiếp — buộc phải đi bộ chậm.';
      subtitleTimer = 3.4;
    }
  } else {
    isRunning = false;
    const regenRate = !isMoving ? 19 : exhausted ? 10 : holdingBreath ? 7 : 12.5;
    runStamina = Math.min(100, runStamina + regenRate * dt);
    if (exhausted && runStamina >= 35) {
      exhausted = false;
    }
  }

  if (isMoving) {
    playerFacing = input.moveDir > 0 ? 1 : -1;
    const panicControlPenalty = panicTimer > 0 ? 0.85 : sanity < 38 ? 0.9 : 1;
    const speed =
      (holdingBreath
        ? MOVEMENT_SPEEDS.holdBreath
        : exhausted
          ? MOVEMENT_SPEEDS.exhausted
          : isRunning
            ? MOVEMENT_SPEEDS.run
            : MOVEMENT_SPEEDS.walk) * panicControlPenalty;
    playerX = Math.max(meta.minX, Math.min(meta.maxX, playerX + input.moveDir * speed * dt));
    const prevCycle = Math.floor(walkPhase);
    const phaseRate =
      (holdingBreath ? 2.5 : exhausted ? 2.2 : isRunning ? 6.6 : 4.0) *
      SPEED_SCALE_FACTOR *
      panicControlPenalty;
    walkPhase += phaseRate * dt;
    if (Math.floor(walkPhase) > prevCycle) events.footstep = true;
  }

  let staringAtGhost = false;
  let caughtByGhost = false;
  let caughtKind: 'paper_hat' | 'tongue_warden' | null = null;
  let caughtVariant: GhostVariant | undefined;
  let caughtName: string | null = null;
  let nearestKind: 'paper_hat' | 'tongue_warden' | null = null;
  let nearestVariant: GhostVariant | undefined;
  let nearestName: string | null = null;
  let nearestDist = Infinity;

  const ghosts = prev.ghosts.map((g) => {
    if (g.scene !== prev.scene || g.pacified) return g;
    const baseSpeed = g.kind === 'tongue_warden' ? 46 : 38;
    const distBefore = Math.abs(g.x - playerX);
    const playerAudible = !holdingBreath || gaspPenaltyTimer > 0;
    const alertRadius = isRunning ? 175 : 130;
    const isAlerted =
      (playerAudible && distBefore < alertRadius) ||
      (ambushAlertTrigger && distBefore < 340);

    let nx = g.x;
    let nvx = g.vx;
    let nFacing = g.facing;

    if (isAlerted) {
      const toPlayer = playerX - g.x;
      if (Math.abs(toPlayer) > 6) {
        nFacing = toPlayer > 0 ? 1 : -1;
        const stalkSpeed = g.kind === 'tongue_warden' ? 35 : 28;
        nx = g.x + nFacing * stalkSpeed * dt;
        nvx = nFacing * baseSpeed;
      } else {
        nx = g.x;
      }
      nx = Math.max(g.minX, Math.min(g.maxX, nx));
    } else {
      nvx = (g.vx >= 0 ? 1 : -1) * baseSpeed;
      nx = g.x + nvx * dt;
      nFacing = nvx >= 0 ? 1 : -1;
      if (nx <= g.minX) {
        nx = g.minX;
        nvx = baseSpeed;
        nFacing = 1;
      } else if (nx >= g.maxX) {
        nx = g.maxX;
        nvx = -baseSpeed;
        nFacing = -1;
      }
    }

    const updated = { ...g, x: nx, vx: nvx, facing: nFacing, alerted: isAlerted };
    const dist = Math.abs(nx - playerX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestKind = g.kind;
      nearestVariant = g.variant;
      nearestName = g.name;
    }
    const looking = (nx > playerX && playerFacing === 1) || (nx < playerX && playerFacing === -1);
    if (dist < 155 && looking) staringAtGhost = true;
    if (dist < 48 && playerAudible) {
      caughtByGhost = true;
      caughtKind = g.kind;
      caughtVariant = g.variant;
      caughtName = g.name;
      events.ghostAlerted = true;
    }
    return updated;
  });

  if (staringAtGhost) {
    gazeExposure = Math.min(100, gazeExposure + 36 * dt);
    if (gazeExposure > 45) sanity = Math.max(0, sanity - 22 * dt);
  } else {
    gazeExposure = Math.max(0, gazeExposure - 28 * dt);
    sanity = Math.min(100, sanity + 3.5 * dt);
  }

  if (caughtByGhost) {
    sanity = Math.max(0, sanity - 68 * dt);
  }

  let deathCutscene: DeathCutsceneState | null = null;
  if (sanity <= 0) {
    sanityBottomCount += 1;
    const killerKind: 'paper_hat' | 'tongue_warden' =
      caughtKind ?? nearestKind ?? (prev.act >= 2 ? 'tongue_warden' : 'paper_hat');
    const killerVariant: GhostVariant =
      caughtVariant ?? nearestVariant ?? (prev.scene === 'auditorium' ? 'auditor_specter' : killerKind);
    const killerName: string =
      caughtName ??
      nearestName ??
      (killerVariant === 'auditor_specter'
        ? 'Ác Linh Tự Vệ — Trương Vệ Quốc'
        : killerKind === 'tongue_warden'
          ? 'Quỷ Sai Cắt Lưỡi'
          : 'Vong Hồn Mũ Giấy');

    events.sanityCollapsed = true;
    events.killedByGhostKind = killerKind;

    const respawnX = Math.max(meta.minX + 30, Math.min(meta.maxX - 30, meta.minX + 60));
    const storyWhisper =
      killerVariant === 'auditor_specter'
        ? '“Chính mày giao nộp danh sách ấy, sao giờ lại giả vờ quên tiếng loa trên bục?”'
        : killerVariant === 'librarian_wraith'
          ? '“Những trang thơ bị xé cháy vẫn ghi rõ nét mực tên ngươi — sao còn dám mở sách ra?”'
          : killerKind === 'tongue_warden'
            ? '“Mượn lời dối trá để sống sót... thì chiếc lưỡi kia còn giữ lại để làm gì?”'
            : '“Tờ danh sách năm ấy nhuốm máu thầy và bạn — ngươi nghĩ nhắm mắt lại là trốn được sao?”';

    deathCutscene = {
      active: true,
      killerKind,
      killerVariant,
      killerName,
      timer: 0,
      duration: 3.4,
      storyWhisper,
      respawnX,
    };
    sanity = 0;
    gazeExposure = 100;
    holdingBreath = false;
    subtitleText = storyWhisper;
    subtitleTimer = 3.4;
  }

  return {
    next: {
      ...prev,
      playerX,
      playerFacing,
      walkPhase,
      holdingBreath,
      breathStamina,
      gaspPenaltyTimer,
      runStamina,
      isRunning,
      isMoving,
      exhausted,
      sanity,
      sanityBottomCount,
      gazeExposure,
      horrorPulseTimer,
      activePhantomX,
      activePhantomTimer,
      activePhantomKind,
      audioVacuumTimer,
      pendingDreadBeat,
      panicTimer,
      doorJamTimer,
      lanternSputterTimer,
      fakeoutKind,
      fakeoutX,
      fakeoutTimer,
      postFakeoutAmbushTimer,
      dreadCycleCount,
      modalReadTimer: 0,
      uiIntrusionTimer,
      ghosts,
      deathCutscene,
      subtitleText,
      subtitleTimer,
    },
    events,
  };
}

export function getCurrentObjectiveHint(state: ThanhMinhState): string {
  if (state.act === 1) {
    if (!state.inventory.includes('incense_bundle')) {
      return 'Tìm Bó Nhang & Vàng Mã trong tủ gỗ Lớp 12B trước khi bước ra hành lang.';
    }
    if (!state.flags.teachers_cipher_solved && state.scene === 'teachers_office') {
      return 'Đọc sổ công tác trong Văn Phòng Thầy Trần Mặc và mở hộp khóa 3 chữ số (4-0-5).';
    }
    if (!state.flags.clock_solved && state.scene === 'infirmary_wing') {
      return 'Đọc Sổ Trực Y Tá (02:15) và chỉnh kim Đồng Hồ Quả Lắc để mở tủ thuốc lấy Dầu Đèn Bão.';
    }
    if (!state.flags.wuxing_solved || !state.inventory.includes('lantern_oil')) {
      return 'Nín thở [Space] qua Vong Hồn Mũ Giấy, thắp Bàn Thờ Ngũ Hành (Kim→Thủy→Hỏa) và vào Phòng Y Tế lấy Dầu Đèn Bão (02:15).';
    }
    if (!state.flags.act1_climax_seen) {
      return 'Xuống Sân Trường ngập lũ, kiểm tra cột cờ giữa sân và nhặt pin đài dưới trạm loa.';
    }
    return 'Tiến về lối phải sân trường để sang Khu Ký Túc Xá Nữ (Hồi 2).';
  }
  if (state.act === 2) {
    if (!state.radioTunedAct2) {
      return 'Đi qua cửa phi logic sang Phòng Phát Thanh và dò đúng tần số 104.7 MHz.';
    }
    if (!state.flags.library_books_solved) {
      return 'Chuyển sang Âm Giới [Q], vào Thư Viện Cấm tìm Sổ Thơ Cháy Dở và xếp 3 cuốn Sách Cấm đúng thứ tự.';
    }
    if (!state.flags.act2_climax_seen) {
      return 'Né Quỷ Sai Cắt Lưỡi bằng cách nín thở, vào Phòng Rửa Ảnh kiểm tra khay thuốc đỏ.';
    }
    return 'Mở cánh cửa cuối Phòng Rửa Ảnh để bước vào Hội Trường Lớn (Hồi 3).';
  }
  if (state.act === 3) {
    if (!state.puppetsSolved) {
      return 'Sắp xếp 4 màn rối Bì Ảnh Hí đúng trình tự (và giải mã máy thu sóng 109.2 MHz cho True Ending).';
    }
    if (!state.flags.piano_solved) {
      return 'Sang Phòng Nhạc Cũ, đàn đúng khúc nhạc “Tiếng Sáo Cô Sơn” (Đồ → Mi → Sol → Rê) để mở lối xuống Khu Biệt Giam.';
    }
    if (!state.flags.act3_climax_seen) {
      return 'Vào Khu Biệt Giam tìm mẩu giấy của Tô Dao giấu trong khe gạch và nhặt Vồ Gỗ tháp chuông.';
    }
    if (!state.flags.bell_ritual_done) {
      return 'Lên Sân Thượng Cô Sơn, dùng Vồ Gỗ thỉnh đủ 3 hồi Chuông Đồng Thanh Minh.';
    }
    return 'Bước qua màn sương cuối Tháp Chuông để sang Cô Sơn 20 năm sau (Hồi 4).';
  }
  if (!state.flags.saw_20_years_ruin) {
    return 'Khám phá đống đổ nát năm 1986 và soi vào tấm gương nứt vỡ.';
  }
  return 'Bước vào Phòng Thẩm Vấn Cuối Cùng và ngồi xuống ghế đối diện chính mình.';
}
