import Text from './Text.tsx'

/**
 * Same heading markup on every page so titles land on the same x across pages.
 */
export interface PageTitleProps {
  title: string
  subtitle?: string
  className?: string
}

export default function PageTitle({ title, subtitle, className = '' }: PageTitleProps) {
  return (
    <div className={className}>
      <Text as="h1" variant="18-semibold" className="tracking-tight">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="12-regular" tone="muted" className="mt-1">
          {subtitle}
        </Text>
      ) : null}
    </div>
  )
}
