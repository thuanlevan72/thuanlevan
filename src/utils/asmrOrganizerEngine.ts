export type OrganizerShape =
  | 'onigiri'
  | 'salmon'
  | 'tamago'
  | 'edamame'
  | 'tomato'
  | 'chopsticks'
  | 'book'
  | 'vase'
  | 'candle'
  | 'frame'
  | 'perfume'
  | 'compact'
  | 'lipstick'
  | 'brush'
  | 'serum'
  | 'cleanser'
  | 'sunscreen'
  | 'mist'
  | 'comb'
  | 'cream_jar'
  | 'cotton_box'
  | 'marker'
  | 'eraser'
  | 'washi_tape'
  | 'clip_box'
  | 'matcha_bowl'
  | 'teapot'
  | 'whisk'
  | 'teacup'
  | 'succulent';

export type RotationDeg = 0 | 90 | 180 | 270;

export interface OrganizerSlotDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface OrganizerItemDef {
  id: string;
  name: string;
  shape: OrganizerShape;
  color: string;
  accentColor: string;
  width: number;
  height: number;
  targetSlotId: string;
  acceptableSlotIds?: readonly string[];
  targetRotations: readonly RotationDeg[];
  hintText: string;
}

export interface OrganizerLevelDef {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  ruleTag: string;
  ruleClue: string;
  trayStyle: 'bento' | 'bookshelf' | 'vanity' | 'pouch' | 'stationery' | 'tea';
  trayRect: { x: number; y: number; width: number; height: number };
  shelfLinesY?: readonly number[];
  symmetryAxisX?: number;
  slots: readonly OrganizerSlotDef[];
  items: readonly OrganizerItemDef[];
}

export interface OrganizerItemState {
  id: string;
  x: number;
  y: number;
  rotation: RotationDeg;
  snappedSlotId: string | null;
  isCorrectlyPlaced: boolean;
  zIndex: number;
}

export interface BoardProgressSummary {
  correctCount: number;
  totalCount: number;
  isComplete: boolean;
  progressRatio: number;
  misplacedIds: string[];
}

export interface OrganizerHint {
  itemId: string;
  itemName: string;
  targetSlotId: string;
  suggestedRotation: RotationDeg;
  message: string;
}

export const BOARD_WIDTH = 760;
export const BOARD_HEIGHT = 460;
export const SNAP_RADIUS_PX = 46;

