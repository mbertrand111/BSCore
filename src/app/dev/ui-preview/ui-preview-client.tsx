'use client'

import type React from 'react'
import { useState } from 'react'
import { Checkbox } from '@/shared/ui/primitives/Checkbox'
import { Switch } from '@/shared/ui/primitives/Switch'
import { Button } from '@/shared/ui/primitives/Button'

/**
 * Small client island for the UI preview page.
 * Hosts the genuinely interactive demos so the rest of the page can stay a
 * Server Component. No business logic, no fetch — local component state only.
 */
export function InteractiveDemos(): React.JSX.Element {
  const [checked, setChecked] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [clicks, setClicks] = useState(0)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex items-center gap-3 rounded-md border border-border p-3">
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="text-sm text-foreground">
          Interactive checkbox — currently {checked ? 'checked' : 'unchecked'}
        </span>
      </label>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Switch
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          label={enabled ? 'Enabled' : 'Disabled'}
        />
        <span className="text-xs text-muted-fg">
          state: {enabled ? 'on' : 'off'}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3 sm:col-span-2">
        <Button intent="primary" size="sm" onClick={() => setClicks((c) => c + 1)}>
          Increment
        </Button>
        <span className="text-sm text-muted-fg">
          Clicks: <span className="font-mono text-foreground">{clicks}</span>
        </span>
      </div>
    </div>
  )
}
