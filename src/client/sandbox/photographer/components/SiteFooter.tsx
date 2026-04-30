import type React from 'react'
import Link from 'next/link'

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-footer__brand">Aurélie</div>
          <p style={{ maxWidth: '32ch', lineHeight: 1.7 }}>
            Photographe de mariage éditorial — basée à Paris, disponible en France et en Europe.
          </p>
        </div>
        <div className="site-footer__col">
          <h5>Naviguer</h5>
          <ul>
            <li><Link href="/sandbox/photographer/portfolio">Portfolio</Link></li>
            <li><Link href="/sandbox/photographer/a-propos">À propos</Link></li>
            <li><Link href="/sandbox/photographer/services">Prestations</Link></li>
            <li><Link href="/sandbox/photographer/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="site-footer__col">
          <h5>Studio</h5>
          <ul>
            <li>14 rue des Saints-Pères</li>
            <li>75007 Paris</li>
            <li>+33 6 12 34 56 78</li>
          </ul>
        </div>
        <div className="site-footer__col">
          <h5>Suivre</h5>
          <ul>
            <li><a href="#" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="#" rel="noopener noreferrer">Pinterest</a></li>
            <li><a href="#" rel="noopener noreferrer">Journal</a></li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 Aurélie Lambert Photographie</span>
        <span>Propulsé par BSCore · Sandbox</span>
      </div>
    </footer>
  )
}
