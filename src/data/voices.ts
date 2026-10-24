export interface StudioVoice {
  id: string;
  name: string;
  code: string;
  gender: 'male' | 'female';
  region: 'bac' | 'trung' | 'nam';
  regionLabel: string;
  style: 'ke-chuyen' | 'doc-truyen' | 'tin-tuc' | 'tu-nhien';
  styleLabel: string;
  stars: number;
  avatarBg: string;
  tagline: string;
  sampleText: string;
  edgePitch?: string;
  edgeRate?: string;
  isPopular?: boolean;
}

// 1. KHO 11 GIỌNG PRESET CHUẨN CỦA VIENEU V3 NANO (CHÂN THỰC 100%, 24KHZ FLOW-MATCHING)
export const VIENEU_PRESET_VOICES: StudioVoice[] = [
  {
    id: 'vieneu_adam',
    name: 'Adam',
    code: 'AD',
    gender: 'male',
    region: 'nam',
    regionLabel: 'Giọng Nam Bộ',
    style: 'tu-nhien',
    styleLabel: 'Tự nhiên hào sảng',
    stars: 5,
    avatarBg: 'bg-blue-600',
    tagline: 'Giọng nam miền Nam tự nhiên, chân thực, phù hợp nghe truyện dài từ AI VieNeu v3 Nano.',
    sampleText: 'Chào mừng bạn đến với không gian đọc truyện audio cùng hệ thống VieNeu v3 Nano.',
    isPopular: true,
  },
  {
    id: 'vieneu_ai_han',
    name: 'Ái Hân',
    code: 'AH',
    gender: 'female',
    region: 'nam',
    regionLabel: 'Giọng Nữ Nam Bộ',
    style: 'tin-tuc',
    styleLabel: 'Phong cách tin tức',
    stars: 5,
    avatarBg: 'bg-rose-500',
    tagline: 'Giọng nữ miền Nam phong cách tin tức, phát âm rõ ràng, mạch lạc từ AI VieNeu v3 Nano.',
    sampleText: 'Bản tin văn học mạng hôm nay cập nhật những tình tiết gay cấn nhất.',
    isPopular: true,
  },
  {
    id: 'vieneu_my_duyen',
    name: 'Mỹ Duyên',
    code: 'MD',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Nữ Bắc Bộ',
    style: 'doc-truyen',
    styleLabel: 'Phong cách đọc truyện',
    stars: 5,
    avatarBg: 'bg-pink-600',
    tagline: 'Giọng nữ miền Bắc chuyên đọc truyện, âm điệu dịu dàng truyền cảm và lắng đọng từ AI VieNeu v3 Nano.',
    sampleText: 'Đêm nay trăng thanh gió mát, câu chuyện tình duyên xin được phép bắt đầu.',
    isPopular: true,
  },
  {
    id: 'vieneu_duc_tri',
    name: 'Đức Trí',
    code: 'DT',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Bắc Bộ',
    style: 'doc-truyen',
    styleLabel: 'Phong cách đọc truyện',
    stars: 5,
    avatarBg: 'bg-amber-600',
    tagline: 'Giọng nam miền Bắc chuyên đọc truyện, trầm ấm truyền cảm, thích hợp tiên hiệp và kiếm hiệp từ AI VieNeu v3 Nano.',
    sampleText: 'Thiên địa vô tình, vạn vật giai vi sô cẩu, con đường tu tiên đầy gian nan trắc trở.',
    isPopular: true,
  },
  {
    id: 'vieneu_huu_quan',
    name: 'Hữu Quân',
    code: 'HQ',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Bắc Bộ',
    style: 'tin-tuc',
    styleLabel: 'Phong cách tin tức',
    stars: 5,
    avatarBg: 'bg-indigo-600',
    tagline: 'Giọng nam miền Bắc phong cách tin tức, đĩnh đạc và uy nghiêm từ AI VieNeu v3 Nano.',
    sampleText: 'Bản tin đặc biệt thông báo đại điển thu nhận đệ tử chân truyền của các tông môn.',
  },
  {
    id: 'vieneu_xuan_tien',
    name: 'Xuân Tiên',
    code: 'XT',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Nữ Bắc Bộ',
    style: 'tin-tuc',
    styleLabel: 'Phong cách tin tức',
    stars: 5,
    avatarBg: 'bg-purple-600',
    tagline: 'Giọng nữ miền Bắc phong cách tin tức, thanh thoát và tự tin từ AI VieNeu v3 Nano.',
    sampleText: 'Bản tin tổng hợp tình hình kinh tế và đời sống hôm nay.',
  },
  {
    id: 'vieneu_mai_anh',
    name: 'Mai Anh',
    code: 'MA',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Nữ Bắc Bộ',
    style: 'tin-tuc',
    styleLabel: 'Phong cách tin tức',
    stars: 5,
    avatarBg: 'bg-emerald-600',
    tagline: 'Giọng nữ miền Bắc phong cách tin tức, nhẹ nhàng rõ nét từ AI VieNeu v3 Nano.',
    sampleText: 'Chào đón quý thính giả trở lại với chương trình audio hôm nay.',
  },
  {
    id: 'vieneu_truc_ly',
    name: 'Trúc Ly',
    code: 'TL',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Nữ Bắc Bộ',
    style: 'tu-nhien',
    styleLabel: 'Tự nhiên nhẹ nhàng',
    stars: 5,
    avatarBg: 'bg-teal-600',
    tagline: 'Giọng nữ miền Bắc tự nhiên thanh tao, thích hợp ngôn tình và đô thị từ AI VieNeu v3 Nano.',
    sampleText: 'Cơn mưa rào đầu hạ tưới mát những kỷ niệm ngọt ngào thời thanh xuân.',
    isPopular: true,
  },
  {
    id: 'vieneu_anh_khoi',
    name: 'Anh Khôi',
    code: 'AK',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Bắc Bộ',
    style: 'ke-chuyen',
    styleLabel: 'Phong cách kể chuyện',
    stars: 5,
    avatarBg: 'bg-slate-700',
    tagline: 'Giọng nam miền Bắc chuyên kể chuyện, lôi cuốn ma mị, giàu kịch tính từ AI VieNeu v3 Nano.',
    sampleText: 'Lúc nửa đêm, tiếng bước chân dồn dập vang lên nơi hành lang vắng lặng.',
    isPopular: true,
  },
  {
    id: 'vieneu_minh_quan',
    name: 'Minh Quân',
    code: 'MQ',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Bắc Bộ',
    style: 'tu-nhien',
    styleLabel: 'Tự nhiên trầm ấm',
    stars: 5,
    avatarBg: 'bg-sky-600',
    tagline: 'Giọng nam miền Bắc tự nhiên, ấm áp, thân thiện và gần gũi từ AI VieNeu v3 Nano.',
    sampleText: 'Hành trình phiêu lưu kỳ thú của chúng ta hôm nay sẽ bước sang một trang mới.',
    isPopular: true,
  },
  {
    id: 'vieneu_manh_dung',
    name: 'Mạnh Dũng',
    code: 'MD',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Bắc Bộ',
    style: 'tu-nhien',
    styleLabel: 'Nội lực dũng mãnh',
    stars: 5,
    avatarBg: 'bg-red-700',
    tagline: 'Giọng nam miền Bắc dũng mãnh, đầy nội lực hào sảng, đỉnh cao truyện hành động, mạt thế từ AI VieNeu v3 Nano.',
    sampleText: 'Tiếng gầm thét vang dội xé toạc màn đêm u tối của chiến trường sinh tử.',
    isPopular: true,
  },
];

