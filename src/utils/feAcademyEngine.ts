export type FeStationId =
  | 'dom_sniper'
  | 'layout_heist'
  | 'event_loop'
  | 'devtools_detective'
  | 'tree_defense';

export type FeAssistMode = 'visual_guide' | 'pro_challenge';

export interface FeStationMeta {
  readonly id: FeStationId;
  readonly index: number;
  readonly title: string;
  readonly shortTitle: string;
  readonly skillFocus: string;
  readonly tagline: string;
  readonly beginnerAnalogy: string;
  readonly visualLegend: readonly { label: string; meaning: string }[];
}

export const FE_STATIONS: readonly FeStationMeta[] = [
  {
    id: 'dom_sniper',
    index: 1,
    title: '01. Xạ Thủ CSS Selector',
    shortTitle: 'DOM Sniper',
    skillFocus: 'CSS Selectors · Nhắm Chuẩn Khối HTML',
    tagline: 'Gõ selector chuẩn xác tiêu diệt quảng cáo & script độc, tuyệt đối không bắn nhầm con tin.',
    beginnerAnalogy:
      'Mỗi phần tử trên web giống một ngôi nhà có "tên đường" (.feed) và "biển số" (.ad-banner). Bạn gõ tên cần bắn — ô nào sáng khung xanh/đỏ nghĩa là tia ngắm đang chỉ vào ô đó!',
    visualLegend: [
      { label: '.tên', meaning: 'Chọn theo nhãn lớp (Class)' },
      { label: 'A B', meaning: 'Chọn B nằm bên trong vùng A' },
      { label: ':not(.x)', meaning: 'Loại trừ khối có nhãn .x' },
    ],
  },
  {
    id: 'layout_heist',
    index: 2,
    title: '02. Đột Nhập Layout',
    shortTitle: 'Flex/Grid Heist',
    skillFocus: 'Flexbox · CSS Grid · Sắp Xếp Khung Hình',
    tagline: 'Dùng tối đa 2–3 thuộc tính CSS thật đưa đội hình vào ô kim cương mà không chạm tia laser.',
    beginnerAnalogy:
      'Hãy tưởng tượng các ô A, B, C đứng trên một hàng dây phơi: 1 lệnh kéo sang Trái/Phải (justify-content), 1 lệnh đẩy Lên/Xuống (align-items). Bấm nút điều khiển bên cạnh để xem đội hình trượt ngay!',
    visualLegend: [
      { label: 'justify-content', meaning: 'Dịch chuyển theo Trục Chính (mũi tên vàng)' },
      { label: 'align-items', meaning: 'Dịch chuyển theo Trục Vuông Góc (mũi tên xanh)' },
      { label: 'flex-direction', meaning: 'Xoay hướng xếp: Hàng ngang ↔ Cột dọc' },
    ],
  },
  {
    id: 'event_loop',
    index: 3,
    title: '03. Băng Chuyền Event Loop',
    shortTitle: 'Event Loop',
    skillFocus: 'Thứ Tự Chạy Lệnh JavaScript (Sync → VIP → Hẹn Giờ)',
    tagline: 'Đóng mở cổng Đường Thẳng / Khách VIP / Bãi Chờ đúng thứ tự chạy lệnh trước khi tab bị treo.',
    beginnerAnalogy:
      'Trình duyệt chỉ có 1 nhân viên thu ngân: (1) Khách đứng ngay quầy (Sync) làm hết trước → (2) Khách VIP (Promise / sau await) chen lên ngay sau đó → (3) Khách đặt hẹn giờ (setTimeout) luôn phải đợi cuối cùng!',
    visualLegend: [
      { label: '1. Đường Thẳng', meaning: 'console.log thường & code trước await' },
      { label: '2. Cổng VIP', meaning: 'Promise.then / queueMicrotask / sau await' },
      { label: '3. Bãi Chờ', meaning: 'setTimeout / fetch (dù ghi 0ms vẫn chạy sau)' },
    ],
  },
  {
    id: 'devtools_detective',
    index: 4,
    title: '04. Thám Tử Soi Bug',
    shortTitle: 'DevTools Bug',
    skillFocus: 'Responsive · Chống Vỡ Giao Diện Mobile',
    tagline: 'Kéo màn hình từ Laptop (1440px) xuống Điện Thoại (375px), soi điểm vỡ khung rồi chọn miếng vá.',
    beginnerAnalogy:
      'Web đẹp trên máy tính nhưng mở bằng điện thoại hẹp dễ bị nút bấm chồng lên chữ hoặc chữ dài chọc thủng khung. Kéo thanh kích thước về 375px để thấy chỗ báo ĐỎ, rồi thử các miếng vá CSS xem màn hình tự sửa!',
    visualLegend: [
      { label: 'flex-wrap: wrap', meaning: 'Cho phép tự xuống dòng khi màn hình hẹp' },
      { label: 'min-width: 0', meaning: 'Cho phép chữ dài bẻ dòng thay vì đẩy phình khung' },
      { label: 'z-index cao hơn', meaning: 'Đưa lớp menu nổi lên trên banner che khuất' },
    ],
  },
  {
    id: 'tree_defense',
    index: 5,
    title: '05. Thủ Thành Re-Render',
    shortTitle: 'Tree Defense',
    skillFocus: 'Chống Giật Lag Web (Debounce · Memo · Tách State)',
    tagline: 'Đặt lá chắn kỹ thuật lên cây Component để giữ Web mượt 60 FPS qua bão gõ phím.',
    beginnerAnalogy:
      'Khi bạn gõ 1 chữ vào ô Tìm Kiếm, nếu code viết ẩu, cả Thanh Menu, Chân Trang lẫn Biểu Đồ Nặng 500 dòng đều bị vẽ lại (chớp ĐỎ) gây giật lag. Bật lá chắn để cô lập vùng cần vẽ lại!',
    visualLegend: [
      { label: 'Tách State', meaning: 'Ô tìm kiếm tự nhớ chữ của nó, không làm vạ lây cả trang' },
      { label: 'Debounce 300ms', meaning: 'Đợi tay ngừng gõ 0.3s mới tìm, bỏ qua nhịp gõ thừa' },
      { label: 'React.memo / Virtual', meaning: 'Đóng băng bảng nặng & chỉ vẽ các dòng đang nhìn thấy' },
    ],
  },
];

export interface FeRankInfo {
  readonly rankTitle: string;
  readonly nextRankXp: number | null;
}

