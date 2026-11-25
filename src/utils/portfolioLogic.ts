export type ThemeMode = 'light' | 'dark';

export type AppRoute = 'profile' | 'gallery' | 'cv' | 'game' | 'studio' | 'chronos' | 'cloud_valley';

export type GalleryCategory = 'all' | 'imperial' | 'poetic' | 'portrait' | 'moments';

export type ProjectCategory = 'all' | 'ai' | 'fintech' | 'healthcare';

export type ShowcaseTemplateId =
  | 'modern'
  | 'classical'
  | 'introvert'
  | 'extrovert'
  | 'youthful'
  | 'retro';

export type ProfileTemplateId = ShowcaseTemplateId;

export type CvTemplateId = ShowcaseTemplateId;

export type GalleryTemplateId = ShowcaseTemplateId;

export const SHOWCASE_TEMPLATE_IDS: readonly ShowcaseTemplateId[] = [
  'modern',
  'classical',
  'introvert',
  'extrovert',
  'youthful',
  'retro',
];

export interface TemplateOption<T extends string> {
  id: T;
  label: string;
  shortDesc: string;
}

export const PROFILE_TEMPLATE_OPTIONS: TemplateOption<ProfileTemplateId>[] = [
  { id: 'modern', label: 'Hiện Đại', shortDesc: 'Bento kỹ thuật sắc nét' },
  { id: 'classical', label: 'Cổ Trang', shortDesc: 'Thủy mặc, ấn triện & thi ca' },
  { id: 'introvert', label: 'Hướng Nội', shortDesc: 'Tĩnh lặng, tối giản & sâu lắng' },
  { id: 'extrovert', label: 'Hướng Ngoại', shortDesc: 'Sân khấu lớn & kết nối mạnh' },
  { id: 'youthful', label: 'Trẻ Trung', shortDesc: 'Phá cách, năng động & tươi mới' },
  { id: 'retro', label: 'Hoài Cổ', shortDesc: 'Nhật ký giấy cũ & phim 35mm' },
];

export const CV_TEMPLATE_OPTIONS: TemplateOption<CvTemplateId>[] = [
  { id: 'modern', label: 'Hiện Đại', shortDesc: '2 Cột Navy Studio sắc nét' },
  { id: 'classical', label: 'Cổ Trang', shortDesc: 'Công danh khung kép & ấn triện' },
  { id: 'introvert', label: 'Hướng Nội', shortDesc: 'Học thuật tĩnh tại một cột' },
  { id: 'extrovert', label: 'Hướng Ngoại', shortDesc: 'Header sân khấu đậm dấu ấn' },
  { id: 'youthful', label: 'Trẻ Trung', shortDesc: 'Dòng thời gian phá cách năng động' },
  { id: 'retro', label: 'Hoài Cổ', shortDesc: 'Máy chữ lưu trữ & ảnh Polaroid' },
];

export const GALLERY_TEMPLATE_OPTIONS: TemplateOption<GalleryTemplateId>[] = [
  { id: 'modern', label: 'Hiện Đại', shortDesc: 'Khung Bento 12 cột chuẩn mực' },
  { id: 'classical', label: 'Cổ Trang', shortDesc: 'Tranh cuộn thủy mặc & lạc khoản' },
  { id: 'introvert', label: 'Hướng Nội', shortDesc: 'Phòng tranh tĩnh lặng một dải' },
  { id: 'extrovert', label: 'Hướng Ngoại', shortDesc: 'Sân khấu ảnh cỡ lớn đầy năng lượng' },
  { id: 'youthful', label: 'Trẻ Trung', shortDesc: 'Lưới cắt dán tự nhiên phá cách' },
  { id: 'retro', label: 'Hoài Cổ', shortDesc: 'Cuộn phim 35mm & khung Polaroid' },
];

const LEGACY_TEMPLATE_ALIASES: Record<string, ShowcaseTemplateId> = {
  editorial: 'modern',
  bento: 'modern',
  classic: 'modern',
  sidebar: 'modern',
  executive: 'introvert',
  spotlight: 'introvert',
  masonry: 'youthful',
};

export function resolveTemplateSelection<T extends string>(
  stored: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (stored && (allowed as readonly string[]).includes(stored)) {
    return stored as T;
  }
  if (stored && LEGACY_TEMPLATE_ALIASES[stored]) {
    const mapped = LEGACY_TEMPLATE_ALIASES[stored];
    if ((allowed as readonly string[]).includes(mapped)) {
      return mapped as T;
    }
  }
  return fallback;
}

