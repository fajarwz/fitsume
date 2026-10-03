import { useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { resolveStorage } from './lib/stash.js'
import BuilderPage from './pages/BuilderPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import StashProvider from './state/StashProvider.jsx'
import ThemeProvider from './state/ThemeProvider.jsx'

/**
 * Routes and providers only. Everything else lives in pages/, components/,
 * hooks/ and the pure lib/.
 *
 * BrowserRouter, so an address is an address: /resume/sample-bj-habibie rather than
 * /#/resume/sample-bj-habibie. The fragment version was chosen when the build had to run
 * from file://, which paths break — a page load asks the server for the path, and a file
 * has no server to ask. It runs from the dev server or a static host now, and both serve
 * index.html for any path, so the cleaner address wins.
 *
 * The consequence to know about: this app relies on that fallback. A host that returns
 * 404 for an unknown path will break a refresh on a deep link until it is told to serve
 * index.html for everything. `npm run preview` does it. A bare file:// open does not.
 *
 * The URL is the state that matters: every resume has its own address, so a link
 * to one is a link to the thing itself and the back button behaves as it does
 * everywhere else. Dialogs are not routes — a confirmation is an overlay on the
 * page it belongs to, not somewhere you can navigate to or bookmark.
 *
 * Storage is resolved once, here, and handed to both providers: the theme and the
 * resume library share one store, and "storage is unavailable" is then decided in
 * one place instead of being rediscovered per component.
 */
export default function App() {
  const { storage, persistent } = useMemo(() => resolveStorage(), [])

  return (
    <ThemeProvider storage={storage}>
      <StashProvider storage={storage} persistent={persistent}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/resume/:id" element={<BuilderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/library" element={<Navigate to="/" replace />} />
            <Route path="/samples" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </StashProvider>
    </ThemeProvider>
  )
}
