import { ArtworkItem, PortfolioProject } from '../utils/portfolioLogic.ts';

export const PORTFOLIO_PROFILE = {
  fullName: 'Thuận Lê',
  fullLegalName: 'Lê Văn Thuận',
  birthInfo: 'Nhâm Ngọ 2002',
  location: 'Hoài Đức, Hà Nội',
  role: 'Senior .NET Systems Engineer & AI Visual Creator',
  phoneDisplay: '0352.988.596',
  phoneFormatted: '0352 988 596',
  phoneHref: 'tel:0352988596',
  email: 'thuanlevan72@gmail.com',
  emailHref: 'mailto:thuanlevan72@gmail.com',
  githubUrl: 'https://github.com/thuanlevan72?tab=repositories',
  facebookUrl: 'https://www.facebook.com/thuanlevan72',
  heroPortraitSrc: '/assets/gallery/thuan-le-doi-thuc.webp',
  realPortraitSrc: '/assets/gallery/thuan-le-doi-thuc.webp',
};

export const HERO_METRICS = [
  {
    id: 'experience',
    value: '04 Năm',
    label: 'Kỹ thuật hệ thống production (08/2022 – Nay)',
  },
  {
    id: 'team-scale',
    value: '60 Devs',
    label: 'Quy mô đội ngũ lớn nhất đã vận hành',
  },
  {
    id: 'systems-count',
    value: '06 Hệ Thống',
    label: 'Ngân hàng số, Bệnh viện thông minh, EdTech & AI',
  },
  {
    id: 'latency',
    value: '< 50 ms',
    label: 'Chuẩn tối ưu truy vấn SQL & luồng AI Media',
  },
] as const;

