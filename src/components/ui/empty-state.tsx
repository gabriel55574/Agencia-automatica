import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col items-center gap-4 max-w-[320px] text-center">
        <Icon className="h-12 w-12 text-[#8A9999]" aria-hidden="true" />
        <h3 className="text-xl font-semibold font-heading text-foreground">
          {title}
        </h3>
        <p className="text-base text-[#5C6E6E]">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </div>
  )
}
