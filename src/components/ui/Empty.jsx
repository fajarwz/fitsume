import Text from './Text.jsx'

export default function Empty({ title, description, children }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
      <Text as="h2" variant="14-semibold">
        {title}
      </Text>
      {description ? (
        <Text
          variant="12-regular"
          tone="muted"
          leading="relaxed"
          className="mx-auto mt-2 max-w-prose"
        >
          {description}
        </Text>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
