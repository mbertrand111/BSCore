/**
 * Reducer state for the CMS admin form.
 * Lives outside actions.ts because Next.js forbids non-async exports
 * from a `'use server'` file.
 */

export interface CmsFormState {
  error: string | null
  fieldErrors?: Record<string, string>
  values?: Record<string, unknown>
}

export const CMS_FORM_INITIAL_STATE: CmsFormState = { error: null }
