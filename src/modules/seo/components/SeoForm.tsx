'use client'

import type React from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Input, Textarea, Switch } from '@/shared/ui/primitives'
import { FormLayout, FormField } from '@/shared/ui/patterns'
import {
  createSeoEntryAction,
  updateSeoEntryAction,
} from '../admin/actions'
import { SEO_FORM_INITIAL_STATE, type SeoFormState } from '../admin/state'
import type { SeoEntry } from '../data/repository'

export interface SeoFormProps {
  mode: 'create' | 'edit'
  /** Required when mode === 'edit'. */
  entry?: SeoEntry
}

/**
 * SEO entry form — used for both create and edit.
 *
 * Submit goes through a Server Action (createSeoEntryAction or
 * updateSeoEntryAction). Validation errors are returned in state and
 * displayed inline. Success redirects to /admin/seo.
 *
 * Form values are preserved on validation failure via `state.values`
 * (echoed back from the action).
 */
export function SeoForm({ mode, entry }: SeoFormProps): React.JSX.Element {
  const action =
    mode === 'create'
      ? createSeoEntryAction
      : updateSeoEntryAction.bind(null, entry?.id ?? '')

  const [state, formAction, isPending] = useActionState<SeoFormState, FormData>(
    action,
    SEO_FORM_INITIAL_STATE,
  )

  // Resolve initial values: state.values (after a failed submit) → entry (edit) → empty (create).
  const v = state.values ?? {}
  const initial = {
    route: stringValue(v.route, entry?.route, ''),
    title: stringValue(v.title, entry?.title, ''),
    description: stringValue(v.description, entry?.description, ''),
    canonicalUrl: stringValue(v.canonicalUrl, entry?.canonicalUrl, ''),
    robotsIndex: boolValue(v.robotsIndex, entry?.robotsIndex, true),
    robotsFollow: boolValue(v.robotsFollow, entry?.robotsFollow, true),
    ogTitle: stringValue(v.ogTitle, entry?.ogTitle, ''),
    ogDescription: stringValue(v.ogDescription, entry?.ogDescription, ''),
    ogImageUrl: stringValue(v.ogImageUrl, entry?.ogImageUrl, ''),
    twitterTitle: stringValue(v.twitterTitle, entry?.twitterTitle, ''),
    twitterDescription: stringValue(v.twitterDescription, entry?.twitterDescription, ''),
    twitterImageUrl: stringValue(v.twitterImageUrl, entry?.twitterImageUrl, ''),
  }

  // Extract each error as a const so TypeScript narrows correctly through the
  // conditional spread used below (function-call narrowing is not preserved).
  const errRoute = state.fieldErrors?.route
  const errTitle = state.fieldErrors?.title
  const errDescription = state.fieldErrors?.description
  const errCanonical = state.fieldErrors?.canonicalUrl
  const errOgTitle = state.fieldErrors?.ogTitle
  const errOgDescription = state.fieldErrors?.ogDescription
  const errOgImage = state.fieldErrors?.ogImageUrl
  const errTwTitle = state.fieldErrors?.twitterTitle
  const errTwDescription = state.fieldErrors?.twitterDescription
  const errTwImage = state.fieldErrors?.twitterImageUrl

  return (
    <FormLayout
      action={formAction}
      noValidate
      globalError={state.error !== null ? state.error : undefined}
    >
      {/* Route */}
      <FormField
        label="Route"
        htmlFor="seo-route"
        required
        hint="Path on your site, e.g. /about. No query parameters."
        {...(errRoute !== undefined ? { error: errRoute } : {})}
      >
        <Input
          id="seo-route"
          name="route"
          defaultValue={initial.route}
          placeholder="/about"
          state={errRoute !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="seo-form-route"
        />
      </FormField>

      {/* Title */}
      <FormField
        label="Title"
        htmlFor="seo-title"
        required
        hint="Max 70 characters. Shown in browser tabs and search results."
        {...(errTitle !== undefined ? { error: errTitle } : {})}
      >
        <Input
          id="seo-title"
          name="title"
          defaultValue={initial.title}
          maxLength={70}
          state={errTitle !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="seo-form-title"
        />
      </FormField>

      {/* Description */}
      <FormField
        label="Description"
        htmlFor="seo-description"
        required
        hint="Max 160 characters. Shown under the title in search results."
        {...(errDescription !== undefined ? { error: errDescription } : {})}
      >
        <Textarea
          id="seo-description"
          name="description"
          defaultValue={initial.description}
          maxLength={160}
          rows={3}
          state={errDescription !== undefined ? 'error' : 'default'}
          disabled={isPending}
          required
          data-testid="seo-form-description"
        />
      </FormField>

      {/* Canonical */}
      <FormField
        label="Canonical URL"
        htmlFor="seo-canonical"
        hint="Optional. Absolute URL (https://...). Leave empty to default to the page URL."
        {...(errCanonical !== undefined ? { error: errCanonical } : {})}
      >
        <Input
          id="seo-canonical"
          name="canonicalUrl"
          type="url"
          defaultValue={initial.canonicalUrl}
          placeholder="https://example.com/about"
          state={errCanonical !== undefined ? 'error' : 'default'}
          disabled={isPending}
        />
      </FormField>

      {/* Robots */}
      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-2 text-sm font-medium text-foreground">Robots</legend>
        <Switch
          name="robotsIndex"
          defaultChecked={initial.robotsIndex}
          disabled={isPending}
          label="Allow search engines to index this page"
        />
        <Switch
          name="robotsFollow"
          defaultChecked={initial.robotsFollow}
          disabled={isPending}
          label="Allow search engines to follow links on this page"
        />
      </fieldset>

      {/* Open Graph */}
      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-2 text-sm font-medium text-foreground">Open Graph (social shares)</legend>

        <FormField
          label="OG title"
          htmlFor="seo-og-title"
          hint="Optional. Falls back to the page title."
          {...(errOgTitle !== undefined ? { error: errOgTitle } : {})}
        >
          <Input
            id="seo-og-title"
            name="ogTitle"
            defaultValue={initial.ogTitle}
            maxLength={70}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="OG description"
          htmlFor="seo-og-description"
          hint="Optional. Falls back to the page description."
          {...(errOgDescription !== undefined ? { error: errOgDescription } : {})}
        >
          <Textarea
            id="seo-og-description"
            name="ogDescription"
            defaultValue={initial.ogDescription}
            maxLength={200}
            rows={2}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="OG image URL"
          htmlFor="seo-og-image"
          hint="Absolute URL or relative path (/...). Recommended 1200×630."
          {...(errOgImage !== undefined ? { error: errOgImage } : {})}
        >
          <Input
            id="seo-og-image"
            name="ogImageUrl"
            defaultValue={initial.ogImageUrl}
            placeholder="https://example.com/og.png  or  /og.png"
            disabled={isPending}
          />
        </FormField>
      </fieldset>

      {/* Twitter */}
      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-2 text-sm font-medium text-foreground">Twitter / X</legend>

        <FormField
          label="Twitter title"
          htmlFor="seo-tw-title"
          hint="Optional. Falls back to the page title."
          {...(errTwTitle !== undefined ? { error: errTwTitle } : {})}
        >
          <Input
            id="seo-tw-title"
            name="twitterTitle"
            defaultValue={initial.twitterTitle}
            maxLength={70}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="Twitter description"
          htmlFor="seo-tw-description"
          hint="Optional. Falls back to the page description."
          {...(errTwDescription !== undefined
            ? { error: errTwDescription }
            : {})}
        >
          <Textarea
            id="seo-tw-description"
            name="twitterDescription"
            defaultValue={initial.twitterDescription}
            maxLength={200}
            rows={2}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label="Twitter image URL"
          htmlFor="seo-tw-image"
          hint="Absolute URL or relative path (/...)."
          {...(errTwImage !== undefined
            ? { error: errTwImage }
            : {})}
        >
          <Input
            id="seo-tw-image"
            name="twitterImageUrl"
            defaultValue={initial.twitterImageUrl}
            placeholder="https://example.com/twitter.png  or  /twitter.png"
            disabled={isPending}
          />
        </FormField>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/seo"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors duration-base hover:bg-muted"
        >
          Cancel
        </Link>
        <Button
          intent="primary"
          type="submit"
          loading={isPending}
          data-testid="seo-form-submit"
        >
          {mode === 'create' ? 'Create entry' : 'Save changes'}
        </Button>
      </div>
    </FormLayout>
  )
}

// ---------------------------------------------------------------------------
// Helpers — coerce echoed `unknown` from FormData back into typed initial values
// ---------------------------------------------------------------------------

function stringValue(echoed: unknown, fromEntry: string | null | undefined, fallback: string): string {
  if (typeof echoed === 'string') return echoed
  if (typeof fromEntry === 'string') return fromEntry
  return fallback
}

function boolValue(echoed: unknown, fromEntry: boolean | undefined, fallback: boolean): boolean {
  if (typeof echoed === 'boolean') return echoed
  if (typeof fromEntry === 'boolean') return fromEntry
  return fallback
}
