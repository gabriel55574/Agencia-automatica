'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6">
      {NAV_ITEMS.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? 'text-sm text-zinc-900 font-semibold'
                : 'text-sm text-zinc-500 hover:text-zinc-900 transition-colors'
            }
            {...(isActive ? { 'aria-current': 'page' as const } : {})}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
