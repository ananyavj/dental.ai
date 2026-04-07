import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  url &&
  anonKey &&
  !url.includes('your_supabase_url_here') &&
  !anonKey.includes('your_supabase_anon_key_here')
)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