export const ORGANIZER_LEVELS: readonly OrganizerLevelDef[] = [
  {
    id: 1,
    code: 'BENTO-01',
    title: 'Hộp Cơm Bento Nhật Bản',
    subtitle: 'Khớp đúng từng ngăn hộp gỗ và xoay chuẩn hướng món ăn',
    ruleTag: 'Khớp khay & hướng chuẩn',
    ruleClue:
      'Cơm nắm Onigiri đặt dựng đứng (0°) ở ô lớn góc trên trái; cá hồi, trứng cuộn, đậu và cà chua nằm đúng ngăn; đôi đũa đặt ngang giữa khay phải.',
    trayStyle: 'bento',
    trayRect: { x: 200, y: 74, width: 360, height: 312 },
    slots: [
      { id: 'slot-rice', x: 280, y: 152, width: 120, height: 112, label: 'Ngăn cơm' },
      { id: 'slot-salmon', x: 455, y: 138, width: 152, height: 86, label: 'Món chính' },
      { id: 'slot-chopsticks', x: 455, y: 214, width: 152, height: 38, label: 'Rãnh đũa' },
      { id: 'slot-tamago', x: 270, y: 302, width: 102, height: 100, label: 'Ngăn phụ 1' },
      { id: 'slot-edamame', x: 392, y: 302, width: 98, height: 100, label: 'Ngăn phụ 2' },
      { id: 'slot-tomato', x: 502, y: 302, width: 80, height: 100, label: 'Góc nhỏ' },
    ],
    items: [
      {
        id: 'item-onigiri',
        name: 'Cơm nắm Onigiri',
        shape: 'onigiri',
        color: '#FFFDF8',
        accentColor: '#374151',
        width: 90,
        height: 84,
        targetSlotId: 'slot-rice',
        targetRotations: [0],
        hintText: 'Xoay mũi nhọn Onigiri hướng lên trên (0°) vào ngăn cơm trên trái.',
      },
      {
        id: 'item-salmon',
        name: 'Cá hồi nướng Teriyaki',
        shape: 'salmon',
        color: '#F4A28C',
        accentColor: '#E07A5F',
        width: 124,
        height: 62,
        targetSlotId: 'slot-salmon',
        targetRotations: [0, 180],
        hintText: 'Đặt miếng cá hồi nằm ngang vào ngăn trên bên phải.',
      },
      {
        id: 'item-chopsticks',
        name: 'Đôi đũa tre',
        shape: 'chopsticks',
        color: '#DFC19B',
        accentColor: '#A98359',
        width: 132,
        height: 24,
        targetSlotId: 'slot-chopsticks',
        targetRotations: [0, 180],
        hintText: 'Xoay đôi đũa nằm ngang vào rãnh hẹp bên dưới cá hồi.',
      },
      {
        id: 'item-tamago',
        name: 'Trứng cuộn Tamago',
        shape: 'tamago',
        color: '#F6DC8C',
        accentColor: '#DDA84F',
        width: 78,
        height: 70,
        targetSlotId: 'slot-tamago',
        targetRotations: [0, 180],
        hintText: 'Xếp trứng cuộn vào ngăn dưới bên trái.',
      },
      {
        id: 'item-edamame',
        name: 'Đậu Edamame',
        shape: 'edamame',
        color: '#B8D8BA',
        accentColor: '#6D9F71',
        width: 76,
        height: 62,
        targetSlotId: 'slot-edamame',
        targetRotations: [0, 180],
        hintText: 'Đặt đậu Edamame vào ngăn giữa hàng dưới.',
      },
      {
        id: 'item-tomato',
        name: 'Cà chua bi',
        shape: 'tomato',
        color: '#F1948A',
        accentColor: '#76A678',
        width: 58,
        height: 58,
        targetSlotId: 'slot-tomato',
        targetRotations: [0, 90, 180, 270],
        hintText: 'Cho quả cà chua bi vào góc tròn nhỏ dưới phải.',
      },
    ],
  },
  {
    id: 2,
    code: 'SHELF-02',
    title: 'Giá Sách & Tượng Gốm',
    subtitle: 'Xếp bậc thang chiều cao từ thấp đến cao theo dải màu pastel',
    ruleTag: 'Chiều cao tăng dần + Pastel',
    ruleClue:
      'Tầng trên: xếp 6 cuốn sách thẳng đứng (0°) tăng dần chiều cao từ trái sang phải (Xô thơm → Bạc hà → Mây xanh → Oải hương → Hoa đào → Cam đào). Tầng dưới: xếp nến, bình gốm và khung ảnh dựng đứng.',
    trayStyle: 'bookshelf',
    trayRect: { x: 185, y: 60, width: 390, height: 340 },
    shelfLinesY: [248, 376],
    slots: [
      { id: 'slot-b1', x: 242, y: 204, width: 44, height: 88, label: 'Thấp 1' },
      { id: 'slot-b2', x: 296, y: 196, width: 44, height: 104, label: 'Bậc 2' },
      { id: 'slot-b3', x: 350, y: 188, width: 44, height: 120, label: 'Bậc 3' },
      { id: 'slot-b4', x: 404, y: 180, width: 44, height: 136, label: 'Bậc 4' },
      { id: 'slot-b5', x: 458, y: 172, width: 44, height: 152, label: 'Bậc 5' },
      { id: 'slot-b6', x: 512, y: 164, width: 44, height: 168, label: 'Cao 6' },
      { id: 'slot-candle', x: 268, y: 338, width: 64, height: 74, label: 'Nến thơm' },
      { id: 'slot-vase', x: 380, y: 328, width: 72, height: 94, label: 'Bình gốm' },
      { id: 'slot-frame', x: 492, y: 334, width: 74, height: 82, label: 'Khung ảnh' },
    ],
    items: [
      {
        id: 'book-1',
        name: 'Sách Xô Thơm (S)',
        shape: 'book',
        color: '#B5D1C0',
        accentColor: '#7FA38E',
        width: 34,
        height: 82,
        targetSlotId: 'slot-b1',
        targetRotations: [0],
        hintText: 'Cuốn thấp nhất màu xanh xô thơm đứng ở vị trí đầu bên trái.',
      },
      {
        id: 'book-2',
        name: 'Sách Bạc Hà (S+)',
        shape: 'book',
        color: '#BCE3D6',
        accentColor: '#76B09E',
        width: 34,
        height: 98,
        targetSlotId: 'slot-b2',
        targetRotations: [0],
        hintText: 'Xếp sách Bạc Hà đứng thẳng (0°) ngay sau cuốn thấp nhất.',
      },
      {
        id: 'book-3',
        name: 'Sách Mây Xanh (M)',
        shape: 'book',
        color: '#B5D4EA',
        accentColor: '#6C9EC4',
        width: 34,
        height: 114,
        targetSlotId: 'slot-b3',
        targetRotations: [0],
        hintText: 'Xếp sách Mây Xanh đứng bậc thứ 3 trên kệ.',
      },
      {
        id: 'book-4',
        name: 'Sách Oải Hương (M+)',
        shape: 'book',
        color: '#CDC2E8',
        accentColor: '#8E7DBB',
        width: 34,
        height: 130,
        targetSlotId: 'slot-b4',
        targetRotations: [0],
        hintText: 'Xếp sách Oải Hương đứng bậc thứ 4.',
      },
      {
        id: 'book-5',
        name: 'Sách Hoa Đào (L)',
        shape: 'book',
        color: '#EDC2CC',
        accentColor: '#C47F91',
        width: 34,
        height: 146,
        targetSlotId: 'slot-b5',
        targetRotations: [0],
        hintText: 'Xếp sách Hoa Đào đứng bậc thứ 5.',
      },
      {
        id: 'book-6',
        name: 'Sách Cam Đào (XL)',
        shape: 'book',
        color: '#F5CBB1',
        accentColor: '#C98A65',
        width: 34,
        height: 162,
        targetSlotId: 'slot-b6',
        targetRotations: [0],
        hintText: 'Cuốn cao nhất màu Cam Đào đặt ở mép phải tầng trên.',
      },
      {
        id: 'decor-candle',
        name: 'Nến thơm đậu nành',
        shape: 'candle',
        color: '#F7E7CE',
        accentColor: '#D6A15C',
        width: 50,
        height: 64,
        targetSlotId: 'slot-candle',
        targetRotations: [0],
        hintText: 'Đặt lọ nến thơm dựng đứng ở tầng dưới bên trái.',
      },
      {
        id: 'decor-vase',
        name: 'Bình gốm tối giản',
        shape: 'vase',
        color: '#E9DDD0',
        accentColor: '#B89F87',
        width: 56,
        height: 84,
        targetSlotId: 'slot-vase',
        targetRotations: [0],
        hintText: 'Đặt bình gốm dựng đứng ở giữa tầng dưới.',
      },
      {
        id: 'decor-frame',
        name: 'Khung ảnh lưu niệm',
        shape: 'frame',
        color: '#E6D3B3',
        accentColor: '#9FB8AD',
        width: 62,
        height: 72,
        targetSlotId: 'slot-frame',
        targetRotations: [0],
        hintText: 'Dựng khung ảnh ở góc dưới bên phải.',
      },
    ],
  },
  {
    id: 3,
    code: 'VANITY-03',
    title: 'Bàn Trang Điểm Mây Sứ',
    subtitle: 'Cân bằng đối xứng gương qua trục trung tâm của khay',
    ruleTag: 'Đối xứng trục giữa',
    ruleClue:
      'Chai nước hoa và hộp phấn nằm ngay trục giữa. Hai cọ má hồng, hai lọ serum và hai thỏi son đặt đối xứng nhau sang hai bên (0° dựng thẳng).',
    trayStyle: 'vanity',
    trayRect: { x: 185, y: 65, width: 390, height: 330 },
    symmetryAxisX: 380,
    slots: [
      { id: 'slot-perfume', x: 380, y: 158, width: 84, height: 108, label: 'Trục giữa' },
      { id: 'slot-compact', x: 380, y: 302, width: 92, height: 92, label: 'Phấn nén' },
      { id: 'slot-serum-l', x: 302, y: 170, width: 52, height: 96, label: 'Serum trái' },
      { id: 'slot-serum-r', x: 458, y: 170, width: 52, height: 96, label: 'Serum phải' },
      { id: 'slot-brush-l', x: 232, y: 170, width: 46, height: 126, label: 'Cọ trái' },
      { id: 'slot-brush-r', x: 528, y: 170, width: 46, height: 126, label: 'Cọ phải' },
      { id: 'slot-lip-l', x: 278, y: 302, width: 48, height: 92, label: 'Son trái' },
      { id: 'slot-lip-r', x: 482, y: 302, width: 48, height: 92, label: 'Son phải' },
    ],
    items: [
      {
        id: 'vanity-perfume',
        name: 'Nước hoa hoa hồng',
        shape: 'perfume',
        color: '#F3D0D7',
        accentColor: '#C59B6D',
        width: 70,
        height: 94,
        targetSlotId: 'slot-perfume',
        targetRotations: [0],
        hintText: 'Đặt chai nước hoa dựng đứng ngay tâm trục giữa phía trên.',
      },
      {
        id: 'vanity-compact',
        name: 'Hộp phấn Cushion',
        shape: 'compact',
        color: '#F7E9DF',
        accentColor: '#D6A7A1',
        width: 78,
        height: 78,
        targetSlotId: 'slot-compact',
        targetRotations: [0],
        hintText: 'Đặt hộp phấn tròn ngay tâm phía dưới chai nước hoa.',
      },
      {
        id: 'vanity-serum-1',
        name: 'Lọ Serum B5 (Cặp)',
        shape: 'serum',
        color: '#CDE4EC',
        accentColor: '#7AA6B8',
        width: 40,
        height: 84,
        targetSlotId: 'slot-serum-l',
        acceptableSlotIds: ['slot-serum-l', 'slot-serum-r'],
        targetRotations: [0],
        hintText: 'Đặt thẳng đứng cạnh chai nước hoa ở một bên trục đối xứng.',
      },
      {
        id: 'vanity-serum-2',
        name: 'Lọ Serum B5 (Cặp)',
        shape: 'serum',
        color: '#CDE4EC',
        accentColor: '#7AA6B8',
        width: 40,
        height: 84,
        targetSlotId: 'slot-serum-r',
        acceptableSlotIds: ['slot-serum-l', 'slot-serum-r'],
        targetRotations: [0],
        hintText: 'Đặt lọ Serum còn lại đối xứng sang phía bên kia.',
      },
      {
        id: 'vanity-brush-1',
        name: 'Cọ tán phấn (Cặp)',
        shape: 'brush',
        color: '#E9C5CE',
        accentColor: '#B58492',
        width: 34,
        height: 112,
        targetSlotId: 'slot-brush-l',
        acceptableSlotIds: ['slot-brush-l', 'slot-brush-r'],
        targetRotations: [0],
        hintText: 'Dựng cọ ở rìa ngoài khay trang điểm.',
      },
      {
        id: 'vanity-brush-2',
        name: 'Cọ tán phấn (Cặp)',
        shape: 'brush',
        color: '#E9C5CE',
        accentColor: '#B58492',
        width: 34,
        height: 112,
        targetSlotId: 'slot-brush-r',
        acceptableSlotIds: ['slot-brush-l', 'slot-brush-r'],
        targetRotations: [0],
        hintText: 'Dựng chiếc cọ thứ 2 đối xứng ở mép khay còn lại.',
      },
      {
        id: 'vanity-lip-1',
        name: 'Son lì san hô (Cặp)',
        shape: 'lipstick',
        color: '#E8A5AE',
        accentColor: '#C59B6D',
        width: 32,
        height: 78,
        targetSlotId: 'slot-lip-l',
        acceptableSlotIds: ['slot-lip-l', 'slot-lip-r'],
        targetRotations: [0],
        hintText: 'Xếp son thẳng đứng cạnh hộp phấn phía dưới.',
      },
      {
        id: 'vanity-lip-2',
        name: 'Son lì san hô (Cặp)',
        shape: 'lipstick',
        color: '#E8A5AE',
        accentColor: '#C59B6D',
        width: 32,
        height: 78,
        targetSlotId: 'slot-lip-r',
        acceptableSlotIds: ['slot-lip-l', 'slot-lip-r'],
        targetRotations: [0],
        hintText: 'Xếp thỏi son thứ 2 đối xứng sang bên còn lại hộp phấn.',
      },
    ],
  },
  {
    id: 4,
    code: 'POUCH-04',
    title: 'Túi Mỹ Phẩm Du Lịch',
    subtitle: 'Xếp gọn mọi chai lọ vừa khít từng khoang túi chần bông',
    ruleTag: 'Đóng gói khớp khoang túi',
    ruleClue:
      'Ba chai đứng (Sữa rửa mặt → Chống nắng → Xịt khoáng) xếp thẳng đứng ở khoang trên trái; lược gập nằm ngang ở khoang dưới; hũ kem và hộp bông xếp gọn khoang phải.',
    trayStyle: 'pouch',
    trayRect: { x: 192, y: 72, width: 376, height: 316 },
    slots: [
      { id: 'slot-cleanser', x: 252, y: 162, width: 72, height: 136, label: 'Chai lớn' },
      { id: 'slot-sunscreen', x: 334, y: 168, width: 64, height: 122, label: 'Tuýp vừa' },
      { id: 'slot-mist', x: 410, y: 162, width: 64, height: 136, label: 'Chai xịt' },
      { id: 'slot-cream', x: 500, y: 142, width: 76, height: 76, label: 'Ô vuông' },
      { id: 'slot-cotton', x: 500, y: 274, width: 82, height: 112, label: 'Hộp bông' },
      { id: 'slot-comb', x: 332, y: 318, width: 196, height: 54, label: 'Khoang ngang' },
    ],
    items: [
      {
        id: 'pouch-cleanser',
        name: 'Sữa rửa mặt dịu nhẹ',
        shape: 'cleanser',
        color: '#CFE4DF',
        accentColor: '#73A296',
        width: 58,
        height: 122,
        targetSlotId: 'slot-cleanser',
        targetRotations: [0],
        hintText: 'Đựng thẳng chai sữa rửa mặt vào khoang cao bên trái.',
      },
      {
        id: 'pouch-sunscreen',
        name: 'Kem chống nắng',
        shape: 'sunscreen',
        color: '#F8E3B4',
        accentColor: '#D69F4E',
        width: 50,
        height: 108,
        targetSlotId: 'slot-sunscreen',
        targetRotations: [0],
        hintText: 'Đặt tuýp chống nắng dựng đứng vào ô thứ hai.',
      },
      {
        id: 'pouch-mist',
        name: 'Xịt khoáng hoa cúc',
        shape: 'mist',
        color: '#C7DCF0',
        accentColor: '#6997BE',
        width: 50,
        height: 122,
        targetSlotId: 'slot-mist',
        targetRotations: [0],
        hintText: 'Đặt chai xịt khoáng dựng đứng vào khoang thứ ba.',
      },
      {
        id: 'pouch-cream',
        name: 'Hũ kem dưỡng ẩm',
        shape: 'cream_jar',
        color: '#F2D3DA',
        accentColor: '#C98A99',
        width: 62,
        height: 62,
        targetSlotId: 'slot-cream',
        targetRotations: [0, 90, 180, 270],
        hintText: 'Xếp hũ kem tròn vào góc vuông trên bên phải.',
      },
      {
        id: 'pouch-cotton',
        name: 'Hộp bông tẩy trang',
        shape: 'cotton_box',
        color: '#EFEAE3',
        accentColor: '#B5A898',
        width: 68,
        height: 98,
        targetSlotId: 'slot-cotton',
        targetRotations: [0, 180],
        hintText: 'Đặt hộp bông tẩy trang vào khoang đứng góc dưới phải.',
      },
      {
        id: 'pouch-comb',
        name: 'Lược chải gập gọn',
        shape: 'comb',
        color: '#E6D4BC',
        accentColor: '#AC8C64',
        width: 174,
        height: 40,
        targetSlotId: 'slot-comb',
        targetRotations: [0, 180],
        hintText: 'Xoay lược nằm ngang vào khoang dài phía dưới cùng.',
      },
    ],
  },
  {
    id: 5,
    code: 'DESK-05',
    title: 'Hộp Bút Sắc Màu Pastel',
    subtitle: 'Sắp xếp 7 cây bút theo dải chuyển sắc cầu vồng ấm sang lạnh',
    ruleTag: 'Dải màu Cầu Vồng Pastel',
    ruleClue:
      'Hàng dưới: xếp 7 cây bút cùng hướng đầu ngòi lên trên (0°), chuyển màu mượt từ Hồng San Hô → Cam Mơ → Vàng Bơ → Bạc Hà → Xanh Trời → Tím Lam → Tím Oải Hương. Hàng trên: xếp tẩy, cuộn washi và hộp kẹp giấy.',
    trayStyle: 'stationery',
    trayRect: { x: 185, y: 68, width: 390, height: 324 },
    shelfLinesY: [176],
    slots: [
      { id: 'slot-eraser', x: 262, y: 120, width: 88, height: 50, label: 'Tẩy' },
      { id: 'slot-washi', x: 380, y: 120, width: 66, height: 66, label: 'Washi' },
      { id: 'slot-clips', x: 496, y: 120, width: 88, height: 54, label: 'Kẹp giấy' },
      { id: 'slot-m1', x: 230, y: 280, width: 42, height: 152, label: '1' },
      { id: 'slot-m2', x: 280, y: 280, width: 42, height: 152, label: '2' },
      { id: 'slot-m3', x: 330, y: 280, width: 42, height: 152, label: '3' },
      { id: 'slot-m4', x: 380, y: 280, width: 42, height: 152, label: '4' },
      { id: 'slot-m5', x: 430, y: 280, width: 42, height: 152, label: '5' },
      { id: 'slot-m6', x: 480, y: 280, width: 42, height: 152, label: '6' },
      { id: 'slot-m7', x: 530, y: 280, width: 42, height: 152, label: '7' },
    ],
    items: [
      {
        id: 'st-eraser',
        name: 'Tẩy gôm Pastel',
        shape: 'eraser',
        color: '#F4C6CD',
        accentColor: '#F9F4EE',
        width: 74,
        height: 38,
        targetSlotId: 'slot-eraser',
        targetRotations: [0, 180],
        hintText: 'Đặt cục tẩy nằm ngang ở khay nhỏ trên bên trái.',
      },
      {
        id: 'st-washi',
        name: 'Cuộn băng Washi',
        shape: 'washi_tape',
        color: '#D5E8D4',
        accentColor: '#8FB996',
        width: 56,
        height: 56,
        targetSlotId: 'slot-washi',
        targetRotations: [0, 90, 180, 270],
        hintText: 'Đặt cuộn Washi vào ô tròn chính giữa hàng trên.',
      },
      {
        id: 'st-clips',
        name: 'Hộp kẹp giấy',
        shape: 'clip_box',
        color: '#DAE8FC',
        accentColor: '#7B9FD3',
        width: 74,
        height: 44,
        targetSlotId: 'slot-clips',
        targetRotations: [0, 180],
        hintText: 'Đặt hộp kẹp giấy nằm ngang ở khay nhỏ trên bên phải.',
      },
      {
        id: 'marker-1',
        name: 'Bút San Hô (1)',
        shape: 'marker',
        color: '#F2A3A8',
        accentColor: '#D4747B',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m1',
        targetRotations: [0],
        hintText: 'Màu nóng nhất (San hô) ở rãnh số 1 bên trái, đầu bút hướng lên.',
      },
      {
        id: 'marker-2',
        name: 'Bút Cam Mơ (2)',
        shape: 'marker',
        color: '#F5C29B',
        accentColor: '#D99361',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m2',
        targetRotations: [0],
        hintText: 'Bút Cam Mơ ở vị trí số 2 kế bên San hô.',
      },
      {
        id: 'marker-3',
        name: 'Bút Vàng Bơ (3)',
        shape: 'marker',
        color: '#F3DF99',
        accentColor: '#D1B45B',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m3',
        targetRotations: [0],
        hintText: 'Bút Vàng Bơ ở vị trí số 3.',
      },
      {
        id: 'marker-4',
        name: 'Bút Bạc Hà (4)',
        shape: 'marker',
        color: '#B8DEC8',
        accentColor: '#6EA887',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m4',
        targetRotations: [0],
        hintText: 'Bút Bạc Hà nằm đúng giữa (vị trí số 4).',
      },
      {
        id: 'marker-5',
        name: 'Bút Xanh Trời (5)',
        shape: 'marker',
        color: '#B1D6EA',
        accentColor: '#639BB9',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m5',
        targetRotations: [0],
        hintText: 'Bút Xanh Trời ở vị trí số 5.',
      },
      {
        id: 'marker-6',
        name: 'Bút Tím Lam (6)',
        shape: 'marker',
        color: '#BEC5EB',
        accentColor: '#7680BA',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m6',
        targetRotations: [0],
        hintText: 'Bút Tím Lam ở vị trí số 6.',
      },
      {
        id: 'marker-7',
        name: 'Bút Oải Hương (7)',
        shape: 'marker',
        color: '#D5BFE8',
        accentColor: '#9879B5',
        width: 30,
        height: 136,
        targetSlotId: 'slot-m7',
        targetRotations: [0],
        hintText: 'Bút Oải Hương ở rãnh cuối cùng bên phải (số 7).',
      },
    ],
  },
  {
    id: 6,
    code: 'MATCHA-06',
    title: 'Góc Bàn Trà Matcha',
    subtitle: 'Sắp đặt khay trà đạo Zen cân bằng giữa âm thanh và tĩnh tại',
    ruleTag: 'Trà đạo & Cân bằng Zen',
    ruleClue:
      'Bát Matcha đặt ngay trung tâm khay tre; ấm trà hướng đúng chiều bên trái; chổi đánh trà Chasen dựng thẳng (0°) bên phải; hai chén trà đối xứng hai bên chậu sen đá phía trước.',
    trayStyle: 'tea',
    trayRect: { x: 185, y: 65, width: 390, height: 330 },
    symmetryAxisX: 380,
    slots: [
      { id: 'slot-teapot', x: 266, y: 172, width: 96, height: 88, label: 'Ấm trà' },
      { id: 'slot-bowl', x: 380, y: 176, width: 108, height: 108, label: 'Bát Matcha' },
      { id: 'slot-whisk', x: 492, y: 172, width: 64, height: 108, label: 'Chổi tre' },
      { id: 'slot-cup-l', x: 282, y: 316, width: 68, height: 68, label: 'Chén trái' },
      { id: 'slot-succulent', x: 380, y: 316, width: 76, height: 80, label: 'Sen đá' },
      { id: 'slot-cup-r', x: 478, y: 316, width: 68, height: 68, label: 'Chén phải' },
    ],
    items: [
      {
        id: 'tea-teapot',
        name: 'Ấm trà đất nung',
        shape: 'teapot',
        color: '#D9B89C',
        accentColor: '#9C7252',
        width: 82,
        height: 72,
        targetSlotId: 'slot-teapot',
        targetRotations: [0],
        hintText: 'Đặt ấm trà dựng đúng chiều (0°) ở ô trên bên trái.',
      },
      {
        id: 'tea-bowl',
        name: 'Bát gốm Chawan',
        shape: 'matcha_bowl',
        color: '#EFECE6',
        accentColor: '#8FB784',
        width: 92,
        height: 92,
        targetSlotId: 'slot-bowl',
        targetRotations: [0],
        hintText: 'Đặt bát trà Matcha ngay vị trí trung tâm phía trên.',
      },
      {
        id: 'tea-whisk',
        name: 'Chổi tre Chasen',
        shape: 'whisk',
        color: '#E5CFA4',
        accentColor: '#B59258',
        width: 48,
        height: 92,
        targetSlotId: 'slot-whisk',
        targetRotations: [0],
        hintText: 'Dựng thẳng chổi tre Chasen (0°) ở ô trên bên phải.',
      },
      {
        id: 'tea-cup-1',
        name: 'Chén trà sứ (Cặp)',
        shape: 'teacup',
        color: '#DDE8DE',
        accentColor: '#8BA88E',
        width: 54,
        height: 54,
        targetSlotId: 'slot-cup-l',
        acceptableSlotIds: ['slot-cup-l', 'slot-cup-r'],
        targetRotations: [0],
        hintText: 'Đặt chén trà vào một trong hai ô đế lót ở hàng dưới.',
      },
      {
        id: 'tea-cup-2',
        name: 'Chén trà sứ (Cặp)',
        shape: 'teacup',
        color: '#DDE8DE',
        accentColor: '#8BA88E',
        width: 54,
        height: 54,
        targetSlotId: 'slot-cup-r',
        acceptableSlotIds: ['slot-cup-l', 'slot-cup-r'],
        targetRotations: [0],
        hintText: 'Đặt chén trà còn lại đối xứng sang phía bên kia.',
      },
      {
        id: 'tea-succulent',
        name: 'Chậu sen đá mini',
        shape: 'succulent',
        color: '#A5C9A8',
        accentColor: '#DFB69D',
        width: 62,
        height: 68,
        targetSlotId: 'slot-succulent',
        targetRotations: [0],
        hintText: 'Đặt chậu sen đá dựng đứng ở giữa hai chén trà.',
      },
    ],
  },
];

