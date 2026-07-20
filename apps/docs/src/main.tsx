import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { DocsApp } from './docs-app'
import './styles.css'

const root = document.getElementById('root')

if (root == null) {
  throw new Error('Docs root element was not found.')
}

createRoot(root).render(
  <StrictMode>
    <DocsApp />
  </StrictMode>,
)

document.documentElement.dataset.docsReady = 'true'
