/**
 * Reducer state for the SEO admin form.
 * Lives outside actions.ts because Next.js forbids non-async exports from
 * a `'use server'` file.
 */
export interface SeoFormState {
  /** Global error message (generic / unexpected failure). */
  error: string | null
  /** Field-level inline errors, keyed by form field name. */
  fieldErrors?: Record<string, string>
  /** Echoed form values so the form preserves state across re-renders. */
  values?: Record<string, unknown>
}

export const SEO_FORM_INITIAL_STATE: SeoFormState = { error: null }
