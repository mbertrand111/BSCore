import type React from 'react'
import Link from 'next/link'
import type { AdminNavItem } from '../admin.types'

interface AdminSidebarProps {
  items: AdminNavItem[]
}

export function AdminSidebar({ items }: AdminSidebarProps): React.JSX.Element {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-6">
        <span className="text-sm font-semibold text-foreground">Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {items.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-fg">No navigation items</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {item.icon !== undefined && (
                    <span className="text-muted-fg">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  )
}
