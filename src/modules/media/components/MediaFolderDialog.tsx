'use client'

import type React from 'react'
import { useEffect, useId, useState, useTransition } from 'react'
import { Folder, Loader2 } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/ui/patterns'
import { Button, Input, Textarea } from '@/shared/ui/primitives'
import {
  createFolderAction,
  updateFolderAction,
  type FolderActionResult,
} from '../admin/folder-actions'

/**
 * Modal used for both "Nouveau dossier" (create) and "Renommer le dossier"
 * (edit). Single component because the form fields are identical — only
 * the action wired to submit differs.
 *
 * Closed by default. The parent controls open state and provides the
 * starting values when editing.
 */
export interface MediaFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Provide an existing folder to switch to "edit" mode. */
  folder?: { id: string; name: string; description: string | null }
  /** Called after a successful save with the resulting folder slug. */
  onSaved?: (slug: string | undefined) => void
}

export function MediaFolderDialog({
  open,
  onOpenChange,
  folder,
  onSaved,
}: MediaFolderDialogProps): React.JSX.Element {
  const isEdit = folder !== undefined
  const titleId = useId()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Reset form whenever the dialog opens or switches between create/edit.
  useEffect(() => {
    if (!open) return
    setName(folder?.name ?? '')
    setDescription(folder?.description ?? '')
    setError(null)
    setFieldErrors({})
  }, [open, folder])

  const submit = (): void => {
    setError(null)
    setFieldErrors({})
    startTransition(async () => {
      const result: FolderActionResult = isEdit
        ? await updateFolderAction(folder.id, { name, description })
        : await createFolderAction({ name, description })
      if (!result.ok) {
        setError(result.error ?? null)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }
      onSaved?.(result.slug)
      onOpenChange(false)
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md" aria-labelledby={titleId}>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Folder className="h-4 w-4" />
            </span>
            <div>
              <ModalTitle>
                <span id={titleId}>{isEdit ? 'Renommer le dossier' : 'Nouveau dossier'}</span>
              </ModalTitle>
              <ModalDescription>
                {isEdit
                  ? 'Modifiez le nom et la description du dossier.'
                  : 'Créez un dossier pour organiser vos médias.'}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="folder-name" className="text-xs font-medium text-foreground">
              Nom <span className="text-destructive">*</span>
            </label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. : Mariages 2026"
              maxLength={120}
              required
              autoFocus
              disabled={isPending}
              state={fieldErrors.name !== undefined ? 'error' : 'default'}
              className="mt-1.5"
            />
            {fieldErrors.name !== undefined ? (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            ) : (
              <p className="mt-1 text-xs text-subtle-fg">
                Un identifiant URL (slug) sera généré automatiquement à partir du nom.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="folder-description"
              className="text-xs font-medium text-foreground"
            >
              Description{' '}
              <span className="text-subtle-fg">(optionnelle)</span>
            </label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes internes pour l'équipe — non visibles publiquement."
              maxLength={500}
              rows={3}
              disabled={isPending}
              state={fieldErrors.description !== undefined ? 'error' : 'default'}
              className="mt-1.5"
            />
            {fieldErrors.description !== undefined ? (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>
            ) : null}
          </div>

          {error !== null ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          <Button
            intent="secondary"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            intent="primary"
            type="button"
            onClick={submit}
            disabled={isPending || name.trim().length === 0}
            leadingIcon={isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
          >
            {isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le dossier'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
