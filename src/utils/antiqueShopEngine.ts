export type AntiqueCoverKind = 'flap' | 'lid' | 'curtain' | 'papers' | 'drawer' | 'book' | 'lamp';

export type AntiqueEndingBranch = 'healing' | 'secret';

export type AntiqueBoxTheme = 'midnight_station' | 'vintage_vanity' | 'exam_desk';

export interface AntiqueCoverDef {
  id: string;
  label: string;
  actionHint: string;
  kind: AntiqueCoverKind;
  /** Bounds inside 1000x620 scene viewBox */
  x: number;
  y: number;
  w: number;
  h: number;
  openOffsetX: number;
  openOffsetY: number;
  openRotateDeg: number;
  accentColor: string;
}

export interface AntiqueItemDef {
  id: string;
  name: string;
  emotionalClue: string;
  shortTag: string;
  storyNote: string;
  showcaseTitle: string;
  /** Center position inside 1000x620 scene viewBox */
  x: number;
  y: number;
  /** Hitbox radius / size inside 1000x620 viewBox */
  hitW: number;
  hitH: number;
  rotateDeg?: number;
  /** Optional cover id hiding this item in 2-layer interaction */
  hiddenUnderCoverId?: string;
  tintColor: string;
  artKind:
    | 'train_ticket'
    | 'eye_drops'
    | 'hairpin'
    | 'torn_photo'
    | 'cafe_receipt'
    | 'brass_key'
    | 'wool_scarf'
    | 'folded_notebook'
    | 'ginger_tin'
    | 'postmark_stamp'
    | 'pocket_watch'
    | 'lipstick'
    | 'silver_ring'
    | 'perfume_bottle'
    | 'wifi_note'
    | 'blank_card'
    | 'wood_comb'
    | 'music_box'
    | 'pearl_earring'
    | 'mirror_sticky'
    | 'parking_stub'
    | 'spare_button'
    | 'highlighter'
    | 'dented_thermos'
    | 'broken_earbuds'
    | 'cram_notebook'
    | 'unripped_ticket'
    | 'library_card'
    | 'ginger_tea'
    | 'worn_eraser'
    | 'cracked_ruler'
    | 'pressed_daisy'
    | 'dorm_key'
    | 'id_photo';
}

export interface AntiqueEndingDef {
  branch: AntiqueEndingBranch;
  title: string;
  buttonLabel: string;
  epilogue: string;
  teaDecorName: string;
  teaDecorNote: string;
}

export interface AntiqueLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  guestName: string;
  arrivalTime: string;
  theme: AntiqueBoxTheme;
  openingWhisper: string;
  teaRewardIcon: 'station_lantern' | 'lavender_vase' | 'ceramic_mug';
  covers: AntiqueCoverDef[];
  items: AntiqueItemDef[];
  endings: Record<AntiqueEndingBranch, AntiqueEndingDef>;
}

export interface AntiqueLevelProgress {
  foundItemIds: string[];
  openedCoverIds: string[];
  hintsUsed: number;
  misclicks: number;
  chosenEnding: AntiqueEndingBranch | null;
  bestStars: number;
  bestScore: number;
}

export interface AntiqueShopSaveData {
  version: 1;
  activeLevelId: string;
  levels: Record<string, AntiqueLevelProgress>;
  teaShelfOrder: string[];
}

export interface PanZoomState {
  scale: number;
  panX: number;
  panY: number;
}

export interface HintTargetResult {
  item: AntiqueItemDef;
  needsCoverOpened: boolean;
  coverLabel: string | null;
  zoneX: number;
  zoneY: number;
  hintText: string;
}

export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 620;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 2.6;
export const ACTIVE_CLUES_COUNT = 4;

