export type GamePhase = 1 | 2 | 3;

export type ScreenMode = 'title' | 'playing' | 'paused' | 'gameover';

export type EndingType =
  | 'historical_liberation' // Survived all 30 days until Tang relief troops arrived
  | 'iron_door_breached'    // Garrison Compliance / Hunger Threat hit 0 -> soldiers broke the iron door
  | 'sanity_collapsed'      // Sanity hit 0 -> consumed by cellar hallucinations
  | 'suffocated_darkness';  // Left in pitch darkness too long with zero lamp oil

export type NpcId = 'baker' | 'mother' | 'scholar';

export type RationKind =
  | 'rice'
  | 'salted_meat'
  | 'dried_beans'
  | 'millet'
  | 'tree_bark'
  | 'horse_hide'
  | 'sewer_rat'
  | 'dead_crow'
  | 'blood_sack';

export interface SuanpanRod {
  heaven: boolean; // true = 5 active (pushed down toward beam)
  earth: number;   // 0..4 beads active (pushed up toward beam)
}

export type AbacusState = [SuanpanRod, SuanpanRod, SuanpanRod]; // [Hundreds, Tens, Ones]

export interface VentEncounter {
  npcId: NpcId;
  npcName: string;
  npcRole: string;
  dialogue: string;
  canShareCrumbs: boolean;
  shareLabel?: string;
  withholdLabel?: string;
  shareReply?: string;
  withholdReply?: string;
}

export interface KeepsakeDetail {
  npcId: NpcId;
  title: string;
  description: string;
  hanTag: string;
}

export interface DayScript {
  day: number;
  phase: GamePhase;
  phaseTitle: string;
  dateLabel: string;
  rationKind: RationKind;
  rationName: string;
  ledgerCode: string;
  targetLiang: number;       // Requisition demand in 'lượng' (1..150)
  actualLiang: number;       // Actual weight in parcel
  discrepancyNote?: string;
  generalDecree?: string;    // Special sealed order (e.g. Day 21)
  atmosphereNote: string;
  ventEncounter?: VentEncounter;
  keepsake?: KeepsakeDetail;
  doorKnockingLevel: number; // 0..3 intensity
}

export interface LedgerMark {
  day: number;
  ledgerCode: string;
  decision: 'approved' | 'rejected';
  weightMatched: boolean;
  abacusMatched: boolean;
  keepsakeTitle?: string;
}

export interface CellarGameState {
  day: number;
  phase: GamePhase;
  lampOil: number;          // 0..100
  lampLit: boolean;
  darknessSeconds: number;  // accumulated darkness exposure in current blackout
  sanity: number;           // 0..100
  compliance: number;       // 0..100 (Garrison order; 0 => soldiers breach iron door)
  humanity: number;         // hidden/tracked moral weight (0..30)
  pulleyLowered: boolean;
  parcelInspected: boolean;
  parcelOnScale: boolean;
  scaleWeights: number[];   // active counterweights placed on right pan
  abacus: AbacusState;
  sealInked: boolean;
  stampedDecision: 'approved' | 'rejected' | null;
  ventHandled: boolean;
  ventChoice: 'shared' | 'withheld' | 'listened' | null;
  lastEventMessage: string;
  history: LedgerMark[];
  ending: EndingType | null;
  npcBonds: Record<NpcId, number>;
  washbasinGhostActive: boolean;
  washedFaceToday: boolean;
}

export const COUNTERWEIGHTS: readonly number[] = [50, 20, 10, 5, 2, 1];

export const HISTORICAL_CHRONICLE_QUOTE = {
  source: 'Tư Trị Thông Giám · Quyển 220 (Đường Kỷ · Năm Chí Đức thứ 2, 757 SCN)',
  excerpt:
    'Thành Tuy Dương bị vây suốt mười tháng, lương tuyệt. Tướng sĩ ăn hết chiến mã, rồi bắt chuột, giã vỏ cây, luộc da giáp làm lương. Về sau bắt dân trong thành ăn thịt... Khi viện binh tới phá vây, trong hơn ba vạn dân ban đầu, chỉ còn sống sót khoảng bốn trăm người.',
  subtitle: 'Cánh cửa sắt bật tung dưới ánh nắng chói lòa. Không có tiếng reo hò.',
};

export function createInitialAbacus(): AbacusState {
  return [
    { heaven: false, earth: 0 },
    { heaven: false, earth: 0 },
    { heaven: false, earth: 0 },
  ];
}

export function computeRodValue(rod: SuanpanRod): number {
  return (rod.heaven ? 5 : 0) + Math.max(0, Math.min(4, Math.floor(rod.earth)));
}

export function computeAbacusValue(abacus: AbacusState): number {
  const hundreds = computeRodValue(abacus[0]) * 100;
  const tens = computeRodValue(abacus[1]) * 10;
  const ones = computeRodValue(abacus[2]);
  return hundreds + tens + ones;
}

export function toggleAbacusHeaven(abacus: AbacusState, rodIndex: 0 | 1 | 2): AbacusState {
  const next: AbacusState = [
    { ...abacus[0] },
    { ...abacus[1] },
    { ...abacus[2] },
  ];
  next[rodIndex].heaven = !next[rodIndex].heaven;
  return next;
}

export function setAbacusEarth(abacus: AbacusState, rodIndex: 0 | 1 | 2, beadCount: number): AbacusState {
  const clamped = Math.max(0, Math.min(4, Math.floor(beadCount)));
  const next: AbacusState = [
    { ...abacus[0] },
    { ...abacus[1] },
    { ...abacus[2] },
  ];
  // Clicking already active top bead toggles it down by 1 for ergonomic single-click operation
  if (next[rodIndex].earth === clamped && clamped > 0) {
    next[rodIndex].earth = clamped - 1;
  } else {
    next[rodIndex].earth = clamped;
  }
  return next;
}

