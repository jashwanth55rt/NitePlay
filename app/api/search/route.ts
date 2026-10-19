import { NextRequest, NextResponse } from 'next/server';
import { searchVideosScraper } from '@/lib/scraper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;
    const sortBy = (searchParams.get('sort') || searchParams.get('sortBy') || undefined) as any;
    const quality = (searchParams.get('quality') || undefined) as any;
    const minDuration = (searchParams.get('minDuration') || undefined) as any;
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = await searchVideosScraper({
      query,
      category,
      sortBy,
      quality,
      minDuration,
      page,
    });

    return NextResponse.json({
      success: true,
      query: query || '',
      category: category || '',
      page: result.page,
      total: result.total,
      videos: result.videos,
    });
  } catch (err: any) {
    console.error('API /api/search error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Search failed' },
      { status: 500 }
    );
  }
}
