'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Calendar,
  Check,
  FileText,
  Filter,
  Image as ImageIcon,
  ImageOff,
  LayoutGrid,
  List as ListIcon,
  Search,
  Upload,
  Video,
} from 'lucide-react'
import { Button } from '@/shared/ui/primitives'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/patterns'
import type { MediaAsset } from '@/modules/media/data/repository'
import type { MediaFolderWithCount } from '@/modules/media/data/folders-repository'
import { MediaFolderRail, MEDIA_DRAG_MIME } from './MediaFolderRail'

const RAIL_STORAGE_KEY = 'bscore.media.rail.collapsed'

/**
 * /admin/media library — direct port of the BSCore Backoffice maquette
 * "Médias" screen.
 *
 * Visual: filters bar (grid/list toggle, search, type select), masonry grid
 * for the gallery (CSS columns), with each tile linking to the asset detail
 * route. When a real `publicUrl` resolves, the image renders inside a tile;
 * otherwise we fall back to a deterministic gradient placeholder so the
 * layout stays intact in fresh dev environments without storage configured.
 */
export interface MediaLibraryProps {
  assets: ReadonlyArray<MediaAsset>
  folders: ReadonlyArray<MediaFolderWithCount>
  unclassifiedCount: number
  totalCount: number
  /**
   *   undefined → "Tous les médias" view (no folder filter)
   *   null      → "Non classés"
   *   string    → that folder's id
   */
  activeFolderId: string | null | undefined
  /** Display label of the active folder (when activeFolderId is a string). */
  activeFolderName?: string | null
  activeFolderDescription?: string | null
}

type ViewMode = 'grid' | 'list'

const TYPE_FILTERS = [
  { id: 'all', label: 'Tous les types', icon: Filter },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'video', label: 'Vidéos', icon: Video },
  { id: 'document', label: 'Documents', icon: FileText },
] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]['id']

