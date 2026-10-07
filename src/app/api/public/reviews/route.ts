import { NextRequest, NextResponse } from 'next/server';
import { getPublicReviewPage } from '@/lib/services/publicContentService';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const createdAt = request.nextUrl.searchParams.get('created_at');
  const id = request.nextUrl.searchParams.get('id');
  const validId = Boolean(id && /^[0-9a-f-]{36}$/i.test(id));
  const parsedDate = createdAt ? new Date(createdAt) : null;
  const cursor = id && validId && parsedDate && !Number.isNaN(parsedDate.getTime())
    ? { created_at: parsedDate.toISOString(), id }
    : null;
  const page = await getPublicReviewPage(cursor, 12);
  return NextResponse.json(page, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