// 2. KHO GIỌNG MICROSOFT EDGE NEURAL GỐC (GIỮ NGUYÊN 100% ÂM SẮC GỐC, KHÔNG BÓP MÉO CAO ĐỘ)
export const EDGE_STUDIO_VOICES: StudioVoice[] = [
  {
    id: 'namminh',
    name: 'Nam Minh',
    code: 'NM',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Chuẩn',
    style: 'tin-tuc',
    styleLabel: 'Đĩnh đạc hào sảng',
    stars: 5,
    avatarBg: 'bg-blue-600',
    tagline: 'Giọng đọc Nam Minh chuẩn của Microsoft Edge Neural. Giữ nguyên 100% âm sắc gốc chất lượng cao, không chỉnh méo cao độ.',
    sampleText: 'Kính chào quý vị và các bạn, đây là giọng đọc Nam Minh nguyên bản từ hệ thống trí tuệ nhân tạo với âm lượng rõ ràng và đĩnh đạc.',
    edgePitch: '+0%',
    edgeRate: '+0%',
    isPopular: true,
  },
  {
    id: 'hoaimy',
    name: 'Hoài My',
    code: 'HM',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Nữ Chuẩn',
    style: 'doc-truyen',
    styleLabel: 'Ngọt ngào thanh tao',
    stars: 5,
    avatarBg: 'bg-purple-600',
    tagline: 'Giọng đọc Hoài My chuẩn của Microsoft Edge Neural. Giữ nguyên 100% âm sắc gốc trong trẻo, không chỉnh méo cao độ.',
    sampleText: 'Kính chào quý thính giả, đây là giọng đọc Hoài My nguyên bản của Microsoft với chất giọng truyền cảm, nhẹ nhàng và tự nhiên.',
    edgePitch: '+0%',
    edgeRate: '+0%',
    isPopular: true,
  },
];

