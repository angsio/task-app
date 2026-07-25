import '@fontsource/philosopher/latin-400.css'
import '@fontsource/philosopher/latin-700.css'
import '@fontsource/philosopher/latin-400-italic.css'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
