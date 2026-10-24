/**
 * vietnamesePolisher.ts
 * Bộ tiền xử lý và chuẩn hóa văn phong tiếng Việt cho truyện Convert / Machine Translation.
 * Khắc phục hiện tượng dịch word-by-word, ngữ pháp ngược, và lỗi phông Unicode tổ hợp.
 */

// Bảng từ điển chuyển đổi các cụm từ convert thô ngô nghê sang tiếng Việt tự nhiên
const CONVERT_PHRASES: [RegExp, string][] = [
  // 1. Cụm từ máy dịch ngô nghê kinh điển
  [/phát ra ngốc/gi, 'ngẩn ngơ'],
  [/phát ngốc/gi, 'thất thần'],
  [/chưa thả qua/gi, 'không hề bỏ qua'],
  [/không thả qua/gi, 'không bỏ qua'],
  [/chưa từng thả qua/gi, 'chưa từng bỏ qua'],
  [/không lắm để bụng/gi, 'không mấy để tâm'],
  [/không quá để bụng/gi, 'không quá bận tâm'],
  [/không lắm nổi danh/gi, 'không mấy tiếng tăm'],
  [/không lắm quen thuộc/gi, 'không mấy quen thuộc'],
  [/đây hết thảy không vì cái gì khác, liền vì/gi, 'tất cả điều này không vì gì khác, mà chính là vì'],
  [/đây hết thảy/gi, 'tất cả những điều này'],
  [/vào ngày thường bên trong/gi, 'vào những ngày bình thường'],
  [/vào ngày thường/gi, 'ngày thường'],
  [/tùy thời c[oó] th[ểe] lấy/gi, 'có thể bất cứ lúc nào'],
  [/tùy thời/gi, 'bất cứ lúc nào'],
  [/phá nhập/gi, 'đột phá lên'],
  [/tiến giai/gi, 'đột phá cảnh giới'],
  [/cường giả vi tôn thế giới/gi, 'thế giới lấy kẻ mạnh làm tôn'],
  [/thế giới này người/gi, 'người ở thế giới này'],
  [/cũng coi là cái chuyện hiếm lạ/gi, 'cũng được xem là chuyện hiếm thấy'],
  [/cũng coi là/gi, 'cũng xem là'],
  [/chuyện hiếm lạ/gi, 'chuyện hiếm'],
  [/đầu lệ/gi, 'tiền lệ đầu tiên'],
  [/một trận gợn sóng/gi, 'một phen chấn động'],
  [/một người dáng dấp thanh tú thiếu niên/gi, 'một thiếu niên có dáng vẻ thanh tú'],
  [/dáng dấp thanh tú/gi, 'dáng vẻ thanh tú'],
  [/như sinh hoạt thế này/gi, 'cuộc sống như thế này'],
  [/chớ đừng nói chi là/gi, 'huống chi là'],
  [/vừa vặn làm nhân vật chính hắn/gi, 'trong khi hắn là nhân vật chính thì'],
  [/vừa vặn làm/gi, 'với tư cách là'],
  [/thu hoạch được trường sinh/gi, 'đạt được trường sinh'],
  [/không ngừng cường đại bản thân/gi, 'không ngừng tăng cường thực lực'],
  [/tuổi còn trẻ, liền đã/gi, 'tuổi còn nhỏ mà đã'],
  [/tuổi còn trẻ/gi, 'tuổi còn nhỏ'],
  [/cũng bất quá/gi, 'cũng chỉ là'],
  [/liền xưng/gi, 'được gọi là'],
  [/ngàn cân lực lượng/gi, 'sức mạnh ngàn cân'],
  [/người bình thường cực hạn/gi, 'giới hạn của người bình thường'],
  [/đánh xuống cơ sở trọng yếu một vòng/gi, 'đặt nền móng vô cùng quan trọng'],
  [/đánh xuống cơ sở/gi, 'đặt nền móng'],
  [/mới tính được là/gi, 'mới thực sự là'],
  [/màu bạc quang mang/gi, 'ánh sáng màu bạc'],
  [/kim sắc quang mang/gi, 'ánh sáng vàng kim'],
  [/quang mang/gi, 'ánh sáng'],
  [/huyết sắc/gi, 'màu đỏ máu'],
  [/nhàn nhạt nụ cười/gi, 'nụ cười nhạt'],
  [/người người trên mặt nụ cười/gi, 'trên mặt ai nấy đều rạng rỡ nụ cười'],
  [/một mảnh hớn hở/gi, 'tràn ngập niềm vui'],
  [/thượng diện/gi, 'bên trên'],
  [/hạ diện/gi, 'bên dưới'],
  [/lý diện/gi, 'bên trong'],
  [/ngoại diện/gi, 'bên ngoài'],
  [/nằm tại/gi, 'nằm ở'],

  // 2. Chuyển đổi ngữ pháp ngược tiếng Hán sang tiếng Việt
  [/thân xuyên ([^,\n]+) thiếu niên/gi, 'thiếu niên mặc $1'],
  [/thân xuyên ([^,\n]+) thiếu nữ/gi, 'thiếu nữ mặc $1'],
  [/thân xuyên ([^,\n]+)/gi, 'khoác trên mình $1'],
];

/**
 * Chuẩn hóa Unicode dấu tiếng Việt (NFC precomposed)
 * Khắc phục triệt để lỗi dấu ngã / hỏi tổ hợp tách rời (ví dụ: cũng -> cũng, có -> có)
 */
export function normalizeVietnameseUnicode(text: string): string {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * Làm mượt câu văn Convert thô thành tiếng Việt tự nhiên, chuẩn văn phong truyện
 */
export function polishVietnameseText(text: string): string {
  if (!text) return '';

  let polished = normalizeVietnameseUnicode(text);

  // Áp dụng bảng từ điển chuyển đổi ngữ nghĩa
  for (const [pattern, replacement] of CONVERT_PHRASES) {
    polished = polished.replace(pattern, replacement);
  }

  // Dọn dẹp khoảng trắng thừa và ngắt dòng
  polished = polished
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  return polished;
}