export function decomposeToAbacus(value: number): AbacusState {
  const v = Math.max(0, Math.min(999, Math.round(value)));
  const h = Math.floor(v / 100);
  const t = Math.floor((v % 100) / 10);
  const o = v % 10;
  return [
    { heaven: h >= 5, earth: h % 5 },
    { heaven: t >= 5, earth: t % 5 },
    { heaven: o >= 5, earth: o % 5 },
  ];
}

export function computeScaleWeightsTotal(weights: readonly number[]): number {
  return weights.reduce((sum, w) => sum + w, 0);
}

export function getPhaseForDay(day: number): GamePhase {
  if (day <= 10) return 1;
  if (day <= 20) return 2;
  return 3;
}

export function getPhaseTitle(phase: GamePhase): string {
  if (phase === 1) return 'Giai Đoạn I · Cạn Kiệt';
  if (phase === 2) return 'Giai Đoạn II · Biến Chất';
  return 'Giai Đoạn III · Sổ Sách Của Quỷ';
}

const PHASE_1_DAYS: DayScript[] = [
  {
    day: 1,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 1',
    rationKind: 'rice',
    rationName: 'Gạo Tẻ Kho Bắc',
    ledgerCode: 'LƯƠNG-01 · 粟',
    targetLiang: 25,
    actualLiang: 25,
    atmosphereNote: 'Hầm kho còn thoang thoảng mùi gạo cũ. Trên mặt đất, tiếng trống đổi gác vẫn đều đặn.',
    ventEncounter: {
      npcId: 'baker',
      npcName: 'Lão Trương',
      npcRole: 'Thợ bánh mè phố Đông',
      dialogue:
        'Quan gia mới nhận ca dưới hầm đấy à? Lò nhà lão hết than từ hôm qua, chỉ còn chút bột khô. Cho lão gửi ấm trà lá vối qua khe cửa này nhé?',
      canShareCrumbs: true,
      shareLabel: 'Chia chút gạo vụn (+Tâm trí, -4 Tuân thủ)',
      withholdLabel: 'Từ chối theo quân lệnh (+3 Tuân thủ)',
      shareReply: 'Đa tạ Quan gia! Con cháu nhà lão nhớ ơn này suốt đời.',
      withholdReply: 'Lão hiểu... quân pháp bất vị thân. Thôi lão ra đóng cửa hàng sớm.',
    },
    doorKnockingLevel: 0,
  },
  {
    day: 2,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 2',
    rationKind: 'salted_meat',
    rationName: 'Thịt Muối Hầm',
    ledgerCode: 'NHỤC-02 · 臘',
    targetLiang: 18,
    actualLiang: 18,
    atmosphereNote: 'Mưa phùn thấm qua trần đá, nhỏ giọt đều lên miệng chậu nước góc bàn.',
    ventEncounter: {
      npcId: 'mother',
      npcName: 'Thị Mai & Bé An',
      npcRole: 'Mẹ trẻ ở ngõ Hòe',
      dialogue:
        'Quan ơi, thằng An nhà em sốt từ đêm qua, khóc khản cả giọng. Trong kho còn sót nắm cháo loãng hay mảnh vải sạch nào không ạ?',
      canShareCrumbs: true,
      shareLabel: 'Tuồn ít thịt khô & gạo qua khe (+Tâm trí, -5 Tuân thủ)',
      withholdLabel: 'Giữ nguyên khẩu phần lính (+3 Tuân thủ)',
      shareReply: 'Cảm ơn Quan... Bé An vừa cầm chiếc lục lạc gỗ cười rồi, nghe tiếng nó lắc vui tai lắm.',
      withholdReply: 'Em xin lỗi vì làm phiền Quan... Để em ru thằng bé ngủ tạm.',
    },
    doorKnockingLevel: 0,
  },
  {
    day: 3,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 3',
    rationKind: 'dried_beans',
    rationName: 'Đậu Đen Phơi Khô',
    ledgerCode: 'ĐẬU-03 · 豆',
    targetLiang: 32,
    actualLiang: 32,
    atmosphereNote: 'Ròng rọc kêu cót két. Bao đậu nhẹ hơn hôm qua một chút.',
    ventEncounter: {
      npcId: 'scholar',
      npcName: 'Thư Sinh Tống Văn',
      npcRole: 'Nho sinh bị kẹt trong thành',
      dialogue:
        'Tôi vừa chép xong phong thư gửi thê tử ngoài Kinh thành, nhưng cổng thành đóng kín mít rồi. Quan dưới hầm có nghe tin viện quân khi nào tới không?',
      canShareCrumbs: false,
      withholdLabel: 'Trấn an: Viện quân đang trên đường (+2 Tâm trí)',
      withholdReply: 'Mong trời phật phù hộ. Trong áo tôi vẫn giữ miếng ngọc bội đính ước chờ ngày đoàn tụ.',
    },
    doorKnockingLevel: 0,
  },
  {
    day: 4,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 4',
    rationKind: 'millet',
    rationName: 'Kê Vàng Dự Trữ',
    ledgerCode: 'TÚC-04 · 稷',
    targetLiang: 40,
    actualLiang: 37,
    discrepancyNote: 'Bao kê bị chuột cắn góc đáy, hao hụt 3 lượng so với lệnh xuất.',
    atmosphereNote: 'Tiếng bước chân tuần tra nặng nề trên ván gỗ phía trên lỗ thông hơi.',
    ventEncounter: {
      npcId: 'baker',
      npcName: 'Lão Trương',
      npcRole: 'Thợ bánh mè phố Đông',
      dialogue:
        'Quân phản loạn lại dựng thêm tháp công thành phía Tây rồi. Sáng nay nhà bên cạnh phải tháo cả cửa gỗ ra nhóm bếp. Dưới đó đèn dầu có đủ sáng không?',
      canShareCrumbs: true,
      shareLabel: 'San sẻ một nắm kê (+Tâm trí, -4 Tuân thủ)',
      withholdLabel: 'Khuyên lão giữ sức (+2 Tuân thủ)',
      shareReply: 'Hạt kê vàng óng thế này... Lão cất kỹ vào hộp thiếc bánh mè để nấu cháo cho mấy đứa nhỏ trong ngõ.',
      withholdReply: 'Ừ, lão giữ hộp thiếc cũ này làm kỷ niệm vậy. Quan giữ gìn sức khỏe nhé.',
    },
    doorKnockingLevel: 0,
  },
  {
    day: 5,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 5',
    rationKind: 'rice',
    rationName: 'Gạo Cẩm Hạng Nhì',
    ledgerCode: 'LƯƠNG-05 · 米',
    targetLiang: 28,
    actualLiang: 28,
    atmosphereNote: 'Bóng lính gác lướt qua khe cửa sắt. Giọng họ đã bắt đầu khàn đi.',
    doorKnockingLevel: 1,
  },
  {
    day: 6,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 6',
    rationKind: 'salted_meat',
    rationName: 'Thịt Muối Khô Đét',
    ledgerCode: 'NHỤC-06 · 肉',
    targetLiang: 15,
    actualLiang: 15,
    atmosphereNote: 'Kho trên vừa báo cắt giảm một nửa khẩu phần thịt. Mũi bạn ngửi thấy mùi ẩm mốc nồng lên.',
    ventEncounter: {
      npcId: 'mother',
      npcName: 'Thị Mai & Bé An',
      npcRole: 'Mẹ trẻ ở ngõ Hòe',
      dialogue:
        'Hôm nay lính thu hết lương khô trong dân rồi Quan ạ... May mà cái trâm sừng mẹ chồng em để lại vẫn giắt trên tóc, không ai để ý. Thằng An cứ đòi nhìn xuống khe sáng.',
      canShareCrumbs: true,
      shareLabel: 'Đưa nốt phần muối vụn (+Tâm trí, -5 Tuân thủ)',
      withholdLabel: 'Đóng khe gió tránh lính thấy (+2 Tuân thủ)',
      shareReply: 'Quan tốt bụng quá... Sau này hết giặc em nhất định bế bé An sang tạ ơn.',
      withholdReply: 'Vâng, em bế cháu đi ngay kẻo quân tuần tra trông thấy.',
    },
    doorKnockingLevel: 1,
  },
  {
    day: 7,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 7',
    rationKind: 'dried_beans',
    rationName: 'Đậu Tương Mốc Nhẹ',
    ledgerCode: 'ĐẬU-07 · 菽',
    targetLiang: 22,
    actualLiang: 22,
    atmosphereNote: 'Đáy bao đậu lẫn nhiều sạn sỏi. Ngọn đèn dầu thỉnh thoảng lách tách.',
    doorKnockingLevel: 1,
  },
  {
    day: 8,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 8',
    rationKind: 'millet',
    rationName: 'Vét Đáy Bồ Kê',
    ledgerCode: 'TÚC-08 · 糧',
    targetLiang: 16,
    actualLiang: 14,
    discrepancyNote: 'Kho gần như vét sạch. Trọng lượng thực chỉ còn 14 lượng.',
    atmosphereNote: 'Từ bên ngoài cửa sắt vang lên tiếng gõ nhẹ nhưng sốt ruột của lính tiếp tế.',
    ventEncounter: {
      npcId: 'scholar',
      npcName: 'Thư Sinh Tống Văn',
      npcRole: 'Nho sinh bị kẹt trong thành',
      dialogue:
        'Ngoài phố không còn tiếng rao nữa rồi. Người ta bắt đầu bứt cỏ mọc kẽ gạch đá. Quan nhớ cẩn thận nhé, ánh mắt lính tuần hôm nay lạ lắm.',
      canShareCrumbs: false,
      withholdLabel: 'Ghi nhận cảnh báo (-2 Tâm trí)',
      withholdReply: 'Tôi viết tên người thân vào vạt áo rồi... lỡ có chuyện gì.',
    },
    doorKnockingLevel: 1,
  },
  {
    day: 9,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 9',
    rationKind: 'rice',
    rationName: 'Cám Gạo Trộn Trấu',
    ledgerCode: 'KHANG-09 · 糠',
    targetLiang: 31,
    actualLiang: 31,
    atmosphereNote: 'Bao cám bụi mù, hít vào cổ họng rát buốt.',
    doorKnockingLevel: 1,
  },
  {
    day: 10,
    phase: 1,
    phaseTitle: 'Giai Đoạn I · Cạn Kiệt',
    dateLabel: 'Tháng Giêng · Ngày 10',
    rationKind: 'dried_beans',
    rationName: 'Hạt Đậu Cuối Kho',
    ledgerCode: 'ĐẬU-10 · 盡',
    targetLiang: 11,
    actualLiang: 11,
    atmosphereNote: 'Đêm thứ mười. Bầu trời qua lỗ thông hơi đỏ quạch ánh lửa từ trại địch.',
    ventEncounter: {
      npcId: 'baker',
      npcName: 'Lão Trương',
      npcRole: 'Thợ bánh mè phố Đông',
      dialogue:
        'Lão nghe nói ngày mai kho chính thức niêm phong hết gạo... Không biết trên trại họ định xoay xở thế nào. Lão ho nhiều quá, không nói to được nữa...',
      canShareCrumbs: true,
      shareLabel: 'Đưa nhúm đậu cuối cùng (+Tâm trí, -5 Tuân thủ)',
      withholdLabel: 'Lặng lẽ gật đầu từ biệt',
      shareReply: 'Sống chết có số... Quan nhớ giữ lấy ngọn đèn đừng để tắt.',
      withholdReply: 'Tiếng ho của lão Trương xa dần trong con hẻm tối.',
    },
    doorKnockingLevel: 2,
  },
];

