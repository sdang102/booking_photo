const MISSING_SUPABASE_ENV_MESSAGE =
  'Thiếu cấu hình Supabase. Hãy khai báo NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.';

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(MISSING_SUPABASE_ENV_MESSAGE);
  }

  return { url, anonKey };
}
