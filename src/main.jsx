import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// When deploying to GitHub Pages under a repo (e.g. https://john25kelly.github.io/strangford-regattas/)
// we must set the `basename` so the router knows the app is served from that subpath.
const basename = '/strangford-regattas/'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
