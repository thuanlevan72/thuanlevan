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
  | 'flooded_courtyard'
  | 'dorm_hall'
  | 'broadcast_room'
  | 'darkroom'
  | 'auditorium'
  | 'prison_cells'
  | 'ruined_hall_1986'
  | 'final_interrogation';

export type OfferingItemId =
  | 'incense_bundle'
  | 'spirit_money'
  | 'radio_battery'
  | 'darkroom_key'
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
  secretBody?: string; // Unlocks when holding darkroom_key or offered_qingming_tribute
}

export type GhostVariant = 'paper_hat' | 'tongue_warden' | 'auditor_specter';

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
    | 'memorial_1986'
    | 'wuxing_altar'
    | 'flagpole_corpse'
    | 'radio'
    | 'illogical_door'
    | 'darkroom_tray'
    | 'puppet_stage'
    | 'prison_crack'
    | 'mirror_1980'
    | 'interrogation_chair';
  targetScene?: SceneId;
  targetX?: number;
  requiredFlag?: string;
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
  | 'radio_tuner'
  | 'darkroom_reveal'
  | 'puppet_theatre'
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

export interface ThanhMinhState {
  act: ActNumber;
  scene: SceneId;
  realm: RealmMode;
  playerX: number;
  playerFacing: 1 | -1;
  walkPhase: number;

  // Stealth & Sanity
  holdingBreath: boolean;
  breathStamina: number; // 0..100
  gaspPenaltyTimer: number;
  sanity: number; // 0..100
  sanityBottomCount: number; // hidden variable tracking how many times Sanity bottomed out
  gazeExposure: number; // 0..100 red bleed warning when staring at ghost face

  // Inventory & Hidden Story Variables
  inventory: OfferingItemId[];
  collectedKeepsakeIds: string[]; // 6 total -> 100%
  collectedLoreIds: string[]; // 10 environmental memory echoes
  activeLoreId: string | null;
  flags: Record<string, boolean>;

  // Interactive Puzzles
  wuxingSequence: string[]; // Ngũ hành altar order: Kim -> Thủy -> Hỏa
  radioFrequency: number; // Act 2: 104.7 MHz | Act 3 secret: 109.2 MHz
  radioTunedAct2: boolean;
  radioSecretAct3Solved: boolean;
  puppetOrder: [number, number, number, number]; // 4 acts of tragedy -> target [0, 1, 2, 3]
  puppetsSolved: boolean;

  // Hồi 4 Interrogation branching answers
  interrogationStep: 0 | 1 | 2;
  confessionAnswers: boolean[]; // true = honest/admits guilt, false = denies/blames others

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
}

export interface ThanhMinhEvents {
  footstep: boolean;
  gasped: boolean;
  sanityCollapsed: boolean;
  ghostAlerted: boolean;
  killedByGhostKind: 'paper_hat' | 'tongue_warden' | null;
}

export const SCENE_META: Record<
  SceneId,
  { minX: number; maxX: number; act: ActNumber; title: string; subtitle: string }
