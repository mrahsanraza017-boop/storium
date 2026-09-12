import type { SupabaseClient } from '@supabase/supabase-js';

// Project credentials provided by the user
export const SUPABASE_PROJECT_ID = 'jvghdtlfwijbkhwwpdft';

const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

export const SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cBMsOY7opCsD2IXylZn43Q_eOJCGiCh';

// Lazy singleton: the supabase-js runtime is dynamically imported on first use so
// it stays out of the initial bundle and off the mobile critical path.
let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }),
    );
  }
  return clientPromise;
}