export const ANTIQUE_LEVELS: readonly AntiqueLevelDef[] = [
  {
    id: 'midnight-suitcase',
    order: 1,
    title: 'Chiếc vali bỏ quên ở ga đêm',
    subtitle: 'Chuyến tàu 23:45 · Sân ga số 2',
    guestName: 'Khách gửi: Minh Khôi (áo khoác ướt mưa)',
    arrivalTime: '23:15 · Mưa phùn đầu hẻm',
    theme: 'midnight_station',
    openingWhisper:
      '“Anh ấy đặt chiếc vali da nâu lên quầy gỗ, bảo chỉ gửi tạm qua đêm rồi vội vã bước ra mưa. Bên trong vẫn còn mùi cà phê khuya và tiếng tàu hỏa chưa kịp tắt.”',
    teaRewardIcon: 'station_lantern',
    covers: [
      {
        id: 'cover-newspaper',
        label: 'Tờ báo ga tàu gấp đôi',
        actionHint: 'Lật tờ báo cũ sang bên',
        kind: 'papers',
        x: 600,
        y: 122,
        w: 225,
        h: 170,
        openOffsetX: 12,
        openOffsetY: -102,
        openRotateDeg: 5,
        accentColor: '#D6C7AE',
      },
      {
        id: 'cover-flap',
        label: 'Nắp túi vải bên hông vali',
        actionHint: 'Mở khuy nắp túi phụ',
        kind: 'flap',
        x: 112,
        y: 332,
        w: 225,
        h: 175,
        openOffsetX: -74,
        openOffsetY: -86,
        openRotateDeg: -16,
        accentColor: '#7C5840',
      },
      {
        id: 'cover-scarf-fold',
        label: 'Nếp gấp khăn len xám',
        actionHint: 'Vén nhẹ nếp khăn len',
        kind: 'curtain',
        x: 375,
        y: 356,
        w: 215,
        h: 162,
        openOffsetX: -88,
        openOffsetY: 54,
        openRotateDeg: -11,
        accentColor: '#64748B',
      },
    ],
    items: [
      {
        id: 'ms-train-ticket',
        name: 'Vé tàu đêm ĐS-04',
        shortTag: 'Chuyến đi lỡ hẹn',
        emotionalClue: 'Tấm giấy mỏng giữ hai chỗ ngồi cạnh cửa sổ, nhưng chỉ một góc được bấm lỗ.',
        storyNote:
          '“Chuyến tàu rời ga lúc 22 giờ 10. Chỗ ngồi số 14 vẫn còn trống suốt cả chặng đường đêm.”',
        showcaseTitle: 'Vé tàu đêm ĐS-04',
        x: 235,
        y: 192,
        hitW: 96,
        hitH: 60,
        rotateDeg: -8,
        tintColor: '#E9D5A1',
        artKind: 'train_ticket',
      },
      {
        id: 'ms-eye-drops',
        name: 'Lọ thuốc nhỏ mắt',
        shortTag: 'Đêm thức trắng',
        emotionalClue: 'Chiếc lọ nhựa trong veo nhỏ xíu, nằm lẫn cạnh đường viền vali cho những giờ thức đợi.',
        storyNote:
          '“Không phải vì bụi ga tàu, mà vì đọc đi đọc lại tin nhắn cũ suốt ba tiếng đồng hồ.”',
        showcaseTitle: 'Lọ thuốc nhỏ mắt xanh nhạt',
        x: 416,
        y: 172,
        hitW: 54,
        hitH: 66,
        rotateDeg: 12,
        tintColor: '#93C5FD',
        artKind: 'eye_drops',
      },
      {
        id: 'ms-hairpin',
        name: 'Chiếc kẹp tóc đồi mồi',
        shortTag: 'Kỷ vật để quên',
        emotionalClue: 'Món đồ nhỏ bằng nhựa hổ phách không thuộc về chủ nhân chiếc vali này.',
        storyNote:
          '“Cô ấy từng gỡ vội chiếc kẹp ở băng ghế chờ ga vì gió đêm quá mạnh, rồi quên lấy lại.”',
        showcaseTitle: 'Kẹp tóc đồi mồi hổ phách',
        x: 528,
        y: 256,
        hitW: 72,
        hitH: 48,
        rotateDeg: -22,
        tintColor: '#D97706',
        artKind: 'hairpin',
      },
      {
        id: 'ms-torn-photo',
        name: 'Bức ảnh chụp chung bị xé đôi',
        shortTag: 'Nửa nụ cười cũ',
        emotionalClue: 'Giấu kỹ dưới lớp giấy in tin tức cũ, chỉ còn lại một nửa khung hình dưới tán bàng.',
        storyNote:
          '“Mép giấy xé nham nhở nhưng mặt sau vẫn còn nét bút chì mờ: Mùa thu năm mình 21.”',
        showcaseTitle: 'Nửa tấm ảnh sân ga',
        x: 712,
        y: 206,
        hitW: 92,
        hitH: 74,
        rotateDeg: 6,
        hiddenUnderCoverId: 'cover-newspaper',
        tintColor: '#F1E8D8',
        artKind: 'torn_photo',
      },
      {
        id: 'ms-cafe-receipt',
        name: 'Hóa đơn quán cà phê ga',
        shortTag: 'Hai ly bạc xỉu nguội',
        emotionalClue: 'Tờ giấy nhiệt hơi phai mực, ghi hai món đồ uống gọi lúc 20:50.',
        storyNote:
          '“Một ly ít đá, một ly nhiều sữa. Cả hai đều chỉ mới uống chưa tới nửa.”',
        showcaseTitle: 'Hóa đơn quán cà phê góc ga',
        x: 842,
        y: 364,
        hitW: 72,
        hitH: 92,
        rotateDeg: 9,
        tintColor: '#F5EFE6',
        artKind: 'cafe_receipt',
      },
      {
        id: 'ms-brass-key',
        name: 'Chìa khóa đồng gắn thẻ số 3',
        shortTag: 'Căn phòng trọ cũ',
        emotionalClue: 'Nằm im trong ngăn vải tối, lưỡi đồng đã sậm màu theo năm tháng.',
        storyNote:
          '“Ổ khóa tầng ba khu tập thể cũ đã thay từ lâu, nhưng anh chưa từng nỡ vứt chiếc chìa.”',
        showcaseTitle: 'Chìa khóa đồng số 3',
        x: 206,
        y: 416,
        hitW: 84,
        hitH: 52,
        rotateDeg: -14,
        hiddenUnderCoverId: 'cover-flap',
        tintColor: '#D4A34C',
        artKind: 'brass_key',
      },
      {
        id: 'ms-wool-scarf',
        name: 'Cúc áo gỗ dự phòng',
        shortTag: 'Mũi chỉ vụng về',
        emotionalClue: 'Gài tạm trên đường may chiếc áo dạ, khâu bằng sợi chỉ khác màu.',
        storyNote:
          '“Lần đầu cô ấy tập đơm cúc cho anh ngay trên ghế đá sân ga trước khi trời đổ mưa.”',
        showcaseTitle: 'Cúc gỗ buộc sợi chỉ đỏ',
        x: 472,
        y: 428,
        hitW: 62,
        hitH: 62,
        rotateDeg: 0,
        hiddenUnderCoverId: 'cover-scarf-fold',
        tintColor: '#B45309',
        artKind: 'spare_button',
      },
      {
        id: 'ms-folded-notebook',
        name: 'Cuốn sổ tay gấp mép',
        shortTag: 'Trang viết bỏ lửng',
        emotionalClue: 'Bìa da sờn góc kẹp một tờ giấy đánh dấu bằng vé xe buýt.',
        storyNote:
          '“Trang cuối chỉ viết đúng một dòng: Nếu chuyến sau quay lại, mình sẽ nói khác đi.”',
        showcaseTitle: 'Sổ tay bìa da sờn',
        x: 682,
        y: 446,
        hitW: 96,
        hitH: 82,
        rotateDeg: -5,
        tintColor: '#92400E',
        artKind: 'folded_notebook',
      },
      {
        id: 'ms-ginger-tin',
        name: 'Hộp kẹo gừng thiếc nhỏ',
        shortTag: 'Giữ ấm cổ họng',
        emotionalClue: 'Hộp tròn màu xanh rêu nắp hơi trầy, mùi cay nhẹ vẫn còn thoang thoảng.',
        storyNote:
          '“Mùa đông nào cũng nhét sẵn trong túi áo khoác phòng người đi cùng bị say tàu.”',
        showcaseTitle: 'Hộp thiếc kẹo gừng',
        x: 342,
        y: 274,
        hitW: 68,
        hitH: 68,
        rotateDeg: 0,
        tintColor: '#4D7C6F',
        artKind: 'ginger_tin',
      },
      {
        id: 'ms-postmark-stamp',
        name: 'Bưu ảnh có dấu bưu điện 19/11',
        shortTag: 'Chưa từng gửi đi',
        emotionalClue: 'Tem thư đã dán ngay ngắn ở góc phải, nhưng ô người nhận vẫn để trắng.',
        storyNote:
          '“Đôi khi viết xong hết những điều muốn nói đã là đủ, không nhất thiết phải bỏ vào thùng thư.”',
        showcaseTitle: 'Bưu ảnh tem hoa cúc',
        x: 556,
        y: 152,
        hitW: 84,
        hitH: 60,
        rotateDeg: 7,
        tintColor: '#FDE68A',
        artKind: 'postmark_stamp',
      },
      {
        id: 'ms-pocket-watch',
        name: 'Đồng hồ bỏ túi đứng kim',
        shortTag: 'Khoảnh khắc dừng lại',
        emotionalClue: 'Mặt kính xước mảnh, hai kim đồng hồ dừng mãi ở 23:45.',
        storyNote:
          '“Tiếng còi tàu cuối cùng hú dài đêm hôm ấy cũng là lúc chiếc đồng hồ ngừng chạy.”',
        showcaseTitle: 'Đồng hồ bỏ túi 23:45',
        x: 884,
        y: 178,
        hitW: 70,
        hitH: 76,
        rotateDeg: -6,
        tintColor: '#FBBF24',
        artKind: 'pocket_watch',
      },
    ],
    endings: {
      healing: {
        branch: 'healing',
        title: 'Đèn Ga Đã Sáng Sớm',
        buttonLabel: 'Nhánh Chữa Lành · Gấp vali lại cho nhẹ lòng',
        epilogue:
          'Sáng hôm sau trời tạnh mưa, Minh Khôi quay lại tiệm. Anh xin giữ lại tấm vé cũ và gửi tặng chủ tiệm chiếc đèn bão nhỏ từng soi sáng sân ga đêm ấy: “Cảm ơn tiệm đã giữ hộ phần ký ức nặng nhất, giờ tôi đi chuyến mới nhẹ nhõm hơn rồi.”',
        teaDecorName: 'Đèn Bão Ga Đêm',
        teaDecorNote: 'Ánh lửa vàng ấm đặt cạnh góc bàn trà, nhắc rằng mọi chuyến đi muộn đều có chỗ nghỉ chân.',
      },
      secret: {
        branch: 'secret',
        title: 'Nửa Tấm Ảnh Còn Lại',
        buttonLabel: 'Nhánh Bí Mật · Ghép lại mảnh ký ức bỏ quên',
        epilogue:
          'Trong lớp lót dưới nắp túi phụ còn giấu mảnh ghi chú nhỏ của cô gái năm xưa: “Em đã ra ga sớm hơn 15 phút, nhưng thấy anh đứng dưới mưa vội vã quá nên chỉ dám để lại chiếc kẹp tóc.” Một sự lỡ nhịp kéo dài suốt ba mùa mưa.',
        teaDecorName: 'Kẹp Tóc Đồi Mồi & Vé Tàu',
        teaDecorNote: 'Đặt lặng lẽ trong khay gốm để nhớ những câu chữ chưa từng kịp thốt ra.',
      },
    },
  },
  {
    id: 'moving-vanity',
    order: 2,
    title: 'Bàn trang điểm trước ngày chuyển nhà',
    subtitle: 'Căn hộ tầng 4 · Thùng carton đã dán băng keo',
    guestName: 'Khách gửi: Thảo Vy (để lại ngăn kéo gỗ)',
    arrivalTime: '22:40 · Hương hoa nhài thoảng qua',
    theme: 'vintage_vanity',
    openingWhisper:
      '“Cô gái ôm chiếc ngăn kéo gỗ sơn trắng bước vào khi tiệm sắp kéo cửa: Chị giữ hộ em ít đồ nhỏ, ngày mai xe dọn nhà tới rồi mà em vẫn chưa biết nên mang theo hay để lại.”',
    teaRewardIcon: 'lavender_vase',
    covers: [
      {
        id: 'cover-velvet-box',
        label: 'Hộp nhung trang sức nắp bật',
        actionHint: 'Bật mở nắp hộp nhung đỏ',
        kind: 'lid',
        x: 152,
        y: 162,
        w: 185,
        h: 145,
        openOffsetX: -36,
        openOffsetY: -96,
        openRotateDeg: -10,
        accentColor: '#9F1239',
      },
      {
        id: 'cover-wood-drawer',
        label: 'Ngăn kéo gỗ nhỏ bên phải',
        actionHint: 'Kéo nhẹ ngăn tủ gỗ ra',
        kind: 'drawer',
        x: 690,
        y: 356,
        w: 225,
        h: 155,
        openOffsetX: 112,
        openOffsetY: 36,
        openRotateDeg: 4,
        accentColor: '#A16207',
      },
      {
        id: 'cover-lace-cloth',
        label: 'Khăn ren thêu phủ góc bàn',
        actionHint: 'Vén dải khăn ren trắng',
        kind: 'curtain',
        x: 382,
        y: 342,
        w: 230,
        h: 165,
        openOffsetX: -95,
        openOffsetY: 64,
        openRotateDeg: -14,
        accentColor: '#F3ECE1',
      },
    ],
    items: [
      {
        id: 'mv-lipstick',
        name: 'Thỏi son sắp hết',
        shortTag: 'Sắc đỏ trầm cũ',
        emotionalClue: 'Chỉ còn vẹt một mẩu nhỏ cuối thân vỏ đồng, từng theo cô qua mọi buổi hẹn quan trọng.',
        storyNote:
          '“Thỏi son đầu tiên tự thưởng khi nhận tháng lương đầu năm 22 tuổi.”',
        showcaseTitle: 'Thỏi son vỏ đồng khắc hoa',
        x: 398,
        y: 232,
        hitW: 48,
        hitH: 76,
        rotateDeg: 18,
        tintColor: '#E11D48',
        artKind: 'lipstick',
      },
      {
        id: 'mv-silver-ring',
        name: 'Chiếc nhẫn bạc mảnh',
        shortTag: 'Lời hứa năm cũ',
        emotionalClue: 'Nằm yên trên lớp nỉ đỏ bên trong chiếc hộp nhỏ đã đóng nắp.',
        storyNote:
          '“Mặt trong khắc hai chữ cái mờ đi theo nước mưa. Không còn vừa ngón tay nữa nhưng vẫn sáng.”',
        showcaseTitle: 'Nhẫn bạc khắc nét mảnh',
        x: 242,
        y: 232,
        hitW: 58,
        hitH: 58,
        rotateDeg: 0,
        hiddenUnderCoverId: 'cover-velvet-box',
        tintColor: '#E2E8F0',
        artKind: 'silver_ring',
      },
      {
        id: 'mv-perfume',
        name: 'Lọ nước hoa vơi nửa',
        shortTag: 'Mùi hương căn hộ cũ',
        emotionalClue: 'Chai thủy tinh cắt giác lấp lánh, chất lỏng màu hổ phách còn đúng một nửa.',
        storyNote:
          '“Chỉ cần xịt một chút là nhớ ngay tiếng mưa gõ lên mái tôn ban công tầng bốn.”',
        showcaseTitle: 'Lọ nước hoa thủy tinh',
        x: 562,
        y: 196,
        hitW: 72,
        hitH: 92,
        rotateDeg: 0,
        tintColor: '#FCD34D',
        artKind: 'perfume_bottle',
      },
      {
        id: 'mv-wifi-note',
        name: 'Mảnh giấy ghi mật khẩu wifi cũ',
        shortTag: 'Chuỗi số kỷ niệm',
        emotionalClue: 'Tờ note kẻ ô vuông nằm lọt dưới lớp vải ren trắng phủ mặt bàn.',
        storyNote:
          '“Tên mạng là Phong402, mật khẩu là ngày cả hai chuyển vào ở ghép mùa hạ năm ấy.”',
        showcaseTitle: 'Giấy ghi mật khẩu Wifi',
        x: 492,
        y: 422,
        hitW: 86,
        hitH: 68,
        rotateDeg: -9,
        hiddenUnderCoverId: 'cover-lace-cloth',
        tintColor: '#FEF3C7',
        artKind: 'wifi_note',
      },
      {
        id: 'mv-blank-card',
        name: 'Tấm thiệp chưa đề tên',
        shortTag: 'Lời cảm ơn lỡ nhịp',
        emotionalClue: 'Phong bì kem viền vàng nằm sâu bên trong ngăn tủ gỗ kéo ra.',
        storyNote:
          '“Bên trong viết đầy một mặt chữ cảm ơn người bạn cùng phòng đã thức nấu cháo mỗi lần ốm.”',
        showcaseTitle: 'Tấm thiệp viền vàng',
        x: 785,
        y: 428,
        hitW: 92,
        hitH: 66,
        rotateDeg: 7,
        hiddenUnderCoverId: 'cover-wood-drawer',
        tintColor: '#FDE68A',
        artKind: 'blank_card',
      },
      {
        id: 'mv-wood-comb',
        name: 'Lược gỗ gãy một răng',
        shortTag: 'Buổi sáng vội vã',
        emotionalClue: 'Vân gỗ đào mịn màng nằm dọc mép bàn, thiếu mất chiếc răng ngoài cùng.',
        storyNote:
          '“Làm rơi lúc chạy vội ra phỏng vấn sáng thứ Hai, vậy mà dùng suốt bốn năm trời.”',
        showcaseTitle: 'Lược gỗ đào cũ',
        x: 245,
        y: 444,
        hitW: 108,
        hitH: 52,
        rotateDeg: -12,
        tintColor: '#B45309',
        artKind: 'wood_comb',
      },
      {
        id: 'mv-music-box',
        name: 'Hộp nhạc dây cót mini',
        shortTag: 'Giai điệu quen thuộc',
        emotionalClue: 'Chiếc hộp gỗ nhỏ có khóa vặn bằng đồng, phát ra tiếng ngân khẽ khi chạm vào.',
        storyNote:
          '“Mỗi tối mất điện đều vặn dây cót nghe hai lượt cho đỡ sợ bóng tối.”',
        showcaseTitle: 'Hộp nhạc dây cót đồng',
        x: 742,
        y: 186,
        hitW: 86,
        hitH: 76,
        rotateDeg: 0,
        tintColor: '#D97706',
        artKind: 'music_box',
      },
      {
        id: 'mv-pearl-earring',
        name: 'Chiếc khuyên tai ngọc trai lệch',
        shortTag: 'Đôi khuyên thiếu chiếc',
        emotionalClue: 'Một hạt ngọc tròn nhỏ ánh kem lạc lối gần chân gương.',
        storyNote:
          '“Chiếc còn lại rơi đâu đó trong buổi tiệc chia tay năm cuối, giữ chiếc này để nhớ về đêm vui ấy.”',
        showcaseTitle: 'Khuyên tai ngọc trai đơn',
        x: 472,
        y: 266,
        hitW: 48,
        hitH: 48,
        rotateDeg: 14,
        tintColor: '#F8FAFC',
        artKind: 'pearl_earring',
      },
      {
        id: 'mv-mirror-sticky',
        name: 'Tờ giấy nhắc dán góc gương',
        shortTag: 'Lời dặn tự thương mình',
        emotionalClue: 'Miếng giấy vàng nhỏ có nét chữ nắn nót: “Nhớ uống nước ấm trước khi ngủ”.',
        storyNote:
          '“Viết trong những ngày áp lực nhất, để mỗi sáng soi gương đều thấy có người nhắc nhở.”',
        showcaseTitle: 'Giấy note góc gương',
        x: 508,
        y: 108,
        hitW: 76,
        hitH: 70,
        rotateDeg: -5,
        tintColor: '#FDE047',
        artKind: 'mirror_sticky',
      },
      {
        id: 'mv-parking-stub',
        name: 'Vé gửi xe khu chợ cũ',
        shortTag: 'Chủ nhật đi chợ hoa',
        emotionalClue: 'Tờ phiếu hồng nhạt in số thứ tự từ hai tháng trước.',
        storyNote:
          '“Chủ nhật cuối cùng ở xóm cũ, hai đứa đèo nhau mua bó hoa cúc họa mi 40 ngàn.”',
        showcaseTitle: 'Phiếu gửi xe màu hồng',
        x: 882,
        y: 248,
        hitW: 64,
        hitH: 76,
        rotateDeg: 11,
        tintColor: '#F9A8D4',
        artKind: 'parking_stub',
      },
      {
        id: 'mv-spare-button',
        name: 'Hạt cúc ngọc từ chiếc váy trắng',
        shortTag: 'Ngày nhận bằng tốt nghiệp',
        emotionalClue: 'Một viên cúc ánh xà cừ nằm gọn trong đĩa sứ nhỏ góc trái bàn.',
        storyNote:
          '“Bung ra đúng lúc tung mũ cử nhân trên sân trường, nhặt cất vào đĩa sứ tới tận hôm nay.”',
        showcaseTitle: 'Cúc xà cừ trong đĩa sứ',
        x: 132,
        y: 382,
        hitW: 58,
        hitH: 58,
        rotateDeg: 0,
        tintColor: '#E0F2FE',
        artKind: 'spare_button',
      },
    ],
    endings: {
      healing: {
        branch: 'healing',
        title: 'Chìa Khóa Trao Tay Người Mới',
        buttonLabel: 'Nhánh Chữa Lành · Gói lại thanh xuân để sang trang',
        epilogue:
          'Thảo Vy chọn mang theo thỏi son cũ và chiếc nhẫn bạc, còn lại gửi vào góc trưng bày của tiệm như một lời tạm biệt dịu dàng với căn phòng tầng 4. Cô đặt lại bình hoa oải hương khô trên quầy gỗ trước khi bước lên xe chuyển nhà.',
        teaDecorName: 'Bình Hoa Khô Lavender',
        teaDecorNote: 'Mùi hương nhẹ nhàng nhắc rằng rời đi không phải mất mát, mà là mang theo những điều đẹp nhất.',
      },
      secret: {
        branch: 'secret',
        title: 'Bức Thư Dưới Đáy Ngăn Kéo',
        buttonLabel: 'Nhánh Bí Mật · Đọc lời thú nhận chưa kịp trao',
        epilogue:
          'Dưới lớp giấy lót ngăn kéo, tấm thiệp chưa đề tên thực ra được viết cho chính người bạn ở tầng dưới đã lặng lẽ sửa giùm ổ khóa suốt ba năm. Tới ngày dọn đi, cả hai vẫn chỉ cười chào nhau ngoài hành lang.',
        teaDecorName: 'Hộp Nhạc Dây Cót Cổ',
        teaDecorNote: 'Mỗi lần lên dây cót là một bản nhạc ngắn về những rung động giữ riêng cho mình.',
      },
    },
  },
  {
    id: 'exam-study-desk',
    order: 3,
    title: 'Góc học tập mùa thi cuối',
    subtitle: '2 giờ sáng · Đèn bàn vàng ấm & chồng đề cương',
    guestName: 'Khách gửi: Hoàng Nam (sinh viên năm cuối)',
    arrivalTime: '23:55 · Sau buổi bảo vệ đồ án',
    theme: 'exam_desk',
    openingWhisper:
      '“Cậu sinh viên ôm thùng đồ học suốt bốn năm đại học tới gửi tạm trước khi về quê ăn Tết: Em chẳng nỡ bán đồng nát đống này, toàn mồ hôi và những đêm thức trắng cùng bạn bè.”',
    teaRewardIcon: 'ceramic_mug',
    covers: [
      {
        id: 'cover-textbook',
        label: 'Cuốn giáo trình dày bìa xanh',
        actionHint: 'Lật bìa cuốn giáo trình dày',
        kind: 'book',
        x: 120,
        y: 170,
        w: 215,
        h: 175,
        openOffsetX: -86,
        openOffsetY: -65,
        openRotateDeg: -18,
        accentColor: '#1E3A5F',
      },
      {
        id: 'cover-pencil-tin',
        label: 'Hộp bút thiếc đóng nắp',
        actionHint: 'Bật nắp hộp bút bằng thiếc',
        kind: 'lid',
        x: 398,
        y: 376,
        w: 225,
        h: 120,
        openOffsetX: 38,
        openOffsetY: -86,
        openRotateDeg: 11,
        accentColor: '#475569',
      },
      {
        id: 'cover-exam-stack',
        label: 'Xấp đề cương in giấy A4',
        actionHint: 'Gạt chồng đề cương sang bên',
        kind: 'papers',
        x: 682,
        y: 192,
        w: 230,
        h: 170,
        openOffsetX: -18,
        openOffsetY: -124,
        openRotateDeg: -8,
        accentColor: '#E2E8F0',
      },
    ],
    items: [
      {
        id: 'ed-highlighter',
        name: 'Bút highlight hết mực',
        shortTag: 'Cây bút vàng cạn khô',
        emotionalClue: 'Thân bút màu chanh từng gạch dưới hàng trăm trang định nghĩa khó nhằn.',
        storyNote:
          '“Hết mực ngay đêm trước buổi thi vấn đáp cuối cùng, phải mượn vội bút chì gạch tạm.”',
        showcaseTitle: 'Bút dạ quang vàng chanh',
        x: 344,
        y: 266,
        hitW: 96,
        hitH: 46,
        rotateDeg: -24,
        tintColor: '#FACC15',
        artKind: 'highlighter',
      },
      {
        id: 'ed-thermos',
        name: 'Cốc giữ nhiệt móp nhẹ',
        shortTag: 'Vết móp sân ký túc',
        emotionalClue: 'Bình inox màu xanh rêu có vết lõm nhỏ ở đáy, luôn chứa đầy cà phê đen đá.',
        storyNote:
          '“Rơi từ giỏ xe đạp lúc chạy đua cho kịp giờ điểm danh tiết 1 trời mưa.”',
        showcaseTitle: 'Cốc giữ nhiệt xanh rêu',
        x: 842,
        y: 416,
        hitW: 78,
        hitH: 108,
        rotateDeg: 0,
        tintColor: '#0F766E',
        artKind: 'dented_thermos',
      },
      {
        id: 'ed-earbuds',
        name: 'Tai nghe dây đứt một bên',
        shortTag: 'Một bên còn tiếng lo-fi',
        emotionalClue: 'Sợi dây trắng quấn lộn xộn gần góc bàn, một củ loa đã im bặt.',
        storyNote:
          '“Bên trái tịt hẳn từ kỳ hai năm ba, vậy mà vẫn đeo một bên nghe nhạc để tập trung học bài.”',
        showcaseTitle: 'Tai nghe có dây cũ',
        x: 215,
        y: 446,
        hitW: 94,
        hitH: 74,
        rotateDeg: 8,
        tintColor: '#F8FAFC',
        artKind: 'broken_earbuds',
      },
      {
        id: 'ed-cram-notebook',
        name: 'Cuốn sổ tay chằng chịt note',
        shortTag: 'Công thức kín hai mặt',
        emotionalClue: 'Sổ lò xo chi chít giấy ghi chú vàng xanh nhô ra khỏi mép trang.',
        storyNote:
          '“Trang giữa còn vẽ hình hai đứa bạn ngủ gục trên bàn thư viện lúc 11 giờ trưa.”',
        showcaseTitle: 'Sổ tay lò xo nhiều note',
        x: 548,
        y: 196,
        hitW: 108,
        hitH: 94,
        rotateDeg: -6,
        tintColor: '#FDE68A',
        artKind: 'cram_notebook',
      },
      {
        id: 'ed-movie-ticket',
        name: 'Vé xem phim chưa xé cuống',
        shortTag: 'Buổi hẹn lỡ vì deadline',
        emotionalClue: 'Kẹp cẩn thận giữa các trang sách giáo trình dày màu xanh.',
        storyNote:
          '“Mua sẵn hai vé suất 20:30 để tự thưởng sau khi nộp đồ án, cuối cùng cả nhóm phải fix bug tới 1 giờ sáng.”',
        showcaseTitle: 'Cuống vé rạp chiếu phim',
        x: 228,
        y: 256,
        hitW: 88,
        hitH: 56,
        rotateDeg: 9,
        hiddenUnderCoverId: 'cover-textbook',
        tintColor: '#FB7185',
        artKind: 'unripped_ticket',
      },
      {
        id: 'ed-library-card',
        name: 'Thẻ thư viện sắp hết hạn',
        shortTag: 'Góc bàn tầng 3 quen thuộc',
        emotionalClue: 'Tấm thẻ nhựa ép dẻo in mã vạch mờ nằm dưới chồng đề cương A4.',
        storyNote:
          '“Bốn năm quẹt thẻ hơn ba trăm lượt, bác thủ thư nhìn mặt là nhớ luôn số ghế hay ngồi.”',
        showcaseTitle: 'Thẻ thư viện sinh viên',
        x: 794,
        y: 268,
        hitW: 90,
        hitH: 60,
        rotateDeg: -8,
        hiddenUnderCoverId: 'cover-exam-stack',
        tintColor: '#38BDF8',
        artKind: 'library_card',
      },
      {
        id: 'ed-ginger-tea',
        name: 'Gói trà gừng hòa tan',
        shortTag: 'Hơi ấm 1 giờ sáng',
        emotionalClue: 'Gói giấy nhỏ màu cam ấm góc dưới bàn, dành cho những đêm ôn thi gió mùa về.',
        storyNote:
          '“Bạn cùng phòng nhét sang bàn lúc thấy ho khù khụ giữa mùa thi cuối kỳ.”',
        showcaseTitle: 'Gói trà gừng ấm áp',
        x: 682,
        y: 446,
        hitW: 78,
        hitH: 68,
        rotateDeg: 11,
        tintColor: '#F97316',
        artKind: 'ginger_tea',
      },
      {
        id: 'ed-worn-eraser',
        name: 'Cục tẩy mòn vẹt bốn góc',
        shortTag: 'Vết chì vẽ sơ đồ',
        emotionalClue: 'Miếng gôm nhỏ bọc giấy xanh nằm gọn bên trong hộp bút thiếc.',
        storyNote:
          '“Trên lớp bọc giấy còn ghi kín công thức đạo hàm bằng chữ siêu nhỏ.”',
        showcaseTitle: 'Cục tẩy học sinh cũ',
        x: 504,
        y: 432,
        hitW: 62,
        hitH: 48,
        rotateDeg: -10,
        hiddenUnderCoverId: 'cover-pencil-tin',
        tintColor: '#60A5FA',
        artKind: 'worn_eraser',
      },
      {
        id: 'ed-cracked-ruler',
        name: 'Thước kẻ nhựa nứt nhẹ',
        shortTag: 'Vạch chia đã mờ',
        emotionalClue: 'Thanh thước trong suốt dài mảnh có một vết rạn nhỏ ở vạch 12cm.',
        storyNote:
          '“Kẻ hàng nghìn dòng bảng biểu cho tới khi vết nứt thành dấu nhận diện riêng.”',
        showcaseTitle: 'Thước kẻ nhựa trong',
        x: 424,
        y: 122,
        hitW: 132,
        hitH: 42,
        rotateDeg: 4,
        tintColor: '#BAE6FD',
        artKind: 'cracked_ruler',
      },
      {
        id: 'ed-pressed-daisy',
        name: 'Bưu thiếp hoa cúc ép khô',
        shortTag: 'Lời chúc ngày tốt nghiệp',
        emotionalClue: 'Bông hoa nhỏ cánh trắng ép phẳng trên tờ giấy kraft buộc sợi gai.',
        storyNote:
          '“Cả nhóm bạn cấp ba gửi từ quê lên trước ngày bảo vệ tốt nghiệp một tuần.”',
        showcaseTitle: 'Hoa cúc ép khô trên giấy kraft',
        x: 896,
        y: 152,
        hitW: 76,
        hitH: 88,
        rotateDeg: -7,
        tintColor: '#FEF08A',
        artKind: 'pressed_daisy',
      },
      {
        id: 'ed-dorm-key',
        name: 'Chìa khóa tủ ký túc xá',
        shortTag: 'Móc khóa vịt nhựa cũ',
        emotionalClue: 'Chiếc chìa nhỏ xíu gắn móc nhựa màu vàng sờn sơn.',
        storyNote:
          '“Sáng mai trả phòng rồi mà vẫn quen tay sờ túi quần kiểm tra xem có quên chìa không.”',
        showcaseTitle: 'Chìa khóa tủ phòng 308',
        x: 112,
        y: 386,
        hitW: 74,
        hitH: 56,
        rotateDeg: 19,
        tintColor: '#FBBF24',
        artKind: 'dorm_key',
      },
      {
        id: 'ed-id-photo',
        name: 'Tấm ảnh thẻ năm nhất',
        shortTag: 'Ánh mắt hồi mới nhập học',
        emotionalClue: 'Ảnh 3x4 nền xanh, cậu bạn áo sơ mi trắng trông còn rụt rè lạ lẫm.',
        storyNote:
          '“Bốn năm trôi nhanh tới mức nhìn lại tấm ảnh này mới thấy mình đã đi xa đến thế.”',
        showcaseTitle: 'Ảnh thẻ năm nhất 3x4',
        x: 348,
        y: 472,
        hitW: 54,
        hitH: 66,
        rotateDeg: -11,
        tintColor: '#93C5FD',
        artKind: 'id_photo',
      },
    ],
    endings: {
      healing: {
        branch: 'healing',
        title: 'Chúc Mừng Tốt Nghiệp!',
        buttonLabel: 'Nhánh Chữa Lành · Giữ lại chiếc cốc móp bước vào đời',
        epilogue:
          'Hoàng Nam quyết định cầm theo chiếc cốc giữ nhiệt móp và tấm ảnh thẻ năm nhất cho ngày đi làm đầu tiên. Cậu gửi lại chiếc tách gốm ấm và bó hoa cúc ép khô trên bàn trà của tiệm để động viên những người khách thức khuya kế tiếp.',
        teaDecorName: 'Tách Trà Gốm & Hoa Cúc Ép',
        teaDecorNote: 'Dành cho những đêm dài ôn thi hay chạy deadline: rồi bình minh cũng tới kịp giờ.',
      },
      secret: {
        branch: 'secret',
        title: 'Cuống Vé Chưa Xé Ở Giữa Trang Sách',
        buttonLabel: 'Nhánh Bí Mật · Hẹn bù một buổi chiếu muộn',
        epilogue:
          'Khi mở cuốn giáo trình trả lại, Hoàng Nam bật cười khi thấy tấm vé xem phim vẫn còn nguyên cuống, kèm dòng chữ bạn cùng nhóm viết trộm sau vé: “Xong bảo vệ nhớ bao tụi tao chầu phim này nha!”. Một lời hẹn muộn nhưng còn kịp thực hiện.',
        teaDecorName: 'Vé Xem Phim & Đèn Học Vàng',
        teaDecorNote: 'Nhắc rằng thành tích quan trọng, nhưng những người bạn đi cùng còn quý hơn nhiều.',
      },
    },
  },
];

