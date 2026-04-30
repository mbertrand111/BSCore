'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { photographerNav } from '../content/site-content'

/**
 * Sticky scroll-aware header for the photographer sandbox.
 * `usePathname` lets us highlight the current section without prop-drilling.
 */
export function SiteHeader(): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = (): void => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string): boolean => {
    if (href === '/sandbox/photographer') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link href="/sandbox/photographer" className="site-logo">
          Aurélie<small>Photographe</small>
        </Link>
        <nav className="site-nav" aria-label="Navigation principale">
          {photographerNav.map((n) => (
            <Link key={n.id} href={n.href} className={isActive(n.href) ? 'is-active' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-cta">
          <Link href="/sandbox/photographer/contact" className="btn btn--sm">
            Réserver
          </Link>
        </div>
      </div>
    </header>
  )
}
