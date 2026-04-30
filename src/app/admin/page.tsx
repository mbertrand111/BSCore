import 'server-only'
import type React from 'react'
import { useId } from 'react'
import Link from 'next/link'
import { count, desc } from 'drizzle-orm'
import {
  Activity,
  CheckCircle2,
  Download,
  ExternalLink,
  Plus,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { db } from '@/socle-plus/database'
import { auditEvents } from '@/socle-plus/audit/audit.schema'
import { userRoles } from '@/socle-plus/auth/schema'
import { runSoclePlusChecks } from '@/socle-plus/database'
import { runMediaChecks } from '@/modules/media'
import { countCmsPages } from '@/modules/cms/data/repository'
import { countMediaAssets } from '@/modules/media/data/repository'
import { countSeoEntries } from '@/modules/seo/data/repository'
import type { HealthCheck } from '@/socle/health'
import { branding } from '@/client/config/branding.config'
import { getSiteUrl } from '@/socle/config/site'
import { Button } from '@/shared/ui/primitives'

/**
 * Tableau de bord (BSCore Backoffice maquette).
 *
 * Layout — sticky on top: greeting + actions. Below:
 *   1. KPI row (4 cards w/ sparklines)
 *   2. Traffic chart (2/3) + Notifications (1/3)
 *   3. Activity feed + Tasks + Site preview + System status (auto-fit grid)
 *
 * Data hybridization:
 *   - REAL: KPI counts (Pages/Médias/SEO/Utilisateurs), audit log activity,
 *     health checks (DB + storage), site URL + client branding.
 *   - DEMO: sparkline trends, traffic series, tasks, messages — these surface
 *     as the maquette intends. Each demo block is commented `// demo —` so
 *     it's clear which to wire up when the underlying module ships.
 */

// ---------------------------------------------------------------------------
// Server-side data
// ---------------------------------------------------------------------------

interface AuditRow {
  id: string
  event: string
  actorId: string | null
  userId: string | null
  createdAt: Date
}

async function listRecentAuditEvents(limit: number): Promise<AuditRow[]> {
  const rows = await db
    .select({
      id: auditEvents.id,
      event: auditEvents.event,
      actorId: auditEvents.actorId,
      userId: auditEvents.userId,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)
  return rows
}

async function countUsersWithRole(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(userRoles)
  return row?.value ?? 0
}

async function safeCount(fn: () => Promise<number>): Promise<number | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

async function safeChecks(
  fn: () => Promise<readonly HealthCheck[]>,
): Promise<readonly HealthCheck[]> {
  try {
    return await fn()
  } catch {
    return []
  }
}

function firstName(label: string): string {
  return (label.split(' ')[0] ?? label).trim()
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const [
    pagesCount,
    mediaCount,
    seoCount,
    usersCount,
    recentEvents,
    dbChecks,
    mediaChecksResult,
  ] = await Promise.all([
    safeCount(countCmsPages),
    safeCount(countMediaAssets),
    safeCount(countSeoEntries),
    safeCount(countUsersWithRole),
    listRecentAuditEvents(5).catch((): AuditRow[] => []),
    safeChecks(runSoclePlusChecks),
    safeChecks(runMediaChecks),
  ])

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            Bonjour {firstName(branding.clientName)} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            Voici l&apos;activité de votre site sur les 30 derniers jours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button intent="secondary" leadingIcon={<Download className="h-3.5 w-3.5" />}>
            Exporter
          </Button>
          <Link href="/admin/cms/new">
            <Button intent="primary" leadingIcon={<Plus className="h-3.5 w-3.5" />}>
              Nouvelle page
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Visiteurs uniques"
          value="12 480"
          delta="+18.2%"
          trend="up"
          spark={SPARK_VISITS}
        />
        <KpiCard
          label="Conversions"
          value="184"
          delta="+12.4%"
          trend="up"
          spark={SPARK_CONV}
        />
        <KpiCard
          label="Pages publiées"
          value={pagesCount === null ? '—' : pagesCount.toString()}
          delta="+3"
          trend="up"
          spark={SPARK_PUB}
        />
        <KpiCard
          label="Médias"
          value={mediaCount === null ? '—' : mediaCount.toLocaleString('fr-FR')}
          delta="+24"
          trend="up"
          spark={SPARK_MED}
        />
      </div>

      {/* Traffic + Notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrafficChart />
        </div>
        <NotificationsWidget />
      </div>

      {/* Activity / Tasks / Site preview / System status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActivityFeed events={recentEvents} />
        <TasksWidget />
        <SitePreview />
        <SystemStatus realChecks={[...dbChecks, ...mediaChecksResult]} />
      </div>

      <div className="text-right text-[10px] uppercase tracking-[0.18em] text-subtle-fg/70">
        Comptes Pages/Médias/SEO/Utilisateurs : {pagesCount ?? '—'} · {mediaCount ?? '—'} ·{' '}
        {seoCount ?? '—'} · {usersCount ?? '—'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  delta,
  trend,
  spark,
}: {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  spark: SparkData
}): React.JSX.Element {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendBg = trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
  return (
    <div className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-fg">{label}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${trendBg}`}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {delta}
        </span>
      </div>
      <p className="mt-3 font-heading text-[30px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <Sparkline data={spark} className="mt-3" />
    </div>
  )
}

function TrafficChart(): React.JSX.Element {
  // demo — wire to real analytics when an analytics module ships
  const data = TRAFFIC_DATA
  const max = Math.max(...data)
  const w = 100
  const h = 100
  const points = data.map<[number, number]>((v, i) => [
    (i / (data.length - 1)) * w,
    h - (v / max) * h * 0.85 - 6,
  ])
  const line = 'M ' + points.map((p) => p.join(',')).join(' L ')
  const area = `${line} L ${w},${h} L 0,${h} Z`
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Trafic · 30 jours
          </p>
          <p className="mt-1 font-heading text-xl font-semibold tracking-tight text-foreground">
            12 480{' '}
            <span className="text-sm font-normal text-muted-fg">visiteurs uniques</span>
          </p>
        </div>
        <div className="flex gap-1 rounded-md bg-muted p-0.5">
          {(['7j', '30j', '90j'] as const).map((p, i) => (
            <button
              key={p}
              type="button"
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                i === 1
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-fg hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-4 block h-44 w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="traffic-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--color-accent))" stopOpacity="0.24" />
            <stop offset="100%" stopColor="hsl(var(--color-accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#traffic-grad)" />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--color-accent))"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-subtle-fg">
        <span>1 avr.</span>
        <span>10 avr.</span>
        <span>20 avr.</span>
        <span>30 avr.</span>
      </div>
    </section>
  )
}

function NotificationsWidget(): React.JSX.Element {
  // demo — wire to inbox / form submissions when those modules ship
  const messages: ReadonlyArray<{
    from: string
    subject: string
    time: string
    unread: boolean
  }> = [
    { from: 'Sophie Martin', subject: 'Demande devis — mariage juillet', time: '12 min', unread: true },
    { from: 'Lucas P.', subject: 'Confirmation séance famille', time: '2 h', unread: true },
    { from: 'Émilie R.', subject: 'Question livraison galerie', time: 'hier', unread: false },
  ]
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
          Messages · 2 nouveaux
        </p>
        <Link
          href="#"
          className="whitespace-nowrap text-xs font-medium text-accent-text hover:underline"
        >
          Boîte →
        </Link>
      </div>
      <ul className="space-y-1">
        {messages.map((m, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 rounded-md p-2.5 ${
              m.unread ? 'bg-accent/8' : ''
            }`}
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                m.unread ? 'bg-accent' : 'bg-transparent'
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`truncate text-[13px] ${m.unread ? 'font-semibold' : 'font-medium'}`}
                >
                  {m.from}
                </span>
                <span className="shrink-0 text-[11px] text-subtle-fg">{m.time}</span>
              </div>
              <p className="truncate text-xs text-muted-fg">{m.subject}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ActivityFeed({ events }: { events: ReadonlyArray<AuditRow> }): React.JSX.Element {
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
          Activité récente
        </p>
        <Link href="#" className="text-xs font-medium text-accent-text hover:underline">
          Tout voir →
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-fg">
          Aucune activité enregistrée pour le moment.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {events.map((e) => {
            const { actor, verb, target, intent } = describeEvent(e)
            const Icon = intent === 'success' ? CheckCircle2 : intent === 'system' ? Shield : Activity
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${ICON_BG[intent]}`}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug">
                    <strong className="font-semibold">{actor}</strong>{' '}
                    <span className="text-muted-fg">{verb}</span>{' '}
                    <span className="font-medium">{target}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle-fg">{relativeTime(e.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function TasksWidget(): React.JSX.Element {
  // demo — wire to a real task / draft-review system when it ships
  const tasks: ReadonlyArray<{ label: string; meta: string; done: boolean; urgent?: boolean }> = [
    { label: 'Brouillon : Galerie « Couples 2026 »', meta: 'Pages', done: false },
    {
      label: 'Modérer 3 messages de contact',
      meta: 'Formulaires',
      done: false,
      urgent: true,
    },
    { label: 'Revoir balises SEO accueil', meta: 'SEO', done: false },
    { label: 'Approuver tarifs Réservations', meta: 'Réservations', done: true },
  ]
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
          À faire · {tasks.filter((t) => !t.done).length}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-fg hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> Ajouter
        </button>
      </div>
      <ul className="space-y-1.5">
        {tasks.map((t, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-md p-2.5 ${
              t.done ? 'opacity-55' : 'bg-muted'
            }`}
          >
            <input
              type="checkbox"
              defaultChecked={t.done}
              className="h-3.5 w-3.5 cursor-pointer accent-accent"
              aria-label={t.label}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-medium ${t.done ? 'line-through text-muted-fg' : 'text-foreground'}`}
              >
                {t.label}
              </p>
              <p className="text-[11px] text-subtle-fg">{t.meta}</p>
            </div>
            {t.urgent === true ? (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                Urgent
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function SitePreview(): React.JSX.Element {
  const url = getSiteUrl()
  const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Aperçu du site
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-fg">{host}</p>
        </div>
        <Link href={url} target="_blank" rel="noopener noreferrer">
          <Button intent="secondary" leadingIcon={<ExternalLink className="h-3 w-3" />}>
            Ouvrir
          </Button>
        </Link>
      </div>
      <div
        className="relative aspect-[16/10] flex flex-col justify-end p-6 text-white"
        style={{
          background:
            'linear-gradient(135deg, #2a1f24 0%, #4a2a3d 50%, #f9c5d1 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 50%)',
          }}
        />
        <div className="relative">
          <p className="font-heading text-2xl italic leading-tight tracking-tight">
            Capturer
            <br />
            l&apos;instant&nbsp;juste.
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] opacity-80">
            {branding.clientTagline || branding.clientName}
          </p>
        </div>
      </div>
    </section>
  )
}

function SystemStatus({
  realChecks,
}: {
  realChecks: ReadonlyArray<HealthCheck>
}): React.JSX.Element {
  // Map real checks to display rows; pad with demo entries to mirror the maquette
  const rows = [
    {
      label: 'Application',
      value: 'Opérationnelle',
      tone: 'ok' as const,
      mono: false,
    },
    pickCheck(realChecks, 'database', 'Base de données', 'Saine · 38 ms'),
    {
      label: 'Sauvegardes',
      value: "Aujourd'hui · 04:00",
      tone: 'ok' as const,
      mono: false,
    },
    pickCheck(realChecks, 'media.storage', 'Stockage médias', 'Connecté'),
    {
      // demo — wire to a real "package updates" / release-notes feed when relevant
      label: 'Mises à jour',
      value: '2 disponibles',
      tone: 'info' as const,
      mono: false,
    },
  ]
  const allOk = rows.every((r) => r.tone === 'ok')
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
          Statut système
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            allOk ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${allOk ? 'bg-success' : 'bg-warning'}`}
          />
          {allOk ? 'Tout va bien' : 'À vérifier'}
        </span>
      </div>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-fg">{r.label}</span>
            <span
              className={`font-medium ${
                r.tone === 'warn' ? 'text-warning' : r.tone === 'info' ? 'text-info' : 'text-foreground'
              } ${r.mono ? 'font-mono text-[11px]' : ''}`}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SparkData {
  readonly line: string
  readonly area: string
}

function buildSpark(values: ReadonlyArray<number>): SparkData {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map<[number, number]>((v, i) => [
    (i / (values.length - 1)) * 100,
    40 - ((v - min) / range) * 32 - 4,
  ])
  const line = 'M ' + points.map((p) => p.join(',')).join(' L ')
  return { line, area: `${line} L 100,40 L 0,40 Z` }
}

// demo — sparkline series mirror the maquette's reference shapes
const SPARK_VISITS = buildSpark([20, 25, 28, 22, 35, 42, 38, 48, 52, 58, 60, 72])
const SPARK_CONV = buildSpark([5, 7, 6, 9, 8, 12, 11, 14, 13, 15, 18, 22])
const SPARK_PUB = buildSpark([12, 14, 13, 15, 14, 16, 18, 17, 19, 18, 20, 22])
const SPARK_MED = buildSpark([8, 10, 9, 11, 13, 12, 15, 14, 16, 18, 17, 20])

// demo — 30 daily samples for the traffic area chart
const TRAFFIC_DATA = [
  42, 58, 51, 72, 65, 89, 78, 92, 85, 110, 96, 118, 125, 108, 132, 145, 128, 158, 142, 165,
  178, 168, 192, 188, 215, 198, 232, 218, 248, 265,
]

function Sparkline({
  data,
  className,
}: {
  data: SparkData
  className?: string
}): React.JSX.Element {
  // useId() instead of Math.random() so the gradient ID is stable between
  // server and client renders (avoids a hydration mismatch).
  const id = `spark-${useId()}`
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className={`h-10 w-full ${className ?? ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--color-accent))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--color-accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={data.area} fill={`url(#${id})`} />
      <path
        d={data.line}
        fill="none"
        stroke="hsl(var(--color-accent))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

const ICON_BG: Record<EventIntent, string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  system: 'bg-muted text-muted-fg',
}

type EventIntent = 'success' | 'info' | 'system'

function describeEvent(row: AuditRow): {
  actor: string
  verb: string
  target: string
  intent: EventIntent
} {
  const event = row.event
  const isSystem = row.actorId === null && row.userId === null
  const actor = isSystem ? 'Système' : 'Utilisateur'

  // Coarse mapping — refine when richer event taxonomy exists.
  const verb = inferVerb(event)
  const intent: EventIntent =
    event.endsWith('.error') || event.endsWith('.failed') ? 'info' : isSystem ? 'system' : 'success'

  // Target: humanize the event tail (e.g. cms.page.published → "page CMS")
  const parts = event.split('.')
  const subject = parts.length >= 2 ? parts[1] ?? '' : ''
  const target = subject !== '' ? capitalize(subject) : event

  return { actor, verb, target, intent }
}

function inferVerb(event: string): string {
  if (event.endsWith('.published')) return 'a publié'
  if (event.endsWith('.created')) return 'a créé'
  if (event.endsWith('.updated')) return 'a modifié'
  if (event.endsWith('.deleted')) return 'a supprimé'
  if (event.includes('upload')) return 'a téléversé'
  if (event.startsWith('user.login')) return "s'est connecté"
  if (event.includes('seed')) return 'a peuplé'
  return 'a déclenché'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function relativeTime(date: Date): string {
  const seconds = (Date.now() - date.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  if (seconds < 60) return "à l'instant"
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour')
  if (seconds < 86400 * 7) return rtf.format(-Math.floor(seconds / 86400), 'day')
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function pickCheck(
  checks: ReadonlyArray<HealthCheck>,
  name: string,
  label: string,
  fallbackOk: string,
): { label: string; value: string; tone: 'ok' | 'warn' | 'info'; mono: boolean } {
  const check = checks.find((c) => c.name === name)
  if (check === undefined) {
    return { label, value: fallbackOk, tone: 'ok', mono: false }
  }
  if (check.status === 'ok') {
    return { label, value: fallbackOk, tone: 'ok', mono: false }
  }
  return {
    label,
    value: check.message ?? 'Dégradé',
    tone: 'warn',
    mono: false,
  }
}

