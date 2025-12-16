import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import NOR from './pages/NOR'
import Results from './pages/Results'
import Competitors from './pages/Competitors'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nor" element={<NOR />} />
          <Route path="/results" element={<Results />} />
          <Route path="/competitors" element={<Competitors />} />
        </Routes>
      </main>
    </div>
  )
}

