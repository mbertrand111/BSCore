import type React from 'react'
import {
  Calendar,
  ClipboardList,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  PenLine,
  Settings,
  Square,
  Users,
} from 'lucide-react'

/**
 * Whitelist of lucide icons usable from admin nav entries.
 *
 * Modules pass icon names as strings (e.g. `icon: 'image'`) so they don't
 * need to import from lucide-react themselves — that would couple every
 * module to the icon library. The string lands here, in chrome code, where
 * we know the dependency is fine.
 *
 * Extend this map as new icon names are needed. Keep names lowercase / kebab.
 */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'file-text': FileText,
  image: ImageIcon,
  globe: Globe,
  'pen-line': PenLine,
  calendar: Calendar,
  mail: Mail,
  'clipboard-list': ClipboardList,
  users: Users,
  settings: Settings,
}

interface NavIconProps {
  name?: string | undefined
  className?: string | undefined
}

export function NavIcon({ name, className = 'h-4 w-4' }: NavIconProps): React.JSX.Element {
  const Component = name !== undefined ? ICONS[name] : undefined
  if (Component === undefined) {
    return <Square className={className} aria-hidden="true" />
  }
  return <Component className={className} aria-hidden="true" />
}
