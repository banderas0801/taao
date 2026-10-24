import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'html-entities';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'truyen-crawl-' + Date.now().toString(36);
}

// Làm sạch HTML văn bản thành các đoạn văn
function cleanHtmlText(html: string): string {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();

  return decode(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url?.trim();

    if (!rawUrl || !rawUrl.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Đường dẫn liên kết không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://' },
        { status: 400 }
      );
    }

    const targetUrl = new URL(rawUrl);

    // Cầu nối thông minh: Nếu là đường link dự án từ Mặc Canh Studio
    if (targetUrl.pathname.includes('/projects/')) {
      const match = targetUrl.pathname.match(/\/projects\/([^/]+)/);
      if (match && match[1]) {
        const projId = match[1];
        const exportUrl = `${targetUrl.origin}/api/v1/projects/${projId}/export-taao`;
        try {
          const mcRes = await fetch(exportUrl, { signal: AbortSignal.timeout(8000) });
          if (mcRes.ok) {
            const mcData = await mcRes.json();
            if (mcData && mcData.success && mcData.story) {
              return NextResponse.json({
                success: true,
                story: mcData.story
              });
            }
          }
        } catch (_) {}
      }
    }

    // Tải HTML trang truyện
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Không thể kết nối đến trang web (Mã phản hồi HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // 1. Trích xuất Tiêu đề truyện
    let title = '';
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitle && ogTitle[1]) {
      title = ogTitle[1];
    } else {
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1 && h1[1]) {
        title = h1[1].replace(/<[^>]+>/g, '').trim();
      } else {
        const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleTag && titleTag[1]) {
          title = titleTag[1].split(/[-–|]/)[0].trim();
        }
      }
    }
    title = decode(title.replace(/\s+/g, ' ').trim());

    // 2. Trích xuất Tác giả
    let author = 'Đang cập nhật';
    const authorMatch =
      html.match(/tác giả[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i) ||
      html.match(/author[:\s]*<[^>]*>([^<]+)<\/[^>]*>/i) ||
      html.match(/<a[^>]*rel=["']author["'][^>]*>([^<]+)<\/a>/i);
    if (authorMatch && authorMatch[1].trim()) {
      author = decode(authorMatch[1].trim());
    }

    // 3. Trích xuất Ảnh bìa
    let coverUrl = '';
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImage && ogImage[1]) {
      coverUrl = ogImage[1].trim();
    } else {
      const imgMatch = html.match(/<img[^>]*class=["'][^"']*(?:book-cover|cover|thumb|poster)[^"']*["'][^>]*src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        coverUrl = imgMatch[1].trim();
      }
    }

    if (coverUrl && !coverUrl.startsWith('http')) {
      coverUrl = new URL(coverUrl, targetUrl.origin).href;
    }

    // 4. Trích xuất Giới thiệu truyện
    let description = '';
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDesc && ogDesc[1]) {
      description = ogDesc[1].trim();
    } else {
      const descMatch = html.match(/<div[^>]*class=["'][^"']*(?:desc|intro|summary|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (descMatch && descMatch[1]) {
        description = cleanHtmlText(descMatch[1]).substring(0, 500);
      }
    }
    description = decode(description.replace(/\s+/g, ' ').trim());

    // 5. Trích xuất danh sách chương (Chapter Links)
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    const foundChapters: { title: string; url: string; number: number }[] = [];
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].trim();
      const linkText = decode(match[2].replace(/<[^>]+>/g, '').trim());

      // Nhận diện link chương qua URL hoặc nội dung text
      const isChapterLink =
        /(chuong|chap|hoi|tiet|chapter)[-_/.]*\d+/i.test(href) ||
        /^(Chương|Hồi|Tiết|Chap|Chapter)\s*\d+/i.test(linkText);

      if (isChapterLink && !seenUrls.has(href)) {
        seenUrls.add(href);
        const fullChapterUrl = href.startsWith('http') ? href : new URL(href, targetUrl.origin).href;
        
        // Trích xuất số chương
        const numMatch = linkText.match(/\d+/) || href.match(/(?:chuong|chap|chapter)[-_]*(\d+)/i);
        const chapterNumber = numMatch ? parseInt(numMatch[1] || numMatch[0], 10) : foundChapters.length + 1;

        foundChapters.push({
          number: chapterNumber,
          title: linkText || `Chương ${chapterNumber}`,
          url: fullChapterUrl,
        });
      }
    }

    // Sắp xếp theo số chương
    foundChapters.sort((a, b) => a.number - b.number);

    // Nếu không tìm thấy chương qua regex, tạo ít nhất 1 chương mẫu từ nội dung trang
    if (foundChapters.length === 0) {
      foundChapters.push({
        number: 1,
        title: 'Chương 1',
        url: rawUrl,
      });
    }

    // 6. Tải trước nội dung chương 1 để người dùng có thể đọc & nghe TTS ngay lập tức
    let chapter1Content = '';
    try {
      const firstChapUrl = foundChapters[0].url;
      const chapRes = await fetch(firstChapUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (chapRes.ok) {
        const chapHtml = await chapRes.text();
        // Tìm khối nội dung truyện
        const contentMatch =
          chapHtml.match(/<div[^>]*id=["']chapter-c["'][^>]*>([\s\S]*?)<\/div>/i) ||
          chapHtml.match(/<div[^>]*class=["'][^"']*(?:chapter-c|chapter-content|reading-content|story-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
          chapHtml.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i);

        if (contentMatch && contentMatch[1]) {
          chapter1Content = cleanHtmlText(contentMatch[1]);
        }
      }
    } catch (e) {
      console.warn('Không thể nạp trước chương 1:', e);
    }

    const slug = `${generateSlug(title || 'truyen-import')}-${Date.now().toString(36).slice(-4)}`;

    const chapters = foundChapters.map((c, idx) => ({
      id: `chap-${c.number}`,
      number: c.number,
      title: c.title,
      content: idx === 0 ? chapter1Content : '', // Chương 1 có sẵn, các chương sau tải On-Demand
      wordCount: idx === 0 ? chapter1Content.split(/\s+/).length : 0,
      url: c.url,
    }));

    return NextResponse.json({
      success: true,
      story: {
        id: `crawl-${Date.now()}`,
        slug,
        title: title || 'Truyện Nhập Từ Web',
        author: author || 'Khuyết Danh',
        description: description || 'Truyện được phân tích và nhập tự động từ đường dẫn trang web bên ngoài.',
        coverUrl: coverUrl || '/covers/default.png',
        categories: ['Sách Tự Nhập', 'Web Importer'],
        sourceType: 'url_crawl',
        sourceUrl: rawUrl,
        chaptersCount: chapters.length,
        chapters,
        importedAt: Date.now(),
        lastReadChapter: 1,
      },
    });
  } catch (error: any) {
    console.error('Lỗi API import URL:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi phân tích liên kết truyện' },
      { status: 500 }
    );
  }
}
