'use client'

import type React from 'react'
import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ChevronLeft,
  Eye,
  FileEdit,
  FileText,
  Globe,
  Settings as SettingsIcon,
  Send,
} from 'lucide-react'
import { Input, Textarea, Select, SelectItem } from '@/shared/ui/primitives'
import { FormField } from '@/shared/ui/patterns'
import type { MediaAsset } from '@/modules/media/data/repository'
import { createCmsPageAction, updateCmsPageAction } from '../admin/actions'
import { CMS_FORM_INITIAL_STATE, type CmsFormState } from '../admin/state'
import {
  blocksFromLegacyContent,
  deriveContentFromBlocks,
  type Block,
} from '../domain/blocks'
import type { CmsPage } from '../data/repository'
import {
  MAX_EXCERPT_LENGTH,
  MAX_SLUG_LENGTH,
  MAX_TITLE_LENGTH,
  NO_MEDIA_SENTINEL,
} from '../constants'
import { BlockList } from './blocks/BlockList'
import { CmsDeleteButton } from './CmsDeleteButton'

/**
 * /admin/cms/{new,id} editor — block-based content editor matching the
 * BSCore Backoffice maquette.
 *
 * Layout:
 *   - Sticky header flush to the AdminHeader: back link, title input, slug
 *     preview, status badge, Aperçu / Enregistrer / Publier buttons.
 *   - Main column: 4 tabs.
 *       Contenu  → BlockList (Hero / Texte / Galerie / CTA, reorder, etc.)
 *       SEO      → pointer to the SEO module
 *       Réglages → slug + status
 *       Historique → placeholder until module ships
 *   - Right rail: publication metadata + Image à la une (with helper text
 *     explaining its OG / social-share role) + delete.
 *
 * All fields live inside one `<form>`. Blocks are serialized to JSON in a
 * hidden field. The current `content` field stays as a derived plain-text
 * fallback (concat of Text blocks) so legacy consumers + search keep
 * working until V2 deprecates it.
 *
 * Soft migration: when opened on a page with empty blocks but non-empty
 * content, the editor synthesizes a single Text block from content. The
 * page upgrades to the block model the next time the user saves — no SQL
 * backfill required.
 */

export interface CmsPageFormProps {
  mode: 'create' | 'edit'
  /** Required for `edit` mode. */
  page?: CmsPage
  /** All media assets — used by the Image à la une Select AND by blocks. */
  mediaAssets: ReadonlyArray<MediaAsset>
}

type TabId = 'content' | 'seo' | 'settings' | 'history'

const TABS: ReadonlyArray<{
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'content', label: 'Contenu', icon: FileText },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon },
  { id: 'history', label: 'Historique', icon: Activity },
]