export interface RouteSeoMeta {
  title: string;
  description: string;
  keywords: string;
  ogType: 'profile' | 'website';
  ogImageAlt: string;
  path: string;
}

export interface ArtworkItem {
  id: string;
  category: Exclude<GalleryCategory, 'all'>;
  categoryLabel: string;
  mediaType?: 'image' | 'video';
  posterSrc?: string;
  objectPosition?: 'top' | 'center';
  title: string;
  subtitle: string;
  story: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectType: 'landscape' | 'portrait';
  year: string;
  specs: {
    format: string;
    aspect: string;
    lighting: string;
    concept: string;
    fileSize: string;
  };
}

export interface ProjectHighlight {
  title: string;
  description: string;
}

export interface PortfolioProject {
  id: string;
  category: Exclude<ProjectCategory, 'all'>;
  domainLabel: string;
  orgBadge: string;
  meta: string;
  title: string;
  summary: string;
  highlights: ProjectHighlight[];
  tags: string[];
  statusLabel: string;
}

export interface TerminalEntry {
  id: string;
  text: string;
  toneClass: string;
}

export type CliExecutionResult =
  | { action: 'noop' }
  | { action: 'clear' }
  | {
      action: 'append';
      commandEcho: string;
      responseText: string;
      responseToneClass: string;
    };

export function resolveInitialTheme(stored: string | null | undefined): ThemeMode {
  return stored === 'dark' ? 'dark' : 'light';
}