export function getFeRank(xp: number): FeRankInfo {
  if (xp >= 2200) return { rankTitle: 'Staff Frontend Architect', nextRankXp: null };
  if (xp >= 1400) return { rankTitle: 'Senior UI & Runtime', nextRankXp: 2200 };
  if (xp >= 800) return { rankTitle: 'Mid-Level Layout Pro', nextRankXp: 1400 };
  if (xp >= 350) return { rankTitle: 'Junior DOM Tactician', nextRankXp: 800 };
  return { rankTitle: 'Intern Frontend Cadet', nextRankXp: 350 };
}

export function calculateMissionScore(
  baseXp: number,
  streak: number,
  timeLeftRatio: number,
  cleanBonus = true,
  assistMode: FeAssistMode = 'visual_guide'
): number {
  const streakMult = 1 + Math.min(6, Math.max(0, streak)) * 0.15;
  const modeMult = assistMode === 'pro_challenge' ? 1.5 : 1;
  const speedBonus = Math.round(Math.max(0, Math.min(1, timeLeftRatio)) * 45);
  const precisionBonus = cleanBonus ? 30 : 0;
  return Math.round((baseXp + speedBonus + precisionBonus) * streakMult * modeMult);
}

// ============================================================================
// STATION 1: DOM SNIPER (CSS SELECTOR & SPECIFICITY)
// ============================================================================
export interface DomTargetSpec {
  readonly domId: string;
  readonly tag: string;
  readonly classes: readonly string[];
  readonly attrs?: Readonly<Record<string, string>>;
  readonly label: string;
  readonly role: 'enemy' | 'hostage' | 'neutral';
  readonly groupLabel: string;
}

export interface DomSniperMission {
  readonly id: string;
  readonly levelIndex: number; // 0..2
  readonly title: string;
  readonly briefing: string;
  readonly timeLimitSec: number;
  readonly maxSpecificityScore: number; // weighted a*100 + b*10 + c
  readonly maxSelectorChars: number;
  readonly containerHint: string;
  readonly quickChips: readonly string[];
  readonly solutionExample: string;
  readonly explanation: string;
  readonly nodes: readonly DomTargetSpec[];
  readonly expectedEnemyDomIds: readonly string[];
}

export const DOM_SNIPER_MISSIONS: readonly DomSniperMission[] = [
  {
    id: 'sniper-1',
    levelIndex: 0,
    title: 'Dọn Sạch Popup Quảng Cáo',
    briefing:
      'Tiêu diệt toàn bộ thẻ quảng cáo (.ad-banner) nằm BÊN TRONG vùng .feed. Tuyệt đối không bắn .avatar hay nút thanh toán!',
    timeLimitSec: 45,
    maxSpecificityScore: 35,
    maxSelectorChars: 42,
    containerHint: '.feed > .ad-banner hoặc .feed .ad-banner',
    quickChips: ['.feed', '>', '.ad-banner', ':not(.pinned)', 'aside'],
    solutionExample: '.feed .ad-banner',
    explanation:
      'Dùng selector ngữ cảnh `.feed .ad-banner` (Specificity 0,2,0) vừa gọn vừa nhắm chuẩn vùng tin tức mà không đụng nhầm con tin.',
    expectedEnemyDomIds: ['ad-1', 'ad-2'],
    nodes: [
      {
        domId: 'avatar-1',
        tag: 'img',
        classes: ['avatar', 'user-safe'],
        attrs: { 'data-role': 'hostage' },
        label: 'Avatar User',
        role: 'hostage',
        groupLabel: '.header',
      },
      {
        domId: 'pay-btn-1',
        tag: 'button',
        classes: ['pay-btn', 'primary'],
        attrs: { type: 'button' },
        label: 'Thanh Toán 499k',
        role: 'hostage',
        groupLabel: '.header',
      },
      {
        domId: 'post-1',
        tag: 'article',
        classes: ['post', 'clean'],
        label: 'Bài viết React Tips',
        role: 'neutral',
        groupLabel: '.feed',
      },
      {
        domId: 'ad-1',
        tag: 'aside',
        classes: ['ad-banner', 'popup'],
        label: 'Popup Trúng Thưởng!',
        role: 'enemy',
        groupLabel: '.feed',
      },
      {
        domId: 'ad-2',
        tag: 'aside',
        classes: ['ad-banner', 'flash'],
        label: 'Banner Cờ Bạc 18+',
        role: 'enemy',
        groupLabel: '.feed',
      },
      {
        domId: 'footer-promo',
        tag: 'div',
        classes: ['promo-safe'],
        label: 'Thông báo Hệ thống',
        role: 'hostage',
        groupLabel: '.footer',
      },
    ],
  },
  {
    id: 'sniper-2',
    levelIndex: 1,
    title: 'Loại Trừ Bài Ghim & Đánh Tỉa Chẵn/Lẻ',
    briefing:
      'Trong danh sách .feed, tiêu diệt các mục <li> ở vị trí LẺ (:nth-child(odd)) của bài viết KHÔNG bị ghim (:not(.pinned)). Giữ nguyên bài ghim!',
    timeLimitSec: 55,
    maxSpecificityScore: 45,
    maxSelectorChars: 54,
    containerHint: 'Kết hợp :not(.pinned) và li:nth-child(odd)',
    quickChips: ['.feed', 'article:not(.pinned)', 'li:nth-child(odd)', 'li:nth-child(even)'],
    solutionExample: '.feed article:not(.pinned) li:nth-child(odd)',
    explanation:
      '`:not(.pinned)` giúp loại trừ bài viết an toàn đang ghim, còn `li:nth-child(odd)` đánh trúng chính xác các tracker vị trí lẻ 1 & 3.',
    expectedEnemyDomIds: ['track-odd-1', 'track-odd-3'],
    nodes: [
      {
        domId: 'pinned-li-1',
        tag: 'li',
        classes: ['item', 'safe'],
        label: 'Ghi chú Quan trọng #1',
        role: 'hostage',
        groupLabel: 'article.pinned',
      },
      {
        domId: 'pinned-li-2',
        tag: 'li',
        classes: ['item', 'safe'],
        label: 'Thanh toán Đã xác nhận',
        role: 'hostage',
        groupLabel: 'article.pinned',
      },
      {
        domId: 'track-odd-1',
        tag: 'li',
        classes: ['tracker', 'odd'],
        label: 'Tracker #1 (Lẻ)',
        role: 'enemy',
        groupLabel: 'article.stream',
      },
      {
        domId: 'safe-even-2',
        tag: 'li',
        classes: ['comment', 'safe'],
        label: 'Bình luận #2 (Chẵn)',
        role: 'hostage',
        groupLabel: 'article.stream',
      },
      {
        domId: 'track-odd-3',
        tag: 'li',
        classes: ['tracker', 'odd'],
        label: 'Tracker #3 (Lẻ)',
        role: 'enemy',
        groupLabel: 'article.stream',
      },
      {
        domId: 'safe-even-4',
        tag: 'li',
        classes: ['comment', 'safe'],
        label: 'Avatar tác giả #4',
        role: 'hostage',
        groupLabel: 'article.stream',
      },
    ],
  },
  {
    id: 'sniper-3',
    levelIndex: 2,
    title: 'Vô Hiệu Hóa Script Độc Theo Thuộc Tính',
    briefing:
      'Chiến dịch cuối: Bắn hạ mọi thẻ có thuộc tính [data-threat="xss"] hoặc nằm ngay sau thẻ cảnh báo (.alert + .payload). Chú ý điểm Specificity <= 40!',
    timeLimitSec: 60,
    maxSpecificityScore: 40,
    maxSelectorChars: 58,
    containerHint: 'Dùng Attribute Selector [data-threat="xss"] hoặc +',
    quickChips: ['[data-threat="xss"]', '.alert + .payload', ', ', 'script', 'button:not(.pay-btn)'],
    solutionExample: '[data-threat="xss"], .alert + .payload',
    explanation:
      'Attribute selector `[data-threat="xss"]` kết hợp adjacent sibling `.alert + .payload` tiêu diệt đúng payload độc mà không chạm script chuẩn hay nút thanh toán.',
    expectedEnemyDomIds: ['xss-1', 'xss-2', 'payload-1'],
    nodes: [
      {
        domId: 'safe-analytics',
        tag: 'div',
        classes: ['telemetry-script'],
        attrs: { 'data-threat': 'none' },
        label: 'SDK Thống kê Sạch',
        role: 'hostage',
        groupLabel: '.head',
      },
      {
        domId: 'xss-1',
        tag: 'span',
        classes: ['injected'],
        attrs: { 'data-threat': 'xss' },
        label: 'Script Đánh cắp Cookie',
        role: 'enemy',
        groupLabel: '.body',
      },
      {
        domId: 'alert-trigger',
        tag: 'div',
        classes: ['alert'],
        label: 'Cảnh báo DOM',
        role: 'neutral',
        groupLabel: '.body',
      },
      {
        domId: 'payload-1',
        tag: 'div',
        classes: ['payload'],
        label: 'Miner Ẩn Sau Alert',
        role: 'enemy',
        groupLabel: '.body',
      },
      {
        domId: 'pay-safe-2',
        tag: 'button',
        classes: ['pay-btn'],
        label: 'Nút Xác Nhận OTP',
        role: 'hostage',
        groupLabel: '.checkout',
      },
      {
        domId: 'xss-2',
        tag: 'iframe',
        classes: ['hidden-frame'],
        attrs: { 'data-threat': 'xss' },
        label: 'Iframe Phishing XSS',
        role: 'enemy',
        groupLabel: '.checkout',
      },
    ],
  },
];