> = {
  classroom_12b: {
    minX: 65,
    maxX: 940,
    act: 1,
    title: 'Lớp Học 12B — Đêm Mưa Bão',
    subtitle: 'Hồi 1 · Bóng Tối & Bùa Trắng',
  },
  corridor_act1: {
    minX: 60,
    maxX: 1160,
    act: 1,
    title: 'Hành Lang Tầng 2 — Vong Hồn Mũ Giấy',
    subtitle: 'Hồi 1 · Bóng Tối & Bùa Trắng',
  },
  flooded_courtyard: {
    minX: 60,
    maxX: 980,
    act: 1,
    title: 'Sân Trường Ngập Lũ — Cột Cờ Đẫm Mưa',
    subtitle: 'Cao Trào Hồi 1 · Kẻ Phản Bội Vẫn Còn Trong Trường',
  },
  dorm_hall: {
    minX: 60,
    maxX: 1120,
    act: 2,
    title: 'Ký Túc Xá Nữ — Kiến Trúc Phi Logic',
    subtitle: 'Hồi 2 · Chiếc Radio & Ký Ức Đổ Máu',
  },
  broadcast_room: {
    minX: 65,
    maxX: 880,
    act: 2,
    title: 'Phòng Phát Thanh & Kho Sách Cấm',
    subtitle: 'Hồi 2 · Tần Số Âm Dương',
  },
  darkroom: {
    minX: 65,
    maxX: 880,
    act: 2,
    title: 'Phòng Rửa Ảnh Tối — Ánh Đèn Đỏ',
    subtitle: 'Cao Trào Hồi 2 · Quỷ Sai Cắt Lưỡi',
  },
  auditorium: {
    minX: 60,
    maxX: 1100,
    act: 3,
    title: 'Hội Trường Lớn — Sân Khấu Bì Ảnh Hí',
    subtitle: 'Hồi 3 · Đối Diện Tội Ác',
  },
  prison_cells: {
    minX: 60,
    maxX: 940,
    act: 3,
    title: 'Khu Biệt Giam & Rừng Thông Sau Núi',
    subtitle: 'Cao Trào Hồi 3 · Lời Nhắn Của Tô Dao',
  },
  ruined_hall_1986: {
    minX: 60,
    maxX: 960,
    act: 4,
    title: 'Học Viện Cô Sơn Hoang Tàn (20 Năm Sau)',
    subtitle: 'Hồi 4 · Phiên Tòa Của Linh Hồn',
  },
  final_interrogation: {
    minX: 65,
    maxX: 840,
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
  spirit_money: {
    id: 'spirit_money',
    name: 'Xấp Tiền Vàng Mã Cháy Dở',
    description: 'Vàng mã vương lại bên bồn cầu và sân trường ngập nước.',
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
  wine_cup: {
    id: 'wine_cup',
    name: 'Chén Rượu Tế Thanh Minh',
    description: 'Chén rượu trắng dâng trước cửa Phòng Thẩm Vấn cuối cùng.',
  },
};

// 6 Truth Keepsakes (Kỷ vật sự thật) -> determines Ending percentage (0%, 17%, 33%, 50%, 67%, 83%, 100%)
export const TRUTH_KEEPSAKES: readonly KeepsakeDef[] = [
  {
    id: 'ks-1-linjing-badge',
    act: 1,
    title: 'Kỷ vật 1/6 — Thẻ Học Sinh Của Lâm Tĩnh',
    subtitle: 'Góc bàn Lớp 12B · Nhóm Đọc Sách Bị Cấm',
    description: 'Tấm thẻ học sinh rách góc kẹp tờ giấy viết tay bài thơ bị cấm của thầy Trần Mặc.',
    diaryText:
      'Cha mẹ vừa bị bắt dưới thị trấn vì xuất thân trí thức. Chỉ có lớp học văn của thầy Trần Mặc và Tô Dao khiến mình còn thấy ấm áp... Nhưng vì sao ánh mắt thầy luôn dừng lại lâu hơn trên trang vở của Tô Dao?',
  },
  {
    id: 'ks-2-newspaper',
    act: 1,
    title: 'Kỷ vật 2/6 — Tờ Báo Đấu Tố Nhàu Nát',
    subtitle: 'Dưới chân cột cờ sân trường · Trương Vệ Quốc',
    description: 'Mẩu báo tuyên truyền rách tả tơi thấm nước mưa đỏ ngầu.',
    diaryText:
      'Trương Vệ Quốc (18 tuổi), đội trưởng đội tự vệ học sinh, đã chặn mình ở góc cầu thang: "Nhà mày là thành phần xấu. Giao danh sách nhóm đọc sách của lão Trần ra, tao tha cho."',
  },
  {
    id: 'ks-3-burned-poetry',
    act: 2,
    title: 'Kỷ vật 3/6 — Cuốn Sổ Thơ Chép Tay Cháy Dở',
    subtitle: 'Nhà kho sau thư viện (chỉ hiện ở Âm Giới)',
    description: 'Cuốn sổ chép thơ cổ điển bị đốt sém một nửa, trang đầu ghi tên thầy Trần Mặc và Tô Dao.',
    diaryText:
      'Đêm hôm đó, mình đứng ngoài khe cửa nghe lén thầy Trần Mặc thì thầm với Tô Dao rằng thầy đã chuẩn bị giấy tờ cho Tô Dao trốn về quê. Không có tên mình trong tấm vé đó... Cơn ghen tuông và sợ hãi đã làm mắt mình tối sầm lại.',
  },
  {
    id: 'ks-4-negative-film',
    act: 2,
    title: 'Kỷ vật 4/6 — Tấm Phim Âm Bản Đêm Giao Nộp',
    subtitle: 'Khay thuốc hiện hình · Phòng Rửa Ảnh Tối',
    description: 'Tấm phim âm bản ghi lại khoảnh khắc bàn tay run rẩy đưa tờ danh sách cho Trương Vệ Quốc.',
    diaryText:
      'Dưới ánh đèn đỏ, bức ảnh tự hiện ra rõ mồn một: Không ai cầm dao kề cổ ép tay mình viết hết cả danh sách — chính nỗi hèn nhát và ích kỷ của mình đã điền từng cái tên.',
  },
  {
    id: 'ks-5-todao-note',
    act: 3,
    title: 'Kỷ vật 5/6 — Mẩu Giấy Của Tô Dao Trong Phòng Giam',
    subtitle: 'Khe gạch phòng biệt giam · Hồi 3',
    description: 'Mảnh giấy nhỏ thấm máu khô, nét chữ vội vàng nhưng dịu dàng đến thắt lòng.',
    diaryText:
      '"Tĩnh, đừng sợ, tớ đốt tờ giấy có tên cậu rồi. Đội tự vệ không biết cậu cũng tham gia nhóm đâu. Ráng sống tiếp thay phần tớ nhé." — Tô Dao đã chịu tra tấn đến chết mà không hề nhắc nửa lời về mình.',
  },
  {
    id: 'ks-6-tranmac-pen',
    act: 4,
    title: 'Kỷ vật 6/6 — Cây Bút Máy & Chiếc Áo Đồng Phục Cũ',
    subtitle: 'Đống đổ nát Cô Sơn 20 năm sau · Hồi 4',
    description: 'Cây bút máy gãy ngòi của thầy Trần Mặc cùng cuốn sổ ghi sự thật còn nguyên vẹn trên bàn học.',
    diaryText:
      '20 năm trôi qua (1986), em trai Tô Dao vẫn lặn lội lên núi tìm hài cốt chị. Chỉ khi đối diện trọn vẹn tội lỗi, sự thật mới có thể minh oan cho thầy Trần Mặc và Tô Dao.',
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
];

export const SCENE_HOTSPOTS: readonly HotspotDef[] = [
  // HỒI 1
  {
    id: 'hs-12b-ks1',
    scene: 'classroom_12b',
    x: 215,
    label: 'Bàn học của Lâm Tĩnh — Thẻ học sinh & Nhật ký',
    realm: 'both',
    kind: 'keepsake',
    keepsakeId: 'ks-1-linjing-badge',
  },
  {
    id: 'hs-12b-lore1',
    scene: 'classroom_12b',
    x: 405,
    label: 'Bảng đen Lớp 12B — Nét phấn của Tô Dao',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-1-blackboard',
  },
  {
    id: 'hs-12b-incense',
    scene: 'classroom_12b',
    x: 560,
    label: 'Tủ gỗ cuối lớp — Bó Nhang & Vàng Mã',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.incense_bundle,
    dialogueText: 'Bạn lấy bó nhang trầm và vàng mã từ tủ giáo cụ.',
  },
  {
    id: 'hs-12b-door',
    scene: 'classroom_12b',
    x: 890,
    label: 'Cửa ra Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 110,
  },

  {
    id: 'hs-cor1-back',
    scene: 'corridor_act1',
    x: 85,
    label: 'Quay lại Lớp 12B',
    realm: 'both',
    kind: 'door',
    targetScene: 'classroom_12b',
    targetX: 840,
  },
  {
    id: 'hs-cor1-lore2',
    scene: 'corridor_act1',
    x: 320,
    label: 'Trang sổ điểm rơi — Lời phê của Thầy Trần Mặc',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-2-tranmac-margin',
  },
  {
    id: 'hs-cor1-altar',
    scene: 'corridor_act1',
    x: 540,
    label: 'Bàn Thờ Ngũ Hành (Bùa trắng phủ kín)',
    realm: 'both',
    kind: 'wuxing_altar',
    dialogueText: 'Cần đốt vàng mã và thắp nhang theo đúng thứ tự Ngũ Hành: Kim → Thủy → Hỏa.',
  },
  {
    id: 'hs-cor1-gate',
    scene: 'corridor_act1',
    x: 1110,
    label: 'Cổng sắt cầu thang xuống Sân Trường',
    realm: 'both',
    kind: 'door',
    targetScene: 'flooded_courtyard',
    targetX: 110,
    requiredFlag: 'wuxing_solved',
    blockedHint: 'Bùa tang phong tỏa cổng sắt. Hãy hoàn thành nghi lễ Ngũ Hành tại bàn thờ hành lang.',
  },

  {
    id: 'hs-court-back',
    scene: 'flooded_courtyard',
    x: 85,
    label: 'Quay lên Hành Lang Tầng 2',
    realm: 'both',
    kind: 'door',
    targetScene: 'corridor_act1',
    targetX: 1050,
  },
  {
    id: 'hs-court-money',
    scene: 'flooded_courtyard',
    x: 225,
    label: 'Chậu đồng cạnh hiên — Xấp Tiền Vàng Mã Cháy Dở',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.spirit_money,
    dialogueText: 'Bạn nhặt lại xấp tiền vàng mã còn nguyên vẹn dưới mái hiên ngập nước.',
  },
  {
    id: 'hs-court-lore3',
    scene: 'flooded_courtyard',
    x: 380,
    label: 'Mảnh thủy tinh vỡ dưới mưa bão',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-3-courtyard-glass',
  },
  {
    id: 'hs-court-flagpole',
    scene: 'flooded_courtyard',
    x: 540,
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
    x: 720,
    label: 'Trạm loa phóng thanh — Pin đài cũ',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.radio_battery,
    dialogueText: 'Bạn nhặt được hộp pin khô còn sót dưới chân loa phóng thanh.',
  },
  {
    id: 'hs-court-to-dorm',
    scene: 'flooded_courtyard',
    x: 930,
    label: 'Lối sang Khu Ký Túc Xá Nữ (Hồi 2)',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 110,
    requiredFlag: 'act1_climax_seen',
    blockedHint: 'Hãy kiểm tra cột cờ giữa sân trường trước khi rời khỏi sân mưa.',
  },

  // HỒI 2
  {
    id: 'hs-dorm-back',
    scene: 'dorm_hall',
    x: 85,
    label: 'Quay lại Sân Trường',
    realm: 'both',
    kind: 'door',
    targetScene: 'flooded_courtyard',
    targetX: 880,
  },
  {
    id: 'hs-dorm-lore4',
    scene: 'dorm_hall',
    x: 245,
    label: 'Giường tầng của Tô Dao — Khăn len hoa mai đan dở',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-4-todao-scarf',
  },
  {
    id: 'hs-dorm-illogical',
    scene: 'dorm_hall',
    x: 420,
    label: 'Cửa phòng ngủ — Dẫn thẳng sang Phòng Phát Thanh',
    realm: 'both',
    kind: 'illogical_door',
    targetScene: 'broadcast_room',
    targetX: 110,
    dialogueText: 'Bạn mở cửa phòng ngủ nữ sinh... nhưng phía sau lại là Phòng Phát Thanh tối om.',
  },
  {
    id: 'hs-dorm-lore5',
    scene: 'dorm_hall',
    x: 600,
    label: 'Bốn tờ giấy tố cáo vò nát (Âm Giới)',
    realm: 'yin',
    kind: 'lore',
    loreId: 'lore-5-yin-draft',
  },
  {
    id: 'hs-dorm-sealed-passage',
    scene: 'dorm_hall',
    x: 770,
    label: 'Nhà kho sau thư viện (Hiện ra trong Âm Giới)',
    realm: 'yin',
    kind: 'keepsake',
    keepsakeId: 'ks-3-burned-poetry',
  },
  {
    id: 'hs-dorm-to-darkroom',
    scene: 'dorm_hall',
    x: 1060,
    label: 'Cửa Phòng Rửa Ảnh Tối',
    realm: 'both',
    kind: 'door',
    targetScene: 'darkroom',
    targetX: 110,
    requiredFlag: 'radio_act2_tuned',
    blockedHint: 'Lối đi bị bẻ cong phi logic. Hãy vào Phòng Phát Thanh dò đúng tần số đài bán dẫn (104.7 MHz) để chuyển sang Âm Giới.',
  },

  {
    id: 'hs-broad-exit',
    scene: 'broadcast_room',
    x: 85,
    label: 'Bước ra Khu Ký Túc Xá',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 420,
  },
  {
    id: 'hs-broad-lore6',
    scene: 'broadcast_room',
    x: 300,
    label: 'Đống tro sách cấm sau tủ phát thanh',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-6-forbidden-list',
  },
  {
    id: 'hs-broad-radio',
    scene: 'broadcast_room',
    x: 490,
    label: 'Chiếc Đài Bán Dẫn Cũ (Dò tần số Âm – Dương)',
    realm: 'both',
    kind: 'radio',
  },
  {
    id: 'hs-broad-key',
    scene: 'broadcast_room',
    x: 760,
    label: 'Ngăn kéo bàn phát thanh — Chìa khóa Phòng Rửa Ảnh',
    realm: 'yin',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.darkroom_key,
    dialogueText: 'Trong Âm giới, bạn tìm thấy chìa khóa đồng Phòng Rửa Ảnh nằm dưới cuộn băng.',
  },

  {
    id: 'hs-dark-back',
    scene: 'darkroom',
    x: 85,
    label: 'Quay lại Ký Túc Xá',
    realm: 'both',
    kind: 'door',
    targetScene: 'dorm_hall',
    targetX: 1010,
  },
  {
    id: 'hs-dark-lore7',
    scene: 'darkroom',
    x: 305,
    label: 'Ngăn tủ hồ sơ mật Đội Tự Vệ',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-7-darkroom-ledger',
  },
  {
    id: 'hs-dark-tray',
    scene: 'darkroom',
    x: 520,
    label: 'Khay thuốc hiện hình dưới ánh đèn đỏ',
    realm: 'both',
    kind: 'darkroom_tray',
    keepsakeId: 'ks-4-negative-film',
  },
  {
    id: 'hs-dark-to-auditorium',
    scene: 'darkroom',
    x: 830,
    label: 'Cánh cửa Hội Trường Lớn (Hồi 3)',
    realm: 'both',
    kind: 'door',
    targetScene: 'auditorium',
    targetX: 110,
    requiredFlag: 'act2_climax_seen',
    blockedHint: 'Hãy kiểm tra khay thuốc rửa ảnh dưới ánh đèn đỏ trước.',
  },

  // HỒI 3
  {
    id: 'hs-aud-back',
    scene: 'auditorium',
    x: 85,
    label: 'Quay lại Phòng Rửa Ảnh',
    realm: 'both',
    kind: 'door',
    targetScene: 'darkroom',
    targetX: 780,
  },
  {
    id: 'hs-aud-radio-secret',
    scene: 'auditorium',
    x: 300,
    label: 'Máy thu sóng dự phòng góc sân khấu (Giải mã bí mật Hồi 3)',
    realm: 'both',
    kind: 'radio',
  },
  {
    id: 'hs-aud-lore8',
    scene: 'auditorium',
    x: 495,
    label: 'Chân bục đấu tố — Ký ức cái tát trong mưa',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-8-auditorium-slap',
  },
  {
    id: 'hs-aud-puppets',
    scene: 'auditorium',
    x: 700,
    label: 'Sân Khấu Bì Ảnh Hí Khổng Lồ',
    realm: 'both',
    kind: 'puppet_stage',
  },
  {
    id: 'hs-aud-to-prison',
    scene: 'auditorium',
    x: 1040,
    label: 'Hành lang Khu Biệt Giam',
    realm: 'both',
    kind: 'door',
    targetScene: 'prison_cells',
    targetX: 110,
    requiredFlag: 'puppets_solved',
    blockedHint: 'Cần tái hiện đầy đủ 4 màn kịch rối bóng Bì Ảnh Hí để mở lối sang Khu Biệt Giam.',
  },

  {
    id: 'hs-pris-back',
    scene: 'prison_cells',
    x: 85,
    label: 'Quay lại Hội Trường Lớn',
    realm: 'both',
    kind: 'door',
    targetScene: 'auditorium',
    targetX: 980,
  },
  {
    id: 'hs-pris-lore9',
    scene: 'prison_cells',
    x: 300,
    label: 'Vết cào thơ trên bức tường gạch ẩm',
    realm: 'both',
    kind: 'lore',
    loreId: 'lore-9-prison-scratches',
  },
  {
    id: 'hs-pris-crack',
    scene: 'prison_cells',
    x: 520,
    label: 'Khe gạch phòng biệt giam của Tô Dao',
    realm: 'both',
    kind: 'prison_crack',
    keepsakeId: 'ks-5-todao-note',
  },
  {
    id: 'hs-pris-to-1986',
    scene: 'prison_cells',
    x: 885,
    label: 'Bước vào 20 Năm Sau (Hồi 4)',
    realm: 'both',
    kind: 'door',
    targetScene: 'ruined_hall_1986',
    targetX: 110,
    requiredFlag: 'act3_climax_seen',
    blockedHint: 'Hãy tìm mẩu giấy Tô Dao giấu trong khe gạch phòng giam.',
  },

  // HỒI 4
  {
    id: 'hs-1986-back',
    scene: 'ruined_hall_1986',
    x: 85,
    label: 'Quay lại Khu Biệt Giam',
    realm: 'both',
    kind: 'door',
    targetScene: 'prison_cells',
    targetX: 830,
  },
  {
    id: 'hs-1986-wine',
    scene: 'ruined_hall_1986',
    x: 225,
    label: 'Bệ cửa sổ rêu — Chén Rượu Tế Thanh Minh',
    realm: 'both',
    kind: 'pickup',
    itemReward: INVENTORY_ITEMS.wine_cup,
    dialogueText: 'Bạn nhặt được chén rượu trắng Thanh Minh để tưởng nhớ người đã khuất.',
  },
  {
    id: 'hs-1986-pen',
    scene: 'ruined_hall_1986',
    x: 395,
    label: 'Bàn học phủ rêu — Cây bút máy & Áo đồng phục cũ',
    realm: 'both',
    kind: 'keepsake',
    keepsakeId: 'ks-6-tranmac-pen',
  },
  {
    id: 'hs-1986-memorial',
    scene: 'ruined_hall_1986',
    x: 555,
    label: 'Bia đá Thanh Minh (1986) — Tô Viễn, em trai Tô Dao',
    realm: 'both',
    kind: 'memorial_1986',
    loreId: 'lore-10-to-vien-1986',
  },
  {
    id: 'hs-1986-mirror',
    scene: 'ruined_hall_1986',
    x: 725,
    label: 'Tấm gương nứt vỡ (Ngôi trường sau 20 năm)',
    realm: 'both',
    kind: 'mirror_1980',
    dialogueText: 'Trong gương, ngôi trường đã sụp đổ thành đống hoang tàn thập niên 1980. Bạn nhận ra mình đã chết từ 20 năm trước...',
  },
  {
    id: 'hs-1986-to-trial',
    scene: 'ruined_hall_1986',
    x: 910,
    label: 'Cửa Phòng Thẩm Vấn Cuối Cùng',
    realm: 'both',
    kind: 'door',
    targetScene: 'final_interrogation',
    targetX: 130,
  },

  {
    id: 'hs-trial-chair',
    scene: 'final_interrogation',
    x: 600,
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
    playerX: 140,
    playerFacing: 1,
    walkPhase: 0,

    holdingBreath: false,
    breathStamina: 100,
    gaspPenaltyTimer: 0,
    sanity: 100,
    sanityBottomCount: 0,
    gazeExposure: 0,

    inventory: [],
    collectedKeepsakeIds: [],
    collectedLoreIds: [],
    activeLoreId: null,
    flags: {},

    wuxingSequence: [],
    radioFrequency: 88.5,
    radioTunedAct2: false,
    radioSecretAct3Solved: false,
    puppetOrder: [2, 0, 3, 1], // Scrambled 4 acts -> true order is [0, 1, 2, 3]
    puppetsSolved: false,

    interrogationStep: 0,
    confessionAnswers: [],

    ghosts: [
      {
        id: 'ghost-act1-paperhat',
        kind: 'paper_hat',
        variant: 'paper_hat',
        name: 'Vong Hồn Mũ Giấy',
        placardText: 'PHẢN ĐỘNG',
        scene: 'corridor_act1',
        x: 760,
        minX: 240,
        maxX: 1020,
        vx: 44,
        facing: 1,
        pacified: false,
      },
      {
        id: 'ghost-act2-tonguewarden',
        kind: 'tongue_warden',
        variant: 'tongue_warden',
        name: 'Quỷ Sai Cắt Lưỡi',
        placardText: 'VU KHỐNG',
        scene: 'dorm_hall',
        x: 680,
        minX: 220,
        maxX: 980,
        vx: -54,
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
        x: 840,
        minX: 380,
        maxX: 980,
        vx: -50,
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
  let bestDist = 72;
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
    if (hs.requiredFlag && !state.flags[hs.requiredFlag]) {
      return {
        ...state,
        subtitleText: hs.blockedHint ?? 'Cánh cửa bị khóa.',
        subtitleTimer: 4.2,
      };
    }
    const targetMeta = SCENE_META[hs.targetScene];
    return {
      ...state,
      scene: hs.targetScene,
      act: targetMeta.act,
      playerX: hs.targetX ?? 110,
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
        subtitleText: 'Bàn thờ Ngũ Hành đã cháy bùng ngọn lửa thanh tẩy, cổng sắt đã mở.',
        subtitleTimer: 3.4,
      };
    }
    return {
      ...state,
      activeModal: 'wuxing_puzzle',
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
        subtitleText: 'Nghi lễ Ngũ Hành hoàn tất! Vong hồn tan biến và cổng sắt xuống sân trường đã mở.',
        subtitleTimer: 4.5,
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

  // Act 2 target: 104.7 MHz
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

  // Act 3 secret radio frequency: 109.2 MHz (Required for True Ending: Bình Minh Cô Sơn)
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
      ? 'Toàn bộ bi kịch đêm đấu tố đã hiện rõ sau màn rối Bì Ảnh Hí. Ác Linh Tự Vệ tan biến, cửa Khu Biệt Giam đã mở.'
      : 'Sắp xếp 4 màn rối da lừa theo đúng trình tự đêm phản bội.',
    subtitleTimer: 4.5,
  };
}

export function evaluateFinalEnding(state: ThanhMinhState, finalConfess: boolean): EndingId {
  const allHonest =
    finalConfess && state.confessionAnswers.every((ans) => ans === true);

  // Ending 1: Kẻ Vô Can (Bad — Vòng lặp): Chối tội / đổ lỗi cho hoàn cảnh hoặc Trương Vệ Quốc
  if (!allHonest) {
    return 'ending_1_loop';
  }

  const ratio = state.collectedKeepsakeIds.length / TRUTH_KEEPSAKES.length; // 0..1

  // Ending 4: Bình Minh Cô Sơn (True Ending): 100% kỷ vật + giải mã tần số bí mật Hồi 3 + đối diện thẳng thắn + giữ được tỉnh táo
  if (
    state.collectedKeepsakeIds.length === TRUTH_KEEPSAKES.length &&
    state.radioSecretAct3Solved &&
    state.sanityBottomCount === 0
  ) {
    return 'ending_4_dawn_coson';
  }

  // Ending 2: Tro Tàn Hèn Nhát (Bad — Tự hủy): Nhận tội nhưng <50% kỷ vật hoặc để Tỉnh táo chạm đáy >= 2 lần
  if (ratio < 0.5 || state.sanityBottomCount >= 2) {
    return 'ending_2_ashes';
  }

  // Ending 3: Tiết Thanh Minh Muộn (Normal Ending): 50% - 80%+ kỷ vật hoặc chưa mở tần số bí mật Hồi 3
  return 'ending_3_late_qingming';
}

export function answerInterrogationStep(
  state: ThanhMinhState,
  admitGuilt: boolean
): ThanhMinhState {
  const nextAnswers = [...state.confessionAnswers, admitGuilt];
  if (state.interrogationStep < 2) {
    return {
      ...state,
      interrogationStep: (state.interrogationStep + 1) as 0 | 1 | 2,
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
  };

  if (prev.ending !== 'none') {
    return {
      next: { ...prev, endingTimer: prev.endingTimer + dt },
      events,
    };
  }

  // Advance dramatic Monster Kill Animation Cutscene before respawning Lâm Tĩnh
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
    return { next: prev, events };
  }

  const meta = SCENE_META[prev.scene];
  let {
    playerX,
    playerFacing,
    walkPhase,
    holdingBreath,
    breathStamina,
    gaspPenaltyTimer,
    sanity,
    sanityBottomCount,
    gazeExposure,
    subtitleText,
    subtitleTimer,
  } = prev;

  subtitleTimer = Math.max(0, subtitleTimer - dt);
  if (subtitleTimer <= 0) subtitleText = '';
  gaspPenaltyTimer = Math.max(0, gaspPenaltyTimer - dt);

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

  if (input.moveDir !== 0) {
    playerFacing = input.moveDir;
    const speed = holdingBreath ? 96 : 168;
    playerX = Math.max(meta.minX, Math.min(meta.maxX, playerX + input.moveDir * speed * dt));
    const prevCycle = Math.floor(walkPhase);
    walkPhase += (holdingBreath ? 2.6 : 4.2) * dt;
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
    const baseSpeed = g.kind === 'tongue_warden' ? 54 : 44;
    const distBefore = Math.abs(g.x - playerX);
    const playerAudible = !holdingBreath || gaspPenaltyTimer > 0;
    const isAlerted = playerAudible && distBefore < 135;

    let nx = g.x;
    let nvx = g.vx;
    let nFacing = g.facing;

    if (isAlerted) {
      const toPlayer = playerX - g.x;
      if (Math.abs(toPlayer) > 6) {
        nFacing = toPlayer > 0 ? 1 : -1;
        const stalkSpeed = g.kind === 'tongue_warden' ? 38 : 30;
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

    const respawnX = Math.max(meta.minX + 30, Math.min(meta.maxX - 30, meta.minX + 55));
    const storyWhisper =
      killerVariant === 'auditor_specter'
        ? '“Chính mày giao nộp danh sách ấy, sao giờ lại giả vờ quên tiếng loa trên bục?”'
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
      sanity,
      sanityBottomCount,
      gazeExposure,
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
    if (!state.flags.wuxing_solved) {
      return 'Nín thở [Space] qua Vong Hồn Mũ Giấy, hóa vàng theo thứ tự Ngũ Hành tại bàn thờ hành lang.';
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
    if (!state.collectedKeepsakeIds.includes('ks-3-burned-poetry')) {
      return 'Chuyển sang Âm Giới [Q] tại Ký Túc Xá để tìm Nhà kho sau thư viện bị che giấu.';
    }
    if (!state.flags.act2_climax_seen) {
      return 'Né Quỷ Sai Cắt Lưỡi bằng cách nín thở, vào Phòng Rửa Ảnh kiểm tra khay thuốc đỏ.';
    }
    return 'Mở cánh cửa cuối Phòng Rửa Ảnh để bước vào Hội Trường Lớn (Hồi 3).';
  }
  if (state.act === 3) {
    if (!state.puppetsSolved) {
      return 'Sắp xếp 4 màn rối Bì Ảnh Hí đúng trình tự (và thử giải mã máy thu sóng dự phòng cho True Ending).';
    }
    if (!state.flags.act3_climax_seen) {
      return 'Vào Khu Biệt Giam tìm mẩu giấy của Tô Dao giấu trong khe gạch.';
    }
    return 'Tiến về cuối Khu Biệt Giam để bước sang Cô Sơn 20 năm sau (Hồi 4).';
  }
  if (!state.flags.saw_20_years_ruin) {
    return 'Khám phá đống đổ nát năm 1986 và soi vào tấm gương nứt vỡ.';
  }
  return 'Bước vào Phòng Thẩm Vấn Cuối Cùng và ngồi xuống ghế đối diện chính mình.';
}
