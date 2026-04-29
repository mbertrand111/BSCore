'use client'

import type React from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input, Textarea } from '@/shared/ui/primitives'
import { FormLayout, FormField } from '@/shared/ui/patterns'
import { uploadMediaAction } from '../admin/actions'
import { MEDIA_UPLOAD_INITIAL_STATE, type MediaUploadFormState } from '../admin/state'
import { ALLOWED_MIME_TYPES, MAX_SIZE_BYTES } from '../constants'

const ACCEPT = ALLOWED_MIME_TYPES.join(',')

/**
 * Upload form — file picker + alt text + submit.
 * Posts via Server Action `uploadMediaAction` which validates, stores,
 * and persists in DB.
 */
export function MediaUploadForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<MediaUploadFormState, FormData>(
    uploadMediaAction,
    MEDIA_UPLOAD_INITIAL_STATE,
  )

  const errFile = state.fieldErrors?.file
  const errAlt = state.fieldErrors?.altText
  const altDefault = state.values?.altText ?? ''

  return (
    <FormLayout
      action={formAction}
      noValidate
      // FormData with file uploads requires multipart encoding.
      encType="multipart/form-data"
      globalError={state.error !== null ? state.error : undefined}
    >
      <FormField
        label="File"
        htmlFor="media-file"
        required
        hint={`Allowed: ${ALLOWED_MIME_TYPES.map((m) => m.replace('image/', '')).join(', ')}. Max ${formatMb(MAX_SIZE_BYTES)}.`}
        {...(errFile !== undefined ? { error: errFile } : {})}
      >
        <Input
          id="media-file"
          name="file"
          type="file"
          accept={ACCEPT}
          required
          state={errFile !== undefined ? 'error' : 'default'}
          disabled={isPending}
          data-testid="media-upload-file"
        />
      </FormField>

      <FormField
        label="Alt text"
        htmlFor="media-alt"
        hint="Describe the image for screen readers and search engines. Optional but strongly recommended."
        {...(errAlt !== undefined ? { error: errAlt } : {})}
      >
        <Textarea
          id="media-alt"
          name="altText"
          defaultValue={altDefault}
          maxLength={500}
          rows={2}
          state={errAlt !== undefined ? 'error' : 'default'}
          disabled={isPending}
          data-testid="media-upload-alt"
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/media"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors duration-base hover:bg-muted"
        >
          Cancel
        </Link>
        <Button
          intent="primary"
          type="submit"
          loading={isPending}
          data-testid="media-upload-submit"
        >
          Upload
        </Button>
      </div>
    </FormLayout>
  )
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}
