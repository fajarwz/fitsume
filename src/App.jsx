import { HashRouter, Route, Routes } from 'react-router-dom'

import BuilderPage from './pages/BuilderPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

/**
 * Routes and providers only. Everything else lives in pages/, components/,
 * hooks/ and the pure lib/.
 *
 * HashRouter, not BrowserRouter: there is no server here, so deep links and
 * refreshes have to work on any static host (and from file://) without rewrite
 * rules.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BuilderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  )
}
