/**
 * novelNormalizer.ts
 * Bộ chuẩn hóa ngữ cảnh và Kiểm soát chất lượng (QA Control Gate) chuyên biệt cho tiểu thuyết chữ:
 * - Áp dụng từ điển nhân vật, môn phái, cảnh giới, địa danh Hán-Việt chuẩn cho từng bộ truyện.
 * - Thay thế triệt để các cụm từ dịch thô/nghĩa đen (như "hoàng đế gan", "cổng giết bóng", "chiến trường Shura"...).
 * - Xóa sạch mọi tên Pinyin/tiếng Anh sót lại (Jiang, Su, Wei, Federal, Zhang Wei...).
 * - Định dạng văn phong tiểu thuyết mượt mà, phân tách thoại và văn trần thuật chuẩn mực.
 * - QUALITY CONTROL GATE: Kiểm tra tính hợp lệ trước khi cho phép lưu hoặc hiển thị.
 */

export interface NovelGlossary {
  characterMap: [RegExp, string][];
  termMap: [RegExp, string][];
}

// Bảng từ điển dùng chung cho văn phong kiếm hiệp / tiên hiệp / mạt thế / tinh tế
export const GLOBAL_LITERARY_MAP: [RegExp, string][] = [
  // Thành ngữ & Cụm từ hay bị dịch thô
  [/Chiến trường Shura|Shura tràng|Tu La chiến trường/gi, 'Tu La tràng'],
  [/Shura/gi, 'Tu La'],
  [/hoàng đế gan|vua gan/gi, 'thánh cày cuốc'],
  [/cày gan|gan nó|bạo gan/gi, 'cày cuốc'],
  [/cổng giết bóng|Ảnh Sát môn/gi, 'Ảnh Sát Môn'],
  [/kỹ thuật kiếm gió nhanh|Tật Phong Kiếm Pháp/gi, 'Khoái Phong Kiếm Pháp'],
  [/kỹ thuật kiếm|kỹ thuật đao/gi, 'kiếm pháp'],
  [/(?<!mắt\s*)chó coi thường người(?!\s*khác)/gi, 'mắt chó coi thường người khác'],
  [/Xoay khuỷu tay của bạn ra ngoài|xoay khuỷu tay ra ngoài/gi, 'khuỷu tay quẹo ra ngoài'],
  [/Hãy giết nó khi nó đang bị bệnh|hãy giết nó khi nó đang bị bệnh/gi, 'thừa lúc nó yếu lấy mạng nó'],
  [/Federal Star Network/gi, 'Tinh võng Liên bang'],
  [/Federal/gi, 'Liên bang'],
  [/Star Network/gi, 'Tinh võng'],
  [/chương trình phát sóng trực tiếp|phát sóng trực tiếp/gi, 'livestream'],
  [/giấy phép lao động/gi, 'thẻ thân phận'],
  [/quân Zerg/gi, 'Trùng tộc'],
  [/Zerg/gi, 'Trùng tộc'],
  [/\bRV\b/g, 'xe chuyên dụng'],
  [/lõi pha lê|lõi tinh thể/gi, 'tinh hạch'],
  [/con thú hợp đồng|thú hợp đồng/gi, 'khế ước thú'],
  [/khu công nghiệp kinh dị/gi, 'khu công nghiệp quái dị'],
  [/đẩy bên/gi, 'áp đảo toàn diện'],
  [/quả lụa vàng/gi, 'Kim Ty Quả'],

  // Anti-piracy middle dots bypass
  [/([a-zA-Zà-ỹÀ-Ỹ])·([a-zA-Zà-ỹÀ-Ỹ])/g, '$1$2'],
  [/([a-zA-Zà-ỹÀ-Ỹ])•([a-zA-Zà-ỹÀ-Ỹ])/g, '$1$2'],
  [/\bg·iết\b/gi, 'giết'],
  [/\bc·hết\b/gi, 'chết'],
  [/\bh·uyết\b/gi, 'huyết'],
  [/\bm·áu\b/gi, 'máu'],

  // Cụm từ convert thô phổ biến
  [/phát ra ngốc/gi, 'ngẩn ngơ'],
  [/phát ngốc/gi, 'thất thần'],
  [/nhấc chân đi/gi, 'bước đi'],
  [/không lắm/gi, 'không mấy'],
  [/thế nhưng/gi, 'nhưng'],
  [/vào ngày thường bên trong/gi, 'ngày thường'],
  [/trong lòng dâng lên một trận/gi, 'trong lòng dâng lên một hồi'],
  [/một đầu (biến dị thú|dị thú|ma thú|hung thú)/gi, 'một con $1'],
  [/đoàn tàu vô hạn lưu/gi, 'đoàn tàu vô hạn'],
  [/người người/gi, 'ai nấy'],
  [/huyết sắc/gi, 'màu đỏ máu'],
  [/quang mang/gi, 'ánh sáng'],
  [/kim sắc/gi, 'màu vàng kim']
];