export function resolveNextTheme(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function parseAppRoute(pathname: string, hash = ''): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
  const cleanHash = hash.replace(/^#/, '').toLowerCase();
  if (cleanPath === '/trien-lam' || cleanPath === '/gallery' || cleanHash === 'trien-lam') {
    return 'gallery';
  }
  if (
    cleanPath === '/cv' ||
    cleanPath === '/cv-pdf' ||
    cleanHash === 'cv' ||
    cleanHash === 'cv-pdf'
  ) {
    return 'cv';
  }
  if (
    cleanPath === '/game' ||
    cleanPath === '/games' ||
    cleanPath === '/tro-choi' ||
    cleanPath === '/co-tuong' ||
    cleanPath === '/xiangqi' ||
    cleanHash === 'game' ||
    cleanHash === 'co-tuong'
  ) {
    return 'game';
  }
  if (
    cleanPath === '/studio' ||
    cleanPath === '/sang-tac' ||
    cleanPath === '/lyric-groove' ||
    cleanHash === 'studio' ||
    cleanHash === 'sang-tac'
  ) {
    return 'studio';
  }
  if (
    cleanPath === '/chronos' ||
    cleanPath === '/chronosflow' ||
    cleanHash === 'chronos' ||
    cleanHash === 'chronosflow'
  ) {
    return 'chronos';
  }
  if (
    cleanPath === '/thung-lung-may' ||
    cleanPath === '/cloud-valley' ||
    cleanHash === 'thung-lung-may' ||
    cleanHash === 'cloud-valley'
  ) {
    return 'cloud_valley';
  }
  return 'profile';
}

export function getRoutePath(route: AppRoute): string {
  if (route === 'gallery') return '/trien-lam';
  if (route === 'cv') return '/cv';
  if (route === 'game') return '/game';
  if (route === 'studio') return '/studio';
  if (route === 'chronos') return '/chronos';
  if (route === 'cloud_valley') return '/thung-lung-may';
  return '/';
}

export function getRouteSeoMeta(route: AppRoute): RouteSeoMeta {
  if (route === 'cloud_valley') {
    return {
      title: 'Thung Lũng Mây (Cloud Valley Homestead) — Nông Trại Lai Tạo & Tự Động Hóa',
      description:
        'Game quản lý nông trại Isometric 2.5D trên tầng mây: canh tác luân canh, lai tạo giống cây đột biến, xưởng thủ công 3 tầng, 4 mùa & Tinh Linh Đất.',
      keywords:
        'Thung Lũng Mây, Cloud Valley Homestead, game nông trại, lai tạo thực vật, tự động hóa, IndexedDB',
      ogType: 'website',
      ogImageAlt: 'Thung Lũng Mây — Cloud Valley Homestead',
      path: '/thung-lung-may',
    };
  }
  if (route === 'chronos') {
    return {
      title: 'ChronosFlow — Hệ Điều Hành Thời Gian, Năng Lượng & AI Time-Blocking',
      description:
        'ChronosFlow kết hợp Smart Time-Blocking kéo-thả, Quản trị Năng lượng Sinh học, Deep Work Studio, AI Auto-Rescheduler và JSON DB cục bộ.',
      keywords:
        'ChronosFlow, Time-blocking, Energy Management, AI Auto-Rescheduler, Deep Work, Pomodoro, Ultradian Rhythm',
      ogType: 'website',
      ogImageAlt: 'ChronosFlow — Hệ Điều Hành Thời Gian, Năng Lượng & AI Time-Blocking',
      path: '/chronos',
    };
  }
  if (route === 'studio') {
    return {
      title: 'Lyric & Groove Sketchpad — Bàn Nháp Sáng Tác Nhạc',
      description:
        'Ứng dụng sáng tác nhạc tức thì ngay trên trình duyệt: gõ lời gắn hợp âm, đếm âm tiết, tô màu vần, đệm Groove Loop, ngân nga ra nốt MIDI & xuất PDF.',
      keywords:
        'Lyric Groove Sketchpad, bàn nháp sáng tác nhạc, gợi ý hợp âm, Tone.js, Tonal.js, Hum to MIDI, Piano Roll, Lead Sheet PDF',
      ogType: 'website',
      ogImageAlt: 'Lyric & Groove Sketchpad — Bàn Nháp Sáng Tác Tức Thì trên trình duyệt',
      path: '/studio',
    };
  }
  if (route === 'gallery') {
    return {
      title: 'Triển Lãm Ảnh & Video — Thuận Lê (37 Tác Phẩm)',
      description:
        'Khám phá 37 khoảnh khắc WebP & video H.264 tối ưu tốc độ của Thuận Lê: Nàng Thơ Hoa Đào, Coding Timelapse, chuyến đi Tam Đảo, rừng thông và MISA.',
      keywords:
        'Triển lãm ảnh Thuận Lê, Nàng Thơ Hoa Đào, Tam Đảo, Coding Timelapse, WebP Gallery, AI Visual Art, MISA Hạ Long',
      ogType: 'website',
      ogImageAlt: 'Triển lãm ảnh và video 37 tác phẩm của kỹ sư Thuận Lê',
      path: '/trien-lam',
    };
  }
  if (route === 'cv') {
    return {
      title: 'CV PDF Lê Văn Thuận — Kỹ Sư Senior .NET (Chuẩn A4)',
      description:
        'Xem trực tuyến và tải CV PDF chuẩn A4 của kỹ sư Senior .NET Lê Văn Thuận: kinh nghiệm MISA OneAI, Agribank, Phenikaa MEC, kỹ năng .NET 8 và AI Agent.',
      keywords:
        'CV Lê Văn Thuận, CV PDF Senior .NET, C# .NET 8 Developer, MISA OneAI, Smart Form Agribank, Phenikaa MEC',
      ogType: 'profile',
      ogImageAlt: 'Hồ sơ CV PDF chuẩn A4 của kỹ sư Senior .NET Lê Văn Thuận',
      path: '/cv',
    };
  }
  if (route === 'game') {
    return {
      title: 'Khu Trò Chơi 2D & 3D — Thung Lũng Mây, Cờ Tướng, Pháo Đài',
      description:
        'Chơi 12 game web: Thung Lũng Mây, Cờ Tướng AI, Pháo Đài, Tìm Mèo, Hồ Sơ Dị Biệt, Lưỡng Cước Dương 3D, Học Viện Cô Sơn 2.5D, Chuẩn OCD, Túi Mù & FE.',
      keywords:
        'Game Web, Thung Lũng Mây, Cloud Valley Homestead, Cờ Tướng AI, Thủ Thành Pháo Đài, Tìm Mèo, Lưỡng Cước Dương 3D, Thanh Minh Học Viện Cô Sơn, Hồ Sơ Dị Biệt, Sắp Xếp OCD, Tiệm Xé Túi Mù, Ubuntu CLI, Thuận Lê',
      ogType: 'website',
      ogImageAlt: 'Khu Trò Chơi 2D & 3D gồm Thung Lũng Mây, Cờ Tướng AI, Thủ Thành Pháo Đài và các game web',
      path: '/game',
    };
  }
  return {
    title: 'Thuận Lê — Kỹ Sư Senior .NET & Hệ Thống AI',
    description:
      'Hồ sơ kỹ sư Senior .NET Lê Văn Thuận: gần 4 năm phát triển hệ thống tải cao tại MISA OneAI, Agribank, Phenikaa MEC. Xem dự án và tải CV chuẩn A4.',
    keywords:
      'Thuận Lê, Lê Văn Thuận, Senior .NET Engineer, MISA OneAI, Agribank, Phenikaa MEC, CV PDF Senior .NET, AI Agents, triển lãm ảnh',
    ogType: 'profile',
    ogImageAlt: 'Kỹ sư Senior .NET Lê Văn Thuận lập trình hệ thống ban đêm tại Hà Nội',
    path: '/',
  };
}

export function buildCanonicalUrl(origin: string, pathname: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanOrigin}${cleanPath}`;
}

export function normalizeVietnameseText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function filterGalleryItems(
  items: ArtworkItem[],
  category: GalleryCategory
): ArtworkItem[] {
  if (category === 'all') {
    return items;
  }
  return items.filter((item) => item.category === category);
}

export function searchAndFilterGalleryItems(
  items: ArtworkItem[],
  category: GalleryCategory,
  rawQuery: string
): ArtworkItem[] {
  const byCategory = filterGalleryItems(items, category);
  const query = normalizeVietnameseText(rawQuery);
  if (!query) {
    return byCategory;
  }

  return byCategory.filter((item) => {
    const haystack = normalizeVietnameseText(
      `${item.title} ${item.subtitle} ${item.story} ${item.categoryLabel} ${item.specs.concept} ${item.year}`
    );
    return haystack.includes(query);
  });
}

export function getGalleryCategoryCounts(
  items: ArtworkItem[]
): Record<GalleryCategory, number> {
  return {
    all: items.length,
    imperial: items.filter((i) => i.category === 'imperial').length,
    poetic: items.filter((i) => i.category === 'poetic').length,
    portrait: items.filter((i) => i.category === 'portrait').length,
    moments: items.filter((i) => i.category === 'moments').length,
  };
}

export function getNextGalleryIndex(currentIndex: number, total: number): number {
  if (total <= 0) return -1;
  return (currentIndex + 1) % total;
}

export function getPrevGalleryIndex(currentIndex: number, total: number): number {
  if (total <= 0) return -1;
  return (currentIndex - 1 + total) % total;
}

export function filterProjects(
  projects: PortfolioProject[],
  category: ProjectCategory
): PortfolioProject[] {
  if (category === 'all') {
    return projects;
  }
  return projects.filter((project) => project.category === category);
}

export function getProjectCategoryCounts(
  projects: PortfolioProject[]
): Record<ProjectCategory, number> {
  return {
    all: projects.length,
    ai: projects.filter((p) => p.category === 'ai').length,
    fintech: projects.filter((p) => p.category === 'fintech').length,
    healthcare: projects.filter((p) => p.category === 'healthcare').length,
  };
}

export function executeCliCommand(rawInput: string): CliExecutionResult {
  const cmd = rawInput.trim();
  if (!cmd) {
    return { action: 'noop' };
  }

  const lower = cmd.toLowerCase();

  if (lower === 'clear' || lower === 'cls') {
    return { action: 'clear' };
  }

  if (lower === 'help') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Các lệnh hỗ trợ:
  dotnet --info      : Xem thông tin Runtime & kiến trúc Backend
  ai-agents          : Kinh nghiệm dùng Gemini, Claude, Grok & Codex
  projects           : Liệt kê các hệ thống production lớn đã build
  cv                 : Xem tóm tắt CV & tải bản PDF tại /cv
  gallery            : Xem danh sách 37 tác phẩm ảnh WebP & video tại /trien-lam
  why-hire           : 4 lý do tại sao nên tuyển Thuận Lê
  stack              : Danh sách toàn bộ Database, Messaging & Framework
  contact            : Lấy thông tin liên hệ ngay lập tức
  clear              : Xóa màn hình terminal`,
      responseToneClass: 'text-slate-200',
    };
  }

  if (lower === 'ai-agents' || lower === 'ai' || lower === 'agents') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Kinh nghiệm thực chiến với AI Agent (đơn giản, hiệu quả):
  - Claude (Anthropic) : Đọc hiểu codebase lớn (.NET nhiều tầng), tìm lỗi logic, viết unit test.
  - Gemini (Google)    : Tóm tắt tài liệu nghiệp vụ dài, viết prompt ảnh/video & MISA OneAI API.
  - Codex (OpenAI)     : Tạo nhanh khung code DTO, script tự động, câu lệnh Docker & tối ưu SQL.
  - Grok (xAI)         : Tra cứu công nghệ mới, phản biện giải pháp nhanh khi xử lý lỗi lạ.
  Nguyên tắc: Chia nhỏ việc trước khi hỏi · Luôn tự kiểm tra lại code · Chọn đúng AI cho đúng việc.`,
      responseToneClass: 'text-cyan-300',
    };
  }

  if (lower === 'cv' || lower === 'cv pdf' || lower === 'resume') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `CV Senior .NET Systems Engineer (/cv):
