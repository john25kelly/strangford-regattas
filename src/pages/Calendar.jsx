import React, { useState, useMemo, useEffect, useRef } from 'react'
import eventsData from '../data/events.json'

// Helper: format month title
function monthTitle(d) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

// Helper: format a yyyy-mm-dd key from a Date
function dateKeyFromParts(y, m, day) {
  const mm = String(m + 1).padStart(2, '0')
  return `${y}-${mm}-${String(day).padStart(2, '0')}`
}

// Helper: format ISO date (YYYY-MM-DD) into "12th July 2026"
function formatDateWithOrdinal(iso) {
  if (!iso) return ''
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  const date = new Date(y, m, d)
  const day = date.getDate()
  const month = date.toLocaleString(undefined, { month: 'long' })
  const year = date.getFullYear()
  function ordinal(n) {
    const s = ['th','st','nd','rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }
  return `${ordinal(day)} ${month} ${year}`
}

export default function Calendar() {
  const MIN = new Date(2026, 0, 1)
  const MAX = new Date(2026, 11, 1)

  // Restore saved month (format: YYYY-MM) from localStorage when available
  function loadSavedCurrent() {
    try {
      const s = localStorage.getItem('calendar:current')
      if (s && /^\d{4}-\d{2}$/.test(s)) {
        const [yy, mm] = s.split('-')
        const y = parseInt(yy, 10)
        const m = Math.max(1, Math.min(12, parseInt(mm, 10))) - 1
        const d = new Date(y, m, 1)
        if (!isNaN(d.getTime())) {
          if (d < MIN) return new Date(MIN)
          if (d > MAX) return new Date(MAX)
          return d
        }
      }
    } catch (err) {
      // ignore localStorage errors
    }
    return new Date(2026, 3, 1)
  }

  const [current, setCurrent] = useState(() => loadSavedCurrent())
  const [events] = useState(eventsData)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const modalCloseRef = useRef(null)
  const previouslyFocused = useRef(null)

  // Persist the current month when it changes
  useEffect(() => {
    try {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      localStorage.setItem('calendar:current', `${y}-${m}`)
    } catch (err) {
      // ignore
    }
  }, [current])

  const eventsByDate = useMemo(() => {
    const map = {}

    // helper: try to normalize event.date into an ISO yyyy-mm-dd key
    function normalizeDateKey(d) {
      if (!d) return null
      // already ISO-like
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
      // try to parse formats like "9th May 2026" or "9 May 2026"
      const m = String(d).trim().match(/^([0-9]{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/)
      if (m) {
        const day = Number(m[1])
        const monthName = m[2].toLowerCase()
        const year = Number(m[3])
        const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december']
        const mi = monthNames.indexOf(monthName)
        if (mi >= 0) {
          const mm = String(mi + 1).padStart(2, '0')
          const dd = String(day).padStart(2, '0')
          return `${year}-${mm}-${dd}`
        }
      }
      // last resort: try Date.parse
      const parsed = Date.parse(d)
      if (!isNaN(parsed)) {
        const dt = new Date(parsed)
        const y = dt.getFullYear()
        const mm = String(dt.getMonth() + 1).padStart(2, '0')
        const dd = String(dt.getDate()).padStart(2, '0')
        return `${y}-${mm}-${dd}`
      }
      return null
    }

    for (const e of events) {
      const key = normalizeDateKey(e.date) || e.date
      ;(map[key] = map[key] || []).push(e)
    }
    return map
  }, [events])

  const siMap = {
    NSC: 'https://www.strangfordloughregattas.co.uk/documents/NSC2025.pdf',
    QYC: 'https://www.strangfordloughregattas.co.uk/documents/QYC2025.pdf',
    KSC: 'https://www.strangfordloughregattas.co.uk/documents/KSC2025.pdf',
    'Bar Buoy': 'https://www.strangfordloughregattas.co.uk/documents/BarBuoy2025.pdf',
    SSC: 'https://www.strangfordloughregattas.co.uk/documents/SSC2025.pdf',
    PSC: 'https://www.strangfordloughregattas.co.uk/documents/PSC2025.pdf',
    PTR: 'https://www.strangfordloughregattas.co.uk/documents/PTR2025.pdf',
    KYC: 'https://www.strangfordloughregattas.co.uk/documents/KYC2025.pdf',
    EDYC: 'https://www.strangfordloughregattas.co.uk/documents/EDYC2025v2.pdf',
    SLYC: 'https://www.strangfordloughregattas.co.uk/documents/slycv52025.pdf'
  }

  // Optional fallback colour map by location (used when event has no explicit `colour` field)
  const locationColorMap = {
    QYC: '#0b3d91',
    EDYC: '#1e6fb8',
    KYC: '#0b6b4a',
    KSC: '#b84e1e',
    NSC: '#6b3d9a',
    SSC: '#0b5a91',
    PSC: '#b88f1e',
    SLYC: '#1e6fb8'
  }

  const months = useMemo(() => {
    const arr = []
    for (let m = 0; m <= 11; m++) arr.push(new Date(2026, m, 1))
    return arr
  }, [])

  const todayKey = useMemo(() => {
    const t = new Date()
    const y = t.getFullYear()
    const m = String(t.getMonth() + 1).padStart(2, '0')
    const d = String(t.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setSelectedEvent(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!selectedEvent) {
      try { if (previouslyFocused.current && previouslyFocused.current.focus) previouslyFocused.current.focus() } catch (err) {}
      document.body.style.overflow = ''
      return
    }
    previouslyFocused.current = document.activeElement
    document.body.style.overflow = 'hidden'
    setTimeout(() => { if (modalCloseRef.current && modalCloseRef.current.focus) modalCloseRef.current.focus() }, 0)

    function trap(e) {
      if (e.key !== 'Tab') return
      const modal = document.querySelector('.modal')
      if (!modal) return
      const focusable = modal.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = '' }
  }, [selectedEvent])

  function go(delta) {
    const next = new Date(current.getFullYear(), current.getMonth() + delta, 1)
    if (next < MIN) return
    if (next > MAX) return
    setCurrent(next)
  }

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay() // 0=Sun .. 6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Start weeks on Monday: compute leading blanks
  const cells = []
  const leadingBlanks = (startDay + 6) % 7 // maps Sunday(0)->6, Monday(1)->0, etc.
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="page calendar-page">
      <h1>Calendar</h1>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <strong className="muted">Jump to month:</strong>
          {months.map((m,i) => {
            const isActive = m.getFullYear() === current.getFullYear() && m.getMonth() === current.getMonth()
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(new Date(m))}
                className={`btn-link ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
              >
                {monthTitle(m)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div>
            <button type="button" onClick={() => go(-1)} disabled={current <= MIN} aria-label="Previous month">‹ Prev</button>
            <button type="button" onClick={() => go(1)} disabled={new Date(current.getFullYear(), current.getMonth() + 1, 1) > MAX} aria-label="Next month" style={{marginLeft:8}}>Next ›</button>
          </div>
          <div className="calendar-title" aria-live="polite">{monthTitle(current)}</div>
        </div>

        <div className="calendar-grid">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((wd, idx) => (
            <div key={wd} className={`calendar-weekday ${idx === 5 || idx === 6 ? 'weekend' : ''}`}>{wd}</div>
          ))}

          {cells.map((c, idx) => {
            if (c === null) return <div key={`empty-${idx}`} className="calendar-day empty" />
            const key = dateKeyFromParts(year, month, c)
            const dayEvents = eventsByDate[key] || []
            const dow = new Date(year, month, c).getDay()

            return (
              <div key={key} className={`calendar-day ${dayEvents.length ? 'has-event' : ''} ${key === todayKey ? 'today' : ''} ${dow === 0 || dow === 6 ? 'weekend' : ''}`}>
                <div className="calendar-date">{c}</div>

                {dayEvents.map((ev, i) => {
                  // compute optional inline style for event tile based on ev.colour / ev.color
                  const tileStyle = {}
                  let tileTextColor = null

                  // normalize incoming colour and guard against non-string values
                  const rawColour = String(ev.colour || ev.color || '').trim()

                  if (rawColour) {
                    const hexMatch = rawColour.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
                    if (hexMatch) {
                      let hex = hexMatch[1]
                      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
                      const r = parseInt(hex.slice(0,2), 16)
                      const g = parseInt(hex.slice(2,4), 16)
                      const b = parseInt(hex.slice(4,6), 16)
                      // blend toward white to make the tint pale
                      const blendFactor = 0.9
                      const br = Math.round(r + (255 - r) * blendFactor)
                      const bg = Math.round(g + (255 - g) * blendFactor)
                      const bb = Math.round(b + (255 - b) * blendFactor)
                      const blendedHex = '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('')
                      tileStyle.background = blendedHex
                      const luminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
                      tileTextColor = luminance < 0.6 ? '#ffffff' : 'var(--muted)'
                      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
                    } else {
                      // for non-hex values apply a pale white overlay
                      tileStyle.background = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), ${rawColour}`
                      tileTextColor = 'var(--muted)'
                      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
                    }
                  } else {
                    // Fallback to location-based colour if no explicit colour is set
                    const locationKey = ev.location || ''
                    const fallbackColor = locationColorMap[locationKey.toUpperCase()] || null
                    if (fallbackColor) {
                      // blend the fallback hex toward white (same approach as explicit hex colours)
                      let hex = fallbackColor.replace('#', '')
                      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
                      const r = parseInt(hex.slice(0,2), 16)
                      const g = parseInt(hex.slice(2,4), 16)
                      const b = parseInt(hex.slice(4,6), 16)
                      const blendFactor = 0.9
                      const br = Math.round(r + (255 - r) * blendFactor)
                      const bg = Math.round(g + (255 - g) * blendFactor)
                      const bb = Math.round(b + (255 - b) * blendFactor)
                      const blendedHex = '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('')
                      tileStyle.background = blendedHex
                      const luminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
                      tileTextColor = luminance < 0.6 ? '#ffffff' : 'var(--muted)'
                      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
                    }
                  }

                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      className="calendar-event clickable"
                      onClick={() => setSelectedEvent({ ...ev })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedEvent({ ...ev }) }}
                      style={Object.keys(tileStyle).length ? tileStyle : undefined}
                    >
                      <div className="ev-name" style={tileTextColor ? { color: tileTextColor } : undefined}>{ev.name}</div>
                    </div>
                  )
                })}

              </div>
            )
          })}
        </div>

        {/* Event detail modal */}
        {selectedEvent && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={() => setSelectedEvent(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 id="modal-title" style={{margin:0}}>{selectedEvent.name}</h3>
                <button ref={modalCloseRef} className="modal-close" aria-label="Close" onClick={() => setSelectedEvent(null)}>×</button>
              </div>
              <div className="modal-body">
                <p><strong>Date:</strong> {formatDateWithOrdinal(selectedEvent.date)}</p>
                <p><strong>Location:</strong> {selectedEvent.location}</p>
                <p><strong>{selectedEvent.tide ? selectedEvent.tide : 'HWT'}:</strong> {selectedEvent.hwt}</p>
              </div>
              <div className="modal-actions">
                {(() => {
                  const key = selectedEvent.location || selectedEvent.name || ''
                  const url = siMap[key] || siMap[(key || '').toUpperCase()] || null
                  if (url) {
                    return (
                      <>
                        <a href={url} target="_blank" rel="noreferrer" className="btn-link" style={{marginRight:8}}>View SI</a>
                        <a href={url} download className="btn-link">Download SI</a>
                      </>
                    )
                  }
                  return (
                    <>
                      <button className="btn-link disabled" disabled style={{marginRight:8}}>View SI</button>
                      <button className="btn-link disabled" disabled>Download SI</button>
                    </>
                  )
                })()}

                <button className="btn-link" onClick={() => setSelectedEvent(null)} style={{marginLeft:12}}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