export function createInitialProgressForLevel(): AntiqueLevelProgress {
  return {
    foundItemIds: [],
    openedCoverIds: [],
    hintsUsed: 0,
    misclicks: 0,
    chosenEnding: null,
    bestStars: 0,
    bestScore: 0,
  };
}

export function createInitialShopSave(): AntiqueShopSaveData {
  const levels: Record<string, AntiqueLevelProgress> = {};
  for (const lvl of ANTIQUE_LEVELS) {
    levels[lvl.id] = createInitialProgressForLevel();
  }
  return {
    version: 1,
    activeLevelId: ANTIQUE_LEVELS[0].id,
    levels,
    teaShelfOrder: [],
  };
}

export function parseShopSave(raw: string | null): AntiqueShopSaveData {
  const fallback = createInitialShopSave();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<AntiqueShopSaveData>;
    if (!parsed || typeof parsed !== 'object') return fallback;

    const mergedLevels: Record<string, AntiqueLevelProgress> = {};
    for (const lvl of ANTIQUE_LEVELS) {
      const validItemIds = new Set(lvl.items.map((i) => i.id));
      const validCoverIds = new Set(lvl.covers.map((c) => c.id));
      const candidate = parsed.levels?.[lvl.id];
      if (!candidate || typeof candidate !== 'object') {
        mergedLevels[lvl.id] = createInitialProgressForLevel();
        continue;
      }
      const foundItemIds = Array.isArray(candidate.foundItemIds)
        ? Array.from(new Set(candidate.foundItemIds.filter((id): id is string => typeof id === 'string' && validItemIds.has(id))))
        : [];
      const openedCoverIds = Array.isArray(candidate.openedCoverIds)
        ? Array.from(new Set(candidate.openedCoverIds.filter((id): id is string => typeof id === 'string' && validCoverIds.has(id))))
        : [];
      const chosenEnding =
        candidate.chosenEnding === 'healing' || candidate.chosenEnding === 'secret'
          ? candidate.chosenEnding
          : null;
      mergedLevels[lvl.id] = {
        foundItemIds,
        openedCoverIds,
        hintsUsed: typeof candidate.hintsUsed === 'number' && candidate.hintsUsed >= 0 ? Math.floor(candidate.hintsUsed) : 0,
        misclicks: typeof candidate.misclicks === 'number' && candidate.misclicks >= 0 ? Math.floor(candidate.misclicks) : 0,
        chosenEnding,
        bestStars:
          typeof candidate.bestStars === 'number'
            ? Math.max(0, Math.min(3, Math.floor(candidate.bestStars)))
            : 0,
        bestScore: typeof candidate.bestScore === 'number' && candidate.bestScore >= 0 ? Math.floor(candidate.bestScore) : 0,
      };
    }

    const activeLevelId =
      typeof parsed.activeLevelId === 'string' &&
      ANTIQUE_LEVELS.some((l) => l.id === parsed.activeLevelId)
        ? parsed.activeLevelId
        : ANTIQUE_LEVELS[0].id;

    const teaShelfOrder = Array.isArray(parsed.teaShelfOrder)
      ? parsed.teaShelfOrder.filter((id): id is string => typeof id === 'string')
      : [];

    return {
      version: 1,
      activeLevelId,
      levels: mergedLevels,
      teaShelfOrder,
    };
  } catch {
    return fallback;
  }
}

