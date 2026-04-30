'use client'

import type React from 'react'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/primitives'
import { CmsDeletePageDialog } from './CmsDeletePageDialog'

export interface CmsDeleteButtonProps {
  id: string
  title: string
  /** Optional — slug + status make the dialog wording specific. */
  slug?: string
  status?: 'draft' | 'published'
}

/**
 * Trigger button for the editor right-rail "Supprimer la page" action.
 *
 * Opens the themed `CmsDeletePageDialog` instead of the native browser
 * confirm. The dialog handles the action call + loading state + error
 * surfacing and ends with a redirect to /admin/cms.
 */
export function CmsDeleteButton({
  id,
  title,
  slug,
  status,
}: CmsDeleteButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        intent="destructive"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
        data-testid="cms-delete"
        leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
        className="w-full justify-center"
      >
        Supprimer la page
      </Button>
      <CmsDeletePageDialog
        open={open}
        onOpenChange={setOpen}
        pageId={id}
        pageTitle={title}
        {...(slug !== undefined ? { pageSlug: slug } : {})}
        {...(status !== undefined ? { pageStatus: status } : {})}
      />
    </>
  )
}
