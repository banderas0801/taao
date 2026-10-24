import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'html-entities';
import { cleanChapterContent } from '@/lib/bookTextCleaner';

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

  return cleanChapterContent(decode(text));
}

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get('url');

    if (!rawUrl || !rawUrl.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Thiếu hoặc sai tham số url' },
        { status: 400 }
      );
    }

    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Không thể tải nội dung chương (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Tìm tiêu đề chương
    let title = '';
    const titleMatch =
      html.match(/<h2[^>]*class=["'][^"']*(?:chapter-title|title)[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i) ||
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      title = decode(titleMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    // Tìm khối nội dung
    const contentMatch =
      html.match(/<div[^>]*id=["']chapter-c["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<div[^>]*class=["'][^"']*(?:chapter-c|chapter-content|reading-content|story-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i);

    let content = '';
    if (contentMatch && contentMatch[1]) {
      content = cleanHtmlText(contentMatch[1]);
    } else {
      content = cleanHtmlText(html).substring(0, 3000);
    }

    return NextResponse.json({
      success: true,
      title,
      content,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải chương truyện' },
      { status: 500 }
    );
  }
}
