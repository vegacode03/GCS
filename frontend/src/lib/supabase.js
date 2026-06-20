import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso amigavel em dev caso o .env.local nao esteja preenchido
  console.warn(
    '[GCS] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Preencha o arquivo frontend/.env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
