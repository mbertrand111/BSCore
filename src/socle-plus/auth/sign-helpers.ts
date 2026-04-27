import { cookies } from 'next/headers'
import { logger } from '@/socle/logger'
import { toAppError } from '@/socle/errors'
import { createSupabaseServerClient } from './supabase-client'
import type { CookieStore, SignInResult } from './auth.types'

async function buildCookieStore(): Promise<CookieStore> {
  const store = await cookies()
  return {
    getAll: () => store.getAll(),
    setAll: (cookiesToSet) => {
      // Attempt to write session cookies back to the response.
      // This succeeds in Server Actions and Route Handlers; in Server Components
      // cookies() is read-only, so the write is silently skipped.
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          ;(store as unknown as { set: (n: string, v: string, o: unknown) => void }).set(
            name,
            value,
            options,
          )
        })
      } catch {
        // Read-only context (Server Component) — session update will be picked
        // up on the next request via the middleware cookie store.
      }
    },
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const cookieStore = await buildCookieStore()
    const supabase = createSupabaseServerClient(cookieStore)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Return a generic message — never expose raw Supabase error details to callers
      return { error: 'Invalid email or password' }
    }

    return { error: null }
  } catch (error) {
    const appError = toAppError(error)
    logger.error('[auth] signIn failed unexpectedly', {
      code: appError.code,
      message: appError.message,
    })
    return { error: 'Authentication failed. Please try again.' }
  }
}

export async function signOut(): Promise<void> {
  try {
    const cookieStore = await buildCookieStore()
    const supabase = createSupabaseServerClient(cookieStore)
    await supabase.auth.signOut()
  } catch (error) {
    const appError = toAppError(error)
    logger.error('[auth] signOut failed unexpectedly', {
      code: appError.code,
      message: appError.message,
    })
    // Do not throw — a failed signOut from Supabase's side is not critical;
    // the session will expire naturally.
  }
}
