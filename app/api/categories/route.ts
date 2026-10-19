import { NextResponse } from 'next/server';
import { POPULAR_CATEGORIES } from '@/lib/scraper';

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: POPULAR_CATEGORIES,
  });
}
