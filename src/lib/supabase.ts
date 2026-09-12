import { createClient } from '@supabase/supabase-js';

// Project credentials provided by the user
export const SUPABASE_PROJECT_ID = 'jvghdtlfwijbkhwwpdft';

const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

export const SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cBMsOY7opCsD2IXylZn43Q_eOJCGiCh';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
