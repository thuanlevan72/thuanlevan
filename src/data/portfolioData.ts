import { PortfolioProject } from '../utils/portfolioLogic.ts';

export const PORTFOLIO_PROFILE = {
  fullName: 'Thuận Lê',
  birthInfo: 'Nhâm Ngọ 2002 • Dương Liễu Mộc',
  location: 'Nhâm Ngọ 2002 • Hoài Đức, Hà Nội',
  role: 'Senior .NET / Systems Architect',
  subtitle: 'Sinh Khí Dồi Dào • Rễ Sâu Vững Chắc • Senior .NET & Systems Engineer',
  phoneDisplay: '0352.988.596',
  phoneFormatted: '0352 988 596',
  phoneHref: 'tel:0352988596',
  email: 'thuanlevan72@gmail.com',
  emailHref: 'mailto:thuanlevan72@gmail.com',
  githubUrl: 'https://github.com/thuanlevan72?tab=repositories',
  facebookUrl: 'https://www.facebook.com/thuanlevan72',
  avatarSrc: '/assets/thuan-le-avatar.png',
};

export const WOOD_PILLARS = [
  {
    number: '01',
    title: 'Thâm Căn Cố Đế',
    description:
      'Cây đại thụ muốn vươn cao thì rễ phải cắm sâu vào lòng đất. Tôi chú trọng nền tảng vững chắc: cấu trúc C# .NET Core, indexing CSDL (Oracle, Postgres, SQL Server) và xử lý bất đồng bộ triệt để.',
    badgeClass:
      'bg-emerald-100 dark:bg-dark-primary/10 text-emerald-800 dark:text-dark-primary border border-emerald-400 dark:border-dark-primary/30',
  },
  {
    number: '02',
    title: 'Thủy Nhu Dưỡng Mộc',
    description:
      'Nước nuôi dưỡng cây. Dòng dữ liệu (Data Streams, Kafka, Redis) được điều phối thông suốt, không nghẽn tắc, đảm bảo hệ thống ngân hàng và bệnh viện vận hành mượt mà 24/7.',
    badgeClass:
      'bg-sky-100 dark:bg-cyan/10 text-cyan dark:text-sky-400 border border-sky-400 dark:border-sky-400/30',
  },
  {
    number: '03',
    title: 'Sinh Trưởng Bất Tận',
    description:
      'Dương Liễu Mộc không bao giờ đứng yên. Luôn đón nhận các xu thế công nghệ mới nhất: đưa AI LLM vào ứng dụng gia đình MISA, làm chủ Vue 3 / Next.js để sẵn sàng cho mọi bài toán tương lai.',
    badgeClass:
      'bg-indigo-100 dark:bg-accent/15 text-indigo-900 dark:text-indigo-400 border border-indigo-400 dark:border-indigo-400/30',
  },
] as const;

