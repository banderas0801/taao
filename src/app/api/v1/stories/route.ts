import { NextRequest, NextResponse } from 'next/server';
import { loadStorySummaries } from '@/lib/storyDataService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const category = searchParams.get('category') || 'all';
    const query = (searchParams.get('q') || searchParams.get('search') || '').trim().toLowerCase();
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'views';
    const order = searchParams.get('order') || 'desc';

    let list = [...loadStorySummaries()];

    // 1. Filter by category
    if (category && category !== 'all' && category !== 'Tất cả') {
      list = list.filter((s) => s.categories && s.categories.some((c) => c.toLowerCase() === category.toLowerCase()));
    }

    // 2. Filter by status
    if (status && status !== 'all') {
      list = list.filter((s) => s.status === status);
    }

    // 3. Search by query
    if (query) {
      list = list.filter((s) => {
        const titleMatch = s.title?.toLowerCase().includes(query);
        const authorMatch = s.author?.toLowerCase().includes(query);
        const descMatch = s.description?.toLowerCase().includes(query);
        return titleMatch || authorMatch || descMatch;
      });
    }

    // 4. Sort
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === 'views') {
        valA = a.views || 0;
        valB = b.views || 0;
      } else if (sortBy === 'rating') {
        valA = a.rating || 0;
        valB = b.rating || 0;
      } else if (sortBy === 'chapters') {
        valA = a.chaptersCount || 0;
        valB = b.chaptersCount || 0;
      } else if (sortBy === 'updated') {
        valA = new Date(a.updatedAt || 0).getTime();
        valB = new Date(b.updatedAt || 0).getTime();
      }

      if (order === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    // 5. Pagination
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = list.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: paginatedData,
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/stories:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