export const GALLERY_ARTWORKS: ArtworkItem[] = [
  {
    id: 'timelapse-coding-desk',
    category: 'portrait',
    categoryLabel: 'Chân Dung & Video',
    mediaType: 'video',
    posterSrc: '/assets/gallery/timelapse-coding-poster.webp',
    objectPosition: 'top',
    title: 'Coding Timelapse — Góc Làm Việc & Đam Mê',
    subtitle: '36 Giây Tua Nhanh · Bàn Phím Cơ Đỏ & Lá Cờ Tổ Quốc',
    story:
      'Khoảnh khắc tập trung cao độ bên bàn làm việc quen thuộc: bàn phím cơ đỏ trắng, tai nghe kiểm âm và ánh đèn văn phòng phía dưới dải cờ đỏ sao vàng.',
    src: '/assets/gallery/timelapse-coding.mp4',
    alt: 'Video timelapse Thuận Lê tập trung lập trình với bàn phím cơ đỏ tại văn phòng',
    width: 720,
    height: 1280,
    aspectType: 'portrait',
    year: '2026',
    specs: {
      format: 'MP4 H.264 Fast-Start (720 × 1280)',
      aspect: '9:16 Video · 0:36',
      lighting: 'Ánh sáng bàn làm việc tự nhiên',
      concept: 'Engineering Flow · Coding Timelapse',
      fileSize: '3.6 MB (nén từ 65 MB MOV)',
    },
  },
  {
    id: 'nang-tho-giua-hoa-dao',
    category: 'poetic',
    categoryLabel: 'Nàng Thơ Hoa Đào',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Cố Phán Di Quang Thái — Nàng Thơ Giữa Hoa Đào',
    subtitle: 'Trường Khiếu Khí Nhược Lan · Thư Pháp & Nắng Mai',
    story:
      'Khung hình lấy cảm hứng từ thi ca phương Đông: làn mưa phùn xuân đọng trên mái tóc đen mượt, ánh nắng mai rọi qua cành đào phớt hồng cùng hai câu thơ chữ Hán cổ điển.',
    src: '/assets/gallery/nang-tho-hoa-dao.webp',
    alt: 'Cố Phán Di Quang Thái — Tác phẩm nàng thơ giữa hoa đào với ánh nắng mai và thư pháp cổ điển',
    width: 1440,
    height: 804,
    aspectType: 'landscape',
    year: '2026',
    specs: {
      format: 'WebP Optimized (1440 × 804)',
      aspect: '16:9',
      lighting: 'Tia nắng sớm xuyên sương mưa xuân',
      concept: 'Mỹ học Á Đông · Thư pháp cổ điển',
      fileSize: '94 KB (nén từ 2.3 MB PNG)',
    },
  },
  {
    id: 'chan-dung-doi-thuc',
    category: 'portrait',
    categoryLabel: 'Chân Dung & Video',
    mediaType: 'image',
    objectPosition: 'top',
    title: 'Chân Dung Đời Thực — Thuận Lê',
    subtitle: 'Nguyên Mẫu Tự Nhiên · Kỹ Sư Hệ Thống Tại Hà Nội',
    story:
      'Khoảnh khắc đời thường giản dị với sơ mi đen và tai nghe kiểm âm — nguyên mẫu chân thực đứng sau loạt tác phẩm AI đồng bộ gương mặt và các hệ thống .NET doanh nghiệp.',
    src: '/assets/gallery/thuan-le-doi-thuc.webp',
    alt: 'Chân dung đời thực của kỹ sư Lê Văn Thuận tại không gian làm việc ở Hà Nội',
    width: 810,
    height: 1440,
    aspectType: 'portrait',
    year: '2026',
    specs: {
      format: 'WebP Optimized (810 × 1440)',
      aspect: '9:16',
      lighting: 'Ánh sáng văn phòng tự nhiên',
      concept: 'Documentary Reference · Nguyên Mẫu Gốc',
      fileSize: '128 KB (nén từ 370 KB JPG)',
    },
  },
  {
    id: 'misa-ha-long-2026',
    category: 'moments',
    categoryLabel: 'Đồng Đội & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'MISA Level Up With AI — Hạ Long 2026',
    subtitle: 'Khối Sản Xuất MISA · Đêm Gala Vinh Danh',
    story:
      'Khoảnh khắc tập thể khối sản xuất MISA rạng rỡ trên sân khấu sự kiện "Level Up With AI" tại Hạ Long 2026 — dấu ấn đồng hành xây dựng nền tảng AI cho người Việt.',
    src: '/assets/gallery/misa-ha-long-2026.webp',
    alt: 'Tập thể Khối Sản Xuất MISA chụp ảnh kỷ niệm trên sân khấu sự kiện Level Up With AI Hạ Long 2026',
    width: 1440,
    height: 960,
    aspectType: 'landscape',
    year: '2026',
    specs: {
      format: 'WebP Event (1440 × 960)',
      aspect: '3:2',
      lighting: 'Ánh sáng sân khấu LED hội nghị',
      concept: 'MISA SJC · Đồng Đội Khối Sản Xuất',
      fileSize: '157 KB (nén từ 296 KB JPEG)',
    },
  },
  {
    id: 'team-outing-bien',
    category: 'moments',
    categoryLabel: 'Đồng Đội & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Team Outing — Phố Biển Sáng Sớm',
    subtitle: 'Chuyến Đi Gắn Kết Đồng Nghiệp · Gió Biển & Nắng Mai',
    story:
      'Khung hình tập thể đầy năng lượng trong chuyến du lịch gắn kết đội ngũ — gác lại những giờ tối ưu hệ thống để tận hưởng bầu trời trong xanh bên biển.',
    src: '/assets/gallery/team-outing-bien.webp',
    alt: 'Đoàn đồng nghiệp đứng chụp ảnh tập thể ngoài trời dưới nền trời xanh tại phố biển',
    width: 1440,
    height: 1080,
    aspectType: 'landscape',
    year: '2026',
    specs: {
      format: 'WebP Travel (1440 × 1080)',
      aspect: '4:3',
      lighting: 'Nắng sớm ngoài trời tự nhiên',
      concept: 'Team Building · Kỷ Niệm Chuyến Đi',
      fileSize: '236 KB (nén từ 344 KB JPEG)',
    },
  },
  {
    id: 'le-vu-quy-anh-em',
    category: 'moments',
    categoryLabel: 'Đồng Đội & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Ngày Chung Vui — Lễ Vu Quy Anh Em',
    subtitle: 'Tình Bằng Hữu · Rạp Cưới Sắc Xanh Trắng',
    story:
      'Những người anh em thân thiết hội ngộ trong ngày trọng đại — khoảnh khắc giản dị, ấm áp tình bạn đồng hành qua nhiều chặng đường công việc và cuộc sống.',
    src: '/assets/gallery/le-vu-quy-anh-em.webp',
    alt: 'Nhóm 4 anh em bạn bè thân thiết mặc sơ mi chụp ảnh kỷ niệm tại lễ vu quy',
    width: 1440,
    height: 960,
    aspectType: 'landscape',
    year: '2026',
    specs: {
      format: 'WebP Candid (1440 × 960)',
      aspect: '3:2',
      lighting: 'Ánh sáng ban ngày khuếch tán dưới phông rạp',
      concept: 'Friendship · Khoảnh Khắc Chung Vui',
      fileSize: '134 KB (nén từ 688 KB JPG)',
    },
  },
  {
    id: 'dem-nghi-duong',
    category: 'moments',
    categoryLabel: 'Đồng Đội & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Đêm Nghỉ Dưỡng Dưới Mái Ngói Cổ',
    subtitle: 'Sân Vườn Ánh Vàng · Giây Phút Thư Giãn',
    story:
      'Khung cảnh buổi tối yên bình bên sân gạch và nếp nhà cổ truyền ngập tràn ánh đèn vàng — cuộc dạo chơi nhẹ nhàng sau những ngày làm việc bận rộn.',
    src: '/assets/gallery/dem-nghi-duong.webp',
    alt: 'Nhóm bạn chụp ảnh buổi tối trước khu nhà mái ngói cổ truyền dưới ánh đèn vàng ấm',
    width: 960,
    height: 720,
    aspectType: 'landscape',
    year: '2025',
    specs: {
      format: 'WebP Night (960 × 720)',
      aspect: '4:3',
      lighting: 'Đèn vàng kiến trúc sân vườn ban đêm',
      concept: 'Night Retreat · Không Gian Truyền Thống',
      fileSize: '104 KB (nén từ 185 KB JPG)',
    },
  },
  {
    id: 'chan-dung-the-xanh',
    category: 'portrait',
    categoryLabel: 'Chân Dung & Video',
    mediaType: 'image',
    objectPosition: 'top',
    title: 'Chân Dung Thẻ — Phông Xanh Chuẩn Mực',
    subtitle: 'Áo Polo Trắng · Phong Thái Điềm Tĩnh Chuyên Nghiệp',
    story:
      'Tấm ảnh thẻ phông xanh tối giản với áo polo trắng chỉn chu — thể hiện diện mạo tin cậy, chuẩn mực trong các hồ sơ kỹ thuật, hộ chiếu dự án và chứng thực danh tính.',
    src: '/assets/gallery/chan-dung-the-xanh.webp',
    alt: 'Ảnh chân dung thẻ phông xanh của Lê Văn Thuận mặc áo polo trắng chuyên nghiệp',
    width: 472,
    height: 709,
    aspectType: 'portrait',
    year: '2025',
    specs: {
      format: 'WebP Studio (472 × 709)',
      aspect: '2:3',
      lighting: 'Ánh sáng studio cân bằng mềm',
      concept: 'Professional ID Portrait · Hồ Sơ Chính Thức',
      fileSize: '19 KB (nén từ 49 KB JPG)',
    },
  },
  {
    id: 'dem-trang-0238',
    category: 'moments',
    categoryLabel: 'Đồng Đội & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Đêm Trắng 02:38 — Nạp Năng Lượng',
    subtitle: 'Cửa Hàng Tiện Lợi Khuya · Ly Mì Nóng Giữa Đêm',
    story:
      'Đồng hồ điện thoại điểm 02:38 sáng tại cửa hàng tiện lợi — bức ảnh chân thực đầy sức sống về những đêm trắng đồng hành cùng đam mê công nghệ và tuổi trẻ Hà Nội.',
    src: '/assets/gallery/dem-trang-0238.webp',
    alt: 'Khoảnh khắc ngồi ăn mì ly tại cửa hàng tiện lợi lúc 02:38 sáng',
    width: 960,
    height: 1280,
    aspectType: 'portrait',
    year: '2025',
    specs: {
      format: 'WebP Documentary (960 × 1280)',
      aspect: '3:4',
      lighting: 'Đèn huỳnh quang cửa hàng tiện lợi 24/7',
      concept: 'Late Night Hustle · 02:38 AM',
      fileSize: '130 KB (nén từ 260 KB JPG)',
    },
  },
  {
    id: 'dao-pho-dem-ben-ho',
    category: 'moments',
    categoryLabel: 'Người Thương & Kỷ Niệm',
    mediaType: 'image',
    objectPosition: 'center',
    title: 'Người Thương Bên Bờ Hồ Đêm — Khoảnh Khắc Bình Yên',
    subtitle: 'Ánh Đèn Thành Phố Phản Chiếu Mặt Hồ · Kỷ Niệm Đẹp Nhất',
    story:
      'Giữa nhịp sống hối hả của những dòng code và dự án công nghệ, đây là bức ảnh dịu dàng nhất — nụ cười rạng rỡ của người yêu tôi bên hàng cây ven hồ đêm, nơi ánh đèn phố lấp lánh trên mặt nước gói trọn sự bình yên.',
    src: '/assets/gallery/dao-pho-dem-ben-ho.webp',
    alt: 'Chân dung người yêu của Thuận Lê mỉm cười dịu dàng bên bờ hồ ban đêm với ánh đèn phản chiếu lung linh',
    width: 1254,
    height: 1254,
    aspectType: 'portrait',
    year: '2025',
    specs: {
      format: 'WebP Square Frame (1254 × 1254)',
      aspect: '1:1',
      lighting: 'Ánh đèn phố ban đêm phản chiếu mặt hồ',
      concept: 'Beloved Muse · Khoảnh Khắc Yêu Thương',
      fileSize: '117 KB (nén từ 1.9 MB PNG)',
    },
  },
  {
    id: 'filter-hoa-xuan',
    category: 'portrait',
    categoryLabel: 'Chân Dung & Video',
    mediaType: 'image',
    objectPosition: 'top',
    title: 'Góc Vui Nhộn — Filter Hoa Xuân',
    subtitle: 'Khoảnh Khắc Thư Giãn · Tính Cách Hài Hước Đời Thường',
    story:
      'Một góc nhìn khác biệt, gần gũi và đầy tiếng cười bên ngoài những dòng code .NET khô khan — thử nghiệm hiệu ứng AR vòng hoa và mắt kính đầy màu sắc.',
    src: '/assets/gallery/filter-hoa-xuan.webp',
    alt: 'Ảnh selfie vui nhộn dùng hiệu ứng filter vòng hoa và mắt kính đầy màu sắc',
    width: 664,
    height: 1440,
    aspectType: 'portrait',
    year: '2026',
    specs: {
      format: 'WebP Mobile Capture (664 × 1440)',
      aspect: '9:20',
      lighting: 'AR Overlay & Selfie Ambient Light',
      concept: 'Playful Moment · AR Filter Fun',
      fileSize: '100 KB (nén từ 9.5 MB PNG)',
    },
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'misa-oneai',
    category: 'ai',
    domainLabel: 'AI & Media Pipeline',
    orgBadge: 'MISA SJC',
    meta: '10 Devs · 2026 – Nay',
    title: 'MISA OneAI for Family',
    summary:
      'Hệ sinh thái AI trợ lý tài chính cá nhân và quy trình tạo nội dung đa phương tiện tự động.',
    highlights: [
      {
        title: 'AI LLM & Chatbot:',
        description:
          'Tích hợp API mô hình ngôn ngữ lớn, xây dựng luồng hội thoại phân tích chi tiêu tự động.',
      },
      {
        title: 'Media Generation:',
        description:
          'Phát triển pipeline sinh & chỉnh sửa video, infographic và tổng hợp hình ảnh từ prompt.',
      },
      {
        title: '.NET 8 & Vue 3:',
        description:
          'Xây dựng backend API bằng .NET Core 8.0 và giao diện Vue 3 cho trải nghiệm thu chi mượt mà.',
      },
    ],
    tags: ['.NET Core 8.0', 'LLM API', 'Kafka', 'Vue 3', 'MinIO', 'Elasticsearch'],
    statusLabel: 'Vận hành thực tế',
  },
  {
    id: 'agribank-smf',
    category: 'fintech',
    domainLabel: 'Ngân Hàng & Tài Chính',
    orgBadge: 'Agribank Outsource',
    meta: '30 Devs · 2025 – 2026',
    title: 'Smart Form Agribank (SMF)',
    summary:
      'Nền tảng ngân hàng số: Quản lý phát hành thẻ, tra soát giao dịch và Phòng chống rửa tiền (AML).',
    highlights: [
      {
        title: 'Phòng Chống Rửa Tiền (AML):',
        description:
          'Xây dựng module nghiệp vụ phát hiện giao dịch bất thường đạt chuẩn Ngân hàng Nhà nước.',
      },
      {
        title: 'Hệ Thống Thẻ & Tra Soát:',
        description:
          'Xử lý phát hành thẻ ghi nợ/tín dụng và tra soát giao dịch hai chiều theo thời gian thực.',
      },
      {
        title: 'Oracle DB High-Throughput:',
        description:
          'Tối ưu hóa cơ sở dữ liệu Oracle phục vụ đồng thời lượng giao dịch ngân hàng tải cao.',
      },
    ],
    tags: ['Oracle Database', '.NET Core 8', 'Kafka', 'Redis', 'Next.js', 'Keycloak'],
    statusLabel: 'Chuẩn Ngân Hàng',
  },
  {
    id: 'phenikaa-mec',
    category: 'healthcare',
    domainLabel: 'Y Tế Thông Minh',
    orgBadge: 'Phenikaa Group',
    meta: '60 Devs · 2024 – Nay',
    title: 'Phenikaa MEC (Smart Hospital & HIS)',
    summary:
      'Hệ sinh thái phần mềm quản trị bệnh viện quy mô lớn, kết nối HIS và hồ sơ bệnh án điện tử.',
    highlights: [
      {
        title: 'Tích Hợp HIS Bệnh Viện:',
        description:
          'Phát triển API ASP.NET Core đồng bộ dữ liệu bệnh nhân từ HIS với độ trễ dưới 50ms.',
      },
      {
        title: 'Bảo Mật & Tìm Kiếm:',
        description:
          'Xác thực SSO qua Keycloak, tìm kiếm tức thì qua Elasticsearch, Redis và GraphQL Hasura.',
      },
      {
        title: 'Hóa Đơn & Báo Cáo Y Khoa:',
        description:
          'Xử lý phát hành hóa đơn điện tử và in ấn phiếu khám, xét nghiệm tự động tốc độ cao.',
      },
    ],
    tags: ['C# .NET Core', 'PostgreSQL', 'Elasticsearch', 'GraphQL', 'Kafka', 'Keycloak'],
    statusLabel: 'Thành viên nòng cốt',
  },
  {
    id: 'gc-fast-invoice',
    category: 'healthcare',
    domainLabel: 'Chứng Thực & Hóa Đơn',
    orgBadge: 'GC Joint Stock',
    meta: '12 Devs · 2025 – 2026',
    title: 'Hệ Thống Ký Số & Hóa Đơn FAST',
    summary:
      'Giải pháp tích hợp chữ ký số y tế và hóa đơn điện tử FAST cho hệ thống quản lý bệnh viện.',
    highlights: [
      {
        title: 'Chữ Ký Số & Hóa Đơn FAST:',
        description:
          'Tích hợp đồng bộ hệ thống hóa đơn điện tử FAST và quy trình chứng thực chữ ký số.',
      },
      {
        title: 'Agent System Integration:',
        description:
          'Thiết kế API trung gian tiếp nhận và điều phối dữ liệu từ Agent System đẩy về HIS GC.',
      },
      {
        title: 'Tối Ưu Schema CSDL:',
        description:
          'Thiết kế cấu trúc bảng và indexing truy vấn phức tạp trên PostgreSQL cùng SQL Server.',
      },
    ],
    tags: ['ASP.NET Core Web API', 'PostgreSQL', 'SQL Server', 'Soap API', 'DevExpress'],
    statusLabel: 'Ký Số Doanh Nghiệp',
  },
  {
    id: 'lotus-nguyen-sieu',
    category: 'healthcare',
    domainLabel: 'Công Nghệ Giáo Dục',
    orgBadge: 'Lotus Edu & Nguyễn Siêu',
    meta: '11 Devs · 2023 – 2024',
    title: 'Lotus Academy & Trường Tiểu Học Nguyễn Siêu',
    summary:
      'Nền tảng xếp thời khóa biểu thông minh, theo dõi tiến độ học sinh và căn tin bán trú.',
    highlights: [
      {
        title: 'Tối Ưu Truy Vấn Mili-giây:',
        description:
          'Tái cấu trúc toàn bộ mã truy vấn legacy SQL, giảm thời gian phản hồi từ hàng giây xuống mili-giây.',
      },
      {
        title: 'Nghiệp Vụ Học Đường:',
        description:
          'Xây dựng luồng xếp lịch học động theo giáo viên, chuyển lớp và thống kê suất ăn bán trú.',
      },
    ],
    tags: ['C# .NET Core', 'SQL Server', 'Vue.js', 'Query Refactoring'],
    statusLabel: 'Tăng Tốc Legacy',
  },
  {
    id: 'memid-platform',
    category: 'fintech',
    domainLabel: 'Định Danh & Outsource',
    orgBadge: 'MEMID & LTS Group',
    meta: '12 Devs · 2022 – 2023',
    title: 'MEMID Identity Platform',
    summary:
      'Hệ thống định danh xác thực người dùng, bảo mật JWT và tương tác cơ sở dữ liệu tốc độ cao.',
    highlights: [
      {
        title: 'Kinh Nghiệm Fullstack:',
        description:
          'Phát triển song song Backend API và Frontend ReactJS/VueJS cho nhiều dự án khách hàng.',
      },
      {
        title: 'Tối Ưu MySQL:',
        description:
          'Thiết kế schema linh hoạt và tối ưu truy vấn MySQL đảm bảo độ ổn định kết nối cao.',
      },
    ],
    tags: ['NestJS & .NET', 'React.js', 'MySQL', 'JWT Auth'],
    statusLabel: 'Nền Tảng Fullstack',
  },
];