const PHASE_2_DAYS: DayScript[] = [
  {
    day: 11,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 11',
    rationKind: 'tree_bark',
    rationName: 'Vỏ Cây Du Nghiền Bột',
    ledgerCode: 'MỘC-11 · 皮',
    targetLiang: 45,
    actualLiang: 45,
    atmosphereNote: 'Kho lương thực sự đã trống rỗng. Ròng rọc thả xuống thứ bột xám xịt nồng mùi nhựa đắng.',
    doorKnockingLevel: 2,
  },
  {
    day: 12,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 12',
    rationKind: 'horse_hide',
    rationName: 'Da Ngựa Chiến Luộc Mềm',
    ledgerCode: 'CÁCH-12 · 革',
    targetLiang: 36,
    actualLiang: 36,
    atmosphereNote: 'Tiếng ngựa hí tắt hẳn trên thành. Miếng da thuộc hầm nhừ nhầy nhụa bốc hơi tanh nồng.',
    ventEncounter: {
      npcId: 'mother',
      npcName: 'Thị Mai',
      npcRole: 'Mẹ trẻ ở ngõ Hòe',
      dialogue:
        'Quan ơi... thằng An không khóc nổi nữa rồi. Ngoài đường người ta bắt đầu nhìn nhau bằng ánh mắt đói khát... Em sợ lắm.',
      canShareCrumbs: false,
      withholdLabel: 'Dặn cô khóa chặt cửa nhà (-4 Tâm trí)',
      withholdReply: 'Em ôm con trốn vào góc bếp đây... mong trời mau sáng.',
    },
    doorKnockingLevel: 2,
  },
  {
    day: 13,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 13',
    rationKind: 'sewer_rat',
    rationName: 'Chuột Cống Hầm Phơi Khô',
    ledgerCode: 'THỬ-13 · 鼠',
    targetLiang: 19,
    actualLiang: 19,
    atmosphereNote: 'Cái rọ sắt thả xuống kêu lách cách. Mấy con chuột cống cứng đơ vẫn còn nguyên râu mép.',
    doorKnockingLevel: 2,
  },
  {
    day: 14,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 14',
    rationKind: 'dead_crow',
    rationName: 'Quạ Chết Trên Tường Thành',
    ledgerCode: 'NHA-14 · 鴉',
    targetLiang: 24,
    actualLiang: 22,
    discrepancyNote: 'Xác quạ gầy trơ xương, thiếu 2 lượng so với sổ kê.',
    atmosphereNote: 'Tiếng đập cửa sắt dội vang khiến bụi trần rơi lả tả xuống bàn tính.',
    doorKnockingLevel: 3,
  },
  {
    day: 15,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 15',
    rationKind: 'horse_hide',
    rationName: 'Yên Ngựa & Dây Da Hầm',
    ledgerCode: 'AN-15 · 鞍',
    targetLiang: 52,
    actualLiang: 52,
    atmosphereNote: 'Không khí trong hầm đặc quánh, ngọn đèn dầu yếu đi rõ rệt vì thiếu dưỡng khí.',
    ventEncounter: {
      npcId: 'scholar',
      npcName: 'Thư Sinh Tống Văn',
      npcRole: 'Nho sinh bị kẹt trong thành',
      dialogue:
        'Hôm nay tôi thấy toán lính đi vào khu nhà dân tay cầm dây thừng và dao bầu... Họ bảo đi thu gom "lương dự trữ". Quan có biết đó là gì không?',
      canShareCrumbs: false,
      withholdLabel: 'Im lặng né ánh mắt qua khe (-5 Tâm trí)',
      withholdReply: 'Sao Quan không trả lời tôi...? Trời ơi...',
    },
    doorKnockingLevel: 2,
  },
  {
    day: 16,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 16',
    rationKind: 'tree_bark',
    rationName: 'Rễ Cỏ & Vỏ Thông Giã',
    ledgerCode: 'THẢO-16 · 草',
    targetLiang: 33,
    actualLiang: 33,
    atmosphereNote: 'Ngón tay dính đầy mùn gỗ ẩm. Có tiếng cào móng tay khe khẽ ngay sau cánh cửa sắt.',
    doorKnockingLevel: 3,
  },
  {
    day: 17,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 17',
    rationKind: 'sewer_rat',
    rationName: 'Thịt Chuột Muối Hỏng',
    ledgerCode: 'THỬ-17 · 腐',
    targetLiang: 27,
    actualLiang: 27,
    atmosphereNote: 'Mùi hôi thối xộc thẳng lên mũi. Mặt nước trong chậu đá khẽ rung lên từng vòng.',
    doorKnockingLevel: 2,
  },
  {
    day: 18,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 18',
    rationKind: 'dead_crow',
    rationName: 'Chim Sẻ & Dơi Hầm',
    ledgerCode: 'ĐIỂU-18 · 鳥',
    targetLiang: 14,
    actualLiang: 14,
    atmosphereNote: 'Không còn ai ghé qua lỗ thông hơi hôm nay. Chỉ có gió rít như tiếng khóc.',
    doorKnockingLevel: 3,
  },
  {
    day: 19,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 19',
    rationKind: 'horse_hide',
    rationName: 'Xương Ngựa Nghiền Vụn',
    ledgerCode: 'CỐT-19 · 骨',
    targetLiang: 48,
    actualLiang: 48,
    atmosphereNote: 'Bột xương trắng bệch vương vãi lên con dấu son. Lính ngoài cửa gào thét đòi mở khóa.',
    doorKnockingLevel: 3,
  },
  {
    day: 20,
    phase: 2,
    phaseTitle: 'Giai Đoạn II · Biến Chất',
    dateLabel: 'Tháng Hai · Ngày 20',
    rationKind: 'tree_bark',
    rationName: 'Bùn Non & Lá Khô',
    ledgerCode: 'NÊ-20 · 泥',
    targetLiang: 21,
    actualLiang: 21,
    atmosphereNote: 'Đêm thứ hai mươi. Trên trại lính bỗng im bặt một cách rùng rợn. Có người đang xuống cầu thang...',
    doorKnockingLevel: 1,
  },
];