export interface SelectorSpecificity {
  readonly ids: number;
  readonly classesAttrsPseudos: number;
  readonly elements: number;
  readonly score: number;
  readonly formatted: string;
}

export function calcSelectorSpecificity(selector: string): SelectorSpecificity {
  const cleaned = selector
    .replace(/:not\(([^)]*)\)/g, ' $1 ')
    .replace(/\[[^\]]*\]/g, ' .attr ')
    .trim();
  const parts = cleaned.split(',').map((s) => s.trim()).filter(Boolean);
  let maxTuple: [number, number, number] = [0, 0, 0];
  let maxScore = 0;

  for (const part of parts) {
    const ids = (part.match(/#[a-zA-Z_-][\w-]*/g) ?? []).length;
    const classes = (part.match(/\.[a-zA-Z_-][\w-]*/g) ?? []).length;
    const pseudos = (part.match(/:(?!:)[\w-]+(\([^)]*\))?/g) ?? []).length;
    const stripped = part
      .replace(/#[a-zA-Z_-][\w-]*/g, ' ')
      .replace(/\.[a-zA-Z_-][\w-]*/g, ' ')
      .replace(/:+[\w-]+(\([^)]*\))?/g, ' ')
      .replace(/[>+~*]/g, ' ');
    const elements = stripped
      .split(/\s+/)
      .filter((tok) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(tok)).length;

    const score = ids * 100 + (classes + pseudos) * 10 + elements;
    if (score >= maxScore) {
      maxScore = score;
      maxTuple = [ids, classes + pseudos, elements];
    }
  }

  return {
    ids: maxTuple[0],
    classesAttrsPseudos: maxTuple[1],
    elements: maxTuple[2],
    score: maxScore,
    formatted: `(${maxTuple[0]}, ${maxTuple[1]}, ${maxTuple[2]})`,
  };
}

export interface SniperEvaluationResult {
  readonly validSyntax: boolean;
  readonly won: boolean;
  readonly hitEnemyIds: string[];
  readonly hitHostageIds: string[];
  readonly missedEnemyIds: string[];
  readonly specificity: SelectorSpecificity;
  readonly penaltyReason: string | null;
}

export function evaluateSniperShot(
  mission: DomSniperMission,
  selector: string,
  matchedDomIds: readonly string[]
): SniperEvaluationResult {
  const trimmed = selector.trim();
  const specificity = calcSelectorSpecificity(trimmed);
  if (!trimmed) {
    return {
      validSyntax: false,
      won: false,
      hitEnemyIds: [],
      hitHostageIds: [],
      missedEnemyIds: [...mission.expectedEnemyDomIds],
      specificity,
      penaltyReason: 'Hãy nhập một CSS Selector trước khi bắn!',
    };
  }

  const nodeMap = new Map(mission.nodes.map((n) => [n.domId, n]));
  const hitEnemyIds: string[] = [];
  const hitHostageIds: string[] = [];

  for (const id of matchedDomIds) {
    const node = nodeMap.get(id);
    if (!node) continue;
    if (node.role === 'enemy') hitEnemyIds.push(id);
    else if (node.role === 'hostage') hitHostageIds.push(id);
  }

  const missedEnemyIds = mission.expectedEnemyDomIds.filter((id) => !hitEnemyIds.includes(id));

  if (hitHostageIds.length > 0) {
    return {
      validSyntax: true,
      won: false,
      hitEnemyIds,
      hitHostageIds,
      missedEnemyIds,
      specificity,
      penaltyReason: `Bắn nhầm ${hitHostageIds.length} con tin! Mất 1 mạng.`,
    };
  }

  if (specificity.score > mission.maxSpecificityScore || trimmed.length > mission.maxSelectorChars) {
    return {
      validSyntax: true,
      won: false,
      hitEnemyIds,
      hitHostageIds,
      missedEnemyIds,
      specificity,
      penaltyReason: `Selector quá cồng kềnh (Specificity ${specificity.score} > ${mission.maxSpecificityScore} hoặc dài > ${mission.maxSelectorChars} ký tự)!`,
    };
  }

  if (missedEnemyIds.length > 0) {
    return {
      validSyntax: true,
      won: false,
      hitEnemyIds,
      hitHostageIds,
      missedEnemyIds,
      specificity,
      penaltyReason: `Còn sót ${missedEnemyIds.length} mục tiêu địch chưa bị tiêu diệt!`,
    };
  }

  return {
    validSyntax: true,
    won: true,
    hitEnemyIds,
    hitHostageIds,
    missedEnemyIds: [],
    specificity,
    penaltyReason: null,
  };
}

