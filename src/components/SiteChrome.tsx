/**
 * Shared chrome for the static content pages (/learn, /stats, /about,
 * /satellites). A consistent top nav + footer knits the pages together with
 * real internal links — good for humans finding their way around and good
 * for search engines crawling between pages.
 */

import { Link, useLocation } from 'wouter'
import type { ReactNode } from 'react'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/learn', label: 'Learn' },
  { href: '/satellites', label: 'Satellites' },
  { href: '/stats', label: 'State of Orbit' },
  { href: '/about', label: 'About' },
]

/** Is `href` the active section for the current location? */
function isActive(location: string, href: string): boolean {
  return location === href || location.startsWith(`${href}/`)
}

export function SiteNav({ maxWidth = 'max-w-[900px]' }: { maxWidth?: string }) {
  const [location] = useLocation()
  return (
    <nav className="border-b border-white/10">
      <div
        className={`mx-auto flex ${maxWidth} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 font-mono text-[11px] uppercase tracking-widest`}
      >
        <Link
          href="/"
          className="font-semibold text-[#00d4ff]/90 transition-colors hover:text-[#00d4ff]"
        >
          Apsis<span className="text-[#00d4ff]/40"> · </span>Space
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/50">
          <Link href="/" className="transition-colors hover:text-[#00d4ff]">
            Tracker
          </Link>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                isActive(location, l.href)
                  ? 'text-[#00d4ff]'
                  : 'transition-colors hover:text-[#00d4ff]'
              }
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export function SiteFooter({ maxWidth = 'max-w-[900px]' }: { maxWidth?: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 border-t border-white/10">
      <div
        className={`mx-auto flex ${maxWidth} flex-col gap-4 px-6 py-10 font-mono text-[10px] uppercase tracking-widest text-white/40 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>&copy; {year} Apsis Space</div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className="transition-colors hover:text-[#00d4ff]">
            Live tracker
          </Link>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-[#00d4ff]"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://apsisspace.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#00d4ff]/80 transition-colors hover:text-[#00d4ff]"
          >
            apsisspace.com
          </a>
        </div>
      </div>
    </footer>
  )
}

/** Standard dark page shell for content routes. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00d4ff]/30">
      {children}
    </div>
  )
}