const PHASE_3_DAYS: DayScript[] = [
  {
    day: 21,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 21',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Bố Rỉ Máu · Loại Bổ',
    ledgerCode: 'DƯƠNG-21 · 羊',
    targetLiang: 64,
    actualLiang: 64,
    generalDecree: 'MẬT LỆNH TƯỚNG QUÂN (ĐÓNG DẤU ĐỎ): "THÀNH CÒN NGƯỜI, QUÂN KHÔNG THỂ ĐÓI."',
    atmosphereNote: 'Từ nay mọi khẩu phần đều mang mã hiệu LƯỠNG CƯỚC DƯƠNG. Máu đỏ thẫm thấm ướt sợi dây thừng ròng rọc.',
    keepsake: {
      npcId: 'baker',
      title: 'Hộp Thiếc Bánh Mè Khắc Chữ "Trương"',
      description: 'Bên trong bao tải nặng mùi tanh, tay bạn chạm phải một chiếc hộp thiếc méo mó vẫn còn vương vài hạt mè đen.',
      hanTag: '老張 · Bất Thịt Lão Nhân',
    },
    doorKnockingLevel: 2,
  },
  {
    day: 22,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 22',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Bố · Phân Loại Nhị Lưỡng',
    ledgerCode: 'DƯƠNG-22 · 二',
    targetLiang: 58,
    actualLiang: 58,
    atmosphereNote: 'Nước máu nhỏ tong tỏng lên mặt bàn gỗ, hòa vào vết mực chu sa cũ.',
    doorKnockingLevel: 2,
  },
  {
    day: 23,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 23',
    rationKind: 'blood_sack',
    rationName: 'Bao Nhỏ Bọc Vải Hoa',
    ledgerCode: 'DƯƠNG-23 · 羔',
    targetLiang: 35,
    actualLiang: 35,
    atmosphereNote: 'Bao hôm nay nhẹ bất thường. Có tiếng lắc rất khẽ khi ròng rọc hạ xuống.',
    keepsake: {
      npcId: 'mother',
      title: 'Chiếc Lục Lạc Gỗ Hình Chim Sẻ',
      description: 'Món đồ chơi gỗ nhỏ xíu rơi ra từ nếp vải bọc dính máu. Tiếng lạch cạch hệt như đêm bé An cười qua khe gió.',
      hanTag: '小羊 · Khẩu Phần Nhi Đồng',
    },
    doorKnockingLevel: 3,
  },
  {
    day: 24,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 24',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Bố · Loại Phụ Nữ',
    ledgerCode: 'DƯƠNG-24 · 婦',
    targetLiang: 72,
    actualLiang: 72,
    atmosphereNote: 'Qua khe cửa sắt, hàng chục cặp mắt đỏ ngầu đang nhìn chằm chằm vào bàn cân của bạn.',
    keepsake: {
      npcId: 'mother',
      title: 'Chiếc Trâm Cài Tóc Bằng Sừng',
      description: 'Chiếc trâm gãy đôi kẹt trong dây buộc bao tải — đúng là kỷ vật mẹ chồng Thị Mai từng nhắc ở Ngày 6.',
      hanTag: '梅氏 · Tàn Tích Ngõ Hòe',
    },
    doorKnockingLevel: 3,
  },
  {
    day: 25,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 25',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Bố · Thanh Tráng',
    ledgerCode: 'DƯƠNG-25 · 丁',
    targetLiang: 84,
    actualLiang: 84,
    atmosphereNote: 'Khẩu phần nặng khiến dây thừng ròng rọc rít lên từng hồi rợn người.',
    keepsake: {
      npcId: 'scholar',
      title: 'Miếng Ngọc Bội Vỡ & Bức Thư Vấy Máu',
      description: 'Nét chữ nho nắn nót trên mảnh giấy nhàu nhĩ: "Nếu chàng không về, xin nàng đừng chờ..."',
      hanTag: '宋文 · Nho Sinh Phố Tây',
    },
    doorKnockingLevel: 2,
  },
  {
    day: 26,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 26',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Rách · Hỗn Hợp',
    ledgerCode: 'DƯƠNG-26 · 雜',
    targetLiang: 67,
    actualLiang: 63,
    discrepancyNote: 'Bao rỉ máu mất 4 lượng trên đường vận chuyển. Quân lính đang gầm gừ sau cửa.',
    atmosphereNote: 'Bóng người trong chậu nước rửa tay dường như đứng sát sau lưng bạn hơn một bước.',
    doorKnockingLevel: 3,
  },
  {
    day: 27,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 27',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Số 27 · Vét Phố',
    ledgerCode: 'DƯƠNG-27 · 殘',
    targetLiang: 55,
    actualLiang: 55,
    atmosphereNote: 'Trên trần hầm có tiếng nhai sột soạt khe khẽ dù không có ai ở đó.',
    doorKnockingLevel: 3,
  },
  {
    day: 28,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 28',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Số 28 · Cạn Dân',
    ledgerCode: 'DƯƠNG-28 · 窮',
    targetLiang: 49,
    actualLiang: 49,
    atmosphereNote: 'Thành Tuy Dương lặng như tờ. Chỉ còn tiếng thở dốc của những kẻ còn sống.',
    doorKnockingLevel: 3,
  },
  {
    day: 29,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 29',
    rationKind: 'blood_sack',
    rationName: 'Bao Tải Cuối Cùng · Đếm Ngược',
    ledgerCode: 'DƯƠNG-29 · 末',
    targetLiang: 76,
    actualLiang: 76,
    atmosphereNote: 'Ngày thứ hai mươi chín. Phía xa chân trời bỗng vang lên tiếng tù và viện binh nhà Đường.',
    doorKnockingLevel: 2,
  },
  {
    day: 30,
    phase: 3,
    phaseTitle: 'Giai Đoạn III · Sổ Sách Của Quỷ',
    dateLabel: 'Tháng Ba · Ngày 30',
    rationKind: 'blood_sack',
    rationName: 'Phiếu Kiểm Kê Cuối · Giải Vây',
    ledgerCode: 'DƯƠNG-30 · 終',
    targetLiang: 42,
    actualLiang: 42,
    generalDecree: 'PHIÊN TRỰC CUỐI CÙNG: VIỆN QUÂN ĐANG PHÁ CỔNG THÀNH.',
    atmosphereNote: 'Ánh sáng chói lòa bắt đầu lọt qua khe cửa sắt. Tiếng chân chạy dồn dập ngoài hành lang.',
    doorKnockingLevel: 1,
  },
];

