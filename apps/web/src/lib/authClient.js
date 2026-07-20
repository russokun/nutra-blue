import { supabase } from '@/lib/dataClient';
import { createAuthClient } from '@nutrablue/shared';

export const { getAccessToken, isSupabaseAuthAvailable } = createAuthClient(() => supabase);