- Ứng viên:     Lê Văn Thuận (Nhâm Ngọ 2002) · Hoài Đức, Hà Nội
- Kinh nghiệm:  04 Năm production (08/2022 – Nay) · Đội ngũ tới 60 devs
- Hệ thống:     MISA OneAI, Smart Form Agribank (AML), Phenikaa MEC (HIS), GC FAST, Lotus Edu, MEMID
- AI Agents:    Claude, Gemini, Codex, Grok — tăng tốc đọc code, tối ưu SQL & tạo nội dung AI
- Xuất bản PDF: Truy cập tab "CV PDF" (/cv) để xem chuẩn A4 & tải file .PDF ngay.`,
      responseToneClass: 'text-cyan-300',
    };
  }

  if (lower === 'dotnet --info') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `.NET SDK:
 Version:           8.0.300
 Architecture:      x64
 Runtime:           Microsoft.NETCore.App 8.0
 Workloads:         ASP.NET Core Web API, EF Core, Clean Architecture, CQRS
 AI Media Engine:   MISA OneAI Video/Image Synthesis & Prompt Orchestration`,
      responseToneClass: 'text-cyan-300',
    };
  }

  if (lower.includes('gallery') || lower.includes('photo')) {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Triển Lãm Nghệ Thuật & Đời Thường (/trien-lam — 37 Tác Phẩm WebP & H.264):
- Video (1): Coding Timelapse — Góc Làm Việc & Đam Mê (MP4 3.6 MB)
- Nàng Thơ Hoa Đào (1): Cố Phán Di Quang Thái — Nàng Thơ Giữa Hoa Đào
- Chân Dung (11): Coding Ban Công Đêm, Tam Đảo Đỉnh Núi, Ninja 400 Eagle Villa, Rừng Thông, Guitar Acoustic, Chân Dung Đời Thực, Thẻ Xanh, Filter Hoa Xuân
- Đồng Đội & Kỷ Niệm (24): Chuyến đi Tam Đảo, MISA Infinity Impact Award, Hạ Long 2026, Team MEC, Bàn Bi Lắc, Khán Đài Gỗ, Vịt 34, Lẩu Sum Vầy, Biển Bạc & Người Thương`,
      responseToneClass: 'text-sky-300',
    };
  }

  if (lower.includes('project')) {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `1. MISA OneAI for Family (2026 - Nay): AI LLM API, Vue 3, Video synthesis, MinIO.
2. Smart Form Agribank Outsource (2025 - 2026): Ngân hàng số, Oracle DB, phòng chống rửa tiền AML, thẻ tín dụng.
3. Phenikaa MEC Smart Hospital (2024 - Nay): HIS integration, 60 devs, Kafka, Elasticsearch, PostgreSQL.
4. GC Joint Stock (2025 - 2026): Hóa đơn điện tử Fast, Chữ ký số, HIS Agent integration.
5. Lotus Edu & TH Nguyễn Siêu (2023 - 2024): Tối ưu truy vấn legacy code xuống mili-giây.`,
      responseToneClass: 'text-slate-200',
    };
  }

  if (lower === 'why-hire') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `4 Giá Trị Cốt Lõi Thuận Lê Mang Lại:
1. Gần 4 năm thực chiến với các dự án lớn (Agribank, Phenikaa, MISA), không ngại dự án phức tạp.
2. Tư duy Performance: luôn tìm cách tối ưu SQL, cache Redis và kiến trúc event-driven.
3. Kỹ năng Clean Architecture & CQRS giúp code rõ ràng, dễ bảo trì và mở rộng.
4. Làm chủ AI Agent (Claude, Gemini, Codex, Grok): tăng tốc lập trình, viết test & tạo nội dung AI an toàn.`,
      responseToneClass: 'text-blue-300',
    };
  }

  if (lower === 'contact') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Thông tin liên lạc Thuận Lê:
