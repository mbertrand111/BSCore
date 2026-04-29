import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check, Sparkles, AlertTriangle, Mail } from 'lucide-react'
import { getEnv } from '@/socle/config/env'

import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
  Checkbox,
  Switch,
  Label,
  Badge,
  Icon,
  Spinner,
  Skeleton,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/shared/ui/primitives'
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Toast,
  FormLayout,
  FormField,
  DataTable,
  Container,
  Grid,
  Overlay,
  ImageFrame,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
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
  { key: 'role',   label: 'Role',   render: (r) => <Badge intent="highlight">{r.role}</Badge> },
  {
    key: 'status', label: 'Status',
    render: (r) => {
      const intent = r.status === 'active' ? 'success' : r.status === 'invited' ? 'info' : 'neutral'
      return <Badge intent={intent}>{r.status}</Badge>
    },
  },
]

const COLOR_TOKENS: ReadonlyArray<{ name: string; surface: string; fg?: string }> = [
  { name: 'background',       surface: 'bg-background',       fg: 'text-foreground' },
  { name: 'foreground',       surface: 'bg-foreground',       fg: 'text-background' },
  { name: 'muted',            surface: 'bg-muted',            fg: 'text-muted-fg' },
  { name: 'border',           surface: 'bg-border',           fg: 'text-foreground' },
  { name: 'surface-elevated', surface: 'bg-surface-elevated', fg: 'text-foreground' },
  { name: 'primary',          surface: 'bg-primary',          fg: 'text-primary-fg' },
  { name: 'accent',           surface: 'bg-accent',           fg: 'text-accent-fg' },
  { name: 'destructive',      surface: 'bg-destructive',      fg: 'text-destructive-fg' },
  { name: 'success',          surface: 'bg-success',          fg: 'text-success-fg' },
  { name: 'warning',          surface: 'bg-warning',          fg: 'text-warning-fg' },
  { name: 'info',             surface: 'bg-info',             fg: 'text-info-fg' },
  { name: 'overlay-dark/50',  surface: 'bg-overlay-dark/50',  fg: 'text-background' },
]

const RADIUS_TOKENS: ReadonlyArray<{ name: string; className: string }> = [
  { name: 'sm',   className: 'rounded-sm' },
  { name: 'md',   className: 'rounded-md' },
  { name: 'card', className: 'rounded-card' },
  { name: 'lg (pill)', className: 'rounded-lg' },
]

const SHADOW_TOKENS: ReadonlyArray<{ name: string; className: string }> = [
  { name: 'shadow-sm', className: 'shadow-sm' },
  { name: 'shadow-md', className: 'shadow-md' },
  { name: 'shadow-lg', className: 'shadow-lg' },
]

