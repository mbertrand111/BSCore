'use client'

import type React from 'react'
import { useCallback, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Folder, ImageUp, Loader2, X } from 'lucide-react'
import { Button } from '@/shared/ui/primitives'
import { uploadSingleMediaAction } from '../admin/actions'
import { ALLOWED_MIME_TYPES, MAX_SIZE_BYTES } from '../constants'

/**
 * Multi-file uploader for /admin/media/new.
 *
 * Two ways to add files:
 *   1. Click the drop zone → opens the native file picker (multi-select)
 *   2. Drag files from the OS onto the drop zone
 *
 * Each file shows a local thumbnail (URL.createObjectURL) before upload, plus
 * its size and a remove button. Client-side validation rejects unsupported
 * MIME types and oversized files immediately so the user sees the problem
 * before clicking submit. Server-side validation (in uploadSingleMediaAction)
 * is the authority — the client checks are a UX courtesy.
 *
 * On submit: files are uploaded SEQUENTIALLY (one at a time). Concurrency
 * would be faster but risks overwhelming the upstream Supabase quota and
 * makes per-file error reporting muddier. Each row updates its status live:
 * pending → uploading → success | error. After the last file, the user is
 * shown a summary with a link back to the library.
 */

const ACCEPT = ALLOWED_MIME_TYPES.join(',')
const MAX_MB = Math.round(MAX_SIZE_BYTES / 1024 / 1024)

type ItemStatus = 'pending' | 'uploading' | 'success' | 'error'

const ALT_MAX = 500

interface UploadItem {
  id: string
  file: File
  preview: string
  altText: string
  status: ItemStatus
  error?: string
}

export interface MediaUploadFormProps {
  /**
   * When provided, every uploaded file lands in this folder by default.
   * The page hosting the form derives this from a `?folderId=<uuid>` query
   * parameter so users land on a pre-filtered Téléverser screen when they
   * click the upload button while inside a folder.
   */
  defaultFolderId?: string
  /** Display name of the default folder — surfaced as a small banner. */
  defaultFolderName?: string
}

