'use client';

// @ts-ignore
import JSZip from 'jszip/dist/jszip.min.js';
import { ImportedStory, ImportedChapter } from './importedBookStorage';
import { cleanChapterContent } from './bookTextCleaner';

// Tạo URL-safe slug từ tiếng Việt
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'truyen-import-' + Date.now().toString(36);
}

// Làm sạch tên truyện từ tên file
export function cleanTitleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.(txt|epub|zip|html)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Regex chuẩn nhận diện tiêu đề chương tiếng Việt & Quốc tế
const CHAPTER_REGEX = /(?:^|\r?\n)[ \t]*(?:(Chương|Hồi|Tiết|Quyển|Tập|Phần|Bản|Chapter|Chap|Thứ)[ \t]*([0-9\u0660-\u0669一二三四五六七八九十百千万IVXLCDM]+)[ \t:.\-–—]*([^\r\n]*)|(Mở đầu|Lời mở đầu|Ngoại truyện|Phiên ngoại|Vĩ thanh|Lời tựa|Hậu ký|Kết cục|Đại kết cục)[ \t:.\-–—]*([^\r\n]*))/gi;

/**
 * Phân tích tệp tin văn bản TXT
 */
export async function parseTxtFile(file: File): Promise<ImportedStory> {
  const text = await file.text();
  const rawTitle = cleanTitleFromFileName(file.name);
  const slug = `${generateSlug(rawTitle)}-${Date.now().toString(36).slice(-4)}`;

  const matches: Array<{ index: number; fullTitle: string }> = [];
  let m: RegExpExecArray | null;

  CHAPTER_REGEX.lastIndex = 0;
  while ((m = CHAPTER_REGEX.exec(text)) !== null) {
    const title = m[0].trim();
    if (title.length > 0 && title.length < 120) {
      matches.push({
        index: m.index,
        fullTitle: title,
      });
    }
  }

  const chapters: ImportedChapter[] = [];

  // Nếu file có các tiêu đề chương nhận diện được
  if (matches.length >= 2) {
    // Đoạn mở đầu (trước chương 1) nếu có
    if (matches[0].index > 100) {
      const introContent = text.substring(0, matches[0].index).trim();
      if (introContent.length > 50) {
        chapters.push({
          id: `chap-0`,
          number: 0,
          title: 'Lời Mở Đầu / Giới Thiệu',
          content: introContent,
          wordCount: introContent.split(/\s+/).length,
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startPos = current.index;
      const endPos = i + 1 < matches.length ? matches[i + 1].index : text.length;

      let chapContent = text.substring(startPos, endPos).trim();
      // Bỏ dòng tiêu đề đầu tiên trong nội dung chương
      const firstLineBreak = chapContent.indexOf('\n');
      if (firstLineBreak !== -1) {
        chapContent = chapContent.substring(firstLineBreak + 1).trim();
      }

      chapContent = cleanChapterContent(chapContent);

      const chapterNumber = chapters.length + 1;
      chapters.push({
        id: `chap-${chapterNumber}`,
        number: chapterNumber,
        title: current.fullTitle.replace(/^[\r\n\s]+/, '').trim(),
        content: chapContent,
        wordCount: chapContent.split(/\s+/).length,
      });
    }
  } else {
    // Nếu file TXT không chứa từ khóa chương, chia đều theo ~2500 từ mỗi chương
    const paragraphs = text.split(/\r?\n\s*\r?\n/);
    let currentChunk: string[] = [];
    let currentWords = 0;
    let chapNum = 1;

    for (const p of paragraphs) {
      const cleanP = p.trim();
      if (!cleanP) continue;
      const pWords = cleanP.split(/\s+/).length;
      currentChunk.push(cleanP);
      currentWords += pWords;

      if (currentWords >= 2200) {
        const content = currentChunk.join('\n\n');
        chapters.push({
          id: `chap-${chapNum}`,
          number: chapNum,
          title: `Phần ${chapNum}`,
          content,
          wordCount: currentWords,
        });
        chapNum++;
        currentChunk = [];
        currentWords = 0;
      }
    }

    if (currentChunk.length > 0) {
      const content = currentChunk.join('\n\n');
      chapters.push({
        id: `chap-${chapNum}`,
        number: chapNum,
        title: `Phần ${chapNum}`,
        content,
        wordCount: currentWords,
      });
    }
  }

  // Tóm tắt giới thiệu ngắn từ đoạn đầu
  const previewDesc = chapters[0]?.content.substring(0, 300).replace(/\s+/g, ' ').trim() + '...';

  return {
    id: `txt-${Date.now()}`,
    slug,
    title: rawTitle,
    author: 'Tự nhập từ tệp TXT',
    description: previewDesc || 'Truyện được tải lên từ tệp tin văn bản cá nhân.',
    categories: ['Sách Tự Nhập', 'Văn Bản TXT'],
    sourceType: 'file_txt',
    chaptersCount: chapters.length,
    chapters,
    importedAt: Date.now(),
    lastReadChapter: 1,
  };
}

/**
 * Trích xuất văn bản thuần túy và làm sạch thẻ HTML từ file XHTML/HTML của EPUB
 */
function extractTextFromHtml(html: string): { title: string; content: string } {
  if (typeof DOMParser === 'undefined') {
    const clean = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { title: '', content: clean };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Loại bỏ các thẻ không dùng
    doc.querySelectorAll('script, style, head, nav, [hidden]').forEach((el) => el.remove());

    // Tìm tiêu đề chương nếu có h1, h2, h3, title
    let title = '';
    const h = doc.querySelector('h1, h2, h3, .title, .chapter-title');
    if (h && h.textContent) {
      title = h.textContent.trim();
    }

    // Duyệt qua các thẻ đoạn văn
    const paragraphs: string[] = [];
    const elements = doc.querySelectorAll('p, div, blockquote, li, h1, h2, h3, h4');

    if (elements.length > 0) {
      elements.forEach((el) => {
        const txt = el.textContent?.trim();
        if (txt && txt.length > 0 && !paragraphs.includes(txt)) {
          paragraphs.push(txt);
        }
      });
    } else {
      const bodyText = doc.body.textContent || '';
      paragraphs.push(bodyText);
    }

    return {
      title,
      content: paragraphs.join('\n\n'),
    };
  } catch {
    const clean = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { title: '', content: clean };
  }
}

/**
 * Phân tích tệp sách điện tử EPUB chuẩn
 */
export async function parseEpubFile(file: File): Promise<ImportedStory> {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);

  // 1. Tìm container.xml
  const containerXml = await zipData.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Tệp EPUB không hợp lệ (Không tìm thấy META-INF/container.xml)');
  }

  // Tìm đường dẫn file .opf
  const opfPathMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';
  const opfContent = await zipData.file(opfPath)?.async('text');
  if (!opfContent) {
    throw new Error('Tệp EPUB không chứa thông tin định danh content.opf');
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Trích xuất Metadata (Tiêu đề, Tác giả, Mô tả)
  let title = cleanTitleFromFileName(file.name);
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].trim();
  }

  let author = 'Khuyết Danh';
  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  if (authorMatch && authorMatch[1].trim()) {
    author = authorMatch[1].trim();
  }

  let description = '';
  const descMatch = opfContent.match(/<dc:description[^>]*>([\s\S]*?)<\/dc:description>/i);
  if (descMatch && descMatch[1].trim()) {
    description = descMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  // 3. Trích xuất Ảnh bìa (Cover Image)
  let coverUrl: string | undefined = undefined;
  try {
    const manifestItems: { id: string; href: string; mediaType: string; properties?: string }[] = [];
    const itemRegex = /<item\s+[^>]*>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
      const tag = itemMatch[0];
      const id = tag.match(/id=["']([^"']+)["']/i)?.[1] || '';
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1] || '';
      const mediaType = tag.match(/media-type=["']([^"']+)["']/i)?.[1] || '';
      const properties = tag.match(/properties=["']([^"']+)["']/i)?.[1] || '';
      if (id && href) {
        manifestItems.push({ id, href, mediaType, properties });
      }
    }

    // Tìm item cover
    const coverItem = manifestItems.find(
      (it) =>
        it.properties?.includes('cover-image') ||
        it.id.toLowerCase().includes('cover') ||
        it.href.toLowerCase().includes('cover')
    );

    if (coverItem) {
      const fullCoverPath = (opfDir + coverItem.href).replace(/^\//, '');
      const coverFile = zipData.file(fullCoverPath) || zipData.file(coverItem.href);
      if (coverFile) {
        const base64 = await coverFile.async('base64');
        const mime = coverItem.mediaType || 'image/jpeg';
        coverUrl = `data:${mime};base64,${base64}`;
      }
    }

    // 4. Tìm thứ tự chương trong spine
    const spineItems: string[] = [];
    const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
    if (spineMatch) {
      const itemrefRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi;
      let iref: RegExpExecArray | null;
      while ((iref = itemrefRegex.exec(spineMatch[1])) !== null) {
        spineItems.push(iref[1]);
      }
    }

    // 5. Đọc các chương theo thứ tự spine
    const chapters: ImportedChapter[] = [];
    let chapNum = 1;

    for (const idref of spineItems) {
      const manifestItem = manifestItems.find((it) => it.id === idref);
      if (!manifestItem) continue;

      const fullHref = (opfDir + manifestItem.href).replace(/^\//, '');
      const fileInZip = zipData.file(fullHref) || zipData.file(manifestItem.href);
      if (!fileInZip) continue;

      const htmlContent = await fileInZip.async('text');
      const { title: extractedTitle, content } = extractTextFromHtml(htmlContent);

      // Bỏ qua các file rỗng hoặc chỉ chứa trang bìa
      if (content.length < 40 && !extractedTitle) continue;

      const chapterTitle = extractedTitle || `Chương ${chapNum}`;
      const cleaned = cleanChapterContent(content || '');
      chapters.push({
        id: `chap-${chapNum}`,
        number: chapNum,
        title: chapterTitle,
        content: cleaned || 'Nội dung chương đang được cập nhật.',
        wordCount: cleaned.split(/\s+/).length,
      });
      chapNum++;
    }

    const slug = `${generateSlug(title)}-${Date.now().toString(36).slice(-4)}`;

    return {
      id: `epub-${Date.now()}`,
      slug,
      title,
      author,
      description: description || `Bộ sách điện tử EPUB với ${chapters.length} chương.`,
      coverUrl,
      categories: ['Sách Tự Nhập', 'Sách EPUB'],
      sourceType: 'file_epub',
      chaptersCount: chapters.length,
      chapters,
      importedAt: Date.now(),
      lastReadChapter: 1,
    };
  } catch (err: any) {
    console.error('Lỗi khi đọc file EPUB:', err);
    throw new Error(err.message || 'Không thể trích xuất nội dung từ file EPUB này.');
  }
}