export const ALL_DAYS: readonly DayScript[] = [
  ...PHASE_1_DAYS,
  ...PHASE_2_DAYS,
  ...PHASE_3_DAYS,
];

export function getDayScript(day: number): DayScript {
  const clamped = Math.max(1, Math.min(30, Math.floor(day)));
  return ALL_DAYS[clamped - 1];
}

export function createInitialGameState(startDay = 1): CellarGameState {
  const day = Math.max(1, Math.min(30, Math.floor(startDay)));
  const phase = getPhaseForDay(day);
  const script = getDayScript(day);
  return {
    day,
    phase,
    lampOil: phase === 1 ? 100 : phase === 2 ? 78 : 65,
    lampLit: true,
    darknessSeconds: 0,
    sanity: phase === 1 ? 100 : phase === 2 ? 78 : 54,
    compliance: phase === 1 ? 82 : phase === 2 ? 70 : 62,
    humanity: phase === 1 ? 30 : phase === 2 ? 22 : 16,
    pulleyLowered: false,
    parcelInspected: false,
    parcelOnScale: false,
    scaleWeights: [],
    abacus: createInitialAbacus(),
    sealInked: false,
    stampedDecision: null,
    ventHandled: !script.ventEncounter,
    ventChoice: null,
    lastEventMessage: script.generalDecree || script.atmosphereNote,
    history: [],
    ending: null,
    npcBonds: {
      baker: phase > 1 ? 1 : 0,
      mother: phase > 1 ? 1 : 0,
      scholar: phase > 1 ? 1 : 0,
    },
    washbasinGhostActive: phase >= 2,
    washedFaceToday: false,
  };
}

