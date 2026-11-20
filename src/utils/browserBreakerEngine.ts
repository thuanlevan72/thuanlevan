export interface BrowserStageSpec {
  id: number;
  code: string;
  title: string;
  domEventTag: string;
  objective: string;
  hint: string;
  baseScore: number;
}

export interface VirusPopupItem {
  id: string;
  title: string;
  body: string;
  xPercent: number;
  yPercent: number;
}

export const VIRUS_POPUP_TEMPLATES: readonly { title: string; body: string }[] = [
  { title: 'CẢNH BÁO CPU!', body: 'Quạt tản nhiệt đang quay ngược chiều kim đồng hồ!' },
  { title: 'TRÚNG THƯỞNG RAM', body: 'Nhấn OK để tải thêm 64 GB RAM miễn phí ngay!' },
  { title: 'LỖI 404 CHUỘT PHẢI', body: 'Con trỏ chuột đang đòi tăng lương 200%.' },
  { title: 'VIRUS CÀ PHÊ.EXE', body: 'Trình duyệt cần 1 ly bạc xỉu để tiếp tục.' },
  { title: 'POP-UP TỰ NHÂN BẢN', body: 'Đóng tôi nhanh trước khi tràn bộ nhớ!' },
  { title: 'CẢNH BÁO FONT CHỮ', body: 'Comic Sans đang âm mưu chiếm quyền DOM.' },
];

export const BROWSER_BREAKER_STAGES: readonly BrowserStageSpec[] = [
  {
    id: 1,
    code: 'DOM-01',
    title: 'Mực Tàng Hình',
    domEventTag: 'selectionchange',
    objective:
      'Một mật mã bị giấu bằng chữ trùng màu nền ngay trong văn bản thông báo. Hãy bôi đen đoạn văn bản đó để làm hiện hình mật mã và nhập vào ô mở khóa!',
    hint: 'Giữ chuột (hoặc nhấn giữ trên điện thoại) quét bôi đen dòng chữ trắng ở vùng trống phía dưới đoạn thông báo.',
    baseScore: 120,
  },
  {
    id: 2,
    code: 'DOM-02',
    title: 'Ép Cửa Sổ Trình Duyệt',
    domEventTag: 'resize · Rect',
    objective:
      'Hai khối nam châm HTML đang nằm cách xa nhau ở hai mép cửa sổ. Hãy thu hẹp chiều rộng cửa sổ trình duyệt (hoặc kéo thanh cạnh phải của khung giả lập) cho tới khi hai khối chạm nhau!',
    hint: 'Kéo viền cửa sổ trình duyệt nhỏ lại (hoặc kéo tay cầm viền phải của hộp sân chơi sang trái) để ép khoảng cách về 0px.',
    baseScore: 150,
  },
  {
    id: 3,
    code: 'DOM-03',
    title: 'Cuộn Chuột Dâng Nước',
    domEventTag: 'scroll',
    objective:
      'Chiếc phao chìa khóa bị kẹt dưới đáy bể DOM. Hãy cuộn thanh cuộn bên phải để dâng mực nước lên chạm vạch cảm biến 92% ở miệng bể!',
    hint: 'Lăn chuột hoặc kéo thanh cuộn dọc xuống sát đáy bể chứa để đẩy mực nước lên đỉnh.',
    baseScore: 140,
  },
  {
    id: 4,
    code: 'DOM-04',
    title: 'Dập Dịch Pop-up Tràn RAM',
    domEventTag: 'DOM spawn · RAM',
    objective:
      'Các cửa sổ pop-up "virus" đang tự nhân bản liên tục và ngốn RAM! Hãy đóng đủ 10 cửa sổ virus trước khi thanh RAM đạt 100%.',
    hint: 'Bấm nhanh nút [× Đóng] trên từng pop-up đỏ. Mỗi pop-up còn mở sẽ tiếp tục tăng mức RAM mỗi giây!',
    baseScore: 200,
  },
  {
    id: 5,
    code: 'DOM-05',
    title: 'Nút Bấm Nhút Nhát',
    domEventTag: 'focus · Tab / Toggle',
    objective:
      'Nút [HOÀN THÀNH] sẽ bỏ chạy mỗi khi bạn đưa chuột lại gần! Hãy phá vỡ cơ chế né chuột bằng cách dùng phím Tab + Enter hoặc tắt thuộc tính né trong DevTools giả lập.',
    hint: 'Cách 1: Nhấn phím Tab tới nút rồi nhấn Enter. Cách 2: Tắt công tắc "Khóa chạy trốn (CSS Transform)" ngay bên dưới.',
    baseScore: 160,
  },
  {
    id: 6,
    code: 'DOM-06',
    title: 'Lớp Kính Mờ Che Khuất',
    domEventTag: 'opacity · readOnly',
    objective:
      'Nút qua màn thật bị kẹt dưới một tấm kính quảng cáo mờ đục (pointer-events block) và ô nhập bị khóa readOnly. Hãy chỉnh thanh Opacity về 0% và gỡ khóa readOnly để bấm nút!',
    hint: 'Kéo thanh "CSS Opacity lớp phủ" về 0% (hoặc gỡ dấu tích readOnly), nhập chữ "PHA VO" rồi bấm mở khóa.',
    baseScore: 170,
  },
  {
    id: 7,
    code: 'DOM-07',
    title: 'Mê Cung Cuộn Hai Chiều',
    domEventTag: 'scrollX · scrollY',
    objective:
      'Trong bản đồ DOM rộng 1200×900px có ẩn một công tắc [ĐIỂM MÙ DOM]. Hãy cuộn cả ngang lẫn dọc để tìm đúng tọa độ nút bị giấu và nhấn vào nó!',
    hint: 'Cuộn xuống khoảng 75% chiều dọc và sang phải khoảng 70% chiều ngang trong vùng bản đồ.',
    baseScore: 180,
  },
  {
    id: 8,
    code: 'DOM-08',
    title: 'Trùm Cuối: Khởi Động Lại DOM',
    domEventTag: 'Multi-Hack Finale',
    objective:
      'Hệ thống trình duyệt đang quá tải! Thực hiện đồng thời 3 bước: (1) Bôi đen tìm mã PIN tàng hình, (2) Giữ RAM dưới 85% bằng cách tắt pop-up virus, (3) Nhập mã PIN & bấm Reboot!',
    hint: 'Tắt nhanh các pop-up để kìm RAM, bôi đen dòng ẩn lấy mã "9999", nhập mã vào ô xác nhận và bấm nút Đỏ!',
    baseScore: 260,
  },
];

