// Types
export type { AuthUser, AuthenticatedUser, UserRole, SignInResult, CookieStore } from './auth.types'

// Supabase client factory — isolated here, never imported directly by modules or client code
export { createSupabaseServerClient } from './supabase-client'

// Auth middleware — add to the Socle pipeline to populate ctx.meta['socle.user']
export { authMiddleware } from './auth-middleware'

// Typed context accessors — always use these instead of reading ctx.meta directly
export { getAuthUser, requireAuthUser } from './auth-middleware'

// Server-side action helpers — call from Server Actions or Route Handlers only
export { signIn, signOut } from './sign-helpers'

// Role repository — for role management (admin shell, user provisioning scripts)
export { getUserRole, setUserRole } from './user-roles-repository'
