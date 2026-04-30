'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/ui/utils/cn'
import type { AdminNavGroup, AdminNavItemResolved } from '../admin.types'
import { NavIcon } from './nav-icon'

interface AdminNavSectionProps {
  group: AdminNavGroup
  /** Called when the user clicks a link — useful for closing the mobile drawer. */
  onNavigate?: () => void
}

/**
 * One group of nav items rendered with a section label and a vertical list.
 *
 * Active state: an item is active when the current pathname equals its href
 * exactly, or starts with `<href>/` (so /admin/cms/abc highlights the Pages
 * entry). The dashboard (/admin) is matched only on exact equality to avoid
 * highlighting it on every admin sub-route.
 */
export function AdminNavSection({ group, onNavigate }: AdminNavSectionProps): React.JSX.Element {
  const pathname = usePathname()

  return (
    <div className="px-3 py-2">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-muted-fg">
        {group.label}
      </p>
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <li key={item.href}>
            <NavLink
              item={item}
              active={isActive(pathname, item.href)}
              {...(onNavigate !== undefined ? { onNavigate } : {})}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavLinkProps {
  item: AdminNavItemResolved
  active: boolean
  onNavigate?: () => void
}

function NavLink({ item, active, onNavigate }: NavLinkProps): React.JSX.Element {
  return (
    <Link
      href={item.href}
      {...(onNavigate !== undefined ? { onClick: onNavigate } : {})}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-active-bg text-sidebar-active-fg before:absolute before:inset-y-1 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent before:content-[""]'
          : 'text-sidebar-fg/85 hover:bg-sidebar-active-bg/60 hover:text-sidebar-fg',
        item.comingSoon === true && !active ? 'opacity-60' : '',
      )}
    >
      <NavIcon
        {...(item.icon !== undefined ? { name: item.icon } : {})}
        className={cn(
          'h-[17px] w-[17px]',
          active ? 'text-sidebar-active-fg' : 'text-sidebar-muted-fg group-hover:text-sidebar-fg',
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.comingSoon === true ? (
        <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-sidebar-muted-fg">
          À venir
        </span>
      ) : null}
      {item.count !== undefined ? (
        <span
          className={cn(
            'min-w-[1.5rem] rounded-full px-2 py-0.5 text-center text-[10px] font-semibold tabular-nums',
            active
              ? 'bg-accent text-accent-fg'
              : 'bg-sidebar-border/60 text-sidebar-muted-fg',
          )}
        >
          {item.count}
        </span>
      ) : null}
    </Link>
  )
}
