'use client'

import type React from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Check,
  Folder,
  FolderOpen,
  ImageOff,
  Layers,
  Loader2,
  Search,
} from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/ui/patterns'
import { Button } from '@/shared/ui/primitives'
import {
  listMediaForPicker,
  type PickerAsset,
  type PickerData,
} from '../../admin/picker-actions'

/**
 * MediaPicker — shared modal used by Hero (single) and Gallery (multi)
 * block editors to pick images from the library. Browses by folder, with
 * client-side search on filename + alt text.
 *
 * Modes:
 *   - 'single': clicking an image confirms immediately and returns one id
 *   - 'multi':  clicking toggles selection; "Confirmer" returns the id list
 *
 * Loads on first open via the listMediaForPicker server action; keeps the
 * payload in state so subsequent folder switches are local-only filters.
 *
 * Initial selection is preserved so the user can deselect an item that's
 * already in their block.
 */

const NO_FOLDER = '__none__' as const

export interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'single' | 'multi'
  /** When mode='multi', cap the number of selectable items (omit for ∞). */
  maxItems?: number
  /** Pre-selected IDs (for re-edit flow). */
  initialIds?: ReadonlyArray<string>
  onConfirm: (ids: ReadonlyArray<string>) => void
}

export function MediaPicker({
  open,
  onOpenChange,
  mode,
  maxItems,
  initialIds = [],
  onConfirm,
}: MediaPickerProps): React.JSX.Element {
  const [data, setData] = useState<PickerData | null>(null)
  const [folderFilter, setFolderFilter] = useState<string | null | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ReadonlyArray<string>>(initialIds)
  const [isPending, startTransition] = useTransition()

  // Load on first open + whenever the folder filter changes (the action
  // re-runs server-side because the asset list narrows by folder).
  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      const fresh = await listMediaForPicker(folderFilter)
      setData(fresh)
    })
  }, [open, folderFilter])

  // Reset selection whenever the modal opens fresh — initialIds is the
  // source of truth at open time.
  useEffect(() => {
    if (open) setSelected(initialIds)
  }, [open, initialIds])

  const filteredAssets = useMemo(() => {
    if (data === null) return []
    const q = query.trim().toLowerCase()
    if (q === '') return data.assets
    return data.assets.filter(
      (a) =>
        a.originalFilename.toLowerCase().includes(q) ||
        a.altText.toLowerCase().includes(q),
    )
  }, [data, query])

  const isSelected = (id: string): boolean => selected.includes(id)

  const toggle = (asset: PickerAsset): void => {
    if (mode === 'single') {
      onConfirm([asset.id])
      onOpenChange(false)
      return
    }
    if (isSelected(asset.id)) {
      setSelected((prev) => prev.filter((x) => x !== asset.id))
      return
    }
    if (maxItems !== undefined && selected.length >= maxItems) return
    setSelected((prev) => [...prev, asset.id])
  }

  const onConfirmClick = (): void => {
    onConfirm(selected)
    onOpenChange(false)
  }

  const totalCount = data?.totalCount ?? 0
  const unclassifiedCount = data?.unclassifiedCount ?? 0
  const folders = data?.folders ?? []

  const counterLabel =
    mode === 'multi'
      ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}${maxItems !== undefined ? ` / ${maxItems}` : ''}`
      : null

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" className="max-h-[85vh] overflow-hidden">
        <ModalHeader>
          <ModalTitle>
            {mode === 'single' ? 'Choisir une image' : 'Choisir des images'}
          </ModalTitle>
          <ModalDescription>
            Parcourez la médiathèque. Cliquez sur une image pour la{' '}
            {mode === 'single' ? 'sélectionner' : 'cocher / décocher'}.
          </ModalDescription>
        </ModalHeader>

        <div className="flex h-[60vh] min-h-[400px]">
          {/* Folders rail */}
          <aside className="w-48 shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-3">
            <FolderRow
              icon={Layers}
              label="Tous"
              count={totalCount}
              active={folderFilter === undefined}
              onClick={() => setFolderFilter(undefined)}
            />
            <FolderRow
              icon={FolderOpen}
              label="Non classés"
              count={unclassifiedCount}
              active={folderFilter === null}
              onClick={() => setFolderFilter(null)}
            />
            <p className="mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
              Dossiers
            </p>
            <ul className="mt-1 space-y-0.5">
              {folders.map((f) => (
                <li key={f.id}>
                  <FolderRow
                    icon={Folder}
                    label={f.name}
                    count={f.assetCount}
                    active={folderFilter === f.id}
                    onClick={() => setFolderFilter(f.id)}
                  />
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle-fg"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Rechercher dans le dossier…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {isPending && data === null ? (
                <div className="flex h-full items-center justify-center text-muted-fg">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-fg">
                  <ImageOff className="h-6 w-6 opacity-50" aria-hidden="true" />
                  <p className="text-sm">Aucune image dans ce dossier.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {filteredAssets.map((asset) => {
                    const sel = isSelected(asset.id)
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => toggle(asset)}
                        className={`group relative aspect-square overflow-hidden rounded-sm bg-muted transition-shadow ${
                          sel
                            ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                            : 'hover:shadow-md'
                        }`}
                        aria-label={asset.altText || asset.originalFilename}
                        aria-pressed={sel}
                      >
                        {asset.publicUrl !== '' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.publicUrl}
                            alt={asset.altText || asset.originalFilename}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-fg">
                            <ImageOff className="h-4 w-4 opacity-50" aria-hidden="true" />
                          </div>
                        )}
                        {sel ? (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-fg">
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          {counterLabel !== null ? (
            <span className="mr-auto text-xs text-muted-fg">{counterLabel}</span>
          ) : null}
          <Button intent="secondary" type="button" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {mode === 'multi' ? (
            <Button
              intent="primary"
              type="button"
              onClick={onConfirmClick}
              disabled={selected.length === 0}
            >
              Confirmer la sélection
            </Button>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface FolderRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function FolderRow({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: FolderRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
        active
          ? 'bg-accent/10 font-medium text-accent-text'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? 'text-accent' : 'text-muted-fg'}`} aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[10px] tabular-nums text-muted-fg">{count}</span>
    </button>
  )
}

// Internal-only sentinel — kept for symmetry with the rail in MediaLibrary.
void NO_FOLDER
