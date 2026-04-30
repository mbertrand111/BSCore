'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/patterns'
import { deleteFolderAction, moveAssetToFolderAction } from '../admin/folder-actions'
import { MediaFolderDialog } from './MediaFolderDialog'
import type { MediaFolderWithCount } from '../data/folders-repository'

/**
 * Left-rail folder navigator for /admin/media.
 *
 * Two responsibilities:
 *   1. Navigation — clicking a row updates the URL (`?folder=<slug>`)
 *      which triggers a server re-fetch with the new filter.
 *   2. Drop target — when the user drags a media tile from the gallery,
 *      every actionable row (Non classés + each folder) becomes a drop
 *      zone. Drop = call moveAssetToFolderAction(assetId, folderId|null)
 *      then refresh.
 *
 * Collapse mode: the rail can be reduced to ~52px (icons only) via the
 * top toggle button. The collapsed state is persisted to localStorage by
 * the parent (MediaLibrary) so it survives page reloads. In collapsed
 * mode each row has a tooltip-style title for accessibility.
 *
 * "Tous les médias" is intentionally NOT a drop target — it's a view
 * filter, not a destination. Dropping on it would be ambiguous (move to
 * which folder?). The user drops on "Non classés" to clear the folder.
 */

const MEDIA_DRAG_TYPE = 'application/x-bscore-media'
const NO_FOLDER_PARAM = '__none__'

export interface MediaFolderRailProps {
  folders: ReadonlyArray<MediaFolderWithCount>
  unclassifiedCount: number
  totalCount: number
  /**
   *   undefined → "Tous les médias" active
   *   null      → "Non classés" active
   *   string    → folder id active
   */
  activeFolderId: string | null | undefined
  collapsed: boolean
  onToggleCollapse: () => void
}

