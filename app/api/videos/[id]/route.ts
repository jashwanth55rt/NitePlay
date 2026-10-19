import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/scraper';
import { isAllowedExternalUrl } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url') || undefined;

    // Security: Validate external URL against SSRF
    if (videoUrl) {
      if (!isAllowedExternalUrl(videoUrl)) {
        return NextResponse.json(
          { success: false, error: 'Disallowed or unsafe video URL' },
          { status: 400 }
        );
      }
    }

    // Sanitize identifier
    const identifier = videoUrl || id;
    if (!identifier || typeof identifier !== 'string') {
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

