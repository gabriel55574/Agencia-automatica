import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * Hierarchical breadcrumb navigation for detail pages.
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Clientes', href: '/clients' },
 *     { label: 'Joao Silva', href: '/clients/abc123' },
 *     { label: 'Editar' },
 *   ]} />
 *
 * Last item has no href (current page).
 * Chevron separator (ChevronRight, 14px).
 * Ancestors in zinc-400 with hover lime-dark; current page in zinc-900 font-medium.
 * Positioned above page title with mb-2 (8px).
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              )}
              {isLast || !item.href ? (
                <span className="text-zinc-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-zinc-400 hover:text-[#6D8A03] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
