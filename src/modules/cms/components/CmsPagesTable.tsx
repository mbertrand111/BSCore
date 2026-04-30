'use client'

import type React from 'react'
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileEdit,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
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
import {
  publishCmsPageAction,
  unpublishCmsPageAction,
} from '@/modules/cms/admin/actions'
import type { CmsPage } from '@/modules/cms/data/repository'
import type { CmsStatus } from '@/modules/cms/constants'
import { CmsDeletePageDialog } from './CmsDeletePageDialog'

/**
 * /admin/cms list view — direct port of the BSCore Backoffice maquette
 * "Pages" screen. Filter pills (Toutes / Publiées / Brouillons), search by
 * title or slug, and a table with the same columns as the maquette.
 *
 * Columns we don't track yet (`type`, `views`, author display name) are
 * shown with sensible fallbacks: type defaults to "Standard" (we don't
 * categorize pages in V1), views defaults to "—", author shows the user's
 * email initials. When those fields ship as real data, swap the fallbacks.
 */
export interface CmsPagesTableProps {
  pages: ReadonlyArray<CmsPage>
}

type FilterKey = 'all' | CmsStatus

const FILTERS: ReadonlyArray<{ id: FilterKey; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'published', label: 'Publiées' },
  { id: 'draft', label: 'Brouillons' },
]

const DATE_FILTERS = [
  { id: 'any', label: 'Toutes les dates', icon: Calendar },
  { id: 'today', label: "Aujourd'hui", icon: CalendarClock },
  { id: '7d', label: '7 derniers jours', icon: CalendarDays },
  { id: '30d', label: '30 derniers jours', icon: CalendarDays },
] as const
type DateFilter = (typeof DATE_FILTERS)[number]['id']

