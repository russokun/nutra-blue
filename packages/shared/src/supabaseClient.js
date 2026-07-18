import { createClient } from '@supabase/supabase-js';

/**
 * Crea el cliente de Supabase para el frontend a partir de las variables de entorno
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Devuelve `supabase: null` si no están
 * configuradas (o si contienen los valores placeholder del .env.example), lo que
 * permite que cada app caiga a su flujo mock/API local.
 */
export function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const isSupabaseConfigured =
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('your-supabase-project') &&
    supabaseAnonKey !== 'your-anon-key';

  const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

  return { supabase, isSupabaseConfigured };
}
