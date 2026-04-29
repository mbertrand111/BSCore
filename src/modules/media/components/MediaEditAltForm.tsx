'use client'

import type React from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Textarea } from '@/shared/ui/primitives'
import { FormLayout, FormField } from '@/shared/ui/patterns'
import { updateMediaAltTextAction } from '../admin/actions'
import { MEDIA_EDIT_ALT_INITIAL_STATE, type MediaEditAltFormState } from '../admin/state'
import type { MediaAsset } from '../data/repository'

export interface MediaEditAltFormProps {
  asset: MediaAsset
}

export function MediaEditAltForm({ asset }: MediaEditAltFormProps): React.JSX.Element {
  const action = updateMediaAltTextAction.bind(null, asset.id)
  const [state, formAction, isPending] = useActionState<MediaEditAltFormState, FormData>(
    action,
    MEDIA_EDIT_ALT_INITIAL_STATE,
  )

  const errAlt = state.fieldErrors?.altText
  const initialValue = state.values?.altText ?? asset.altText

  return (
    <FormLayout
      action={formAction}
      noValidate
      globalError={state.error !== null ? state.error : undefined}
    >
      <FormField
        label="Alt text"
        htmlFor="media-edit-alt"
        hint="Describe the image for screen readers and search engines."
        {...(errAlt !== undefined ? { error: errAlt } : {})}
      >
        <Textarea
          id="media-edit-alt"
          name="altText"
          defaultValue={initialValue}
          maxLength={500}
          rows={3}
          state={errAlt !== undefined ? 'error' : 'default'}
          disabled={isPending}
          data-testid="media-edit-alt"
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
          data-testid="media-edit-submit"
        >
          Save changes
        </Button>
      </div>
    </FormLayout>
  )
}
