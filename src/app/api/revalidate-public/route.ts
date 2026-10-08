import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: isAdmin, error } = await supabase.rpc('has_role', { required_role: 'admin' });
  if (error || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  revalidateTag('public-content', { expire: 0 });
  revalidatePath('/', 'layout');
  revalidatePath('/services');
  revalidatePath('/booking');
  return NextResponse.json({ ok: true });
}