// ============================================================================
// STATION 2: FLEXBOX / GRID HEIST (LAYOUT PUZZLE)
// ============================================================================
export interface LayoutCoord {
  readonly x: number; // 0..100 percentage of board width
  readonly y: number; // 0..100 percentage of board height
}

export interface LayoutHeistLevel {
  readonly id: string;
  readonly levelIndex: number;
  readonly title: string;
  readonly mode: 'flex' | 'grid';
  readonly briefing: string;
  readonly maxProperties: number;
  readonly timeLimitSec: number;
  readonly agents: readonly { id: string; label: string; colorHex: string }[];
  readonly goalNormalizedPoints: readonly LayoutCoord[]; // 0..100 relative slots
  readonly traps: readonly { x: number; y: number; radiusPct: number; label: string }[];
  readonly quickSnippets: readonly string[];
  readonly solutionExample: string;
  readonly explanation: string;
}

export const LAYOUT_HEIST_LEVELS: readonly LayoutHeistLevel[] = [
  {
    id: 'heist-1',
    levelIndex: 0,
    title: 'Đội Hình Góc Dưới Phải',
    mode: 'flex',
    briefing:
      'Đưa 3 đặc vụ A, B, C xuống hàng ngang sát GÓC DƯỚI BÊN PHẢI vào đúng 3 ô kim cương, tránh bẫy tia laser ở phía trên.',
    maxProperties: 3,
    timeLimitSec: 50,
    agents: [
      { id: 'A', label: 'A', colorHex: '#38BDF8' },
      { id: 'B', label: 'B', colorHex: '#34D399' },
      { id: 'C', label: 'C', colorHex: '#FBBF24' },
    ],
    goalNormalizedPoints: [
      { x: 78, y: 86 },
      { x: 86, y: 86 },
      { x: 94, y: 86 },
    ],
    traps: [
      { x: 25, y: 20, radiusPct: 12, label: 'Bẫy Laser Bắc' },
      { x: 78, y: 25, radiusPct: 12, label: 'Cảm biến Trần' },
    ],
    quickSnippets: [
      'justify-content: flex-end;',
      'align-items: flex-end;',
      'gap: 12px;',
      'justify-content: center;',
    ],
    solutionExample: 'justify-content: flex-end;\nalign-items: flex-end;',
    explanation:
      'Trong `flex-direction: row` mặc định, `justify-content: flex-end` đẩy đội hình sang phải theo trục chính và `align-items: flex-end` hạ sát đáy theo trục phụ.',
  },
  {
    id: 'heist-2',
    levelIndex: 1,
    title: 'Hành Lang Dọc Đảo Chiều',
    mode: 'flex',
    briefing:
      'Bẫy laser chặn hai bên sườn! Hãy xếp đội hình thành CỘT DỌC ở CHÍNH GIỮA, đồng thời ĐẢO NGƯỢC thứ tự (C ở trên cùng, A ở dưới cùng) và giãn đều từ trên xuống dưới.',
    maxProperties: 3,
    timeLimitSec: 55,
    agents: [
      { id: 'A', label: 'A', colorHex: '#38BDF8' },
      { id: 'B', label: 'B', colorHex: '#34D399' },
      { id: 'C', label: 'C', colorHex: '#FBBF24' },
    ],
    goalNormalizedPoints: [
      { x: 50, y: 86 }, // A at bottom
      { x: 50, y: 50 }, // B in center
      { x: 50, y: 14 }, // C at top
    ],
    traps: [
      { x: 18, y: 50, radiusPct: 14, label: 'Tường Laser Trái' },
      { x: 82, y: 50, radiusPct: 14, label: 'Tường Laser Phải' },
    ],
    quickSnippets: [
      'flex-direction: column-reverse;',
      'justify-content: space-between;',
      'align-items: center;',
      'flex-direction: column;',
    ],
    solutionExample:
      'flex-direction: column-reverse;\njustify-content: space-between;\nalign-items: center;',
    explanation:
      '`flex-direction: column-reverse` xoay trục chính thành dọc từ dưới lên (A dưới → C trên), `space-between` rải đều, `align-items: center` giữ thẳng trục giữa.',
  },
  {
    id: 'heist-3',
    levelIndex: 2,
    title: 'Ma Trận Lưới 2×2 Né Gai Trung Tâm',
    mode: 'grid',
    briefing:
      'Chuyển sang ma trận Grid 2 cột đều nhau (`repeat(2, 1fr)`), căn mọi đặc vụ vào giữa từng ô (`place-items: center`) để né bẫy laser ngay tâm bảng!',
    maxProperties: 3,
    timeLimitSec: 60,
    agents: [
      { id: 'A', label: 'A', colorHex: '#38BDF8' },
      { id: 'B', label: 'B', colorHex: '#34D399' },
      { id: 'C', label: 'C', colorHex: '#FBBF24' },
      { id: 'D', label: 'D', colorHex: '#FB7185' },
    ],
    goalNormalizedPoints: [
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ],
    traps: [{ x: 50, y: 50, radiusPct: 13, label: 'Lõi Laser Tâm' }],
    quickSnippets: [
      'grid-template-columns: repeat(2, 1fr);',
      'place-items: center;',
      'gap: 12px;',
      'grid-template-columns: 1fr 1fr;',
    ],
    solutionExample: 'grid-template-columns: repeat(2, 1fr);\nplace-items: center;',
    explanation:
      '`grid-template-columns: repeat(2, 1fr)` chia ma trận 2×2 cân đối, và `place-items: center` căn giữa hoàn hảo cả 4 đặc vụ vào tâm từng ô, né xa lõi laser giữa bảng.',
  },
];

const ALLOWED_LAYOUT_PROPS = new Set([
  'display',
  'flex-direction',
  'justify-content',
  'align-items',
  'align-content',
  'flex-wrap',
  'gap',
  'row-gap',
  'column-gap',
  'grid-template-columns',
  'grid-template-rows',
  'place-items',
  'place-content',
]);

