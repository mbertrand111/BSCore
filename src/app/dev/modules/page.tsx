import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEnv } from '@/socle/config/env'
import { getAvailableModules } from '@/modules/registry'
import { enabledModuleIds } from '@/client/config/modules.config'
import type { ModuleDefinition, ModuleStatus } from '@/modules/types'
import type { HealthCheck } from '@/socle/health'
import { runMediaChecks } from '@/modules/media'

import { Badge } from '@/shared/ui/primitives'
import { Card, Container, Grid } from '@/shared/ui/patterns'
import { AdminPageHeader, AdminSection } from '@/shared/ui/admin'

export const metadata: Metadata = {
  title: 'Modules — Dev',
  robots: { index: false, follow: false },
}

const STATUS_INTENT: Record<ModuleStatus, 'success' | 'neutral' | 'danger'> = {
  available: 'success',
  planned: 'neutral',
  disabled: 'danger',
}

export default async function DevModulesPage(): Promise<React.JSX.Element> {
  if (getEnv('NODE_ENV') === 'production') {
    notFound()
  }

  const modules = getAvailableModules()
  const enabledSet = new Set<string>(enabledModuleIds)

  const counts = {
    total: modules.length,
    available: modules.filter((m) => m.status === 'available').length,
    planned: modules.filter((m) => m.status === 'planned').length,
    disabled: modules.filter((m) => m.status === 'disabled').length,
    enabled: enabledModuleIds.length,
  }

  // Per-module health probes. Today only Media exposes runtime checks; SEO
  // and CMS will surface theirs the same way once they're added. Probes
  // run in parallel and never throw — each module's helper catches and
  // returns a degraded HealthCheck on failure.
  const moduleHealth: Partial<Record<string, ReadonlyArray<HealthCheck>>> = {
    media: await runMediaChecks().catch(() => [] as ReadonlyArray<HealthCheck>),
  }

  return (
    <Container size="xl" className="space-y-8 py-10">
      <AdminPageHeader
        title="BSCore Modules"
        description="Read-only view of every module known to the registry, its status, and whether it is enabled for the current project. Not linked from any nav. Returns 404 in production."
      />

      <AdminSection title="Summary">
        <Grid cols={4} gap="sm">
          <CounterCard label="Total" value={counts.total} />
          <CounterCard label="Available" value={counts.available} intent="success" />
          <CounterCard label="Planned" value={counts.planned} intent="neutral" />
          <CounterCard label="Disabled" value={counts.disabled} intent="danger" />
          <CounterCard label="Enabled (client)" value={counts.enabled} intent="info" />
        </Grid>
      </AdminSection>

      <AdminSection
        title="Modules"
        description={`Source: src/modules/registry.ts — ${modules.length} entries.`}
      >
        <Grid cols={2}>
          {modules.map((m) => {
            const checks = moduleHealth[m.id]
            return (
              <ModuleCard
                key={m.id}
                module={m}
                enabled={enabledSet.has(m.id)}
                {...(checks !== undefined ? { healthChecks: checks } : {})}
              />
            )
          })}
        </Grid>
      </AdminSection>

      <AdminSection title="How to activate a module">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>
            Edit{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              src/client/config/modules.config.ts
            </code>{' '}
            and add the module id to{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              enabledModuleIds
            </code>
            .
          </li>
          <li>
            Confirm the module&apos;s{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">status</code> is{' '}
            <Badge intent="success">available</Badge>. A{' '}
            <Badge intent="neutral">planned</Badge> module stays in the list but does not run its
            register hook — the activation logs an info skip.
          </li>
          <li>
            If the module ships migrations, run{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              npm run db:migrate
            </code>
            . The runner discovers files in{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              src/modules/[id]/data/migrations/
            </code>{' '}
            automatically.
          </li>
          <li>
            Run{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              npm run lint &amp;&amp; npm run typecheck &amp;&amp; npm test &amp;&amp; npm run build
            </code>
            .
          </li>
          <li>
            The first module that flips to{' '}
            <Badge intent="success">available</Badge> wires{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              activateModules(enabledModuleIds)
            </code>{' '}
            from a project-side boot point (typically{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
              src/app/layout.tsx
            </code>
            ).
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-fg">
          Unknown ids in <code className="font-mono">enabledModuleIds</code> are warned at boot via
          the logger — they do not crash the app.
        </p>
      </AdminSection>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Sub-components — kept inline so they don't leak into the design system
// ---------------------------------------------------------------------------

function CounterCard({
  label,
  value,
  intent,
}: {
  label: string
  value: number
  intent?: 'success' | 'neutral' | 'danger' | 'info'
}): React.JSX.Element {
  return (
    <Card variant="soft">
      <Card.Body className="text-center">
        <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-fg">{label}</p>
        {intent !== undefined && value > 0 ? (
          <div className="mt-2 flex justify-center">
            <Badge intent={intent}>{label.toLowerCase()}</Badge>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  )
}

function ModuleCard({
  module: m,
  enabled,
  healthChecks,
}: {
  module: ModuleDefinition
  enabled: boolean
  healthChecks?: ReadonlyArray<HealthCheck>
}): React.JSX.Element {
  const adminNavCount = m.adminNav?.length ?? 0
  const permissionsCount = m.permissions?.length ?? 0
  const hasHealth = healthChecks !== undefined && healthChecks.length > 0
  const overallHealth: 'ok' | 'degraded' | undefined = hasHealth
    ? healthChecks.some((c) => c.status === 'degraded')
      ? 'degraded'
      : 'ok'
    : undefined

  return (
    <Card variant={m.status === 'disabled' ? 'outlined' : 'default'}>
      <Card.Header>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold text-foreground">{m.name}</h3>
          <p className="font-mono text-xs text-muted-fg">{m.id}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {enabled ? <Badge intent="success">enabled</Badge> : null}
          <Badge intent={STATUS_INTENT[m.status]}>{m.status}</Badge>
          {overallHealth === 'ok' ? <Badge intent="success">healthy</Badge> : null}
          {overallHealth === 'degraded' ? <Badge intent="danger">degraded</Badge> : null}
        </div>
      </Card.Header>

      <Card.Body className="space-y-3">
        <p className="text-sm text-muted-fg">{m.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-muted-fg">v{m.version}</span>
          {m.hasMigrations === true ? <Badge intent="highlight">migrations</Badge> : null}
          {permissionsCount > 0 ? (
            <Badge intent="accent">
              {permissionsCount} permission{permissionsCount > 1 ? 's' : ''}
            </Badge>
          ) : null}
          {adminNavCount > 0 ? (
            <Badge intent="outline">
              {adminNavCount} nav entr{adminNavCount > 1 ? 'ies' : 'y'}
            </Badge>
          ) : null}
        </div>

        {hasHealth ? (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-fg">Status</p>
            <ul className="space-y-1 text-xs">
              {healthChecks.map((c) => (
                <li key={c.name} className="flex items-baseline gap-2">
                  <Badge intent={c.status === 'ok' ? 'success' : 'danger'}>
                    {c.status === 'ok' ? 'OK' : 'KO'}
                  </Badge>
                  <code className="font-mono text-foreground">{c.name}</code>
                  {c.message !== undefined ? (
                    <span className="text-muted-fg">— {c.message}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {permissionsCount > 0 && m.permissions !== undefined ? (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-fg">Permissions</p>
            <ul className="space-y-1 text-xs">
              {m.permissions.map((p) => (
                <li key={p.resource} className="flex items-baseline gap-2">
                  <code className="font-mono text-foreground">{p.resource}</code>
                  <span className="text-muted-fg">— {p.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {adminNavCount > 0 && m.adminNav !== undefined ? (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-fg">Admin nav entries</p>
            <ul className="space-y-1 text-xs">
              {m.adminNav.map((entry) => (
                <li key={entry.href} className="flex items-baseline gap-2">
                  <span className="text-foreground">{entry.label}</span>
                  <code className="font-mono text-muted-fg">{entry.href}</code>
                  <Badge intent="outline">{entry.requiredRole}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  )
}
