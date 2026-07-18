/**
 * Factory de authClient. Cada app le pasa su propia instancia de `supabase`
 * (de su dataClient local) para no forzar un dataClient unificado.
 *
 * `mockFallbackKey`: si se pasa, cuando no hay Supabase configurado se intenta
 * leer un token mock desde localStorage con esa key (lo usa el panel admin
 * para sesiones simuladas en desarrollo local).
 */
export function createAuthClient(supabase, { mockFallbackKey } = {}) {
  return {
    getAccessToken: async () => {
      if (!supabase) {
        if (mockFallbackKey && typeof localStorage !== 'undefined') {
          return localStorage.getItem(mockFallbackKey) || null;
        }
        return null;
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    },
    isSupabaseAuthAvailable: () => !!supabase,
  };
}
