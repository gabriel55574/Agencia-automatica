'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/custos', label: 'Custos', icon: DollarSign },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: FileText },
]

interface SidebarProps {
  signOutAction: () => Promise<void>
  className?: string
}

export function Sidebar({ signOutAction, className = '' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`w-60 bg-velocity-black flex flex-col h-screen ${className}`}
    >
      {/* Logo area — D-09 */}
      <div className="px-4 py-6">
        <Image
          src="/logo/velocity-light.svg"
          alt="Velocity"
          width={140}
          height={32}
          priority
        />
      </div>

      {/* Navigation — D-07: flat list, no section grouping */}
      <nav
        className="flex-1 px-2"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-md text-sm
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'text-velocity-lime bg-[rgba(191,242,5,0.08)] border-l-[3px] border-velocity-lime pl-[13px] font-medium'
                        : 'text-velocity-white hover:bg-[rgba(242,242,242,0.06)]'
                    }
                  `}
                  {...(isActive ? { 'aria-current': 'page' as const } : {})}
                >
                  <Icon size={24} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out — D-10: at bottom, visually separated */}
      <div className="border-t border-[rgba(242,242,242,0.1)] px-2 py-4">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-3 w-full text-sm text-velocity-white hover:bg-[rgba(242,242,242,0.06)] rounded-md transition-colors duration-150"
          >
            <LogOut size={24} className="shrink-0" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
