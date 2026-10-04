/**
 * The fixed-height band a page title (or the resume page's bulk-selection heading)
 * sits in. Keeping the same height on every page makes the gap between the title
 * and the content beneath consistent — and, on the resume page, stops the list
 * hopping when the heading swaps between the plain title and the "N selected"
 * controls.
 */
export default function PageHeader({ children, className = '' }) {
  return <div className={`min-h-[3.5rem] ${className}`}>{children}</div>
}