// 2. KHO GIỌNG AI CLONE ĐỘC BẢN MICROX (GIỌNG THẬT 100% CỦA TỪNG NGƯỜI, CHUẨN 3 MIỀN BẮC - TRUNG - NAM)
export const MICROX_STUDIO_VOICES: StudioVoice[] = [
  {
    id: 'voice_f1f893a090c286822a23ac2f',
    name: 'Duy Onyx',
    code: 'DO',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Nam Trầm',
    style: 'ke-chuyen',
    styleLabel: 'Trầm ấm lôi cuốn',
    stars: 5,
    avatarBg: 'bg-indigo-600',
    tagline: 'Giọng nam trầm ấm, phong cách tự sự sâu lắng, truyền tải trọn vẹn cảm xúc của từng chương truyện.',
    sampleText: 'Chào mừng bạn đến với không gian đọc truyện audio, hãy cùng thả lỏng và đắm chìm vào thế giới kỳ ảo đầy màu sắc.',
    isPopular: true,
  },
  {
    id: 'voice_717f9e7c4a371d668b7dd242',
    name: 'Nguyễn Ngọc Ngạn',
    code: 'NN',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Bắc Trầm',
    style: 'ke-chuyen',
    styleLabel: 'Huyền thoại đọc truyện',
    stars: 5,
    avatarBg: 'bg-amber-600',
    tagline: 'Giọng đọc huyền thoại của nhà văn MC Nguyễn Ngọc Ngạn, trầm ấm, ma mị, dẫn dắt truyện đêm khuya đỉnh cao.',
    sampleText: 'Đêm nay, khi tiếng gió rít qua khe cửa sổ và ánh đèn đường vàng vọt hắt bóng xuống mặt đường quạnh quẽ, câu chuyện kỳ bí của chúng ta xin được phép bắt đầu...',
    isPopular: true,
  },
  {
    id: 'voice_e347bfc946cc9232466347ca',
    name: 'Hà Giang',
    code: 'HG',
    gender: 'female',
    region: 'bac',
    regionLabel: 'Giọng Bắc Chuẩn',
    style: 'doc-truyen',
    styleLabel: 'Thanh lịch truyền cảm',
    stars: 5,
    avatarBg: 'bg-rose-600',
    tagline: 'Chất giọng nữ Hà Nội thanh tao, phát âm tròn vành rõ chữ, cảm xúc sâu lắng như phát thanh viên kỳ cựu.',
    sampleText: 'Gió mùa thu se lạnh khẽ lướt qua hàng cây sấu già ven bờ hồ Hoàn Kiếm, mang theo hương hoa sữa nồng nàn của những ngày đầu đông.',
    isPopular: true,
  },
  {
    id: 'voice_bc521fe706b858344a590567',
    name: 'Vincente Toàn',
    code: 'VT',
    gender: 'male',
    region: 'nam',
    regionLabel: 'Giọng Nam Bộ',
    style: 'ke-chuyen',
    styleLabel: 'Hào sảng phóng khoáng',
    stars: 5,
    avatarBg: 'bg-emerald-600',
    tagline: 'Giọng nam Sài Gòn trầm ấm, hào sảng, phong trần, cực kỳ thích hợp truyện hành động, thương trường và đời sống.',
    sampleText: 'Nắng chiều buông dài trên cầu Ánh Sao, những dòng xe tấp nập ngược xuôi mang theo nhịp sống sôi động không ngừng nghỉ của mảnh đất phương Nam này.',
    isPopular: true,
  },
  {
    id: 'voice_42a7dc8e1d41998bf7aa5d7e',
    name: 'Thúy Tiên',
    code: 'TT',
    gender: 'female',
    region: 'nam',
    regionLabel: 'Giọng Miền Tây',
    style: 'doc-truyen',
    styleLabel: 'Ngọt ngào dịu êm',
    stars: 5,
    avatarBg: 'bg-pink-600',
    tagline: 'Chất giọng nữ sông nước miền Tây mộc mạc, ngọt lịm như mía lùi, chuyên truyện ngôn tình, dã sử, gia đấu.',
    sampleText: 'Mùa nước nổi về trên đồng ruộng châu thổ, từng bông điên điển vàng rực ven sông gợi nhớ bao nhiêu kỷ niệm êm đềm thời thơ ấu bên mái nhà xưa.',
    isPopular: true,
  },
  {
    id: 'voice_58c3f1cae6744f008a5048fd',
    name: 'Quang Toàn',
    code: 'QT',
    gender: 'male',
    region: 'trung',
    regionLabel: 'Giọng Miền Trung',
    style: 'ke-chuyen',
    styleLabel: 'Kiên nghị nội lực',
    stars: 5,
    avatarBg: 'bg-teal-600',
    tagline: 'Giọng nam miền Trung nội lực, kiên định và phong trần, đậm đà tình quê hương xứ Quảng - Huế.',
    sampleText: 'Dưới chân đèo Hải Vân sóng biển vỗ rì rào ngày đêm, những con người miền Trung kiên cường bám biển vẫn vững vàng tay lái vượt ngàn phong ba bão táp.',
    isPopular: true,
  },
  {
    id: 'voice_4a3e1a0409e4c2bb591bf6f9',
    name: 'Nhật Nam',
    code: 'NN',
    gender: 'male',
    region: 'bac',
    regionLabel: 'Giọng Thời Sự',
    style: 'tin-tuc',
    styleLabel: 'Rõ nét đĩnh đạc',
    stars: 5,
    avatarBg: 'bg-blue-600',
    tagline: 'Chất giọng nam rõ nét, mạch lạc, đĩnh đạc chuyên nghiệp cho tin tức, phân tích chiến thuật và tài liệu.',
    sampleText: 'Kính chào quý thính giả, bản tin công nghệ và khoa học không gian hôm nay sẽ cung cấp cho các bạn cái nhìn toàn diện nhất về bước tiến vượt bậc của ngành cơ giáp tương lai.',
    isPopular: true,
  },
];

