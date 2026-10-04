import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts: fit is measured against the real rendered font and works offline (no CDN).
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

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
