import { NextRequest, NextResponse } from 'next/server';
import { getPublicAlbumImagePage } from '@/lib/services/publicContentService';

export const revalidate = 300;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawOffset = Number(request.nextUrl.searchParams.get('offset') ?? 0);
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? 18);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
  const limit = Number.isFinite(rawLimit) ? Math.min(18, Math.max(1, Math.floor(rawLimit))) : 18;
  const page = await getPublicAlbumImagePage(slug, offset, limit);
  return NextResponse.json(page, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
