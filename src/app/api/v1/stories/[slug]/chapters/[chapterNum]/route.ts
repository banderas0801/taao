import { NextRequest, NextResponse } from 'next/server';
import { loadStoryDetail, getChapterDetail } from '@/lib/storyDataService';
import { NOVEL_MAPPING } from '@/lib/novelChapterProvider';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; chapterNum: string }> }
) {
  try {
    const { slug, chapterNum: chapterNumStr } = await params;

    if (!slug || !chapterNumStr) {
      return NextResponse.json({ success: false, error: 'Missing slug or chapter number' }, { status: 400 });
    }

    const chapterNum = parseInt(chapterNumStr, 10);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json({ success: false, error: 'Invalid chapter number' }, { status: 400 });
    }

    const chapter = await getChapterDetail(slug, chapterNum);
    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
    }

    // Determine navigation metadata
    const storyDetail = loadStoryDetail(slug);
    const totalChapters = storyDetail?.chapters.length || NOVEL_MAPPING[slug]?.totalChapters || chapterNum;

    const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
    const nextChapter = chapterNum < totalChapters ? chapterNum + 1 : null;

    return NextResponse.json({
      success: true,
      storySlug: slug,
      chapter: {
        id: `chap-${chapterNum}`,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.content ? Math.round(chapter.content.length / 5) : 1500,
        isVip: false, // Default false or lookup if configured
        coinPrice: 0,
      },
      navigation: {
        prevChapter,
        nextChapter,
        currentChapter: chapterNum,
        totalChapters,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/stories/[slug]/chapters/[chapterNum]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
