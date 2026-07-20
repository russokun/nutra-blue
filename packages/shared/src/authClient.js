/**
 * Factory de authClient. Cada app le pasa un getter `() => supabase` (no el valor
 * directo) apuntando a su propia instancia de `supabase` (de su dataClient local),
 * para no forzar un dataClient unificado.
 *
 * Importante: se pide un getter y no el valor porque dataClient.js y authClient.js
 * se importan mutuamente en algunas apps; si se lee `supabase` en el momento de
 * evaluar el módulo (en vez de al llamar getAccessToken()), se puede pisar el
 * Temporal Dead Zone según el orden de resolución de imports de Vite/Rollup.
 *
 * `mockFallbackKey`: si se pasa, cuando no hay Supabase configurado se intenta
 * leer un token mock desde localStorage con esa key (lo usa el panel admin
 * para sesiones simuladas en desarrollo local).
 */
export function createAuthClient(getSupabase, { mockFallbackKey } = {}) {
  return {
    getAccessToken: async () => {
      const supabase = getSupabase();
      if (!supabase) {
        if (mockFallbackKey && typeof localStorage !== 'undefined') {
          return localStorage.getItem(mockFallbackKey) || null;
        }
        return null;
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    },
    isSupabaseAuthAvailable: () => !!getSupabase(),
  };
}
