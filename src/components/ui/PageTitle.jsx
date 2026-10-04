import Text from './Text.jsx'

/**
 * Every page opens with the same heading: a semibold title and a muted subtitle
 * beneath. Sharing the markup keeps the pages consistent — same sizes, same
 * rhythm — and means the pages have to sit on the same container width too, or
 * the centered title still lands at a different x on each page.
 */
export default function PageTitle({ title, subtitle, className = '' }) {
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