export const ENGINEERING_STATS = [
  {
    id: 'experience',
    label: 'THỜI GIAN THỰC CHIẾN',
    value: 'gần 4 Năm',
    description: 'Từ 08/2022 đến nay, liên tục gắn liền các hệ thống production thực tế.',
    icon: 'timer' as const,
    colorClass: 'text-emerald-800 dark:text-dark-primary',
  },
  {
    id: 'team-scale',
    label: 'QUY MÔ TEAM LỚN NHẤT',
    value: '60 Devs',
    description: 'Kinh nghiệm làm việc hiệu quả từ dự án agile 10 người đến đại dự án 60 người.',
    icon: 'groups' as const,
    colorClass: 'text-cyan dark:text-sky-400',
  },
  {
    id: 'latency',
    label: 'TỐI ƯU TRUY VẤN',
    value: '< 50ms',
    description: 'Tối ưu truy vấn legacy SQL, indexing Postgres/Oracle từ hàng giây xuống miligiây.',
    icon: 'speed' as const,
    colorClass: 'text-indigo-900 dark:text-indigo-400',
  },
  {
    id: 'security',
    label: 'BẢO MẬT & CHUẨN MỰC',
    value: '100%',
    description: 'Triển khai chuẩn AML ngân hàng, chữ ký số bảo mật y tế và hóa đơn điện tử.',
    icon: 'verified' as const,
    colorClass: 'text-amber-800 dark:text-amber-400',
  },
] as const;

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'misa-oneai',
    category: 'ai',
    themeVariant: 'emerald',
    orgBadge: 'MISA SJC • Đang Thực Hiện',
    orgIcon: 'psychology',
    meta: 'Team: 10 Devs | 2026',
    title: 'MISA OneAI for Family',
    summary: 'Hệ sinh thái AI trợ lý tài chính cá nhân & tạo nội dung đa phương tiện tự động.',
    highlights: [
      {
        title: 'AI LLM & Chatbot:',
        description:
          'Tích hợp các API LLM lớn, xây dựng luồng hội thoại thông minh phục vụ phân tích chi tiêu tự động.',
      },
      {
        title: 'Media Generation:',
        description:
          'Xử lý pipeline sinh video (generate/edit video), infographic tự động và tổng hợp hình ảnh từ prompt.',
      },
      {
        title: '.NET 8 & Vue 3:',
        description:
          'Xây dựng backend API bằng .NET Core 8.0, triển khai giao diện OneAI bằng Vue 3 đảm bảo luồng thu chi mượt mà.',
      },
    ],
    tags: [
      { label: '.NET Core 8.0', tone: 'cyan' },
      { label: 'LLM API', tone: 'indigo' },
      { label: 'Kafka', tone: 'emerald' },
      { label: 'Vue 3', tone: 'surface' },
      { label: 'MinIO', tone: 'muted' },
      { label: 'Elasticsearch', tone: 'muted' },
    ],
    statusLabel: 'Live in Prod',
    statusIcon: 'check',
  },
  {
    id: 'agribank-smf',
    category: 'fintech',
    themeVariant: 'sky',
    orgBadge: 'Agribank Outsource',
    orgIcon: 'bank',
    meta: 'Team: 30 Devs | 2025 - 2026',
    title: 'Smart Form Agribank (SMF)',
    summary:
      'Nền tảng ngân hàng số: Quản lý phát hành thẻ, tra soát giao dịch & Phòng chống rửa tiền (AML).',
    highlights: [
      {
        title: 'Chống Rửa Tiền (AML):',
        description:
          'Xây dựng module nghiệp vụ phát hiện giao dịch bất thường tuân thủ tiêu chuẩn ngân hàng nhà nước.',
      },
      {
        title: 'Hệ Thống Thẻ & Tra Soát:',
        description:
          'Phát hành thẻ ghi nợ/tín dụng, tra soát giao dịch hai chiều đến và đi tức thì.',
      },
      {
        title: 'Oracle DB High-Throughput:',
        description:
          'Tối ưu hóa cơ sở dữ liệu Oracle đảm bảo xử lý đồng thời lượng giao dịch ngân hàng cực lớn không nghẽn cổ chai.',
      },
    ],
    tags: [
      { label: 'Oracle Database', tone: 'cyan' },
      { label: '.NET Core 8', tone: 'emerald' },
      { label: 'Kafka', tone: 'amber' },
      { label: 'Redis', tone: 'surface' },
      { label: 'Next.js', tone: 'muted' },
      { label: 'Keycloak', tone: 'muted' },
    ],
    statusLabel: 'Banking Grade',
    statusIcon: 'security',
  },
  {
    id: 'phenikaa-mec',
    category: 'healthcare',
    themeVariant: 'emerald',
    orgBadge: 'Phenikaa Group',
    orgIcon: 'hospital',
    meta: 'Team: 60 Devs | 2024 - Nay',
    title: 'Phenikaa MEC (Smart Hospital & HIS)',
    summary:
      'Hệ sinh thái phần mềm quản trị bệnh viện lớn, kết nối HIS, hồ sơ bệnh án và dịch vụ y tế.',
    highlights: [
      {
        title: 'Tích Hợp HIS Bệnh Viện:',
        description:
          'Phát triển API ASP.NET Core kết nối HIS lấy dữ liệu bệnh nhân thời gian thực với độ trễ thấp.',
      },
      {
        title: 'Bảo Mật & Tìm Kiếm:',
        description:
          'Xác thực phân quyền tập trung qua Keycloak, tìm kiếm tức thì qua Elasticsearch, bộ đệm Redis và GraphQL Hasura.',
      },
      {
        title: 'Hóa Đơn & In Ấn:',
        description:
          'Xử lý module phát hành hóa đơn điện tử và in ấn báo cáo y khoa tự động tốc độ cao.',
      },
    ],
    tags: [
      { label: 'C# .NET Core', tone: 'emerald' },
      { label: 'PostgreSQL', tone: 'cyan' },
      { label: 'Elasticsearch', tone: 'amber' },
      { label: 'GraphQL', tone: 'indigo' },
      { label: 'Kafka', tone: 'surface' },
      { label: 'Keycloak', tone: 'muted' },
    ],
    statusLabel: 'Core Contributor',
    statusIcon: 'verified',
  },
  {
    id: 'gc-fast-invoice',
    category: 'healthcare',
    themeVariant: 'sky',
    orgBadge: 'GC Joint Stock',
    orgIcon: 'document',
    meta: 'Team: 12 Devs | 2025 - 2026',
    title: 'Hệ Thống Ký Số & Hóa Đơn FAST',
    summary:
      'Giải pháp tích hợp chữ ký số và hóa đơn điện tử cho hệ thống quản lý bệnh viện.',
    highlights: [
      {
        title: 'Chữ Ký Số & Hóa Đơn FAST:',
        description:
          'Tích hợp trơn tru hệ thống hóa đơn điện tử Fast và giải pháp chứng thực số y tế.',
      },
      {
        title: 'Agent System Integration:',
        description:
          'Phát triển API trung gian xử lý luồng dữ liệu từ Agent System đẩy về HIS GC.',
      },
      {
        title: 'Schema Optimization:',
        description:
          'Thiết kế cấu trúc database, indexing truy vấn phức tạp trên PostgreSQL và SQL Server.',
      },
    ],
    tags: [
      { label: 'ASP.NET Core Web API', tone: 'cyan' },
      { label: 'PostgreSQL', tone: 'emerald' },
      { label: 'SQL Server', tone: 'surface' },
      { label: 'Soap API', tone: 'muted' },
      { label: 'DevExpress', tone: 'muted' },
    ],
    statusLabel: 'Digital Signature',
    statusIcon: 'signature',
  },
  {
    id: 'lotus-nguyen-sieu',
    category: 'healthcare',
    themeVariant: 'emerald',
    orgBadge: 'Lotus Edu & Nguyễn Siêu School',
    orgIcon: 'school',
    meta: 'Team: 11 Devs | 2023 - 2024',
    title: 'Lotus Academy & Trường Tiểu Học Nguyễn Siêu',
    summary:
      'Nền tảng quản lý thời khóa biểu thông minh, tiến độ học sinh & quản lý căn tin bán trú.',
    highlights: [
      {
        title: 'Query Speed Down to Milliseconds:',
        description:
          'Tối ưu toàn bộ mã truy vấn cũ (legacy code), giảm tải database từ độ trễ nặng nề xuống vài mili-giây.',
      },
      {
        title: 'Nghiệp Vụ Học Đường Phức Tạp:',
        description:
          'Thuật toán xếp lịch học động theo giáo viên, chuyển trường, chuyển lớp và quản lý suất ăn căn tin chính xác tuyệt đối.',
      },
    ],
    tags: [
      { label: 'C# .NET Core', tone: 'emerald' },
      { label: 'SQL Server', tone: 'cyan' },
      { label: 'Vue.js', tone: 'surface' },
      { label: 'Query Refactoring', tone: 'muted' },
    ],
    statusLabel: 'Legacy Speedup',
    statusIcon: 'flash',
  },
  {
    id: 'memid-platform',
    category: 'fintech',
    themeVariant: 'sky',
    orgBadge: 'MEMID & LTS Group',
    orgIcon: 'memory',
    meta: 'Team: 12 Devs | 2022 - 2023',
    title: 'MEMID Identity Platform',
    summary:
      'Hệ thống định danh xác thực người dùng, bảo mật JWT và tương tác cơ sở dữ liệu tốc độ cao.',
    highlights: [
      {
        title: 'Fullstack Experience:',
        description:
          'Kinh nghiệm toàn diện cả Backend API và Frontend ReactJS/VueJS trong môi trường outsource đa dạng khách hàng.',
      },
      {
        title: 'Database Optimization:',
        description:
          'Viết và tối ưu hoá câu truy vấn MySQL, thiết kế schema dữ liệu linh hoạt, không lỗi kết nối.',
      },
    ],
    tags: [
      { label: 'NestJS & .NET', tone: 'cyan' },
      { label: 'React.js', tone: 'emerald' },
      { label: 'MySQL', tone: 'surface' },
      { label: 'JWT Auth', tone: 'muted' },
    ],
    statusLabel: 'Fullstack Foundations',
    statusIcon: 'code',
  },
];