export function isItemAccessible(item: AntiqueItemDef, openedCoverIds: readonly string[]): boolean {
  if (!item.hiddenUnderCoverId) return true;
  return openedCoverIds.includes(item.hiddenUnderCoverId);
}

export function getActiveClueItems(
  level: AntiqueLevelDef,
  foundItemIds: readonly string[],
  limit = ACTIVE_CLUES_COUNT
): AntiqueItemDef[] {
  const foundSet = new Set(foundItemIds);
  return level.items.filter((item) => !foundSet.has(item.id)).slice(0, limit);
}

export function computeLevelRating(
  totalItems: number,
  foundCount: number,
  hintsUsed: number,
  misclicks: number
): { stars: number; score: number; rankLabel: string } {
  if (foundCount < totalItems) {
    return {
      stars: 0,
      score: Math.max(0, foundCount * 80 - hintsUsed * 40),
      rankLabel: 'Đang giải mã',
    };
  }
  const baseScore = 1000;
  const hintPenalty = hintsUsed * 120;
  const misclickPenalty = Math.max(0, misclicks - 2) * 25;
  const score = Math.max(350, baseScore - hintPenalty - misclickPenalty);

  if (hintsUsed === 0 && misclicks <= 3) {
    return { stars: 3, score, rankLabel: 'Ký Ức Nguyên Vẹn' };
  }
  if (hintsUsed <= 2 && score >= 680) {
    return { stars: 2, score, rankLabel: 'Người Giữ Kỷ Vật' };
  }
  return { stars: 1, score, rankLabel: 'Đêm Tiệm Yên Bình' };
}

