export type ThemeMode = 'light' | 'dark';

export type ProjectCategory = 'all' | 'ai' | 'fintech' | 'healthcare';

export interface ProjectHighlight {
  title: string;
  description: string;
}

export interface ProjectTag {
  label: string;
  tone: 'cyan' | 'emerald' | 'indigo' | 'amber' | 'surface' | 'muted';
}

export interface PortfolioProject {
  id: string;
  category: Exclude<ProjectCategory, 'all'>;
  themeVariant: 'emerald' | 'sky';
  orgBadge: string;
  orgIcon: 'psychology' | 'bank' | 'hospital' | 'document' | 'school' | 'memory';
  meta: string;
  title: string;
  summary: string;
  highlights: ProjectHighlight[];
  tags: ProjectTag[];
  statusLabel: string;
  statusIcon: 'check' | 'security' | 'verified' | 'signature' | 'flash' | 'code';
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
  why-hire           : 4 lý do tại sao nên tuyển Thuận Lê
  stack              : Danh sách toàn bộ Database, Messaging & Framework
  contact            : Lấy thông tin liên hệ ngay lập tức
  clear              : Xóa màn hình terminal`,
      responseToneClass: 'text-slate-200',
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
 Host Status:       ONLINE & HIGH AVAILABILITY`,
      responseToneClass: 'text-emerald-400',
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
      responseText: `⭐ 4 Giá Trị Cốt Lõi Thuận Lê Mang Lại:
1. Gần 4 năm thực chiến với các dự án lớn (Agribank, Phenikaa, MISA), không ngại dự án phức tạp.
2. Tư duy Performance: luôn tìm cách tối ưu SQL, cache Redis và kiến trúc event-driven.
3. Kỹ năng Clean Architecture & CQRS giúp code rõ ràng, dễ bảo trì và mở rộng.
4. Tinh thần học hỏi cao: chủ động tiếp cận AI LLM, Kafka, Docker và công nghệ mới.`,
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
      responseText: `Languages:    C#, TypeScript, JavaScript, SQL
Frameworks:   ASP.NET Core, .NET 8, Vue 3, ReactJS, Next.js, NestJS
Databases:    PostgreSQL, Oracle, SQL Server, MySQL, MongoDB, Elasticsearch
Event & Cache:Apache Kafka, Redis Cluster
Auth & Tools: Keycloak, Git, Docker, MinIO, GraphQL Hasura`,
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
