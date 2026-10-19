import { NextRequest, NextResponse } from 'next/server';
import { fetchVideos } from '@/lib/scraper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'home') as 'home' | 'trending' | 'newest' | 'best' | 'category';
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    const videos = await fetchVideos({ type, category, page });

    return NextResponse.json({
      success: true,
      type,
      category,
      page,
      count: videos.length,
      videos,
    });
  } catch (err: any) {
    console.error('API /api/videos error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load videos' },
      { status: 500 }
    );
  }
}
