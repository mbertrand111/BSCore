/**
 * Reducer state for the media admin forms.
 * Lives outside actions.ts because Next.js forbids non-async exports
 * from a `'use server'` file.
 */

export interface MediaUploadFormState {
  error: string | null
  fieldErrors?: { file?: string; altText?: string }
  values?: { altText?: string }
}

export interface MediaEditAltFormState {
  error: string | null
  fieldErrors?: { altText?: string }
  values?: { altText?: string }
}

export const MEDIA_UPLOAD_INITIAL_STATE: MediaUploadFormState = { error: null }
export const MEDIA_EDIT_ALT_INITIAL_STATE: MediaEditAltFormState = { error: null }