export interface ParsedLayoutCss {
  readonly styles: Record<string, string>;
  readonly declarationCount: number;
  readonly rejectedProps: string[];
}

export function parseLayoutCssInput(rawCss: string): ParsedLayoutCss {
  const styles: Record<string, string> = {};
  const rejectedProps: string[] = [];
  let declarationCount = 0;

  const lines = rawCss
    .split(/;|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const decl of lines) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx <= 0) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!val) continue;
    declarationCount += 1;

    if (!ALLOWED_LAYOUT_PROPS.has(prop)) {
      rejectedProps.push(prop);
      continue;
    }

    // Convert kebab-case to camelCase for React inline CSSProperties
    const camel = prop.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    styles[camel] = val;
  }

  return { styles, declarationCount, rejectedProps };
}

export function evaluateLayoutCoordinates(
  level: LayoutHeistLevel,
  agentNormalizedPositions: readonly LayoutCoord[],
  declarationCount: number
): { won: boolean; matchedCount: number; hitTrap: string | null; reason: string | null } {
  if (declarationCount === 0) {
    return {
      won: false,
      matchedCount: 0,
      hitTrap: null,
      reason: 'Nhập thuộc tính CSS (ví dụ: justify-content: flex-end;) để di chuyển đội hình.',
    };
  }
  if (declarationCount > level.maxProperties) {
    return {
      won: false,
      matchedCount: 0,
      hitTrap: null,
      reason: `Dùng quá ${level.maxProperties} thuộc tính CSS! Tối ưu lại còn <= ${level.maxProperties} dòng.`,
    };
  }

  for (const agent of agentNormalizedPositions) {
    for (const trap of level.traps) {
      const dist = Math.hypot(agent.x - trap.x, agent.y - trap.y);
      if (dist <= trap.radiusPct) {
        return {
          won: false,
          matchedCount: 0,
          hitTrap: trap.label,
          reason: `Đặc vụ chạm phải ${trap.label}! Đổi căn chỉnh ngay.`,
        };
      }
    }
  }

  let matchedCount = 0;
  for (let i = 0; i < level.goalNormalizedPoints.length; i++) {
    const target = level.goalNormalizedPoints[i];
    const actual = agentNormalizedPositions[i];
    if (!actual) continue;
    const dist = Math.hypot(actual.x - target.x, actual.y - target.y);
    if (dist <= 18) {
      matchedCount += 1;
    }
  }

  const won = matchedCount === level.goalNormalizedPoints.length;
  return {
    won,
    matchedCount,
    hitTrap: null,
    reason: won
      ? null
      : `Đã khớp ${matchedCount}/${level.goalNormalizedPoints.length} vị trí kim cương. Điều chỉnh tiếp!`,
  };
}

// ============================================================================
// STATION 3: EVENT LOOP TRAFFIC (JS ASYNC SCHEDULER)
// ============================================================================
export type EventLoopLane = 'sync' | 'microtask' | 'macrotask';

export interface EventLoopTaskNode {
  readonly id: string;
  readonly label: string;
  readonly lane: EventLoopLane;
  readonly outputToken: string;
  readonly delayLabel: string;
}

export interface EventLoopLevel {
  readonly id: string;
  readonly levelIndex: number;
  readonly title: string;
  readonly briefing: string;
  readonly codeSnippet: readonly string[];
  readonly tasks: readonly EventLoopTaskNode[];
  readonly expectedOutput: readonly string[];
  readonly explanation: string;
}

export const EVENT_LOOP_LEVELS: readonly EventLoopLevel[] = [
  {
    id: 'loop-1',
    levelIndex: 0,
    title: 'Ca 1: Sync vs Promise vs setTimeout',
    briefing:
      'Mở cổng điều phối theo đúng thứ tự JavaScript Event Loop xuất ra console.log! Nhớ: Call Stack (Sync) chạy hết trước → Microtask Queue → Macrotask Queue.',
    codeSnippet: [
      "console.log('A: Sync Start');",
      "setTimeout(() => console.log('B: Timeout 0ms'), 0);",
      "Promise.resolve().then(() => console.log('C: Promise'));",
      "console.log('D: Sync End');",
    ],
    tasks: [
      { id: 't1', label: "console.log('A')", lane: 'sync', outputToken: 'A', delayLabel: 'Call Stack' },
      { id: 't2', label: "setTimeout(B, 0)", lane: 'macrotask', outputToken: 'B', delayLabel: 'Web API 0ms' },
      { id: 't3', label: "Promise.then(C)", lane: 'microtask', outputToken: 'C', delayLabel: 'VIP Queue' },
      { id: 't4', label: "console.log('D')", lane: 'sync', outputToken: 'D', delayLabel: 'Call Stack' },
    ],
    expectedOutput: ['A', 'D', 'C', 'B'],
    explanation:
      'Code đồng bộ `A` và `D` chạy hết trên Call Stack trước. Sau đó Event Loop xả toàn bộ Microtask Queue (`C: Promise`) rồi mới lấy Macrotask (`B: setTimeout`) dù delay là `0ms`!',
  },
  {
    id: 'loop-2',
    levelIndex: 1,
    title: 'Ca 2: Chuỗi Microtask Chen Ngang Fetch',
    briefing:
      'Hai Promise nối tiếp nhau đang chen vào hàng VIP Microtask! Hãy xả toàn bộ Call Stack, dọn sạch Microtask trước khi mở cổng Macrotask.',
    codeSnippet: [
      "console.log('1: Render UI');",
      "setTimeout(() => console.log('2: Analytics'), 0);",
      "Promise.resolve().then(() => console.log('3: Auth Token'));",
      "queueMicrotask(() => console.log('4: Flush Cache'));",
      "console.log('5: Ready');",
    ],
    tasks: [
      { id: 'm1', label: "log('1: UI')", lane: 'sync', outputToken: '1', delayLabel: 'Call Stack' },
      { id: 'm2', label: "setTimeout(2)", lane: 'macrotask', outputToken: '2', delayLabel: 'Macrotask' },
      { id: 'm3', label: "Promise(3)", lane: 'microtask', outputToken: '3', delayLabel: 'Microtask #1' },
      { id: 'm4', label: "queueMicrotask(4)", lane: 'microtask', outputToken: '4', delayLabel: 'Microtask #2' },
      { id: 'm5', label: "log('5: Ready')", lane: 'sync', outputToken: '5', delayLabel: 'Call Stack' },
    ],
    expectedOutput: ['1', '5', '3', '4', '2'],
    explanation:
      'Call Stack chạy `1` và `5` → Microtask Queue phải được rút cạn (`3` rồi `4` theo FIFO) trước khi bất kỳ Macrotask (`2`) nào được phép bước vào Call Stack.',
  },
  {
    id: 'loop-3',
    levelIndex: 2,
    title: 'Ca 3: Đấu Trường Async / Await & 2 Macrotask',
    briefing:
      'Lưu ý: Phần code TRƯỚC `await` chạy đồng bộ ngay lập tức, phần SAU `await` biến thành Microtask! Điều phối chuẩn 6 tác vụ trước khi Main Thread treo.',
    codeSnippet: [
      "console.log('S1');",
      "setTimeout(() => console.log('T1'), 0);",
      "async function go() {",
      "  console.log('S2');",
      "  await null;",
      "  console.log('M1');",
      "}",
      "go();",
      "Promise.resolve().then(() => console.log('M2'));",
      "console.log('S3');",
    ],
    tasks: [
      { id: 'e1', label: "log('S1')", lane: 'sync', outputToken: 'S1', delayLabel: 'Sync' },
      { id: 'e2', label: "setTimeout(T1)", lane: 'macrotask', outputToken: 'T1', delayLabel: 'Macrotask' },
      { id: 'e3', label: "go() -> S2", lane: 'sync', outputToken: 'S2', delayLabel: 'Sync in async' },
      { id: 'e4', label: "after await -> M1", lane: 'microtask', outputToken: 'M1', delayLabel: 'Micro #1' },
      { id: 'e5', label: "Promise -> M2", lane: 'microtask', outputToken: 'M2', delayLabel: 'Micro #2' },
      { id: 'e6', label: "log('S3')", lane: 'sync', outputToken: 'S3', delayLabel: 'Sync End' },
    ],
    expectedOutput: ['S1', 'S2', 'S3', 'M1', 'M2', 'T1'],
    explanation:
      'Bên trong hàm `async`, dòng trước `await` (`S2`) vẫn chạy đồng bộ! Sau `await null`, phần còn lại (`M1`) đẩy vào Microtask trước `M2`, và cuối cùng mới tới `T1`.',
  },
];