const SORT_OPTIONS = [
  { id: 'newest', label: "Plus récent d'abord", icon: Calendar },
  { id: 'oldest', label: "Plus ancien d'abord", icon: Calendar },
  { id: 'name-asc', label: 'Nom (A → Z)', icon: ArrowDownAZ },
  { id: 'name-desc', label: 'Nom (Z → A)', icon: ArrowUpAZ },
  { id: 'size-desc', label: "Plus volumineux d'abord", icon: ArrowUpDown },
  { id: 'size-asc', label: "Plus léger d'abord", icon: ArrowUpDown },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['id']

export function MediaLibrary({
  assets,
  folders,
  unclassifiedCount,
  totalCount,
  activeFolderId,
  activeFolderName,
  activeFolderDescription,
}: MediaLibraryProps): React.JSX.Element {
  const [view, setView] = useState<ViewMode>('grid')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  // Folder rail collapse — persisted across reloads via localStorage so the
  // user's preference sticks. SSR-safe: starts expanded, hydrates the saved
  // value on mount (no hydration mismatch — the false → true transition is
  // a normal client-only effect).
  const [railCollapsed, setRailCollapsed] = useState(false)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(RAIL_STORAGE_KEY)
      if (saved === '1') setRailCollapsed(true)
    } catch {
      // localStorage unavailable (private mode) — silently ignore.
    }
  }, [])
  const toggleRail = (): void => {
    setRailCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  const totalSize = useMemo(
    () => assets.reduce((sum, a) => sum + a.sizeBytes, 0),
    [assets],
  )

  // Page header label adapts to the active folder context.
  const headerTitle =
    activeFolderId === undefined
      ? 'Médias'
      : activeFolderId === null
        ? 'Non classés'
        : activeFolderName ?? 'Dossier'
  const headerSubtitle =
    activeFolderId === undefined
      ? `${totalCount} fichier${totalCount > 1 ? 's' : ''} au total · ${formatSize(totalSize)} dans ce dossier.`
      : `${assets.length} fichier${assets.length > 1 ? 's' : ''} · ${formatSize(totalSize)}`

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesType = (mime: string): boolean => {
      if (typeFilter === 'all') return true
      if (typeFilter === 'image') return mime.startsWith('image/')
      if (typeFilter === 'video') return mime.startsWith('video/')
      // 'document' = anything that isn't an image or a video
      return !mime.startsWith('image/') && !mime.startsWith('video/')
    }
    const list = assets.filter((a) => {
      if (!matchesType(a.mimeType)) return false
      if (q === '') return true
      return (
        a.originalFilename.toLowerCase().includes(q) ||
        a.altText.toLowerCase().includes(q)
      )
    })
    return sortAssets(list, sort)
  }, [assets, query, typeFilter, sort])

  const activeTypeLabel =
    TYPE_FILTERS.find((t) => t.id === typeFilter)?.label ?? 'Tous les types'
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.id === sort)?.label ?? 'Plus récent'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            {headerTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-fg">{headerSubtitle}</p>
          {activeFolderDescription !== undefined && activeFolderDescription !== null ? (
            <p className="mt-1 max-w-xl text-xs text-subtle-fg">{activeFolderDescription}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
              typeof activeFolderId === 'string'
                ? `/admin/media/new?folderId=${activeFolderId}`
                : '/admin/media/new'
            }
          >
            <Button intent="primary" leadingIcon={<Upload className="h-3.5 w-3.5" />}>
              Téléverser
            </Button>
          </Link>
        </div>
      </header>

      <div
        className={`grid gap-6 ${
          railCollapsed
            ? 'lg:grid-cols-[52px_minmax(0,1fr)]'
            : 'lg:grid-cols-[240px_minmax(0,1fr)]'
        }`}
      >
        <MediaFolderRail
          folders={folders}
          unclassifiedCount={unclassifiedCount}
          totalCount={totalCount}
          activeFolderId={activeFolderId}
          collapsed={railCollapsed}
          onToggleCollapse={toggleRail}
        />

        <div className="space-y-6">

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface-elevated p-3 shadow-sm">
        <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
          <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} icon={LayoutGrid} label="Grille" />
          <ViewToggle active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label="Liste" />
        </div>

        <div className="relative min-w-[180px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle-fg"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Rechercher dans les médias…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-transparent bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-fg focus:border-primary focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'border-border text-muted-fg hover:bg-muted hover:text-foreground'
                  : 'border-accent/30 bg-accent/10 text-accent-text'
              }`}
            >
              <Filter className="h-3 w-3" />
              Filtres
              {typeFilter !== 'all' ? (
                <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px]">
                  1
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuLabel>Type de média</DropdownMenuLabel>
            {TYPE_FILTERS.map((t) => (
              <ChoiceItem
                key={t.id}
                label={t.label}
                icon={t.icon}
                active={typeFilter === t.id}
                onSelect={() => setTypeFilter(t.id)}
              />
            ))}
            {typeFilter !== 'all' ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setTypeFilter('all')}>
                  Réinitialiser
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={`Trier : ${activeSortLabel}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowUpDown className="h-3 w-3" />
              Trier
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            <DropdownMenuLabel>Trier par</DropdownMenuLabel>
            {SORT_OPTIONS.map((s) => (
              <ChoiceItem
                key={s.id}
                label={s.label}
                icon={s.icon}
                active={sort === s.id}
                onSelect={() => setSort(s.id)}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters summary */}
      {typeFilter !== 'all' || sort !== 'newest' ? (
        <p className="text-xs text-muted-fg">
          {typeFilter !== 'all' ? (
            <span className="mr-3">
              Type :{' '}
              <span className="font-medium text-foreground">{activeTypeLabel}</span>
            </span>
          ) : null}
          {sort !== 'newest' ? (
            <span>
              Tri :{' '}
              <span className="font-medium text-foreground">{activeSortLabel}</span>
            </span>
          ) : null}
        </p>
      ) : null}

      {/* Gallery */}
      {filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-surface-elevated p-16 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            Aucun média ne correspond à votre recherche.
          </p>
          <p className="mt-1 text-xs text-muted-fg">
            Essayez avec un autre mot ou{' '}
            <Link href="/admin/media/new" className="text-accent-text hover:underline">
              téléversez un nouveau fichier
            </Link>
            .
          </p>
        </div>
      ) : view === 'grid' ? (
        <MasonryGrid assets={filtered} />
      ) : (
        <ListView assets={filtered} />
      )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChoiceItem({
  label,
  icon: Icon,
  active,
  onSelect,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onSelect: () => void
}): React.JSX.Element {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <Icon className="mr-2 h-3.5 w-3.5 text-muted-fg" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {active ? <Check className="ml-2 h-3.5 w-3.5 text-accent" aria-hidden="true" /> : null}
    </DropdownMenuItem>
  )
}

function sortAssets(
  list: ReadonlyArray<MediaAsset>,
  key: SortKey,
): ReadonlyArray<MediaAsset> {
  // Sort never mutates the input array — the parent useMemo treats the
  // result as a stable derivation.
  const copy = [...list]
  switch (key) {
    case 'newest':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    case 'oldest':
      return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    case 'name-asc':
      return copy.sort((a, b) =>
        a.originalFilename.localeCompare(b.originalFilename, 'fr', { sensitivity: 'base' }),
      )
    case 'name-desc':
      return copy.sort((a, b) =>
        b.originalFilename.localeCompare(a.originalFilename, 'fr', { sensitivity: 'base' }),
      )
    case 'size-desc':
      return copy.sort((a, b) => b.sizeBytes - a.sizeBytes)
    case 'size-asc':
      return copy.sort((a, b) => a.sizeBytes - b.sizeBytes)
    default:
      return copy
  }
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-surface-elevated text-foreground shadow-sm'
          : 'text-muted-fg hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function MasonryGrid({ assets }: { assets: ReadonlyArray<MediaAsset> }): React.JSX.Element {
  return (
    <div className="[column-fill:_balance] [column-gap:_12px] [columns:_auto_220px]">
      {assets.map((a) => {
        return (
          <Link
            key={a.id}
            href={`/admin/media/${a.id}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(MEDIA_DRAG_MIME, a.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="group relative mb-3 block cursor-grab overflow-hidden rounded-sm bg-muted shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:opacity-70 [break-inside:_avoid]"
          >
            {a.publicUrl !== '' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.publicUrl}
                alt={a.altText || a.originalFilename}
                className="block h-auto w-full"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <MissingImage filename={a.originalFilename} />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-6 font-mono text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {a.originalFilename}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ListView({ assets }: { assets: ReadonlyArray<MediaAsset> }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-sm">
      <table className="w-full text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg">
              Aperçu
            </th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg">
              Nom
            </th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg">
              Type
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg">
              Taille
            </th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg">
              Téléversé
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            return (
              <tr
                key={a.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(MEDIA_DRAG_MIME, a.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                className="cursor-grab border-b border-border/70 last:border-b-0 hover:bg-muted/40 active:cursor-grabbing active:opacity-70"
                onClick={() => {
                  window.location.href = `/admin/media/${a.id}`
                }}
              >
                <td className="px-4 py-3">
                  <div className="h-10 w-10 overflow-hidden rounded-sm border border-border bg-muted">
                    {a.publicUrl !== '' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.publicUrl}
                        alt={a.altText || a.originalFilename}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{a.originalFilename}</p>
                  {a.altText !== '' ? (
                    <p className="mt-0.5 text-xs text-muted-fg" title={a.altText}>
                      {truncate(a.altText, 70)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs italic text-subtle-fg">Sans texte alternatif</p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-fg">
                  {a.mimeType.replace('image/', '').toUpperCase()}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-fg">
                  {formatSize(a.sizeBytes)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-fg">
                  {a.createdAt.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subtle "image manquante" tile — used when a media row exists in DB but the
 * underlying file isn't reachable in storage (e.g. SUPABASE_SERVICE_KEY not
 * set, bucket renamed, blob purged). Forces a 4/5 ratio so the masonry stays
 * coherent rather than collapsing to zero height.
 */
function MissingImage({ filename }: { filename: string }): React.JSX.Element {
  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 bg-muted text-muted-fg">
      <ImageOff className="h-5 w-5 opacity-50" aria-hidden="true" />
      <span className="px-3 text-center text-[10px] text-subtle-fg" title={filename}>
        Image manquante
      </span>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} Go`
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}