export function pickSmartHint(
  level: AntiqueLevelDef,
  foundItemIds: readonly string[],
  openedCoverIds: readonly string[],
  preferredItemId?: string | null
): HintTargetResult | null {
  const remaining = level.items.filter((item) => !foundItemIds.includes(item.id));
  if (remaining.length === 0) return null;

  const target =
    (preferredItemId ? remaining.find((i) => i.id === preferredItemId) : undefined) ??
    remaining.find((i) => isItemAccessible(i, openedCoverIds)) ??
    remaining[0];

  const cover = target.hiddenUnderCoverId
    ? level.covers.find((c) => c.id === target.hiddenUnderCoverId) ?? null
    : null;
  const needsCoverOpened = Boolean(cover && !openedCoverIds.includes(cover.id));

  const zoneX = needsCoverOpened && cover ? cover.x + cover.w / 2 : target.x;
  const zoneY = needsCoverOpened && cover ? cover.y + cover.h / 2 : target.y;

  const hintText = needsCoverOpened && cover
    ? `Hãy thử chạm để mở "${cover.label}" — bên dưới vẫn còn giấu kỷ vật "${target.name}".`
    : `Ánh đèn lồng đang soi nhẹ vùng quanh "${target.name}". Thử phóng to vào vùng sáng ấm nhé.`;

  return {
    item: target,
    needsCoverOpened,
    coverLabel: cover?.label ?? null,
    zoneX,
    zoneY,
    hintText,
  };
}