export interface EventLoopDispatchCheck {
  readonly accepted: boolean;
  readonly completed: boolean;
  readonly errorReason: string | null;
  readonly nextStepIndex: number;
}

export function evaluateEventLoopDispatch(
  level: EventLoopLevel,
  alreadyDispatchedIds: readonly string[],
  candidateTaskId: string
): EventLoopDispatchCheck {
  const stepIdx = alreadyDispatchedIds.length;
  const candidate = level.tasks.find((t) => t.id === candidateTaskId);
  if (!candidate) {
    return {
      accepted: false,
      completed: false,
      errorReason: 'Tác vụ không tồn tại.',
      nextStepIndex: stepIdx,
    };
  }
  if (alreadyDispatchedIds.includes(candidateTaskId)) {
    return {
      accepted: false,
      completed: false,
      errorReason: 'Tác vụ này đã được xử lý.',
      nextStepIndex: stepIdx,
    };
  }

  const expectedToken = level.expectedOutput[stepIdx];
  if (candidate.outputToken !== expectedToken) {
    const laneRuleHint =
      candidate.lane === 'macrotask'
        ? 'Không thể mở cổng Macrotask khi Call Stack hoặc Microtask Queue vẫn còn việc!'
        : candidate.lane === 'microtask'
          ? 'Microtask chỉ chạy SAU KHI Call Stack đồng bộ đã rỗng hoàn toàn!'
          : `Sai thứ tự đồng bộ! Đáp án bước ${stepIdx + 1} là "${expectedToken}".`;
    return {
      accepted: false,
      completed: false,
      errorReason: laneRuleHint,
      nextStepIndex: stepIdx,
    };
  }

  const nextIdx = stepIdx + 1;
  return {
    accepted: true,
    completed: nextIdx >= level.expectedOutput.length,
    errorReason: null,
    nextStepIndex: nextIdx,
  };
}

// ============================================================================
// STATION 4: DEVTOOLS DETECTIVE (RESPONSIVE & BOX MODEL BUG HUNT)
// ============================================================================
export interface ResponsiveBugPatchOption {
  readonly id: string;
  readonly label: string;
  readonly cssCode: string;
  readonly isCorrect: boolean;
  readonly feedback: string;
}

export interface ResponsiveBugLevel {
  readonly id: string;
  readonly levelIndex: number;
  readonly title: string;
  readonly sceneName: string;
  readonly briefing: string;
  readonly triggerBreakpointMaxPx: number; // e.g., <= 460px triggers bug visibly
  readonly initialWidthPx: number;
  readonly inspectorTargetLabel: string;
  readonly brokenCssSummary: string;
  readonly patchOptions: readonly ResponsiveBugPatchOption[];
  readonly explanation: string;
}

