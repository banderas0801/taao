import { NextResponse } from 'next/server';
import { loadStorySummaries } from '@/lib/storyDataService';

export async function GET() {
  try {
    const stories = loadStorySummaries();
    const countMap: Record<string, number> = {};

    for (const story of stories) {
      if (story.categories && Array.isArray(story.categories)) {
        for (const cat of story.categories) {
          const trimmed = cat.trim();
          if (trimmed) {
            countMap[trimmed] = (countMap[trimmed] || 0) + 1;
          }
        }
      }
    }

    const categories = Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      totalCategories: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/categories:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
