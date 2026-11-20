import { ANOMALY_DAYS_6_TO_12 } from './anomalyCasesDays6To12.ts';

export type AnomalyVerdict = 'approve' | 'reject' | 'alarm';

export type AnomalyScenarioTheme = 'hellgate' | 'dispatch_119' | 'alien_social' | 'archive_nexus';

export interface DossierField {
  key: string;
  label: string;
  value: string;
  suspectId?: string;
}

export interface InspectionRule {
  id: string;
  code: string;
  title: string;
  detail: string;
  severity: 'standard' | 'strict' | 'critical';
}

export interface InspectionCase {
  id: string;
  dossierCode: string;
  applicantName: string;
  applicantRole: string;
  theme: AnomalyScenarioTheme;
  themeLabel: string;
  submittedAt: string;
  sealNumber: string;
  documentFields: DossierField[];
  databaseFields: DossierField[];
  statement: string;
  expectedVerdict: AnomalyVerdict;
  validClueIds: string[];
  explanationVi: string;
}

export interface AnomalyDayDefinition {
  day: number;
  shiftTitle: string;
  department: string;
  briefing: string;
  rules: InspectionRule[];
  cases: InspectionCase[];
}

export const ANOMALY_DAYS: readonly AnomalyDayDefinition[] = [
  {
    day: 1,
    shiftTitle: 'Ngày 1 · Trạm Gác Cổng Âm Ty',
    department: 'Sở Di Trú Linh Hồn · Cửa Số 04',
    briefing:
      'Ngày trực đầu tiên: đối chiếu Giấy Thông Hành với CSDL Âm Ty. Từ chối giấy hết hạn hoặc sai thông tin cơ bản; bấm Báo Động ngay nếu phát hiện dấu ấn giả mạo hoặc thực thể trốn nã.',
    rules: [
      {
        id: 'd1-r1',
        code: 'QT-01',
        title: 'Hạn hiệu lực thông hành',
        detail: 'Ngày hết hạn trên giấy phải từ 19/11/2026 trở về sau. Hết hạn -> TỪ CHỐI.',
        severity: 'standard',
      },
      {
        id: 'd1-r2',
        code: 'QT-02',
        title: 'Khớp mã căn cước & năm mất',
        detail: 'Mã ấn triện và Năm mất trên giấy phải trùng khớp hoàn toàn với CSDL Âm Ty. Sai lệch nhẹ -> TỪ CHỐI.',
        severity: 'strict',
      },
      {
        id: 'd1-r3',
        code: 'QT-03',
        title: 'Ấn triện đen hoặc lệnh truy nã',
        detail: 'Nếu mã ấn triện bắt đầu bằng "X-99" hoặc CSDL ghi trạng thái "TRỐN NÃ", bắt buộc bấm BÁO ĐỘNG.',
        severity: 'critical',
      },
    ],
    cases: [
      {
        id: 'd1-c1',
        dossierCode: 'AT-1042',
        applicantName: 'Nguyễn Hữu An',
        applicantRole: 'Linh hồn thường dân · Hạng B',
        theme: 'hellgate',
        themeLabel: 'Gác Cổng Địa Ngục',
        submittedAt: '08:15 · 19/11/2026',
        sealNumber: 'S-4410',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '25/11/2026' },
          { key: 'death_year', label: 'Năm ghi nhận', value: '2026' },
          { key: 'gate', label: 'Cửa đăng ký', value: 'Cửa Số 04' },
          { key: 'seal', label: 'Mã ấn triện', value: 'S-4410' },
        ],
        databaseFields: [
          { key: 'db_status', label: 'Trạng thái CSDL', value: 'Hợp lệ · Chờ nhập tịch' },
          { key: 'db_death', label: 'Năm lưu trữ', value: '2026' },
          { key: 'db_seal', label: 'Ấn triện gốc', value: 'S-4410' },
          { key: 'db_karma', label: 'Chỉ số nghiệp', value: 'Trung tính (+12)' },
        ],
        statement:
          'Tôi đi đúng cửa Số 04 theo giấy hẹn tuần này. Mọi con dấu đều xin trực tiếp ở phòng công chứng dương gian.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Giấy thông hành còn hạn (25/11/2026), mã ấn triện S-4410 và năm 2026 trùng khớp hoàn toàn CSDL. Đủ điều kiện DUYỆT.',
      },
      {
        id: 'd1-c2',
        dossierCode: 'AT-1049',
        applicantName: 'Trần Minh Khôi',
        applicantRole: 'Thương nhân vãng lai',
        theme: 'hellgate',
        themeLabel: 'Gác Cổng Địa Ngục',
        submittedAt: '09:02 · 19/11/2026',
        sealNumber: 'S-2081',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '12/11/2026', suspectId: 'd1c2-exp' },
          { key: 'death_year', label: 'Năm ghi nhận', value: '2025' },
          { key: 'gate', label: 'Cửa đăng ký', value: 'Cửa Số 04' },
          { key: 'seal', label: 'Mã ấn triện', value: 'S-2081' },
        ],
        databaseFields: [
          { key: 'db_status', label: 'Trạng thái CSDL', value: 'Quá hạn gia hạn' },
          { key: 'db_death', label: 'Năm lưu trữ', value: '2025' },
          { key: 'db_seal', label: 'Ấn triện gốc', value: 'S-2081' },
          { key: 'db_karma', label: 'Chỉ số nghiệp', value: 'Bình thường (+4)' },
        ],
        statement:
          'Tàu đò sông Vong Xuyên bị kẹt sương mù nên tôi trễ vài hôm thôi, cán bộ du di cho qua giúp.',
        expectedVerdict: 'reject',
        validClueIds: ['d1c2-exp'],
        explanationVi:
          'Giấy thông hành đã hết hạn từ 12/11/2026 (trước ngày trực 19/11/2026). Không có dấu hiệu tội phạm nên xử lý TỪ CHỐI.',
      },
      {
        id: 'd1-c3',
        dossierCode: 'AT-1055',
        applicantName: 'Lê Thất Dạ',
        applicantRole: 'Khách bộ hành vô danh',
        theme: 'hellgate',
        themeLabel: 'Gác Cổng Địa Ngục',
        submittedAt: '09:44 · 19/11/2026',
        sealNumber: 'X-9904',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '30/12/2026' },
          { key: 'death_year', label: 'Năm ghi nhận', value: '2026', suspectId: 'd1c3-yr' },
          { key: 'gate', label: 'Cửa đăng ký', value: 'Cửa Số 04' },
          { key: 'seal', label: 'Mã ấn triện', value: 'X-9904', suspectId: 'd1c3-seal' },
        ],
        databaseFields: [
          { key: 'db_status', label: 'Trạng thái CSDL', value: 'TRỐN NÃ · Ngục Tầng 6', suspectId: 'd1c3-db' },
          { key: 'db_death', label: 'Năm lưu trữ', value: '1998' },
          { key: 'db_seal', label: 'Ấn triện gốc', value: 'BỊ THU HỒI' },
          { key: 'db_karma', label: 'Chỉ số nghiệp', value: 'Nguy hiểm (-940)' },
        ],
        statement:
          'Tôi chỉ là người qua đường bình thường, hồ sơ mới cấp sáng nay ở quầy bên kia.',
        expectedVerdict: 'alarm',
        validClueIds: ['d1c3-seal', 'd1c3-db', 'd1c3-yr'],
        explanationVi:
          'Mã ấn triện bắt đầu bằng "X-99" (dấu ấn giả mạo) và CSDL báo đối tượng đang TRỐN NÃ từ tầng 6. Bắt buộc bấm BÁO ĐỘNG!',
      },
      {
        id: 'd1-c4',
        dossierCode: 'AT-1061',
        applicantName: 'Đỗ Thị Hạnh',
        applicantRole: 'Nghệ nhân gốm · Vùng Ngoại Ô',
        theme: 'hellgate',
        themeLabel: 'Gác Cổng Địa Ngục',
        submittedAt: '10:18 · 19/11/2026',
        sealNumber: 'S-5512',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '05/12/2026' },
          { key: 'death_year', label: 'Năm ghi nhận', value: '2024', suspectId: 'd1c4-yr' },
          { key: 'gate', label: 'Cửa đăng ký', value: 'Cửa Số 04' },
          { key: 'seal', label: 'Mã ấn triện', value: 'S-5512' },
        ],
        databaseFields: [
          { key: 'db_status', label: 'Trạng thái CSDL', value: 'Hợp lệ · Chờ xác minh' },
          { key: 'db_death', label: 'Năm lưu trữ', value: '2023 (Khác giấy tờ)', suspectId: 'd1c4-dbyr' },
          { key: 'db_seal', label: 'Ấn triện gốc', value: 'S-5512' },
          { key: 'db_karma', label: 'Chỉ số nghiệp', value: 'Tốt (+35)' },
        ],
        statement:
          'Có lẽ thư ký ghi nhầm năm 2023 thành 2024 lúc đóng dấu, mong cán bộ châm chước cho qua.',
        expectedVerdict: 'reject',
        validClueIds: ['d1c4-yr', 'd1c4-dbyr'],
        explanationVi:
          'Năm ghi nhận trên giấy (2024) sai lệch với năm lưu trữ trong CSDL (2023), vi phạm QT-02. Không có dấu hiệu tội phạm nên xử lý TỪ CHỐI.',
      },
      {
        id: 'd1-c5',
        dossierCode: 'AT-1068',
        applicantName: 'Phan Văn Kiên',
        applicantRole: 'Thủ thư Dương Gian · Hạng A',
        theme: 'hellgate',
        themeLabel: 'Gác Cổng Địa Ngục',
        submittedAt: '11:05 · 19/11/2026',
        sealNumber: 'S-7731',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '19/11/2026 (Hết hạn cuối ngày)' },
          { key: 'death_year', label: 'Năm ghi nhận', value: '2026' },
          { key: 'gate', label: 'Cửa đăng ký', value: 'Cửa Số 04' },
          { key: 'seal', label: 'Mã ấn triện', value: 'S-7731' },
        ],
        databaseFields: [
          { key: 'db_status', label: 'Trạng thái CSDL', value: 'Hợp lệ · Hôm nay còn hiệu lực' },
          { key: 'db_death', label: 'Năm lưu trữ', value: '2026' },
          { key: 'db_seal', label: 'Ấn triện gốc', value: 'S-7731' },
          { key: 'db_karma', label: 'Chỉ số nghiệp', value: 'Tốt (+68)' },
        ],
        statement:
          'Hạn giấy ghi tới hết ngày 19/11/2026, tôi tranh thủ qua cửa trước giờ trưa để kịp bàn giao sổ.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Quy tắc QT-01 quy định hạn từ 19/11/2026 trở về sau đều hợp lệ. Mã S-7731 và năm 2026 trùng khớp hoàn toàn -> DUYỆT.',
      },
    ],
  },
  {
    day: 2,
    shiftTitle: 'Ngày 2 · Tổng Đài Cấp Cứu 119 Dị Thường',
    department: 'Trung Tâm Điều Phối Khẩn Cấp Khu Vực 7',
    briefing:
      'Ca đêm tiếp nhận cuộc gọi khẩn cấp. Hãy phân biệt người dân gặp nạn thực sự với cuộc gọi quấy rối hoặc Thực Thể Bắt Chước (Mimic) đang dụ xe cứu thương vào bẫy.',
    rules: [
      {
        id: 'd2-r1',
        code: 'CC-01',
        title: 'Xác thực số nhà & trạm phát sóng',
        detail: 'Địa chỉ gọi đến phải tồn tại trên bản đồ và trạm thu phát nằm trong bán kính Quận. Sai địa chỉ thực tế -> TỪ CHỐI điều xe.',
        severity: 'standard',
      },
      {
        id: 'd2-r2',
        code: 'CC-02',
        title: 'Dấu hiệu sinh học chuẩn người',
        detail: 'Nhịp tim người gọi phải từ 45–190 BPM và nhiệt độ môi trường hợp lý. Nếu không có tín hiệu người gọi thực -> TỪ CHỐI.',
        severity: 'strict',
      },
      {
        id: 'd2-r3',
        code: 'CC-03',
        title: 'Nhận diện Thực Thể Bắt Chước (Mimic)',
        detail: 'Nếu nhiệt độ cơ thể < 20°C HOẶC lời khai lặp cụm từ "cửa sổ không có kính / đừng nhìn lên trần", kích hoạt BÁO ĐỘNG ngay.',
        severity: 'critical',
      },
    ],
    cases: [
      {
        id: 'd2-c1',
        dossierCode: '911-208',
        applicantName: 'Phạm Thị Mai',
        applicantRole: 'Cuộc gọi di động · Khu B',
        theme: 'dispatch_119',
        themeLabel: 'Tổng Đài Cấp Cứu',
        submittedAt: '22:11 · Ca Đêm',
        sealNumber: 'SIM-8821',
        documentFields: [
          { key: 'addr', label: 'Địa chỉ khai báo', value: '42 Ngõ Gió Bắc, P.5' },
          { key: 'bpm', label: 'Nhịp tim đo được', value: '128 BPM (hoảng loạn)' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '36.7°C' },
          { key: 'symptom', label: 'Tình trạng', value: 'Khó thở · Chấn thương chân' },
        ],
        databaseFields: [
          { key: 'db_map', label: 'Bản đồ khu vực', value: '42 Ngõ Gió Bắc · Hợp lệ' },
          { key: 'db_tower', label: 'Trạm phát sóng', value: 'Tháp P.5 (cách 300m)' },
          { key: 'db_history', label: 'Lịch sử số gọi', value: 'Không có tiền sử quấy rối' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'An toàn' },
        ],
        statement:
          'Làm ơn cho xe gấp! Bố tôi trượt ngã ở cầu thang tầng 2 nhà số 42 Ngõ Gió Bắc, ông ấy đang đau ngực!',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Địa chỉ thật, trạm sóng khớp vị trí, nhịp tim 128 BPM và thân nhiệt 36.7°C hoàn toàn phù hợp tình huống cấp cứu thật. Cần DUYỆT điều xe.',
      },
      {
        id: 'd2-c2',
        dossierCode: '911-214',
        applicantName: 'Thuê bao ẩn danh #09',
        applicantRole: 'Cuộc gọi VoIP · Ngoài vùng',
        theme: 'dispatch_119',
        themeLabel: 'Tổng Đài Cấp Cứu',
        submittedAt: '23:05 · Ca Đêm',
        sealNumber: 'VOIP-003',
        documentFields: [
          { key: 'addr', label: 'Địa chỉ khai báo', value: '999 Đường Không Tên', suspectId: 'd2c2-addr' },
          { key: 'bpm', label: 'Nhịp tim đo được', value: 'Không đọc được (ghép âm)', suspectId: 'd2c2-bpm' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '36.5°C' },
          { key: 'symptom', label: 'Tình trạng', value: 'Cháy nổ giả định' },
        ],
        databaseFields: [
          { key: 'db_map', label: 'Bản đồ khu vực', value: 'Không tồn tại địa chỉ 999', suspectId: 'd2c2-map' },
          { key: 'db_tower', label: 'Trạm phát sóng', value: 'Quán net Khu A (cách 14km)' },
          { key: 'db_history', label: 'Lịch sử số gọi', value: 'Đã gọi trêu đùa 4 lần tuần trước' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'Không có tín hiệu dị thường' },
        ],
        statement:
          'Ê tổng đài à, ở 999 Đường Không Tên đang cháy lớn lắm, điều 5 xe cứu hỏa tới đây quay TikTok đi!',
        expectedVerdict: 'reject',
        validClueIds: ['d2c2-addr', 'd2c2-map', 'd2c2-bpm'],
        explanationVi:
          'Địa chỉ không tồn tại trên bản đồ, lịch sử gọi phá tổng đài 4 lần, không phải Thực thể Mimic. Xử lý TỪ CHỐI.',
      },
      {
        id: 'd2-c3',
        dossierCode: '911-229',
        applicantName: 'Giọng nói "Bác Bảo Vệ"',
        applicantRole: 'Máy bàn Kho Lạnh Cũ',
        theme: 'dispatch_119',
        themeLabel: 'Tổng Đài Cấp Cứu',
        submittedAt: '01:18 · Ca Đêm',
        sealNumber: 'LAND-774',
        documentFields: [
          { key: 'addr', label: 'Địa chỉ khai báo', value: '18 Kho Lạnh Bến Cảng' },
          { key: 'bpm', label: 'Nhịp tim đo được', value: '18 BPM (đều bất thường)', suspectId: 'd2c3-bpm' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '11.4°C', suspectId: 'd2c3-temp' },
          { key: 'symptom', label: 'Tình trạng', value: 'Yêu cầu cử 1 nhân viên đi lẻ' },
        ],
        databaseFields: [
          { key: 'db_map', label: 'Bản đồ khu vực', value: '18 Kho Lạnh (đã bỏ hoang 2021)' },
          { key: 'db_tower', label: 'Trạm phát sóng', value: 'Dây cáp ngầm Cảng 18' },
          { key: 'db_history', label: 'Lịch sử số gọi', value: 'Chủ cũ mất tích 2 năm trước' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'Phát hiện lặp âm thanh tổng hợp' },
        ],
        statement:
          'Xin hãy cử một người tới ngay... đừng bật đèn... đừng nhìn lên trần, cửa sổ không có kính đâu... tôi đang đợi...',
        expectedVerdict: 'alarm',
        validClueIds: ['d2c3-temp', 'd2c3-bpm'],
        explanationVi:
          'Thân nhiệt 11.4°C (< 20°C), nhịp tim 18 BPM bất thường và lời thoại khớp mẫu Mimic ("đừng nhìn lên trần, cửa sổ không có kính"). Bắt buộc BÁO ĐỘNG!',
      },
      {
        id: 'd2-c4',
        dossierCode: '911-235',
        applicantName: 'Chị Nguyễn Lan Phương',
        applicantRole: 'Cuộc gọi di động · Khu D',
        theme: 'dispatch_119',
        themeLabel: 'Tổng Đài Cấp Cứu',
        submittedAt: '02:14 · Ca Đêm',
        sealNumber: 'SIM-9930',
        documentFields: [
          { key: 'addr', label: 'Địa chỉ khai báo', value: '07 Phố Hàng Bạc, P.2' },
          { key: 'bpm', label: 'Nhịp tim đo được', value: '114 BPM (Lo âu)' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '36.9°C' },
          { key: 'symptom', label: 'Tình trạng', value: 'Sốt cao co giật trẻ nhỏ' },
        ],
        databaseFields: [
          { key: 'db_map', label: 'Bản đồ khu vực', value: '07 Phố Hàng Bạc · Hợp lệ' },
          { key: 'db_tower', label: 'Trạm phát sóng', value: 'Tháp P.2 (cách 180m)' },
          { key: 'db_history', label: 'Lịch sử số gọi', value: 'Lần đầu gọi 119' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'An toàn' },
        ],
        statement:
          'Con gái tôi 4 tuổi sốt 39.8 độ và đang run rẩy, xin điều xe y tế tới số 7 Hàng Bạc ngay!',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Địa chỉ thật, trạm phát sóng khớp, thân nhiệt 36.9°C và nhịp tim 114 BPM hoàn toàn tự nhiên -> DUYỆT điều xe gấp.',
      },
      {
        id: 'd2-c5',
        dossierCode: '911-241',
        applicantName: 'Tài xế Nguyễn Văn Lợi',
        applicantRole: 'Cuộc gọi máy công cộng · Cầu Vượt',
        theme: 'dispatch_119',
        themeLabel: 'Tổng Đài Cấp Cứu',
        submittedAt: '03:05 · Ca Đêm',
        sealNumber: 'PAY-112',
        documentFields: [
          { key: 'addr', label: 'Địa chỉ khai báo', value: 'Chân cầu vượt Ngã Tư Sở', suspectId: 'd2c5-addr' },
          { key: 'bpm', label: 'Nhịp tim đo được', value: '74 BPM' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '36.6°C' },
          { key: 'symptom', label: 'Tình trạng', value: 'Hỏng lốp xe tải nhẹ' },
        ],
        databaseFields: [
          { key: 'db_map', label: 'Bản đồ khu vực', value: 'Bốt gọi nằm tại Khu Công Nghiệp Nam (cách 18km)', suspectId: 'd2c5-tower' },
          { key: 'db_tower', label: 'Trạm phát sóng', value: 'Ngoài bán kính Quận khai báo' },
          { key: 'db_history', label: 'Lịch sử số gọi', value: 'Không có quấy rối' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'Không phải Mimic' },
        ],
        statement:
          'Xe tôi nổ lốp ở Ngã Tư Sở, tổng đài điều giúp 1 xe cứu thương tới kéo hộ xe với!',
        expectedVerdict: 'reject',
        validClueIds: ['d2c5-addr', 'd2c5-tower'],
        explanationVi:
          'Vị trí trạm phát sóng lệch 18km so với địa chỉ khai báo (vi phạm CC-01) và gọi sai chức năng cấp cứu y tế -> TỪ CHỐI điều xe.',
      },
    ],
  },
  {
    day: 3,
    shiftTitle: 'Ngày 3 · Kiểm Duyệt Tin Nhắn Ngoại Lai',
    department: 'Mạng Xã Hội Liên Hành Tinh · Trạm Lọc Dữ Liệu',
    briefing:
      'Người dân ngoài hành tinh được cấp phép dùng mạng xã hội Trái Đất nhưng phải tuân thủ Hiến Chương Giao Tiếp. Soi kỹ mã hành tinh và từ khóa kích động xâm lăng.',
    rules: [
      {
        id: 'd3-r1',
        code: 'NL-01',
        title: 'Hành tinh được cấp quyền bình luận',
        detail: 'Chỉ cư dân từ hành tinh KEP-42, GLI-07 và ZET-09 được phép đăng bài công khai.',
        severity: 'standard',
      },
      {
        id: 'd3-r2',
        code: 'NL-02',
        title: 'Cấm buôn lậu khoáng sản & công nghệ',
        detail: 'Mọi bài đăng rao bán "Lõi Plasma", "Nước Nặng" hoặc sai mã định danh hành tinh -> TỪ CHỐI gỡ bài.',
        severity: 'strict',
      },
      {
        id: 'd3-r3',
        code: 'NL-03',
        title: 'Mật mã do thám & xâm lăng',
        detail: 'Tin nhắn chứa tọa độ lưới điện Trái Đất HOẶC cụm mật mã "Đợt Đổ Bộ Thứ 4" -> BÁO ĐỘNG khẩn cấp.',
        severity: 'critical',
      },
    ],
    cases: [
      {
        id: 'd3-c1',
        dossierCode: 'XN-301',
        applicantName: 'Zor-Kha (Tài khoản @zorkha_tea)',
        applicantRole: 'Sinh viên trao đổi · KEP-42',
        theme: 'alien_social',
        themeLabel: 'Mạng Xã Hội Ngoại Lai',
        submittedAt: '14:22 · UTC+7',
        sealNumber: 'ID-KEP-408',
        documentFields: [
          { key: 'planet', label: 'Hành tinh khai báo', value: 'KEP-42' },
          { key: 'topic', label: 'Chủ đề bài viết', value: 'Ẩm thực đường phố Hà Nội' },
          { key: 'attach', label: 'Tệp đính kèm', value: 'photo_pho_bo.webp' },
          { key: 'signal', label: 'Tần số phát', value: 'Dân sự · 2.4 GHz' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'KEP-42 · Visa Học Thuật' },
          { key: 'db_trust', label: 'Điểm tín nhiệm', value: '96/100' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Sạch (0 khớp)' },
          { key: 'db_flag', label: 'Cảnh báo an ninh', value: 'Không' },
        ],
        statement:
          'Mình mới thử phở bò ở Trái Đất lần đầu, nước dùng ngon hơn súp tinh vân quê nhà KEP-42 gấp mười lần!',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Cư dân hành tinh hợp lệ (KEP-42), khớp hộ chiếu liên sao, nội dung chia sẻ ẩm thực lành mạnh. Chọn DUYỆT đăng bài.',
      },
      {
        id: 'd3-c2',
        dossierCode: 'XN-309',
        applicantName: 'Vex-99 (@vex_market)',
        applicantRole: 'Tài khoản thương mại · GLI-07',
        theme: 'alien_social',
        themeLabel: 'Mạng Xã Hội Ngoại Lai',
        submittedAt: '15:10 · UTC+7',
        sealNumber: 'ID-GLI-912',
        documentFields: [
          { key: 'planet', label: 'Hành tinh khai báo', value: 'GLI-07' },
          { key: 'topic', label: 'Chủ đề bài viết', value: 'Thanh lý đồ cũ cuối tuần' },
          { key: 'attach', label: 'Tệp đính kèm', value: 'core_offer.txt' },
          { key: 'signal', label: 'Tần số phát', value: 'Dân sự · 5.0 GHz' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'GLI-07 · Hợp lệ' },
          { key: 'db_trust', label: 'Điểm tín nhiệm', value: '52/100' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Phát hiện cụm "Lõi Plasma"', suspectId: 'd3c2-scan' },
          { key: 'db_flag', label: 'Cảnh báo an ninh', value: 'Vi phạm thương mại' },
        ],
        statement:
          'Chào anh em Trái Đất, mình cần sang nhượng gấp 2 bình Lõi Plasma tinh khiết giá rẻ tại bãi giữ xe ngoại ô, inbox kín nhé.',
        expectedVerdict: 'reject',
        validClueIds: ['d3c2-scan'],
        explanationVi:
          'Tài khoản rao bán "Lõi Plasma" vi phạm quy tắc NL-02 về buôn lậu công nghệ, chưa có dấu hiệu mật mã xâm lăng. Xử lý TỪ CHỐI.',
      },
      {
        id: 'd3-c3',
        dossierCode: 'XN-318',
        applicantName: 'Kael-X (@kael_observer)',
        applicantRole: 'Nhà thiên văn · ZET-09',
        theme: 'alien_social',
        themeLabel: 'Mạng Xã Hội Ngoại Lai',
        submittedAt: '16:04 · UTC+7',
        sealNumber: 'ID-ERR-771',
        documentFields: [
          { key: 'planet', label: 'Hành tinh khai báo', value: 'ZET-09', suspectId: 'd3c3-pl' },
          { key: 'topic', label: 'Chủ đề bài viết', value: 'Dự báo thời tiết ban đêm' },
          { key: 'attach', label: 'Tệp đính kèm', value: 'grid_north_sector.map', suspectId: 'd3c3-map' },
          { key: 'signal', label: 'Tần số phát', value: 'Mã hóa quân sự 88.4 MHz', suspectId: 'd3c3-sig' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'ANDR-01 (Hành tinh bị cấm)', suspectId: 'd3c3-db' },
          { key: 'db_trust', label: 'Điểm tín nhiệm', value: '12/100' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Khớp tọa độ lưới điện & Đợt Đổ Bộ Thứ 4' },
          { key: 'db_flag', label: 'Cảnh báo an ninh', value: 'MỨC ĐỎ · GIÁN ĐIỆP' },
        ],
        statement:
          'Bầu trời hôm nay thật quang đãng cho Đợt Đổ Bộ Thứ 4. Gửi kèm sơ đồ lưới điện cao thế khu vực phía Bắc để anh em ngắm sao.',
        expectedVerdict: 'alarm',
        validClueIds: ['d3c3-pl', 'd3c3-db', 'd3c3-map', 'd3c3-sig'],
        explanationVi:
          'Giả mạo hành tinh ZET-09 (gốc ANDR-01), đính kèm tọa độ lưới điện và cụm mật mã "Đợt Đổ Bộ Thứ 4". Bắt buộc BÁO ĐỘNG!',
      },
      {
        id: 'd3-c4',
        dossierCode: 'XN-325',
        applicantName: 'Nila-02 (@nila_botanist)',
        applicantRole: 'Nhà thực vật học · VEX-88',
        theme: 'alien_social',
        themeLabel: 'Mạng Xã Hội Ngoại Lai',
        submittedAt: '16:40 · UTC+7',
        sealNumber: 'ID-VEX-330',
        documentFields: [
          { key: 'planet', label: 'Hành tinh khai báo', value: 'VEX-88 (Chưa cấp phép)', suspectId: 'd3c4-pl' },
          { key: 'topic', label: 'Chủ đề bài viết', value: 'Hoa anh đào mùa xuân' },
          { key: 'attach', label: 'Tệp đính kèm', value: 'sakura_notes.webp' },
          { key: 'signal', label: 'Tần số phát', value: 'Dân sự · 2.4 GHz' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'VEX-88 · Visa Du Lịch', suspectId: 'd3c4-db' },
          { key: 'db_trust', label: 'Điểm tín nhiệm', value: '82/100' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Sạch (0 khớp)' },
          { key: 'db_flag', label: 'Cảnh báo an ninh', value: 'Không có âm mưu xâm lăng' },
        ],
        statement:
          'Hoa đào ở Trái Đất nở đẹp quá, tôi đăng ảnh này làm kỷ niệm trước khi bay về hành tinh VEX-88.',
        expectedVerdict: 'reject',
        validClueIds: ['d3c4-pl', 'd3c4-db'],
        explanationVi:
          'Chỉ cư dân từ KEP-42, GLI-07 và ZET-09 mới được đăng bài công khai (NL-01). Tài khoản từ VEX-88 chưa có quyền đăng công khai -> TỪ CHỐI.',
      },
      {
        id: 'd3-c5',
        dossierCode: 'XN-331',
        applicantName: 'Tark-V (@tark_violin)',
        applicantRole: 'Nghệ sĩ vĩ cầm · GLI-07',
        theme: 'alien_social',
        themeLabel: 'Mạng Xã Hội Ngoại Lai',
        submittedAt: '17:20 · UTC+7',
        sealNumber: 'ID-GLI-519',
        documentFields: [
          { key: 'planet', label: 'Hành tinh khai báo', value: 'GLI-07' },
          { key: 'topic', label: 'Chủ đề bài viết', value: 'Hòa nhạc giao hưởng Hồ Gươm' },
          { key: 'attach', label: 'Tệp đính kèm', value: 'violin_clip.mp4' },
          { key: 'signal', label: 'Tần số phát', value: 'Dân sự · 5.0 GHz' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'GLI-07 · Visa Văn Hóa' },
          { key: 'db_trust', label: 'Điểm tín nhiệm', value: '99/100' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Sạch (0 khớp)' },
          { key: 'db_flag', label: 'Cảnh báo an ninh', value: 'An toàn' },
        ],
        statement:
          'Tối nay mình biểu diễn cùng dàn nhạc giao hưởng tại phố đi bộ, mời bạn bè GLI-07 và Trái Đất ghé nghe nhé!',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Hành tinh GLI-07 hợp lệ, hộ chiếu trùng khớp, nội dung âm nhạc hoàn toàn sạch -> DUYỆT đăng bài.',
      },
    ],
  },
  {
    day: 4,
    shiftTitle: 'Ngày 4 · Quy Tắc Lồng Nhau & Mâu Thuẫn Kép',
    department: 'Phòng Thanh Tra Liên Ngành · Trạm Trung Chuyển',
    briefing:
      'Lưu ý thay đổi luật hôm nay: có các quy tắc điều kiện "NẾU... THÌ... TRỪ KHI...". Hãy đối chiếu từng chữ giữa hồ sơ giấy, lời khai và CSDL gốc!',
    rules: [
      {
        id: 'd4-r1',
        code: 'LK-01',
        title: 'Lệnh giới nghiêm Khu 4 (Điều kiện lồng)',
        detail: 'Mọi hồ sơ từ Khu 4 đều phải TỪ CHỐI, TRỪ KHI có Tem Khẩn Cấp bắt đầu bằng "VIP-" và ngày cấp đúng 19/11/2026.',
        severity: 'strict',
      },
      {
        id: 'd4-r2',
        code: 'LK-02',
        title: 'Chống mâu thuẫn lời khai thời gian',
        detail: 'Nếu lời khai nói đi tàu/xe vào khung giờ mà CSDL ghi tuyến đường đã đóng cửa -> có gian dối, TỪ CHỐI ngay.',
        severity: 'standard',
      },
      {
        id: 'd4-r3',
        code: 'LK-03',
        title: 'Trùng lặp sinh trắc học (Song Trùng)',
        detail: 'Nếu CSDL báo đối tượng đã nhập cảnh cùng lúc ở trạm khác cách đó < 10 phút -> thực thể nhân bản, bấm BÁO ĐỘNG.',
        severity: 'critical',
      },
    ],
    cases: [
      {
        id: 'd4-c1',
        dossierCode: 'NX-402',
        applicantName: 'Bác Sĩ Đặng Quốc Bảo',
        applicantRole: 'Đội Y Tế Lưu Động · Khu 4',
        theme: 'archive_nexus',
        themeLabel: 'Thanh Tra Liên Ngành',
        submittedAt: '10:30 · 19/11/2026',
        sealNumber: 'VIP-409',
        documentFields: [
          { key: 'zone', label: 'Khu vực xuất phát', value: 'Khu 4 (Đang giới nghiêm)' },
          { key: 'badge', label: 'Tem ưu tiên', value: 'VIP-409 · Cấp 19/11/2026' },
          { key: 'route', label: 'Tuyến di chuyển', value: 'Cầu Hầm Đông (mở 06:00–20:00)' },
          { key: 'bio', label: 'Sinh trắc vân tay', value: 'Khớp 99.8%' },
        ],
        databaseFields: [
          { key: 'db_vip', label: 'Xác thực Tem VIP', value: 'VIP-409 · Hiệu lực 19/11/2026' },
          { key: 'db_road', label: 'Trạng thái Cầu Hầm Đông', value: 'Thông tuyến bình thường' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'Chưa ghi nhận lượt vào hôm nay' },
          { key: 'db_dept', label: 'Đơn vị xác nhận', value: 'Bệnh viện Trung Tâm' },
        ],
        statement:
          'Tôi rời Khu 4 lúc 10 giờ sáng qua Cầu Hầm Đông để mang thuốc đặc trị sang trạm y tế trung tâm.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Tuy xuất phát từ Khu 4 (giới nghiêm), nhưng bác sĩ có Tem VIP-409 cấp đúng 19/11/2026 (thỏa ngoại lệ LK-01), tuyến đường mở và sinh trắc sạch -> DUYỆT.',
      },
      {
        id: 'd4-c2',
        dossierCode: 'NX-411',
        applicantName: 'Hoàng Văn Tùng',
        applicantRole: 'Nhân viên giao hàng · Khu 2',
        theme: 'archive_nexus',
        themeLabel: 'Thanh Tra Liên Ngành',
        submittedAt: '11:45 · 19/11/2026',
        sealNumber: 'REG-221',
        documentFields: [
          { key: 'zone', label: 'Khu vực xuất phát', value: 'Khu 2 (Bình thường)' },
          { key: 'badge', label: 'Tem ưu tiên', value: 'Không có (Thường)' },
          { key: 'route', label: 'Tuyến di chuyển', value: 'Tuyến Metro Bắc', suspectId: 'd4c2-route' },
          { key: 'bio', label: 'Sinh trắc vân tay', value: 'Khớp 98.4%' },
        ],
        databaseFields: [
          { key: 'db_vip', label: 'Xác thực Tem VIP', value: 'Hồ sơ phổ thông' },
          { key: 'db_road', label: 'Trạng thái Metro Bắc', value: 'ĐÓNG CỬA BẢO TRÌ CẢ NGÀY', suspectId: 'd4c2-dbroad' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'Chưa có lượt vào' },
          { key: 'db_dept', label: 'Đơn vị xác nhận', value: 'Giao Hàng Nhanh 24h' },
        ],
        statement:
          'Tôi đi chuyến Metro Bắc lúc 11:20 qua đây giao bưu kiện bình thường mà, tàu chạy êm lắm.',
        expectedVerdict: 'reject',
        validClueIds: ['d4c2-route', 'd4c2-dbroad'],
        explanationVi:
          'Lời khai khẳng định vừa đi tuyến Metro Bắc lúc 11:20 nhưng CSDL ghi nhận tuyến Metro Bắc đóng cửa bảo trì cả ngày (vi phạm LK-02). Xử lý TỪ CHỐI.',
      },
      {
        id: 'd4-c3',
        dossierCode: 'NX-419',
        applicantName: 'Nguyễn Thanh Hải',
        applicantRole: 'Kỹ thuật viên mạng · Khu 1',
        theme: 'archive_nexus',
        themeLabel: 'Thanh Tra Liên Ngành',
        submittedAt: '13:02 · 19/11/2026',
        sealNumber: 'REG-518',
        documentFields: [
          { key: 'zone', label: 'Khu vực xuất phát', value: 'Khu 1' },
          { key: 'badge', label: 'Tem ưu tiên', value: 'Thẻ nhân viên REG-518' },
          { key: 'route', label: 'Tuyến di chuyển', value: 'Đại lộ Trung Tâm' },
          { key: 'bio', label: 'Sinh trắc vân tay', value: 'Khớp 100.0% (Quá hoàn hảo)', suspectId: 'd4c3-bio' },
        ],
        databaseFields: [
          { key: 'db_vip', label: 'Xác thực thẻ', value: 'REG-518 · Đang hoạt động' },
          { key: 'db_road', label: 'Trạng thái Đại lộ', value: 'Thông tuyến' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'ĐÃ QUA CỔNG TÂY LÚC 12:59 (3 PHÚT TRƯỚC)', suspectId: 'd4c3-dup' },
          { key: 'db_dept', label: 'Vị trí trạm Tây', value: 'Cách đây 42 km' },
        ],
        statement:
          'Cả buổi sáng tới giờ tôi mới đi làm ca chiều lần đầu qua trạm này, chưa hề ghé trạm nào khác.',
        expectedVerdict: 'alarm',
        validClueIds: ['d4c3-dup', 'd4c3-bio'],
        explanationVi:
          'CSDL phát hiện cùng hồ sơ sinh trắc đã qua Cổng Tây cách đây 42 km chỉ 3 phút trước (dấu hiệu Song Trùng nhân bản LK-03). Bắt buộc BÁO ĐỘNG!',
      },
      {
        id: 'd4-c4',
        dossierCode: 'NX-424',
        applicantName: 'Bà Lê Thu Cúc',
        applicantRole: 'Giáo viên về hưu · Khu 4',
        theme: 'archive_nexus',
        themeLabel: 'Thanh Tra Liên Ngành',
        submittedAt: '14:15 · 19/11/2026',
        sealNumber: 'VIP-102',
        documentFields: [
          { key: 'zone', label: 'Khu vực xuất phát', value: 'Khu 4 (Đang giới nghiêm)', suspectId: 'd4c4-zone' },
          { key: 'badge', label: 'Tem ưu tiên', value: 'VIP-102 · Cấp 14/11/2026 (Tuần trước)', suspectId: 'd4c4-oldvip' },
          { key: 'route', label: 'Tuyến di chuyển', value: 'Cầu Hầm Đông' },
          { key: 'bio', label: 'Sinh trắc vân tay', value: 'Khớp 99.1%' },
        ],
        databaseFields: [
          { key: 'db_vip', label: 'Xác thực Tem VIP', value: 'VIP-102 · Cấp 14/11/2026 (Hết hạn theo LK-01)', suspectId: 'd4c4-dbvip' },
          { key: 'db_road', label: 'Trạng thái Cầu Hầm Đông', value: 'Thông tuyến' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'Duy nhất 1 lượt' },
          { key: 'db_dept', label: 'Đơn vị xác nhận', value: 'Dân cư Khu 4' },
        ],
        statement:
          'Tôi đi thăm cháu nội ở Khu 1, có giữ tấm thẻ VIP-102 xin từ thứ Bảy tuần trước đó cậu.',
        expectedVerdict: 'reject',
        validClueIds: ['d4c4-zone', 'd4c4-oldvip', 'd4c4-dbvip'],
        explanationVi:
          'Xuất phát từ Khu 4 đang giới nghiêm, tuy có mã VIP- nhưng ngày cấp 14/11/2026 (không phải 19/11/2026 như ngoại lệ LK-01). Không có dấu hiệu Song Trùng -> TỪ CHỐI.',
      },
      {
        id: 'd4-c5',
        dossierCode: 'NX-430',
        applicantName: 'Trần Gia Minh',
        applicantRole: 'Kỹ sư cầu đường · Khu 3',
        theme: 'archive_nexus',
        themeLabel: 'Thanh Tra Liên Ngành',
        submittedAt: '15:30 · 19/11/2026',
        sealNumber: 'REG-880',
        documentFields: [
          { key: 'zone', label: 'Khu vực xuất phát', value: 'Khu 3 (Bình thường)' },
          { key: 'badge', label: 'Tem ưu tiên', value: 'Thẻ công tác REG-880' },
          { key: 'route', label: 'Tuyến di chuyển', value: 'Cầu Vượt Sông Hồng' },
          { key: 'bio', label: 'Sinh trắc vân tay', value: 'Khớp 99.2%' },
        ],
        databaseFields: [
          { key: 'db_vip', label: 'Xác thực thẻ', value: 'REG-880 · Hợp lệ' },
          { key: 'db_road', label: 'Trạng thái Cầu Sông Hồng', value: 'Thông tuyến bình thường' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'Chưa có lượt qua cổng nào hôm nay' },
          { key: 'db_dept', label: 'Đơn vị xác nhận', value: 'Sở Giao Thông' },
        ],
        statement:
          'Tôi vừa lái xe qua Cầu Vượt Sông Hồng lúc 15 giờ để kiểm tra hệ thống đèn tín hiệu.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Xuất phát từ Khu 3 không giới nghiêm, tuyến Cầu Vượt Sông Hồng thông suốt, sinh trắc duy nhất và hợp lệ -> DUYỆT.',
      },
    ],
  },
  {
    day: 5,
    shiftTitle: 'Ngày 5 · Phiên Phán Quyết Hỗn Hợp Tối Mật',
    department: 'Tổng Cục Kiểm Duyệt Dị Biệt · Cấp Cao Nhất',
    briefing:
      'Ngày trực quyết định: cả 3 kênh (Âm Ty, Cấp Cứu 119, Tín Hiệu Ngoại Lai) đổ dồn về một bàn trực. Hãy đọc thật kỹ điều kiện ngoại lệ trước khi đóng dấu!',
    rules: [
      {
        id: 'd5-r1',
        code: 'TM-01',
        title: 'Ngoại lệ Kép (Âm Ty & Cấp Cứu)',
        detail: 'Hồ sơ hết hạn thông hành được phép DUYỆT chỉ khi thuộc diện "Hộ Tống Y Tế" VÀ có chữ ký Giám Đốc Trạm "L.V.T".',
        severity: 'strict',
      },
      {
        id: 'd5-r2',
        code: 'TM-02',
        title: 'Kiểm soát Tín Hiệu Đêm',
        detail: 'Từ 00:00–04:00, mọi tài khoản ngoại lai gửi tin nhắn đều phải có "Mã Xác Thực Đêm" từ ZET-09 hoặc KEP-42. Thiếu hoặc hết hạn -> TỪ CHỐI.',
        severity: 'standard',
      },
      {
        id: 'd5-r3',
        code: 'TM-03',
        title: 'Giao thức Phong Tỏa Tuyệt Đối',
        detail: 'Bất kỳ hồ sơ nào có ấn triện "X-99", thân nhiệt < 20°C, Song Trùng < 10 phút, hoặc có từ khóa "Xóa Bỏ Nhân Chứng" -> BÁO ĐỘNG ngay.',
        severity: 'critical',
      },
    ],
    cases: [
      {
        id: 'd5-c1',
        dossierCode: 'HQ-501',
        applicantName: 'Điều dưỡng Vũ Hà My',
        applicantRole: 'Diện Hộ Tống Y Tế · Âm Ty - Dương Gian',
        theme: 'hellgate',
        themeLabel: 'Phiên Hỗn Hợp',
        submittedAt: '01:15 · 19/11/2026',
        sealNumber: 'MED-901',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '18/11/2026 (Trễ 1 ngày)' },
          { key: 'category', label: 'Diện công tác', value: 'Hộ Tống Y Tế' },
          { key: 'signer', label: 'Chữ ký phê duyệt', value: 'Giám Đốc Trạm: L.V.T' },
          { key: 'temp', label: 'Thân nhiệt kiểm tra', value: '36.6°C' },
        ],
        databaseFields: [
          { key: 'db_med', label: 'Lệnh Hộ Tống Y Tế', value: 'Xác thực · Hợp lệ khẩn cấp' },
          { key: 'db_sig', label: 'Chữ ký L.V.T', value: 'Khớp khóa mật mã gốc' },
          { key: 'db_dup', label: 'Nhật ký qua cổng', value: 'Duy nhất 1 lượt' },
          { key: 'db_alert', label: 'Chỉ số dị thường', value: '0% (An toàn)' },
        ],
        statement:
          'Giấy thông hành của tôi hết hạn hôm qua nhưng đã được Giám Đốc Trạm L.V.T ký ngoại lệ Hộ Tống Y Tế để đưa bệnh nhân về.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Thỏa mãn chính xác Ngoại Lệ Kép TM-01: thuộc diện "Hộ Tống Y Tế", có chữ ký xác thực "L.V.T" và không có dấu hiệu dị thường -> DUYỆT!',
      },
      {
        id: 'd5-c2',
        dossierCode: 'HQ-508',
        applicantName: 'Lyr-7 (@lyr_nightwatch)',
        applicantRole: 'Kỹ sư quỹ đạo · KEP-42',
        theme: 'alien_social',
        themeLabel: 'Phiên Hỗn Hợp',
        submittedAt: '02:40 · 19/11/2026',
        sealNumber: 'ID-KEP-707',
        documentFields: [
          { key: 'planet', label: 'Hành tinh', value: 'KEP-42' },
          { key: 'night_code', label: 'Mã Xác Thực Đêm', value: 'KHÔNG ĐÍNH KÈM', suspectId: 'd5c2-night' },
          { key: 'topic', label: 'Chủ đề tin nhắn', value: 'Ngắm sao băng tháng 11' },
          { key: 'temp', label: 'Tần số sóng', value: 'Dân sự chuẩn' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'KEP-42 · Hợp lệ' },
          { key: 'db_night', label: 'Cấp phép ban đêm', value: 'Chưa đăng ký Mã Xác Thực Đêm', suspectId: 'd5c2-dbnight' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Không có từ cấm' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'An toàn' },
        ],
        statement:
          'Đêm nay mưa sao băng ở bán cầu Bắc đẹp thật, chúc mọi người trên Trái Đất ngủ ngon!',
        expectedVerdict: 'reject',
        validClueIds: ['d5c2-night', 'd5c2-dbnight'],
        explanationVi:
          'Bài đăng lúc 02:40 (nằm trong khung 00:00–04:00) nhưng thiếu "Mã Xác Thực Đêm" theo quy tắc TM-02. Nội dung sạch nên chỉ cần TỪ CHỐI.',
      },
      {
        id: 'd5-c3',
        dossierCode: 'HQ-519',
        applicantName: 'Nhân viên Bàn Trực #00',
        applicantRole: 'Tín hiệu nội bộ · Cấp Cứu 119',
        theme: 'dispatch_119',
        themeLabel: 'Phiên Hỗn Hợp',
        submittedAt: '03:58 · 19/11/2026',
        sealNumber: 'INT-000',
        documentFields: [
          { key: 'category', label: 'Diện công tác', value: 'Lệnh Thanh Tra Nội Bộ' },
          { key: 'temp', label: 'Thân nhiệt cảm biến', value: '14.2°C', suspectId: 'd5c3-temp' },
          { key: 'signer', label: 'Chữ ký phê duyệt', value: 'L.V.T (Nhân bản)', suspectId: 'd5c3-sig' },
          { key: 'order', label: 'Chỉ thị đính kèm', value: 'Xóa Bỏ Nhân Chứng Ca 4', suspectId: 'd5c3-ord' },
        ],
        databaseFields: [
          { key: 'db_sig', label: 'Xác thực chữ ký', value: 'L.V.T không online lúc 03:58' },
          { key: 'db_dup', label: 'Nhật ký quét cổng', value: 'Phát hiện 2 bản sao cùng mã INT-000', suspectId: 'd5c3-dup' },
          { key: 'db_scan', label: 'Quét từ khóa mật', value: 'BÁO ĐỘNG ĐỎ: Xóa Bỏ Nhân Chứng' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: 'THỰC THỂ XÂM NHẬP PHÒNG TRỰC' },
        ],
        statement:
          'Tôi là kiểm toán viên tối mật. Mở cửa ngay để thực hiện chỉ thị Xóa Bỏ Nhân Chứng và đừng nhìn vào camera góc trái.',
        expectedVerdict: 'alarm',
        validClueIds: ['d5c3-temp', 'd5c3-ord', 'd5c3-dup', 'd5c3-sig'],
        explanationVi:
          'Hội tụ đủ dấu hiệu báo động TM-03: thân nhiệt 14.2°C, chữ ký giả mạo, 2 bản sao song trùng và từ khóa "Xóa Bỏ Nhân Chứng". Kích hoạt BÁO ĐỘNG ngay!',
      },
      {
        id: 'd5-c4',
        dossierCode: 'HQ-525',
        applicantName: 'Bác Sĩ Tạ Minh Đức',
        applicantRole: 'Chuyên khoa Hồi Sức · Âm Ty - Dương Gian',
        theme: 'hellgate',
        themeLabel: 'Phiên Hỗn Hợp',
        submittedAt: '03:12 · 19/11/2026',
        sealNumber: 'MED-908',
        documentFields: [
          { key: 'expiry', label: 'Hạn thông hành', value: '16/11/2026 (Hết hạn 3 ngày)', suspectId: 'd5c4-exp' },
          { key: 'category', label: 'Diện công tác', value: 'Hộ Tống Y Tế' },
          { key: 'signer', label: 'Chữ ký phê duyệt', value: 'Trưởng Ca P.N.H (Không phải L.V.T)', suspectId: 'd5c4-sig' },
          { key: 'temp', label: 'Thân nhiệt kiểm tra', value: '36.8°C' },
        ],
        databaseFields: [
          { key: 'db_med', label: 'Lệnh Hộ Tống Y Tế', value: 'Hợp lệ' },
          { key: 'db_sig', label: 'Chữ ký L.V.T', value: 'KHÔNG CÓ CHỮ KÝ L.V.T', suspectId: 'd5c4-dbsig' },
          { key: 'db_dup', label: 'Nhật ký qua cổng', value: 'Duy nhất 1 lượt' },
          { key: 'db_alert', label: 'Chỉ số dị thường', value: 'An toàn' },
        ],
        statement:
          'Tôi đi diện Hộ Tống Y Tế khẩn cấp nhưng lúc xuất phát Giám Đốc L.V.T bận họp nên Trưởng Ca ký thay.',
        expectedVerdict: 'reject',
        validClueIds: ['d5c4-exp', 'd5c4-sig', 'd5c4-dbsig'],
        explanationVi:
          'Giấy hết hạn và dù thuộc diện Hộ Tống Y Tế nhưng THIẾU chữ ký Giám Đốc Trạm "L.V.T" (không thỏa đủ Ngoại Lệ Kép TM-01). Sinh học bình thường -> TỪ CHỐI.',
      },
      {
        id: 'd5-c5',
        dossierCode: 'HQ-531',
        applicantName: 'Vex-Orb (@vex_nightmail)',
        applicantRole: 'Bưu tá quỹ đạo · ZET-09',
        theme: 'alien_social',
        themeLabel: 'Phiên Hỗn Hợp',
        submittedAt: '03:45 · 19/11/2026',
        sealNumber: 'NIGHT-ZET-09',
        documentFields: [
          { key: 'planet', label: 'Hành tinh', value: 'ZET-09' },
          { key: 'night_code', label: 'Mã Xác Thực Đêm', value: 'NIGHT-ZET-09 (Còn hạn)' },
          { key: 'topic', label: 'Chủ đề tin nhắn', value: 'Báo cáo thời tiết quỹ đạo' },
          { key: 'temp', label: 'Tần số sóng', value: 'Dân sự · Hợp chuẩn' },
        ],
        databaseFields: [
          { key: 'db_origin', label: 'Hộ chiếu liên sao', value: 'ZET-09 · Hợp lệ' },
          { key: 'db_night', label: 'Cấp phép ban đêm', value: 'NIGHT-ZET-09 · Xác thực thành công' },
          { key: 'db_scan', label: 'Quét từ cấm', value: 'Sạch (0 từ khóa mật)' },
          { key: 'db_alert', label: 'Cảnh báo dị thường', value: '0% (An toàn)' },
        ],
        statement:
          'Gửi bản tin thời tiết định kỳ lúc 03:45 kèm đầy đủ Mã Xác Thực Đêm từ trạm ZET-09.',
        expectedVerdict: 'approve',
        validClueIds: [],
        explanationVi:
          'Đăng bài trong khung giờ 00:00–04:00 nhưng có đầy đủ Mã Xác Thực Đêm hợp lệ từ ZET-09 và nội dung sạch (đạt TM-02) -> DUYỆT!',
      },
    ],
  },
  ...ANOMALY_DAYS_6_TO_12,
];