// Từ điển ngữ cảnh riêng cho từng truyện
export const STORY_GLOSSARIES: Record<string, NovelGlossary> = {
  'tro-choi-nay-ky-la-that-toi-da-tro-thanh-mot-vi-than-khai-thac-mo': {
    characterMap: [
      [/\b(Yang Ling|Yangling)\b/gi, 'Dương Lăng'],
      [/\b(Zhang Wei|Zhangwei)\b/gi, 'Trương Vĩ'],
      [/\b(Wang Qiang|Wangqiang)\b/gi, 'Vương Cường'],
      [/\b(Li Feng|Lifeng)\b/gi, 'Lý Phong'],
      [/\b(Mục sư|mục sư)\b/g, 'Dương Lăng'],
    ],
    termMap: [
      [/Hỏa Tinh Nham/gi, 'Hỏa Tinh Nham'],
      [/đá lửa tinh/gi, 'Hỏa Tinh Nham'],
      [/Thần Vực/gi, 'Thần Vực'],
      [/khai thác mỏ/gi, 'đào khoáng'],
      [/cuốc vàng đỏ/gi, 'Xích Kim Khoáng Háo'],
      [/Chuột mỏ/gi, 'Khoáng Thử'],
      [/đã niêm yết|Đã niêm yết/gi, 'Lên Bảng Vinh Danh'],
      [/Lên bảng|lên bảng/gi, 'Lên Bảng Vinh Danh']
    ]
  },
  'bac-dau-de-ton': {
    characterMap: [
      [/\b(Li Mu|Limu)\b/gi, 'Lý Mộc'],
      [/\b(Mục sư|mục sư)\b/g, 'Lý Mộc'],
      [/\b(Mộc ca)\b/g, 'Mộc ca'],
      [/\b(Mộc nhi)\b/g, 'Mộc nhi'],
      [/\b(Lu Hang|Luhang)\b/gi, 'Lục Hàng'],
      [/\b(Li Zheng Long|Lizhenglong)\b/gi, 'Lý Chính Long'],
      [/\b(Li Zheng Kun|Lizhengkun)\b/gi, 'Lý Chính Côn'],
      [/\b(Xiao Ya|Xiaoya)\b/gi, 'Tiêu Nhã'],
      [/\b(Xiao Zhan|Xiaozhan)\b/gi, 'Tiêu Chiến'],
      [/\b(Peng Tian Hu|Pangtianhu)\b/gi, 'Bành Thiên Hổ'],
      [/\b(Hun Tian|Huntian)\b/gi, 'Hỗn Thiên'],
    ],
    termMap: [
      [/Cổng giết bóng|cổng giết bóng/gi, 'Ảnh Sát Môn'],
      [/Ảnh Sát môn/gi, 'Ảnh Sát Môn'],
      [/Kẻ sát nhân thực sự đằng sau hậu trường/gi, 'Thủ phạm thật sự sau màn'],
      [/Cuộc chiến sắp bắt đầu/gi, 'Đại chiến sắp nổ ra'],
      [/Kỹ thuật kiếm gió nhanh/gi, 'Khoái Phong Kiếm Pháp'],
      [/Tật Phong Kiếm Pháp/gi, 'Khoái Phong Kiếm Pháp'],
      [/Ma lực nửa bước/gi, 'Nửa bước Thần Thông'],
      [/Núi Thanh Vân/gi, 'Thanh Vân Sơn'],
      [/Chiến trường Shura|Tu La chiến trường/gi, 'Tu La tràng']
    ]
  },
  'xuyen-tinh-te-mang-di-nang-mat-the-ta-trong-ra-ca-the-gioi-ky-la': {
    characterMap: [
      [/\b(Su Luo|Suluo)\b/gi, 'Tô Lạc'],
      [/\b(Tô Lạc)\b/g, 'Tô Lạc'],
      [/\b(Tie Dan|Tiedan)\b/gi, 'Thiết Đản'],
      [/\b(Zhang Hua|Zhanghua)\b/gi, 'Trương Hoa'],
      [/\b(Khóc bao|khóc bao)\b/gi, 'Tiểu Khóc Bao']
    ],
    termMap: [
      [/Trái cây kiếm tiền|trái cây kiếm tiền/gi, 'Dùng trái cây trừ nợ'],
      [/trừ tiền/gi, 'trừ nợ'],
      [/mơ mộng/gi, 'nguyện vọng'],
      [/Chó coi thường người/gi, 'Mắt chó coi thường người khác'],
      [/Xoay khuỷu tay của bạn ra ngoài/gi, 'Khuỷu tay quẹo ra ngoài'],
      [/cuộc xâm lược của quân Zerg/gi, 'Trùng tộc xâm lấn'],
      [/linh thực/gi, 'linh thực'],
      [/hộ khẩu đen/gi, 'hộ khẩu đen']
    ]
  },
  'mat-the-trong-sinh-nu-phu-phan-cong-cuop-sach-co-duyen-nu-chinh-to-niem': {
    characterMap: [
      [/\b(Su Nian|Sunian)\b/gi, 'Tô Niệm'],
      [/\b(Su Tiantian|Sutiantian)\b/gi, 'Tô Điềm Điềm'],
      [/\b(Wei Yan|Weiyan)\b/gi, 'Ngụy Ngôn'],
      [/\b(Anh Ngụy|anh Ngụy)\b/gi, 'Ngụy ca'],
    ],
    termMap: [
      [/giấy phép lao động/gi, 'thẻ thân phận'],
      [/nâng cấp RV/gi, 'nâng cấp xe chuyên dụng RV'],
      [/Tâm lý của Tô Điềm Điềm sụp đổ/gi, 'Tâm lý Tô Điềm Điềm sụp đổ'],
      [/Bây giờ họ không quen lắm sao\?/gi, 'Hiện tại không phải rất quen thuộc sao?']
    ]
  },
  'tan-the-den-roi-ky-tuc-xa-nu-502-xuat-phat': {
    characterMap: [
      [/\b(Chen Yue|Chenyue)\b/gi, 'Trần Nguyệt'],
      [/\b(Ye Qingqing|Yeqingqing)\b/gi, 'Diệp Thanh Thanh'],
      [/\b(Li Yuandan|Liyuandan)\b/gi, 'Lý Nguyên Đán'],
      [/\b(Tiểu Lí|Tiểu lí)\b/gi, 'Tiểu Lý'],
    ],
    termMap: [
      [/đoàn tàu vô hạn lưu/gi, 'đoàn tàu vô hạn'],
      [/nhà an toàn di động/gi, 'căn cứ an toàn di động'],
      [/sương mù phổi/gi, 'sương mù độc'],
      [/Trị liệu cao cấp VIP/gi, 'Trị liệu VIP cao cấp']
    ]
  },
  'xuyen-khong-tinh-te-mot-mieng-thit-chien-lam-ca-lien-bang-phat-cuong-giang-thu-thu': {
    characterMap: [
      [/\b(Jiang Qiuqiu|Jiangqiuqiu)\b/gi, 'Giang Thu Thu'],
      [/\b(Mo Si|Mosi)\b/gi, 'Mặc Tư'],
      [/\b(Thu Đao Xương Bắc|Thu đao xương bắc)\b/gi, 'Thu Đao Xương Bắc']
    ],
    termMap: [
      [/Federal Star Network/gi, 'Tinh võng Liên bang'],
      [/chương trình phát sóng trực tiếp/gi, 'livestream'],
      [/Jiang Qiuqiu: Tôi muốn rời khỏi chương trình phát sóng trực tiếp liên bang/gi, 'Giang Thu Thu: Tôi muốn dừng livestream Tinh võng Liên bang'],
      [/bước ngoặt mới/gi, 'bước ngoặt mới'],
      [/Đưa ra hạn ngạch/gi, 'Mở thêm suất mua']
    ]
  },
  'phe-tho-xuyen-thanh-me-nuoi-ac-doc-ta-nuoi-bon-nhoc-thanh-dai-lao': {
    characterMap: [
      [/\b(Shi Qi|Shiqi)\b/gi, 'Thời Thất'],
      [/\b(Thời Thất)\b/g, 'Thời Thất']
    ],
    termMap: [
      [/Hãy giết nó khi nó đang bị bệnh!/gi, 'Thừa lúc nó yếu lấy mạng nó!'],
      [/Kiến quân đội đột biến/gi, 'Kiến quân đoàn biến dị'],
      [/lõi pha lê/gi, 'tinh hạch'],
      [/rệp đột biến/gi, 'rệp biến dị']
    ]
  },
  'trong-sinh-mat-the-ta-so-huu-quan-doan-thu-khe-uoc': {
    characterMap: [
      [/\b(Zhao Yinruo|Zhaoyinruo)\b/gi, 'Triệu Âm Nhược'],
      [/\b(Zhao Yinguo|Zhaoyinguo)\b/gi, 'Triệu Âm Quốc'],
      [/\b(Zhao Ying|Zhaoying)\b/gi, 'Triệu Dĩnh'],
      [/\b(Zhao Yin|Zhaoyin)\b/gi, 'Triệu Âm'],
      [/\b(Zhao)\b/g, 'Triệu'],
      [/\b(Lão Ngưu|lão Ngưu)\b/gi, 'Lão Ngưu']
    ],
    termMap: [
      [/Con thú hợp đồng/gi, 'Khế ước thú'],
      [/Đạo cụ cấp A, lều vô hình/gi, 'Đạo cụ cấp A: Lều tàng hình'],
      [/thu hoạch bội thu/gi, 'đại hoạch toàn thắng'],
      [/quả lụa vàng/gi, 'Kim Ty Quả'],
      [/đẩy bên/gi, 'áp đảo toàn diện']
    ]
  },
  'xuyen-vao-hanh-tinh-rac-thanh-bac-thay-che-tao-co-giap-tu-dong-phe-lieu': {
    characterMap: [
      [/\b(Tang Tiantian|Tang Tian Tian|Tiantian|Thang Điềm Điềm)\b/gi, 'Đường Điềm Điềm'],
      [/\b(Xiao Zhi|Xiaozhi)\b/gi, 'Tiểu Trí'],
      [/\b(Chen Xing|Chenxing)\b/gi, 'Trần Hưng'],
      [/\b(Xiao Wen|Xiaowen)\b/gi, 'Tiểu Văn'],
      [/\b(Xiao Wu|Xiaowu)\b/gi, 'Tiểu Vũ'],
      [/\b(Xiao Bing|Xiaobing)\b/gi, 'Tiểu Băng'],
      [/\b(Chen Xi|Chenxi)\b/gi, 'Trần Hy'],
      [/\b(Wang Da|Wangda)\b/gi, 'Vương Đạt'],
      [/\b(Wang Pingping|Wangpingping)\b/gi, 'Vương Bình Bình']
    ],
    termMap: [
      [/bổ cấp tinh|hành tinh cung ứng/gi, 'hành tinh tiếp tế'],
      [/lạp ky tinh|tinh cầu rác/gi, 'hành tinh rác'],
      [/Lan Tháp tinh|Lan Tháp cầu/gi, 'Lan Tháp tinh'],
      [/chế giáp sư/gi, 'thợ chế tạo cơ giáp'],
      [/giáp cơ/gi, 'cơ giáp'],
      [/quang não/gi, 'quang não'],
      [/tinh thần lực/gi, 'tinh thần lực'],
      [/thức hải/gi, 'thức hải'],
      [/nút không gian/gi, 'nút không gian'],
      [/hộp năng lượng|khối năng lượng/gi, 'hộp năng lượng'],
      [/đèn năng lượng/gi, 'đèn năng lượng'],
      [/dịch dinh dưỡng|dung dịch dinh dưỡng/gi, 'dịch dinh dưỡng'],
      [/bữa ăn dinh dưỡng/gi, 'khẩu phần dinh dưỡng'],
      [/men gốm bạch kim/gi, 'men gốm bạch kim'],
      [/men tinh kim/gi, 'men tinh kim'],
      [/quặng Carat|quặng Ca-lạp/gi, 'quặng Carat'],
      [/bộ thể thuật/gi, 'bộ thể thuật'],
      [/nền văn minh Hankeloras/gi, 'nền văn minh Hankeloras']
    ]
  }
};