export const SKILL_GROUPS = [
  {
    id: 'backend-core',
    title: 'Backend & Kiến Trúc',
    description: 'Trọng tâm C# .NET 8 và kiến trúc phần mềm chuẩn doanh nghiệp.',
    items: [
      'C# .NET 8',
      'ASP.NET Core Web API',
      'Entity Framework Core',
      'Clean Architecture',
      'CQRS & MediatR',
      'RESTful & SOAP API',
      'JWT & RBAC',
    ],
  },
  {
    id: 'database-cache',
    title: 'Dữ Liệu & Bộ Đệm',
    description: 'Thiết kế schema, tối ưu hóa indexing truy vấn chịu tải lớn.',
    items: [
      'PostgreSQL',
      'Oracle Database',
      'SQL Server',
      'MySQL / PDO',
      'Elasticsearch',
      'Redis Cluster',
      'MongoDB',
    ],
  },
  {
    id: 'streams-ops',
    title: 'Luồng Dữ Liệu & Vận Hành',
    description: 'Xử lý sự kiện bất đồng bộ, xác thực tập trung và triển khai.',
    items: [
      'Apache Kafka',
      'Docker',
      'Keycloak (SSO/IAM)',
      'Git & GitLab CI',
      'Hasura GraphQL',
      'MinIO S3 Storage',
    ],
  },
  {
    id: 'frontend-ai',
    title: 'Giao Diện & Nghệ Thuật AI',
    description: 'Phát triển giao diện hiện đại và làm chủ pipeline AI tạo sinh.',
    items: [
      'Vue 3 / Vue.js',
      'React.js & Next.js',
      'TypeScript & Tailwind',
      'LLM Integration',
      'AI Image & Video Gen',
      'Prompt Art Direction',
    ],
  },
] as const;

