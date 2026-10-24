import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storySlug, chapterNumber } = body;

    // Trong tương lai, lưu vào database Supabase bảng reading_progress
    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      storySlug,
      chapterNumber,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Không thể đồng bộ' }, { status: 500 });
  }
}
