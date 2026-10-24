import { NextRequest, NextResponse } from 'next/server';
import { loadStoryDetail } from '@/lib/storyDataService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Missing slug parameter' }, { status: 400 });
    }

    const storyData = loadStoryDetail(slug);
    if (!storyData) {
      return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const chapterPage = parseInt(searchParams.get('chapterPage') || '0', 10);
    const chapterLimit = parseInt(searchParams.get('chapterLimit') || '100', 10);

    let chapters = storyData.chapters;
    let chaptersPagination = undefined;

    if (chapterPage > 0) {
      const totalChapters = chapters.length;
      const totalChapterPages = Math.ceil(totalChapters / chapterLimit) || 1;
      const startIndex = (chapterPage - 1) * chapterLimit;
      chapters = chapters.slice(startIndex, startIndex + chapterLimit);
      chaptersPagination = {
        page: chapterPage,
        limit: chapterLimit,
        total: totalChapters,
        totalPages: totalChapterPages,
        hasNextPage: chapterPage < totalChapterPages,
        hasPrevPage: chapterPage > 1,
      };
    }

    return NextResponse.json({
      success: true,
      story: {
        ...storyData.summary,
        totalChapters: storyData.chapters.length,
        chapters,
        chaptersPagination,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/stories/[slug]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
