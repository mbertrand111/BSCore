'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/ui/patterns'
import { Button } from '@/shared/ui/primitives'
import { deleteCmsPageAction } from '../admin/actions'

/**
 * Themed confirmation dialog used both on the Pages list (3-dot menu) and
 * on the page editor (right-rail "Supprimer la page" button).
 *
 * Single component — both callers control the open state and provide the
 * page id + title. The dialog handles:
 *   - the action call via useTransition (loading state on the button)
 *   - error surfacing inside the modal (no toast)
 *   - calling onDeleted() AFTER the action returns so the parent can
 *     refresh / navigate.
 *
 * The action itself (`deleteCmsPageAction`) ends with `redirect('/admin/cms')`
 * — so calling from anywhere lands the user on the list. From the list,
 * the redirect re-renders the list with one fewer row.
 */
export interface CmsDeletePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string
  pageTitle: string
  /** Optional — when known, the modal mentions the public URL impacted. */
  pageSlug?: string
  /** Optional — when 'published', the modal warns the URL will return 404. */
  pageStatus?: 'draft' | 'published'
  /** Called once the delete succeeds (before the action's own redirect lands). */
  onDeleted?: () => void
}

export function CmsDeletePageDialog({
  open,
  onOpenChange,
  pageId,
  pageTitle,
  pageSlug,
  pageStatus,
  onDeleted,
}: CmsDeletePageDialogProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onConfirm = (): void => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteCmsPageAction(pageId)
        // The action triggers a Next.js redirect — by the time we get here
        // the navigation has already been queued. We still notify the
        // caller in case they want to do something synchronously (analytics,
        // toast, …). The dialog will unmount on navigation.
        onDeleted?.()
      } catch (err) {
        // Filter Next's internal redirect "errors" — they're a control-flow
        // signal, not a real failure. Anything else is surfaced inline.
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('NEXT_REDIRECT')) return
        setError(message || "La suppression a échoué. Veuillez réessayer.")
      }
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <ModalTitle>Supprimer cette page ?</ModalTitle>
              <ModalDescription>
                Cette action est <strong>irréversible</strong> — la page et son contenu
                seront perdus définitivement.
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <div className="space-y-3 px-5 py-4 text-sm">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-subtle-fg">Page</p>
            <p className="mt-0.5 truncate font-medium text-foreground">{pageTitle}</p>
            {pageSlug !== undefined ? (
              <p className="truncate font-mono text-[11px] text-subtle-fg">/{pageSlug}</p>
            ) : null}
          </div>

          {pageStatus === 'published' ? (
            <p className="text-muted-fg">
              La page est actuellement <strong className="text-foreground">publiée</strong>.
              Son URL publique{' '}
              {pageSlug !== undefined ? (
                <>
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                    /{pageSlug}
                  </code>{' '}
                </>
              ) : null}
              renverra une erreur 404 dès la suppression.
            </p>
          ) : (
            <p className="text-muted-fg">
              La page est en brouillon — elle n&apos;est pas visible publiquement, mais son
              contenu sera tout de même perdu.
            </p>
          )}

          {error !== null ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
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
            intent="destructive"
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            leadingIcon={
              isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )
            }
          >
            {isPending ? 'Suppression…' : 'Supprimer définitivement'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