export const FAQ_ITEMS = [
  {
    question:
      'Bộ sưu tập ảnh Nàng Thơ Hoa Đào và Video Timelapse được thực hiện như thế nào?',
    answer:
      'Các tác phẩm được Thuận Lê trực tiếp thiết kế prompt, kiểm soát ánh sáng, thẩm mỹ Á Đông và hậu kỳ tối ưu WebP / H.264 — kết hợp trực tiếp với kinh nghiệm xây dựng pipeline AI Media Generation tại dự án MISA OneAI.',
  },
  {
    question:
      'Thuận Lê có những kinh nghiệm thực chiến gì về .NET và các hệ thống quy mô lớn?',
    answer:
      'Thuận Lê có gần 4 năm kinh nghiệm từ 08/2022 qua các dự án trọng yếu như Smart Form Agribank (30 devs, AML & Oracle DB), Bệnh viện thông minh Phenikaa MEC (60 devs, HIS, Kafka, Elasticsearch) và MISA OneAI for Family (.NET 8, Vue 3, LLM API).',
  },
  {
    question:
      'Làm thế nào để liên hệ hợp tác phát triển phần mềm hoặc sáng tạo nội dung AI?',
    answer:
      'Bạn có thể gọi trực tiếp qua số 0352 988 596, gửi email về thuanlevan72@gmail.com, hoặc truy cập GitHub và Facebook cá nhân ngay tại khu vực liên hệ ở cuối trang.',
  },
] as const;

export const TERMINAL_SUGGESTIONS = [
  { command: 'help', label: 'help' },
  { command: 'gallery', label: 'gallery' },
  { command: 'dotnet --info', label: 'dotnet --info' },
  { command: 'projects --recent', label: 'projects --recent' },
  { command: 'why-hire', label: 'why-hire' },
  { command: 'contact', label: 'contact' },
] as const;
