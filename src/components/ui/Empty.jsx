/** First run, an empty library, an empty search result: the same shape every time. */
export default function Empty({ title, description, children }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-prose text-xs leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