- SĐT:      0352 988 596
- Email:    thuanlevan72@gmail.com
- GitHub:   https://github.com/thuanlevan72
- Facebook: https://www.facebook.com/thuanlevan72
- Địa chỉ:  Hoài Đức - Hà Nội`,
      responseToneClass: 'text-cyan-300 font-semibold',
    };
  }

  if (lower === 'stack') {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Languages:     C#, TypeScript, JavaScript, SQL
Frameworks:    ASP.NET Core, .NET 8, Vue 3, ReactJS, Next.js, NestJS
Databases:     PostgreSQL, Oracle, SQL Server, MySQL, MongoDB, Elasticsearch
Event & Cache: Apache Kafka, Redis Cluster
Auth & Tools:  Keycloak, Git, Docker, MinIO, GraphQL Hasura`,
      responseToneClass: 'text-sky-400',
    };
  }

  return {
    action: 'append',
    commandEcho: `thuanle@portfolio:~$ ${cmd}`,
    responseText: `Lệnh không nhận dạng: "${cmd}". Gõ 'help' để xem hướng dẫn.`,
    responseToneClass: 'text-rose-400',
  };
}

export interface CvSkillGroupInput {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly string[];
}

export interface CvMetricInput {
  readonly id: string;
  readonly value: string;
  readonly label: string;
}

