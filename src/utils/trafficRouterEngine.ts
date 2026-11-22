export type PacketKind = 'read' | 'write' | 'media' | 'ddos' | 'sqli';

export type InfraNodeCategory = 'edge' | 'routing_cache' | 'compute_async' | 'data_db';

export type InfraNodeType =
  | 'ingress'
  | 'waf'
  | 'rate_limiter'
  | 'ddos_scrubber'
  | 'cdn'
  | 'api_gateway'
  | 'load_balancer'
  | 'varnish'
  | 'redis'
  | 'app'
  | 'microservice_auth'
  | 'search_engine'
  | 'queue'
  | 'stream_processor'
  | 'worker'
  | 'batch_etl'
  | 'read_replica'
  | 'object_storage'
  | 'primary_db'
  | 'nosql_db'
  | 'timeseries_db'
  | 'database';

export type PlaceableNodeType = Exclude<InfraNodeType, 'ingress' | 'database'>;

export interface InfraNodeCatalogEntry {
  type: PlaceableNodeType;
  hotkey: string;
  name: string;
  shortName: string;
  category: InfraNodeCategory;
  layerHint: string;
  recommendedCols: readonly number[];
  isDbSink?: boolean;
  cost: number;
  upgradeCost: number;
  color: string;
  roleSummary: string;
  shortMetricTag: string;
  pros: string;
  cons: string;
  comboHint: string;
  strengthsByPacket: Record<PacketKind, 'strong' | 'neutral' | 'weak'>;
}

export interface RackSlot {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
}

export type EdgeRouteRule = 'all' | 'read' | 'write' | 'media';
export type LimiterTuneMode = 'lenient' | 'standard' | 'strict';
export type CacheTtlMode = 'short' | 'long';
export type QueueCapacityMode = 'small' | 'large';
export type DbPoolMode = 'balanced' | 'high_pool';

export interface InfraNode {
  id: string;
  type: InfraNodeType;
  x: number;
  y: number;
  slotId?: string;
  fixed?: boolean;
  level: 1 | 2 | 3;
  rrCursor: number;
  processedCount: number;
  blockedCount: number;
  cacheHitCount: number;
  droppedCount?: number;
  heat: number; // 0..1 visual load pulse
  localDbCpu?: number; // per-DB CPU % for multi-DB sinks
  avgNodeLatencyMs?: number;
  queueBuffer?: number; // buffered POST requests inside Queue/Stream during simulation
  limiterMode?: LimiterTuneMode;
  cacheTtl?: CacheTtlMode;
  queueCapacityMode?: QueueCapacityMode;
  dbPoolMode?: DbPoolMode;
}

export interface InfraEdge {
  id: string;
  fromId: string;
  toId: string;
  routeRule?: EdgeRouteRule;
}

export interface BlueprintNodeSpec {
  id: string;
  type: PlaceableNodeType;
  slotId: string;
  level?: 1 | 2 | 3;
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
  // Column 4: Multi-Database Shards / Polyglot Sinks (x = 844, alongside central DB CLUSTER at y=250)
  { id: 'rack-4-0', col: 4, row: 0, x: 844, y: 112 },
  { id: 'rack-4-2', col: 4, row: 2, x: 844, y: 388 },
];

export function isDatabaseSinkType(type: InfraNodeType): boolean {
  return (
    type === 'database' ||
    type === 'primary_db' ||
    type === 'nosql_db' ||
    type === 'timeseries_db'
  );
}

export function getDatabaseSinkNodes(nodes: readonly InfraNode[]): InfraNode[] {
  return nodes.filter((n) => isDatabaseSinkType(n.type));
}