export function CmsPageForm({
  mode,
  page,
  mediaAssets,
}: CmsPageFormProps): React.JSX.Element {
  const action =
    mode === 'create'
      ? createCmsPageAction
      : updateCmsPageAction.bind(null, page?.id ?? '')

  const [state, formAction, isPending] = useActionState<CmsFormState, FormData>(
    action,
    CMS_FORM_INITIAL_STATE,
  )

  // Initial values: prefer the echoed `state.values` (set when an action
  // returns with field errors), then the page in DB, then sane defaults.
  const v = state.values ?? {}
  const initialMedia = stringValue(v.mainMediaAssetId, page?.mainMediaAssetId, '')
  const initial = {
    title: stringValue(v.title, page?.title, ''),
    slug: stringValue(v.slug, page?.slug, ''),
    excerpt: stringValue(v.excerpt, page?.excerpt, ''),
    status: stringValue(v.status, page?.status, 'draft'),
    mainMediaAssetId: initialMedia === '' ? NO_MEDIA_SENTINEL : initialMedia,
  }

  // Soft migration: if the page exists, has empty blocks AND non-empty
  // content, synthesize a single Text block so the editor isn't empty.
  const initialBlocks: ReadonlyArray<Block> = useMemo(() => {
    if (page === undefined) return []
    if (page.blocks.length > 0) return page.blocks
    return blocksFromLegacyContent(page.content)
  }, [page])

  const [tab, setTab] = useState<TabId>('content')
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [status, setStatus] = useState(initial.status)
  const [media, setMedia] = useState(initial.mainMediaAssetId)
  const [blocks, setBlocks] = useState<ReadonlyArray<Block>>(initialBlocks)

  const errTitle = state.fieldErrors?.title
  const errSlug = state.fieldErrors?.slug
  const errExcerpt = state.fieldErrors?.excerpt
  const errStatus = state.fieldErrors?.status
  const errMedia = state.fieldErrors?.mainMediaAssetId
  const errBlocks = state.fieldErrors?.blocks
  const errContent = state.fieldErrors?.content

  const previewSlug = slug.startsWith('/') ? slug : `/${slug}`
  const featuredAsset = mediaAssets.find((m) => m.id === media)

  // Derive maps once for the BlockList (id → URL, id → alt) so children
  // don't need to scan the array.
  const mediaUrls = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of mediaAssets) map.set(m.id, m.publicUrl)
    return map
  }, [mediaAssets])
  const mediaAlt = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of mediaAssets) map.set(m.id, m.altText)
    return map
  }, [mediaAssets])

  // Hidden fields — the form posts (1) blocks as JSON, (2) content as a
  // derived plain-text fallback. Both are read by the server action.
  const blocksJson = JSON.stringify(blocks)
  const derivedContent = deriveContentFromBlocks(blocks)

  return (
    <form action={formAction} className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      <input type="hidden" name="blocks" value={blocksJson} />
      <input type="hidden" name="content" value={derivedContent} />

      {state.error !== null && state.error !== undefined ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {/* Sticky editor header — flush against the AdminHeader, full bleed,
          opaque background. The negative `top-*` offsets cancel the main
          element's padding so the banner sticks at main's BORDER top
          (right under the AdminHeader) instead of at its content top
          (16/24/32 px lower). Combined with the form's `-my-*` it visually
          touches the AdminHeader without any gap. */}
      <header className="sticky -top-4 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3 shadow-sm sm:-top-6 sm:px-6 lg:-top-8">
        <Link
          href="/admin/cms"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-fg hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Pages
        </Link>
        <span aria-hidden="true" className="h-5 w-px bg-border" />

        <div className="min-w-[200px] flex-1">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la page"
            maxLength={MAX_TITLE_LENGTH}
            required
            disabled={isPending}
            className="w-full border-none bg-transparent p-0 text-base font-semibold tracking-tight text-foreground outline-none placeholder:text-subtle-fg"
          />
          <p className="mt-0.5 truncate font-mono text-[11px] text-subtle-fg">
            {previewSlug}
          </p>
          {errTitle !== undefined ? (
            <p className="mt-1 text-xs text-destructive">{errTitle}</p>
          ) : null}
        </div>

        <StatusBadge status={status} />

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled
            title="Aperçu — bientôt"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-fg disabled:opacity-60"
          >
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </button>
          <button
            type="submit"
            name="_intent"
            value="save"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {status === 'published' ? (
            <button
              type="submit"
              name="_intent"
              value="unpublish"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              title="Repasser la page en brouillon (non visible publiquement)"
            >
              <FileEdit className="h-3.5 w-3.5" /> Passer en brouillon
            </button>
          ) : (
            <button
              type="submit"
              name="_intent"
              value="publish"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:brightness-105 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" /> Publier
            </button>
          )}
        </div>
      </header>

      {/* Body grid: main + right rail */}
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[880px]">
            {/* Tabs */}
            <nav
              className="mb-6 flex gap-1 border-b border-border"
              aria-label="Sections de l'éditeur"
            >
              {TABS.map((t) => {
                const TabIcon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                      active
                        ? 'border-accent text-foreground'
                        : 'border-transparent text-muted-fg hover:text-foreground'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                )
              })}
            </nav>

            {/* Tab: Contenu */}
            <section hidden={tab !== 'content'} className="space-y-5">
              <FormField
                label="Extrait"
                htmlFor="cms-excerpt"
                hint={`Résumé court (optionnel). Maximum ${MAX_EXCERPT_LENGTH} caractères.`}
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

              <BlockList
                blocks={blocks}
                mediaUrls={mediaUrls}
                mediaAlt={mediaAlt}
                onChange={setBlocks}
              />

              {errBlocks !== undefined || errContent !== undefined ? (
                <p className="text-xs text-destructive">
                  {errBlocks ?? errContent}
                </p>
              ) : null}
            </section>

            {/* Tab: SEO */}
            <section hidden={tab !== 'seo'} className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
                Référencement
              </p>
              <div className="rounded-card border border-border bg-muted/40 p-5">
                <p className="text-sm text-foreground">
                  Le titre, la description, l&apos;image Open Graph et l&apos;indexation de
                  cette page sont gérés depuis le module SEO.
                </p>
                <p className="mt-2 text-xs text-muted-fg">
                  Les valeurs définies pour la route{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    {previewSlug}
                  </code>{' '}
                  prévalent sur les valeurs par défaut de la plateforme.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/seo`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Voir les entrées SEO
                  </Link>
                  <Link
                    href={`/admin/seo/new`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:brightness-105"
                  >
                    Créer une entrée pour cette page
                  </Link>
                </div>
              </div>
            </section>

            {/* Tab: Réglages */}
            <section hidden={tab !== 'settings'} className="space-y-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
                Réglages
              </p>

              <FormField
                label="Identifiant URL (slug)"
                htmlFor="cms-slug"
                required
                hint="Lettres minuscules, chiffres et tirets uniquement. Sans accents ni espaces."
                {...(errSlug !== undefined ? { error: errSlug } : {})}
              >
                <Input
                  id="cms-slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  maxLength={MAX_SLUG_LENGTH}
                  placeholder="ma-page"
                  state={errSlug !== undefined ? 'error' : 'default'}
                  disabled={isPending}
                  required
                  className="font-mono"
                />
              </FormField>

              <FormField
                label="Statut"
                htmlFor="cms-status"
                required
                {...(errStatus !== undefined ? { error: errStatus } : {})}
              >
                <Select
                  id="cms-status"
                  name="status"
                  value={status}
                  onValueChange={setStatus}
                  disabled={isPending}
                  state={errStatus !== undefined ? 'error' : 'default'}
                >
                  <SelectItem value="draft">Brouillon (non visible publiquement)</SelectItem>
                  <SelectItem value="published">Publiée (visible sur /[slug])</SelectItem>
                </Select>
              </FormField>

              {page?.publishedAt !== undefined && page.publishedAt !== null ? (
                <div className="text-xs text-muted-fg">
                  Première publication : {page.publishedAt.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              ) : null}
            </section>

            {/* Tab: Historique */}
            <section hidden={tab !== 'history'} className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
                Historique des révisions
              </p>
              <div className="rounded-card border border-border bg-muted/40 p-5">
                <p className="text-sm text-foreground">
                  L&apos;historique détaillé arrive dans une prochaine version.
                </p>
                <p className="mt-2 text-xs text-muted-fg">
                  Les actions sur cette page (création, modification, publication) sont déjà
                  enregistrées dans le journal d&apos;audit. Cette vue les exposera filtrées
                  par page lorsque le module sera prêt.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Right rail */}
        <aside className="border-t border-border bg-background px-5 py-6 lg:border-l lg:border-t-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Publication
          </p>
          <ul className="space-y-2.5 text-sm">
            <Row label="Statut">
              <StatusBadge status={status} />
            </Row>
            <Row label="Visibilité">
              <span className="text-foreground">Public</span>
            </Row>
            <Row label="Modifiée">
              <span className="text-muted-fg">
                {page?.updatedAt !== undefined
                  ? page.updatedAt.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : "à l'instant"}
              </span>
            </Row>
          </ul>

          <hr className="my-5 border-border" />

          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Image à la une
          </p>
          <p className="mb-3 text-[11px] text-muted-fg">
            Affichée lors du partage sur les réseaux sociaux (Facebook, Twitter, LinkedIn) et
            dans les aperçus de la page. C&apos;est une métadonnée Open Graph qui complète le SEO.
          </p>
          <FormField
            label=""
            htmlFor="cms-media"
            {...(errMedia !== undefined ? { error: errMedia } : {})}
          >
            <Select
              id="cms-media"
              name="mainMediaAssetId"
              value={media}
              onValueChange={setMedia}
              placeholder="Aucune image"
              disabled={isPending || mediaAssets.length === 0}
              state={errMedia !== undefined ? 'error' : 'default'}
            >
              <SelectItem value={NO_MEDIA_SENTINEL}>Aucune image</SelectItem>
              {mediaAssets.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.originalFilename}
                </SelectItem>
              ))}
            </Select>
          </FormField>
          {featuredAsset !== undefined ? (
            <div className="mt-3 aspect-square w-full overflow-hidden rounded-lg bg-muted">
              {featuredAsset.publicUrl !== '' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredAsset.publicUrl}
                  alt={featuredAsset.altText || featuredAsset.originalFilename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-end p-3 font-mono text-[10px] text-white/80">
                  {featuredAsset.originalFilename}
                </div>
              )}
            </div>
          ) : null}

          {mode === 'edit' && page !== undefined ? (
            <>
              <hr className="my-5 border-border" />
              <CmsDeleteButton
                id={page.id}
                title={page.title}
                slug={page.slug}
                status={page.status}
              />
            </>
          ) : null}
        </aside>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const cfg =
    status === 'published'
      ? { label: 'Publiée', cls: 'bg-success/10 text-success', dot: 'bg-success' }
      : { label: 'Brouillon', cls: 'bg-muted text-muted-fg', dot: 'bg-muted-fg' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="text-muted-fg">{label}</span>
      <span className="font-medium">{children}</span>
    </li>
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
