import { useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

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
 * HashRouter, not BrowserRouter: there is no server here, so deep links and
 * refreshes have to work on any static host (and from file://) without rewrite
 * rules.
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
        <HashRouter>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/resume/:id" element={<BuilderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/library" element={<Navigate to="/" replace />} />
            <Route path="/samples" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </StashProvider>
    </ThemeProvider>
  )
}
