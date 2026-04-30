/**
 * Client-side branding for the admin shell.
 *
 * Drives:
 *   - Sidebar header (initials + client name + tagline)
 *   - Login page heading ("Connexion à <clientName>")
 *   - User-card initials fallback when a user has no avatar set
 *
 * Each project clones this file with its own values. The platform attribution
 * "Boreal Studio" is hardcoded in `AdminBranding.tsx` — it's not a client
 * setting.
 */
export const branding = {
  /** Long form — appears at the top of the sidebar and on the login page. */
  clientName: 'Aurélie Lambert',
  /** 1–3 letter initials for the sidebar logo block and the favicon stub. */
  clientShortName: 'AL',
  /** Optional small line under the client name. Set to '' to hide. */
  clientTagline: 'Photographe de mariage',
} as const

export type Branding = typeof branding