export function nextRotation(rot: RotationDeg, delta: 1 | -1 = 1): RotationDeg {
  const dirs: readonly RotationDeg[] = [0, 90, 180, 270];
  const idx = dirs.indexOf(rot);
  const nextIdx = (idx + delta + dirs.length) % dirs.length;
  return dirs[nextIdx];
}

export function isItemPlacementCorrect(
  def: OrganizerItemDef,
  slotId: string | null,
  rotation: RotationDeg
): boolean {
  if (!slotId) return false;
  const validSlots = def.acceptableSlotIds ?? [def.targetSlotId];
  return validSlots.includes(slotId) && def.targetRotations.includes(rotation);
}

function seededNoise(seed: number): () => number {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function scrambleLevelItems(
  level: OrganizerLevelDef,
  seed: number = level.id * 1337 + 42
): OrganizerItemState[] {
  const rng = seededNoise(seed);
  const items = level.items;
  const half = Math.ceil(items.length / 2);

  return items.map((item, idx) => {
    const onLeft = idx < half;
    const laneIdx = onLeft ? idx : idx - half;
    const laneTotal = onLeft ? half : items.length - half;

    // Split each side into 2 staggered columns (outer & inner) when > 3 items so tall markers never stack
    const useTwoCols = laneTotal > 3;
    const col = useTwoCols ? laneIdx % 2 : 0;
    const row = useTwoCols ? Math.floor(laneIdx / 2) : laneIdx;
    const rowsInCol = useTwoCols
      ? Math.ceil((laneTotal - col) / 2)
      : laneTotal;

    const baseLeftX = useTwoCols ? (col === 0 ? 70 : 126) : 88;
    const baseRightX = useTwoCols
      ? col === 0
        ? BOARD_WIDTH - 70
        : BOARD_WIDTH - 126
      : BOARD_WIDTH - 88;

    const usableH = BOARD_HEIGHT - 110;
    const stepY = usableH / Math.max(1, rowsInCol);
    const baseY = 64 + stepY * (row + 0.5);

    // Pick a non-trivial rotation when the item has a preferred single orientation
    const rotations: readonly RotationDeg[] = [0, 90, 180, 270];
    let rotation: RotationDeg = rotations[Math.floor(rng() * 4)];
    if (item.targetRotations.length < 4 && rotation === 0) {
      rotation = rotations[1 + Math.floor(rng() * 3)];
    }

    const activeHalfW = (rotation === 90 || rotation === 270 ? item.height : item.width) / 2;
    const activeHalfH = (rotation === 90 || rotation === 270 ? item.width : item.height) / 2;
    const minX = Math.max(46, Math.ceil(activeHalfW) + 8);
    const maxX = Math.min(144, 180 - Math.ceil(activeHalfW));
    const rawX = (onLeft ? baseLeftX : baseRightX) + (rng() - 0.5) * 12;
    const x = onLeft
      ? Math.round(Math.max(minX, Math.min(Math.max(minX, maxX), rawX)))
      : Math.round(Math.min(BOARD_WIDTH - minX, Math.max(BOARD_WIDTH - Math.max(minX, maxX), rawX)));
    const minY = Math.max(54, Math.ceil(activeHalfH) + 8);
    const y = Math.round(Math.max(minY, Math.min(BOARD_HEIGHT - minY, baseY + (rng() - 0.5) * 10)));

    return {
      id: item.id,
      x,
      y,
      rotation,
      snappedSlotId: null,
      isCorrectlyPlaced: false,
      zIndex: idx + 1,
    };
  });
}

export interface SnapResolution {
  x: number;
  y: number;
  snappedSlotId: string | null;
  isCorrect: boolean;
  snapKind: 'free' | 'soft-slot' | 'perfect-ocd';
}

export function resolveItemDrop(
  level: OrganizerLevelDef,
  itemId: string,
  dropX: number,
  dropY: number,
  rotation: RotationDeg,
  allItems: readonly OrganizerItemState[]
): SnapResolution {
  const def = level.items.find((i) => i.id === itemId);
  if (!def) {
    return { x: dropX, y: dropY, snappedSlotId: null, isCorrect: false, snapKind: 'free' };
  }

  const clampedX = Math.max(36, Math.min(BOARD_WIDTH - 36, Math.round(dropX)));
  const clampedY = Math.max(36, Math.min(BOARD_HEIGHT - 36, Math.round(dropY)));

  const occupiedByOther = new Set(
    allItems.filter((i) => i.id !== itemId && i.snappedSlotId !== null).map((i) => i.snappedSlotId!)
  );

  let bestSlot: OrganizerSlotDef | null = null;
  let bestDist = SNAP_RADIUS_PX;

  for (const slot of level.slots) {
    if (occupiedByOther.has(slot.id)) continue;
    const dist = Math.hypot(clampedX - slot.x, clampedY - slot.y);
    if (dist <= bestDist) {
      bestDist = dist;
      bestSlot = slot;
    }
  }

  if (!bestSlot) {
    return {
      x: clampedX,
      y: clampedY,
      snappedSlotId: null,
      isCorrect: false,
      snapKind: 'free',
    };
  }

  const perfect = isItemPlacementCorrect(def, bestSlot.id, rotation);
  return {
    x: bestSlot.x,
    y: bestSlot.y,
    snappedSlotId: bestSlot.id,
    isCorrect: perfect,
    snapKind: perfect ? 'perfect-ocd' : 'soft-slot',
  };
}

export function evaluateBoardProgress(
  level: OrganizerLevelDef,
  items: readonly OrganizerItemState[]
): BoardProgressSummary {
  const misplacedIds: string[] = [];
  let correctCount = 0;

  for (const def of level.items) {
    const state = items.find((i) => i.id === def.id);
    if (state && isItemPlacementCorrect(def, state.snappedSlotId, state.rotation)) {
      correctCount += 1;
    } else {
      misplacedIds.push(def.id);
    }
  }

  const totalCount = level.items.length;
  return {
    correctCount,
    totalCount,
    isComplete: totalCount > 0 && correctCount === totalCount,
    progressRatio: totalCount > 0 ? correctCount / totalCount : 0,
    misplacedIds,
  };
}

export function getSmartHint(
  level: OrganizerLevelDef,
  items: readonly OrganizerItemState[]
): OrganizerHint | null {
  const occupiedCorrectly = new Set(
    items
      .filter((st) => {
        const def = level.items.find((d) => d.id === st.id);
        return def && isItemPlacementCorrect(def, st.snappedSlotId, st.rotation);
      })
      .map((st) => st.snappedSlotId!)
  );

  for (const def of level.items) {
    const state = items.find((i) => i.id === def.id);
    if (!state || !isItemPlacementCorrect(def, state.snappedSlotId, state.rotation)) {
      const candidates = def.acceptableSlotIds ?? [def.targetSlotId];
      const availableTarget =
        candidates.find((slotId) => !occupiedCorrectly.has(slotId)) ?? def.targetSlotId;
      return {
        itemId: def.id,
        itemName: def.name,
        targetSlotId: availableTarget,
        suggestedRotation: def.targetRotations[0],
        message: `${def.name}: ${def.hintText}`,
      };
    }
  }
  return null;
}

export function findOpenTargetSlotForItem(
  level: OrganizerLevelDef,
  def: OrganizerItemDef,
  allItems: readonly OrganizerItemState[]
): OrganizerSlotDef | null {
  const occupied = new Set(
    allItems.filter((i) => i.id !== def.id && i.snappedSlotId !== null).map((i) => i.snappedSlotId!)
  );
  const candidates = def.acceptableSlotIds ?? [def.targetSlotId];
  for (const slotId of candidates) {
    if (!occupied.has(slotId)) {
      const found = level.slots.find((s) => s.id === slotId);
      if (found) return found;
    }
  }
  return level.slots.find((s) => s.id === def.targetSlotId) ?? null;
}
