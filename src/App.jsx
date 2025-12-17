import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import NOR from './pages/NOR'
import Results from './pages/Results'
import Competitors from './pages/Competitors'
import Contacts from './pages/Contacts'
import Gallery from './pages/Gallery'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nor" element={<NOR />} />
          <Route path="/results" element={<Results />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/contacts" element={<Contacts />} />
          {/* Redirect any unknown path to Home so the app doesn't render a blank page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
