import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/config/env'

/**
 * The anon key is safe in the browser: it only grants what Row Level Security
 * policies allow. The service_role key and every AI provider key must live in
 * Supabase Edge Function secrets instead (PRD section 8 + 9).
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
