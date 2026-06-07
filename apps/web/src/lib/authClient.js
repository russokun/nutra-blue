import { supabase } from '@/lib/dataClient';

export async function getAccessToken() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function isSupabaseAuthAvailable() {
  return !!supabase;
}
