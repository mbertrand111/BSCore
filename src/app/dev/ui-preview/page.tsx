import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEnv } from '@/socle/config/env'

import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Label,
  Badge,
  Spinner,
  Skeleton,
} from '@/shared/ui/primitives'
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  FormLayout,
  FormField,
  DataTable,
  type DataTableColumn,
} from '@/shared/ui/patterns'
import {
  AdminPageHeader,
  AdminSection,
  AdminEmptyState,
  AdminForbidden,
  AdminNotFound,
} from '@/shared/ui/admin'

import { InteractiveDemos } from './ui-preview-client'

export const metadata: Metadata = {
  title: 'UI Preview',
  robots: { index: false, follow: false },
}

interface MockRow {
  id: string
  name: string
  role: string
  status: string
}

const MOCK_ROWS: ReadonlyArray<MockRow> = [
  { id: '1', name: 'Alice Martin',  role: 'admin',       status: 'active' },
  { id: '2', name: 'Boris Petit',   role: 'super_admin', status: 'active' },
  { id: '3', name: 'Camille Roy',   role: 'admin',       status: 'invited' },
  { id: '4', name: 'David Garcia',  role: 'admin',       status: 'inactive' },
]

const MOCK_COLUMNS: ReadonlyArray<DataTableColumn<MockRow>> = [
  { key: 'name',   label: 'Name',   accessor: 'name' },
  { key: 'role',   label: 'Role',   render: (r) => <Badge intent="neutral">{r.role}</Badge> },
  {
    key: 'status', label: 'Status',
    render: (r) => {
      const intent = r.status === 'active' ? 'success' : r.status === 'invited' ? 'info' : 'neutral'
      return <Badge intent={intent}>{r.status}</Badge>
    },
  },
]

const COLOR_TOKENS: ReadonlyArray<{ name: string; surface: string; fg?: string }> = [
  { name: 'background',  surface: 'bg-background',  fg: 'text-foreground' },
  { name: 'foreground',  surface: 'bg-foreground',  fg: 'text-background' },
  { name: 'muted',       surface: 'bg-muted',       fg: 'text-muted-fg' },
  { name: 'border',      surface: 'bg-border',      fg: 'text-foreground' },
  { name: 'primary',     surface: 'bg-primary',     fg: 'text-primary-fg' },
  { name: 'accent',      surface: 'bg-accent',      fg: 'text-accent-fg' },
  { name: 'destructive', surface: 'bg-destructive', fg: 'text-destructive-fg' },
  { name: 'success',     surface: 'bg-success',     fg: 'text-success-fg' },
  { name: 'warning',     surface: 'bg-warning',     fg: 'text-warning-fg' },
  { name: 'info',        surface: 'bg-info',        fg: 'text-info-fg' },
]

const RADIUS_TOKENS: ReadonlyArray<{ name: string; className: string }> = [
  { name: 'sm', className: 'rounded-sm' },
  { name: 'md', className: 'rounded-md' },
  { name: 'lg', className: 'rounded-lg' },
]

