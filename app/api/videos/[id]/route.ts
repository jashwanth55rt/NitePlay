import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/scraper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url') || undefined;

    const identifier = videoUrl || id;
    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Missing video ID or URL' }, { status: 400 });
    }

    const details = await getVideoDetails(identifier);
    if (!details) {
      return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      video: details,
    });
  } catch (err: any) {
    console.error('API /api/videos/[id] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch video details' },
      { status: 500 }
    );
  }
}
