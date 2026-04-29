'use client'

import type React from 'react'
import { Button } from '@/shared/ui/primitives'
import { deleteCmsPageAction } from '../admin/actions'

export interface CmsDeleteButtonProps {
  id: string
  title: string
}

/**
 * Inline delete button. Native confirm() before submitting the Server
 * Action — sufficient for V1; a Modal-based confirm can replace it
 * later without touching the action contract.
 */
export function CmsDeleteButton({ id, title }: CmsDeleteButtonProps): React.JSX.Element {
  const action = deleteCmsPageAction.bind(null, id)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <Button intent="destructive" size="sm" type="submit" data-testid="cms-delete">
        Delete
      </Button>
    </form>
  )
}
