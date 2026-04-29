'use client'

import type React from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@/shared/ui/primitives'
import { FormLayout, FormField } from '@/shared/ui/patterns'
import { createCmsPageAction, updateCmsPageAction } from '../admin/actions'
import { CMS_FORM_INITIAL_STATE, type CmsFormState } from '../admin/state'
import type { CmsPage } from '../data/repository'
import {
  MAX_CONTENT_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_SLUG_LENGTH,
  MAX_TITLE_LENGTH,
} from '../constants'

/**
 * Lightweight shape of the media options surfaced in the picker.
 * We accept any object with `id` + `originalFilename` so the page can
 * pass MediaAsset[] (or a derived list) without a tight coupling.
 */
export interface MediaOption {
  readonly id: string
  readonly originalFilename: string
}

export interface CmsPageFormProps {
  mode: 'create' | 'edit'
  /** Required for `edit` mode. */
  page?: CmsPage
  /** Available media assets — populates the main image picker. */
  mediaOptions: ReadonlyArray<MediaOption>
}

export function CmsPageForm({
  mode,
  page,
  mediaOptions,
}: CmsPageFormProps): React.JSX.Element {
  const action =
    mode === 'create'
      ? createCmsPageAction
      : updateCmsPageAction.bind(null, page?.id ?? '')

  const [state, formAction, isPending] = useActionState<CmsFormState, FormData>(
    action,
    CMS_FORM_INITIAL_STATE,
  )

  const v = state.values ?? {}
  const initial = {
    title: stringValue(v.title, page?.title, ''),
    slug: stringValue(v.slug, page?.slug, ''),
    excerpt: stringValue(v.excerpt, page?.excerpt, ''),
    content: stringValue(v.content, page?.content, ''),
    status: stringValue(v.status, page?.status, 'draft'),
    mainMediaAssetId: stringValue(v.mainMediaAssetId, page?.mainMediaAssetId, ''),
  }

  const errTitle = state.fieldErrors?.title
  const errSlug = state.fieldErrors?.slug
  const errExcerpt = state.fieldErrors?.excerpt
  const errContent = state.fieldErrors?.content
  const errStatus = state.fieldErrors?.status
  const errMedia = state.fieldErrors?.mainMediaAssetId

  return (
    <FormLayout
      action={formAction}
      noValidate
      globalError={state.error !== null ? state.error : undefined}
    >
      <FormField
        label="Title"
        htmlFor="cms-title"
        required
        hint={`Max ${MAX_TITLE_LENGTH} characters.`}
        {...(errTitle !== undefined ? { error: errTitle } : {})}
      >
        <Input
          id="cms-title"
          name="title"
          defaultValue={initial.title}
          maxLength={MAX_TITLE_LENGTH}
          state={errTitle !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="cms-form-title"
        />
      </FormField>

      <FormField
        label="Slug"
        htmlFor="cms-slug"
        required
        hint={`Lowercase letters, digits, hyphens. Max ${MAX_SLUG_LENGTH} characters.`}
        {...(errSlug !== undefined ? { error: errSlug } : {})}
      >
        <Input
          id="cms-slug"
          name="slug"
          defaultValue={initial.slug}
          maxLength={MAX_SLUG_LENGTH}
          placeholder="my-page"
          state={errSlug !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="cms-form-slug"
        />
      </FormField>

      <FormField
        label="Excerpt"
        htmlFor="cms-excerpt"
        hint={`Optional short summary. Max ${MAX_EXCERPT_LENGTH} characters.`}
        {...(errExcerpt !== undefined ? { error: errExcerpt } : {})}
      >
        <Textarea
          id="cms-excerpt"
          name="excerpt"
          defaultValue={initial.excerpt}
          maxLength={MAX_EXCERPT_LENGTH}
          rows={2}
          state={errExcerpt !== undefined ? 'error' : 'default'}
          disabled={isPending}
        />
      </FormField>

      <FormField
        label="Content"
        htmlFor="cms-content"
        required
        hint={`Plain text. Line breaks are preserved. Max ${MAX_CONTENT_LENGTH} characters.`}
        {...(errContent !== undefined ? { error: errContent } : {})}
      >
        <Textarea
          id="cms-content"
          name="content"
          defaultValue={initial.content}
          maxLength={MAX_CONTENT_LENGTH}
          rows={12}
          state={errContent !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="cms-form-content"
        />
      </FormField>

      <FormField
        label="Status"
        htmlFor="cms-status"
        required
        {...(errStatus !== undefined ? { error: errStatus } : {})}
      >
        <Select
          id="cms-status"
          name="status"
          defaultValue={initial.status}
          disabled={isPending}
          state={errStatus !== undefined ? 'error' : 'default'}
        >
          <SelectItem value="draft">Draft (not visible publicly)</SelectItem>
          <SelectItem value="published">Published (visible at /[slug])</SelectItem>
        </Select>
      </FormField>

      <FormField
        label="Main image"
        htmlFor="cms-media"
        hint={
          mediaOptions.length === 0
            ? 'No media assets uploaded yet. Upload one in Media first.'
            : 'Optional. Pick an asset uploaded via the Media module.'
        }
        {...(errMedia !== undefined ? { error: errMedia } : {})}
      >
        <Select
          id="cms-media"
          name="mainMediaAssetId"
          defaultValue={initial.mainMediaAssetId}
          placeholder="No image"
          disabled={isPending || mediaOptions.length === 0}
          state={errMedia !== undefined ? 'error' : 'default'}
        >
          <SelectItem value="">No image</SelectItem>
          {mediaOptions.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.originalFilename}
            </SelectItem>
          ))}
        </Select>
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/cms"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors duration-base hover:bg-muted"
        >
          Cancel
        </Link>
        <Button
          intent="primary"
          type="submit"
          loading={isPending}
          data-testid="cms-form-submit"
        >
          {mode === 'create' ? 'Create page' : 'Save changes'}
        </Button>
      </div>
    </FormLayout>
  )
}

function stringValue(
  echoed: unknown,
  fromEntry: string | null | undefined,
  fallback: string,
): string {
  if (typeof echoed === 'string') return echoed
  if (typeof fromEntry === 'string') return fromEntry
  return fallback
}