export const RESPONSIVE_BUG_LEVELS: readonly ResponsiveBugLevel[] = [
  {
    id: 'bug-1',
    levelIndex: 0,
    title: 'Vụ Án 1: Nút Đặt Vé Bị Che Khuất Trên Mobile',
    sceneName: 'Trang Đặt Vé Sự Kiện TechConf',
    briefing:
      'Kéo thanh viewport xuống <= 460px (Mobile 375px), bật Kính Lúp Inspect soi vùng nút "Đặt Vé Ngay" đang bị đè chồng lên giá tiền rồi chọn miếng vá CSS chuẩn!',
    triggerBreakpointMaxPx: 460,
    initialWidthPx: 920,
    inspectorTargetLabel: '.checkout-bar { display: flex; flex-wrap: nowrap; }',
    brokenCssSummary: 'width: 240px cố định + nowrap khiến nút Đặt Vé tràn đè thẻ giá trên màn nhỏ',
    patchOptions: [
      {
        id: 'p-wrong-1',
        label: 'overflow: hidden; white-space: nowrap;',
        cssCode: 'overflow: hidden; white-space: nowrap;',
        isCorrect: false,
        feedback: 'Sai! `overflow: hidden` cắt cụt luôn nút Đặt Vé khiến user không bấm mua được.',
      },
      {
        id: 'p-correct-1',
        label: 'flex-wrap: wrap; gap: 12px; width: 100%;',
        cssCode: 'flex-wrap: wrap; gap: 12px;',
        isCorrect: true,
        feedback: 'Chuẩn DevTools! Cho phép `flex-wrap: wrap` giúp nút tự xuống hàng gọn gàng ở 375px.',
      },
      {
        id: 'p-wrong-2',
        label: 'position: absolute; right: -40px;',
        cssCode: 'position: absolute; right: -40px;',
        isCorrect: false,
        feedback: 'Sai! Đẩy nút ra ngoài `-40px` càng gây tràn màn hình ngang.',
      },
    ],
    explanation:
      'Lỗi kinh điển trên mobile: hàng Flex ép `nowrap` kèm khối con rộng cố định. Bật `flex-wrap: wrap` + co giãn linh hoạt giúp bố cục tự thích ứng ở 375px.',
  },
  {
    id: 'bug-2',
    levelIndex: 1,
    title: 'Vụ Án 2: Mã Đơn Hàng Dài Làm Vỡ Khung Giỏ Hàng',
    sceneName: 'Giỏ Hàng Thanh Toán E-Commerce',
    briefing:
      'Thu hẹp khung xuống <= 480px: Chuỗi mã giao dịch dài trong ô Flex làm tràn ngang (scrollWidth > clientWidth). Dùng Inspect tìm lỗi min-width mặc định và vá!',
    triggerBreakpointMaxPx: 480,
    initialWidthPx: 880,
    inspectorTargetLabel: '.order-code-col { flex: 1; /* thiếu min-width: 0 */ }',
    brokenCssSummary: 'Flex item mặc định min-width: auto ngăn chữ dài co lại',
    patchOptions: [
      {
        id: 'p-wrong-2a',
        label: 'display: inline-block; width: 600px;',
        cssCode: 'display: inline-block; width: 600px;',
        isCorrect: false,
        feedback: 'Sai! Đặt cứng `width: 600px` làm trang 375px bị thanh cuộn ngang nặng hơn.',
      },
      {
        id: 'p-correct-2',
        label: 'min-width: 0; overflow-wrap: anywhere;',
        cssCode: 'min-width: 0; overflow-wrap: anywhere;',
        isCorrect: true,
        feedback: 'Chính xác! `min-width: 0` giải phóng flex item kết hợp `overflow-wrap: anywhere` ngắt chuỗi sạch.',
      },
      {
        id: 'p-wrong-2b',
        label: 'float: right; margin-left: 48px;',
        cssCode: 'float: right; margin-left: 48px;',
        isCorrect: false,
        feedback: 'Sai! `float` không khắc phục được tràn chữ của flex item.',
      },
    ],
    explanation:
      'Flex item có `min-width: auto` mặc định nên từ chối co nhỏ hơn nội dung text dài không dấu cách. Thêm `min-width: 0; overflow-wrap: anywhere;` sẽ triệt tiêu lỗi tràn khung.',
  },
  {
    id: 'bug-3',
    levelIndex: 2,
    title: 'Vụ Án 3: Menu Dropdown Chìm Dưới Banner Promo',
    sceneName: 'Khung Chat & Thanh Điều Hướng Sticky',
    briefing:
      'Kiểm tra ở màn hình hẹp hoặc Inspect phần tử `.nav-dropdown`: tại sao menu sổ xuống bị thẻ `.promo-banner` (`transform` / `z-index: 20`) đè mất? Chọn miếng vá chuẩn!',
    triggerBreakpointMaxPx: 760,
    initialWidthPx: 940,
    inspectorTargetLabel: '.nav-dropdown { z-index: 5; } vs .promo-banner { z-index: 20; }',
    brokenCssSummary: 'Stacking context lệch tầng: z-index: 5 < 20 khiến menu bị che khuất',
    patchOptions: [
      {
        id: 'p-wrong-3a',
        label: 'z-index: 9999; /* nhưng giữ display: inline */',
        cssCode: 'display: inline;',
        isCorrect: false,
        feedback: 'Sai! `z-index` không có tác dụng trên phần tử `position: static` hoặc `display: inline` không tạo lớp định vị.',
      },
      {
        id: 'p-wrong-3b',
        label: 'opacity: 0.4; pointer-events: none;',
        cssCode: 'opacity: 0.4;',
        isCorrect: false,
        feedback: 'Sai! Chỉ làm mờ đi chứ không nâng tầng menu lên trên banner.',
      },
      {
        id: 'p-correct-3',
        label: 'position: relative; z-index: 50;',
        cssCode: 'position: relative; z-index: 50;',
        isCorrect: true,
        feedback: 'Chuẩn xác! Tạo positioned stacking layer với `z-index: 50 > 20` giúp menu nổi lên trên hoàn toàn.',
      },
    ],
    explanation:
      '`z-index` chỉ hoạt động với phần tử có `position` khác `static` (hoặc flex/grid child). Đưa thanh chứa dropdown lên `position: relative; z-index: 50;` giải quyết triệt để lỗi bị che.',
  },
];

export function isBugExposedAtWidth(level: ResponsiveBugLevel, widthPx: number): boolean {
  return widthPx <= level.triggerBreakpointMaxPx;
}

// ============================================================================
// STATION 5: COMPONENT TREE DEFENSE (REACT RE-RENDER TOWER DEFENSE)
// ============================================================================
export type TreeDefenseShieldId = 'debounce' | 'split_state' | 'memo_grid' | 'virtual_list';

export interface TreeDefenseShieldOption {
  readonly id: TreeDefenseShieldId;
  readonly name: string;
  readonly plainName: string;
  readonly cost: number;
  readonly targetNodeId: string;
  readonly shortEffect: string;
  readonly beginnerAnalogy: string;
}

export const TREE_DEFENSE_SHIELDS: readonly TreeDefenseShieldOption[] = [
  {
    id: 'debounce',
    name: 'Debounce 300ms',
    plainName: 'Bộ Đệm Đợi Ngừng Gõ (0.3s)',
    cost: 40,
    targetNodeId: 'search_input',
    shortEffect: 'Chặn 75% xung gõ phím dồn dập từ ô Search',
    beginnerAnalogy: 'Thay vì gõ mỗi 1 chữ cái là tìm lại 1 lần, đợi gõ xong từ rồi mới tìm!',
  },
  {
    id: 'split_state',
    name: 'Tách State Cục Bộ',
    plainName: 'Cô Lập Ô Tìm Kiếm',
    cost: 50,
    targetNodeId: 'app_root',
    shortEffect: 'Ngắt sóng re-render lan sang Sidebar & Footer',
    beginnerAnalogy: 'Giữ bộ nhớ riêng trong Ô Tìm Kiếm để Thanh Menu & Chân Trang không bị vẽ lại oan.',
  },
  {
    id: 'memo_grid',
    name: 'React.memo()',
    plainName: 'Đóng Băng Bảng Không Đổi',
    cost: 45,
    targetNodeId: 'post_list',
    shortEffect: 'Không render lại danh sách nếu props không đổi',
    beginnerAnalogy: 'Dữ liệu bảng 500 món chưa đổi thì giữ nguyên ảnh cũ, khỏi vẽ lại tốn CPU!',
  },
  {
    id: 'virtual_list',
    name: 'Virtual List + useMemo',
    plainName: 'Chỉ Vẽ 12 Dòng Nhìn Thấy',
    cost: 55,
    targetNodeId: 'heavy_chart',
    shortEffect: 'Giảm 70% tải CPU khi hiển thị danh sách khổng lồ',
    beginnerAnalogy: 'Màn hình chỉ vừa 12 sản phẩm thì chỉ vẽ 12 ô đó thay vì vẽ cả 500 ô cùng lúc.',
  },
];