export const STAGE1_SECRET_CODE = 'DOM-404';
export const STAGE6_UNLOCK_PHRASE = 'PHA VO';
export const STAGE8_PIN_CODE = '9999';

export function checkInvisibleSelectionMatch(
  selectedText: string,
  expectedToken: string
): boolean {
  const normalized = selectedText.trim().toUpperCase().replace(/\s+/g, ' ');
  return normalized.includes(expectedToken.trim().toUpperCase());
}

export function computeResizeGapPx(
  containerWidthPx: number,
  leftBoxWidth = 104,
  rightBoxWidth = 104,
  horizontalPadding = 32
): number {
  const innerSpan = Math.max(0, containerWidthPx - horizontalPadding);
  return Math.max(0, Math.round(innerSpan - (leftBoxWidth + rightBoxWidth)));
}

export function isResizePuzzleSolved(gapPx: number): boolean {
  return gapPx <= 4;
}

export function computeWaterLevelPercent(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  const ratio = Math.max(0, Math.min(1, scrollTop / maxScroll));
  return Math.round(ratio * 100);
}

export function computeRamTick(
  currentRam: number,
  activePopupCount: number,
  tickSeconds = 1
): number {
  if (activePopupCount <= 0) {
    return Math.max(18, Math.round(currentRam - 6 * tickSeconds));
  }
  const delta = (activePopupCount * 5.2 - 1.5) * tickSeconds;
  return Math.max(10, Math.min(100, Math.round(currentRam + delta)));
}

export function normalizePhraseInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function createVirusPopup(indexSeed: number): VirusPopupItem {
  const tpl = VIRUS_POPUP_TEMPLATES[indexSeed % VIRUS_POPUP_TEMPLATES.length];
  // Spread across safe interior percentage bounds (8%..62% X, 8%..64% Y)
  const xPercent = 8 + ((indexSeed * 23) % 52);
  const yPercent = 8 + ((indexSeed * 19) % 54);
  return {
    id: `virus-${Date.now()}-${indexSeed}-${Math.floor(Math.random() * 1000)}`,
    title: tpl.title,
    body: tpl.body,
    xPercent,
    yPercent,
  };
}
