'use client'

import type React from 'react'
import { Button } from '@/shared/ui/primitives'
import { deleteMediaAction } from '../admin/actions'

export interface MediaDeleteButtonProps {
  id: string
  filename: string
}

/**
 * Inline delete button. Confirms via native dialog before submitting the
 * Server Action. Native confirm is enough for V1 — a Modal-based dialog
 * can replace it later without touching the action contract.
 */
export function MediaDeleteButton({ id, filename }: MediaDeleteButtonProps): React.JSX.Element {
  const action = deleteMediaAction.bind(null, id)

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <Button intent="destructive" size="sm" type="submit" data-testid="media-delete">
        Delete
      </Button>
    </form>
  )
}