export function computeScaleTiltNormalized(state: CellarGameState): number {
  if (!state.parcelOnScale) {
    // Only right weights pull down on the right side
    const rightTotal = computeScaleWeightsTotal(state.scaleWeights);
    if (rightTotal === 0) return 0;
    return Math.min(1, rightTotal / 40);
  }
  const script = getDayScript(state.day);
  const rightTotal = computeScaleWeightsTotal(state.scaleWeights);
  const diff = rightTotal - script.actualLiang; // positive -> right pan heavier
  return Math.max(-1, Math.min(1, diff / 25));
}

export function isScaleBalanced(state: CellarGameState): boolean {
  if (!state.parcelOnScale) return false;
  const script = getDayScript(state.day);
  return computeScaleWeightsTotal(state.scaleWeights) === script.actualLiang;
}

export function isAbacusMatched(state: CellarGameState): boolean {
  const script = getDayScript(state.day);
  const val = computeAbacusValue(state.abacus);
  return val === script.actualLiang || val === script.targetLiang;
}

export function tickLampAndAtmosphere(
  state: CellarGameState,
  dtSeconds: number
): CellarGameState {
  if (state.ending) return state;
  const dt = Math.max(0, Math.min(2, dtSeconds));
  // Phase 2 & 3 deplete lamp oil faster due to stale cellar air
  const drainRate = state.phase === 1 ? 0.55 : state.phase === 2 ? 0.95 : 1.25;
  let nextOil = state.lampLit ? Math.max(0, state.lampOil - drainRate * dt) : state.lampOil;
  let nextLit = state.lampLit;
  if (nextOil <= 0) {
    nextOil = 0;
    nextLit = false;
  }

  let nextDarkness = state.darknessSeconds;
  let nextSanity = state.sanity;
  if (!nextLit) {
    nextDarkness += dt;
    // Darkness erodes sanity continuously
    nextSanity = Math.max(0, nextSanity - 1.85 * dt);
  } else {
    nextDarkness = Math.max(0, nextDarkness - dt * 1.5);
  }

  let ending: EndingType | null = null;
  if (nextSanity <= 0) {
    ending = 'sanity_collapsed';
  } else if (nextDarkness >= 22) {
    ending = 'suffocated_darkness';
  }

  const washbasinGhostActive =
    !nextLit || nextSanity < 65 || state.phase >= 2;

  return {
    ...state,
    lampOil: nextOil,
    lampLit: nextLit,
    darknessSeconds: nextDarkness,
    sanity: nextSanity,
    washbasinGhostActive,
    ending,
  };
}

export function refillAndLightLamp(state: CellarGameState): CellarGameState {
  if (state.ending) return state;
  return {
    ...state,
    lampOil: Math.min(100, state.lampOil + 42),
    lampLit: true,
    darknessSeconds: 0,
    lastEventMessage: state.lampLit
      ? 'Bạn khêu lại tim đèn và châm thêm dầu lạc. Ngọn lửa vàng vọt bùng lên xua bớt bóng tối.'
      : 'Ngọn đèn bùng sáng trở lại! Những tiếng thở sau gáy lập tức tan biến vào góc tường.',
  };
}

