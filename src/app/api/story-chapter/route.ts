import { NextRequest, NextResponse } from 'next/server';
import { getChapter, NOVEL_MAPPING } from '@/lib/novelChapterProvider';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const chapterStr = searchParams.get('chapter');

    if (!slug || !chapterStr) {
      return NextResponse.json({ error: 'Missing slug or chapter parameter' }, { status: 400 });
    }

    const chapterNum = parseInt(chapterStr, 10);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 });
    }

    const chapter = await getChapter(slug, chapterNum);

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      chapter: {
        id: `chap-${chapterNum}`,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content
      }
    });
  } catch (error: any) {
    console.error('Error in /api/story-chapter:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
