/**
 * Shape of the login form's reducer state.
 * Kept in its own module because Next.js forbids non-async exports from a
 * file marked `'use server'` (see actions.ts).
 */
export interface LoginFormState {
  error: string | null
  fieldErrors?: {
    email?: string
    password?: string
  }
  email?: string
}

export const LOGIN_INITIAL_STATE: LoginFormState = { error: null }
