import { supabase } from '@/lib/dataClient';
import { createAuthClient } from '@nutrablue/shared';

// Fallback: usa el token mock guardado por AuthContext cuando Supabase no está configurado
export const { getAccessToken, isSupabaseAuthAvailable } = createAuthClient(supabase, {
  mockFallbackKey: 'sb-auth-token',
});
