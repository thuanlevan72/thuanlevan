export type ThemeMode = 'light' | 'dark';

export type AppRoute = 'profile' | 'gallery' | 'cv';

export type GalleryCategory = 'all' | 'imperial' | 'poetic' | 'portrait' | 'moments';

export type ProjectCategory = 'all' | 'ai' | 'fintech' | 'healthcare';

export interface RouteSeoMeta {
  title: string;
  description: string;
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
  return 'profile';
}

export function getRoutePath(route: AppRoute): string {
  if (route === 'gallery') return '/trien-lam';
  if (route === 'cv') return '/cv';
  return '/';
}

export function getRouteSeoMeta(route: AppRoute): RouteSeoMeta {
  if (route === 'gallery') {
    return {
      title: 'Triển Lãm Ảnh & Video: Đời Thường, Hành Trình & MISA — Thuận Lê',
      description:
        'Phòng triển lãm trực tuyến 28 tác phẩm WebP & H.264 tối ưu tốc độ: Nàng Thơ Hoa Đào, Coding Đêm, Mô Tô Rừng Thông, Kỷ Niệm MISA và Người Thương.',
      path: '/trien-lam',
    };
  }
  if (route === 'cv') {
    return {
      title: 'CV PDF — Lê Văn Thuận | Kỹ Sư Senior .NET & Kiến Trúc Hệ Thống',
      description:
        'Bản CV điện tử và tải xuống PDF chuẩn A4 của kỹ sư Senior .NET Lê Văn Thuận: gần 4 năm kinh nghiệm hệ thống tài chính Agribank, Phenikaa MEC và MISA OneAI.',
      path: '/cv',
    };
  }
  return {
    title: 'Thuận Lê — Kỹ Sư Senior .NET & Kiến Trúc Hệ Thống Doanh Nghiệp',
    description:
      'Hồ sơ kỹ sư Senior .NET Lê Văn Thuận (MISA OneAI, Agribank, Phenikaa MEC) với gần 4 năm kinh nghiệm hệ thống tài chính, y tế và AI.',
    path: '/',
  };
}

export function buildCanonicalUrl(origin: string, pathname: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanOrigin}${cleanPath}`;
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
  projects           : Liệt kê các hệ thống production lớn đã build
  cv                 : Xem tóm tắt CV & tải bản PDF tại /cv
  gallery            : Xem danh sách 28 tác phẩm ảnh WebP & video tại /trien-lam
  why-hire           : 4 lý do tại sao nên tuyển Thuận Lê
  stack              : Danh sách toàn bộ Database, Messaging & Framework
  contact            : Lấy thông tin liên hệ ngay lập tức
  clear              : Xóa màn hình terminal`,
      responseToneClass: 'text-slate-200',
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
      responseText: `Triển Lãm Nghệ Thuật & Đời Thường (/trien-lam — 28 Tác Phẩm WebP & H.264):
- Video (1): Coding Timelapse — Góc Làm Việc & Đam Mê (MP4 3.6 MB)
- Nàng Thơ Hoa Đào (1): Cố Phán Di Quang Thái — Nàng Thơ Giữa Hoa Đào
- Chân Dung (10): Coding Ban Công Đêm, Ninja 400 Eagle Villa, Rừng Thông, Guitar Acoustic, Chân Dung Đời Thực, Thẻ Xanh, Filter Hoa Xuân
- Đồng Đội & Kỷ Niệm (16): MISA Infinity Impact Award, Hạ Long 2026, Team MEC, Bàn Bi Lắc, Khán Đài Gỗ, Vịt 34, Lẩu Sum Vầy, Biển Bạc & Người Thương`,
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
4. Tư duy thẩm mỹ & AI Media: làm chủ quy trình tích hợp LLM, sinh ảnh và video thực tế.`,
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
}

export function buildCvPlainText(data: CvSourceData): string {
  const { profile, metrics, projects, skillGroups } = data;
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

  return lines.join('\n');
}