export interface AiAgentExperienceItem {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly roleSummary: string;
  readonly simpleUsage: string;
  readonly realTaskExamples: readonly string[];
  readonly projectImpact: string;
}

export interface AiAgentPrincipleItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
}

export interface CvSourceData {
  profile: {
    fullName: string;
    fullLegalName: string;
    birthInfo: string;
    location: string;
    role: string;
    phoneFormatted: string;
    email: string;
    githubUrl: string;
    facebookUrl: string;
  };
  metrics: readonly CvMetricInput[];
  projects: readonly PortfolioProject[];
  skillGroups: readonly CvSkillGroupInput[];
  aiAgents?: readonly AiAgentExperienceItem[];
}

export function buildCvPlainText(data: CvSourceData): string {
  const { profile, metrics, projects, skillGroups, aiAgents } = data;
  const lines: string[] = [
    `${profile.fullLegalName.toUpperCase()} (${profile.fullName})`,
    profile.role,
    `${profile.birthInfo} | ${profile.location} | SĐT: ${profile.phoneFormatted} | Email: ${profile.email}`,
    `GitHub: ${profile.githubUrl}`,
    '',
    'CHỈ SỐ THỰC CHIẾN',
    ...metrics.map((m) => `- ${m.value}: ${m.label}`),
    '',
    'DỰ ÁN & KINH NGHIỆM PRODUCTION',
  ];

  for (const project of projects) {
    lines.push(`${project.title} — ${project.orgBadge} (${project.meta})`);
    lines.push(`  ${project.summary}`);
    for (const h of project.highlights) {
      lines.push(`  * ${h.title} ${h.description}`);
    }
    lines.push(`  Công nghệ: ${project.tags.join(', ')}`);
  }

  lines.push('', 'NĂNG LỰC KỸ THUẬT');
  for (const group of skillGroups) {
    lines.push(`- ${group.title}: ${group.items.join(', ')}`);
  }

  if (aiAgents && aiAgents.length > 0) {
    lines.push('', 'KINH NGHIỆM SỬ DỤNG AI AGENT (GEMINI · CLAUDE · CODEX · GROK)');
    for (const agent of aiAgents) {
      lines.push(`- ${agent.name} (${agent.provider}) — ${agent.roleSummary}: ${agent.simpleUsage}`);
    }
  }

  return lines.join('\n');
}

