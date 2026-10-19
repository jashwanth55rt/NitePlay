import { NextRequest, NextResponse } from 'next/server';
import { isAllowedExternalUrl, ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_PROXY_BYTES } from '@/lib/security';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl || !isAllowedExternalUrl(rawUrl)) {
    return new NextResponse('Invalid or unauthorized image URL', { status: 400 });
  }

  try {
    const upstreamRes = await fetch(rawUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://xhamster.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });

    if (!upstreamRes.ok) {
      return new NextResponse('Failed to fetch upstream image', {
        status: upstreamRes.status,
      });
    }

    const rawContentType = (upstreamRes.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(rawContentType)) {
      return new NextResponse('Disallowed media type', { status: 415 });
    }

    // Check content-length header if provided
    const contentLength = parseInt(upstreamRes.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_PROXY_BYTES) {
      return new NextResponse('Image size exceeds limit', { status: 413 });
    }

    const buffer = await upstreamRes.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_PROXY_BYTES) {
      return new NextResponse('Image payload too large', { status: 413 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': rawContentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return new NextResponse('Upstream image fetch timeout', { status: 504 });
    }
    console.error('Image proxy error:', err);
    return new NextResponse('Internal error fetching image', { status: 502 });
  }
}

