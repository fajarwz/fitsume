import type { ReactNode } from 'react'

/**
 * Fixed height so the list doesn't hop when the heading swaps between the title and "N selected".
 */
export interface PageHeaderProps {
  children: ReactNode
  className?: string
}

export default function PageHeader({ children, className = '' }: PageHeaderProps) {
  return <div className={`min-h-[3.5rem] ${className}`}>{children}</div>
}
