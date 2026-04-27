import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/socle/config/env'
import type { CookieStore } from './auth.types'

export function createSupabaseServerClient(cookies: CookieStore): SupabaseClient {
  const url = getEnv('SUPABASE_URL')
  const anonKey = getEnv('SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY are required for Socle+ auth. ' +
        'Set them in .env or remove auth imports for Socle-only projects.',
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet, headers) => cookies.setAll(cookiesToSet, headers),
    },
  })
}
