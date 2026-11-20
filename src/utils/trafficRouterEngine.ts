export type PacketKind = 'read' | 'write' | 'media' | 'ddos' | 'sqli';

export type InfraNodeType =
  | 'ingress'
  | 'waf'
  | 'rate_limiter'
  | 'cdn'
  | 'load_balancer'
  | 'redis'
  | 'app'
  | 'queue'
  | 'worker'
  | 'read_replica'
  | 'object_storage'
  | 'database';

export type PlaceableNodeType = Exclude<InfraNodeType, 'ingress' | 'database'>;

export interface InfraNodeCatalogEntry {
  type: PlaceableNodeType;
  hotkey: string;
  name: string;
  shortName: string;
  layerHint: string;
  cost: number;
  upgradeCost: number;
  color: string;
  roleSummary: string;
}

export interface RackSlot {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
}

export interface InfraNode {
  id: string;
  type: InfraNodeType;
  x: number;
  y: number;
  slotId?: string;
  fixed?: boolean;
  level: 1 | 2;
  rrCursor: number;
  processedCount: number;
  blockedCount: number;
  cacheHitCount: number;
  heat: number; // 0..1 visual load pulse
}

export interface InfraEdge {
  id: string;
  fromId: string;
  toId: string;
}

export interface BlueprintNodeSpec {
  id: string;
  type: PlaceableNodeType;
  slotId: string;
  level?: 1 | 2;
}

export interface ArchitectureApproach {
  id: string;
  name: string;
  tag: string;
  summary: string;
  pros: string;
  cons: string;
  requiredTypes: readonly PlaceableNodeType[];
  blueprintNodes: readonly BlueprintNodeSpec[];
  blueprintEdges: readonly { fromId: string; toId: string }[];
}

export interface TrafficWaveDef {
  waveNumber: number;
  label: string;
  durationSec: number;
  spawnIntervalSec: number;
  weights: Record<PacketKind, number>;
  rewardBudget: number;
}

export interface TrafficLevelDef {
  id: number;
  chapter: 1 | 2 | 3 | 4 | 5 | 6;
  chapterTitle: string;
  code: string;
  title: string;
  domain: string;
  difficulty: string;
  contextDescription: string;
  learningLesson: string;
  tacticalTip: string;
  targetSlaMs: number;
  startingBudget: number;
  dbCoolingPerSec: number;
  approaches: readonly ArchitectureApproach[];
  waves: readonly TrafficWaveDef[];
  initialNodes: readonly Omit<InfraNode, 'rrCursor' | 'processedCount' | 'blockedCount' | 'cacheHitCount' | 'heat'>[];
  initialEdges: readonly InfraEdge[];
}

export const CANVAS_W = 920;
export const CANVAS_H = 500;

export const RACK_SLOTS: readonly RackSlot[] = [
  // Column 0: Edge & Security (x = 225)
  { id: 'rack-0-0', col: 0, row: 0, x: 225, y: 112 },
  { id: 'rack-0-1', col: 0, row: 1, x: 225, y: 250 },
  { id: 'rack-0-2', col: 0, row: 2, x: 225, y: 388 },
  // Column 1: Routing, Cache & CDN (x = 385)
  { id: 'rack-1-0', col: 1, row: 0, x: 385, y: 112 },
  { id: 'rack-1-1', col: 1, row: 1, x: 385, y: 250 },
  { id: 'rack-1-2', col: 1, row: 2, x: 385, y: 388 },
  // Column 2: Compute & Async Queue (x = 545)
  { id: 'rack-2-0', col: 2, row: 0, x: 545, y: 112 },
  { id: 'rack-2-1', col: 2, row: 1, x: 545, y: 250 },
  { id: 'rack-2-2', col: 2, row: 2, x: 545, y: 388 },
  // Column 3: Workers, Storage & Replicas (x = 705)
  { id: 'rack-3-0', col: 3, row: 0, x: 705, y: 112 },
  { id: 'rack-3-1', col: 3, row: 1, x: 705, y: 250 },
  { id: 'rack-3-2', col: 3, row: 2, x: 705, y: 388 },
];

export const INFRA_NODE_CATALOG: readonly InfraNodeCatalogEntry[] = [
  {
    type: 'waf',
    hotkey: '1',
    name: 'WAF Firewall',
    shortName: 'WAF',
    layerHint: 'Bảo vệ',
    cost: 80,
    upgradeCost: 90,
    color: '#A855F7',
    roleSummary: 'Chặn 100% SQLi & payload độc hại',
  },
  {
    type: 'rate_limiter',
    hotkey: '2',
    name: 'Rate Limiter',
    shortName: 'Limiter',
    layerHint: 'Bảo vệ',
    cost: 70,
    upgradeCost: 85,
    color: '#F43F5E',
    roleSummary: 'Chặn 92–99% bão Bot DDoS tràn cổng',
  },
  {
    type: 'cdn',
    hotkey: '3',
    name: 'Edge CDN',
    shortName: 'CDN',
    layerHint: 'Biên mạng',
    cost: 85,
    upgradeCost: 95,
    color: '#EC4899',
    roleSummary: 'Phục vụ 90–96% Media/Static & chặn bớt DDoS',
  },
  {
    type: 'load_balancer',
    hotkey: '4',
    name: 'Load Balancer',
    shortName: 'LB (RR)',
    layerHint: 'Điều phối',
    cost: 65,
    upgradeCost: 75,
    color: '#3B82F6',
    roleSummary: 'Chia tải Round-Robin sang nhiều nhánh server',
  },
  {
    type: 'redis',
    hotkey: '5',
    name: 'Redis Cache',
    shortName: 'Redis',
    layerHint: 'Bộ đệm',
    cost: 85,
    upgradeCost: 95,
    color: '#06B6D4',
    roleSummary: 'Trả lời 76–90% gói GET (0% CPU DB)',
  },
  {
    type: 'app',
    hotkey: '6',
    name: 'App API Server',
    shortName: 'App API',
    layerHint: 'Xử lý',
    cost: 75,
    upgradeCost: 85,
    color: '#10B981',
    roleSummary: 'Xử lý nghiệp vụ API, chạy song song đa node',
  },
  {
    type: 'queue',
    hotkey: '7',
    name: 'Message Queue',
    shortName: 'Kafka/MQ',
    layerHint: 'Bất đồng bộ',
    cost: 90,
    upgradeCost: 100,
    color: '#F97316',
    roleSummary: 'Hấp thụ & làm phẳng xung ghi POST (giảm 55–70% tải DB)',
  },
  {
    type: 'worker',
    hotkey: '8',
    name: 'Async Worker',
    shortName: 'Worker',
    layerHint: 'Hậu cảnh',
    cost: 75,
    upgradeCost: 85,
    color: '#84CC16',
    roleSummary: 'Xử lý tác vụ nền từ Queue/Media mà không nghẽn API',
  },
  {
    type: 'read_replica',
    hotkey: '9',
    name: 'Read Replica DB',
    shortName: 'Replica',
    layerHint: 'Dữ liệu',
    cost: 95,
    upgradeCost: 110,
    color: '#14B8A6',
    roleSummary: 'Gánh 78–92% truy vấn Đọc GET thay Database chính',
  },
  {
    type: 'object_storage',
    hotkey: '0',
    name: 'Object Storage S3',
    shortName: 'S3/MinIO',
    layerHint: 'Lưu trữ',
    cost: 80,
    upgradeCost: 90,
    color: '#EAB308',
    roleSummary: 'Lưu 92–98% file Media/Ảnh/Video tách khỏi DB chính',
  },
];

export const PACKET_META: Record<
  PacketKind,
  { label: string; short: string; color: string; dbCpuLoad: number; integrityPenalty: number }
> = {
  read: {
    label: 'Request Đọc (GET)',
    short: 'GET',
    color: '#38BDF8',
    dbCpuLoad: 5.0,
    integrityPenalty: 0,
  },
  write: {
    label: 'Request Ghi Nặng (POST)',
    short: 'POST',
    color: '#F59E0B',
    dbCpuLoad: 11.6,
    integrityPenalty: 0,
  },
  media: {
    label: 'Tài nguyên Media/File',
    short: 'MEDIA',
    color: '#F472B6',
    dbCpuLoad: 9.8,
    integrityPenalty: 0,
  },
  ddos: {
    label: 'Bot DDoS Flood',
    short: 'DDoS',
    color: '#FB7185',
    dbCpuLoad: 18.0,
    integrityPenalty: 7,
  },
  sqli: {
    label: 'SQL Injection',
    short: 'SQLi',
    color: '#C084FC',
    dbCpuLoad: 26.5,
    integrityPenalty: 20,
  },
};

function makeStandardStart(): {
  initialNodes: TrafficLevelDef['initialNodes'];
  initialEdges: TrafficLevelDef['initialEdges'];
} {
  return {
    initialNodes: [
      { id: 'ingress', type: 'ingress', x: 76, y: 250, fixed: true, level: 1 },
      { id: 'app-init', type: 'app', x: 545, y: 250, slotId: 'rack-2-1', level: 1 },
      { id: 'database', type: 'database', x: 844, y: 250, fixed: true, level: 1 },
    ],
    initialEdges: [
      { id: 'e-init-1', fromId: 'ingress', toId: 'app-init' },
      { id: 'e-init-2', fromId: 'app-init', toId: 'database' },
    ],
  };
}

function slotCoords(slotId: string): { x: number; y: number } {
  const s = RACK_SLOTS.find((r) => r.id === slotId);
  return s ? { x: s.x, y: s.y } : { x: 440, y: 250 };
}

export function buildBlueprintGraph(
  level: TrafficLevelDef,
  approach: ArchitectureApproach
): { nodes: InfraNode[]; edges: InfraEdge[] } {
  const nodes: InfraNode[] = [
    {
      id: 'ingress',
      type: 'ingress',
      x: 76,
      y: 250,
      fixed: true,
      level: 1,
      rrCursor: 0,
      processedCount: 0,
      blockedCount: 0,
      cacheHitCount: 0,
      heat: 0,
    },
    ...approach.blueprintNodes.map((spec) => {
      const pos = slotCoords(spec.slotId);
      return {
        id: spec.id,
        type: spec.type,
        x: pos.x,
        y: pos.y,
        slotId: spec.slotId,
        level: spec.level ?? 1,
        rrCursor: 0,
        processedCount: 0,
        blockedCount: 0,
        cacheHitCount: 0,
        heat: 0,
      };
    }),
    {
      id: 'database',
      type: 'database',
      x: 844,
      y: 250,
      fixed: true,
      level: 1,
      rrCursor: 0,
      processedCount: 0,
      blockedCount: 0,
      cacheHitCount: 0,
      heat: 0,
    },
  ];
  const edges: InfraEdge[] = approach.blueprintEdges.map((e, i) => ({
    id: `bp-${approach.id}-${i}`,
    fromId: e.fromId,
    toId: e.toId,
  }));
  return { nodes, edges };
}

export function computeBlueprintCost(
  level: TrafficLevelDef,
  approach: ArchitectureApproach
): number {
  const startOwnedTypes = new Set(
    level.initialNodes.filter((n) => !n.fixed).map((n) => n.type)
  );
  // Base calculation: sum of blueprint nodes minus one free starter app if present
  let starterDiscountUsed = false;
  let total = 0;
  for (const n of approach.blueprintNodes) {
    const entry = getNodeCatalogEntry(n.type);
    if (!starterDiscountUsed && startOwnedTypes.has(n.type)) {
      starterDiscountUsed = true;
      if (n.level === 2) total += entry.upgradeCost;
      continue;
    }
    total += entry.cost + (n.level === 2 ? entry.upgradeCost : 0);
  }
  return total;
}

import { EXTRA_TRAFFIC_LEVELS } from './trafficRouterExtraLevels.ts';
export {
  ARCH_MODES,
  ARCH_MODE_MAP,
  getArchMode,
  getEffectiveScenarioConfig,
  type ArchModeDef,
  type ArchModeId,
  type EffectiveScenarioConfig,
} from './trafficRouterModes.ts';

const stdStart = makeStandardStart();