export const INFRA_NODE_CATALOG: readonly InfraNodeCatalogEntry[] = [
  // 1. EDGE & SECURITY
  {
    type: 'waf',
    hotkey: '1',
    name: 'WAF Firewall',
    shortName: 'WAF',
    category: 'edge',
    layerHint: 'Edge · Bảo vệ',
    recommendedCols: [0],
    cost: 80,
    upgradeCost: 90,
    color: '#A855F7',
    roleSummary: 'Chặn 100% SQLi, lọc DDoS',
    shortMetricTag: '100% SQLi · L7',
    pros: 'Triệt tiêu 100% payload SQL Injection & XSS ngay ở lớp ứng dụng.',
    cons: 'Tăng nhẹ 2–6ms kiểm tra gói và chỉ lọc được một phần bão DDoS L4.',
    comboHint: 'Đặt trước Rate Limiter / Scrubber để dựng khiên Zero-Trust.',
    strengthsByPacket: { read: 'neutral', write: 'neutral', media: 'neutral', ddos: 'neutral', sqli: 'strong' },
  },
  {
    type: 'rate_limiter',
    hotkey: '2',
    name: 'Rate Limiter',
    shortName: 'Limiter',
    category: 'edge',
    layerHint: 'Edge · Bảo vệ',
    recommendedCols: [0],
    cost: 70,
    upgradeCost: 85,
    color: '#F43F5E',
    roleSummary: 'Cắt 95% bão DDoS burst',
    shortMetricTag: '95% DDoS · Burst',
    pros: 'Cắt 91–99% bot spam & brute-force theo ngưỡng Token Bucket.',
    cons: 'Chế độ Siết Chặt có thể drop nhầm 5% POST thật khi spike nóng.',
    comboHint: 'Ghép với WAF + Redis Token Store cho API Auth/Flash Sale.',
    strengthsByPacket: { read: 'neutral', write: 'neutral', media: 'neutral', ddos: 'strong', sqli: 'weak' },
  },
  {
    type: 'ddos_scrubber',
    hotkey: 'Q',
    name: 'DDoS Scrubber L4/L7',
    shortName: 'Scrubber',
    category: 'edge',
    layerHint: 'Edge · Bảo vệ',
    recommendedCols: [0],
    cost: 90,
    upgradeCost: 100,
    color: '#E11D48',
    roleSummary: 'Hấp thụ Botnet 99% L4/L7',
    shortMetricTag: '99% Botnet · BGP',
    pros: 'Làm sạch bão Botnet quy mô cực lớn trước khi chạm vào Gateway/LB.',
    cons: 'Độ trễ kiểm tra sâu hơn Limiter thường khi chưa lên Lv.2/Lv.3.',
    comboHint: 'Kết hợp CDN + Scrubber trong các đợt Cyber Siege / Chaos.',
    strengthsByPacket: { read: 'neutral', write: 'neutral', media: 'neutral', ddos: 'strong', sqli: 'neutral' },
  },
  {
    type: 'cdn',
    hotkey: '3',
    name: 'Edge CDN',
    shortName: 'CDN',
    category: 'edge',
    layerHint: 'Biên mạng',
    recommendedCols: [0, 1],
    cost: 85,
    upgradeCost: 95,
    color: '#EC4899',
    roleSummary: 'Offload 92% Media & tĩnh',
    shortMetricTag: '92% Media · Edge',
    pros: 'Phân phối 87–98% ảnh/video ở biên gần user và cản bớt DDoS.',
    cons: 'Không cache được truy vấn ghi POST động.',
    comboHint: 'Combo CDN + S3/MinIO: tăng thêm hiệu suất offload Media & giảm tải gốc.',
    strengthsByPacket: { read: 'neutral', write: 'weak', media: 'strong', ddos: 'neutral', sqli: 'weak' },
  },

  // 2. GATEWAY, ROUTING & CACHE
  {
    type: 'api_gateway',
    hotkey: 'E',
    name: 'API Gateway',
    shortName: 'API GW',
    category: 'routing_cache',
    layerHint: 'Gateway · Định tuyến',
    recommendedCols: [0, 1],
    cost: 75,
    upgradeCost: 85,
    color: '#6366F1',
    roleSummary: 'Gom API, chặn SQLi/Bot nhẹ',
    shortMetricTag: 'Router · Auth/L7',
    pros: 'Định tuyến thông minh, xác thực JWT và lọc một phần payload xấu.',
    cons: 'Nếu không chia tải hoặc cache phía sau dễ thành điểm nghẽn đơn.',
    comboHint: 'Nối ra các nhánh chuyên biệt GET / POST / MEDIA bằng [R] Luật Dây.',
    strengthsByPacket: { read: 'strong', write: 'neutral', media: 'neutral', ddos: 'neutral', sqli: 'neutral' },
  },
  {
    type: 'load_balancer',
    hotkey: '4',
    name: 'Load Balancer L7',
    shortName: 'LB (L7)',
    category: 'routing_cache',
    layerHint: 'Điều phối',
    recommendedCols: [1],
    cost: 65,
    upgradeCost: 75,
    color: '#3B82F6',
    roleSummary: 'Chia tải đều đa nhánh',
    shortMetricTag: 'Round-Robin · 2ms',
    pros: 'Cân bằng tải Round-Robin sang nhiều App API hoặc nhiều DB Shard.',
    cons: 'Vô tác dụng nếu chỉ nối ra 1 nhánh duy nhất (SPOF).',
    comboHint: 'Combo Multi-DB: Nối LB/App tới 2+ Database Shard để chia đôi CPU DB.',
    strengthsByPacket: { read: 'strong', write: 'strong', media: 'strong', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'varnish',
    hotkey: 'V',
    name: 'Varnish HTTP Cache',
    shortName: 'Varnish',
    category: 'routing_cache',
    layerHint: 'Bộ đệm HTTP',
    recommendedCols: [1],
    cost: 75,
    upgradeCost: 85,
    color: '#0EA5E9',
    roleSummary: 'Page Cache 80% GET tĩnh',
    shortMetricTag: 'HTTP Cache · 4ms',
    pros: 'Trả nguyên trang HTML/JSON GET cực nhanh trong RAM trước App API.',
    cons: 'Không phục vụ được dữ liệu cá nhân hóa theo user hoặc POST ghi.',
    comboHint: 'Combo Cache→Compute: đặt trước App API giảm mạnh tải xử lý đọc.',
    strengthsByPacket: { read: 'strong', write: 'weak', media: 'neutral', ddos: 'neutral', sqli: 'weak' },
  },
  {
    type: 'redis',
    hotkey: '5',
    name: 'Redis In-Memory',
    shortName: 'Redis',
    category: 'routing_cache',
    layerHint: 'Bộ đệm RAM',
    recommendedCols: [1, 2],
    cost: 85,
    upgradeCost: 95,
    color: '#06B6D4',
    roleSummary: 'Cache GET ~85% hit',
    shortMetricTag: 'RAM Hit 85% · 5ms',
    pros: 'Đáp ứng 75–94% GET lặp lại ngay trong RAM với 0% tải Database.',
    cons: 'Cần chỉnh TTL hợp lý; cache miss diện rộng (Stampede) sẽ dội về DB.',
    comboHint: 'Combo Redis → App API (hoặc Elastic) giúp giảm trễ đọc toàn tuyến.',
    strengthsByPacket: { read: 'strong', write: 'weak', media: 'weak', ddos: 'weak', sqli: 'weak' },
  },

  // 3. COMPUTE, SEARCH & ASYNC PIPELINE
  {
    type: 'app',
    hotkey: '6',
    name: 'App API Server',
    shortName: 'App API',
    category: 'compute_async',
    layerHint: 'Xử lý nghiệp vụ',
    recommendedCols: [2],
    cost: 75,
    upgradeCost: 85,
    color: '#10B981',
    roleSummary: 'Xử lý logic API đa luồng',
    shortMetricTag: 'Compute · REST',
    pros: 'Xử lý nghiệp vụ linh hoạt, scale ngang song song qua Load Balancer.',
    cons: 'Dễ nóng & nghẽn độ trễ (+44ms) nếu dồn tải không có Cache/Queue.',
    comboHint: 'Ghép sau Redis/Varnish và đẩy POST nặng sang Kafka/MQ.',
    strengthsByPacket: { read: 'neutral', write: 'neutral', media: 'weak', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'microservice_auth',
    hotkey: 'U',
    name: 'Auth Microservice',
    shortName: 'Auth Svc',
    category: 'compute_async',
    layerHint: 'Tách dịch vụ Auth',
    recommendedCols: [2],
    cost: 80,
    upgradeCost: 90,
    color: '#34D399',
    roleSummary: 'Xác thực JWT & chặn SQLi nhẹ',
    shortMetricTag: 'JWT/OAuth · 9ms',
    pros: 'Tách luồng xác thực khỏi App chính, tự lọc 65% SQLi bất thường.',
    cons: 'Không thay thế được WAF chuyên dụng với chiến dịch Zero-Day.',
    comboHint: 'Đi cùng Redis Session Store để xác thực token dưới 10ms.',
    strengthsByPacket: { read: 'strong', write: 'neutral', media: 'weak', ddos: 'neutral', sqli: 'neutral' },
  },
  {
    type: 'search_engine',
    hotkey: 'F',
    name: 'Elasticsearch Index',
    shortName: 'Elastic',
    category: 'compute_async',
    layerHint: 'Tìm kiếm & Lọc',
    recommendedCols: [2, 3],
    cost: 90,
    upgradeCost: 100,
    color: '#2DD4BF',
    roleSummary: 'Gánh 82% GET tìm kiếm nặng',
    shortMetricTag: 'Full-Text · 8ms',
    pros: 'Xử lý truy vấn lọc, tìm kiếm, gợi ý phức tạp thay SQL LIKE chậm chạp.',
    cons: 'Chiếm bộ nhớ heap khi index write lớn.',
    comboHint: 'Đặt sau Redis hoặc LB cho luồng GET tìm kiếm sản phẩm/bài viết.',
    strengthsByPacket: { read: 'strong', write: 'weak', media: 'weak', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'queue',
    hotkey: '7',
    name: 'Kafka / Message Queue',
    shortName: 'Kafka/MQ',
    category: 'compute_async',
    layerHint: 'Hàng đợi Async',
    recommendedCols: [2, 3],
    cost: 90,
    upgradeCost: 100,
    color: '#F97316',
    roleSummary: 'Đệm & làm mượt POST',
    shortMetricTag: 'Async Buffer · -60% DB',
    pros: 'Hấp thụ xung ghi POST vào buffer và xả đều giảm 52–72% tải DB.',
    cons: 'Hàng đợi nhỏ dễ tràn khi burst kéo dài nếu thiếu Worker xả nhanh.',
    comboHint: 'Combo Kafka → Worker: tăng tốc độ xả hàng đợi & giảm tải ghi DB.',
    strengthsByPacket: { read: 'weak', write: 'strong', media: 'neutral', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'stream_processor',
    hotkey: 'T',
    name: 'Flink Stream Engine',
    shortName: 'Flink',
    category: 'compute_async',
    layerHint: 'Xử lý Stream',
    recommendedCols: [2, 3],
    cost: 95,
    upgradeCost: 105,
    color: '#FB923C',
    roleSummary: 'Gom lô stream, giảm 65% ghi',
    shortMetricTag: 'Batch Stream · -65%',
    pros: 'Gom hàng nghìn sự kiện IoT/Clickstream thành batch ghi DB siêu nhẹ.',
    cons: 'Thêm độ trễ gom cửa sổ (windowing) khoảng 6–10ms.',
    comboHint: 'Ghép với Timescale DB hoặc Worker cho bài toán IoT / Telemetry.',
    strengthsByPacket: { read: 'weak', write: 'strong', media: 'neutral', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'worker',
    hotkey: '8',
    name: 'Async Worker Pool',
    shortName: 'Worker',
    category: 'compute_async',
    layerHint: 'Xử lý nền',
    recommendedCols: [3],
    cost: 75,
    upgradeCost: 85,
    color: '#84CC16',
    roleSummary: 'Xử lý tác vụ nền từ Queue',
    shortMetricTag: 'Consumer · Async',
    pros: 'Rút việc từ Kafka/Flink để ghi DB ổn định, không làm nghẽn API chính.',
    cons: 'Chạy đơn lẻ không có Queue phía trước ít phát huy tác dụng.',
    comboHint: 'Combo Kafka/MQ → Worker: mở khóa cộng hưởng Async Pipeline.',
    strengthsByPacket: { read: 'weak', write: 'strong', media: 'strong', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'batch_etl',
    hotkey: 'B',
    name: 'Batch ETL Aggregator',
    shortName: 'ETL Job',
    category: 'compute_async',
    layerHint: 'Tổng hợp lô',
    recommendedCols: [3],
    cost: 80,
    upgradeCost: 90,
    color: '#A3E635',
    roleSummary: 'Nén & tổng hợp log ghi DB',
    shortMetricTag: 'ETL Compress · -45%',
    pros: 'Nén ghi chép lịch sử, giảm dung lượng & lock ghi lên Database lõi.',
    cons: 'Không phù hợp cho request đọc GET thời gian thực.',
    comboHint: 'Đặt trước Timescale DB hoặc DB Cluster cho báo cáo/analytics.',
    strengthsByPacket: { read: 'weak', write: 'strong', media: 'neutral', ddos: 'weak', sqli: 'weak' },
  },

  // 4. STORAGE, REPLICA & MULTI-DATABASE SHARDS
  {
    type: 'read_replica',
    hotkey: '9',
    name: 'Read Replica DB',
    shortName: 'Replica',
    category: 'data_db',
    layerHint: 'Bản sao Đọc',
    recommendedCols: [3],
    cost: 95,
    upgradeCost: 110,
    color: '#14B8A6',
    roleSummary: 'Gánh 85% truy vấn GET đọc',
    shortMetricTag: 'Read Offload · 85%',
    pros: 'Gánh 77–95% truy vấn GET đọc nặng, bảo vệ DB chính khỏi lock.',
    cons: 'Có độ trễ đồng bộ (Replication Lag) nhỏ nếu ghi tăng đột biến.',
    comboHint: 'Nối nhánh GET qua Replica, nhánh POST đi thẳng DB Shard.',
    strengthsByPacket: { read: 'strong', write: 'weak', media: 'weak', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'object_storage',
    hotkey: '0',
    name: 'Object Storage S3',
    shortName: 'S3/MinIO',
    category: 'data_db',
    layerHint: 'Lưu trữ Media',
    recommendedCols: [3],
    cost: 80,
    upgradeCost: 90,
    color: '#EAB308',
    roleSummary: 'Lưu 95% ảnh/video ngoài DB',
    shortMetricTag: 'Blob S3 · 95% Media',
    pros: 'Cách ly 90–99% file ảnh/video/clip khỏi cơ sở dữ liệu quan hệ.',
    cons: 'Không tối ưu cho truy vấn quan hệ hoặc ghi giao dịch SQL.',
    comboHint: 'Combo CDN + S3/MinIO: triệt để giải phóng DB khỏi tải Media.',
    strengthsByPacket: { read: 'weak', write: 'weak', media: 'strong', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'primary_db',
    hotkey: 'M',
    name: 'SQL Shard Database',
    shortName: 'Shard SQL',
    category: 'data_db',
    layerHint: 'Database · Shard',
    recommendedCols: [4],
    isDbSink: true,
    cost: 110,
    upgradeCost: 120,
    color: '#F59E0B',
    roleSummary: 'DB Shard phụ chia tải SQL',
    shortMetricTag: 'SQL Shard · ACID',
    pros: 'Tăng thêm 1 nút Database độc lập để chia đôi CPU & lock SQL.',
    cons: 'Cần LB hoặc luật dây phân bổ đều lưu lượng sang Shard này.',
    comboHint: 'Combo Multi-DB (2+ Database): chia tải CPU cụm DB toàn hệ thống!',
    strengthsByPacket: { read: 'strong', write: 'strong', media: 'weak', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'nosql_db',
    hotkey: 'N',
    name: 'NoSQL Document DB',
    shortName: 'NoSQL DB',
    category: 'data_db',
    layerHint: 'Database · NoSQL',
    recommendedCols: [4],
    isDbSink: true,
    cost: 105,
    upgradeCost: 115,
    color: '#D97706',
    roleSummary: 'Chịu ghi POST/JSON cực cao',
    shortMetricTag: 'NoSQL · High Write',
    pros: 'Hấp thụ ghi POST/Session/Catalog nhẹ CPU hơn SQL truyền thống -38%.',
    cons: 'Không mạnh về join phức tạp; dùng kết hợp Polyglot với DB chính.',
    comboHint: 'Dùng [R] Luật Dây tách POST sang NoSQL DB để giữ DB SQL luôn mát.',
    strengthsByPacket: { read: 'strong', write: 'strong', media: 'neutral', ddos: 'weak', sqli: 'weak' },
  },
  {
    type: 'timeseries_db',
    hotkey: 'I',
    name: 'Timescale / Log DB',
    shortName: 'Timescale',
    category: 'data_db',
    layerHint: 'Database · Chuỗi thời gian',
    recommendedCols: [4],
    isDbSink: true,
    cost: 105,
    upgradeCost: 115,
    color: '#CA8A04',
    roleSummary: 'Tối ưu ghi Telemetry & Log',
    shortMetricTag: 'TimeSeries · IoT',
    pros: 'Chịu ghi chuỗi thời gian, metric IoT & metadata Media nhẹ hơn -42% CPU.',
    cons: 'Không thay thế được OLTP giao dịch tài chính.',
    comboHint: 'Đích cuối lý tưởng cho Flink / ETL / Kafka trong bài toán IoT & Log.',
    strengthsByPacket: { read: 'neutral', write: 'strong', media: 'strong', ddos: 'weak', sqli: 'weak' },
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
    dbCpuLoad: 2.6,
    integrityPenalty: 0,
  },
  write: {
    label: 'Request Ghi Nặng (POST)',
    short: 'POST',
    color: '#F59E0B',
    dbCpuLoad: 5.4,
    integrityPenalty: 0,
  },
  media: {
    label: 'Tài nguyên Media/File',
    short: 'MEDIA',
    color: '#F472B6',
    dbCpuLoad: 4.8,
    integrityPenalty: 0,
  },
  ddos: {
    label: 'Bot DDoS Flood',
    short: 'DDoS',
    color: '#FB7185',
    dbCpuLoad: 9.5,
    integrityPenalty: 2,
  },
  sqli: {
    label: 'SQL Injection',
    short: 'SQLi',
    color: '#C084FC',
    dbCpuLoad: 21.0,
    integrityPenalty: 8,
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
      droppedCount: 0,
      heat: 0,
      avgNodeLatencyMs: 5,
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
        droppedCount: 0,
        heat: 0,
        localDbCpu: isDatabaseSinkType(spec.type) ? 10 : undefined,
        avgNodeLatencyMs: 0,
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
      droppedCount: 0,
      heat: 0,
      localDbCpu: 10,
      avgNodeLatencyMs: 15,
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
    targetSlaMs: 56,
    startingBudget: 400,
    dbCoolingPerSec: 14.5,
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
    targetSlaMs: 62,
    startingBudget: 400,
    dbCoolingPerSec: 14.8,
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
    targetSlaMs: 62,
    startingBudget: 440,
    dbCoolingPerSec: 15.2,
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
    targetSlaMs: 62,
    startingBudget: 460,
    dbCoolingPerSec: 15.5,
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
    startingBudget: 480,
    dbCoolingPerSec: 15.5,
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
    targetSlaMs: 66,
    startingBudget: 540,
    dbCoolingPerSec: 17.5,
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
    startingBudget: 560,
    dbCoolingPerSec: 16.4,
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
    startingBudget: 560,
    dbCoolingPerSec: 16.6,
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
    targetSlaMs: 62,
    startingBudget: 600,
    dbCoolingPerSec: 16.6,
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
    targetSlaMs: 62,
    startingBudget: 660,
    dbCoolingPerSec: 18.5,
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
    targetSlaMs: 66,
    startingBudget: 680,
    dbCoolingPerSec: 17.2,
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
    targetSlaMs: 60,
    startingBudget: 660,
    dbCoolingPerSec: 17.5,
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
    startingBudget: 800,
    dbCoolingPerSec: 18.0,
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
    startingBudget: 820,
    dbCoolingPerSec: 18.2,
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
    targetSlaMs: 64,
    startingBudget: 1020,
    dbCoolingPerSec: 18.8,
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
    targetSlaMs: 64,
    startingBudget: 1380,
    dbCoolingPerSec: 19.6,
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
    droppedCount: 0,
    heat: 0,
    localDbCpu: isDatabaseSinkType(n.type) ? 10 : undefined,
    avgNodeLatencyMs: isDatabaseSinkType(n.type) ? 15 : 0,
  }));
}

export function getNodeCatalogEntry(type: PlaceableNodeType): InfraNodeCatalogEntry {
  return INFRA_NODE_CATALOG.find((e) => e.type === type)!;
}

export function getSellRefund(node: InfraNode, fullRefund = false): number {
  if (node.fixed || node.type === 'ingress' || node.type === 'database') return 0;
  const entry = getNodeCatalogEntry(node.type);
  const upgrades = Math.max(0, node.level - 1);
  const invested = entry.cost + upgrades * entry.upgradeCost;
  if (fullRefund) return invested;
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
  if (isDatabaseSinkType(fromNode.type)) {
    return { valid: false, reason: 'Database là đích lưu trữ cuối, không thể nối dây đi tiếp.' };
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

export function cycleEdgeRouteRule(current?: EdgeRouteRule): EdgeRouteRule {
  const order: readonly EdgeRouteRule[] = ['all', 'read', 'write', 'media'];
  const idx = order.indexOf(current ?? 'all');
  return order[(idx + 1) % order.length];
}

export function getEdgeRouteMeta(rule?: EdgeRouteRule): {
  rule: EdgeRouteRule;
  shortLabel: string;
  label: string;
  color: string;
} {
  const effective = rule ?? 'all';
  switch (effective) {
    case 'read':
      return { rule: 'read', shortLabel: 'GET', label: 'Chỉ GET (Đọc)', color: '#38BDF8' };
    case 'write':
      return { rule: 'write', shortLabel: 'POST', label: 'Chỉ POST (Ghi)', color: '#F59E0B' };
    case 'media':
      return { rule: 'media', shortLabel: 'MEDIA', label: 'Chỉ MEDIA', color: '#F472B6' };
    default:
      return { rule: 'all', shortLabel: 'ALL', label: 'Tất cả lưu lượng', color: '#94A3B8' };
  }
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

/**
 * Content-aware edge selection supporting specialized CQRS/Media wires.
 * Falls back cleanly to 'all' wires, and lets threats traverse any available branch if only specialized routes exist.
 */
export function selectOutgoingEdgeForPacket(
  node: InfraNode,
  edges: readonly InfraEdge[],
  kind: PacketKind
): { edge: InfraEdge | null; nextCursor: number } {
  const outgoing = edges.filter((e) => e.fromId === node.id);
  if (outgoing.length === 0) {
    return { edge: null, nextCursor: node.rrCursor };
  }

  let pool = outgoing;
  if (kind === 'read' || kind === 'write' || kind === 'media') {
    const exact = outgoing.filter((e) => e.routeRule === kind);
    if (exact.length > 0) {
      pool = exact;
    } else {
      const generic = outgoing.filter((e) => !e.routeRule || e.routeRule === 'all');
      if (generic.length > 0) {
        pool = generic;
      }
    }
  } else {
    const generic = outgoing.filter((e) => !e.routeRule || e.routeRule === 'all');
    if (generic.length > 0) {
      pool = generic;
    }
  }

  const idx = node.rrCursor % pool.length;
  return {
    edge: pool[idx],
    nextCursor: (node.rrCursor + 1) % outgoing.length,
  };
}

export function getQueueMaxBuffer(level: 1 | 2 | 3, capacityMode: QueueCapacityMode = 'small'): number {
  const base = level === 3 ? 34 : level === 2 ? 22 : 12;
  return capacityMode === 'large' ? Math.round(base * 1.6) : base;
}

export function getQueueDrainIntervalSec(level: 1 | 2 | 3): number {
  return level === 3 ? 0.14 : level === 2 ? 0.22 : 0.36;
}

export type SreActionId = 'autoscale' | 'lockdown' | 'cache_warm';

export interface SreActionDef {
  id: SreActionId;
  hotkey: 'A' | 'S' | 'D';
  name: string;
  shortName: string;
  cooldownSec: number;
  durationSec: number;
  color: string;
  description: string;
}

export const SRE_ACTIONS: readonly SreActionDef[] = [
  {
    id: 'autoscale',
    hotkey: 'A',
    name: 'Auto-Scale Burst',
    shortName: 'Auto-Scale',
    cooldownSec: 12,
    durationSec: 5,
    color: '#10B981',
    description: 'Hạ nhiệt App/Worker tức thì (-45%) & giảm 35% độ trễ xử lý trong 5s.',
  },
  {
    id: 'lockdown',
    hotkey: 'S',
    name: 'Edge Lockdown',
    shortName: 'Lockdown',
    cooldownSec: 14,
    durationSec: 5,
    color: '#FB7185',
    description: 'Bật màng lọc khẩn cấp: +28% chặn DDoS tại biên & giảm 25% nhịp spawn bot trong 5s.',
  },
  {
    id: 'cache_warm',
    hotkey: 'D',
    name: 'Cache Warm & DB Cool',
    shortName: 'Cache Warm',
    cooldownSec: 15,
    durationSec: 5,
    color: '#22D3EE',
    description: 'Làm ấm Redis/CDN (+14% Hit Rate trong 5s) & xả kết nối giảm -16% CPU Database.',
  },
];

export interface WaveIncidentEvent {
  id: string;
  title: string;
  detail: string;
  kind: 'traffic_spike' | 'botnet_surge' | 'cache_stampede' | 'slow_query';
  spawnRateMult: number;
  extraCpuDrainPenalty: number;
  recommendedAction: SreActionId;
}

export function getWaveIncidentEvent(
  level: TrafficLevelDef,
  waveIndex: number,
  modeId: string
): WaveIncidentEvent | null {
  if (waveIndex < 1) return null;
  const w = level.waves[waveIndex];
  if (!w) return null;

  const isCyber = modeId === 'cyber_siege' || w.weights.ddos + w.weights.sqli >= 0.25;
  const isSpike = modeId === 'flash_surge' || modeId === 'chaos_hell' || w.weights.write >= 0.35;

  if (waveIndex === 1 && (isSpike || level.chapter >= 2)) {
    return {
      id: `inc-${level.id}-w${waveIndex}-spike`,
      title: 'Xung Flash Traffic Bất Ngờ',
      detail: 'Lưu lượng tăng +32% trong 4.5s — dùng [A] Auto-Scale nếu node Compute bị nóng!',
      kind: 'traffic_spike',
      spawnRateMult: 1.32,
      extraCpuDrainPenalty: 0,
      recommendedAction: 'autoscale',
    };
  }
  if (waveIndex === 2 && isCyber) {
    return {
      id: `inc-${level.id}-w${waveIndex}-botnet`,
      title: 'Bão Botnet Phối Hợp',
      detail: 'Tần suất tấn công tăng mạnh — bật [S] Edge Lockdown để hỗ trợ WAF & Limiter!',
      kind: 'botnet_surge',
      spawnRateMult: 1.28,
      extraCpuDrainPenalty: 0,
      recommendedAction: 'lockdown',
    };
  }
  if (waveIndex >= 2) {
    return {
      id: `inc-${level.id}-w${waveIndex}-stampede`,
      title: waveIndex % 2 === 0 ? 'Cache Stampede' : 'Truy Vấn DB Chậm',
      detail: 'Áp lực I/O lên Database tăng nhẹ — bật [D] Cache Warm để hạ nhiệt CPU ngay!',
      kind: waveIndex % 2 === 0 ? 'cache_stampede' : 'slow_query',
      spawnRateMult: 1.15,
      extraCpuDrainPenalty: modeId === 'chaos_hell' ? 3.2 : 1.8,
      recommendedAction: 'cache_warm',
    };
  }
  return null;
}

export interface NodePacketDecision {
  outcome: 'forward' | 'blocked' | 'cache_hit' | 'delivered' | 'dropped_no_route' | 'dropped_overload';
  addedLatencyMs: number;
  dbCpuDelta: number;
  integrityDelta: number;
  writeDampingFactor?: number; // < 1 reduces downstream POST DB load (e.g. Kafka Queue / Worker / Flink)
}

function getSlotPlacementLatencyPenalty(node: InfraNode): number {
  if (!node.slotId || node.type === 'ingress' || node.type === 'database') return 0;
  const slot = RACK_SLOTS.find((s) => s.id === node.slotId);
  if (!slot) return 0;
  const entry = getNodeCatalogEntry(node.type);
  if (entry.recommendedCols.includes(slot.col)) return 0;
  return 4; // subtle latency overhead when placed outside recommended architectural tier
}

/**
 * Pure per-node packet inspection & routing outcome across all 20 placeable nodes + Lv1..Lv3 + Quick-Tune.
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
  const tierPenalty = getSlotPlacementLatencyPenalty(node);

  // Overload saturation drop check (queues/compute saturated >= 90% drop overflow traffic)
  if (
    !isDatabaseSinkType(node.type) &&
    node.type !== 'ingress' &&
    kind !== 'ddos' &&
    kind !== 'sqli' &&
    node.heat >= 0.9 &&
    roll > 0.72 - (lv - 1) * 0.08
  ) {
    return {
      outcome: 'dropped_overload',
      addedLatencyMs: 36 + Math.round(h * 20),
      dbCpuDelta: 0,
      integrityDelta: 0,
    };
  }

  if (node.type === 'ingress') {
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: 5, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: 0, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'waf') {
    const modeShift = node.limiterMode === 'strict' ? 2 : node.limiterMode === 'lenient' ? -1 : 0;
    const latency = Math.max(1, (lv === 3 ? 2 : lv === 2 ? 3 : 6) + modeShift + tierPenalty + Math.round(h * 5));
    if (kind === 'sqli') {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    if (kind === 'ddos') {
      const ddosBlockChance = Math.min(0.75, (lv === 3 ? 0.58 : lv === 2 ? 0.45 : 0.25) + (node.limiterMode === 'strict' ? 0.1 : 0));
      if (roll < ddosBlockChance) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'rate_limiter') {
    const mode = node.limiterMode ?? 'standard';
    const modeLat = mode === 'strict' ? 2 : mode === 'lenient' ? -1 : 0;
    const latency = Math.max(1, (lv === 3 ? 1 : lv === 2 ? 2 : 5) + modeLat + tierPenalty + Math.round(h * 4));
    if (kind === 'ddos') {
      const baseBlock = lv === 3 ? 0.995 : lv === 2 ? 0.985 : 0.91;
      const modeDelta = mode === 'strict' ? 0.04 : mode === 'lenient' ? -0.07 : 0;
      if (roll < Math.min(0.995, baseBlock + modeDelta)) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    // Strict mode trade-off: small false-positive rate during heavy burst heat on legitimate POST writes
    if (mode === 'strict' && kind === 'write' && node.heat >= 0.72 && roll < 0.06) {
      return { outcome: 'blocked', addedLatencyMs: latency + 4, dbCpuDelta: 0, integrityDelta: 0 };
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'ddos_scrubber') {
    const mode = node.limiterMode ?? 'standard';
    const latency = Math.max(2, (lv === 3 ? 2 : lv === 2 ? 4 : 7) + tierPenalty + Math.round(h * 4));
    if (kind === 'ddos') {
      const rate = Math.min(0.998, (lv === 3 ? 0.998 : lv === 2 ? 0.99 : 0.95) + (mode === 'strict' ? 0.02 : mode === 'lenient' ? -0.04 : 0));
      if (roll < rate) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'sqli' && roll < (lv === 3 ? 0.55 : lv === 2 ? 0.4 : 0.25)) {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'cdn') {
    const ttlBonus = node.cacheTtl === 'long' ? 0.04 : node.cacheTtl === 'short' ? -0.04 : 0;
    const latency = (lv === 3 ? 2 : lv === 2 ? 3 : 6) + tierPenalty + Math.round(h * 5);
    if (kind === 'media') {
      const hitChance = Math.min(0.99, (lv === 3 ? 0.985 : lv === 2 ? 0.96 : 0.87) + ttlBonus);
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'read') {
      const staticReadHit = Math.min(0.65, (lv === 3 ? 0.52 : lv === 2 ? 0.42 : 0.27) + ttlBonus);
      if (roll < staticReadHit) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'ddos') {
      const edgeDrop = lv === 3 ? 0.54 : lv === 2 ? 0.42 : 0.26;
      if (roll < edgeDrop) {
        return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'api_gateway') {
    const latency = (lv === 3 ? 2 : lv === 2 ? 3 : 6) + tierPenalty + Math.round(h * 5);
    if (kind === 'sqli' && roll < (lv === 3 ? 0.72 : lv === 2 ? 0.56 : 0.38)) {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    if (kind === 'ddos' && roll < (lv === 3 ? 0.45 : lv === 2 ? 0.34 : 0.2)) {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'varnish') {
    const ttlBonus = node.cacheTtl === 'long' ? 0.06 : node.cacheTtl === 'short' ? -0.05 : 0;
    const latency = (lv === 3 ? 2 : lv === 2 ? 4 : 7) + tierPenalty + Math.round(h * 6);
    if (kind === 'read') {
      const hitChance = Math.min(0.93, (lv === 3 ? 0.89 : lv === 2 ? 0.83 : 0.72) + ttlBonus);
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    if (kind === 'media' && roll < 0.42) {
      return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'redis') {
    const ttlBonus = node.cacheTtl === 'long' ? 0.05 : node.cacheTtl === 'short' ? -0.05 : 0;
    const staleLat = node.cacheTtl === 'long' ? 1 : 0;
    const latency = (lv === 3 ? 3 : lv === 2 ? 5 : 9) + staleLat + tierPenalty + Math.round(h * (lv === 3 ? 4 : lv === 2 ? 6 : 12));
    if (kind === 'read') {
      const hitChance = Math.min(0.96, (lv === 3 ? 0.94 : lv === 2 ? 0.9 : 0.75) + ttlBonus);
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'load_balancer') {
    const latency = (lv === 3 ? 1 : lv === 2 ? 2 : 4) + tierPenalty;
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'app') {
    const heatPenalty = Math.round(h * (lv === 3 ? 14 : lv === 2 ? 24 : 44));
    const latency = (lv === 3 ? 7 : lv === 2 ? 10 : 15) + tierPenalty + heatPenalty;
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'microservice_auth') {
    const latency = (lv === 3 ? 5 : lv === 2 ? 8 : 12) + tierPenalty + Math.round(h * (lv === 3 ? 10 : lv === 2 ? 16 : 24));
    if (kind === 'sqli' && roll < (lv === 3 ? 0.85 : lv === 2 ? 0.75 : 0.62)) {
      return { outcome: 'blocked', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    if (kind === 'read' && roll < (lv === 3 ? 0.56 : lv === 2 ? 0.45 : 0.32)) {
      return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'search_engine') {
    const latency = (lv === 3 ? 4 : lv === 2 ? 7 : 11) + tierPenalty + Math.round(h * (lv === 3 ? 7 : lv === 2 ? 10 : 16));
    if (kind === 'read') {
      const hitChance = lv === 3 ? 0.91 : lv === 2 ? 0.86 : 0.78;
      if (roll < hitChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'queue') {
    const capLat = node.queueCapacityMode === 'large' ? 3 : -1;
    const latency = Math.max(2, (lv === 3 ? 4 : lv === 2 ? 5 : 9) + capLat + tierPenalty + Math.round(h * (lv === 3 ? 5 : lv === 2 ? 8 : 16)));
    const damping = lv === 3 ? 0.26 : lv === 2 ? 0.34 : 0.48;
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

  if (node.type === 'stream_processor') {
    const capLat = node.queueCapacityMode === 'large' ? 3 : 0;
    const latency = (lv === 3 ? 5 : lv === 2 ? 7 : 11) + capLat + tierPenalty + Math.round(h * (lv === 3 ? 6 : lv === 2 ? 9 : 14));
    const damping = lv === 3 ? 0.24 : lv === 2 ? 0.32 : 0.42;
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
    const latency = (lv === 3 ? 4 : lv === 2 ? 6 : 11) + tierPenalty + Math.round(h * (lv === 3 ? 6 : lv === 2 ? 9 : 18));
    const damping = lv === 3 ? 0.54 : lv === 2 ? 0.64 : 0.78;
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

  if (node.type === 'batch_etl') {
    const latency = (lv === 3 ? 5 : lv === 2 ? 8 : 12) + tierPenalty + Math.round(h * 10);
    const damping = lv === 3 ? 0.46 : lv === 2 ? 0.55 : 0.68;
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
    const poolBonus = node.dbPoolMode === 'high_pool' ? 0.04 : 0;
    const latency = (lv === 3 ? 5 : lv === 2 ? 7 : 12) + tierPenalty + Math.round(h * (lv === 3 ? 6 : lv === 2 ? 10 : 18));
    if (kind === 'read') {
      const offloadChance = Math.min(0.97, (lv === 3 ? 0.95 : lv === 2 ? 0.92 : 0.77) + poolBonus);
      if (roll < offloadChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  if (node.type === 'object_storage') {
    const latency = (lv === 3 ? 4 : lv === 2 ? 6 : 10) + tierPenalty + Math.round(h * (lv === 3 ? 5 : lv === 2 ? 7 : 14));
    if (kind === 'media') {
      const offloadChance = lv === 3 ? 0.99 : lv === 2 ? 0.97 : 0.9;
      if (roll < offloadChance) {
        return { outcome: 'cache_hit', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
      }
    }
    return outgoingCount > 0
      ? { outcome: 'forward', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 }
      : { outcome: 'dropped_no_route', addedLatencyMs: latency, dbCpuDelta: 0, integrityDelta: 0 };
  }

  // Database terminal nodes: 'database' | 'primary_db' | 'nosql_db' | 'timeseries_db'
  const meta = PACKET_META[kind];
  const dbLocalCpu = node.localDbCpu ?? 10;
  if (dbLocalCpu >= 94 && kind !== 'ddos' && kind !== 'sqli' && roll > 0.75) {
    return {
      outcome: 'dropped_overload',
      addedLatencyMs: 42 + Math.round(h * 18),
      dbCpuDelta: 0,
      integrityDelta: 0,
    };
  }

  let dbAffinityMult = 1;
  if (node.type === 'nosql_db') {
    dbAffinityMult = kind === 'write' ? 0.62 : kind === 'read' ? 0.85 : 0.95;
  } else if (node.type === 'timeseries_db') {
    dbAffinityMult = kind === 'write' || kind === 'media' ? 0.58 : 0.9;
  } else if (node.type === 'primary_db') {
    dbAffinityMult = kind === 'read' || kind === 'write' ? 0.88 : 1;
  }

  const levelCoolingFactor = lv === 3 ? 0.76 : lv === 2 ? 0.88 : 1;
  const poolFactor = node.dbPoolMode === 'high_pool' ? 0.88 : 1;
  const baseCpu =
    kind === 'write'
      ? Math.max(1.8, meta.dbCpuLoad * packetWriteDamping)
      : meta.dbCpuLoad;
  const effectiveCpu = Number((baseCpu * dbAffinityMult * levelCoolingFactor * poolFactor).toFixed(2));
  const baseLat = kind === 'write' ? 24 : kind === 'media' ? 22 : 15;
  const lvLatDiscount = lv === 3 ? 6 : lv === 2 ? 3 : 0;

  return {
    outcome: 'delivered',
    addedLatencyMs: Math.max(5, baseLat - lvLatDiscount + tierPenalty + Math.round(h * 12)),
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
  const dbIds = new Set(getDatabaseSinkNodes(nodes).map((n) => n.id));
  if (dbIds.size === 0) return false;
  const queue = ['ingress'];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (dbIds.has(cur)) return true;
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
export interface ArchitectureCombo {
  id: 'cdn_s3' | 'cache_compute' | 'kafka_worker' | 'multi_db_cluster';
  name: string;
  bonusText: string;
  active: boolean;
}

export function detectArchitectureCombos(
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[]
): ArchitectureCombo[] {
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
  const q2 = getDatabaseSinkNodes(nodes).map((n) => n.id);
  while (q2.length > 0) {
    const cur = q2.shift()!;
    if (backwardReachable.has(cur)) continue;
    backwardReachable.add(cur);
    for (const e of edges) {
      if (e.toId === cur) q2.push(e.fromId);
    }
  }

  const activeNodes = nodes.filter(
    (n) => forwardReachable.has(n.id) && backwardReachable.has(n.id)
  );
  const activeTypes = new Set(activeNodes.map((n) => n.type));
  const activeDbSinks = activeNodes.filter((n) => isDatabaseSinkType(n.type));

  const hasCdnS3 = activeTypes.has('cdn') && activeTypes.has('object_storage');
  const hasCacheCompute =
    (activeTypes.has('redis') || activeTypes.has('varnish')) &&
    (activeTypes.has('app') || activeTypes.has('microservice_auth') || activeTypes.has('search_engine'));
  const hasKafkaWorker =
    (activeTypes.has('queue') || activeTypes.has('stream_processor')) &&
    (activeTypes.has('worker') || activeTypes.has('batch_etl'));
  const hasMultiDb = activeDbSinks.length >= 2;

  return [
    {
      id: 'cdn_s3',
      name: 'CDN + S3/MinIO',
      bonusText: '-20% tải Media & +6% Hit biên',
      active: hasCdnS3,
    },
    {
      id: 'cache_compute',
      name: 'Redis/Varnish → Compute',
      bonusText: '-4ms trễ xử lý API đọc',
      active: hasCacheCompute,
    },
    {
      id: 'kafka_worker',
      name: 'Kafka/Flink → Worker',
      bonusText: '+20% tốc độ xả hàng đợi Async',
      active: hasKafkaWorker,
    },
    {
      id: 'multi_db_cluster',
      name: 'Đa Database Shard',
      bonusText: '+18% tản nhiệt DB & chống sập đơn điểm',
      active: hasMultiDb,
    },
  ];
}

export interface PreSimCheckItem {
  ok: boolean;
  label: string;
}

export function getPreSimChecklist(
  level: TrafficLevelDef,
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[]
): PreSimCheckItem[] {
  const analysis = analyzeArchitectureDesign(level, nodes, edges);
  const activeDbCount = getDatabaseSinkNodes(nodes).filter((db) =>
    edges.some((e) => e.toId === db.id)
  ).length;

  let avgSqli = 0;
  let avgDdos = 0;
  let avgWrite = 0;
  let avgRead = 0;
  for (const w of level.waves) {
    avgSqli += w.weights.sqli;
    avgDdos += w.weights.ddos;
    avgWrite += w.weights.write;
    avgRead += w.weights.read;
  }
  const nW = Math.max(1, level.waves.length);
  avgSqli /= nW;
  avgDdos /= nW;
  avgWrite /= nW;
  avgRead /= nW;

  const activeSet = new Set(analysis.connectedNodeTypes);
  const items: PreSimCheckItem[] = [
    {
      ok: analysis.hasValidPath,
      label: analysis.hasValidPath
        ? 'Có luồng nối thông từ Users tới cụm Database'
        : 'Chưa nối dây thông từ Users tới Database',
    },
    {
      ok: activeDbCount >= 2,
      label:
        activeDbCount >= 2
          ? `Đa Database Shard hoạt động (${activeDbCount} DB đang nối dây)`
          : 'Đang dùng 1 DB Cluster đơn (có thể thêm Shard SQL / NoSQL / Timescale)',
    },
  ];

  if (avgDdos >= 0.08 || avgSqli >= 0.05) {
    const hasEdgeShield =
      activeSet.has('waf') || activeSet.has('rate_limiter') || activeSet.has('ddos_scrubber');
    items.push({
      ok: hasEdgeShield,
      label: hasEdgeShield
        ? 'Đã có lớp lọc DDoS/WAF bảo vệ trước tầng compute'
        : 'Chưa có lớp chống DDoS/Rate Limit hoặc WAF',
    });
  }

  if (avgRead >= 0.35) {
    const hasCache =
      activeSet.has('redis') ||
      activeSet.has('varnish') ||
      activeSet.has('read_replica') ||
      activeSet.has('search_engine');
    items.push({
      ok: hasCache,
      label: hasCache
        ? 'Đã có lớp Cache / Replica giảm tải truy vấn GET'
        : 'Thiếu Redis/Varnish hoặc Replica cho lượng GET lớn',
    });
  }

  if (avgWrite >= 0.3) {
    const hasAsync =
      activeSet.has('queue') || activeSet.has('stream_processor') || activeDbCount >= 2;
    items.push({
      ok: hasAsync,
      label: hasAsync
        ? 'Đã có Queue/Stream hoặc Đa DB gánh xung POST'
        : 'POST ghi thẳng vào DB đơn dễ gây lock tranh chấp',
    });
  }

  return items;
}

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
  const q2 = getDatabaseSinkNodes(nodes).map((n) => n.id);
  while (q2.length > 0) {
    const cur = q2.shift()!;
    if (backwardReachable.has(cur)) continue;
    backwardReachable.add(cur);
    for (const e of edges) {
      if (e.toId === cur) q2.push(e.fromId);
    }
  }

  const activeTypes = new Set<PlaceableNodeType>();
  let activeDbCount = 0;
  for (const n of nodes) {
    if (forwardReachable.has(n.id) && backwardReachable.has(n.id)) {
      if (isDatabaseSinkType(n.type)) activeDbCount += 1;
      if (n.type !== 'ingress' && n.type !== 'database') {
        activeTypes.add(n.type);
      }
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
    diagnostics.push('Chưa có đường dây hoàn chỉnh nối từ Users → Cụm Database.');
  }
  if (avgSqli >= 0.08 && !activeTypes.has('waf')) {
    diagnostics.push('Chưa có lớp lọc SQLi (WAF [1]) trước tầng compute — payload độc có thể xuyên thẳng xuống DB.');
  }
  if (avgDdos >= 0.14 && !activeTypes.has('rate_limiter') && !activeTypes.has('ddos_scrubber') && !activeTypes.has('cdn')) {
    diagnostics.push('Chưa có lớp lọc DDoS/Rate Limit ([2] Limiter hoặc [Q] Scrubber) trước tầng compute.');
  }
  if (avgMedia >= 0.25 && !activeTypes.has('cdn') && !activeTypes.has('object_storage')) {
    diagnostics.push('Tối ưu Media: Tách file ảnh/video qua CDN [3] hoặc S3/MinIO [0] thay vì đẩy vào DB chính.');
  }
  if (avgWrite >= 0.35 && !activeTypes.has('queue') && !activeTypes.has('stream_processor') && activeDbCount < 2) {
    diagnostics.push('POST ghi thẳng vào DB đơn dễ gây lock tranh chấp & cạn connection pool — nên thêm Kafka/MQ [7] hoặc tách thêm DB Shard.');
  }
  if (avgRead >= 0.45 && !activeTypes.has('redis') && !activeTypes.has('varnish') && !activeTypes.has('read_replica') && !activeTypes.has('cdn')) {
    diagnostics.push('Thiếu lớp Cache/Replica cho luồng GET dày đặc — hãy đặt Redis [5], Varnish [V] hoặc Replica [9].');
  } else if (
    (activeTypes.has('redis') || activeTypes.has('varnish')) &&
    !activeTypes.has('read_replica') &&
    activeDbCount < 2 &&
    avgRead >= 0.48
  ) {
    diagnostics.push('Gợi ý resilience: Thiếu fallback Replica [9] hoặc DB Shard phụ khi Redis miss diện rộng (Cache Stampede).');
  }

  const specializedEdgeCount = edges.filter(
    (e) =>
      e.routeRule &&
      e.routeRule !== 'all' &&
      forwardReachable.has(e.fromId) &&
      backwardReachable.has(e.toId)
  ).length;

  const combos = detectArchitectureCombos(nodes, edges).filter((c) => c.active);

  let detectedPatternLabel = 'Kiến trúc Đơn Tuyến Cơ Bản';
  if (!hasValidPath) {
    detectedPatternLabel = 'Mạng Chưa Kết Nối';
  } else if (matchedApproaches.length > 0) {
    detectedPatternLabel = matchedApproaches[0].name;
  } else if (activeDbCount >= 2 && specializedEdgeCount >= 2) {
    detectedPatternLabel = `CQRS + Đa Database Cluster (${activeDbCount} DB)`;
  } else if (activeDbCount >= 2) {
    detectedPatternLabel = `Cụm Đa Database Sharded (${activeDbCount} DB)`;
  } else if (specializedEdgeCount >= 2) {
    detectedPatternLabel = 'CQRS Định Tuyến Thông Minh Đa Luồng';
  } else if (activeTypes.has('waf') && (activeTypes.has('rate_limiter') || activeTypes.has('ddos_scrubber')) && (activeTypes.has('queue') || activeTypes.has('stream_processor'))) {
    detectedPatternLabel = 'Phòng Thủ Đa Tầng + Event Queue';
  } else if ((activeTypes.has('redis') || activeTypes.has('varnish')) && (activeTypes.has('queue') || activeTypes.has('stream_processor'))) {
    detectedPatternLabel = 'CQRS Cache + Async Queue';
  } else if (activeTypes.has('cdn') && activeTypes.has('object_storage')) {
    detectedPatternLabel = 'Edge CDN + Object Storage';
  } else if (activeTypes.has('load_balancer') && connectedNodeTypes.length >= 2) {
    detectedPatternLabel = 'Cân Bằng Tải Phân Tán';
  } else if (activeTypes.has('redis') || activeTypes.has('varnish')) {
    detectedPatternLabel = 'Cache-Aside Pattern';
  } else if (activeTypes.has('queue') || activeTypes.has('stream_processor')) {
    detectedPatternLabel = 'Queue Load Leveling';
  }

  let score = hasValidPath ? 40 : 10;
  if (matchedApproaches.length > 0) score += 35;
  else score += Math.min(25, connectedNodeTypes.length * 8);
  if (diagnostics.length === 0 && hasValidPath) score += 25;
  else score += Math.max(0, 15 - diagnostics.length * 5);
  if (specializedEdgeCount > 0 && hasValidPath) score += Math.min(8, specializedEdgeCount * 4);
  if (combos.length > 0 && hasValidPath) score += Math.min(8, combos.length * 3);

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
  highlightNodeIds?: string[];
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
  const q2 = getDatabaseSinkNodes(nodes).map((n) => n.id);
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
  const activeDbCount = nodes.filter(
    (n) => isDatabaseSinkType(n.type) && forwardReachable.has(n.id)
  ).length;

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

  // 1. Dead / disconnected nodes creating architecture clutter
  if (deadNodes.length > 0) {
    whyNotOptimal.push({
      category: 'cost',
      severity: 'warning',
      title: `Dư thừa ${deadNodes.length} node chưa nối dây vào luồng`,
      reason: `Sơ đồ còn ${deadNodes.length} thành phần đặt rời rạc nhưng không có lưu lượng nào đi qua chúng.`,
      suggestion: 'Nối dây qua các node này hoặc tháo bỏ để giữ kiến trúc tinh gọn.',
      highlightNodeIds: deadNodes.map((n) => n.id),
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
          reason: 'Load Balancer Round-Robin chỉ phát huy tác dụng khi chia đều lưu lượng sang từ 2 nhánh server hoặc 2 DB Shard trở lên.',
          suggestion: 'Dùng [W] Nối Dây từ Load Balancer ra thêm 1 App API / Replica / Shard DB thứ hai.',
          highlightNodeIds: [n.id],
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
      reason: 'Hoàn cảnh hoặc chế độ chơi này có mã độc SQLi xâm nhập. Thiếu WAF khiến dữ liệu bị tổn hại và cụm DB tốn CPU xử lý truy vấn độc.',
      suggestion: 'Đặt WAF Firewall [1] ngay tầng Edge sau Users để chặn 100% gói SQLi.',
    });
  } else if (breachedAttacks > (strictSecurity ? 0 : 3)) {
    whyNotOptimal.push({
      category: 'security',
      severity: strictSecurity ? 'critical' : 'warning',
      title: `Còn ${breachedAttacks} gói tấn công lọt tới cụm Database`,
      reason: 'Bot DDoS hoặc SQLi đã xuyên qua tầng biên do thiếu lá chắn đầu vào hoặc chưa nâng cấp Rate Limiter / Scrubber lên Lv.2–Lv.3.',
      suggestion: 'Đặt Rate Limiter [2] / Scrubber [Q] + WAF [1] ngay sau Users và nâng cấp lên Lv.2–Lv.3.',
    });
  }

  if (avgDdos >= 0.12 && !activeTypes.has('rate_limiter') && !activeTypes.has('ddos_scrubber') && !activeTypes.has('cdn')) {
    whyNotOptimal.push({
      category: 'security',
      severity: 'critical',
      title: 'Thiếu lớp cắt bão Bot DDoS',
      reason: 'Bão request rác đang dội thẳng vào App/Database làm tăng đột biến CPU và độ trễ của người dùng thật.',
      suggestion: 'Bổ sung Rate Limiter [2], DDoS Scrubber [Q] hoặc Edge CDN [3].',
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

  if (avgWrite >= 0.34 && !activeTypes.has('queue') && !activeTypes.has('stream_processor') && activeDbCount < 2) {
    whyNotOptimal.push({
      category: 'architecture',
      severity: 'warning',
      title: 'POST ghi thẳng vào DB đơn dễ gây lock tranh chấp',
      reason: 'Tỷ lệ POST ghi dữ liệu cao đang đập thẳng vào một Database đơn thay vì được làm phẳng theo hàng đợi hoặc tách DB Shard.',
      suggestion: 'Chèn Message Queue [7] + Worker [8] hoặc bổ sung Shard SQL [M] / NoSQL DB [N] để chia tải ghi.',
    });
  }

  if (
    avgRead >= 0.38 &&
    !activeTypes.has('redis') &&
    !activeTypes.has('varnish') &&
    !activeTypes.has('read_replica') &&
    !activeTypes.has('cdn')
  ) {
    whyNotOptimal.push({
      category: 'performance',
      severity: 'warning',
      title: 'Chưa có cơ chế Cache hoặc Read Replica cho truy vấn Đọc',
      reason: 'Mọi request GET lặp lại đều phải truy vấn trực tiếp Database gốc gây lãng phí tài nguyên.',
      suggestion: 'Đặt Redis [5], Varnish [V] hoặc Read Replica [9] để gánh 75–95% lượng đọc.',
    });
  }

  // 5. Runtime performance & DB CPU checks
  if (avgLatencyMs > level.targetSlaMs) {
    whyNotOptimal.push({
      category: 'performance',
      severity: avgLatencyMs > level.targetSlaMs * 1.3 ? 'critical' : 'warning',
      title: `Độ trễ ${avgLatencyMs}ms vượt ngưỡng SLA (${level.targetSlaMs}ms)`,
      reason: 'Đường đi qua quá nhiều bước tuần tự chậm hoặc node đơn tuyến bị nóng (heat cao) không kịp chia tải.',
      suggestion: 'Dùng Redis/CDN để trả kết quả sớm ở biên, thêm Load Balancer chia nhánh hoặc nâng cấp node lên Lv.2–Lv.3.',
    });
  }

  if (peakDbCpu >= 82) {
    whyNotOptimal.push({
      category: 'reliability',
      severity: peakDbCpu >= 90 ? 'critical' : 'warning',
      title: `Đỉnh CPU cụm Database quá cao (${Math.round(peakDbCpu)}%)`,
      reason: 'Hệ thống tuy chưa sập nhưng sát ngưỡng nghẽn 100%, rất dễ trả lỗi 502 Bad Gateway khi xung tải kéo dài.',
      suggestion: 'Giảm tải DB bằng Redis/Replica (GET) + Kafka (POST) + CDN/S3 (MEDIA) hoặc tách thêm Database Shard.',
    });
  }

  // Strengths
  const specializedEdgesCount = edges.filter(
    (e) =>
      e.routeRule &&
      e.routeRule !== 'all' &&
      forwardReachable.has(e.fromId) &&
      backwardReachable.has(e.toId)
  ).length;
  if (specializedEdgesCount > 0 && analysis.hasValidPath) {
    strengths.push(`Định tuyến thông minh (CQRS): Phân tách luồng gói tin qua ${specializedEdgesCount} tuyến chuyên biệt.`);
  }
  if (activeDbCount >= 2 && analysis.hasValidPath) {
    strengths.push(`Kiến trúc Đa Database (${activeDbCount} DB): Phân tán tải đọc/ghi và giảm thiểu rủi ro SPOF.`);
  }
  const activeCombos = detectArchitectureCombos(nodes, edges).filter((c) => c.active);
  if (activeCombos.length > 0 && analysis.hasValidPath) {
    strengths.push(`Kích hoạt Combo Kiến Trúc: ${activeCombos.map((c) => c.name).join(' · ')}.`);
  }
  if (analysis.matchedApproaches.length > 0) {
    strengths.push(`Áp dụng chuẩn mô hình: ${analysis.matchedApproaches.map((a) => a.name).join(' · ')}`);
  }
  if (avgLatencyMs <= level.targetSlaMs && analysis.hasValidPath) {
    strengths.push(`Đạt SLA độ trễ (${avgLatencyMs}ms ≤ ${level.targetSlaMs}ms).`);
  }
  if (peakDbCpu < 78 && analysis.hasValidPath) {
    strengths.push(`Cụm Database luôn mát và an toàn (Đỉnh CPU chỉ ${Math.round(peakDbCpu)}%).`);
  }
  if (breachedAttacks === 0 && (avgSqli > 0 || avgDdos > 0)) {
    strengths.push('Phòng thủ tuyệt đối: Không để lọt gói tấn công gây hại xuống cụm DB.');
  }
  if (deadNodes.length === 0 && analysis.hasValidPath) {
    strengths.push('Kiến trúc tinh gọn: 100% thành phần đều tham gia luồng xử lý.');
  }

  // Compute 4 pillars (fair & encouraging for learning)
  const latDelta = Math.max(0, avgLatencyMs - level.targetSlaMs);
  const performance = analysis.hasValidPath
    ? Math.max(20, Math.min(100, Math.round(100 - latDelta * 1.15 - (avgRead >= 0.38 && !activeTypes.has('redis') && !activeTypes.has('read_replica') && !activeTypes.has('cdn') ? 14 : 0))))
    : 10;

  const reliability = analysis.hasValidPath
    ? Math.max(
        15,
        Math.min(
          100,
          Math.round(
            100 -
              Math.max(0, peakDbCpu - 62) * 1.15 -
              breachedAttacks * (strictSecurity ? 8 : 4) -
              (avgSqli >= 0.06 && !activeTypes.has('waf') ? 26 : 0)
          )
        )
      )
    : 10;

  const costEfficiency = analysis.hasValidPath
    ? Math.max(25, Math.min(100, Math.round(100 - deadNodes.length * 16)))
    : 20;

  const architectureFit = analysis.score;

  const hasCritical = whyNotOptimal.some((c) => c.severity === 'critical');

  // Ensure non-optimal solutions always explain why they aren't S-grade yet
  if (
    analysis.hasValidPath &&
    whyNotOptimal.length === 0 &&
    (analysis.matchedApproaches.length === 0 ||
      performance * 0.28 + reliability * 0.3 + costEfficiency * 0.14 + architectureFit * 0.28 < 86)
  ) {
    if (analysis.matchedApproaches.length === 0) {
      whyNotOptimal.push({
        category: 'architecture',
        severity: 'warning',
        title: 'Chưa tối ưu đúng mẫu kiến trúc chuyên biệt cho hoàn cảnh này',
        reason: `Kiến trúc hiện tại xử lý được tải nhưng chưa hội tụ đủ các thành phần cốt lõi của một trong ${level.approaches.length} phương án chuẩn cho "${level.domain}".`,
        suggestion: `Mở mục "Các Cách Thiết Kế" để tham khảo ${level.approaches.map((a) => a.name).join(' hoặc ')}.`,
      });
    } else if (peakDbCpu >= 76) {
      whyNotOptimal.push({
        category: 'reliability',
        severity: 'warning',
        title: `Biên an toàn CPU Database còn mỏng (Đỉnh ${Math.round(peakDbCpu)}%)`,
        reason: 'Mặc dù chưa chạm ngưỡng báo động đỏ, Database vẫn phải gánh nhiều truy vấn có thể giảm tải thêm.',
        suggestion: 'Nâng cấp các node đệm/hàng đợi (Redis, CDN, Kafka) lên Lv2 để đưa đỉnh CPU về dưới 72%.',
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
    analysis.hasValidPath && !hasCritical && whyNotOptimal.length === 0 && totalScore >= 86;

  const grade: 'S' | 'A' | 'B' | 'C' =
    totalScore >= 88 && !hasCritical && whyNotOptimal.length === 0
      ? 'S'
      : totalScore >= 76 && !hasCritical
        ? 'A'
        : totalScore >= 58
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

// ---------------------------------------------------------------------------
// Visual Geometry, Capability Comparison & Live Telemetry Diagnosis Helpers
// ---------------------------------------------------------------------------
export interface BezierPointSample {
  x: number;
  y: number;
  angle: number;
}

export function getEdgeControlPoints(
  ax: number,
  ay: number,
  bx: number,
  by: number
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const dx = bx - ax;
  if (Math.abs(dx) < 18) {
    // Same-column vertical edge: bow smoothly to the right to stay readable
    const bow = Math.max(42, Math.abs(by - ay) * 0.28);
    return {
      cp1x: ax + bow,
      cp1y: ay + (by - ay) * 0.25,
      cp2x: bx + bow,
      cp2y: by - (by - ay) * 0.25,
    };
  }
  const dir = dx >= 0 ? 1 : -1;
  const offset = Math.max(38, Math.abs(dx) * 0.48) * dir;
  return {
    cp1x: ax + offset,
    cp1y: ay,
    cp2x: bx - offset,
    cp2y: by,
  };
}

export function computeBezierPointAndTangent(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tRaw: number
): BezierPointSample {
  const t = Math.max(0, Math.min(1, tRaw));
  const u = 1 - t;
  const { cp1x, cp1y, cp2x, cp2y } = getEdgeControlPoints(ax, ay, bx, by);

  const x =
    u * u * u * ax +
    3 * u * u * t * cp1x +
    3 * u * t * t * cp2x +
    t * t * t * bx;
  const y =
    u * u * u * ay +
    3 * u * u * t * cp1y +
    3 * u * t * t * cp2y +
    t * t * t * by;

  const dxdt =
    3 * u * u * (cp1x - ax) +
    6 * u * t * (cp2x - cp1x) +
    3 * t * t * (bx - cp2x);
  const dydt =
    3 * u * u * (cp1y - ay) +
    6 * u * t * (cp2y - cp1y) +
    3 * t * t * (by - cp2y);

  return {
    x,
    y,
    angle: Math.atan2(dydt, dxdt),
  };
}

export function distToCubicBezier(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  samples = 22
): number {
  let minDist = Infinity;
  let prev = computeBezierPointAndTangent(ax, ay, bx, by, 0);
  for (let i = 1; i <= samples; i++) {
    const cur = computeBezierPointAndTangent(ax, ay, bx, by, i / samples);
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const lenSq = dx * dx + dy * dy;
    const proj = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - prev.x) * dx + (py - prev.y) * dy) / lenSq));
    const d = Math.hypot(px - (prev.x + proj * dx), py - (prev.y + proj * dy));
    if (d < minDist) minDist = d;
    prev = cur;
  }
  return minDist;
}

export interface NodeCapabilitySpec {
  primaryMetricLabel: string;
  lv1Value: string;
  lv2Value: string;
  lv3Value: string;
  latencyLv1Ms: number;
  latencyLv2Ms: number;
  latencyLv3Ms: number;
  bestAgainst: string;
}

export function getNodeCapabilityDetails(type: PlaceableNodeType): NodeCapabilitySpec {
  switch (type) {
    case 'waf':
      return {
        primaryMetricLabel: 'Chặn SQLi / Lọc DDoS',
        lv1Value: '100% SQLi · 25% DDoS',
        lv2Value: '100% SQLi · 45% DDoS',
        lv3Value: '100% SQLi · 58% DDoS',
        latencyLv1Ms: 6,
        latencyLv2Ms: 3,
        latencyLv3Ms: 2,
        bestAgainst: 'SQLi & tấn công lớp ứng dụng L7',
      };
    case 'rate_limiter':
      return {
        primaryMetricLabel: 'Tỷ lệ chặn bão DDoS',
        lv1Value: '91% DDoS',
        lv2Value: '98.5% DDoS',
        lv3Value: '99.5% DDoS',
        latencyLv1Ms: 5,
        latencyLv2Ms: 2,
        latencyLv3Ms: 1,
        bestAgainst: 'Botnet DDoS & Spam API',
      };
    case 'ddos_scrubber':
      return {
        primaryMetricLabel: 'Làm sạch Botnet L4/L7',
        lv1Value: '95% DDoS · 25% SQLi',
        lv2Value: '99% DDoS · 40% SQLi',
        lv3Value: '99.8% DDoS · 55% SQLi',
        latencyLv1Ms: 7,
        latencyLv2Ms: 4,
        latencyLv3Ms: 2,
        bestAgainst: 'Bão Botnet quy mô cực lớn',
      };
    case 'cdn':
      return {
        primaryMetricLabel: 'Offload Media / GET tĩnh',
        lv1Value: '87% Media · 27% GET',
        lv2Value: '96% Media · 42% GET',
        lv3Value: '98.5% Media · 52% GET',
        latencyLv1Ms: 6,
        latencyLv2Ms: 3,
        latencyLv3Ms: 2,
        bestAgainst: 'Ảnh/Video & phân tán tải biên',
      };
    case 'api_gateway':
      return {
        primaryMetricLabel: 'Lọc Gateway & định tuyến',
        lv1Value: '38% SQLi · 20% DDoS',
        lv2Value: '56% SQLi · 34% DDoS',
        lv3Value: '72% SQLi · 45% DDoS',
        latencyLv1Ms: 6,
        latencyLv2Ms: 3,
        latencyLv3Ms: 2,
        bestAgainst: 'Điều phối nhiều dịch vụ Microservice',
      };
    case 'load_balancer':
      return {
        primaryMetricLabel: 'Chia tải Round-Robin L7',
        lv1Value: 'Đa nhánh · 4ms hop',
        lv2Value: 'Nhanh · 2ms hop',
        lv3Value: 'Siêu tốc · 1ms hop',
        latencyLv1Ms: 4,
        latencyLv2Ms: 2,
        latencyLv3Ms: 1,
        bestAgainst: 'Chống nghẽn nóng trên 1 nhánh',
      };
    case 'varnish':
      return {
        primaryMetricLabel: 'HTTP Page Cache GET',
        lv1Value: '72% GET Hit',
        lv2Value: '83% GET Hit',
        lv3Value: '89% GET Hit',
        latencyLv1Ms: 7,
        latencyLv2Ms: 4,
        latencyLv3Ms: 2,
        bestAgainst: 'Báo chí, HTML & API công khai',
      };
    case 'redis':
      return {
        primaryMetricLabel: 'Cache Hit truy vấn GET',
        lv1Value: '75% GET Hit (0% DB)',
        lv2Value: '90% GET Hit (0% DB)',
        lv3Value: '94% GET Hit (0% DB)',
        latencyLv1Ms: 9,
        latencyLv2Ms: 5,
        latencyLv3Ms: 3,
        bestAgainst: 'Bão đọc GET lặp lại & Flash Sale',
      };
    case 'app':
      return {
        primaryMetricLabel: 'Chịu tải xử lý nghiệp vụ',
        lv1Value: 'Trễ gốc 15ms (+44ms nóng)',
        lv2Value: 'Trễ gốc 10ms (+24ms nóng)',
        lv3Value: 'Trễ gốc 7ms (+14ms nóng)',
        latencyLv1Ms: 15,
        latencyLv2Ms: 10,
        latencyLv3Ms: 7,
        bestAgainst: 'Xử lý logic giữa các tầng',
      };
    case 'microservice_auth':
      return {
        primaryMetricLabel: 'Xác thực JWT & bảo vệ',
        lv1Value: '32% Token Hit · 62% SQLi',
        lv2Value: '45% Token Hit · 75% SQLi',
        lv3Value: '56% Token Hit · 85% SQLi',
        latencyLv1Ms: 12,
        latencyLv2Ms: 8,
        latencyLv3Ms: 5,
        bestAgainst: 'Cổng đăng nhập & phân quyền',
      };
    case 'search_engine':
      return {
        primaryMetricLabel: 'Full-Text Index GET',
        lv1Value: '78% Search Hit',
        lv2Value: '86% Search Hit',
        lv3Value: '91% Search Hit',
        latencyLv1Ms: 11,
        latencyLv2Ms: 7,
        latencyLv3Ms: 4,
        bestAgainst: 'Tìm kiếm & lọc dữ liệu nặng',
      };
    case 'queue':
      return {
        primaryMetricLabel: 'Giảm tải ghi POST xuống DB',
        lv1Value: 'Giảm 52% CPU Ghi DB',
        lv2Value: 'Giảm 66% CPU Ghi DB',
        lv3Value: 'Giảm 74% CPU Ghi DB',
        latencyLv1Ms: 9,
        latencyLv2Ms: 5,
        latencyLv3Ms: 4,
        bestAgainst: 'Xung đột biến POST (Đơn hàng/IoT)',
      };
    case 'stream_processor':
      return {
        primaryMetricLabel: 'Gom lô Stream Realtime',
        lv1Value: 'Giảm 58% CPU Ghi DB',
        lv2Value: 'Giảm 68% CPU Ghi DB',
        lv3Value: 'Giảm 76% CPU Ghi DB',
        latencyLv1Ms: 11,
        latencyLv2Ms: 7,
        latencyLv3Ms: 5,
        bestAgainst: 'Clickstream, IoT & sự kiện liên tục',
      };
    case 'worker':
      return {
        primaryMetricLabel: 'Nén & xử lý bất đồng bộ',
        lv1Value: 'Giảm thêm 22% tải Ghi',
        lv2Value: 'Giảm thêm 36% tải Ghi',
        lv3Value: 'Giảm thêm 46% tải Ghi',
        latencyLv1Ms: 11,
        latencyLv2Ms: 6,
        latencyLv3Ms: 4,
        bestAgainst: 'Kết hợp sau Kafka/MQ hoặc Flink',
      };
    case 'batch_etl':
      return {
        primaryMetricLabel: 'Tổng hợp & nén ghi DB',
        lv1Value: 'Giảm 32% tải ghi báo cáo',
        lv2Value: 'Giảm 45% tải ghi báo cáo',
        lv3Value: 'Giảm 54% tải ghi báo cáo',
        latencyLv1Ms: 12,
        latencyLv2Ms: 8,
        latencyLv3Ms: 5,
        bestAgainst: 'Log & tổng hợp báo cáo định kỳ',
      };
    case 'read_replica':
      return {
        primaryMetricLabel: 'Gánh truy vấn GET khỏi DB',
        lv1Value: '77% GET Offload',
        lv2Value: '92% GET Offload',
        lv3Value: '95% GET Offload',
        latencyLv1Ms: 12,
        latencyLv2Ms: 7,
        latencyLv3Ms: 5,
        bestAgainst: 'Đọc báo cáo nặng & Dashboard',
      };
    case 'object_storage':
      return {
        primaryMetricLabel: 'Lưu trữ Media ngoài DB',
        lv1Value: '90% Media Offload',
        lv2Value: '97% Media Offload',
        lv3Value: '99% Media Offload',
        latencyLv1Ms: 10,
        latencyLv2Ms: 6,
        latencyLv3Ms: 4,
        bestAgainst: 'Video/Ảnh dung lượng lớn',
      };
    case 'primary_db':
      return {
        primaryMetricLabel: 'Database SQL Shard phụ',
        lv1Value: '-12% tải SQL · Pool 120',
        lv2Value: '-24% tải SQL · Pool 200',
        lv3Value: '-34% tải SQL · Pool 320',
        latencyLv1Ms: 15,
        latencyLv2Ms: 12,
        latencyLv3Ms: 9,
        bestAgainst: 'Chia đôi tải cụm DB quan hệ',
      };
    case 'nosql_db':
      return {
        primaryMetricLabel: 'Document DB chịu ghi cao',
        lv1Value: '-38% CPU ghi POST',
        lv2Value: '-46% CPU ghi POST',
        lv3Value: '-54% CPU ghi POST',
        latencyLv1Ms: 14,
        latencyLv2Ms: 11,
        latencyLv3Ms: 8,
        bestAgainst: 'Ghi POST, Giỏ hàng & JSON',
      };
    case 'timeseries_db':
      return {
        primaryMetricLabel: 'Time-Series / Log Sink',
        lv1Value: '-42% CPU Telemetry/Media',
        lv2Value: '-50% CPU Telemetry/Media',
        lv3Value: '-58% CPU Telemetry/Media',
        latencyLv1Ms: 14,
        latencyLv2Ms: 11,
        latencyLv3Ms: 8,
        bestAgainst: 'IoT cảm biến, Metrics & Log',
      };
  }
}

export interface NodeOperationalTelemetry {
  status: 'idle' | 'active' | 'warning' | 'degraded';
  line1: string;
  line2: string;
  badgeText: string;
  badgeLevel: 'normal' | 'warning' | 'danger';
  borderColor: string;
}

export function getNodeOperationalTelemetry(
  node: InfraNode,
  simStage: 'DESIGNING' | 'SIMULATING',
  opts?: { elapsedSec?: number; globalDbCpu?: number }
): NodeOperationalTelemetry {
  const isDb = isDatabaseSinkType(node.type);
  const elapsed = Math.max(1, opts?.elapsedSec ?? 4);
  const dbCpuVal = isDb ? Math.round(node.localDbCpu ?? opts?.globalDbCpu ?? 10) : 0;
  const maxConn = node.dbPoolMode === 'high_pool' ? 240 : 120 + (node.level - 1) * 40;
  const dropCount = node.droppedCount ?? 0;
  const totalHandled = Math.max(1, node.processedCount + node.cacheHitCount + node.blockedCount + dropCount);
  const dropPct = Math.min(99, Math.round((dropCount / totalHandled) * 100));

  if (simStage === 'DESIGNING') {
    if (node.type === 'ingress') {
      return {
        status: 'idle',
        line1: 'GATEWAY · STANDBY',
        line2: 'Chờ phát tải giả lập',
        badgeText: '',
        badgeLevel: 'normal',
        borderColor: '#475569',
      };
    }
    if (isDb || node.type === 'database') {
      return {
        status: 'idle',
        line1: `STANDBY · v.${node.level}`,
        line2: `conn 0/${maxConn} · idle`,
        badgeText: '',
        badgeLevel: 'normal',
        borderColor: '#64748B',
      };
    }
    const entry = getNodeCatalogEntry(node.type);
    return {
      status: 'idle',
      line1: `STANDBY · v.${node.level}`,
      line2: entry.shortMetricTag,
      badgeText: '',
      badgeLevel: 'normal',
      borderColor: '#475569',
    };
  }

  // Active simulation telemetry
  const estRps = Math.max(20, Math.round((totalHandled / elapsed) * 42));
  const rpsStr = estRps >= 1000 ? `${(estRps / 1000).toFixed(1)}k/s` : `${estRps}/s`;
  const latMs = Math.max(2, Math.round(node.avgNodeLatencyMs || (isDb ? 16 : 9)));
  const heatPct = Math.round(node.heat * 100);
  const qMax =
    node.type === 'queue' || node.type === 'stream_processor'
      ? getQueueMaxBuffer(node.level, node.queueCapacityMode)
      : 0;
  const qCount = node.queueBuffer ?? 0;
  const qPct = qMax > 0 ? Math.round((qCount / qMax) * 100) : 0;

  let status: NodeOperationalTelemetry['status'] = 'active';
  let badgeLevel: NodeOperationalTelemetry['badgeLevel'] = 'normal';
  let badgeText = `${latMs}ms`;
  let borderColor = '#10B981';

  if (dropCount > 0 && (heatPct >= 82 || dbCpuVal >= 88)) {
    status = 'degraded';
    badgeLevel = 'danger';
    badgeText = `Drop ${Math.max(1, dropPct)}%`;
    borderColor = '#EF4444';
  } else if ((isDb && dbCpuVal >= 90) || (!isDb && heatPct >= 88) || qPct >= 88) {
    status = 'degraded';
    badgeLevel = 'danger';
    badgeText = isDb ? `CPU ${dbCpuVal}%` : qMax > 0 ? `Queue ${qPct}%` : `Nóng ${heatPct}%`;
    borderColor = '#EF4444';
  } else if ((isDb && dbCpuVal >= 62) || (!isDb && heatPct >= 58) || qPct >= 62 || latMs >= 42) {
    status = 'warning';
    badgeLevel = 'warning';
    badgeText = isDb ? `CPU ${dbCpuVal}%` : qMax > 0 ? `Queue ${qPct}%` : `${latMs}ms`;
    borderColor = '#F59E0B';
  } else {
    if (node.blockedCount > 0) badgeText = `BLK ${node.blockedCount}`;
    else if (node.cacheHitCount > 0) {
      const hitPct = Math.min(99, Math.round((node.cacheHitCount / totalHandled) * 100));
      badgeText = `Hit ${hitPct}%`;
    } else if (isDb) {
      badgeText = `CPU ${dbCpuVal}%`;
    }
  }

  if (node.type === 'ingress') {
    return {
      status: 'active',
      line1: `IN · ${rpsStr}`,
      line2: 'Live Edge Stream',
      badgeText: '',
      badgeLevel: 'normal',
      borderColor: '#38BDF8',
    };
  }

  if (isDb) {
    const lockMs = Math.max(2, Math.round((dbCpuVal / 100) * 18 + (node.dbPoolMode === 'high_pool' ? -3 : 2)));
    const activeConn = Math.min(maxConn, Math.max(8, Math.round((dbCpuVal / 100) * maxConn * 0.92)));
    return {
      status,
      line1: `CPU ${dbCpuVal}% · lock ${lockMs}ms`,
      line2: `conn ${activeConn}/${maxConn}`,
      badgeText,
      badgeLevel,
      borderColor,
    };
  }

  if (node.type === 'redis' || node.type === 'varnish' || node.type === 'cdn') {
    const hitPct = Math.min(99, Math.round((node.cacheHitCount / totalHandled) * 100));
    const memMb = 180 + node.level * 120 + Math.min(480, Math.round(node.cacheHitCount * 2.4));
    return {
      status,
      line1: `hit ${hitPct}% · mem ${memMb}MB`,
      line2: `v.${node.level} · ${rpsStr} · ${latMs}ms`,
      badgeText,
      badgeLevel,
      borderColor,
    };
  }

  if (node.type === 'queue' || node.type === 'stream_processor') {
    return {
      status,
      line1: `q ${qCount}/${qMax} · ${rpsStr}`,
      line2: `v.${node.level} · lag ${latMs}ms`,
      badgeText,
      badgeLevel,
      borderColor,
    };
  }

  if (node.type === 'waf' || node.type === 'rate_limiter' || node.type === 'ddos_scrubber') {
    const blkPct = Math.min(99, Math.round((node.blockedCount / totalHandled) * 100));
    return {
      status,
      line1: `blk ${node.blockedCount} (${blkPct}%)`,
      line2: `v.${node.level} · ${node.limiterMode ?? 'std'} · ${latMs}ms`,
      badgeText,
      badgeLevel,
      borderColor,
    };
  }

  return {
    status,
    line1: `v.${node.level} · ${rpsStr} · ${latMs}ms`,
    line2: dropCount > 0 ? `drop ${dropPct}% · heat ${heatPct}%` : `heat ${heatPct}% · ok`,
    badgeText,
    badgeLevel,
    borderColor,
  };
}

export interface WaveSummarySnapshot {
  waveNumber: number;
  waveLabel: string;
  successRatePct: number;
  droppedCount: number;
  uptimePct: number;
  peakLatencyMs: number;
  targetSlaMs: number;
  activeNodeCount: number;
  activeDbCount: number;
  peakDbCpu: number;
  diagnosisLine: string;
}

export function diagnoseWavePerformance(stats: {
  waveNumber: number;
  waveLabel: string;
  deliveredOk: number;
  droppedPackets: number;
  breachedAttacks: number;
  uptimePct: number;
  peakLatencyMs: number;
  targetSlaMs: number;
  peakDbCpu: number;
  nodes: readonly InfraNode[];
  edges: readonly InfraEdge[];
}): WaveSummarySnapshot {
  const activeNodes = stats.nodes.filter((n) => n.type !== 'ingress' && !isDatabaseSinkType(n.type));
  const activeDbCount = getDatabaseSinkNodes(stats.nodes).filter((db) =>
    stats.edges.some((e) => e.toId === db.id)
  ).length;
  const totalReq = Math.max(1, stats.deliveredOk + stats.droppedPackets + stats.breachedAttacks);
  const successRatePct = Math.max(0, Math.min(100, Number((((stats.deliveredOk) / totalReq) * 100).toFixed(1))));

  const activeTypes = new Set(stats.nodes.map((n) => n.type));
  let diagnosisLine = `Đợt ${stats.waveNumber} vận hành ổn định trong ngưỡng SLA (${stats.peakLatencyMs}ms ≤ ${stats.targetSlaMs}ms).`;

  if (stats.breachedAttacks > 0) {
    diagnosisLine = `Đợt ${stats.waveNumber} lọt ${stats.breachedAttacks} gói tấn công xuống DB — cần bổ sung WAF [1] hoặc Rate Limiter [2] / Scrubber [Q].`;
  } else if (stats.peakDbCpu >= 82) {
    if (activeDbCount < 2 && !activeTypes.has('queue')) {
      diagnosisLine = `Đợt ${stats.waveNumber} nghẽn tại DB Cluster (${Math.round(stats.peakDbCpu)}%) do POST dồn trực tiếp — thêm Kafka/MQ [7] hoặc tách thêm DB Shard.`;
    } else {
      diagnosisLine = `Đợt ${stats.waveNumber} cụm DB nóng (${Math.round(stats.peakDbCpu)}%) — nâng cấp Redis/Replica hoặc bật Pool lớn trước đợt tiếp theo.`;
    }
  } else if (stats.droppedPackets > 0) {
    diagnosisLine = `Đợt ${stats.waveNumber} rớt ${stats.droppedPackets} request do bão hòa queue/node — thử scale Lv.2–Lv.3 hoặc chia thêm nhánh qua LB [4].`;
  } else if (stats.peakLatencyMs > stats.targetSlaMs) {
    diagnosisLine = `Đợt ${stats.waveNumber} trễ đỉnh ${stats.peakLatencyMs}ms vượt SLA ${stats.targetSlaMs}ms — thêm Redis/Varnish ở biên hoặc tăng Pool.`;
  }

  return {
    waveNumber: stats.waveNumber,
    waveLabel: stats.waveLabel,
    successRatePct,
    droppedCount: stats.droppedPackets + stats.breachedAttacks,
    uptimePct: Math.round(stats.uptimePct),
    peakLatencyMs: Math.round(stats.peakLatencyMs),
    targetSlaMs: stats.targetSlaMs,
    activeNodeCount: activeNodes.length,
    activeDbCount: Math.max(1, activeDbCount),
    peakDbCpu: Math.round(stats.peakDbCpu),
    diagnosisLine,
  };
}

export interface LiveTelemetryDiagnosis {
  totalHandled: number;
  cacheHitRatePct: number;
  threatBlockRatePct: number;
  hottestNode: {
    id: string;
    type: InfraNodeType;
    label: string;
    heatPct: number;
  } | null;
  unusedNodeIds: string[];
}

export function diagnoseArchitectureTelemetry(
  nodes: readonly InfraNode[],
  edges: readonly InfraEdge[],
  stats: {
    deliveredOk: number;
    cacheHits: number;
    blockedAttacks: number;
    breachedAttacks: number;
    dbCpu: number;
  }
): LiveTelemetryDiagnosis {
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
  const q2 = getDatabaseSinkNodes(nodes).map((n) => n.id);
  while (q2.length > 0) {
    const cur = q2.shift()!;
    if (backwardReachable.has(cur)) continue;
    backwardReachable.add(cur);
    for (const e of edges) {
      if (e.toId === cur) q2.push(e.fromId);
    }
  }

  const unusedNodeIds = nodes
    .filter((n) => !n.fixed && (!forwardReachable.has(n.id) || !backwardReachable.has(n.id)))
    .map((n) => n.id);

  let hottest: LiveTelemetryDiagnosis['hottestNode'] = null;
  let bestScore = 0;

  for (const n of nodes) {
    if (n.type === 'ingress') continue;
    const isDb = isDatabaseSinkType(n.type);
    const effectivePct = isDb
      ? Math.round(n.localDbCpu ?? stats.dbCpu)
      : Math.round(n.heat * 100);
    if (effectivePct >= 55 && effectivePct > bestScore) {
      bestScore = effectivePct;
      const label = n.type === 'database' ? 'DB CLUSTER' : getNodeCatalogEntry(n.type).shortName;
      hottest = {
        id: n.id,
        type: n.type,
        label,
        heatPct: effectivePct,
      };
    }
  }

  const totalHandled = stats.deliveredOk + stats.blockedAttacks + stats.breachedAttacks;
  const cacheHitRatePct =
    stats.deliveredOk > 0 ? Math.min(100, Math.round((stats.cacheHits / stats.deliveredOk) * 100)) : 0;
  const totalThreats = stats.blockedAttacks + stats.breachedAttacks;
  const threatBlockRatePct =
    totalThreats > 0 ? Math.round((stats.blockedAttacks / totalThreats) * 100) : 100;

  return {
    totalHandled,
    cacheHitRatePct,
    threatBlockRatePct,
    hottestNode: hottest,
    unusedNodeIds,
  };
}


