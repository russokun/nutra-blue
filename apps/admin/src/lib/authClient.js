import { supabase } from '@/lib/dataClient';

export async function getAccessToken() {
  if (!supabase) {
    // Fallback: use mock token stored by AuthContext when Supabase is not configured
    return localStorage.getItem('sb-auth-token') || null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function isSupabaseAuthAvailable() {
  return !!supabase;
}
