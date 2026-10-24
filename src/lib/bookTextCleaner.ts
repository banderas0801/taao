/**
 * Bộ lọc làm sạch văn bản sách tự động (LaziBook Style Clean Engine)
 * Tự động loại bỏ dòng quảng cáo rác, link web lặp lại, sửa lỗi font/dấu cách
 */

const AD_LINE_PATTERNS = [
  /đọc\s+truyện\s+(online|tại|miễn\s+phí|nhanh\s+nhất)/i,
  /truy\s+cập\s+(https?:\/\/)?[\w.-]+\.(com|vn|net|org|io)/i,
  /nguồn\s*:\s*(https?:\/\/)?[\w.-]+/i,
  /ủng\s+hộ\s+(nhóm\s+dịch|dịch\s+giả|team)/i,
  /chúc\s+(bạn|quý\s+độc\s+giả)\s+đọc\s+truyện\s+vui\s+vẻ/i,
  /truyện\s+(được\s+)?(đăng|post|sưu\s+tầm)\s+bởi/i,
  /nguồn\s+(sưu\s+tầm|bản\s+dịch)/i,
  /mọi\s+ý\s+kiến\s+đóng\s+góp\s+xin\s+gửi\s+về/i,
  /theo\s+dõi\s+(fanpage|kênh|group)/i,
  /truyenfull|bientruyen|tangthuvien|metruyenchu|wikidich|wattpad/i
];

export function cleanChapterContent(rawContent: string): string {
  if (!rawContent) return '';

  const lines = rawContent.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();

    // Bỏ qua dòng rác ngắn chứa toàn ký tự phân cách trang: ---, ***, ===, ___
    if (/^[_\-*\=~#\s]{3,}$/.test(trimmed)) {
      continue;
    }

    // Bỏ qua lời nhắn rác, xin vote, câu view trong ngoặc vuông đầu chương
    if (/^\[[^\]]*(khởi đầu|đọc tiếp|lời tác giả|tác giả có lời|cầu vote|nhớ like|chú thích|ghi chú|tác giả nhắn)[^\]]*\]$/i.test(trimmed)) {
      continue;
    }
    if (/^\[.*?đọc tiếp.*?\]$/i.test(trimmed)) {
      continue;
    }

    // Kiểm tra dòng quảng cáo
    const isAd = AD_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (isAd && trimmed.length < 150) {
      // Bỏ qua dòng quảng cáo
      continue;
    }

    // Chuẩn hóa khoảng trắng thừa
    trimmed = trimmed.replace(/[ \t]+/g, ' ');

    cleanedLines.push(trimmed);
  }

  // Gộp lại và loại bỏ quá nhiều dòng trống liên tiếp (tối đa 2 dòng trống)
  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
