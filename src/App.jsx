import { useMemo } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { resolveStorage } from './lib/stash.js'
import BuilderPage from './pages/BuilderPage.jsx'
import ResumePage from './pages/ResumePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import StashProvider from './state/StashProvider.jsx'
import ThemeProvider from './state/ThemeProvider.jsx'

/**
 * BrowserRouter so each resume has a real address, not a hash fragment. The app
 * relies on the host serving index.html for any path — a 404 on unknown paths
 * breaks a refresh on a deep link.
 */
export default function App() {
  const { storage, persistent } = useMemo(() => resolveStorage(), [])

  return (
    <ThemeProvider storage={storage}>
      <StashProvider storage={storage} persistent={persistent}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ResumePage />} />
            <Route path="/resume/:id" element={<BuilderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </StashProvider>
    </ThemeProvider>
  )
}