export function buildStructuredDataGraph(origin: string, route: AppRoute) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const seoMeta = getRouteSeoMeta(route);
  const currentUrl = buildCanonicalUrl(cleanOrigin, seoMeta.path);
  const logoUrl = `${cleanOrigin}/brand-logo.png`;
  const portraitUrl = `${cleanOrigin}/assets/gallery/thuan-le-doi-thuc.webp`;

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Hồ Sơ Kỹ Sư Thuận Lê',
      item: `${cleanOrigin}/`,
    },
  ];

  if (route === 'cv') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'CV PDF Chuẩn A4',
      item: `${cleanOrigin}/cv`,
    });
  } else if (route === 'gallery') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Triển Lãm Ảnh & Video',
      item: `${cleanOrigin}/trien-lam`,
    });
  } else if (route === 'game') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Game · Khu Trò Chơi 2D',
      item: `${cleanOrigin}/game`,
    });
  } else if (route === 'studio') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Lyric & Groove Sketchpad',
      item: `${cleanOrigin}/studio`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        '@id': `${cleanOrigin}/#brand`,
        name: 'Thuận Lê — Systems Engineering & AI Workflow',
        alternateName: 'TL Studio & Engineering',
        url: `${cleanOrigin}/`,
        logo: {
          '@type': 'ImageObject',
          '@id': `${cleanOrigin}/#logo`,
          url: logoUrl,
          contentUrl: logoUrl,
          width: 192,
          height: 192,
          caption: 'Logo monogram TL của kỹ sư Lê Văn Thuận',
        },
        sameAs: [
          'https://github.com/thuanlevan72?tab=repositories',
          'https://www.facebook.com/thuanlevan72',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${cleanOrigin}/#website`,
        url: `${cleanOrigin}/`,
        name: 'Thuận Lê — Kỹ Sư Senior .NET & Triển Lãm Thị Giác AI',
        inLanguage: 'vi',
        description:
          'Hồ sơ kỹ sư Senior .NET Lê Văn Thuận (MISA OneAI, Agribank, Phenikaa MEC), CV PDF chuẩn A4, kinh nghiệm AI Agent (Gemini, Claude, Grok, Codex) và triển lãm ảnh WebP/H.264.',
        publisher: { '@id': `${cleanOrigin}/#brand` },
        copyrightHolder: { '@id': `${cleanOrigin}/#person` },
      },
      {
        '@type':
          route === 'gallery' || route === 'game'
            ? 'CollectionPage'
            : route === 'studio'
            ? 'WebApplication'
            : 'ProfilePage',
        '@id': `${currentUrl}#webpage`,
        url: currentUrl,
        name: seoMeta.title,
        description: seoMeta.description,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${cleanOrigin}/#website` },
        mainEntity: { '@id': `${cleanOrigin}/#person` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url:
            route === 'gallery'
              ? `${cleanOrigin}/assets/gallery/nang-tho-hoa-dao.webp`
              : route === 'cv'
                ? `${cleanOrigin}/assets/gallery/chan-dung-the-xanh.webp`
                : portraitUrl,
          width: route === 'gallery' ? 1080 : route === 'cv' ? 472 : 675,
          height: route === 'gallery' ? 603 : route === 'cv' ? 709 : 1200,
        },
        breadcrumb: { '@id': `${currentUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${currentUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'Person',
        '@id': `${cleanOrigin}/#person`,
        name: 'Lê Văn Thuận',
        alternateName: 'Thuận Lê',
        jobTitle: 'Senior .NET Systems Engineer & AI Agent Practitioner',
        hasOccupation: {
          '@type': 'Occupation',
          name: 'Senior .NET Systems Engineer',
          occupationalCategory: 'Software Developers',
          skills:
            'C# .NET 8, Clean Architecture, CQRS, Oracle Database, PostgreSQL, Apache Kafka, Redis, AI Agents',
        },
        birthDate: '2002',
        url: `${cleanOrigin}/`,
        email: 'mailto:thuanlevan72@gmail.com',
        telephone: '+84-352-988-596',
        worksFor: {
          '@type': 'Organization',
          name: 'MISA JSC',
        },
        brand: { '@id': `${cleanOrigin}/#brand` },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Hoài Đức',
          addressRegion: 'Hà Nội',
          addressCountry: 'VN',
        },
        image: {
          '@type': 'ImageObject',
          url: portraitUrl,
          width: 675,
          height: 1200,
        },
        sameAs: [
          'https://github.com/thuanlevan72?tab=repositories',
          'https://www.facebook.com/thuanlevan72',
        ],
        knowsAbout: [
          'C# .NET 8',
          'ASP.NET Core Web API',
          'Clean Architecture',
          'CQRS & MediatR',
          'Apache Kafka',
          'Oracle Database',
          'PostgreSQL',
          'Redis Cluster',
          'AI Agents (Claude, Gemini, Codex, Grok)',
          'AI Image & Video Generation',
          'LLM Integration',
        ],
      },
      {
        '@type': 'ImageGallery',
        '@id': `${cleanOrigin}/#gallery`,
        url: `${cleanOrigin}/trien-lam`,
        name: 'Triển Lãm Ảnh & Video Đời Thường, Hành Trình & Đồng Đội — Thuận Lê',
        description:
          'Tuyển tập 37 tác phẩm thị giác tối ưu WebP và Video H.264 kết hợp nghệ thuật Nàng Thơ Hoa Đào, Coding Ban Công Đêm, Tam Đảo, Kawasaki Ninja 400, Rừng Thông và kỷ niệm MISA.',
        creator: { '@id': `${cleanOrigin}/#person` },
        associatedMedia: [
          {
            '@type': 'VideoObject',
            name: 'Coding Timelapse — Góc Làm Việc & Đam Mê',
            contentUrl: `${cleanOrigin}/assets/gallery/timelapse-coding.mp4`,
            thumbnailUrl: `${cleanOrigin}/assets/gallery/timelapse-coding-poster.webp`,
            encodingFormat: 'video/mp4',
            description:
              'Video tua nhanh 36 giây quá trình tập trung lập trình với bàn phím cơ đỏ tại văn phòng.',
          },
          {
            '@type': 'ImageObject',
            name: 'Cố Phán Di Quang Thái — Nàng Thơ Giữa Hoa Đào',
            contentUrl: `${cleanOrigin}/assets/gallery/nang-tho-hoa-dao.webp`,
            encodingFormat: 'image/webp',
            width: 1080,
            height: 603,
            description: 'Nàng thơ dưới mưa hoa đào cùng tia nắng sớm và thư pháp Hán tự.',
          },
          {
            '@type': 'ImageObject',
            name: 'Chân Dung Đời Thực — Thuận Lê 2026',
            contentUrl: portraitUrl,
            encodingFormat: 'image/webp',
            width: 675,
            height: 1200,
            description: 'Chân dung đời thực của kỹ sư Lê Văn Thuận tại không gian làm việc ở Hà Nội.',
          },
          {
            '@type': 'ImageObject',
            name: 'MISA Level Up With AI — Hạ Long 2026',
            contentUrl: `${cleanOrigin}/assets/gallery/misa-ha-long-2026.webp`,
            encodingFormat: 'image/webp',
            width: 1080,
            height: 720,
            description: 'Tập thể Khối Sản Xuất MISA tại sự kiện Level Up With AI Hạ Long 2026.',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${cleanOrigin}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Thuận Lê ứng dụng các AI Agent như Gemini, Claude, Grok và Codex vào công việc thực tế ra sao?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Mỗi AI Agent được dùng đúng thế mạnh: Claude giúp đọc codebase lớn, phát hiện lỗi logic và viết unit test; Gemini xử lý tài liệu nghiệp vụ dài và thiết kế prompt ảnh/video; Codex tạo nhanh khung code, script và tối ưu SQL; Grok hỗ trợ tra cứu công nghệ mới và phản biện giải pháp nhanh.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bộ sưu tập ảnh Nàng Thơ Hoa Đào và Video Timelapse được thực hiện như thế nào?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Các tác phẩm được Thuận Lê trực tiếp thiết kế prompt, kiểm soát ánh sáng, thẩm mỹ Á Đông và hậu kỳ tối ưu WebP / H.264 kết hợp cùng kinh nghiệm xây dựng pipeline AI Media Generation tại MISA OneAI.',
            },
          },
          {
            '@type': 'Question',
            name: 'Thuận Lê có những kinh nghiệm thực chiến gì về .NET và Hệ thống lớn?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Thuận Lê có gần 4 năm kinh nghiệm từ 08/2022 qua các hệ thống lớn như Smart Form Agribank (30 devs, AML & Oracle DB), Bệnh viện thông minh Phenikaa MEC (60 devs, HIS, Kafka, Elasticsearch) và MISA OneAI for Family (.NET 8, Vue 3, LLM API).',
            },
          },
          {
            '@type': 'Question',
            name: 'Làm sao để liên hệ hợp tác dự án phần mềm hoặc sáng tạo nội dung AI với Thuận Lê?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Bạn có thể gọi trực tiếp qua số 0352 988 596, gửi email về thuanlevan72@gmail.com hoặc kết nối qua GitHub và Facebook cá nhân ngay tại chân trang.',
            },
          },
        ],
      },
    ],
  };
}