const BASE_TRAFFIC_LEVELS: readonly TrafficLevelDef[] = [
  // =========================================================================
  // CHƯƠNG 1: NỀN TẢNG WEB & TỐI ƯU ĐỌC/GHI (MÀN 1–4)
  // =========================================================================
  {
    id: 1,
    chapter: 1,
    chapterTitle: 'Chương 1 · Nền Tảng Web & Caching',
    code: 'ARCH-01',
    title: 'Cổng Tin Tức Lưu Lượng Đọc Lớn',
    domain: 'Content / News Portal',
    difficulty: 'Cơ bản',
    contextDescription:
      'Trang báo điện tử 85% là lượt đọc bài viết (GET) và ảnh minh họa (MEDIA). Độc giả truy cập dồn dập khiến Database quá tải truy vấn lặp lại.',
    learningLesson:
      'Một bài toán Read-heavy có thể giải bằng 3 hướng: (1) Đặt Redis Cache-Aside trong RAM, (2) Đặt Read Replica tách đọc khỏi DB chính, hoặc (3) Kết hợp CDN biên + App song song.',
    tacticalTip:
      'Thử lắp Redis [5], Read Replica [9] hoặc CDN [3]. Nhấn "Các Cách Thiết Kế" để xem 3 giải pháp chuẩn.',
    targetSlaMs: 52,
    startingBudget: 280,
    dbCoolingPerSec: 9.8,
    ...stdStart,
    approaches: [
      {
        id: 'arch01-redis',
        name: 'Cách 1: Cache-Aside (Redis Chủ Đạo)',
        tag: 'Rẻ & Latency cực thấp',
        summary: 'Chặn tới 80% truy vấn GET lặp lại ngay tại RAM bằng Redis Cache trước khi chạm DB.',
        pros: 'Chi phí vừa phải, tốc độ phản hồi dưới 30ms.',
        cons: 'Cần cơ chế xóa cache (Cache Invalidation) khi bài viết sửa nội dung.',
        requiredTypes: ['redis', 'app'],
        blueprintNodes: [
          { id: 'c1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'c1-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'c1-redis' },
          { fromId: 'c1-redis', toId: 'c1-app' },
          { fromId: 'c1-app', toId: 'database' },
        ],
      },
      {
        id: 'arch01-replica',
        name: 'Cách 2: Load Balancer + Read Replica',
        tag: 'Đồng bộ dữ liệu tốt',
        summary: 'Dùng Load Balancer chia tải qua App API và gắn Read Replica DB ở tầng dữ liệu.',
        pros: 'Dữ liệu luôn tươi mới gần thời gian thực, không lo lệch cache.',
        cons: 'Chi phí cụm server & DB phụ cao hơn Redis.',
        requiredTypes: ['load_balancer', 'read_replica'],
        blueprintNodes: [
          { id: 'c2-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'c2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'c2-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'c2-lb' },
          { fromId: 'c2-lb', toId: 'c2-app' },
          { fromId: 'c2-app', toId: 'c2-rep' },
          { fromId: 'c2-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch01-cdn',
        name: 'Cách 3: Edge CDN + Redis Hybrid',
        tag: 'Tối ưu băng thông & ảnh',
        summary: 'Đặt Edge CDN ở ngoài cùng gánh toàn bộ ảnh/HTML tĩnh, Redis lo API JSON động.',
        pros: 'Giảm tải tuyệt đối cho cả App Server lẫn Database.',
        cons: 'Đầu tư ban đầu cao hơn cho cả 2 lớp cache.',
        requiredTypes: ['cdn', 'redis'],
        blueprintNodes: [
          { id: 'c3-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'c3-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'c3-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'c3-cdn' },
          { fromId: 'c3-cdn', toId: 'c3-redis' },
          { fromId: 'c3-redis', toId: 'c3-app' },
          { fromId: 'c3-app', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Độc giả buổi sáng', durationSec: 8, spawnIntervalSec: 0.48, weights: { read: 0.65, write: 0.15, media: 0.2, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Tin nóng lan truyền', durationSec: 9, spawnIntervalSec: 0.36, weights: { read: 0.6, write: 0.18, media: 0.22, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Giờ cao điểm đọc tin', durationSec: 9, spawnIntervalSec: 0.28, weights: { read: 0.58, write: 0.2, media: 0.22, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Bùng nổ Breaking News', durationSec: 10, spawnIntervalSec: 0.23, weights: { read: 0.56, write: 0.22, media: 0.22, ddos: 0, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 2,
    chapter: 1,
    chapterTitle: 'Chương 1 · Nền Tảng Web & Caching',
    code: 'ARCH-02',
    title: 'Kho Ảnh & Clip Ngắn Cộng Đồng',
    domain: 'Media Sharing App',
    difficulty: 'Cơ bản',
    contextDescription:
      'Người dùng tải và xem hàng loạt ảnh/clip ngắn (50% traffic là MEDIA). Lưu nhị phân trực tiếp vào Database sẽ làm nổ tung CPU và IOPS.',
    learningLesson:
      'Nguyên tắc vàng: KHÔNG BAO GIỜ lưu file Media nặng trong DB quan hệ! Hãy tách file ra Object Storage (S3/MinIO) hoặc chặn phân phối tại Edge CDN.',
    tacticalTip:
      'Đặt CDN [3] ở cột biên hoặc Object Storage S3 [0] ở cột lưu trữ để tách 90%+ file Media khỏi Database!',
    targetSlaMs: 60,
    startingBudget: 280,
    dbCoolingPerSec: 10.0,
    ...stdStart,
    approaches: [
      {
        id: 'arch02-cdn-edge',
        name: 'Cách 1: Edge CDN Phân Phối Toàn Cầu',
        tag: 'Nhanh nhất cho người xem',
        summary: 'CDN phân phát 90% ảnh/video ngay tại server biên gần người dùng nhất.',
        pros: 'Latency thấp kỷ lục, tiết kiệm băng thông server gốc.',
        cons: 'Traffic upload mới vẫn cần đường ghi về Storage.',
        requiredTypes: ['cdn'],
        blueprintNodes: [
          { id: 'm1-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'm1-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'm1-cdn' },
          { fromId: 'm1-cdn', toId: 'm1-app' },
          { fromId: 'm1-app', toId: 'database' },
        ],
      },
      {
        id: 'arch02-s3-split',
        name: 'Cách 2: Tách Nhánh Object Storage S3',
        tag: 'Chuẩn Backend Lưu Trữ',
        summary: 'App API xử lý metadata, Object Storage S3 ôm toàn bộ file Media khỏi Database chính.',
        pros: 'Database chỉ còn lưu URL/Metadata siêu nhẹ, dễ mở rộng không giới hạn.',
        cons: 'Không có cache biên gần người dùng như CDN.',
        requiredTypes: ['object_storage'],
        blueprintNodes: [
          { id: 'm2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'm2-s3', type: 'object_storage', slotId: 'rack-3-0' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'm2-app' },
          { fromId: 'm2-app', toId: 'm2-s3' },
          { fromId: 'm2-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch02-cdn-s3',
        name: 'Cách 3: CDN + S3 Storage Hybrid',
        tag: 'Kiến trúc chuẩn Instagram',
        summary: 'CDN chặn traffic xem lại, S3 lưu trữ media mới tách biệt hoàn toàn DB.',
        pros: 'Chịu tải media cực lớn, bảo vệ Database tuyệt đối.',
        cons: 'Cần phối hợp nhiều thành phần hơn.',
        requiredTypes: ['cdn', 'object_storage'],
        blueprintNodes: [
          { id: 'm3-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'm3-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'm3-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'm3-cdn' },
          { fromId: 'm3-cdn', toId: 'm3-app' },
          { fromId: 'm3-app', toId: 'm3-s3' },
          { fromId: 'm3-s3', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Upload ảnh buổi trưa', durationSec: 8, spawnIntervalSec: 0.46, weights: { read: 0.35, write: 0.2, media: 0.45, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Video trend bùng nổ', durationSec: 9, spawnIntervalSec: 0.35, weights: { read: 0.28, write: 0.22, media: 0.5, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Cao điểm chia sẻ clip', durationSec: 9, spawnIntervalSec: 0.27, weights: { read: 0.26, write: 0.22, media: 0.52, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Cơn bão Clip Viral', durationSec: 10, spawnIntervalSec: 0.22, weights: { read: 0.24, write: 0.24, media: 0.52, ddos: 0, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 3,
    chapter: 1,
    chapterTitle: 'Chương 1 · Nền Tảng Web & Caching',
    code: 'ARCH-03',
    title: 'Flash Sale Sàn TMĐT & Bão Bot Săn Deal',
    domain: 'E-Commerce Flash Sale',
    difficulty: 'Trung bình',
    contextDescription:
      'Đúng 00:00 mở bán Flash Sale: hàng chục nghìn bot DDoS săn deal tràn vào cùng lúc người mua thật.',
    learningLesson:
      'Chống bão Bot có nhiều cách: Dùng Rate Limiter cắt IP spam 92–99%, kết hợp Redis giữ tồn kho siêu tốc, hoặc Edge CDN + Queue làm vùng đệm trước Database.',
    tacticalTip:
      'Gắn Rate Limiter [2] ngay đầu vào để chặn Bot DDoS, thêm Redis [5], LB [4] hoặc Queue [7] cho người mua thật!',
    targetSlaMs: 60,
    startingBudget: 320,
    dbCoolingPerSec: 10.4,
    ...stdStart,
    approaches: [
      {
        id: 'arch03-limiter-redis',
        name: 'Cách 1: Rate Limiter + Redis Flash Cache',
        tag: 'Phòng thủ cửa ngõ gọn nhẹ',
        summary: 'Rate Limiter lọc sạch 92% bot spam, Redis trả thông tin sản phẩm ngay trong RAM.',
        pros: 'Rất hiệu quả với chi phí tối ưu cho Flash Sale vừa.',
        cons: 'Lượt đặt đơn POST thật vẫn dồn thẳng vào DB nếu không có Queue.',
        requiredTypes: ['rate_limiter', 'redis'],
        blueprintNodes: [
          { id: 'f1-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'f1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'f1-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'f1-rl' },
          { fromId: 'f1-rl', toId: 'f1-redis' },
          { fromId: 'f1-redis', toId: 'f1-app' },
          { fromId: 'f1-app', toId: 'database' },
        ],
      },
      {
        id: 'arch03-lb-cluster',
        name: 'Cách 2: Rate Limiter + Multi-App Round-Robin',
        tag: 'Scale ngang App Server',
        summary: 'Sau Rate Limiter, Load Balancer chia đều lưu lượng qua 2 App API song song để không nghẽn cổ chai.',
        pros: 'Giảm độ trễ hàng đợi khi lượng request ghi tăng đột biến.',
        cons: 'Tốn thêm ngân sách cho App Server thứ 2.',
        requiredTypes: ['rate_limiter', 'load_balancer'],
        blueprintNodes: [
          { id: 'f2-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'f2-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'f2-app1', type: 'app', slotId: 'rack-2-0' },
          { id: 'f2-app2', type: 'app', slotId: 'rack-2-2' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'f2-rl' },
          { fromId: 'f2-rl', toId: 'f2-lb' },
          { fromId: 'f2-lb', toId: 'f2-app1' },
          { fromId: 'f2-lb', toId: 'f2-app2' },
          { fromId: 'f2-app1', toId: 'database' },
          { fromId: 'f2-app2', toId: 'database' },
        ],
      },
      {
        id: 'arch03-cdn-queue',
        name: 'Cách 3: Rate Limiter + App + Kafka Queue',
        tag: 'Chống sập chuẩn Shopee',
        summary: 'Rate Limiter triệt bot ở biên, Kafka Queue xếp hàng đơn mua từ từ xuống DB.',
        pros: 'Bảo toàn 100% đơn thật mà Database không bao giờ chạm ngưỡng 100%.',
        cons: 'Độ trễ chốt đơn chậm hơn vài mili-giây do qua Queue.',
        requiredTypes: ['rate_limiter', 'queue'],
        blueprintNodes: [
          { id: 'f3-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'f3-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'f3-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'f3-rl' },
          { fromId: 'f3-rl', toId: 'f3-app' },
          { fromId: 'f3-app', toId: 'f3-mq' },
          { fromId: 'f3-mq', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Đếm ngược 23:59', durationSec: 8, spawnIntervalSec: 0.43, weights: { read: 0.48, write: 0.25, media: 0.1, ddos: 0.17, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Bão Bot Săn Deal', durationSec: 9, spawnIntervalSec: 0.32, weights: { read: 0.34, write: 0.22, media: 0.08, ddos: 0.36, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Đỉnh 00:00 Flash Sale', durationSec: 9, spawnIntervalSec: 0.25, weights: { read: 0.28, write: 0.26, media: 0.06, ddos: 0.4, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Xung Chốt Đơn Săn Sale', durationSec: 10, spawnIntervalSec: 0.21, weights: { read: 0.28, write: 0.28, media: 0.04, ddos: 0.4, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 4,
    chapter: 1,
    chapterTitle: 'Chương 1 · Nền Tảng Web & Caching',
    code: 'ARCH-04',
    title: 'Cổng Xác Thực & Phòng Chống SQL Injection',
    domain: 'Identity & Auth Gateway',
    difficulty: 'Trung bình',
    contextDescription:
      'Kẻ tấn công liên tục nhồi mã độc SQL Injection vào form đăng nhập cùng đợt dò mật khẩu brute-force.',
    learningLesson:
      'Bảo mật tầng Auth có 3 hướng phối hợp: (1) WAF + Rate Limiter khóa cứng vòng ngoài, (2) WAF + Redis Session tránh chạm DB khi kiểm tra token, hoặc (3) Phòng thủ toàn diện WAF + Limiter + Redis.',
    tacticalTip:
      'Bắt buộc phải có WAF [1] để chặn 100% SQLi! Kết hợp Rate Limiter [2] và Redis [5] để vừa sạch bot vừa đạt tốc độ tối đa.',
    targetSlaMs: 60,
    startingBudget: 340,
    dbCoolingPerSec: 10.6,
    ...stdStart,
    approaches: [
      {
        id: 'arch04-waf-rl',
        name: 'Cách 1: WAF + Rate Limiter + App',
        tag: 'Khiên kép Bảo mật',
        summary: 'WAF triệt tiêu mọi payload SQLi, Rate Limiter khóa IP dò mật khẩu liên hoàn.',
        pros: 'Bảo mật tuyệt đối trước cả SQLi lẫn DDoS/Brute-force.',
        cons: 'Chưa tối ưu tốc độ kiểm tra phiên đăng nhập GET.',
        requiredTypes: ['waf', 'rate_limiter'],
        blueprintNodes: [
          { id: 'a1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'a1-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'a1-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'a1-waf' },
          { fromId: 'a1-waf', toId: 'a1-rl' },
          { fromId: 'a1-rl', toId: 'a1-app' },
          { fromId: 'a1-app', toId: 'database' },
        ],
      },
      {
        id: 'arch04-waf-redis',
        name: 'Cách 2: WAF Lv2 + Redis Session Store',
        tag: 'Xác thực Token siêu tốc',
        summary: 'WAF lọc SQLi ở biên, Redis cache toàn bộ Session/Token xác thực thay vì truy vấn DB.',
        pros: 'Latency xác thực giảm mạnh, giảm áp lực đọc DB.',
        cons: 'Thiếu Rate Limiter riêng nên vẫn có thể lọt DDoS nhẹ.',
        requiredTypes: ['waf', 'redis'],
        blueprintNodes: [
          { id: 'a2-waf', type: 'waf', slotId: 'rack-0-1', level: 2 },
          { id: 'a2-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'a2-app', type: 'app', slotId: 'rack-2-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'a2-waf' },
          { fromId: 'a2-waf', toId: 'a2-redis' },
          { fromId: 'a2-redis', toId: 'a2-app' },
          { fromId: 'a2-app', toId: 'database' },
        ],
      },
      {
        id: 'arch04-zero-trust',
        name: 'Cách 3: WAF + Rate Limiter + Redis Auth Stack',
        tag: 'Chuẩn Zero-Trust Toàn Diện',
        summary: 'Phối hợp đủ 3 lớp: WAF chặn SQLi, Limiter chặn brute-force, Redis trả Session tức thì.',
        pros: 'Đạt tối ưu cả Bảo mật lẫn Hiệu năng (Hạng S).',
        cons: 'Chi phí đầu tư cao nhất trong 3 cách.',
        requiredTypes: ['waf', 'rate_limiter', 'redis'],
        blueprintNodes: [
          { id: 'a3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'a3-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'a3-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 'a3-app', type: 'app', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'a3-waf' },
          { fromId: 'a3-waf', toId: 'a3-rl' },
          { fromId: 'a3-rl', toId: 'a3-redis' },
          { fromId: 'a3-redis', toId: 'a3-app' },
          { fromId: 'a3-app', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Rà quét SQLi', durationSec: 8, spawnIntervalSec: 0.42, weights: { read: 0.48, write: 0.24, media: 0, ddos: 0.12, sqli: 0.16 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Brute-force + SQLi', durationSec: 9, spawnIntervalSec: 0.32, weights: { read: 0.38, write: 0.22, media: 0, ddos: 0.18, sqli: 0.22 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Tấn công cổng Auth', durationSec: 9, spawnIntervalSec: 0.26, weights: { read: 0.32, write: 0.24, media: 0, ddos: 0.22, sqli: 0.22 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Credential Stuffing Toàn Diện', durationSec: 10, spawnIntervalSec: 0.21, weights: { read: 0.3, write: 0.24, media: 0, ddos: 0.24, sqli: 0.22 }, rewardBudget: 0 },
    ],
  },

  // =========================================================================
  // CHƯƠNG 2: BẤT ĐỒNG BỘ & TÁCH LUỒNG DỮ LIỆU (MÀN 5–8)
  // =========================================================================
  {
    id: 5,
    chapter: 2,
    chapterTitle: 'Chương 2 · Queue & Xử Lý Bất Đồng Bộ',
    code: 'ARCH-05',
    title: 'Hệ Thống Gửi Thông Báo Hàng Loạt',
    domain: 'Push Notification Engine',
    difficulty: 'Trung bình',
    contextDescription:
      'Sự kiện khuyến mãi gửi đồng loạt hàng triệu thông báo/email (60% là POST ghi tác vụ nặng). Nếu API chờ xử lý xong mới trả về, hệ thống sẽ nghẽn cứng.',
    learningLesson:
      'Thay vì xử lý đồng bộ (Synchronous), hãy đẩy yêu cầu vào Message Queue (Kafka/RabbitMQ) để Worker xử lý nền (Asynchronous), hoặc phân tán qua Load Balancer + Worker.',
    tacticalTip:
      'Lắp Kafka/MQ [7] + Worker [8] để làm phẳng xung POST! Có thể nâng cấp Queue để giảm tới 70% tải DB.',
    targetSlaMs: 68,
    startingBudget: 360,
    dbCoolingPerSec: 10.6,
    ...stdStart,
    approaches: [
      {
        id: 'arch05-mq-worker',
        name: 'Cách 1: Producer API → Kafka → Worker',
        tag: 'Chuẩn Event-Driven',
        summary: 'API nhận request đẩy vào Kafka Queue, Async Worker rút việc xử lý đều đặn xuống DB.',
        pros: 'Làm phẳng xung tải (Load Leveling), không bao giờ sập vì ghi dồn dập.',
        cons: 'Người dùng nhận kết quả bất đồng bộ (Eventual Consistency).',
        requiredTypes: ['queue', 'worker'],
        blueprintNodes: [
          { id: 'n1-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'n1-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'n1-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'n1-app' },
          { fromId: 'n1-app', toId: 'n1-mq' },
          { fromId: 'n1-mq', toId: 'n1-wk' },
          { fromId: 'n1-wk', toId: 'database' },
        ],
      },
      {
        id: 'arch05-lb-dual-worker',
        name: 'Cách 2: Kafka Chia Nhánh Đa Worker',
        tag: 'Thông lượng cực đại',
        summary: 'Một Message Queue phân phối đều Round-Robin sang 2 Async Worker xử lý song song.',
        pros: 'Xử lý hàng đợi nhanh gấp đôi, giảm ứ đọng latency.',
        cons: 'Chi phí vận hành thêm Worker node.',
        requiredTypes: ['queue', 'worker', 'app'],
        blueprintNodes: [
          { id: 'n2-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'n2-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'n2-wk1', type: 'worker', slotId: 'rack-3-0' },
          { id: 'n2-wk2', type: 'worker', slotId: 'rack-3-2' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'n2-app' },
          { fromId: 'n2-app', toId: 'n2-mq' },
          { fromId: 'n2-mq', toId: 'n2-wk1' },
          { fromId: 'n2-mq', toId: 'n2-wk2' },
          { fromId: 'n2-wk1', toId: 'database' },
          { fromId: 'n2-wk2', toId: 'database' },
        ],
      },
      {
        id: 'arch05-lb-mq-redis',
        name: 'Cách 3: Redis Template Cache + Kafka Push',
        tag: 'Phát Nhanh + Đệm Mẫu Tin',
        summary: 'Redis lưu sẵn mẫu thông báo GET để giảm 76% đọc DB, Kafka + Worker xử lý hàng đợi gửi.',
        pros: 'Tối ưu cả đọc template lẫn ghi hàng loạt.',
        cons: 'Cấu trúc nhiều tầng hơn.',
        requiredTypes: ['redis', 'queue', 'worker'],
        blueprintNodes: [
          { id: 'n3-redis', type: 'redis', slotId: 'rack-0-1' },
          { id: 'n3-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'n3-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'n3-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'n3-redis' },
          { fromId: 'n3-redis', toId: 'n3-app' },
          { fromId: 'n3-app', toId: 'n3-mq' },
          { fromId: 'n3-mq', toId: 'n3-wk' },
          { fromId: 'n3-wk', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Bắn thông báo chiến dịch A', durationSec: 8, spawnIntervalSec: 0.4, weights: { read: 0.32, write: 0.68, media: 0, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Đồng loạt Email & Push', durationSec: 9, spawnIntervalSec: 0.3, weights: { read: 0.24, write: 0.76, media: 0, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Bão ghi Webhook', durationSec: 9, spawnIntervalSec: 0.24, weights: { read: 0.2, write: 0.72, media: 0, ddos: 0.08, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Đỉnh Xung Thông Báo Toàn Hệ Thống', durationSec: 10, spawnIntervalSec: 0.19, weights: { read: 0.18, write: 0.72, media: 0, ddos: 0.1, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 6,
    chapter: 2,
    chapterTitle: 'Chương 2 · Queue & Xử Lý Bất Đồng Bộ',
    code: 'ARCH-06',
    title: 'Thanh Toán Đơn Hàng & Bảo Toàn Dữ Liệu',
    domain: 'E-Commerce Checkout',
    difficulty: 'Trung bình',
    contextDescription:
      'Người mua xem giỏ hàng (GET), đặt đơn thanh toán (POST) lẫn tin tặc chèn SQLi vào cổng thanh toán.',
    learningLesson:
      'Kết hợp WAF ở ngoài cùng, sau đó tùy chọn: (1) Đẩy đơn qua Kafka + Worker, (2) Redis + Kafka CQRS, hoặc (3) Load Balancer chia nhánh Read Replica + Kafka.',
    tacticalTip:
      'Đừng quên WAF [1] chặn SQLi! Sau đó phối hợp Kafka [7] cùng Redis [5] hoặc Read Replica [9].',
    targetSlaMs: 64,
    startingBudget: 400,
    dbCoolingPerSec: 11.0,
    ...stdStart,
    approaches: [
      {
        id: 'arch06-waf-mq',
        name: 'Cách 1: WAF + Event-Driven Checkout',
        tag: 'An toàn & Chịu xung ghi',
        summary: 'WAF lọc SQLi, App nhận đơn đẩy qua Kafka Queue và Worker ghi sổ cái.',
        pros: 'Không rớt đơn hàng dù lượng checkout tăng vọt.',
        cons: 'Lượt xem giỏ hàng GET chưa được cache tối đa.',
        requiredTypes: ['waf', 'queue', 'worker'],
        blueprintNodes: [
          { id: 'o1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'o1-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'o1-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'o1-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'o1-waf' },
          { fromId: 'o1-waf', toId: 'o1-app' },
          { fromId: 'o1-app', toId: 'o1-mq' },
          { fromId: 'o1-mq', toId: 'o1-wk' },
          { fromId: 'o1-wk', toId: 'database' },
        ],
      },
      {
        id: 'arch06-cqrs',
        name: 'Cách 2: WAF + Redis Cache + Queue (CQRS)',
        tag: 'Cân bằng Đọc & Ghi',
        summary: 'Redis chặn các truy vấn GET kiểm tra tồn kho, Kafka làm mượt luồng POST tạo đơn.',
        pros: 'Latency giỏ hàng cực nhanh đồng thời DB vẫn rất mát.',
        cons: 'Cần phối hợp nhiều node hơn.',
        requiredTypes: ['waf', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'o2-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'o2-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'o2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'o2-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'o2-waf' },
          { fromId: 'o2-waf', toId: 'o2-redis' },
          { fromId: 'o2-redis', toId: 'o2-app' },
          { fromId: 'o2-app', toId: 'o2-mq' },
          { fromId: 'o2-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch06-replica-mq',
        name: 'Cách 3: WAF + LB Tách Nhánh Replica & Kafka',
        tag: 'Tách Đọc / Ghi Tuyệt Đối',
        summary: 'Load Balancer điều phối song song qua Read Replica và Kafka Queue bảo vệ DB lõi.',
        pros: 'Dữ liệu đơn hàng chính xác cao, tải chia đều nhiều hướng.',
        cons: 'Tốn thêm chi phí cho cụm Replica.',
        requiredTypes: ['waf', 'load_balancer', 'queue', 'read_replica'],
        blueprintNodes: [
          { id: 'o3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'o3-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'o3-mq', type: 'queue', slotId: 'rack-2-0' },
          { id: 'o3-app', type: 'app', slotId: 'rack-2-2' },
          { id: 'o3-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'o3-waf' },
          { fromId: 'o3-waf', toId: 'o3-lb' },
          { fromId: 'o3-lb', toId: 'o3-mq' },
          { fromId: 'o3-lb', toId: 'o3-app' },
          { fromId: 'o3-mq', toId: 'o3-rep' },
          { fromId: 'o3-app', toId: 'o3-rep' },
          { fromId: 'o3-rep', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Đặt đơn giờ nghỉ trưa', durationSec: 8, spawnIntervalSec: 0.39, weights: { read: 0.4, write: 0.45, media: 0, ddos: 0.05, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Chèn SQLi vào mã giảm giá', durationSec: 9, spawnIntervalSec: 0.29, weights: { read: 0.34, write: 0.42, media: 0, ddos: 0.09, sqli: 0.15 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Cao điểm chốt đơn tối', durationSec: 9, spawnIntervalSec: 0.23, weights: { read: 0.3, write: 0.44, media: 0, ddos: 0.11, sqli: 0.15 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Bão Thanh Toán Cuối Ngày', durationSec: 10, spawnIntervalSec: 0.19, weights: { read: 0.28, write: 0.44, media: 0, ddos: 0.13, sqli: 0.15 }, rewardBudget: 0 },
    ],
  },
  {
    id: 7,
    chapter: 2,
    chapterTitle: 'Chương 2 · Queue & Xử Lý Bất Đồng Bộ',
    code: 'ARCH-07',
    title: 'Nền Tảng Video Streaming & Transcoding',
    domain: 'VOD Video Platform',
    difficulty: 'Khá',
    contextDescription:
      'Người tạo nội dung upload video thô (POST nặng), người xem phát video 4K liên tục (MEDIA 45%) kèm bình luận/view (GET).',
    learningLesson:
      'Kiến trúc Video hiện đại tách đôi rõ ràng: Edge CDN + Object Storage S3 lo 100% luồng phát Video, trong khi Kafka + Worker lo nén/encode video nền.',
    tacticalTip:
      'Kết hợp CDN [3] / S3 [0] cho Media, thêm Kafka [7] + Worker [8] cho luồng xử lý POST nặng!',
    targetSlaMs: 68,
    startingBudget: 440,
    dbCoolingPerSec: 11.2,
    ...stdStart,
    approaches: [
      {
        id: 'arch07-cdn-s3',
        name: 'Cách 1: Edge CDN + Redis + S3 Storage',
        tag: 'Phát Video Tối Ưu',
        summary: 'CDN phân phát 90% luồng xem video biên, Redis cache metadata và S3 gánh file gốc.',
        pros: 'Loại bỏ gần như 100% tải Media & GET ra khỏi DB chính.',
        cons: 'Luồng POST upload metadata vẫn tác động nhẹ lên DB.',
        requiredTypes: ['cdn', 'redis', 'object_storage'],
        blueprintNodes: [
          { id: 'v1-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'v1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'v1-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'v1-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'v1-cdn' },
          { fromId: 'v1-cdn', toId: 'v1-redis' },
          { fromId: 'v1-redis', toId: 'v1-app' },
          { fromId: 'v1-app', toId: 'v1-s3' },
          { fromId: 'v1-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch07-transcode-pipeline',
        name: 'Cách 2: CDN + Transcode Queue Pipeline',
        tag: 'Xử lý Upload Video Chuyên Nghiệp',
        summary: 'CDN gánh người xem, Kafka + S3 phối hợp nén và lưu video upload bất đồng bộ.',
        pros: 'Cân bằng hoàn hảo cả luồng xem (Read/Media) lẫn luồng đăng video (Write).',
        cons: 'Cần sắp xếp dây nối khéo léo qua 4 cột.',
        requiredTypes: ['cdn', 'queue', 'object_storage'],
        blueprintNodes: [
          { id: 'v2-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'v2-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'v2-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'v2-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'v2-cdn' },
          { fromId: 'v2-cdn', toId: 'v2-app' },
          { fromId: 'v2-app', toId: 'v2-mq' },
          { fromId: 'v2-mq', toId: 'v2-s3' },
          { fromId: 'v2-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch07-lb-dual-stream',
        name: 'Cách 3: LB Phân Nhánh CDN/S3 & Worker Transcode',
        tag: 'Chuẩn YouTube / TikTok',
        summary: 'Edge CDN ngoài cùng, Load Balancer chia nhánh song song sang S3 và Worker xử lý video.',
        pros: 'Chịu tải cực lớn khi creator upload và viewer xem đồng thời.',
        cons: 'Chi phí đầu tư ban đầu cao nhất.',
        requiredTypes: ['cdn', 'load_balancer', 'worker', 'object_storage'],
        blueprintNodes: [
          { id: 'v3-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 'v3-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'v3-wk', type: 'worker', slotId: 'rack-2-0' },
          { id: 'v3-app', type: 'app', slotId: 'rack-2-2' },
          { id: 'v3-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'v3-cdn' },
          { fromId: 'v3-cdn', toId: 'v3-lb' },
          { fromId: 'v3-lb', toId: 'v3-wk' },
          { fromId: 'v3-lb', toId: 'v3-app' },
          { fromId: 'v3-wk', toId: 'v3-s3' },
          { fromId: 'v3-app', toId: 'v3-s3' },
          { fromId: 'v3-s3', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Stream giờ vàng', durationSec: 8, spawnIntervalSec: 0.38, weights: { read: 0.25, write: 0.3, media: 0.45, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Bùng nổ Creator Upload', durationSec: 9, spawnIntervalSec: 0.28, weights: { read: 0.2, write: 0.35, media: 0.45, ddos: 0, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Livestream Triệu View', durationSec: 9, spawnIntervalSec: 0.23, weights: { read: 0.24, write: 0.26, media: 0.44, ddos: 0.06, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Đỉnh Băng Thông 4K', durationSec: 10, spawnIntervalSec: 0.18, weights: { read: 0.22, write: 0.28, media: 0.42, ddos: 0.08, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 8,
    chapter: 2,
    chapterTitle: 'Chương 2 · Queue & Xử Lý Bất Đồng Bộ',
    code: 'ARCH-08',
    title: 'Cổng Webhook Đối Tác & Chống Flood',
    domain: 'B2B Webhook Gateway',
    difficulty: 'Khá',
    contextDescription:
      'Hàng trăm đối tác bắn Webhook POST liên tục kèm lỗi retry vô hạn tạo hiệu ứng tự DDoS chính mình và kẻ gian chèn SQLi.',
    learningLesson:
      'Webhook Gateway cần 3 lớp: WAF chặn payload bẩn, Rate Limiter cắt bão retry, và Kafka Queue + Worker (hoặc Redis Idempotency) làm bộ đệm hấp thụ cơn bão POST.',
    tacticalTip:
      'Xếp lớp: WAF [1] + Rate Limiter [2] ở đầu vào, nối vào Kafka [7] & Worker [8] trước khi chạm DB!',
    targetSlaMs: 68,
    startingBudget: 440,
    dbCoolingPerSec: 11.4,
    ...stdStart,
    approaches: [
      {
        id: 'arch08-shield-mq',
        name: 'Cách 1: WAF → Limiter → Kafka → Worker',
        tag: 'Đường ống Webhook Bất Bại',
        summary: 'Lọc sạch SQLi & bão retry ngay cửa ngõ, Kafka đệm toàn bộ Webhook cho Worker xử lý.',
        pros: 'Không mất sự kiện đối tác nào và DB luôn dưới 60% CPU.',
        cons: 'Đòi hỏi quản lý Dead-Letter Queue khi Worker gặp lỗi.',
        requiredTypes: ['waf', 'rate_limiter', 'queue'],
        blueprintNodes: [
          { id: 'w1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'w1-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'w1-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'w1-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'w1-waf' },
          { fromId: 'w1-waf', toId: 'w1-rl' },
          { fromId: 'w1-rl', toId: 'w1-mq' },
          { fromId: 'w1-mq', toId: 'w1-wk' },
          { fromId: 'w1-wk', toId: 'database' },
        ],
      },
      {
        id: 'arch08-lb-workers',
        name: 'Cách 2: WAF + Limiter + App HMAC & Kafka',
        tag: 'Tách Luồng Xác Thực & Ghi',
        summary: 'WAF + Rate Limiter bảo vệ cổng, App API xác thực chữ ký rồi đẩy vào Kafka Queue.',
        pros: 'Kiểm tra chữ ký HMAC nhanh trước khi đưa vào Queue.',
        cons: 'Thêm một bước nhảy App API.',
        requiredTypes: ['waf', 'rate_limiter', 'app', 'queue'],
        blueprintNodes: [
          { id: 'w2-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'w2-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'w2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'w2-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'w2-waf' },
          { fromId: 'w2-waf', toId: 'w2-rl' },
          { fromId: 'w2-rl', toId: 'w2-app' },
          { fromId: 'w2-app', toId: 'w2-mq' },
          { fromId: 'w2-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch08-idempotent-redis',
        name: 'Cách 3: WAF + Limiter + Redis Idempotency + Kafka',
        tag: 'Chống Trùng Sự Kiện Webhook',
        summary: 'Redis kiểm tra khóa chống trùng (Idempotency Key), Kafka giữ hàng đợi ghi mượt mà.',
        pros: 'Ngăn đối tác gửi trùng đơn đồng thời gánh mượt cả GET kiểm tra log.',
        cons: 'Phối hợp nhiều node hơn nhưng rất ổn định.',
        requiredTypes: ['waf', 'rate_limiter', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'w3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'w3-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'w3-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 'w3-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'w3-waf' },
          { fromId: 'w3-waf', toId: 'w3-rl' },
          { fromId: 'w3-rl', toId: 'w3-redis' },
          { fromId: 'w3-redis', toId: 'w3-mq' },
          { fromId: 'w3-mq', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Webhook đồng bộ', durationSec: 8, spawnIntervalSec: 0.37, weights: { read: 0.15, write: 0.55, media: 0, ddos: 0.2, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Bão Retry Storm', durationSec: 9, spawnIntervalSec: 0.27, weights: { read: 0.1, write: 0.52, media: 0, ddos: 0.26, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Tấn công giả mạo Webhook', durationSec: 9, spawnIntervalSec: 0.21, weights: { read: 0.1, write: 0.48, media: 0, ddos: 0.26, sqli: 0.16 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Xung Callback Đối Tác Hàng Loạt', durationSec: 10, spawnIntervalSec: 0.18, weights: { read: 0.1, write: 0.48, media: 0, ddos: 0.26, sqli: 0.16 }, rewardBudget: 0 },
    ],
  },

  // =========================================================================
  // CHƯƠNG 3: HỆ THỐNG ĐẶC THÙ NGHIỆP VỤ (MÀN 9–12)
  // =========================================================================
  {
    id: 9,
    chapter: 3,
    chapterTitle: 'Chương 3 · Hệ Thống Chịu Tải Đặc Thù',
    code: 'ARCH-09',
    title: 'Mạng Xã Hội & Bảng Tin Thời Gian Thực',
    domain: 'Social Media Feed',
    difficulty: 'Khá',
    contextDescription:
      'Người dùng liên tục kéo Newsfeed (GET 45%), xem ảnh/story (MEDIA 25%), đăng trạng thái (POST 20%) và có spam bot.',
    learningLesson:
      'Bảng tin MXH dùng mô hình Fan-out-on-Write: bài mới đẩy qua Kafka/Worker vào Redis Timeline, còn ảnh đi qua CDN/S3.',
    tacticalTip:
      'Kết hợp CDN [3] + Redis [5] cho Feed & Ảnh, hoặc Kafka [7] cho bài đăng mới + Read Replica [9]!',
    targetSlaMs: 58,
    startingBudget: 480,
    dbCoolingPerSec: 11.4,
    ...stdStart,
    approaches: [
      {
        id: 'arch09-fanout',
        name: 'Cách 1: CDN + Redis Feed + Kafka Fan-out',
        tag: 'Chuẩn Twitter / Threads',
        summary: 'CDN xử lý ảnh/story, Redis chứa sẵn danh sách bài feed, Kafka cập nhật feed nền.',
        pros: 'Tải Newsfeed tức thì dưới 40ms.',
        cons: 'Người nổi tiếng có triệu follower cần xử lý fan-out riêng.',
        requiredTypes: ['cdn', 'redis', 'queue'],
        blueprintNodes: [
          { id: 's1-cdn', type: 'cdn', slotId: 'rack-0-1' },
          { id: 's1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 's1-app', type: 'app', slotId: 'rack-2-1' },
          { id: 's1-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 's1-cdn' },
          { fromId: 's1-cdn', toId: 's1-redis' },
          { fromId: 's1-redis', toId: 's1-app' },
          { fromId: 's1-app', toId: 's1-mq' },
          { fromId: 's1-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch09-lb-replica-s3',
        name: 'Cách 2: Rate Limiter + LB Đa Tầng (S3 & Replica)',
        tag: 'Phân Tách Dữ Liệu Rõ Ràng',
        summary: 'Load Balancer phân phối sang Read Replica và S3 thay vì dồn vào DB chính.',
        pros: 'Dễ bảo trì cấu trúc dữ liệu, không phụ thuộc quá mức vào cache.',
        cons: 'Độ trễ trung bình nhỉnh hơn Redis đôi chút.',
        requiredTypes: ['rate_limiter', 'load_balancer', 'read_replica'],
        blueprintNodes: [
          { id: 's2-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 's2-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 's2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 's2-rep', type: 'read_replica', slotId: 'rack-3-0' },
          { id: 's2-s3', type: 'object_storage', slotId: 'rack-3-2' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 's2-rl' },
          { fromId: 's2-rl', toId: 's2-lb' },
          { fromId: 's2-lb', toId: 's2-app' },
          { fromId: 's2-app', toId: 's2-rep' },
          { fromId: 's2-app', toId: 's2-s3' },
          { fromId: 's2-rep', toId: 'database' },
          { fromId: 's2-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch09-shield-s3-redis',
        name: 'Cách 3: Limiter + CDN + Redis + S3 Song Song',
        tag: 'Chống Spam Bot & Tải Ảnh Siêu Nhanh',
        summary: 'Limiter cắt bot ở cổng, CDN & S3 xử lý media, Redis giữ bảng tin nóng.',
        pros: 'Rất mạnh khi đợt viral kéo theo bot spam.',
        cons: 'Chi phí vận hành 4 lớp độc lập.',
        requiredTypes: ['rate_limiter', 'cdn', 'redis', 'object_storage'],
        blueprintNodes: [
          { id: 's3-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 's3-cdn', type: 'cdn', slotId: 'rack-1-1' },
          { id: 's3-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 's3-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 's3-rl' },
          { fromId: 's3-rl', toId: 's3-cdn' },
          { fromId: 's3-cdn', toId: 's3-redis' },
          { fromId: 's3-redis', toId: 's3-s3' },
          { fromId: 's3-s3', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Lướt Newsfeed tối', durationSec: 8, spawnIntervalSec: 0.35, weights: { read: 0.45, write: 0.2, media: 0.25, ddos: 0.1, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Trend Viral bùng nổ', durationSec: 9, spawnIntervalSec: 0.26, weights: { read: 0.4, write: 0.22, media: 0.26, ddos: 0.12, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Spam Bot & Cao điểm', durationSec: 9, spawnIntervalSec: 0.2, weights: { read: 0.36, write: 0.22, media: 0.24, ddos: 0.18, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Hashtag Nóng Toàn Quốc', durationSec: 10, spawnIntervalSec: 0.17, weights: { read: 0.34, write: 0.24, media: 0.22, ddos: 0.2, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 10,
    chapter: 3,
    chapterTitle: 'Chương 3 · Hệ Thống Chịu Tải Đặc Thù',
    code: 'ARCH-10',
    title: 'Ngân Hàng Số & Sổ Cái Giao Dịch (Fintech)',
    domain: 'Banking Core & AML',
    difficulty: 'Cao',
    contextDescription:
      'Hệ thống ngân hàng chịu kiểm tra số dư liên tục, chuyển tiền POST cần chính xác tuyệt đối, kèm tấn công SQLi & DDoS tinh vi.',
    learningLesson:
      'Fintech ưu tiên Security & Consistency: WAF + Rate Limiter là bắt buộc, sau đó tách tra cứu số dư (Read Replica / Redis) khỏi luồng ghi sổ cái hoặc dùng Queue kiểm soát đồng thời.',
    tacticalTip:
      'Bắt buộc phải có WAF [1] + Rate Limiter [2]! Kết hợp Read Replica [9], Redis [5] hoặc Queue [7] để bảo vệ DB lõi.',
    targetSlaMs: 58,
    startingBudget: 540,
    dbCoolingPerSec: 11.6,
    ...stdStart,
    approaches: [
      {
        id: 'arch10-strict-cqrs',
        name: 'Cách 1: WAF + Limiter + LB + Replica (Strict ACID)',
        tag: 'Chuẩn Core Banking',
        summary: 'Bảo vệ 2 lớp WAF & Limiter, Load Balancer chia tải qua App API và Read Replica DB.',
        pros: 'Đảm bảo giao dịch ghi ACID đồng bộ tức thì, tra cứu không chạm DB chính.',
        cons: 'Chi phí hạ tầng khá cao.',
        requiredTypes: ['waf', 'rate_limiter', 'read_replica'],
        blueprintNodes: [
          { id: 'b1-waf', type: 'waf', slotId: 'rack-0-0' },
          { id: 'b1-rl', type: 'rate_limiter', slotId: 'rack-0-2' },
          { id: 'b1-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'b1-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'b1-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'b1-waf' },
          { fromId: 'ingress', toId: 'b1-rl' },
          { fromId: 'b1-waf', toId: 'b1-lb' },
          { fromId: 'b1-rl', toId: 'b1-lb' },
          { fromId: 'b1-lb', toId: 'b1-app' },
          { fromId: 'b1-app', toId: 'b1-rep' },
          { fromId: 'b1-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch10-ledger-queue',
        name: 'Cách 2: WAF + Limiter + Ledger Kafka Queue',
        tag: 'Chống Nghẽn Giao Dịch Cao Điểm',
        summary: 'WAF + Limiter xếp nối tiếp thành tường lửa tuyệt đối, App + Kafka ổn định mọi truy vấn ghi.',
        pros: 'Chống SQLi 100%, không bao giờ khóa bảng DB khi chuyển tiền hàng loạt.',
        cons: 'Giao dịch hiển thị trạng thái "Đang xử lý" trong vài mili-giây.',
        requiredTypes: ['waf', 'rate_limiter', 'queue'],
        blueprintNodes: [
          { id: 'b2-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'b2-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'b2-app', type: 'app', slotId: 'rack-2-1' },
          { id: 'b2-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'b2-waf' },
          { fromId: 'b2-waf', toId: 'b2-rl' },
          { fromId: 'b2-rl', toId: 'b2-app' },
          { fromId: 'b2-app', toId: 'b2-mq' },
          { fromId: 'b2-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch10-redis-cqrs-full',
        name: 'Cách 3: WAF + Limiter + Redis Số Dư + Kafka Sổ Cái',
        tag: 'Kiến Trúc Ví Điện Tử Siêu Tốc',
        summary: 'WAF + Limiter ở biên, Redis trả số dư tức thì, Kafka xếp hàng giao dịch xuống sổ cái.',
        pros: 'Tối ưu cả đọc số dư lẫn ghi chuyển khoản dưới SLA 65ms.',
        cons: 'Đòi hỏi cơ chế khóa phân tán chuẩn xác giữa Redis và Sổ cái.',
        requiredTypes: ['waf', 'rate_limiter', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'b3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'b3-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'b3-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 'b3-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'b3-waf' },
          { fromId: 'b3-waf', toId: 'b3-rl' },
          { fromId: 'b3-rl', toId: 'b3-redis' },
          { fromId: 'b3-redis', toId: 'b3-mq' },
          { fromId: 'b3-mq', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Giao dịch đầu ngày', durationSec: 8, spawnIntervalSec: 0.34, weights: { read: 0.35, write: 0.35, media: 0, ddos: 0.15, sqli: 0.15 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Trả lương + Thăm dò SQLi', durationSec: 9, spawnIntervalSec: 0.25, weights: { read: 0.3, write: 0.36, media: 0, ddos: 0.16, sqli: 0.18 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Đột kích Ngân hàng số', durationSec: 9, spawnIntervalSec: 0.2, weights: { read: 0.28, write: 0.34, media: 0, ddos: 0.2, sqli: 0.18 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Bão Chuyển Khoản Liên Ngân Hàng', durationSec: 10, spawnIntervalSec: 0.16, weights: { read: 0.26, write: 0.36, media: 0, ddos: 0.2, sqli: 0.18 }, rewardBudget: 0 },
    ],
  },
  {
    id: 11,
    chapter: 3,
    chapterTitle: 'Chương 3 · Hệ Thống Chịu Tải Đặc Thù',
    code: 'ARCH-11',
    title: 'Bệnh Viện Thông Minh HIS & Chẩn Đoán Ảnh',
    domain: 'Healthcare HIS Platform',
    difficulty: 'Cao',
    contextDescription:
      'Bác sĩ tra cứu bệnh án (GET), nhận kết quả X-Quang/MRI (MEDIA 30%), đồng bộ xét nghiệm (POST 35%) và yêu cầu bảo mật hồ sơ y tế (chống SQLi).',
    learningLesson:
      'Kiến trúc Y tế (HIS) chuẩn kết hợp Kafka đồng bộ đa phân hệ (Xét nghiệm, Viện phí, Dược), Object Storage S3 lưu ảnh DICOM/X-Quang và WAF bảo vệ dữ liệu bệnh nhân.',
    tacticalTip:
      'Phối hợp WAF [1] + Kafka [7] cho sự kiện HIS + Object Storage S3 [0] cho ảnh X-Quang!',
    targetSlaMs: 64,
    startingBudget: 560,
    dbCoolingPerSec: 11.8,
    ...stdStart,
    approaches: [
      {
        id: 'arch11-his-kafka-s3',
        name: 'Cách 1: WAF + Kafka Event Bus + S3 DICOM',
        tag: 'Chuẩn HIS Bệnh Viện Lớn',
        summary: 'WAF bảo mật hồ sơ, App API phân luồng sang Kafka (bệnh án) và S3 (ảnh X-Quang).',
        pros: 'Tách bạch ảnh y tế nặng và luồng đồng bộ HIS mượt mà.',
        cons: 'Cần theo dõi trễ hàng đợi khi nhập viện ồ ạt.',
        requiredTypes: ['waf', 'queue', 'object_storage'],
        blueprintNodes: [
          { id: 'h1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'h1-app', type: 'app', slotId: 'rack-1-1' },
          { id: 'h1-mq', type: 'queue', slotId: 'rack-2-0' },
          { id: 'h1-s3', type: 'object_storage', slotId: 'rack-2-2' },
          { id: 'h1-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'h1-waf' },
          { fromId: 'h1-waf', toId: 'h1-app' },
          { fromId: 'h1-app', toId: 'h1-mq' },
          { fromId: 'h1-app', toId: 'h1-s3' },
          { fromId: 'h1-mq', toId: 'h1-rep' },
          { fromId: 'h1-s3', toId: 'h1-rep' },
          { fromId: 'h1-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch11-cdn-redis-waf',
        name: 'Cách 2: WAF + CDN + Redis + Read Replica',
        tag: 'Ưu tiên Tra cứu Bác sĩ',
        summary: 'CDN phân phát ảnh chẩn đoán nhanh tại nội bộ, Redis cache thông tin bệnh nhân đang khám.',
        pros: 'Bác sĩ mở bệnh án cực nhanh dưới 45ms.',
        cons: 'Khi xét nghiệm trả về ồ ạt sẽ cần nâng cấp DB/Replica.',
        requiredTypes: ['waf', 'cdn', 'redis'],
        blueprintNodes: [
          { id: 'h2-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'h2-cdn', type: 'cdn', slotId: 'rack-1-1' },
          { id: 'h2-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 'h2-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'h2-waf' },
          { fromId: 'h2-waf', toId: 'h2-cdn' },
          { fromId: 'h2-cdn', toId: 'h2-redis' },
          { fromId: 'h2-redis', toId: 'h2-rep' },
          { fromId: 'h2-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch11-his-worker-pipeline',
        name: 'Cách 3: WAF + LB + Kafka + Worker + S3',
        tag: 'Đồng Bộ Kết Quả Xét Nghiệm Nền',
        summary: 'WAF ở ngoài, Load Balancer chia nhánh Worker xử lý xét nghiệm và S3 lưu ảnh DICOM.',
        pros: 'Không bao giờ nghẽn khi máy xét nghiệm bắn kết quả hàng loạt.',
        cons: 'Cần quản lý 5 node đồng bộ.',
        requiredTypes: ['waf', 'load_balancer', 'worker', 'object_storage'],
        blueprintNodes: [
          { id: 'h3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'h3-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'h3-mq', type: 'queue', slotId: 'rack-2-0' },
          { id: 'h3-s3', type: 'object_storage', slotId: 'rack-2-2' },
          { id: 'h3-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'h3-waf' },
          { fromId: 'h3-waf', toId: 'h3-lb' },
          { fromId: 'h3-lb', toId: 'h3-mq' },
          { fromId: 'h3-lb', toId: 'h3-s3' },
          { fromId: 'h3-mq', toId: 'h3-wk' },
          { fromId: 'h3-s3', toId: 'h3-wk' },
          { fromId: 'h3-wk', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Tiếp đón khám sáng', durationSec: 8, spawnIntervalSec: 0.34, weights: { read: 0.25, write: 0.35, media: 0.3, ddos: 0, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Đổ kết quả xét nghiệm & MRI', durationSec: 9, spawnIntervalSec: 0.25, weights: { read: 0.22, write: 0.36, media: 0.3, ddos: 0, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Cao điểm + Khai thác SQLi', durationSec: 9, spawnIntervalSec: 0.2, weights: { read: 0.2, write: 0.35, media: 0.28, ddos: 0.05, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Đồng bộ HIS Toàn Bệnh Viện', durationSec: 10, spawnIntervalSec: 0.16, weights: { read: 0.2, write: 0.35, media: 0.27, ddos: 0.06, sqli: 0.12 }, rewardBudget: 0 },
    ],
  },
  {
    id: 12,
    chapter: 3,
    chapterTitle: 'Chương 3 · Hệ Thống Chịu Tải Đặc Thù',
    code: 'ARCH-12',
    title: 'Ứng Dụng Gọi Xe & Định Vị GPS Thời Gian Thực',
    domain: 'Ride-Hailing & Geo Telemetry',
    difficulty: 'Cao',
    contextDescription:
      'Hàng vạn tài xế bắn tọa độ GPS mỗi 2 giây (POST 45%), khách tìm tài xế xung quanh (GET 35%) kèm bot giả lập vị trí.',
    learningLesson:
      'Dữ liệu GPS không cần ghi từng nhịp vào DB chính! Hãy hấp thụ nhịp GPS qua Kafka Queue + Worker hoặc lưu vị trí nóng trong Redis Geo.',
    tacticalTip:
      'Dùng Rate Limiter [2] chống bot, kết hợp Redis [5] + Kafka [7] để giảm 70% áp lực ghi GPS lên DB!',
    targetSlaMs: 55,
    startingBudget: 540,
    dbCoolingPerSec: 12.0,
    ...stdStart,
    approaches: [
      {
        id: 'arch12-geo-redis-mq',
        name: 'Cách 1: Limiter + Redis Geo + Kafka GPS Stream',
        tag: 'Chuẩn Grab / Uber',
        summary: 'Redis phục vụ tìm xe quanh đây, Kafka gom luồng tọa độ GPS ghi theo lô (batch) xuống DB.',
        pros: 'Latency đặt xe siêu thấp, DB không bị nát vì ghi GPS từng giây.',
        cons: 'Cần logic đồng bộ Redis Geo khi tài xế mất mạng.',
        requiredTypes: ['rate_limiter', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'r1-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'r1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'r1-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'r1-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'r1-rl' },
          { fromId: 'r1-rl', toId: 'r1-redis' },
          { fromId: 'r1-redis', toId: 'r1-mq' },
          { fromId: 'r1-mq', toId: 'r1-wk' },
          { fromId: 'r1-wk', toId: 'database' },
        ],
      },
      {
        id: 'arch12-lb-multi-app',
        name: 'Cách 2: Limiter + LB + Multi-App + Queue',
        tag: 'Chịu Tải Giờ Tan Tầm',
        summary: 'Load Balancer chia đều request đặt xe cho 2 App Server rồi đưa vào hàng đợi xử lý.',
        pros: 'Xử lý tính giá cước linh hoạt, ít điểm nghẽn tính toán.',
        cons: 'Truy vấn tìm xe sẽ chạm Replica/DB nhiều hơn cách 1.',
        requiredTypes: ['rate_limiter', 'load_balancer', 'queue'],
        blueprintNodes: [
          { id: 'r2-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'r2-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'r2-app1', type: 'app', slotId: 'rack-2-0' },
          { id: 'r2-app2', type: 'app', slotId: 'rack-2-2' },
          { id: 'r2-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'r2-rl' },
          { fromId: 'r2-rl', toId: 'r2-lb' },
          { fromId: 'r2-lb', toId: 'r2-app1' },
          { fromId: 'r2-lb', toId: 'r2-app2' },
          { fromId: 'r2-app1', toId: 'r2-mq' },
          { fromId: 'r2-app2', toId: 'r2-mq' },
          { fromId: 'r2-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch12-replica-redis',
        name: 'Cách 3: Limiter + Redis + Kafka + Read Replica',
        tag: 'Phân Tách Tìm Xe & Lịch Sử Chuyến',
        summary: 'Redis & Read Replica xử lý đọc bản đồ xe, Kafka ghi nhật ký hành trình nền.',
        pros: 'Đáp ứng cực tốt khi đồng thời có nhiều truy vấn lịch sử chuyến đi.',
        cons: 'Tốn thêm chi phí Read Replica.',
        requiredTypes: ['rate_limiter', 'redis', 'queue', 'read_replica'],
        blueprintNodes: [
          { id: 'r3-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'r3-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'r3-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'r3-rep', type: 'read_replica', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'r3-rl' },
          { fromId: 'r3-rl', toId: 'r3-redis' },
          { fromId: 'r3-redis', toId: 'r3-mq' },
          { fromId: 'r3-mq', toId: 'r3-rep' },
          { fromId: 'r3-rep', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Giờ đi làm sáng', durationSec: 8, spawnIntervalSec: 0.32, weights: { read: 0.35, write: 0.45, media: 0, ddos: 0.2, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Trời mưa tan tầm', durationSec: 9, spawnIntervalSec: 0.24, weights: { read: 0.32, write: 0.46, media: 0, ddos: 0.22, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Bão GPS + Bot Fake', durationSec: 9, spawnIntervalSec: 0.19, weights: { read: 0.3, write: 0.45, media: 0, ddos: 0.25, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Cao điểm Đêm Giông Bão', durationSec: 10, spawnIntervalSec: 0.16, weights: { read: 0.28, write: 0.46, media: 0, ddos: 0.26, sqli: 0 }, rewardBudget: 0 },
    ],
  },

  // =========================================================================
  // CHƯƠNG 4: QUY MÔ TOÀN CẦU & THỬ THÁCH KIẾN TRÚC SƯ (MÀN 13–16)
  // =========================================================================
  {
    id: 13,
    chapter: 4,
    chapterTitle: 'Chương 4 · Kiến Trúc Quy Mô Lớn',
    code: 'ARCH-13',
    title: 'Hệ Thống Cảm Biến IoT Triệu Kết Nối',
    domain: 'IoT Telemetry Ingestion',
    difficulty: 'Chuyên gia',
    contextDescription:
      'Hàng triệu thiết bị IoT gửi gói tin đo đạc (POST 65%) không ngừng nghỉ, kèm các thiết bị lỗi gửi lặp (DDoS) và khai thác firmware (SQLi).',
    learningLesson:
      'Với IoT Write-Extreme, Queue (Kafka) + Worker nâng cấp Lv2 là xương sống bắt buộc để gom hàng triệu bản ghi trước khi đẩy xuống DB.',
    tacticalTip:
      'Nâng cấp Kafka [7] và Worker [8] lên Lv2! Đặt WAF [1] + Rate Limiter [2] ngay đầu vào.',
    targetSlaMs: 68,
    startingBudget: 660,
    dbCoolingPerSec: 12.2,
    ...stdStart,
    approaches: [
      {
        id: 'arch13-iot-pipeline',
        name: 'Cách 1: WAF + Limiter + Kafka Lv2 + Worker Lv2',
        tag: 'Ống Dẫn IoT Siêu Bền',
        summary: 'Chặn gói tin lỗi ở biên, dùng Kafka Lv2 làm bộ đệm khổng lồ giảm 70% tải DB.',
        pros: 'Chịu được xung ghi 65%+ mượt mà.',
        cons: 'Độ trễ đồng bộ dữ liệu báo cáo vài giây.',
        requiredTypes: ['waf', 'rate_limiter', 'queue', 'worker'],
        blueprintNodes: [
          { id: 'i1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'i1-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'i1-mq', type: 'queue', slotId: 'rack-2-1', level: 2 },
          { id: 'i1-wk', type: 'worker', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'i1-waf' },
          { fromId: 'i1-waf', toId: 'i1-rl' },
          { fromId: 'i1-rl', toId: 'i1-mq' },
          { fromId: 'i1-mq', toId: 'i1-wk' },
          { fromId: 'i1-wk', toId: 'database' },
        ],
      },
      {
        id: 'arch13-iot-parallel',
        name: 'Cách 2: Phân Tán Đa Nhánh Queue & Storage',
        tag: 'Lưu Trữ Lịch Sử Dài Hạn',
        summary: 'Đẩy dữ liệu thời gian thực qua Worker vào DB và log thô vào Object Storage S3.',
        pros: 'Giảm dung lượng lưu trữ nóng trên DB đắt đỏ.',
        cons: 'Thiết lập nhiều nhánh phức tạp.',
        requiredTypes: ['waf', 'rate_limiter', 'queue', 'object_storage'],
        blueprintNodes: [
          { id: 'i2-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'i2-rl', type: 'rate_limiter', slotId: 'rack-1-1' },
          { id: 'i2-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'i2-wk', type: 'worker', slotId: 'rack-3-0' },
          { id: 'i2-s3', type: 'object_storage', slotId: 'rack-3-2' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'i2-waf' },
          { fromId: 'i2-waf', toId: 'i2-rl' },
          { fromId: 'i2-rl', toId: 'i2-mq' },
          { fromId: 'i2-mq', toId: 'i2-wk' },
          { fromId: 'i2-mq', toId: 'i2-s3' },
          { fromId: 'i2-wk', toId: 'database' },
          { fromId: 'i2-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch13-iot-sharded-lb',
        name: 'Cách 3: Edge Shield + LB Chia Cụm Dual Kafka',
        tag: 'Mở Rộng Hàng Triệu Thiết Bị',
        summary: 'Load Balancer phân vùng (Partition) cảm biến sang 2 Kafka Queue chạy song song.',
        pros: 'Không bao giờ nghẽn hàng đợi đơn ngay cả khi bão Reconnect xảy ra.',
        cons: 'Ngân sách đầu tư cao nhất.',
        requiredTypes: ['waf', 'rate_limiter', 'load_balancer', 'queue'],
        blueprintNodes: [
          { id: 'i3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'i3-rl', type: 'rate_limiter', slotId: 'rack-1-0', level: 2 },
          { id: 'i3-lb', type: 'load_balancer', slotId: 'rack-1-2' },
          { id: 'i3-mq1', type: 'queue', slotId: 'rack-2-0' },
          { id: 'i3-mq2', type: 'queue', slotId: 'rack-2-2' },
          { id: 'i3-wk', type: 'worker', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'i3-waf' },
          { fromId: 'i3-waf', toId: 'i3-rl' },
          { fromId: 'i3-rl', toId: 'i3-lb' },
          { fromId: 'i3-lb', toId: 'i3-mq1' },
          { fromId: 'i3-lb', toId: 'i3-mq2' },
          { fromId: 'i3-mq1', toId: 'i3-wk' },
          { fromId: 'i3-mq2', toId: 'i3-wk' },
          { fromId: 'i3-wk', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Đồng bộ cảm biến', durationSec: 8, spawnIntervalSec: 0.3, weights: { read: 0.15, write: 0.6, media: 0, ddos: 0.15, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Bão mất kết nối & Reconnect', durationSec: 9, spawnIntervalSec: 0.22, weights: { read: 0.1, write: 0.6, media: 0, ddos: 0.2, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Botnet IoT Mirai', durationSec: 9, spawnIntervalSec: 0.18, weights: { read: 0.1, write: 0.55, media: 0, ddos: 0.25, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Triệu Thiết Bị Gửi Telemetry Đồng Loạt', durationSec: 10, spawnIntervalSec: 0.15, weights: { read: 0.1, write: 0.55, media: 0, ddos: 0.25, sqli: 0.1 }, rewardBudget: 0 },
    ],
  },
  {
    id: 14,
    chapter: 4,
    chapterTitle: 'Chương 4 · Kiến Trúc Quy Mô Lớn',
    code: 'ARCH-14',
    title: 'Nền Tảng Tạo Ảnh & Video AI (AI Media API)',
    domain: 'AI Inference & Generation',
    difficulty: 'Chuyên gia',
    contextDescription:
      'Người dùng gửi prompt tạo ảnh/video AI (POST 30%), tải kết quả HD (MEDIA 35%), kiểm tra trạng thái job (GET 20%) cùng bot cào API.',
    learningLesson:
      'Kiến trúc AI Media chuẩn gồm: Rate Limiter bảo vệ GPU quota, Redis giữ trạng thái Job, Kafka + Worker điều phối GPU render, và S3 + CDN trả ảnh thành phẩm!',
    tacticalTip:
      'Kết hợp CDN [3] + Redis [5] + Kafka [7] + S3 [0] (hoặc Rate Limiter [2]) để không nghẽn API!',
    targetSlaMs: 68,
    startingBudget: 680,
    dbCoolingPerSec: 12.4,
    ...stdStart,
    approaches: [
      {
        id: 'arch14-ai-full',
        name: 'Cách 1: Limiter → Redis Job → Kafka → S3',
        tag: 'Chuẩn MISA OneAI / Midjourney',
        summary: 'Rate Limiter giữ quota, Redis phản hồi polling trạng thái job, Kafka xếp hàng render xuống S3.',
        pros: 'Đúng chuẩn kiến trúc AI Agent & Media Generation thực tế.',
        cons: 'Yêu cầu phối hợp 4 tầng mạch lạc.',
        requiredTypes: ['rate_limiter', 'redis', 'queue', 'object_storage'],
        blueprintNodes: [
          { id: 'ai1-rl', type: 'rate_limiter', slotId: 'rack-0-1' },
          { id: 'ai1-redis', type: 'redis', slotId: 'rack-1-1' },
          { id: 'ai1-mq', type: 'queue', slotId: 'rack-2-1' },
          { id: 'ai1-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'ai1-rl' },
          { fromId: 'ai1-rl', toId: 'ai1-redis' },
          { fromId: 'ai1-redis', toId: 'ai1-mq' },
          { fromId: 'ai1-mq', toId: 'ai1-s3' },
          { fromId: 'ai1-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch14-cdn-worker',
        name: 'Cách 2: CDN + Limiter + LB + Worker + S3',
        tag: 'Tối Ưu Tải Kết Quả CDN',
        summary: 'CDN trả ngay kết quả ảnh/video phổ biến, phần việc mới chia đều qua Load Balancer tới Worker & S3.',
        pros: 'Tải kết quả Media cực nhanh trên toàn quốc.',
        cons: 'Các lệnh polling GET chạm Replica/DB nhiều hơn nếu thiếu Redis.',
        requiredTypes: ['cdn', 'rate_limiter', 'worker', 'object_storage'],
        blueprintNodes: [
          { id: 'ai2-cdn', type: 'cdn', slotId: 'rack-0-0' },
          { id: 'ai2-rl', type: 'rate_limiter', slotId: 'rack-0-2' },
          { id: 'ai2-lb', type: 'load_balancer', slotId: 'rack-1-1' },
          { id: 'ai2-wk', type: 'worker', slotId: 'rack-2-1' },
          { id: 'ai2-s3', type: 'object_storage', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'ai2-cdn' },
          { fromId: 'ingress', toId: 'ai2-rl' },
          { fromId: 'ai2-cdn', toId: 'ai2-lb' },
          { fromId: 'ai2-rl', toId: 'ai2-lb' },
          { fromId: 'ai2-lb', toId: 'ai2-wk' },
          { fromId: 'ai2-wk', toId: 'ai2-s3' },
          { fromId: 'ai2-s3', toId: 'database' },
        ],
      },
      {
        id: 'arch14-edge-redis-mq-cdn',
        name: 'Cách 3: Edge CDN + Limiter + Redis + Kafka (Full Cache)',
        tag: 'Độ Trễ Polling & Media Thấp Nhất',
        summary: 'CDN gánh file HD ở ngoài biên, Redis giữ trạng thái prompt, Kafka xếp hàng GPU.',
        pros: 'Trải nghiệm mượt cả khi hàng chục nghìn người chờ ảnh cùng lúc.',
        cons: 'Chi phí hạ tầng cao.',
        requiredTypes: ['cdn', 'rate_limiter', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'ai3-rl', type: 'rate_limiter', slotId: 'rack-0-1', level: 2 },
          { id: 'ai3-cdn', type: 'cdn', slotId: 'rack-1-1' },
          { id: 'ai3-redis', type: 'redis', slotId: 'rack-2-1' },
          { id: 'ai3-mq', type: 'queue', slotId: 'rack-3-1' },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'ai3-rl' },
          { fromId: 'ai3-rl', toId: 'ai3-cdn' },
          { fromId: 'ai3-cdn', toId: 'ai3-redis' },
          { fromId: 'ai3-redis', toId: 'ai3-mq' },
          { fromId: 'ai3-mq', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Render ảnh hàng loạt', durationSec: 8, spawnIntervalSec: 0.3, weights: { read: 0.2, write: 0.3, media: 0.35, ddos: 0.15, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Tạo Video AI giờ cao điểm', durationSec: 9, spawnIntervalSec: 0.22, weights: { read: 0.2, write: 0.3, media: 0.35, ddos: 0.15, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Bot cào API + Prompt Flood', durationSec: 9, spawnIntervalSec: 0.18, weights: { read: 0.18, write: 0.28, media: 0.32, ddos: 0.22, sqli: 0 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Bão Render Video 4K Toàn Cầu', durationSec: 10, spawnIntervalSec: 0.15, weights: { read: 0.18, write: 0.28, media: 0.32, ddos: 0.22, sqli: 0 }, rewardBudget: 0 },
    ],
  },
  {
    id: 15,
    chapter: 4,
    chapterTitle: 'Chương 4 · Kiến Trúc Quy Mô Lớn',
    code: 'ARCH-15',
    title: 'Siêu Hội Mua Sắm Black Friday Toàn Quốc',
    domain: 'Mega Omni-Channel Retail',
    difficulty: 'Siêu khó',
    contextDescription:
      'Mọi loại lưu lượng đều đạt đỉnh cùng lúc: GET 30%, POST đơn 25%, Ảnh/Banner 20%, Bot DDoS 15%, SQLi 10%.',
    learningLesson:
      'Hệ thống toàn diện đòi hỏi Phòng thủ đa tầng (WAF + Rate Limiter Lv2), Bộ nhớ đệm (CDN/Redis), và Hàng đợi bất đồng bộ (Kafka).',
    tacticalTip:
      'Nâng cấp các node nòng cốt lên Lv2! Đảm bảo có WAF [1] + Rate Limiter [2] + Redis/CDN + Kafka [7].',
    targetSlaMs: 60,
    startingBudget: 860,
    dbCoolingPerSec: 12.6,
    ...stdStart,
    approaches: [
      {
        id: 'arch15-defense-in-depth',
        name: 'Cách 1: Defense-in-Depth + Redis + Kafka',
        tag: 'Phòng Thủ Đa Tầng Toàn Diện',
        summary: 'WAF + Limiter Lv2 thanh lọc lưu lượng ở biên, CDN/Redis gánh Đọc & Media, Kafka gánh Ghi.',
        pros: 'Cân mọi loại gói tin và mọi cuộc tấn công cùng lúc.',
        cons: 'Chi phí đầu tư lớn.',
        requiredTypes: ['waf', 'rate_limiter', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'bf1-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'bf1-rl', type: 'rate_limiter', slotId: 'rack-1-0', level: 2 },
          { id: 'bf1-cdn', type: 'cdn', slotId: 'rack-1-2' },
          { id: 'bf1-redis', type: 'redis', slotId: 'rack-2-1', level: 2 },
          { id: 'bf1-mq', type: 'queue', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'bf1-waf' },
          { fromId: 'bf1-waf', toId: 'bf1-rl' },
          { fromId: 'bf1-waf', toId: 'bf1-cdn' },
          { fromId: 'bf1-rl', toId: 'bf1-redis' },
          { fromId: 'bf1-cdn', toId: 'bf1-redis' },
          { fromId: 'bf1-redis', toId: 'bf1-mq' },
          { fromId: 'bf1-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch15-multi-tier',
        name: 'Cách 2: Parallel Multi-Tier + Read Replica',
        tag: 'Mở Rộng Song Song Mọi Lớp',
        summary: 'Phòng thủ kép ở đầu vào, phân nhánh CDN & Kafka rồi hội tụ qua Read Replica Lv2.',
        pros: 'Chịu lỗi đơn điểm (Single Point of Failure) cực tốt.',
        cons: 'Nhiều đường dây cần đi chính xác.',
        requiredTypes: ['waf', 'rate_limiter', 'cdn', 'read_replica'],
        blueprintNodes: [
          { id: 'bf2-waf', type: 'waf', slotId: 'rack-0-1', level: 2 },
          { id: 'bf2-rl', type: 'rate_limiter', slotId: 'rack-1-1', level: 2 },
          { id: 'bf2-cdn', type: 'cdn', slotId: 'rack-2-0' },
          { id: 'bf2-mq', type: 'queue', slotId: 'rack-2-2' },
          { id: 'bf2-rep', type: 'read_replica', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'bf2-waf' },
          { fromId: 'bf2-waf', toId: 'bf2-rl' },
          { fromId: 'bf2-rl', toId: 'bf2-cdn' },
          { fromId: 'bf2-rl', toId: 'bf2-mq' },
          { fromId: 'bf2-cdn', toId: 'bf2-rep' },
          { fromId: 'bf2-mq', toId: 'bf2-rep' },
          { fromId: 'bf2-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch15-omni-s3-pipeline',
        name: 'Cách 3: WAF + Limiter Lv2 + Redis + S3 + Kafka',
        tag: 'Chuẩn Thương Mại Điện Tử Omni-Channel',
        summary: 'Tách Media qua S3, GET qua Redis, POST qua Kafka sau khi lọc sạch tấn công tại WAF & Limiter.',
        pros: 'Mỗi loại lưu lượng đi đúng chuyên trách — DB gần như miễn nhiễm quá tải.',
        cons: 'Cần phối hợp cả 5 thành phần chuyên sâu.',
        requiredTypes: ['waf', 'rate_limiter', 'redis', 'object_storage', 'queue'],
        blueprintNodes: [
          { id: 'bf3-waf', type: 'waf', slotId: 'rack-0-1' },
          { id: 'bf3-rl', type: 'rate_limiter', slotId: 'rack-1-1', level: 2 },
          { id: 'bf3-redis', type: 'redis', slotId: 'rack-2-0' },
          { id: 'bf3-s3', type: 'object_storage', slotId: 'rack-2-2' },
          { id: 'bf3-mq', type: 'queue', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'bf3-waf' },
          { fromId: 'bf3-waf', toId: 'bf3-rl' },
          { fromId: 'bf3-rl', toId: 'bf3-redis' },
          { fromId: 'bf3-rl', toId: 'bf3-s3' },
          { fromId: 'bf3-redis', toId: 'bf3-mq' },
          { fromId: 'bf3-s3', toId: 'bf3-mq' },
          { fromId: 'bf3-mq', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Mở cổng Black Friday', durationSec: 8, spawnIntervalSec: 0.28, weights: { read: 0.32, write: 0.24, media: 0.2, ddos: 0.14, sqli: 0.1 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Xung tải + SQLi đa điểm', durationSec: 9, spawnIntervalSec: 0.21, weights: { read: 0.28, write: 0.26, media: 0.2, ddos: 0.14, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Cơn bão 00:00', durationSec: 9, spawnIntervalSec: 0.17, weights: { read: 0.26, write: 0.26, media: 0.18, ddos: 0.18, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Flash Deal Cuối Đêm', durationSec: 10, spawnIntervalSec: 0.14, weights: { read: 0.24, write: 0.28, media: 0.18, ddos: 0.18, sqli: 0.12 }, rewardBudget: 0 },
    ],
  },
  {
    id: 16,
    chapter: 4,
    chapterTitle: 'Chương 4 · Kiến Trúc Quy Mô Lớn',
    code: 'ARCH-16',
    title: 'Hạ Tầng Quốc Gia 99.99% Uptime (Boss)',
    domain: 'Global Sovereign Cloud',
    difficulty: 'Huyền thoại',
    contextDescription:
      'Thử thách tối thượng của Kiến trúc sư Hệ thống: Mọi cơn bão lưu lượng & tấn công mạng dội xuống với cường độ cao nhất. Giữ DB sống sót & Latency đạt chuẩn!',
    learningLesson:
      'Không có một công cụ vạn năng nào — hệ thống cấp quốc gia là nghệ thuật phối hợp hài hòa: Edge Shield (WAF + Limiter + CDN) → Cache & Balance (Redis + LB) → Async Compute (Kafka + Worker) → Storage & Replica!',
    tacticalTip:
      'Huy động toàn bộ ngân sách để thiết kế hạ tầng Lv2 đa tầng hoàn chỉnh trước khi bấm Sẵn Sàng!',
    targetSlaMs: 60,
    startingBudget: 1080,
    dbCoolingPerSec: 13.0,
    ...stdStart,
    approaches: [
      {
        id: 'arch16-citadel',
        name: 'Cách 1: Thành Trì 4 Lớp (WAF + Limiter + CDN + Redis + Kafka)',
        tag: 'Kiến Trúc Hoàn Hảo',
        summary: 'Mỗi loại gói tin được chặn hoặc tối ưu ngay tại lớp chuyên trách trước khi tới Database.',
        pros: 'Đạt cân bằng hoàn hảo giữa Bảo mật, Latency và Sức chịu tải.',
        cons: 'Đòi hỏi toàn bộ các mắt xích phải nâng cấp Lv2.',
        requiredTypes: ['waf', 'rate_limiter', 'cdn', 'redis', 'queue'],
        blueprintNodes: [
          { id: 'g1-waf', type: 'waf', slotId: 'rack-0-1', level: 2 },
          { id: 'g1-rl', type: 'rate_limiter', slotId: 'rack-1-0', level: 2 },
          { id: 'g1-cdn', type: 'cdn', slotId: 'rack-1-2', level: 2 },
          { id: 'g1-redis', type: 'redis', slotId: 'rack-2-1', level: 2 },
          { id: 'g1-mq', type: 'queue', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'g1-waf' },
          { fromId: 'g1-waf', toId: 'g1-rl' },
          { fromId: 'g1-waf', toId: 'g1-cdn' },
          { fromId: 'g1-rl', toId: 'g1-redis' },
          { fromId: 'g1-cdn', toId: 'g1-redis' },
          { fromId: 'g1-redis', toId: 'g1-mq' },
          { fromId: 'g1-mq', toId: 'database' },
        ],
      },
      {
        id: 'arch16-mesh',
        name: 'Cách 2: Lưới Phân Tán (Edge + S3 + Kafka + Replica)',
        tag: 'Mạnh Về Dữ Liệu & Storage',
        summary: 'Kết hợp WAF + Rate Limiter, rồi tách nhánh sang Object Storage S3, Kafka và Read Replica DB.',
        pros: 'Database chính gần như được cách ly hoàn toàn khỏi đọc, media và đột biến ghi.',
        cons: 'Cần chú ý nối dây đủ mọi nhánh.',
        requiredTypes: ['waf', 'rate_limiter', 'object_storage', 'queue', 'read_replica'],
        blueprintNodes: [
          { id: 'g2-waf', type: 'waf', slotId: 'rack-0-1', level: 2 },
          { id: 'g2-rl', type: 'rate_limiter', slotId: 'rack-1-1', level: 2 },
          { id: 'g2-s3', type: 'object_storage', slotId: 'rack-2-0', level: 2 },
          { id: 'g2-mq', type: 'queue', slotId: 'rack-2-2', level: 2 },
          { id: 'g2-rep', type: 'read_replica', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'g2-waf' },
          { fromId: 'g2-waf', toId: 'g2-rl' },
          { fromId: 'g2-rl', toId: 'g2-s3' },
          { fromId: 'g2-rl', toId: 'g2-mq' },
          { fromId: 'g2-s3', toId: 'g2-rep' },
          { fromId: 'g2-mq', toId: 'g2-rep' },
          { fromId: 'g2-rep', toId: 'database' },
        ],
      },
      {
        id: 'arch16-active-active',
        name: 'Cách 3: Active-Active LB + Redis + Worker + S3',
        tag: 'Dự Phòng Đa Vùng (High Availability)',
        summary: 'Bảo vệ WAF + Limiter Lv2, LB điều phối song song qua Redis/S3 và Kafka + Worker Lv2.',
        pros: 'Không có điểm nghẽn đơn điểm (SPOF), chịu bão DDoS & Media cực hạn.',
        cons: 'Tốn chi phí vận hành cao nhất.',
        requiredTypes: ['waf', 'rate_limiter', 'cdn', 'worker', 'queue'],
        blueprintNodes: [
          { id: 'g3-waf', type: 'waf', slotId: 'rack-0-0', level: 2 },
          { id: 'g3-rl', type: 'rate_limiter', slotId: 'rack-0-2', level: 2 },
          { id: 'g3-cdn', type: 'cdn', slotId: 'rack-1-1', level: 2 },
          { id: 'g3-mq', type: 'queue', slotId: 'rack-2-0', level: 2 },
          { id: 'g3-redis', type: 'redis', slotId: 'rack-2-2', level: 2 },
          { id: 'g3-wk', type: 'worker', slotId: 'rack-3-1', level: 2 },
        ],
        blueprintEdges: [
          { fromId: 'ingress', toId: 'g3-waf' },
          { fromId: 'ingress', toId: 'g3-rl' },
          { fromId: 'g3-waf', toId: 'g3-cdn' },
          { fromId: 'g3-rl', toId: 'g3-cdn' },
          { fromId: 'g3-cdn', toId: 'g3-mq' },
          { fromId: 'g3-cdn', toId: 'g3-redis' },
          { fromId: 'g3-mq', toId: 'g3-wk' },
          { fromId: 'g3-redis', toId: 'g3-wk' },
          { fromId: 'g3-wk', toId: 'database' },
        ],
      },
    ],
    waves: [
      { waveNumber: 1, label: 'Đợt tổng lực 1', durationSec: 8, spawnIntervalSec: 0.3, weights: { read: 0.28, write: 0.24, media: 0.18, ddos: 0.18, sqli: 0.12 }, rewardBudget: 0 },
      { waveNumber: 2, label: 'Xung kích đa tầng', durationSec: 9, spawnIntervalSec: 0.22, weights: { read: 0.25, write: 0.26, media: 0.18, ddos: 0.18, sqli: 0.13 }, rewardBudget: 0 },
      { waveNumber: 3, label: 'Đỉnh cao 99.99% Uptime', durationSec: 10, spawnIntervalSec: 0.16, weights: { read: 0.25, write: 0.25, media: 0.17, ddos: 0.2, sqli: 0.13 }, rewardBudget: 0 },
      { waveNumber: 4, label: 'Cơn bão Chủ quyền Toàn cầu', durationSec: 11, spawnIntervalSec: 0.14, weights: { read: 0.23, write: 0.25, media: 0.17, ddos: 0.21, sqli: 0.14 }, rewardBudget: 0 },
    ],
  },
];

export const TRAFFIC_LEVELS: readonly TrafficLevelDef[] = [
  ...BASE_TRAFFIC_LEVELS,
  ...EXTRA_TRAFFIC_LEVELS,
];

export function createInitialNodes(level: TrafficLevelDef): InfraNode[] {
  return level.initialNodes.map((n) => ({
    ...n,
    rrCursor: 0,
    processedCount: 0,
    blockedCount: 0,
    cacheHitCount: 0,
    heat: 0,
  }));
}

export function getNodeCatalogEntry(type: PlaceableNodeType): InfraNodeCatalogEntry {
  return INFRA_NODE_CATALOG.find((e) => e.type === type)!;
}

export function getSellRefund(node: InfraNode): number {
  if (node.fixed || node.type === 'ingress' || node.type === 'database') return 0;
  const entry = getNodeCatalogEntry(node.type);
  const invested = entry.cost + (node.level === 2 ? entry.upgradeCost : 0);
  return Math.round(invested * 0.7);
}

/** Checks if adding edge fromId -> toId keeps the routing graph a valid DAG */
export function canAddEdge(
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[],
  fromId: string,
  toId: string
): { valid: boolean; reason?: string } {
  if (fromId === toId) {
    return { valid: false, reason: 'Không thể tự nối dây vào chính node đó.' };
  }
  const fromNode = nodes.find((n) => n.id === fromId);
  const toNode = nodes.find((n) => n.id === toId);
  if (!fromNode || !toNode) {
    return { valid: false, reason: 'Node nguồn hoặc đích không tồn tại.' };
  }
  if (fromNode.type === 'database') {
    return { valid: false, reason: 'Database là đích cuối, không thể nối dây đi tiếp.' };
  }
  if (toNode.type === 'ingress') {
    return { valid: false, reason: 'Không thể nối dây quay ngược vào cổng Người dùng.' };
  }
  if (edges.some((e) => e.fromId === fromId && e.toId === toId)) {
    return { valid: false, reason: 'Hai node này đã được nối dây sẵn.' };
  }

  // BFS from toId to verify fromId is not reachable (cycle check)
  const queue = [toId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === fromId) {
      return { valid: false, reason: 'Không thể nối vòng lặp khép kín (Cycle).' };
    }
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const e of edges) {
      if (e.fromId === cur) {
        queue.push(e.toId);
      }
    }
  }

  return { valid: true };
}

export function selectOutgoingEdge(
  node: InfraNode,
  edges: readonly InfraEdge[]
): { edge: InfraEdge | null; nextCursor: number } {
  const outgoing = edges.filter((e) => e.fromId === node.id);
  if (outgoing.length === 0) {
    return { edge: null, nextCursor: node.rrCursor };
  }
  const idx = node.rrCursor % outgoing.length;
  return {
    edge: outgoing[idx],
    nextCursor: (idx + 1) % outgoing.length,
  };
}

export interface NodePacketDecision {
  outcome: 'forward' | 'blocked' | 'cache_hit' | 'delivered' | 'dropped_no_route';
  addedLatencyMs: number;
  dbCpuDelta: number;
  integrityDelta: number;
  writeDampingFactor?: number; // < 1 reduces downstream POST DB load (e.g. Kafka Queue / Worker)
}

/**
 * Pure per-node packet inspection & routing outcome.
 * `roll` is a deterministic/random float in [0, 1).
 */
export function evaluatePacketAtNode(
  node: InfraNode,
  kind: PacketKind,
  roll: number,
  outgoingCount: number,
  packetWriteDamping = 1,
  heatPenaltyMult = 1
): NodePacketDecision {
  const lv = node.level;
  const h = node.heat * heatPenaltyMult;

  if (node.type === 'ingress') {
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: 5, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: 0, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'waf') {
    const latency = (lv === 2 ? 3 : 6) + Math.round(h * 6);
    if (kind === 'sqli') {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    if (kind === 'ddos') {
      const ddosBlockChance = lv === 2 ? 0.45 : 0.25;
      if (roll < ddosBlockChance) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'rate_limiter') {
    const latency = (lv === 2 ? 2 : 5) + Math.round(h * 5);
    if (kind === 'ddos') {
      const blockRate = lv === 2 ? 0.99 : 0.91;
      if (roll < blockRate) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'cdn') {
    const latency = (lv === 2 ? 3 : 6) + Math.round(h * 6);
    if (kind === 'media') {
      const hitChance = lv === 2 ? 0.96 : 0.87;
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'read') {
      const staticReadHit = lv === 2 ? 0.42 : 0.27;
      if (roll < staticReadHit) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'ddos') {
      const edgeDrop = lv === 2 ? 0.42 : 0.26;
      if (roll < edgeDrop) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'redis') {
    const latency = (lv === 2 ? 5 : 9) + Math.round(h * (lv === 2 ? 6 : 12));
    if (kind === 'read') {
      const hitChance = lv === 2 ? 0.9 : 0.75;
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'load_balancer') {
    const latency = lv === 2 ? 2 : 4;
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'app') {
    const heatPenalty = Math.round(h * (lv === 2 ? 24 : 44));
    const latency = (lv === 2 ? 10 : 15) + heatPenalty;
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'queue') {
    const latency = (lv === 2 ? 5 : 9) + Math.round(h * (lv === 2 ? 8 : 16));
    const damping = lv === 2 ? 0.34 : 0.48;
    return outgoingCount > 0
      ? {
          outcome: 'forward',
          addedLatencyMs: latency,
          dbCpuDelta: 0,
          integrityDelta: 0,
          writeDampingFactor: damping,
        }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'worker') {
    const latency = (lv === 2 ? 6 : 11) + Math.round(h * (lv === 2 ? 9 : 18));
    const damping = lv === 2 ? 0.64 : 0.78;
    return outgoingCount > 0
      ? {
          outcome: 'forward',
          addedLatencyMs: latency,
          dbCpuDelta: 0,
          integrityDelta: 0,
          writeDampingFactor: damping,
        }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'read_replica') {
    const latency = (lv === 2 ? 7 : 12) + Math.round(h * (lv === 2 ? 10 : 18));
    if (kind === 'read') {
      const offloadChance = lv === 2 ? 0.92 : 0.77;
      if (roll < offloadChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'object_storage') {
    const latency = (lv === 2 ? 6 : 10) + Math.round(h * (lv === 2 ? 7 : 14));
    if (kind === 'media') {
      const offloadChance = lv === 2 ? 0.97 : 0.9;
      if (roll < offloadChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  // Database terminal node
  const meta = PACKET_META[kind];
  const effectiveCpu =
    kind === 'write'
      ? Math.max(2.4, meta.dbCpuLoad * packetWriteDamping)
      : meta.dbCpuLoad;
  return {
    outcome: 'delivered',
    addedLatencyMs: (kind === 'write' ? 24 : kind === 'media' ? 22 : 15) + Math.round(h * 12),
    dbCpuDelta: effectiveCpu,
    integrityDelta: -meta.integrityPenalty,
  };
}

export function pickWeightedPacketKind(
  weights: Record<PacketKind, number>,
  roll: number
): PacketKind {
  const order: readonly PacketKind[] = ['read', 'write', 'media', 'ddos', 'sqli'];
  let cumulative = 0;
  for (const kind of order) {
    cumulative += weights[kind] ?? 0;
    if (roll <= cumulative) return kind;
  }
  return 'read';
}

export function hasPathToDatabase(
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[]
): boolean {
  const queue = ['ingress'];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === 'database') return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const e of edges) {
      if (e.fromId === cur && nodes.some((n) => n.id === e.toId)) {
        queue.push(e.toId);
      }
    }
  }
  return false;
}

export interface ArchitectureAnalysis {
  hasValidPath: boolean;
  connectedNodeTypes: PlaceableNodeType[];
  matchedApproaches: ArchitectureApproach[];
  detectedPatternLabel: string;
  diagnostics: string[];
  score: number;
}

/**
 * Computes which nodes are actually wired on any valid path from ingress -> database,
 * detects which architectural approaches the player achieved, and generates live feedback.
 */
export function analyzeArchitectureDesign(
  level: TrafficLevelDef,
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[]
): ArchitectureAnalysis {
  const hasValidPath = hasPathToDatabase(nodes, edges);
  const forwardReachable = new Set<string>();
  const q1 = ['ingress'];
  while (q1.length > 0) {
    const cur = q1.shift()!;
    if (forwardReachable.has(cur)) continue;
    forwardReachable.add(cur);
    for (const e of edges) {
      if (e.fromId === cur) q1.push(e.toId);
    }
  }

  const backwardReachable = new Set<string>();
  const q2 = ['database'];
  while (q2.length > 0) {
    const cur = q2.shift()!;
    if (backwardReachable.has(cur)) continue;
    backwardReachable.add(cur);
    for (const e of edges) {
      if (e.toId === cur) q2.push(e.fromId);
    }
  }

  const activeTypes = new Set<PlaceableNodeType>();
  for (const n of nodes) {
    if (
      n.type !== 'ingress' &&
      n.type !== 'database' &&
      forwardReachable.has(n.id) &&
      backwardReachable.has(n.id)
    ) {
      activeTypes.add(n.type);
    }
  }

  const connectedNodeTypes = Array.from(activeTypes);
  const matchedApproaches = hasValidPath
    ? level.approaches.filter((ap) => ap.requiredTypes.every((t) => activeTypes.has(t)))
    : [];

  // Calculate aggregate traffic characteristics across level waves
  let avgSqli = 0;
  let avgDdos = 0;
  let avgMedia = 0;
  let avgWrite = 0;
  let avgRead = 0;
  for (const w of level.waves) {
    avgSqli += w.weights.sqli;
    avgDdos += w.weights.ddos;
    avgMedia += w.weights.media;
    avgWrite += w.weights.write;
    avgRead += w.weights.read;
  }
  const nW = Math.max(1, level.waves.length);
  avgSqli /= nW;
  avgDdos /= nW;
  avgMedia /= nW;
  avgWrite /= nW;
  avgRead /= nW;

  const diagnostics: string[] = [];
  if (!hasValidPath) {
    diagnostics.push('Chưa có đường dây hoàn chỉnh nối từ Users → Database.');
  }
  if (avgSqli >= 0.08 && !activeTypes.has('waf')) {
    diagnostics.push('Cảnh báo SQLi: Màn này có tấn công SQL Injection — cần đặt WAF [1] trên đường dây!');
  }
  if (avgDdos >= 0.14 && !activeTypes.has('rate_limiter') && !activeTypes.has('cdn')) {
    diagnostics.push('Cảnh báo DDoS: Bão Bot lớn — nên bổ sung Rate Limiter [2] hoặc CDN [3] ở cửa ngõ.');
  }
  if (avgMedia >= 0.25 && !activeTypes.has('cdn') && !activeTypes.has('object_storage')) {
    diagnostics.push('Tối ưu Media: Có nhiều file ảnh/video — nên tách qua CDN [3] hoặc Object Storage S3 [0].');
  }
  if (avgWrite >= 0.35 && !activeTypes.has('queue')) {
    diagnostics.push('Tối ưu Ghi: Nhiều request POST nặng — đặt Kafka/MQ [7] + Worker để giảm tải DB.');
  }
  if (avgRead >= 0.45 && !activeTypes.has('redis') && !activeTypes.has('read_replica') && !activeTypes.has('cdn')) {
    diagnostics.push('Tối ưu Đọc: Nhiều request GET — thử thêm Redis [5] hoặc Read Replica [9].');
  }

  let detectedPatternLabel = 'Kiến trúc Đơn Tuyến Cơ Bản';
  if (!hasValidPath) {
    detectedPatternLabel = 'Mạng Chưa Kết Nối';
  } else if (matchedApproaches.length > 0) {
    detectedPatternLabel = matchedApproaches[0].name;
  } else if (activeTypes.has('waf') && activeTypes.has('rate_limiter') && activeTypes.has('queue')) {
    detectedPatternLabel = 'Phòng Thủ Đa Tầng + Event Queue';
  } else if (activeTypes.has('redis') && activeTypes.has('queue')) {
    detectedPatternLabel = 'CQRS Cache + Async Queue';
  } else if (activeTypes.has('cdn') && activeTypes.has('object_storage')) {
    detectedPatternLabel = 'Edge CDN + Object Storage';
  } else if (activeTypes.has('load_balancer') && connectedNodeTypes.length >= 2) {
    detectedPatternLabel = 'Cân Bằng Tải Phân Tán';
  } else if (activeTypes.has('redis')) {
    detectedPatternLabel = 'Cache-Aside Pattern';
  } else if (activeTypes.has('queue')) {
    detectedPatternLabel = 'Queue Load Leveling';
  }

  let score = hasValidPath ? 40 : 10;
  if (matchedApproaches.length > 0) score += 35;
  else score += Math.min(25, connectedNodeTypes.length * 8);
  if (diagnostics.length === 0 && hasValidPath) score += 25;
  else score += Math.max(0, 15 - diagnostics.length * 5);

  return {
    hasValidPath,
    connectedNodeTypes,
    matchedApproaches,
    detectedPatternLabel,
    diagnostics,
    score: Math.min(100, score),
  };
}

export interface CritiqueItem {
  category: 'performance' | 'security' | 'cost' | 'architecture' | 'reliability';
  severity: 'critical' | 'warning';
  title: string;
  reason: string;
  suggestion: string;
}

export interface SolutionEvaluationInput {
  level: TrafficLevelDef;
  nodes: readonly InfraNode[];
  edges: readonly InfraEdge[];
  avgLatencyMs: number;
  peakDbCpu: number;
  breachedAttacks: number;
  remainingBudget: number;
  strictSecurity?: boolean;
  modeName?: string;
}

export interface SolutionEvaluation {
  isOptimal: boolean;
  grade: 'S' | 'A' | 'B' | 'C';
  totalScore: number;
  pillars: {
    performance: number; // 0..100
    reliability: number; // 0..100
    costEfficiency: number; // 0..100
    architectureFit: number; // 0..100
  };
  verdictTitle: string;
  verdictSummary: string;
  strengths: string[];
  whyNotOptimal: CritiqueItem[];
  matchedApproachNames: string[];
}

export function evaluateSolutionOptimization(
  input: SolutionEvaluationInput
): SolutionEvaluation {
  const { level, nodes, edges, avgLatencyMs, peakDbCpu, breachedAttacks, strictSecurity, modeName } = input;
  const analysis = analyzeArchitectureDesign(level, nodes, edges);

  const forwardReachable = new Set<string>();
  const q1 = ['ingress'];
  while (q1.length > 0) {
    const cur = q1.shift()!;
    if (forwardReachable.has(cur)) continue;
    forwardReachable.add(cur);
    for (const e of edges) {
      if (e.fromId === cur) q1.push(e.toId);
    }
  }
  const backwardReachable = new Set<string>();
  const q2 = ['database'];
  while (q2.length > 0) {
    const cur = q2.shift()!;
    if (backwardReachable.has(cur)) continue;
    backwardReachable.add(cur);
    for (const e of edges) {
      if (e.toId === cur) q2.push(e.fromId);
    }
  }

  const activeNodes = nodes.filter(
    (n) => !n.fixed && forwardReachable.has(n.id) && backwardReachable.has(n.id)
  );
  const deadNodes = nodes.filter(
    (n) => !n.fixed && (!forwardReachable.has(n.id) || !backwardReachable.has(n.id))
  );
  const activeTypes = new Set(activeNodes.map((n) => n.type));

  // Aggregate traffic mix
  let avgSqli = 0;
  let avgDdos = 0;
  let avgMedia = 0;
  let avgWrite = 0;
  let avgRead = 0;
  for (const w of level.waves) {
    avgSqli += w.weights.sqli;
    avgDdos += w.weights.ddos;
    avgMedia += w.weights.media;
    avgWrite += w.weights.write;
    avgRead += w.weights.read;
  }
  const nW = Math.max(1, level.waves.length);
  avgSqli /= nW;
  avgDdos /= nW;
  avgMedia /= nW;
  avgWrite /= nW;
  avgRead /= nW;

  const whyNotOptimal: CritiqueItem[] = [];
  const strengths: string[] = [];

  if (!analysis.hasValidPath) {
    whyNotOptimal.push({
      category: 'architecture',
      severity: 'critical',
      title: 'Mạng chưa thông tuyến tới Database',
      reason: 'Không có đường dây liên thông từ Users (Ingress) tới Database Cluster nên dịch vụ không thể phản hồi.',
      suggestion: 'Dùng công cụ [W] Nối Dây để kết nối từ Users → các node xử lý → Database.',
    });
  }

  // 1. Dead / disconnected nodes wasting budget
  if (deadNodes.length > 0) {
    whyNotOptimal.push({
      category: 'cost',
      severity: 'warning',
      title: `Lãng phí ${deadNodes.length} node chưa nối dây vào luồng`,
      reason: `Bạn đã chi ngân sách đặt ${deadNodes.length} thành phần nhưng không có gói tin nào đi qua chúng.`,
      suggestion: 'Nối dây qua các node này hoặc dùng nút "Tháo" để thu hồi 70% chi phí.',
    });
  }

  // 2. Check Load Balancer connected to only 1 branch (no real fan-out)
  for (const n of activeNodes) {
    if (n.type === 'load_balancer') {
      const outs = edges.filter((e) => e.fromId === n.id);
      if (outs.length <= 1) {
        whyNotOptimal.push({
          category: 'cost',
          severity: 'warning',
          title: 'Load Balancer chỉ nối 1 nhánh (chưa tận dụng chia tải)',
          reason: 'Load Balancer Round-Robin chỉ phát huy tác dụng khi chia đều lưu lượng sang từ 2 nhánh song song trở lên.',
          suggestion: 'Dùng [W] Nối Dây từ Load Balancer ra thêm 1 App Server / Cache / Replica thứ hai.',
        });
        break;
      }
    }
  }

  // 3. Check security flaws
  if (avgSqli >= 0.06 && !activeTypes.has('waf')) {
    whyNotOptimal.push({
      category: 'security',
      severity: 'critical',
      title: 'Lỗ hổng SQL Injection nghiêm trọng',
      reason: 'Hoàn cảnh hoặc chế độ chơi này có mã độc SQLi xâm nhập. Thiếu WAF khiến dữ liệu bị tổn hại và DB tốn CPU xử lý truy vấn độc.',
      suggestion: 'Đặt WAF Firewall [1] ngay tầng Edge sau Users để chặn 100% gói SQLi.',
    });
  } else if (breachedAttacks > (strictSecurity ? 0 : 1)) {
    whyNotOptimal.push({
      category: 'security',
      severity: strictSecurity ? 'critical' : 'warning',
      title: `Còn ${breachedAttacks} gói tấn công lọt tới Database`,
      reason: 'Bot DDoS hoặc SQLi đã xuyên qua tầng biên do thiếu lá chắn đầu vào hoặc chưa nâng cấp Rate Limiter lên Lv2.',
      suggestion: 'Đặt Rate Limiter [2] + WAF [1] ngay sau Users và nâng cấp lên Lv2 (chặn 99% DDoS).',
    });
  }

  if (avgDdos >= 0.12 && !activeTypes.has('rate_limiter') && !activeTypes.has('cdn')) {
    whyNotOptimal.push({
      category: 'security',
      severity: 'critical',
      title: 'Thiếu lớp cắt bão Bot DDoS',
      reason: 'Bão request rác đang dội thẳng vào App/Database làm tăng đột biến CPU và độ trễ của người dùng thật.',
      suggestion: 'Bổ sung Rate Limiter [2] (chặn 91–99% DDoS) hoặc Edge CDN [3].',
    });
  }

  // 4. Context-specific architectural optimality
  if (avgMedia >= 0.24 && !activeTypes.has('cdn') && !activeTypes.has('object_storage')) {
    whyNotOptimal.push({
      category: 'architecture',
      severity: 'critical',
      title: 'Chưa tách lưu lượng Media/File khỏi Database chính',
      reason: 'Ảnh và video chiếm tỷ trọng lớn trong màn này; đẩy trực tiếp vào DB quan hệ gây nghẽn I/O nghiêm trọng.',
      suggestion: 'Dùng Edge CDN [3] ở tầng biên và/hoặc Object Storage S3 [0] trước Database.',
    });
  }

  if (avgWrite >= 0.34 && !activeTypes.has('queue')) {
    whyNotOptimal.push({
      category: 'architecture',
      severity: 'warning',
      title: 'Xử lý ghi nặng đồng bộ gây áp lực đột biến lên DB',
      reason: 'Tỷ lệ POST ghi dữ liệu cao đang đập thẳng vào DB thay vì được làm phẳng theo hàng đợi.',
      suggestion: 'Chèn Message Queue (Kafka/MQ) [7] + Worker [8] để hấp thụ xung ghi giảm 55–70% tải DB.',
    });
  }

  if (
    avgRead >= 0.38 &&
    !activeTypes.has('redis') &&
    !activeTypes.has('read_replica') &&
    !activeTypes.has('cdn')
  ) {
    whyNotOptimal.push({
      category: 'performance',
      severity: 'warning',
      title: 'Chưa có cơ chế Cache hoặc Read Replica cho truy vấn Đọc',
      reason: 'Mọi request GET lặp lại đều phải truy vấn trực tiếp Database gốc gây lãng phí tài nguyên.',
      suggestion: 'Đặt Redis Cache [5] hoặc Read Replica [9] để gánh 75–92% lượng đọc.',
    });
  }

  // 5. Runtime performance & DB CPU checks
  if (avgLatencyMs > level.targetSlaMs) {
    whyNotOptimal.push({
      category: 'performance',
      severity: avgLatencyMs > level.targetSlaMs * 1.25 ? 'critical' : 'warning',
      title: `Độ trễ ${avgLatencyMs}ms vượt ngưỡng SLA (${level.targetSlaMs}ms)`,
      reason: 'Đường đi qua quá nhiều bước tuần tự chậm hoặc node đơn tuyến bị nóng (heat cao) không kịp chia tải.',
      suggestion: 'Dùng Redis/CDN để trả kết quả sớm ở biên, thêm Load Balancer chia nhánh hoặc nâng cấp node lên Lv2.',
    });
  }

  if (peakDbCpu >= 76) {
    whyNotOptimal.push({
      category: 'reliability',
      severity: peakDbCpu >= 85 ? 'critical' : 'warning',
      title: `Đỉnh CPU Database quá cao (${Math.round(peakDbCpu)}%)`,
      reason: 'Hệ thống tuy chưa sập nhưng sát ngưỡng nghẽn 100%, rất dễ trả lỗi 502 Bad Gateway khi xung tải kéo dài.',
      suggestion: 'Giảm tải DB bằng bộ ba: Redis/Replica (cho GET) + Kafka (cho POST) + CDN/S3 (cho MEDIA).',
    });
  }

  // Strengths
  if (analysis.matchedApproaches.length > 0) {
    strengths.push(`Áp dụng chuẩn mô hình: ${analysis.matchedApproaches.map((a) => a.name).join(' · ')}`);
  }
  if (avgLatencyMs <= level.targetSlaMs && analysis.hasValidPath) {
    strengths.push(`Đạt SLA độ trễ (${avgLatencyMs}ms ≤ ${level.targetSlaMs}ms).`);
  }
  if (peakDbCpu < 72 && analysis.hasValidPath) {
    strengths.push(`Database luôn mát và an toàn (Đỉnh CPU chỉ ${Math.round(peakDbCpu)}%).`);
  }
  if (breachedAttacks === 0 && (avgSqli > 0 || avgDdos > 0)) {
    strengths.push('Phòng thủ tuyệt đối: Không để lọt gói tấn công gây hại xuống DB.');
  }
  if (deadNodes.length === 0 && analysis.hasValidPath) {
    strengths.push('Không có thành phần dư thừa lãng phí ngân sách.');
  }

  // Compute 4 pillars (tighter grading!)
  const latDelta = Math.max(0, avgLatencyMs - level.targetSlaMs);
  const performance = analysis.hasValidPath
    ? Math.max(20, Math.min(100, Math.round(100 - latDelta * 1.75 - (avgRead >= 0.38 && !activeTypes.has('redis') && !activeTypes.has('read_replica') ? 16 : 0))))
    : 10;

  const reliability = analysis.hasValidPath
    ? Math.max(
        15,
        Math.min(
          100,
          Math.round(
            100 -
              Math.max(0, peakDbCpu - 54) * 1.45 -
              breachedAttacks * (strictSecurity ? 9 : 6) -
              (avgSqli >= 0.06 && !activeTypes.has('waf') ? 28 : 0)
          )
        )
      )
    : 10;

  const costEfficiency = analysis.hasValidPath
    ? Math.max(25, Math.min(100, Math.round(100 - deadNodes.length * 20)))
    : 20;

  const architectureFit = analysis.score;

  const hasCritical = whyNotOptimal.some((c) => c.severity === 'critical');

  // Ensure non-optimal solutions always explain why they aren't S-grade yet
  if (
    analysis.hasValidPath &&
    whyNotOptimal.length === 0 &&
    (analysis.matchedApproaches.length === 0 ||
      performance * 0.28 + reliability * 0.3 + costEfficiency * 0.14 + architectureFit * 0.28 < 90)
  ) {
    if (analysis.matchedApproaches.length === 0) {
      whyNotOptimal.push({
        category: 'architecture',
        severity: 'warning',
        title: 'Chưa tối ưu đúng mẫu kiến trúc chuyên biệt cho hoàn cảnh này',
        reason: `Kiến trúc hiện tại xử lý được tải nhưng chưa hội tụ đủ các thành phần cốt lõi của một trong ${level.approaches.length} phương án chuẩn cho "${level.domain}".`,
        suggestion: `Mở mục "Các Cách Thiết Kế" để tham khảo ${level.approaches.map((a) => a.name).join(' hoặc ')}.`,
      });
    } else if (peakDbCpu >= 66) {
      whyNotOptimal.push({
        category: 'reliability',
        severity: 'warning',
        title: `Biên an toàn CPU Database còn mỏng (Đỉnh ${Math.round(peakDbCpu)}%)`,
        reason: 'Mặc dù chưa chạm ngưỡng báo động đỏ, Database vẫn phải gánh nhiều truy vấn có thể giảm tải thêm.',
        suggestion: 'Nâng cấp các node đệm/hàng đợi (Redis, CDN, Kafka) lên Lv2 để đưa đỉnh CPU về dưới 62%.',
      });
    } else {
      whyNotOptimal.push({
        category: 'performance',
        severity: 'warning',
        title: 'Vẫn còn dư địa giảm độ trễ phản hồi (Latency)',
        reason: `Độ trễ trung bình ${avgLatencyMs}ms đã đạt SLA (${level.targetSlaMs}ms) nhưng chưa tối ưu tuyệt đối như cấp S.`,
        suggestion: 'Rút gọn số bước nhảy tuần tự hoặc nâng cấp node xử lý chính lên Lv2.',
      });
    }
  }

  const totalScore = Math.round(
    performance * 0.28 + reliability * 0.3 + costEfficiency * 0.14 + architectureFit * 0.28
  );

  const isOptimal =
    analysis.hasValidPath && !hasCritical && whyNotOptimal.length === 0 && totalScore >= 90;

  const grade: 'S' | 'A' | 'B' | 'C' =
    totalScore >= 92 && !hasCritical && whyNotOptimal.length === 0
      ? 'S'
      : totalScore >= 82 && !hasCritical
        ? 'A'
        : totalScore >= 65
          ? 'B'
          : 'C';

  const modeTag = modeName ? ` (${modeName})` : '';
  const verdictTitle = isOptimal
    ? `Kiến Trúc Tối Ưu Toàn Diện${modeTag}!`
    : grade === 'A'
      ? `Giải Pháp Tốt${modeTag} — Còn Có Thể Tối Ưu Thêm`
      : `Giải Pháp Chưa Tối Ưu${modeTag}`;

  const verdictSummary = isOptimal
    ? `Bạn đã phối hợp đúng kiến trúc cho bối cảnh "${level.domain}"${modeTag}, đạt độ trễ ${avgLatencyMs}ms và giữ đỉnh CPU DB ở mức an toàn ${Math.round(peakDbCpu)}%.`
    : `Kiến trúc hiện tại vẫn vận hành nhưng còn ${whyNotOptimal.length} điểm nghẽn hoặc lỗ hổng cần cải thiện để đạt chuẩn Production${modeTag}.`;

  return {
    isOptimal,
    grade,
    totalScore,
    pillars: {
      performance,
      reliability,
      costEfficiency,
      architectureFit,
    },
    verdictTitle,
    verdictSummary,
    strengths,
    whyNotOptimal,
    matchedApproachNames: analysis.matchedApproaches.map((a) => a.name),
  };
}

