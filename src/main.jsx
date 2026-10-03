import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted so the fit is measured against the font the page actually renders,
// and so the app works offline. No Google Fonts CDN.
import '@fontsource-variable/inter'

import './styles/tokens.css'
import './styles/index.css'
import './styles/base.css'
import './styles/print.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