export default function UIPreviewPage(): React.JSX.Element {
  // Dev-only surface — never exposed in production.
  if (getEnv('NODE_ENV') === 'production') {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-8 sm:px-6 sm:py-12">
      {/* Intro */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">BSCore UI Preview</h1>
        <p className="text-sm text-muted-fg">
          Internal development surface. Renders every primitive, pattern, and admin composition
          with their variants and states. Not linked from the navigation. Returns 404 in
          production. Contains no business logic, no DB query, no auth.
        </p>
      </header>

      {/* Tokens */}
      <Section title="Tokens">
        <Subsection title="Colors">
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
            {COLOR_TOKENS.map((token) => (
              <div
                key={token.name}
                className={`flex h-20 items-end justify-between rounded-md border border-border p-2 ${token.surface} ${token.fg ?? ''}`}
              >
                <span className="text-xs font-medium">{token.name}</span>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="Radius">
          <div className="flex flex-wrap items-end gap-4">
            {RADIUS_TOKENS.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-16 bg-primary ${r.className}`} aria-hidden="true" />
                <span className="text-xs text-muted-fg">{r.name}</span>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="Typography">
          <div className="space-y-2">
            <p className="font-sans text-base text-foreground">
              font-sans — The quick brown fox jumps over the lazy dog.
            </p>
            <p className="font-mono text-sm text-foreground">
              font-mono — const greeting = &quot;Hello, BSCore&quot;
            </p>
          </div>
        </Subsection>
      </Section>

      {/* Primitives */}
      <Section title="Primitives">
        <Subsection title="Button — intents">
          <div className="flex flex-wrap items-center gap-2">
            <Button intent="primary">Primary</Button>
            <Button intent="secondary">Secondary</Button>
            <Button intent="destructive">Destructive</Button>
            <Button intent="ghost">Ghost</Button>
          </div>
        </Subsection>

        <Subsection title="Button — sizes">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Subsection>

        <Subsection title="Button — states">
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button intent="destructive" disabled>Disabled destructive</Button>
          </div>
        </Subsection>

        <Subsection title="Input">
          <div className="grid max-w-md gap-3">
            <div>
              <Label htmlFor="ui-input-default">Default</Label>
              <Input id="ui-input-default" placeholder="Type something" />
            </div>
            <div>
              <Label htmlFor="ui-input-error">Error state</Label>
              <Input id="ui-input-error" state="error" defaultValue="Invalid value" />
            </div>
            <div>
              <Label htmlFor="ui-input-disabled">Disabled</Label>
              <Input id="ui-input-disabled" disabled defaultValue="Read only" />
            </div>
          </div>
        </Subsection>

        <Subsection title="Textarea">
          <div className="grid max-w-md gap-3">
            <div>
              <Label htmlFor="ui-textarea-default">Default</Label>
              <Textarea id="ui-textarea-default" placeholder="Notes…" />
            </div>
            <div>
              <Label htmlFor="ui-textarea-error">Error state</Label>
              <Textarea id="ui-textarea-error" state="error" defaultValue="Too short" />
            </div>
          </div>
        </Subsection>

        <Subsection title="Select">
          <div className="grid max-w-md gap-3">
            <div>
              <Label htmlFor="ui-select-default">Default</Label>
              <Select id="ui-select-default" defaultValue="admin">
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="ui-select-disabled">Disabled</Label>
              <Select id="ui-select-disabled" disabled defaultValue="admin">
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
        </Subsection>

        <Subsection title="Checkbox (static)">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked={false} /> Unchecked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked /> Checked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox disabled /> Disabled
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked disabled /> Disabled + checked
            </label>
          </div>
        </Subsection>

        <Subsection title="Switch (static)">
          <div className="flex flex-wrap items-center gap-4">
            <Switch defaultChecked={false} label="Off" />
            <Switch defaultChecked label="On" />
            <Switch disabled label="Disabled (off)" />
            <Switch defaultChecked disabled label="Disabled (on)" />
          </div>
        </Subsection>

        <Subsection title="Badge">
          <div className="flex flex-wrap items-center gap-2">
            <Badge intent="neutral">neutral</Badge>
            <Badge intent="success">success</Badge>
            <Badge intent="warning">warning</Badge>
            <Badge intent="danger">danger</Badge>
            <Badge intent="info">info</Badge>
          </div>
        </Subsection>

        <Subsection title="Spinner">
          <div className="flex flex-wrap items-center gap-4 text-foreground">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </Subsection>

        <Subsection title="Skeleton">
          <div className="max-w-sm space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Subsection>

        <Subsection title="Interactive demos (client)">
          <InteractiveDemos />
        </Subsection>
      </Section>

      {/* Patterns */}
      <Section title="Patterns">
        <Subsection title="Card (Header / Body / Footer)">
          <Card className="max-w-md">
            <Card.Header>
              <h3 className="text-sm font-semibold text-foreground">Card title</h3>
              <Badge intent="info">draft</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-sm text-muted-fg">
                Body content lives here. Cards bound a content surface and stack vertically.
              </p>
            </Card.Body>
            <Card.Footer>
              <Button intent="ghost" size="sm">Cancel</Button>
              <Button intent="primary" size="sm">Save</Button>
            </Card.Footer>
          </Card>
        </Subsection>

        <Subsection title="EmptyState">
          <EmptyState
            title="No items yet"
            description="Once items are created they will appear here."
            action={<Button intent="primary" size="sm">Create item</Button>}
          />
        </Subsection>

        <Subsection title="ErrorState">
          <ErrorState
            title="Something went wrong"
            description="The list could not be loaded. The full error is in the server logs."
            action={<Button intent="secondary" size="sm">Retry</Button>}
          />
        </Subsection>

        <Subsection title="LoadingState">
          <LoadingState label="Loading items…" />
        </Subsection>

        <Subsection title="FormLayout (no submission)">
          <FormLayout
            className="max-w-md"
            action="#"
            footer={
              <>
                <Button intent="ghost" size="md" type="button">Cancel</Button>
                <Button intent="primary" size="md" type="button">Save</Button>
              </>
            }
          >
            <FormField label="Name" htmlFor="ui-form-name" required>
              <Input id="ui-form-name" name="name" placeholder="Jane Doe" />
            </FormField>
            <FormField label="Email" htmlFor="ui-form-email" hint="We will never share it.">
              <Input id="ui-form-email" name="email" type="email" placeholder="jane@example.com" />
            </FormField>
            <FormField label="Bio" htmlFor="ui-form-bio" error="This field is required.">
              <Textarea id="ui-form-bio" name="bio" state="error" />
            </FormField>
          </FormLayout>
        </Subsection>

        <Subsection title="DataTable (mock data)">
          <DataTable
            testId="ui-preview-table"
            columns={MOCK_COLUMNS}
            rows={MOCK_ROWS}
            rowId={(r) => r.id}
          />
        </Subsection>

        <Subsection title="DataTable (empty)">
          <DataTable
            testId="ui-preview-empty-table"
            columns={MOCK_COLUMNS}
            rows={[]}
            rowId={(r) => r.id}
            emptyTitle="No users yet"
            emptyDescription="Seed test users with npm run seed:e2e."
          />
        </Subsection>
      </Section>

      {/* Admin */}
      <Section title="Admin compositions">
        <Subsection title="AdminPageHeader">
          <Card>
            <Card.Body>
              <AdminPageHeader
                title="Users"
                description="Manage who can access the admin shell."
                breadcrumbs={[
                  { label: 'Admin', href: '#' },
                  { label: 'Users' },
                ]}
                action={<Button intent="primary" size="md">New user</Button>}
              />
              <p className="text-xs text-muted-fg">↑ AdminPageHeader rendered above this line.</p>
            </Card.Body>
          </Card>
        </Subsection>

        <Subsection title="AdminSection">
          <AdminSection
            title="Profile"
            description="Public-facing identity for this user."
            action={<Button intent="ghost" size="sm">Edit</Button>}
          >
            <p className="text-sm text-muted-fg">Section body content lives here.</p>
          </AdminSection>
        </Subsection>

        <Subsection title="AdminEmptyState">
          <AdminEmptyState
            description="Create the first user to populate the list."
            action={<Button intent="primary" size="sm">Create user</Button>}
          />
        </Subsection>

        <Subsection title="AdminForbidden">
          <AdminForbidden
            action={<Button intent="secondary" size="sm">Back to dashboard</Button>}
          />
        </Subsection>

        <Subsection title="AdminNotFound">
          <AdminNotFound
            action={<Button intent="secondary" size="sm">Back to list</Button>}
          />
        </Subsection>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-xs text-muted-fg">
        <p>
          Modal / Dialog: not shipped in V1 (FRONTEND.md OQ F-1, headless lib not chosen).
          Toast orchestration: not shipped in V1 (FRONTEND.md OQ F-2, only the visual primitive).
        </p>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Local layout helpers — kept inline to avoid leaking preview-only components
// into the shared design system.
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-6 rounded-md border border-border bg-background p-6">
        {children}
      </div>
    </section>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-fg">{title}</h3>
      <div>{children}</div>
    </div>
  )
}