export default function UIPreviewPage(): React.JSX.Element {
  if (getEnv('NODE_ENV') === 'production') {
    notFound()
  }

  return (
    <Container size="xl" className="space-y-12 py-10">
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
          <Grid cols={4} gap="sm">
            {COLOR_TOKENS.map((token) => (
              <div
                key={token.name}
                className={`flex h-20 items-end justify-between rounded-md border border-border p-2 ${token.surface} ${token.fg ?? ''}`}
              >
                <span className="text-xs font-medium">{token.name}</span>
              </div>
            ))}
          </Grid>
        </Subsection>

        <Subsection title="Radius">
          <div className="flex flex-wrap items-end gap-4">
            {RADIUS_TOKENS.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-24 bg-primary ${r.className}`} aria-hidden="true" />
                <span className="text-xs text-muted-fg">{r.name}</span>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="Shadow">
          <div className="flex flex-wrap items-end gap-6">
            {SHADOW_TOKENS.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-24 rounded-card bg-surface-elevated ${s.className}`} aria-hidden="true" />
                <span className="text-xs text-muted-fg">{s.name}</span>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="Typography">
          <div className="space-y-2">
            <p className="font-heading text-2xl font-semibold text-foreground">
              Heading — The quick brown fox.
            </p>
            <p className="font-subheading text-lg font-medium text-foreground">
              Subheading — The quick brown fox.
            </p>
            <p className="font-body text-base text-foreground">
              Body — The quick brown fox jumps over the lazy dog.
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
            <Button intent="accent">Accent</Button>
            <Button intent="destructive">Destructive</Button>
            <Button intent="ghost">Ghost</Button>
          </div>
        </Subsection>

        <Subsection title="Button — sizes & rounded">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button rounded="lg">Pill</Button>
            <Button leadingIcon={<Mail className="h-4 w-4" />}>With icon</Button>
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
            <div>
              <Label htmlFor="ui-input-icon">With leading icon</Label>
              <Input
                id="ui-input-icon"
                placeholder="you@example.com"
                leadingSlot={<Mail className="h-4 w-4" />}
              />
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

        <Subsection title="Select (Radix)">
          <div className="grid max-w-md gap-3">
            <div>
              <Label htmlFor="ui-select-default">Default</Label>
              <Select id="ui-select-default" defaultValue="admin" placeholder="Pick a role">
                <SelectGroup>
                  <SelectLabel>Available roles</SelectLabel>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super admin</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value="viewer" disabled>Viewer (coming soon)</SelectItem>
              </Select>
            </div>
            <div>
              <Label htmlFor="ui-select-disabled">Disabled</Label>
              <Select id="ui-select-disabled" disabled defaultValue="admin" placeholder="Pick a role">
                <SelectItem value="admin">Admin</SelectItem>
              </Select>
            </div>
          </div>
        </Subsection>

        <Subsection title="Checkbox (Radix) — static">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox aria-label="Unchecked demo" /> Unchecked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked aria-label="Checked demo" /> Checked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox disabled aria-label="Disabled demo" /> Disabled
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked disabled aria-label="Disabled checked demo" /> Disabled + checked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <Checkbox state="error" defaultChecked aria-label="Error demo" /> Error
            </label>
          </div>
        </Subsection>

        <Subsection title="Switch — static">
          <div className="flex flex-wrap items-center gap-4">
            <Switch defaultChecked={false} label="Off" />
            <Switch defaultChecked label="On" />
            <Switch disabled label="Disabled (off)" />
            <Switch defaultChecked disabled label="Disabled (on)" />
          </div>
        </Subsection>

        <Subsection title="Badge — all intents">
          <div className="flex flex-wrap items-center gap-2">
            <Badge intent="neutral">neutral</Badge>
            <Badge intent="success">success</Badge>
            <Badge intent="warning">warning</Badge>
            <Badge intent="danger">danger</Badge>
            <Badge intent="info">info</Badge>
            <Badge intent="accent">accent</Badge>
            <Badge intent="highlight">highlight</Badge>
            <Badge intent="outline">outline</Badge>
          </div>
        </Subsection>

        <Subsection title="Icon (lucide-react)">
          <div className="flex flex-wrap items-center gap-4 text-foreground">
            <Icon size="sm"><Check /></Icon>
            <Icon size="md"><Sparkles /></Icon>
            <Icon size="lg"><AlertTriangle className="text-warning" /></Icon>
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
        <Subsection title="Card — variants">
          <Grid cols={3}>
            {(['default', 'outlined', 'elevated', 'soft', 'accent'] as const).map((variant) => (
              <Card key={variant} variant={variant}>
                <Card.Header>
                  <h3 className="text-sm font-semibold capitalize text-foreground">{variant}</h3>
                </Card.Header>
                <Card.Body>
                  <p className="text-sm text-muted-fg">
                    Card variant: <span className="font-mono">{variant}</span>.
                  </p>
                </Card.Body>
              </Card>
            ))}
          </Grid>
        </Subsection>

        <Subsection title="Card with footer">
          <Card variant="elevated" className="max-w-md">
            <Card.Header>
              <h3 className="text-sm font-semibold text-foreground">Settings</h3>
              <Badge intent="info">draft</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-sm text-muted-fg">
                Header / Body / Footer sub-components keep cards consistent across modules.
              </p>
            </Card.Body>
            <Card.Footer>
              <Button intent="ghost" size="sm">Cancel</Button>
              <Button intent="primary" size="sm">Save</Button>
            </Card.Footer>
          </Card>
        </Subsection>

        <Subsection title="Toasts">
          <div className="flex flex-col gap-2">
            <Toast intent="success" title="Saved" description="Your changes have been written." />
            <Toast intent="error" title="Could not save" description="Try again in a moment." />
            <Toast intent="info" title="Heads up" description="A new version is available." />
          </div>
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

        <Subsection title="FormLayout">
          <FormLayout
            className="max-w-md"
            action="#"
            footer={
              <>
                <Button intent="ghost" type="button">Cancel</Button>
                <Button intent="primary" type="button">Save</Button>
              </>
            }
          >
            <FormField label="Name" htmlFor="ui-form-name" required>
              <Input id="ui-form-name" name="name" placeholder="Jane Doe" />
            </FormField>
            <FormField label="Email" htmlFor="ui-form-email" hint="We will never share it.">
              <Input id="ui-form-email" name="email" type="email" placeholder="jane@example.com" />
            </FormField>
            <FormField label="Role" htmlFor="ui-form-role">
              <Select id="ui-form-role" defaultValue="admin" placeholder="Pick a role">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </Select>
            </FormField>
            <FormField label="Bio" htmlFor="ui-form-bio" error="This field is required.">
              <Textarea id="ui-form-bio" name="bio" state="error" />
            </FormField>
          </FormLayout>
        </Subsection>

        <Subsection title="DataTable">
          <DataTable
            testId="ui-preview-table"
            columns={MOCK_COLUMNS}
            rows={MOCK_ROWS}
            rowId={(r) => r.id}
          />
        </Subsection>

        <Subsection title="DataTable — empty">
          <DataTable
            testId="ui-preview-empty-table"
            columns={MOCK_COLUMNS}
            rows={[]}
            rowId={(r) => r.id}
            emptyTitle="No users yet"
            emptyDescription="Seed test users with npm run seed:e2e."
          />
        </Subsection>

        <Subsection title="ImageFrame + Overlay">
          <Grid cols={3}>
            {[1, 2, 3].map((i) => (
              <ImageFrame
                key={i}
                aspectClassName="aspect-[4/3]"
                overlay={
                  <Overlay tone="dark" strength="medium" className="flex items-end p-4">
                    <p className="text-sm font-medium text-background">Image caption #{i}</p>
                  </Overlay>
                }
              >
                {/* Placeholder gradient — replace with real <img> or next/image. */}
                <div className="h-full w-full bg-gradient-to-br from-primary via-accent to-info" />
              </ImageFrame>
            ))}
          </Grid>
        </Subsection>
      </Section>

      {/* Tabs / Accordion / Avatar */}
      <Section title="Tabs · Accordion · Avatar">
        <Subsection title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-fg">Overview content goes here.</p>
            </TabsContent>
            <TabsContent value="settings">
              <p className="text-sm text-muted-fg">Settings content goes here.</p>
            </TabsContent>
            <TabsContent value="audit">
              <p className="text-sm text-muted-fg">Audit log content goes here.</p>
            </TabsContent>
          </Tabs>
        </Subsection>

        <Subsection title="Accordion (single, collapsible)">
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a">
              <AccordionTrigger>What does BSCore include?</AccordionTrigger>
              <AccordionContent>
                Socle (routing, errors, logger), Socle+ (auth, DB, admin shell, audit), and the
                modules layer where your domain features live.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>How is theming applied?</AccordionTrigger>
              <AccordionContent>
                CSS variables in <code>globals.css</code>, exposed via Tailwind tokens. Per-client
                overrides live in <code>src/client/config/theme.config.ts</code>.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Where do modules register their admin pages?</AccordionTrigger>
              <AccordionContent>
                Through <code>registerAdminNav()</code> at activation time — the shell renders
                exactly what has been registered, nothing more.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Subsection>

        <Subsection title="Avatar — sizes & fallback">
          <div className="flex flex-wrap items-end gap-4">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <Avatar size={size}>
                  <AvatarImage src="/__never_loads.png" alt="" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-fg">{size}</span>
              </div>
            ))}
          </div>
        </Subsection>
      </Section>

      {/* Layout */}
      <Section title="Layout helpers">
        <Subsection title="Grid (1 → 2 → 3 → 4 columns responsive)">
          <Grid cols={4} gap="sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-16 items-center justify-center rounded-md bg-muted text-xs text-muted-fg"
              >
                cell {i + 1}
              </div>
            ))}
          </Grid>
        </Subsection>

        <Subsection title="Container sizes">
          <div className="space-y-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <Container
                key={size}
                size={size}
                className="rounded-md bg-muted px-3 py-2 text-xs text-muted-fg"
              >
                Container size: <span className="font-mono">{size}</span>
              </Container>
            ))}
          </div>
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
                action={<Button intent="primary">New user</Button>}
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
          V1.1 design system. Modal + DropdownMenu shipped via Radix. Toast orchestration
          remains FRONTEND.md OQ F-2 (visual primitive only). Tooltip not shipped — re-evaluate
          when first admin module needs one.
        </p>
      </footer>
    </Container>
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
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-6 rounded-card border border-border bg-surface p-6">{children}</div>
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
