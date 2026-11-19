export type ThemeMode = 'light' | 'dark';

export type AppRoute = 'profile' | 'gallery';

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
  return 'profile';
}

export function getRoutePath(route: AppRoute): string {
  return route === 'gallery' ? '/trien-lam' : '/';
}

export function getRouteSeoMeta(route: AppRoute): RouteSeoMeta {
  if (route === 'gallery') {
    return {
      title: 'Triển Lãm Ảnh & Video: Cổ Phong, Hoa Đào & Đời Thường — Thuận Lê',
      description:
        'Phòng triển lãm trực tuyến 15 tác phẩm WebP & H.264 tối ưu tốc độ: Cổ Phong Đế Vương, Nàng Thơ Hoa Đào, Video Timelapse Coding và Kỷ Niệm Đồng Đội.',
      path: '/trien-lam',
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
  gallery            : Xem danh sách 15 tác phẩm ảnh WebP & video tại /trien-lam
  why-hire           : 4 lý do tại sao nên tuyển Thuận Lê
  stack              : Danh sách toàn bộ Database, Messaging & Framework
  contact            : Lấy thông tin liên hệ ngay lập tức
  clear              : Xóa màn hình terminal`,
      responseToneClass: 'text-stone-200',
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
      responseToneClass: 'text-emerald-400',
    };
  }

  if (lower.includes('gallery') || lower.includes('photo')) {
    return {
      action: 'append',
      commandEcho: `thuanle@portfolio:~$ ${cmd}`,
      responseText: `Triển Lãm Nghệ Thuật & Đời Thường (/trien-lam — 15 Tác Phẩm WebP & H.264):
- Video (1): Coding Timelapse — Góc Làm Việc & Đam Mê (MP4 3.6 MB)
- Nàng Thơ Hoa Đào (2): Cố Phán Di Quang Thái, Lệ Hoa Đào Dưới Mưa Sương
- Cổ Phong & Nho Sĩ (3): Long Bào Ngự Án, Mưu Lược Thiên Hạ, Nho Sĩ Thư Hương
- Chân Dung (3): Chân Dung Đời Thực, Chân Dung Thẻ Xanh, Filter Hoa Xuân
- Đồng Đội & Kỷ Niệm (6): MISA Hạ Long 2026, Team Outing Phố Biển, Lễ Vu Quy, Đêm Nghỉ Dưỡng, Đêm Trắng 02:38, Dạo Phố Đêm Bên Hồ`,
      responseToneClass: 'text-amber-300',
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
      responseToneClass: 'text-stone-200',
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
      responseToneClass: 'text-emerald-400',
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
      responseToneClass: 'text-amber-400 font-semibold',
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