export interface SkillGroup {
  id: string;
  title: string;
  description: string;
  icon: 'code' | 'database' | 'tree' | 'sparkles';
  headerBadgeClass: string;
  surfaceTint: 'emerald' | 'sky' | 'indigo' | 'amber';
  items: { label: string; tone: 'emerald' | 'cyan' | 'surface' | 'indigo' | 'red' | 'muted' }[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'backend-core',
    title: 'Backend Core',
    description: 'Trọng tâm C# .NET và kiến trúc phần mềm chuẩn Enterprise.',
    icon: 'code',
    headerBadgeClass:
      'bg-emerald-100 dark:bg-dark-primary/10 text-emerald-800 dark:text-dark-primary border border-emerald-400 dark:border-dark-primary/30',
    surfaceTint: 'emerald',
    items: [
      { label: 'C# .NET', tone: 'emerald' },
      { label: 'ASP.NET Core Web API', tone: 'emerald' },
      { label: 'Entity Framework', tone: 'surface' },
      { label: 'Clean Architecture', tone: 'cyan' },
      { label: 'CQRS & MediatR', tone: 'cyan' },
      { label: 'RESTful API', tone: 'muted' },
      { label: 'JWT Authentication', tone: 'muted' },
    ],
  },
  {
    id: 'database-cache',
    title: 'Database & Cache',
    description: 'Thiết kế schema, tối ưu hóa indexing truy vấn tốc độ cao.',
    icon: 'database',
    headerBadgeClass:
      'bg-sky-100 dark:bg-cyan/10 text-cyan dark:text-sky-400 border border-sky-400 dark:border-sky-400/30',
    surfaceTint: 'sky',
    items: [
      { label: 'PostgreSQL', tone: 'cyan' },
      { label: 'Oracle Database', tone: 'cyan' },
      { label: 'SQL Server', tone: 'surface' },
      { label: 'MySQL / PDO', tone: 'surface' },
      { label: 'Elasticsearch', tone: 'indigo' },
      { label: 'Redis Cluster', tone: 'red' },
      { label: 'MongoDB', tone: 'muted' },
    ],
  },
  {
    id: 'streams-ops',
    title: 'Streams & Ops',
    description: 'Luồng sự kiện phi đồng bộ, xác thực SSO & container hóa.',
    icon: 'tree',
    headerBadgeClass:
      'bg-indigo-100 dark:bg-accent/15 text-indigo-900 dark:text-indigo-400 border border-indigo-400 dark:border-indigo-400/30',
    surfaceTint: 'indigo',
    items: [
      { label: 'Apache Kafka', tone: 'indigo' },
      { label: 'Docker', tone: 'indigo' },
      { label: 'Keycloak (SSO/IAM)', tone: 'cyan' },
      { label: 'Git & GitLab CI', tone: 'surface' },
      { label: 'Hasura GraphQL', tone: 'surface' },
      { label: 'MinIO S3', tone: 'muted' },
      { label: 'Soap API', tone: 'muted' },
    ],
  },
  {
    id: 'frontend-ai',
    title: 'Frontend & AI',
    description: 'Hỗ trợ full-stack mượt mà & tích hợp AI LLM hiện đại.',
    icon: 'sparkles',
    headerBadgeClass:
      'bg-amber-100 dark:bg-warning/15 text-amber-900 dark:text-amber-400 border border-amber-400 dark:border-amber-400/30',
    surfaceTint: 'amber',
    items: [
      { label: 'Vue 3 / Vue.js', tone: 'emerald' },
      { label: 'React.js', tone: 'cyan' },
      { label: 'Next.js', tone: 'cyan' },
      { label: 'TypeScript', tone: 'surface' },
      { label: 'LLM Chatbots', tone: 'indigo' },
      { label: 'Video & Img Gen', tone: 'indigo' },
      { label: 'Tailwind / CSS', tone: 'muted' },
    ],
  },
];

export const TERMINAL_SUGGESTIONS = [
  { command: 'help', label: 'help', colorClass: 'text-sky-400' },
  { command: 'dotnet --info', label: 'dotnet --info', colorClass: 'text-emerald-400' },
  { command: 'projects --recent', label: 'projects --recent', colorClass: 'text-slate-200' },
  { command: 'why-hire', label: 'why-hire', colorClass: 'text-indigo-400 font-semibold' },
  { command: 'contact', label: 'contact', colorClass: 'text-amber-400' },
] as const;
