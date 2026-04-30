import { registerAdminNav } from './admin-nav-registry'

/**
 * Registers Socle+ "core" admin entries — entries that aren't owned by any
 * single module: the dashboard (Vue), the system stubs Users / Settings, and
 * a set of `comingSoon: true` placeholders for upcoming modules so the
 * sidebar advertises the platform's full module shape before each module
 * actually ships.
 *
 * Idempotent (registerAdminNav dedupes by href). Called once at boot from
 * src/app/_boot.ts, after activateModules() so module entries are already in
 * place when this runs (order doesn't actually matter for the grouped output
 * since visual order is driven by the section bucketing — this just keeps
 * the natural reading flow).
 *
 * When a comingSoon module ships its real `register()` hook with the same
 * href, the dedupe rule keeps the first registration — to swap, remove the
 * stub from this file at that point.
 */
export function registerCoreNav(): void {
  // — Vue —
  registerAdminNav({
    label: 'Tableau de bord',
    href: '/admin',
    icon: 'layout-dashboard',
    requiredRole: 'admin',
    section: 'view',
  })

  // — Contenu (Pages / Blog / Médias / SEO) — Pages, Médias, SEO are owned
  // by their modules. Blog is a placeholder until the module ships.
  registerAdminNav({
    label: 'Blog',
    href: '/admin/blog',
    icon: 'pen-line',
    requiredRole: 'admin',
    section: 'content',
    comingSoon: true,
  })

  // — Engagement (Réservations / Formulaires / Newsletter) — all stubs for now
  registerAdminNav({
    label: 'Réservations',
    href: '/admin/bookings',
    icon: 'calendar',
    requiredRole: 'admin',
    section: 'engagement',
    comingSoon: true,
  })
  registerAdminNav({
    label: 'Formulaires',
    href: '/admin/forms',
    icon: 'clipboard-list',
    requiredRole: 'admin',
    section: 'engagement',
    comingSoon: true,
  })
  registerAdminNav({
    label: 'Newsletter',
    href: '/admin/newsletter',
    icon: 'mail',
    requiredRole: 'admin',
    section: 'engagement',
    comingSoon: true,
  })

  // — Système (Utilisateurs / Réglages) — stubs until dedicated modules
  registerAdminNav({
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: 'users',
    requiredRole: 'admin',
    section: 'system',
    comingSoon: true,
  })
  registerAdminNav({
    label: 'Réglages',
    href: '/admin/settings',
    icon: 'settings',
    requiredRole: 'admin',
    section: 'system',
    comingSoon: true,
  })
}
