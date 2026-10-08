import type { PublicReviewCursor } from '@/types';

export function getReviewPageCursor(rows: Array<{ created_at: string; id: string }>, limit: number): PublicReviewCursor | null {
  if (rows.length !== limit || !rows.length) return null;
  const last = rows[rows.length - 1];
  return { created_at: String(last.created_at), id: String(last.id) };
}
