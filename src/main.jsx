import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Ensure similarity util is loaded early so window.similarity is defined for runtime code.
import './utils/similarity'

// When deploying to GitHub Pages under a repo (e.g. https://john25kelly.github.io/strangford-regattas/)
// we must set the `basename` so the router knows the app is served from that subpath.
// Use Vite's base (import.meta.env.BASE_URL). If it's './' or empty, default to '/'.
const viteBase = import.meta.env.BASE_URL || '/'
const basename = (viteBase && viteBase !== './') ? viteBase : '/'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