export interface TreeDefenseLevelConfig {
  readonly id: string;
  readonly levelIndex: number;
  readonly title: string;
  readonly briefing: string;
  readonly budget: number;
  readonly targetFps: number;
  readonly waveSeconds: number;
  readonly typingIntensity: number;
  readonly takeaway: string;
}

export const TREE_DEFENSE_LEVELS: readonly TreeDefenseLevelConfig[] = [
  {
    id: 'tree-1',
    levelIndex: 0,
    title: 'Màn 1: Ngăn Vạ Lây Toàn Trang',
    briefing:
      'Người dùng chỉ gõ nhẹ vào ô Tìm Kiếm nhưng cả Sidebar lẫn Chân Trang đều chớp đỏ! Với $95 ngân sách, hãy bật lá chắn để giữ tốc độ >= 48 FPS.',
    budget: 95,
    targetFps: 48,
    waveSeconds: 6,
    typingIntensity: 2,
    takeaway:
      'Tách State Cục Bộ hoặc React.memo giúp phần giao diện đứng yên không bị vẽ lại oan khi gõ chữ.',
  },
  {
    id: 'tree-2',
    levelIndex: 1,
    title: 'Màn 2: Bão Gõ Phím Trên Bảng 500 Món',
    briefing:
      'Khách gõ liên hoàn trên danh sách 500 sản phẩm + Biểu đồ nặng! Ngân sách $110 — kết hợp lá chắn để đạt >= 52 FPS trong 8 giây.',
    budget: 110,
    targetFps: 52,
    waveSeconds: 8,
    typingIntensity: 3,
    takeaway:
      'Debounce 300ms cắt giảm lượng xung tìm kiếm dồn dập, kết hợp React.memo hoặc Virtual List giúp bảng lớn vẫn mượt.',
  },
  {
    id: 'tree-3',
    levelIndex: 2,
    title: 'Màn 3: Siêu Bão Production 60 FPS',
    briefing:
      'Thử thách tối đa: Bão tải 10 giây cường độ cao! Với $150 ngân sách, chọn bộ 3 lá chắn tối ưu nhất để giữ vững >= 55 FPS (xanh mượt 60 FPS).',
    budget: 150,
    targetFps: 55,
    waveSeconds: 10,
    typingIntensity: 3,
    takeaway:
      'Tuyệt vời! Kết hợp Tách State Cục Bộ + Debounce 300ms + React.memo chặn đứng mọi re-render thừa và giữ app mượt ở 60 FPS.',
  },
];

export interface TreeNodeSnapshot {
  readonly id: string;
  readonly label: string;
  readonly plainLabel: string;
  readonly baseCostMs: number;
  readonly parentId: string | null;
}

export const COMPONENT_TREE_NODES: readonly TreeNodeSnapshot[] = [
  { id: 'app_root', label: '<AppRoot />', plainLabel: 'Khung Tổng Toàn Trang', baseCostMs: 2.5, parentId: null },
  { id: 'search_input', label: '<SearchHeader />', plainLabel: 'Thanh Ô Tìm Kiếm', baseCostMs: 1.5, parentId: 'app_root' },
  { id: 'sidebar_nav', label: '<SidebarNav />', plainLabel: 'Menu Trái (Không đổi)', baseCostMs: 4.5, parentId: 'app_root' },
  { id: 'post_list', label: '<ProductGrid (500) />', plainLabel: 'Bảng 500 Sản Phẩm', baseCostMs: 9.5, parentId: 'app_root' },
  { id: 'heavy_chart', label: '<HeavyChart />', plainLabel: 'Biểu Đồ Thống Kê Nặng', baseCostMs: 8.5, parentId: 'post_list' },
  { id: 'footer_bar', label: '<StatusFooter />', plainLabel: 'Chân Trang (Không đổi)', baseCostMs: 3.5, parentId: 'app_root' },
];

export interface TreePulseSimulationResult {
  readonly renderedNodeIds: string[];
  readonly totalFrameCostMs: number;
  readonly resultingFps: number;
  readonly cpuHeatDelta: number;
}

export function simulateTreePulse(
  activeShields: readonly TreeDefenseShieldId[],
  typingLoadIntensity: number // 1 (gentle) .. 3 (heavy spam)
): TreePulseSimulationResult {
  const hasDebounce = activeShields.includes('debounce');
  const hasSplitState = activeShields.includes('split_state');
  const hasMemoGrid = activeShields.includes('memo_grid');
  const hasVirtualList = activeShields.includes('virtual_list');

  // If debounced during burst, fewer pulses actually fire; single pulse still propagates cleanly
  const burstMultiplier = hasDebounce ? Math.max(0.45, typingLoadIntensity * 0.4) : typingLoadIntensity;

  const renderedNodeIds: string[] = ['search_input'];
  let frameCostMs = 1.5;

  if (!hasSplitState) {
    renderedNodeIds.push('app_root', 'sidebar_nav', 'footer_bar');
    frameCostMs += 2.5 + 4.5 + 3.5;
  }

  if (!hasMemoGrid) {
    renderedNodeIds.push('post_list', 'heavy_chart');
    const gridCost = hasVirtualList ? 2.6 : 9.5;
    const chartCost = hasVirtualList ? 2.4 : 8.5;
    frameCostMs += gridCost + chartCost;
  } else if (!hasVirtualList && !hasSplitState) {
    // Only light cost check when memoized
    frameCostMs += 1.2;
  }

  const effectiveMs = frameCostMs * burstMultiplier;
  const resultingFps = Math.max(12, Math.min(60, Math.round(1000 / Math.max(16.67, effectiveMs))));
  const cpuHeatDelta = effectiveMs > 16.5 ? Math.min(18, (effectiveMs - 14) * 0.85) : -6;

  return {
    renderedNodeIds,
    totalFrameCostMs: Number(effectiveMs.toFixed(1)),
    resultingFps,
    cpuHeatDelta: Number(cpuHeatDelta.toFixed(1)),
  };
}