export function lowerPulleyParcel(state: CellarGameState): CellarGameState {
  if (state.ending || state.pulleyLowered) return state;
  const script = getDayScript(state.day);
  return {
    ...state,
    pulleyLowered: true,
    lastEventMessage: `Ròng rọc hạ xuống: ${script.rationName} (${script.ledgerCode}). Hãy kiểm tra và đưa lên cân.`,
  };
}

export function inspectPulleyParcel(state: CellarGameState): CellarGameState {
  if (state.ending || !state.pulleyLowered) return state;
  const script = getDayScript(state.day);
  if (script.keepsake) {
    return {
      ...state,
      parcelInspected: true,
      sanity: Math.max(1, state.sanity - 2),
      lastEventMessage: `Kỷ vật tìm thấy: ${script.keepsake.title} — ${script.keepsake.description}`,
    };
  }
  return {
    ...state,
    parcelInspected: true,
    lastEventMessage: script.discrepancyNote
      ? `Kiểm tra thực tế: ${script.discrepancyNote}`
      : `Đã mở bao kiểm tra: ${script.rationName}. Trọng lượng cần đối chiếu trên cân và bàn tính.`,
  };
}

export function washFaceAtBasin(state: CellarGameState): CellarGameState {
  if (state.ending || state.washedFaceToday) return state;
  const nextSanity = Math.min(100, state.sanity + 5);
  return {
    ...state,
    washedFaceToday: true,
    sanity: nextSanity,
    lastEventMessage:
      state.washbasinGhostActive
        ? 'Bạn vục tay rửa mặt trong chậu nước lạnh. Giữa làn sóng sánh, có hàng chục bóng người gầy gò vừa thoáng đứng ngay sau lưng bạn...'
        : 'Nước giếng lạnh buốt giúp đầu óc tỉnh táo hơn đôi chút.',
  };
}

export function placeParcelOnScale(state: CellarGameState): CellarGameState {
  if (state.ending || !state.pulleyLowered) return state;
  const script = getDayScript(state.day);
  return {
    ...state,
    parcelOnScale: true,
    lastEventMessage: `Đã đặt ${script.rationName} lên đĩa cân trái. Thêm quả cân bên phải và gảy bàn tính để đối chiếu.`,
  };
}

export function toggleScaleWeight(state: CellarGameState, weight: number): CellarGameState {
  if (state.ending) return state;
  // Allow stacking multiple of the same or toggling; let's add if < 3 of that weight, or use add/remove helpers.
  // Actually, clean UX: toggle single weight chip on/off OR add weight + clear weights.
  // With [50, 20, 10, 5, 2, 1], can we reach every integer 1..88 with single set?
  // Wait: 50+20+10+5+2+1 = 88! To reach e.g. 42, we need 20+20+2 OR 50-something!
  // Good catch! Let's support adding multiple weights (array of numbers) AND removing/clearing!
  const idx = state.scaleWeights.indexOf(weight);
  if (idx >= 0) {
    const next = [...state.scaleWeights];
    next.splice(idx, 1);
    return { ...state, scaleWeights: next };
  }
  return { ...state, scaleWeights: [...state.scaleWeights, weight] };
}

export function addScaleWeight(state: CellarGameState, weight: number): CellarGameState {
  if (state.ending || state.scaleWeights.length >= 10) return state;
  return {
    ...state,
    scaleWeights: [...state.scaleWeights, weight],
  };
}

export function removeScaleWeightAt(state: CellarGameState, index: number): CellarGameState {
  if (state.ending || index < 0 || index >= state.scaleWeights.length) return state;
  const next = [...state.scaleWeights];
  next.splice(index, 1);
  return { ...state, scaleWeights: next };
}

export function clearScaleWeights(state: CellarGameState): CellarGameState {
  if (state.ending) return state;
  return { ...state, scaleWeights: [] };
}

export function dipSealInInk(state: CellarGameState): CellarGameState {
  if (state.ending) return state;
  return {
    ...state,
    sealInked: true,
    lastEventMessage: 'Con dấu ngà đã thấm đẫm mực chu sa đỏ thẫm.',
  };
}

export function resolveVentChoice(
  state: CellarGameState,
  choice: 'shared' | 'withheld' | 'listened'
): CellarGameState {
  if (state.ending || state.ventHandled) return state;
  const script = getDayScript(state.day);
  const enc = script.ventEncounter;
  if (!enc) {
    return { ...state, ventHandled: true };
  }

  let nextSanity = state.sanity;
  let nextCompliance = state.compliance;
  let nextHumanity = state.humanity;
  const nextBonds = { ...state.npcBonds };
  let reply = '';

  if (choice === 'shared' && enc.canShareCrumbs) {
    nextSanity = Math.min(100, nextSanity + 6);
    nextCompliance = Math.max(0, nextCompliance - 4);
    nextHumanity += 1;
    nextBonds[enc.npcId] = (nextBonds[enc.npcId] ?? 0) + 1;
    reply = enc.shareReply || 'Họ nhận lấy chút vụn lương thực với ánh mắt biết ơn.';
  } else {
    if (state.phase === 1 && enc.canShareCrumbs) {
      nextCompliance = Math.min(100, nextCompliance + 3);
    } else if (state.phase >= 2) {
      nextSanity = Math.max(1, nextSanity - 4);
    } else {
      nextSanity = Math.min(100, nextSanity + 2);
    }
    reply = enc.withholdReply || 'Tiếng bước chân ngoài khe gió lặng dần.';
  }

  let ending: EndingType | null = null;
  if (nextCompliance <= 0) ending = 'iron_door_breached';
  else if (nextSanity <= 0) ending = 'sanity_collapsed';

  return {
    ...state,
    ventHandled: true,
    ventChoice: choice,
    sanity: nextSanity,
    compliance: nextCompliance,
    humanity: nextHumanity,
    npcBonds: nextBonds,
    ending,
    lastEventMessage: `${enc.npcName}: "${reply}"`,
  };
}

