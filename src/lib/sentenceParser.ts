import { polishVietnameseText } from './vietnamesePolisher';

export interface SentenceUnit {
  id: number; // Global index across the entire chapter
  text: string;
  paragraphIndex: number;
}

export interface ParagraphUnit {
  id: number;
  sentences: SentenceUnit[];
  rawText: string;
}

/**
 * Tách một đoạn văn thành danh sách các câu hoàn chỉnh trong tiếng Việt,
 * bảo toàn các dấu câu, lời thoại ngoặc kép, ba chấm, gạch đầu dòng.
 */
export function splitParagraphIntoSentences(
  text: string,
  startSentenceId: number,
  paragraphIndex: number
): SentenceUnit[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  // Tách theo các mốc kết thúc câu tiếng Việt: . ! ? … kết hợp khoảng trắng hoặc ngoặc kép/gạch ngang
  // Regex tách câu: giữ lại các dấu chấm, chấm lửng, chấm than, hỏi chấm
  const rawSegments = cleaned
    .split(/(?<=[.!?…]["”»]?)\s+(?=[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ0-9"“«—\-])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Nếu đoạn quá ngắn hoặc không tách được câu
  if (rawSegments.length <= 1) {
    return [
      {
        id: startSentenceId,
        text: cleaned,
        paragraphIndex,
      },
    ];
  }

  // Ghép các phân đoạn thành cụm câu tự nhiên (45 - 120 ký tự) chuẩn đọc sách nói
  // Giúp giọng AI có đầy đủ ngữ cảnh để ngân giọng, luyến láy nhưng không bị quá dài gây nghẽn buffer
  const merged: string[] = [];
  let buffer = '';

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const isDialogue = /^["“«—\-]/.test(seg);

    // Nếu phân đoạn tiếp theo là lời thoại riêng biệt và buffer đã có nội dung trần thuật, chốt buffer cũ trước
    if (isDialogue && buffer.length >= 30) {
      merged.push(buffer.trim());
      buffer = seg;
      continue;
    }

    if (buffer) {
      buffer += ' ' + seg;
    } else {
      buffer = seg;
    }

    const isQuestionOrExclamation = /[!?]["”»]?$/.test(seg);
    const isCompleteClause = /[.!?…]["”»]?$/.test(seg);

    // 1. Phân đoạn kết thúc bằng hỏi chấm (?) hoặc than (!): chốt câu riêng biệt để giữ chuẩn ngữ điệu lên/xuống giọng
    if (isQuestionOrExclamation && buffer.length >= 20) {
      merged.push(buffer.trim());
      buffer = '';
      continue;
    }

    // 2. Tiêu chuẩn câu sách nói: kết thúc dấu ngắt câu hoàn chỉnh từ 45 ký tự trở lên (khoảng 9-15 từ)
    // Hoặc nếu cụm vượt quá 120 ký tự, hoặc là câu cuối của đoạn
    if ((buffer.length >= 45 && isCompleteClause) || buffer.length >= 120 || i === rawSegments.length - 1) {
      merged.push(buffer.trim());
      buffer = '';
    }
  }

  if (buffer && buffer.trim()) {
    if (merged.length > 0) {
      merged[merged.length - 1] += ' ' + buffer.trim();
    } else {
      merged.push(buffer.trim());
    }
  }

  let curId = startSentenceId;
  return merged.map((str) => ({
    id: curId++,
    text: str,
    paragraphIndex,
  }));
}

/**
 * Phân tích toàn bộ nội dung chương thành cấu trúc Đoạn + Câu (Karaoke Sentence Level)
 */
export function parseChapterContent(
  rawContent: string,
  effectiveTitle: string,
  chapterNum: number
): {
  paragraphs: ParagraphUnit[];
  flatSentences: SentenceUnit[];
} {
  if (!rawContent) {
    return { paragraphs: [], flatSentences: [] };
  }

  // Bước 1: Làm sạch và chuẩn hóa văn phong tiếng Việt
  const rawBlocks = rawContent
    .split(/\n\s*\n/)
    .map((p) => polishVietnameseText(p.trim()))
    .filter((p) => p.length > 0);

  // Bước 2: Gom các đoạn thoại và trần thuật hợp lý
  const cleanBlocks: string[] = [];
  let currentBlock = '';

  for (const block of rawBlocks) {
    // Bỏ qua nếu dòng đầu lặp lại tiêu đề chương
    if (
      cleanBlocks.length === 0 &&
      !currentBlock &&
      (block.toLowerCase() === effectiveTitle.toLowerCase() ||
        block.toLowerCase().startsWith(`chương ${chapterNum}:`) ||
        block.toLowerCase() === `chương ${chapterNum}`)
    ) {
      continue;
    }

    const isDialogue = /^["“«—\-]/.test(block);

    if (!currentBlock) {
      currentBlock = block;
    } else if (
      currentBlock.length + block.length < 500 &&
      !isDialogue &&
      !/^["“«—\-]/.test(currentBlock)
    ) {
      currentBlock += ' ' + block;
    } else {
      cleanBlocks.push(currentBlock);
      currentBlock = block;
    }
  }

  if (currentBlock) {
    cleanBlocks.push(currentBlock);
  }

  // Bước 3: Tách từng đoạn thành các câu con để phục vụ Karaoke Highlight & Chạm câu nào nghe câu đó
  let globalSentenceId = 0;
  const flatSentences: SentenceUnit[] = [];
  const paragraphs: ParagraphUnit[] = [];

  for (let pIdx = 0; pIdx < cleanBlocks.length; pIdx++) {
    const pText = cleanBlocks[pIdx];
    const sentences = splitParagraphIntoSentences(pText, globalSentenceId, pIdx);
    globalSentenceId += sentences.length;

    flatSentences.push(...sentences);
    paragraphs.push({
      id: pIdx,
      sentences,
      rawText: pText,
    });
  }

  return { paragraphs, flatSentences };
}