// Danh mục đầy đủ tất cả các giọng trong hệ thống
export const ALL_STUDIO_VOICES: StudioVoice[] = [
  ...VIENEU_PRESET_VOICES,
  ...EDGE_STUDIO_VOICES,
  ...MICROX_STUDIO_VOICES,
];

// Alias tương thích ngược trỏ trực tiếp vào 11 giọng VieNeu v3 Nano
export const LAZIBOOK_NANO_VOICES = VIENEU_PRESET_VOICES;

export function getVoiceById(id: string): StudioVoice | undefined {
  if (!id) return undefined;
  const cleanId = id.replace(/^mx_/, '').toLowerCase().trim();
  const normalized = cleanId.replace(/_/g, '-');
  return (
    VIENEU_PRESET_VOICES.find(
      (v) =>
        v.id.toLowerCase() === cleanId ||
        v.id.toLowerCase() === normalized ||
        v.name.toLowerCase() === cleanId
    ) ||
    EDGE_STUDIO_VOICES.find(
      (v) => v.id.toLowerCase() === cleanId || v.id.toLowerCase() === normalized
    ) ||
    MICROX_STUDIO_VOICES.find(
      (v) => v.id.toLowerCase() === cleanId || v.id.toLowerCase() === normalized
    )
  );
}
