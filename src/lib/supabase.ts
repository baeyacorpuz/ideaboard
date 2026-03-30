import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to get or create a session ID for anonymous users
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('ideaboard_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('ideaboard_session_id', sessionId)
  }
  return sessionId
}