/**
 * Áp dụng toàn bộ từ điển ngữ cảnh và chuẩn hóa văn phong
 */
export function normalizeAndPolish(text: string, slug?: string): string {
  if (!text) return '';
  let s = text;

  // 1. Áp dụng từ điển riêng của truyện (nếu có)
  if (slug && STORY_GLOSSARIES[slug]) {
    const gl = STORY_GLOSSARIES[slug];
    for (const [p, r] of gl.characterMap) {
      s = s.replace(p, r);
    }
    for (const [p, r] of gl.termMap) {
      s = s.replace(p, r);
    }
  }

  // 2. Áp dụng bảng ngữ nghĩa văn học toàn cục
  for (const [p, r] of GLOBAL_LITERARY_MAP) {
    s = s.replace(p, r);
  }

  // 3. Chuẩn hóa lặp từ & dấu câu
  s = s
    .replace(/(xe chuyên dụng\s*)+/gi, 'xe chuyên dụng ')
    .replace(/(Lên Bảng Vinh Danh\s*)+/gi, 'Lên Bảng Vinh Danh ')
    .replace(/(mắt\s*)+chó coi thường người(\s*khác)+/gi, 'mắt chó coi thường người khác')
    .replace(/["“”«»]/g, '"')
    .replace(/[—–]/g, ' - ')
    .replace(/\s+/g, ' ');

  return s.trim();
}

/**
 * GOM ĐOẠN VĂN TIỂU THUYẾT CHUẨN MỰC (350 - 550 ký tự)
 * Trả về nội dung các đoạn văn sạch sẽ (không lặp lại tiêu đề ở đầu)
 */
export function formatLiteraryParagraphs(rawContent: string, titleVi: string, slug?: string): string {
  const polished = normalizeAndPolish(rawContent, slug);
  const lines = polished.split(/\n+/).map(l => l.trim()).filter(Boolean);

  const paragraphs: string[] = [];
  let cur = '';

  for (const line of lines) {
    const isDialogue = /^["\-]/.test(line);

    if (isDialogue) {
      if (cur) {
        paragraphs.push(cur);
        cur = '';
      }
      paragraphs.push(line);
      continue;
    }

    if (!cur) {
      cur = line;
    } else if (cur.length + line.length < 500 && !/^["\-]/.test(cur)) {
      cur += ' ' + line;
    } else {
      paragraphs.push(cur);
      cur = line;
    }
  }
  if (cur) paragraphs.push(cur);

  // Không lặp tiêu đề ở đầu nội dung, để giao diện và Audio TTS hiển thị chuẩn xác
  return paragraphs.join('\n\n');
}

/**
 * QUALITY CONTROL GATE (KIỂM TRA CHẤT LƯỢNG TRƯỚC KHI ĐẨY LÊN)
 * Trả về { passed: boolean, reasons: string[] }
 */
export function qualityControlCheck(content: string, title: string, slug?: string): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. Kiểm tra độ dài tối thiểu
  if (!content || content.length < 500) {
    reasons.push(`Nội dung chương quá ngắn (${content ? content.length : 0} ký tự, yêu cầu tối thiểu > 500 ký tự)`);
  }

  // 2. Kiểm tra các từ cấm dịch thô nặng nề
  const forbiddenPhrases = [
    { phrase: 'hoàng đế gan' },
    { phrase: 'cổng giết bóng' },
    { phrase: 'kỹ thuật kiếm gió' },
    { phrase: 'chó coi thường người', except: 'mắt chó coi thường người khác' },
    { phrase: 'xoay khuỷu tay của bạn ra ngoài' },
    { phrase: 'hãy giết nó khi nó đang bị bệnh' },
    { phrase: 'Federal Star Network' },
    { phrase: 'con thú hợp đồng' },
    { phrase: 'lõi pha lê' }
  ];

  for (const item of forbiddenPhrases) {
    let checkContent = content.toLowerCase();
    let checkTitle = title.toLowerCase();
    if (item.except) {
      checkContent = checkContent.replace(new RegExp(item.except, 'gi'), '');
      checkTitle = checkTitle.replace(new RegExp(item.except, 'gi'), '');
    }
    if (checkContent.includes(item.phrase.toLowerCase()) || checkTitle.includes(item.phrase.toLowerCase())) {
      reasons.push(`Chứa cụm từ dịch thô vi phạm: "${item.phrase}"`);
    }
  }

  // 3. Kiểm tra tên Pinyin chưa dịch
  const pinyinNames = [
    'Su Tiantian', 'Jiang Qiuqiu', 'Wei Yan', 'Yang Ling', 'Su Luo',
    'Li Mu ', 'Tie Dan', 'Mo Si', 'Shi Qi', 'Zhao Yin', 'Zhang Wei',
    'Ye Qingqing', 'Chen Yue', 'Li Yuandan'
  ];
  for (const p of pinyinNames) {
    if (content.includes(p) || title.includes(p)) {
      reasons.push(`Chứa tên Pinyin chưa Việt hóa: "${p}"`);
    }
  }

  return {
    passed: reasons.length === 0,
    reasons
  };
}