export function stampDailyRequisition(
  state: CellarGameState,
  decision: 'approved' | 'rejected'
): CellarGameState {
  if (state.ending || !state.pulleyLowered || !state.sealInked || state.stampedDecision !== null) {
    return state;
  }
  const script = getDayScript(state.day);
  const weightMatched = isScaleBalanced(state);
  const abacusMatched = isAbacusMatched(state);

  let nextSanity = state.sanity;
  let nextCompliance = state.compliance;
  let nextHumanity = state.humanity;
  let msg = '';

  if (decision === 'approved') {
    if (state.phase === 1) {
      const bonus = weightMatched && abacusMatched ? 5 : -6;
      nextCompliance = Math.max(0, Math.min(100, nextCompliance + bonus));
      msg =
        weightMatched && abacusMatched
          ? `Đã đóng dấu ĐỎ duyệt xuất kho ${script.ledgerCode}. Số liệu chuẩn xác.`
          : `Đã đóng dấu duyệt ${script.ledgerCode}, nhưng cân nặng hoặc bàn tính bị lệch (+sai số sổ sách).`;
    } else if (state.phase === 2) {
      nextCompliance = Math.min(100, nextCompliance + (weightMatched && abacusMatched ? 7 : 1));
      nextSanity = Math.max(0, nextSanity - 2);
      msg = `Bạn đóng dấu xuất ${script.rationName}. Tiếng gào sau cửa sắt tạm lắng xuống.`;
    } else {
      // Phase 3: Approving "Lưỡng cước dương" rations
      nextCompliance = Math.min(100, nextCompliance + (weightMatched && abacusMatched ? 11 : 4));
      const keepsakePenalty = script.keepsake ? 9 : 6;
      nextSanity = Math.max(0, nextSanity - keepsakePenalty);
      nextHumanity = Math.max(0, nextHumanity - 1);
      msg = script.keepsake
        ? `Dấu son đóng mạnh xuống phiếu ${script.ledgerCode}. Bạn nhắm mắt đẩy bao hàng cùng "${script.keepsake.title}" ra cửa.`
        : `Phiếu ${script.ledgerCode} đã đóng dấu duyệt. Lính kéo bao tải biến mất sau cánh cửa sắt.`;
    }
  } else {
    // Rejected / Concealed
    if (state.phase === 1) {
      // Correct rejection only if there is a real weight discrepancy
      if (script.discrepancyNote && weightMatched && abacusMatched) {
        nextCompliance = Math.min(100, nextCompliance + 6);
        msg = `Bạn phát hiện hao hụt thực tế và đóng dấu hoàn trả kiểm tra lại. Thượng cấp ghi nhận sự cẩn trọng.`;
      } else {
        nextCompliance = Math.max(0, nextCompliance - 14);
        msg = `Bạn từ chối xuất kho vô cớ! Đội trưởng ngoài cửa đập mạnh vách sắt cảnh cáo.`;
      }
    } else if (state.phase === 2) {
      nextCompliance = Math.max(0, nextCompliance - 18);
      nextSanity = Math.min(100, nextSanity + 3);
      msg = `Bạn từ chối đóng dấu đống thức ăn ôi thiu. Tiếng đập cửa sắt điên cuồng vang lên dữ dội!`;
    } else {
      // Phase 3 moral refusal!
      const complianceLoss = script.keepsake ? 24 : 20;
      nextCompliance = Math.max(0, nextCompliance - complianceLoss);
      nextSanity = Math.min(100, nextSanity + (script.keepsake ? 6 : 3));
      nextHumanity = Math.min(30, nextHumanity + 1);
      msg = script.keepsake
        ? `Bạn giấu lại kỷ vật và từ chối đóng dấu! Binh lính gào thét dữ dội ngoài cửa sắt, đòi phá khóa.`
        : `Bạn ném con dấu sang một bên, không duyệt khẩu phần máu. Cơn thịnh nộ của trại lính rung chuyển căn hầm.`;
    }
  }

  let ending: EndingType | null = null;
  if (nextCompliance <= 0) {
    ending = 'iron_door_breached';
  } else if (nextSanity <= 0) {
    ending = 'sanity_collapsed';
  }

  const mark: LedgerMark = {
    day: state.day,
    ledgerCode: script.ledgerCode,
    decision,
    weightMatched,
    abacusMatched,
    keepsakeTitle: script.keepsake?.title,
  };

  return {
    ...state,
    sealInked: false,
    stampedDecision: decision,
    sanity: nextSanity,
    compliance: nextCompliance,
    humanity: nextHumanity,
    history: [...state.history, mark],
    ending,
    lastEventMessage: msg,
  };
}

export function advanceToNextDay(state: CellarGameState): CellarGameState {
  if (state.ending) return state;
  if (state.stampedDecision === null) return state;

  if (state.day >= 30) {
    return {
      ...state,
      ending: 'historical_liberation',
      lastEventMessage: HISTORICAL_CHRONICLE_QUOTE.subtitle,
    };
  }

  const nextDay = state.day + 1;
  const nextPhase = getPhaseForDay(nextDay);
  const nextScript = getDayScript(nextDay);

  // Subtle passive recovery on oil slightly capped, sanity carries over
  const nextLampOil = Math.min(100, Math.max(18, state.lampOil + (nextPhase === 1 ? 12 : 4)));

  return {
    ...state,
    day: nextDay,
    phase: nextPhase,
    lampOil: nextLampOil,
    lampLit: true,
    darknessSeconds: 0,
    pulleyLowered: false,
    parcelInspected: false,
    parcelOnScale: false,
    scaleWeights: [],
    abacus: createInitialAbacus(),
    sealInked: false,
    stampedDecision: null,
    ventHandled: !nextScript.ventEncounter,
    ventChoice: null,
    washbasinGhostActive: nextPhase >= 2 || state.sanity < 65,
    washedFaceToday: false,
    lastEventMessage: nextScript.generalDecree || nextScript.atmosphereNote,
  };
}
