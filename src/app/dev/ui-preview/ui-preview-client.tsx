'use client'

import type React from 'react'
import { useMemo, useState } from 'react'
import { MoreVertical, Pencil, Trash2, HelpCircle } from 'lucide-react'
import { Checkbox } from '@/shared/ui/primitives/Checkbox'
import { Switch } from '@/shared/ui/primitives/Switch'
import { Button } from '@/shared/ui/primitives/Button'
import {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/shared/ui/patterns/Modal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/shared/ui/patterns/DropdownMenu'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/shared/ui/patterns/Tooltip'
import { Pagination } from '@/shared/ui/patterns/Pagination'
import { useToast } from '@/shared/ui/patterns/Toast'
import { RichTextEditor } from '@/shared/ui/patterns/RichTextEditor'
import {
  DataTable,
  type DataTableColumn,
  type SortState,
} from '@/shared/ui/patterns/DataTable'
import { Badge } from '@/shared/ui/primitives/Badge'

interface MockRow {
  id: string
  name: string
  role: string
  status: string
}

const ROWS: ReadonlyArray<MockRow> = [
  { id: '1', name: 'Alice Martin',  role: 'admin',       status: 'active' },
  { id: '2', name: 'Boris Petit',   role: 'super_admin', status: 'active' },
  { id: '3', name: 'Camille Roy',   role: 'admin',       status: 'invited' },
  { id: '4', name: 'David Garcia',  role: 'admin',       status: 'inactive' },
  { id: '5', name: 'Elsa Brun',     role: 'super_admin', status: 'active' },
]

/**
 * Client island for the UI preview page. Hosts every demo that needs
 * client state (Modal, Dropdown, Tooltip, Toast, RichText, sort,
 * pagination). No business logic.
 */
export function InteractiveDemos(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <ToggleDemos />
      <OverlayDemos />
      <TooltipDemo />
      <ToastDemo />
      <SortableTableDemo />
      <PaginationDemo />
      <RichTextDemo />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle demos (Checkbox, Switch, click counter)
// ---------------------------------------------------------------------------

function ToggleDemos(): React.JSX.Element {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false)
  const [enabled, setEnabled] = useState(true)
  const [clicks, setClicks] = useState(0)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex items-center gap-3 rounded-md border border-border p-3">
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Interactive checkbox demo"
        />
        <span className="text-sm text-foreground">
          Interactive checkbox — currently {String(checked)}
        </span>
        <Button
          intent="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setChecked(checked === 'indeterminate' ? false : 'indeterminate')}
        >
          Toggle indeterminate
        </Button>
      </label>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Switch
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          label={enabled ? 'Enabled' : 'Disabled'}
        />
        <span className="text-xs text-muted-fg">state: {enabled ? 'on' : 'off'}</span>
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

// ---------------------------------------------------------------------------
// Modal + Dropdown demos
// ---------------------------------------------------------------------------

function OverlayDemos(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Modal</p>
        <Modal open={open} onOpenChange={setOpen}>
          <ModalTrigger asChild>
            <Button intent="primary" size="sm">Open modal</Button>
          </ModalTrigger>
          <ModalContent size="md">
            <ModalHeader>
              <ModalTitle>Confirm action</ModalTitle>
              <ModalDescription>
                Modals lock focus, close on ESC, animate via Tailwind keyframes.
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-muted-fg">
                Replace this body with any form, list, or details. The modal handles the shell,
                focus trap, and overlay.
              </p>
            </ModalBody>
            <ModalFooter>
              <ModalClose asChild>
                <Button intent="ghost">Cancel</Button>
              </ModalClose>
              <ModalClose asChild>
                <Button intent="primary">Confirm</Button>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">DropdownMenu</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button intent="secondary" size="sm" trailingIcon={<MoreVertical className="h-4 w-4" />}>
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Item options</DropdownMenuLabel>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function TooltipDemo(): React.JSX.Element {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="mb-3 text-sm font-medium text-foreground">Tooltip</p>
      <div className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button intent="ghost" size="sm" aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Click to read the docs</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button intent="secondary" size="sm">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip below the trigger</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast — uses the global ToastProvider mounted in src/app/layout.tsx
// ---------------------------------------------------------------------------

function ToastDemo(): React.JSX.Element {
  const { toast } = useToast()

  return (
    <div className="rounded-md border border-border p-4">
      <p className="mb-3 text-sm font-medium text-foreground">Toast (provider + queue)</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          intent="primary"
          size="sm"
          onClick={() =>
            toast({
              intent: 'success',
              title: 'Saved',
              description: 'Your changes have been written.',
            })
          }
        >
          Success toast
        </Button>
        <Button
          intent="destructive"
          size="sm"
          onClick={() =>
            toast({
              intent: 'error',
              title: 'Could not save',
              description: 'Try again in a moment.',
            })
          }
        >
          Error toast
        </Button>
        <Button
          intent="secondary"
          size="sm"
          onClick={() =>
            toast({
              intent: 'info',
              title: 'Heads up',
              description: 'A new version is available.',
            })
          }
        >
          Info toast
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable DataTable — caller controls sort state and applies it to rows
// ---------------------------------------------------------------------------

function SortableTableDemo(): React.JSX.Element {
  const [sort, setSort] = useState<SortState | null>({ key: 'name', direction: 'asc' })

  const sortedRows = useMemo(() => {
    if (sort === null) return ROWS
    const sorted = [...ROWS].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sort.key])
      const bv = String((b as unknown as Record<string, unknown>)[sort.key])
      return av.localeCompare(bv) * (sort.direction === 'asc' ? 1 : -1)
    })
    return sorted
  }, [sort])

  const columns: ReadonlyArray<DataTableColumn<MockRow>> = [
    { key: 'name', label: 'Name', accessor: 'name', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (r) => <Badge intent="highlight">{r.role}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => {
        const intent =
          r.status === 'active' ? 'success' : r.status === 'invited' ? 'info' : 'neutral'
        return <Badge intent={intent}>{r.status}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">DataTable — sortable</p>
      <DataTable
        testId="ui-preview-sortable-table"
        columns={columns}
        rows={sortedRows}
        rowId={(r) => r.id}
        sort={sort}
        onSortChange={setSort}
      />
      <p className="text-xs text-muted-fg">
        Current sort:{' '}
        <span className="font-mono text-foreground">
          {sort === null ? 'none' : `${sort.key} ${sort.direction}`}
        </span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function PaginationDemo(): React.JSX.Element {
  const [page, setPage] = useState(4)

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <p className="text-sm font-medium text-foreground">Pagination</p>
      <Pagination page={page} pageCount={12} onPageChange={setPage} />
      <p className="text-xs text-muted-fg">
        Current page: <span className="font-mono text-foreground">{page}</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rich text editor (TipTap)
// ---------------------------------------------------------------------------

function RichTextDemo(): React.JSX.Element {
  const [html, setHtml] = useState(
    '<p>Try the toolbar above. <strong>Bold</strong>, <em>italic</em>, headings, lists…</p>',
  )

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">RichTextEditor (TipTap)</p>
      <RichTextEditor value={html} onChange={setHtml} />
      <details className="rounded-md border border-border bg-muted/40 p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-fg">
          Show emitted HTML
        </summary>
        <pre className="mt-2 overflow-x-auto text-xs text-foreground">{html}</pre>
      </details>
    </div>
  )
}
