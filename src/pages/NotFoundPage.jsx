import { Link } from 'react-router-dom'

import Text from '../components/ui/Text.jsx'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-3 p-8">
      <Text as="h1" variant="18-bold" className="tracking-tight">
        Page not found
      </Text>
      <Text variant="14-regular" className="opacity-70">
        That route does not exist in Fitsume.
      </Text>
      <Text variant="14-regular">
        <Link to="/" className="underline underline-offset-2 hover:opacity-80">
          Back to the builder
        </Link>
      </Text>
    </main>
  )
}