export function clampPanAndZoom(
  nextScale: number,
  nextPanX: number,
  nextPanY: number,
  viewportW: number,
  viewportH: number
): PanZoomState {
  const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(nextScale.toFixed(3))));
  if (scale <= 1.001 || viewportW <= 0 || viewportH <= 0) {
    return { scale: 1, panX: 0, panY: 0 };
  }
  const maxPanX = (viewportW * (scale - 1)) / 2;
  const maxPanY = (viewportH * (scale - 1)) / 2;
  return {
    scale,
    panX: Math.max(-maxPanX, Math.min(maxPanX, nextPanX)),
    panY: Math.max(-maxPanY, Math.min(maxPanY, nextPanY)),
  };
}

export function collectTotalShowcaseStats(save: AntiqueShopSaveData): {
  totalFoundItems: number;
  totalItems: number;
  completedBoxes: number;
  totalBoxes: number;
  totalStars: number;
  maxStars: number;
} {
  let totalFoundItems = 0;
  let totalItems = 0;
  let completedBoxes = 0;
  let totalStars = 0;

  for (const lvl of ANTIQUE_LEVELS) {
    totalItems += lvl.items.length;
    const prog = save.levels[lvl.id];
    if (!prog) continue;
    totalFoundItems += prog.foundItemIds.length;
    if (prog.foundItemIds.length >= lvl.items.length && prog.chosenEnding !== null) {
      completedBoxes += 1;
    }
    totalStars += prog.bestStars;
  }

  return {
    totalFoundItems,
    totalItems,
    completedBoxes,
    totalBoxes: ANTIQUE_LEVELS.length,
    totalStars,
    maxStars: ANTIQUE_LEVELS.length * 3,
  };
}