const SORT_OPTIONS = [
  { id: 'updated-desc', label: 'Modifiée récemment', icon: CalendarClock },
  { id: 'updated-asc', label: 'Modifiée il y a longtemps', icon: CalendarClock },
  { id: 'created-desc', label: "Créée récemment", icon: Calendar },
  { id: 'created-asc', label: 'Créée il y a longtemps', icon: Calendar },
  { id: 'title-asc', label: 'Titre (A → Z)', icon: ArrowDownAZ },
  { id: 'title-desc', label: 'Titre (Z → A)', icon: ArrowUpAZ },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['id']

const PAGE_SIZE = 10

export function CmsPagesTable({ pages }: CmsPagesTableProps): React.JSX.Element {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [sort, setSort] = useState<SortKey>('updated-desc')
  // The themed delete dialog is mounted ONCE for the whole table — when the
  // user picks "Supprimer" in a row's 3-dot menu, we set `deleteTarget` to
  // that page and the dialog opens. Open state derives from the target.
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null)

  const counts = useMemo(
    () => ({
      all: pages.length,
      published: pages.filter((p) => p.status === 'published').length,
      draft: pages.filter((p) => p.status === 'draft').length,
    }),
    [pages],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cutoff = dateFilterCutoff(dateFilter)
    const list = pages.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false
      if (cutoff !== null && p.updatedAt.getTime() < cutoff) return false
      if (q !== '' && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q))
        return false
      return true
    })
    return sortPages(list, sort)
  }, [pages, filter, query, dateFilter, sort])

  const activeDateLabel =
    DATE_FILTERS.find((d) => d.id === dateFilter)?.label ?? 'Toutes les dates'
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.id === sort)?.label ?? 'Modifiée récemment'
  const activeFilterCount = (dateFilter !== 'any' ? 1 : 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePageIndex = Math.min(pageIndex, totalPages - 1)
  const visible = filtered.slice(safePageIndex * PAGE_SIZE, (safePageIndex + 1) * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            Pages
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            {pages.length} pages au total · gérez votre contenu structurel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button intent="secondary" leadingIcon={<Upload className="h-3.5 w-3.5" />}>
            Importer
          </Button>
          <Link href="/admin/cms/new">
            <Button intent="primary" leadingIcon={<Plus className="h-3.5 w-3.5" />}>
              Nouvelle page
            </Button>
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-sm">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex gap-0.5">
            {FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setFilter(t.id)
                  setPageIndex(0)
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === t.id
                    ? 'bg-accent/10 text-accent-text'
                    : 'text-muted-fg hover:bg-muted hover:text-foreground'
                }`}
              >
                {t.label}
                <span className="text-[10px] tabular-nums opacity-70">
                  {countFor(t.id, counts)}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[180px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle-fg"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Rechercher une page…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPageIndex(0)
              }}
              className="h-9 w-full rounded-md border border-transparent bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-fg focus:border-primary focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeFilterCount > 0
                    ? 'border-accent/30 bg-accent/10 text-accent-text'
                    : 'border-border text-muted-fg hover:bg-muted hover:text-foreground'
                }`}
              >
                <Filter className="h-3 w-3" /> Filtres
                {activeFilterCount > 0 ? (
                  <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel>Date de modification</DropdownMenuLabel>
              {DATE_FILTERS.map((d) => (
                <ChoiceItem
                  key={d.id}
                  label={d.label}
                  icon={d.icon}
                  active={dateFilter === d.id}
                  onSelect={() => {
                    setDateFilter(d.id)
                    setPageIndex(0)
                  }}
                />
              ))}
              {activeFilterCount > 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setDateFilter('any')
                      setPageIndex(0)
                    }}
                  >
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
                <ArrowUpDown className="h-3 w-3" /> Trier
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
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

        {/* Active filter / sort summary */}
        {activeFilterCount > 0 || sort !== 'updated-desc' ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-fg">
            {dateFilter !== 'any' ? (
              <span>
                Date :{' '}
                <span className="font-medium text-foreground">{activeDateLabel}</span>
              </span>
            ) : null}
            {sort !== 'updated-desc' ? (
              <span>
                Tri :{' '}
                <span className="font-medium text-foreground">{activeSortLabel}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <Th>Titre</Th>
                <Th>Statut</Th>
                <Th>Type</Th>
                <Th>Auteur</Th>
                <Th align="right">Vues</Th>
                <Th>Modifiée</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-fg">
                    Aucune page ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-muted/40"
                    onClick={() => {
                      window.location.href = `/admin/cms/${p.id}`
                    }}
                  >
                    <Td>
                      <div className="font-medium text-foreground">{p.title}</div>
                      <code className="mt-0.5 block font-mono text-[11px] text-subtle-fg">
                        /{p.slug}
                      </code>
                    </Td>
                    <Td>
                      <StatusDot status={p.status} />
                    </Td>
                    <Td muted>Standard</Td>
                    <Td>
                      <AuthorChip createdBy={p.createdBy} />
                    </Td>
                    <Td align="right" muted>
                      —
                    </Td>
                    <Td muted>{relativeUpdate(p.updatedAt)}</Td>
                    <Td align="right">
                      <RowActions
                        page={p}
                        onDelete={() => setDeleteTarget(p)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-fg">
          <span>
            Affichage {visible.length} sur {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={safePageIndex === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-fg disabled:opacity-40 enabled:hover:bg-muted enabled:hover:text-foreground"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPageIndex(i)}
                className={`h-7 min-w-[1.75rem] rounded-md px-2 text-xs font-medium tabular-nums ${
                  i === safePageIndex
                    ? 'bg-accent/10 text-accent-text'
                    : 'text-muted-fg hover:bg-muted hover:text-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
              disabled={safePageIndex >= totalPages - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-fg disabled:opacity-40 enabled:hover:bg-muted enabled:hover:text-foreground"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Themed delete confirmation — single mount point. The 3-dot menu of
         each row sets `deleteTarget` to open it. The dialog calls the action
         and, on success, the action's own redirect lands the user back on
         /admin/cms (re-fetched list). */}
      <CmsDeletePageDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        pageId={deleteTarget?.id ?? ''}
        pageTitle={deleteTarget?.title ?? ''}
        {...(deleteTarget?.slug !== undefined ? { pageSlug: deleteTarget.slug } : {})}
        {...(deleteTarget?.status !== undefined ? { pageStatus: deleteTarget.status } : {})}
        onDeleted={() => {
          setDeleteTarget(null)
          router.refresh()
        }}
      />
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

function RowActions({
  page,
  onDelete,
}: {
  page: CmsPage
  onDelete: () => void
}): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onTogglePublish = (): void => {
    startTransition(async () => {
      const result =
        page.status === 'published'
          ? await unpublishCmsPageAction(page.id)
          : await publishCmsPageAction(page.id)
      if (!result.ok) {
        window.alert(result.error ?? "L'opération a échoué.")
        return
      }
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
          aria-label={`Actions pour ${page.title}`}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => router.push(`/admin/cms/${page.id}`)}>
          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-fg" /> Modifier
        </DropdownMenuItem>
        {page.status === 'published' ? (
          <DropdownMenuItem
            onSelect={() => window.open(`/${page.slug}`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-fg" /> Voir publié
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {page.status === 'draft' ? (
          <DropdownMenuItem onSelect={onTogglePublish}>
            <Send className="mr-2 h-3.5 w-3.5 text-muted-fg" /> Publier
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onTogglePublish}>
            <FileEdit className="mr-2 h-3.5 w-3.5 text-muted-fg" /> Passer en brouillon
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function dateFilterCutoff(filter: DateFilter): number | null {
  if (filter === 'any') return null
  const now = Date.now()
  if (filter === 'today') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  if (filter === '7d') return now - 7 * 86_400_000
  if (filter === '30d') return now - 30 * 86_400_000
  return null
}

function sortPages(list: ReadonlyArray<CmsPage>, key: SortKey): ReadonlyArray<CmsPage> {
  const copy = [...list]
  switch (key) {
    case 'updated-desc':
      return copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    case 'updated-asc':
      return copy.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    case 'created-desc':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    case 'created-asc':
      return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    case 'title-asc':
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }),
      )
    case 'title-desc':
      return copy.sort((a, b) =>
        b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' }),
      )
    default:
      return copy
  }
}

function Th({
  children,
  align,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}): React.JSX.Element {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-fg ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align,
  muted,
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  muted?: boolean
}): React.JSX.Element {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === 'right' ? 'text-right' : ''} ${
        muted === true ? 'text-muted-fg' : ''
      }`}
    >
      {children}
    </td>
  )
}

function StatusDot({ status }: { status: CmsStatus }): React.JSX.Element {
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

function AuthorChip({ createdBy }: { createdBy: string }): React.JSX.Element {
  // We only have the user's UUID (no profile join in V1). Show a deterministic
  // gradient avatar with the first 2 chars of the UUID and a generic label.
  const seed = createdBy.replace(/[^0-9a-z]/gi, '').slice(0, 2).toUpperCase() || '··'
  const hue = (parseInt(createdBy.slice(0, 8), 16) % 360 + 360) % 360
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 60% 55%), hsl(${(hue + 30) % 360} 60% 65%))`,
        }}
        aria-hidden="true"
      >
        {seed}
      </span>
      <span>Équipe</span>
    </div>
  )
}

function countFor(
  id: FilterKey,
  counts: { all: number; published: number; draft: number },
): number {
  if (id === 'all') return counts.all
  if (id === 'published') return counts.published
  return counts.draft
}

function relativeUpdate(date: Date): string {
  const seconds = (Date.now() - date.getTime()) / 1000
  if (seconds < 60) return "à l'instant"
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  if (seconds < 86400 * 2) return 'hier'
  if (seconds < 86400 * 7) return `il y a ${Math.floor(seconds / 86400)} j`
  if (seconds < 86400 * 30) return `il y a ${Math.floor(seconds / 86400 / 7)} sem.`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
