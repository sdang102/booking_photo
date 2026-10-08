import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey?.trim()) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.');
  const { url } = getSupabasePublicEnv();

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
