import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-3 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm opacity-70">That route does not exist in fittyresume.</p>
      <p className="text-sm">
        <Link to="/" className="underline underline-offset-2 hover:opacity-80">
          Back to the builder
        </Link>
      </p>
    </main>
  )
}
