import type React from 'react'
import { Hourglass } from 'lucide-react'
import { Card } from '@/shared/ui/patterns'

/**
 * Centered "Module en cours de conception" placeholder used by every stub
 * page in /admin/* (Users, Settings, Blog, Bookings, Forms, Newsletter).
 *
 * Pattern: pair with <AdminPageHeader> at the top of the route so the
 * sidebar entry resolves to a real, branded page rather than a 404 — the
 * sidebar is allowed to advertise the platform's full module shape even
 * when individual modules haven't shipped yet.
 */
export interface AdminComingSoonProps {
  /** Body copy explaining what the module will eventually do. */
  message: string
}

export function AdminComingSoon({ message }: AdminComingSoonProps): React.JSX.Element {
  return (
    <Card variant="soft">
      <Card.Body className="flex flex-col items-center gap-4 py-16 text-center">
        <Hourglass className="h-10 w-10 text-muted-fg" aria-hidden="true" />
        <div className="max-w-md">
          <h2 className="text-base font-semibold text-foreground">
            Module en cours de conception
          </h2>
          <p className="mt-2 text-sm text-muted-fg">{message}</p>
        </div>
      </Card.Body>
    </Card>
  )
}
