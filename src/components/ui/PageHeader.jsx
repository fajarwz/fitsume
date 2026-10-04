/**
 * Fixed height so the list doesn't hop when the heading swaps between the title and "N selected".
 */
export default function PageHeader({ children, className = '' }) {
  return <div className={`min-h-[3.5rem] ${className}`}>{children}</div>
}