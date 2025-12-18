import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import NOR from './pages/NOR'
import Results from './pages/Results'
import Gallery from './pages/Gallery'
import Competitors from './pages/Competitors'
import Contacts from './pages/Contacts'
import Calendar from './pages/Calendar'
import CalendarFromSheet from './pages/CalendarFromSheet'

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
          {/* Serve the sheet-backed calendar at the canonical /calendar path */}
          <Route path="/calendar" element={<CalendarFromSheet />} />
          {/* Keep the original calendar available at /calendar-legacy (not shown in menu) */}
          <Route path="/calendar-legacy" element={<Calendar />} />
          <Route path="/calendar-from-sheet" element={<CalendarFromSheet />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/contacts" element={<Contacts />} />
          {/* Redirect any unknown path to Home so the app doesn't render a blank page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