export function MediaUploadForm({
  defaultFolderId,
  defaultFolderName,
}: MediaUploadFormProps = {}): React.JSX.Element {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [items, setItems] = useState<ReadonlyArray<UploadItem>>([])
  const [isOver, setIsOver] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [globalError, setGlobalError] = useState<string | null>(null)

  const addFiles = useCallback((files: FileList | File[]): void => {
    const incoming: UploadItem[] = []
    let skipped = 0
    for (const file of Array.from(files)) {
      const error = clientValidate(file)
      if (error !== null) {
        // We surface invalid files in the list so the user sees the rejection
        // reason rather than silently ignoring them.
        incoming.push({
          id: cryptoRandomId(),
          file,
          preview: '',
          altText: '',
          status: 'error',
          error,
        })
        skipped += 1
        continue
      }
      incoming.push({
        id: cryptoRandomId(),
        file,
        preview: URL.createObjectURL(file),
        altText: '',
        status: 'pending',
      })
    }
    setItems((prev) => [...prev, ...incoming])
    setGlobalError(skipped > 0 ? `${skipped} fichier(s) refusé(s) — voir la liste.` : null)
  }, [])

  const updateAltText = (id: string, value: string): void => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, altText: value } : p)))
  }

  const removeItem = (id: string): void => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.preview !== undefined && target.preview !== '') {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const clearAll = (): void => {
    items.forEach((i) => i.preview !== '' && URL.revokeObjectURL(i.preview))
    setItems([])
    setGlobalError(null)
    if (inputRef.current !== null) inputRef.current.value = ''
  }

  // Drop zone events ---------------------------------------------------------

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault()
    setIsOver(true)
  }
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault()
    setIsOver(false)
  }
  const onDrop = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault()
    setIsOver(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }
  const onPickerChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files !== null) addFiles(e.target.files)
  }

  // Submit -------------------------------------------------------------------

  const pendingCount = items.filter((i) => i.status === 'pending').length
  const successCount = items.filter((i) => i.status === 'success').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const allDone = items.length > 0 && pendingCount === 0 && !isPending

  const onSubmit = (): void => {
    if (pendingCount === 0) return
    startTransition(async () => {
      // Snapshot the IDs to upload, then process each one and update its
      // row in state as we go.
      const targets = items.filter((i) => i.status === 'pending')
      for (const item of targets) {
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' as const } : p)),
        )
        const fd = new FormData()
        fd.set('file', item.file)
        fd.set('altText', item.altText)
        if (defaultFolderId !== undefined) fd.set('folderId', defaultFolderId)
        const result = await uploadSingleMediaAction(fd)
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? result.ok
                ? { ...p, status: 'success' as const }
                : { ...p, status: 'error' as const, error: result.error ?? 'Erreur inconnue' }
              : p,
          ),
        )
      }
      // Refresh the underlying data on the listing page so the count badge
      // and grid update without a hard reload.
      router.refresh()
    })
  }

  // Render -------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {defaultFolderId !== undefined ? (
        <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-text">
          <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Téléversement vers le dossier{' '}
            <span className="font-semibold">
              {defaultFolderName ?? 'sélectionné'}
            </span>
            .
          </span>
        </div>
      ) : null}

      {/* Drop zone */}
      <label
        htmlFor={inputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed bg-surface-elevated px-6 py-12 text-center transition-colors ${
          isOver
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-muted-fg/50 hover:bg-muted/40'
        }`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isOver ? 'bg-accent text-accent-fg' : 'bg-muted text-muted-fg'
          }`}
        >
          <ImageUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Glissez vos images ici ou{' '}
            <span className="text-accent-text underline-offset-2 hover:underline">
              cliquez pour parcourir
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-fg">
            {ALLOWED_MIME_TYPES.map((m) => m.replace('image/', '')).join(' · ')} · max {MAX_MB} Mo
            par fichier
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={onPickerChange}
          disabled={isPending}
        />
      </label>

      {globalError !== null ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {globalError}
        </p>
      ) : null}

      {/* Selected files list */}
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-border bg-surface-elevated">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
              {summaryLabel({ total: items.length, pendingCount, successCount, errorCount, isPending })}
            </p>
            {!isPending && pendingCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-muted-fg hover:text-foreground"
              >
                Tout retirer
              </button>
            ) : null}
          </div>
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const altOver = it.altText.length > ALT_MAX
              const editable = it.status === 'pending' && !isPending
              return (
                <li key={it.id} className="flex gap-3 px-4 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                    {it.preview !== '' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.preview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {it.file.name}
                        </p>
                        <p className="text-[11px] text-subtle-fg">
                          {formatSize(it.file.size)}
                          {it.error !== undefined ? (
                            <span className="text-destructive"> · {it.error}</span>
                          ) : null}
                        </p>
                      </div>
                      <StatusGlyph status={it.status} />
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          aria-label={`Retirer ${it.file.name}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    {it.status !== 'error' || it.preview !== '' ? (
                      <div>
                        <input
                          type="text"
                          value={it.altText}
                          onChange={(e) => updateAltText(it.id, e.target.value)}
                          placeholder="Texte alternatif (optionnel) — ex. : Camille & Hugo, Toscane 2025"
                          maxLength={ALT_MAX}
                          disabled={!editable}
                          aria-label={`Texte alternatif de ${it.file.name}`}
                          aria-invalid={altOver ? true : undefined}
                          className={`w-full rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-subtle-fg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                            altOver
                              ? 'border-destructive focus:ring-destructive/30'
                              : 'border-border focus:border-primary focus:ring-primary/30'
                          }`}
                        />
                        {it.altText.length > 0 ? (
                          <p
                            className={`mt-1 text-[10px] ${
                              altOver ? 'text-destructive' : 'text-subtle-fg'
                            }`}
                          >
                            {it.altText.length} / {ALT_MAX}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/media"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors duration-base hover:bg-muted"
        >
          {allDone ? 'Retour à la médiathèque' : 'Annuler'}
        </Link>
        <Button
          intent="primary"
          type="button"
          onClick={onSubmit}
          loading={isPending}
          disabled={pendingCount === 0 || isPending}
          data-testid="media-upload-submit"
        >
          {pendingCount > 0
            ? `Téléverser ${pendingCount} fichier${pendingCount > 1 ? 's' : ''}`
            : allDone
              ? 'Terminé'
              : 'Téléverser'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summaryLabel({
  total,
  pendingCount,
  successCount,
  errorCount,
  isPending,
}: {
  total: number
  pendingCount: number
  successCount: number
  errorCount: number
  isPending: boolean
}): string {
  // After upload run: show what got through and what didn't.
  if (!isPending && pendingCount === 0 && total > 0) {
    if (errorCount === 0) {
      return `${successCount} fichier${successCount > 1 ? 's' : ''} téléversé${successCount > 1 ? 's' : ''}`
    }
    return `${successCount} téléversé${successCount > 1 ? 's' : ''}, ${errorCount} échec${errorCount > 1 ? 's' : ''}`
  }
  // During upload: progress.
  if (isPending) {
    const done = successCount + errorCount
    return `${done} sur ${total} traité${done > 1 ? 's' : ''}…`
  }
  // Pre-upload: just say how many are queued, without the redundant "en attente".
  return `${total} fichier${total > 1 ? 's' : ''} prêt${total > 1 ? 's' : ''} à téléverser`
}

function StatusGlyph({ status }: { status: ItemStatus }): React.JSX.Element | null {
  // No glyph for pending — the absence of a status icon already means
  // "not yet uploaded", and the row's [X] remove button is the actionable
  // affordance. Adding a redundant "EN ATTENTE" label was confusing.
  if (status === 'pending') return null
  if (status === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-info">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success/10 text-success">
        <Check className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <AlertCircle className="h-4 w-4" />
    </span>
  )
}

function clientValidate(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Type non supporté (${file.type || 'inconnu'}).`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Trop volumineux (${formatSize(file.size)} > ${MAX_MB} Mo).`
  }
  return null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function cryptoRandomId(): string {
  // Fast unique id for list keys — no security implication.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}