export function MediaFolderRail({
  folders,
  unclassifiedCount,
  totalCount,
  activeFolderId,
  collapsed,
  onToggleCollapse,
}: MediaFolderRailProps): React.JSX.Element {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MediaFolderWithCount | null>(null)
  const [deletingId, deleteTransition] = useTransition()
  const [, dropTransition] = useTransition()
  const [hoveredDropId, setHoveredDropId] = useState<string | 'unclassified' | null>(null)

  const onSavedFolder = (slug: string | undefined): void => {
    router.refresh()
    if (slug !== undefined && !editTarget) {
      router.push(`/admin/media?folder=${encodeURIComponent(slug)}`)
    }
  }

  const onDelete = (folder: MediaFolderWithCount): void => {
    const message =
      folder.assetCount > 0
        ? `Supprimer le dossier « ${folder.name} » ?\n\n${folder.assetCount} média(s) seront déplacés vers "Non classés".\n\nCette action est irréversible.`
        : `Supprimer le dossier « ${folder.name} » ?\n\nCette action est irréversible.`
    if (!window.confirm(message)) return
    deleteTransition(async () => {
      const result = await deleteFolderAction(folder.id)
      if (!result.ok) {
        window.alert(result.error ?? 'Échec de la suppression.')
        return
      }
      if (activeFolderId === folder.id) {
        router.push('/admin/media')
      } else {
        router.refresh()
      }
    })
  }

  const onDropOnFolder = (
    e: React.DragEvent<HTMLAnchorElement>,
    folderId: string | null,
  ): void => {
    e.preventDefault()
    setHoveredDropId(null)
    const assetId = e.dataTransfer.getData(MEDIA_DRAG_TYPE)
    if (assetId === '') return
    dropTransition(async () => {
      const result = await moveAssetToFolderAction(assetId, folderId)
      if (!result.ok) {
        window.alert(result.error ?? 'Échec du déplacement.')
        return
      }
      router.refresh()
    })
  }

  // ---- Render ------------------------------------------------------------

  if (collapsed) {
    return (
      <>
        <aside className="flex flex-col items-center gap-1 lg:sticky lg:top-20">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Déplier le panneau dossiers"
            title="Déplier"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <CollapsedRow
            href="/admin/media"
            icon={Layers}
            label="Tous les médias"
            count={totalCount}
            active={activeFolderId === undefined}
          />
          <CollapsedRow
            href={`/admin/media?folder=${NO_FOLDER_PARAM}`}
            icon={FolderOpen}
            label="Non classés"
            count={unclassifiedCount}
            active={activeFolderId === null}
            droppable
            hovered={hoveredDropId === 'unclassified'}
            onDragOver={(e) => {
              e.preventDefault()
              setHoveredDropId('unclassified')
            }}
            onDragLeave={() => setHoveredDropId(null)}
            onDrop={(e) => onDropOnFolder(e, null)}
          />
          {folders.map((f) => (
            <CollapsedRow
              key={f.id}
              href={`/admin/media?folder=${encodeURIComponent(f.slug)}`}
              icon={Folder}
              label={f.name}
              count={f.assetCount}
              active={activeFolderId === f.id}
              droppable
              hovered={hoveredDropId === f.id}
              onDragOver={(e) => {
                e.preventDefault()
                setHoveredDropId(f.id)
              }}
              onDragLeave={() => setHoveredDropId(null)}
              onDrop={(e) => onDropOnFolder(e, f.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Nouveau dossier"
            title="Nouveau dossier"
            className="mt-2 flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-border text-muted-fg hover:border-accent/40 hover:bg-accent/5 hover:text-accent-text"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </aside>

        <FolderDialogs
          createOpen={createOpen}
          setCreateOpen={setCreateOpen}
          editTarget={editTarget}
          setEditTarget={setEditTarget}
          onSavedFolder={onSavedFolder}
        />
      </>
    )
  }

  return (
    <>
      <aside className="space-y-4 lg:sticky lg:top-20">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Bibliothèque
          </p>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Réduire le panneau dossiers"
            title="Réduire"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav aria-label="Navigation par dossier" className="space-y-1">
          <RailRow
            href="/admin/media"
            icon={Layers}
            label="Tous les médias"
            count={totalCount}
            active={activeFolderId === undefined}
          />
          <RailRow
            href={`/admin/media?folder=${NO_FOLDER_PARAM}`}
            icon={FolderOpen}
            label="Non classés"
            count={unclassifiedCount}
            active={activeFolderId === null}
            droppable
            hovered={hoveredDropId === 'unclassified'}
            onDragOver={(e) => {
              e.preventDefault()
              setHoveredDropId('unclassified')
            }}
            onDragLeave={() => setHoveredDropId(null)}
            onDrop={(e) => onDropOnFolder(e, null)}
          />
        </nav>

        <div className="space-y-1.5">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Dossiers
          </p>
          {folders.length === 0 ? (
            <p className="px-2 text-xs italic text-subtle-fg">
              Aucun dossier pour l&apos;instant.
            </p>
          ) : (
            <ul className="space-y-1">
              {folders.map((f) => (
                <li key={f.id} className="group/row relative">
                  <RailRow
                    href={`/admin/media?folder=${encodeURIComponent(f.slug)}`}
                    icon={Folder}
                    label={f.name}
                    count={f.assetCount}
                    active={activeFolderId === f.id}
                    droppable
                    hovered={hoveredDropId === f.id}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setHoveredDropId(f.id)
                    }}
                    onDragLeave={() => setHoveredDropId(null)}
                    onDrop={(e) => onDropOnFolder(e, f.id)}
                    rightSlot={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.preventDefault()}
                            aria-label={`Actions pour ${f.name}`}
                            className="invisible inline-flex h-6 w-6 items-center justify-center rounded text-muted-fg opacity-0 hover:bg-muted hover:text-foreground group-hover/row:visible group-hover/row:opacity-100 data-[state=open]:visible data-[state=open]:opacity-100"
                          >
                            {deletingId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          <DropdownMenuItem onSelect={() => setEditTarget(f)}>
                            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-fg" /> Renommer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onSelect={() => onDelete(f)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-fg transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent-text"
        >
          <FolderPlus className="h-3.5 w-3.5" /> Nouveau dossier
        </button>
      </aside>

      <FolderDialogs
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editTarget={editTarget}
        setEditTarget={setEditTarget}
        onSavedFolder={onSavedFolder}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RailRowProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  active: boolean
  rightSlot?: React.ReactNode
  droppable?: boolean
  hovered?: boolean
  onDragOver?: (e: React.DragEvent<HTMLAnchorElement>) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent<HTMLAnchorElement>) => void
}

function RailRow({
  href,
  icon: Icon,
  label,
  count,
  active,
  rightSlot,
  droppable = false,
  hovered = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: RailRowProps): React.JSX.Element {
  const dropProps = droppable
    ? {
        ...(onDragOver !== undefined ? { onDragOver } : {}),
        ...(onDragLeave !== undefined ? { onDragLeave } : {}),
        ...(onDrop !== undefined ? { onDrop } : {}),
      }
    : {}
  return (
    <Link
      href={href}
      {...dropProps}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        hovered
          ? 'bg-accent/20 ring-2 ring-accent/40'
          : active
            ? 'bg-accent/10 font-medium text-accent-text'
            : 'text-foreground hover:bg-muted'
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-muted-fg'}`}
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{label}</span>
      {rightSlot ?? null}
      <span
        className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
          active ? 'bg-accent text-accent-fg' : 'bg-muted text-muted-fg'
        }`}
      >
        {count}
      </span>
    </Link>
  )
}

interface CollapsedRowProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  active: boolean
  droppable?: boolean
  hovered?: boolean
  onDragOver?: (e: React.DragEvent<HTMLAnchorElement>) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent<HTMLAnchorElement>) => void
}

function CollapsedRow({
  href,
  icon: Icon,
  label,
  count,
  active,
  droppable = false,
  hovered = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: CollapsedRowProps): React.JSX.Element {
  const dropProps = droppable
    ? {
        ...(onDragOver !== undefined ? { onDragOver } : {}),
        ...(onDragLeave !== undefined ? { onDragLeave } : {}),
        ...(onDrop !== undefined ? { onDrop } : {}),
      }
    : {}
  return (
    <Link
      href={href}
      {...dropProps}
      title={`${label} (${count})`}
      aria-label={`${label} — ${count}`}
      className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        hovered
          ? 'bg-accent/20 ring-2 ring-accent/40'
          : active
            ? 'bg-accent/10 text-accent-text'
            : 'text-muted-fg hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {count > 0 ? (
        <span
          className={`absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums ${
            active ? 'bg-accent text-accent-fg' : 'bg-muted-fg/80 text-background'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}

interface FolderDialogsProps {
  createOpen: boolean
  setCreateOpen: (open: boolean) => void
  editTarget: MediaFolderWithCount | null
  setEditTarget: (target: MediaFolderWithCount | null) => void
  onSavedFolder: (slug: string | undefined) => void
}

function FolderDialogs({
  createOpen,
  setCreateOpen,
  editTarget,
  setEditTarget,
  onSavedFolder,
}: FolderDialogsProps): React.JSX.Element {
  return (
    <>
      <MediaFolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={onSavedFolder}
      />
      <MediaFolderDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        {...(editTarget !== null
          ? {
              folder: {
                id: editTarget.id,
                name: editTarget.name,
                description: editTarget.description,
              },
            }
          : {})}
        onSaved={onSavedFolder}
      />
    </>
  )
}

// Exported for the gallery components — keep the dataTransfer key in one place.
export const MEDIA_DRAG_MIME = MEDIA_DRAG_TYPE
