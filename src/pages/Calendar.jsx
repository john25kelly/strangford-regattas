import React, { useState, useMemo } from 'react'
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

export default function Calendar() {
  // bounds: entire year 2026 (Jan -> Dec)
  const MIN = new Date(2026, 0, 1) // January 2026
  const MAX = new Date(2026, 11, 1) // December 2026

  // Start view: April 2026 (preserve your earlier preference but allow full-year navigation)
  const [current, setCurrent] = useState(new Date(2026, 3, 1))
  // load events from JSON file
  const [events] = useState(eventsData)
  // search query for filtering/highlighting events
  const [query, setQuery] = useState('')

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of events) {
      (map[e.date] = map[e.date] || []).push(e)
    }
    return map
  }, [events])

  // lowercase query for case-insensitive comparisons
  const q = (query || '').trim().toLowerCase()

  // (no separate upcoming list; events are read from src/data/events.json and highlighted in the grid)

  // Months overview for quick navigation (April -> October 2026)
  const months = useMemo(() => {
    const arr = []
    for (let m = 0; m <= 11; m++) {
      arr.push(new Date(2026, m, 1))
    }
    return arr
  }, [])

  // (no separate upcoming list required)

  // compute today's key in YYYY-MM-DD so we can highlight it if it's in 2026
  const todayKey = useMemo(() => {
    const t = new Date()
    const y = t.getFullYear()
    const m = String(t.getMonth() + 1).padStart(2, '0')
    const d = String(t.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

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

  // build array of cells including leading blanks
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="page calendar-page">
      <h1>Calendar</h1>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label htmlFor="calendar-search" className="muted" style={{marginRight:6}}>Search events:</label>
          <input id="calendar-search" className="calendar-search" type="search" placeholder="Search by date, name, location or time" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button type="button" className="btn-link" onClick={() => setQuery('')}>Clear</button>}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
          {months.map((m,i) => (
            <button key={i} type="button" onClick={() => setCurrent(new Date(m))} className="btn-link">{monthTitle(m)}</button>
          ))}
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
          <div className="calendar-weekday">Sun</div>
          <div className="calendar-weekday">Mon</div>
          <div className="calendar-weekday">Tue</div>
          <div className="calendar-weekday">Wed</div>
          <div className="calendar-weekday">Thu</div>
          <div className="calendar-weekday">Fri</div>
          <div className="calendar-weekday">Sat</div>

          {cells.map((c, idx) => {
            if (c === null) return <div key={`empty-${idx}`} className="calendar-day empty" />
            const key = dateKeyFromParts(year, month, c)
            const dayEvents = eventsByDate[key] || []
            // determine if any event in this day matches the search query
            const dayHasMatch = q && dayEvents.some(ev => (
              ev.date.toLowerCase().includes(q) ||
              (ev.name && ev.name.toLowerCase().includes(q)) ||
              (ev.location && ev.location.toLowerCase().includes(q)) ||
              (ev.hwt && ev.hwt.toLowerCase().includes(q)) ||
              (ev.tide && ev.tide.toLowerCase().includes(q))
            ))

            return (
              <div key={key} className={`calendar-day ${dayEvents.length ? 'has-event' : ''} ${key === todayKey ? 'today' : ''} ${dayHasMatch ? 'match-day' : ''}`}>
                <div className="calendar-date">{c}</div>
                {dayEvents.map((ev, i) => {
                  const isMatch = q && (
                    ev.date.toLowerCase().includes(q) ||
                    (ev.name && ev.name.toLowerCase().includes(q)) ||
                    (ev.location && ev.location.toLowerCase().includes(q)) ||
                    (ev.hwt && ev.hwt.toLowerCase().includes(q)) ||
                    (ev.tide && ev.tide.toLowerCase().includes(q))
                  )
                  return (
                    <div key={i} className={`calendar-event ${isMatch ? 'match' : ''}`}>
                      <div className="ev-name">{ev.name}</div>
                      <div className="ev-meta"><strong>{ev.location}</strong> • {ev.tide ? ev.tide : 'HWT'} {ev.hwt}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <p className="muted note" style={{marginTop:12}}>Viewing months for the year 2026. Use the Prev/Next buttons or the month buttons above to navigate. Events are read from <code>src/data/events.json</code>.</p>

        {/* Upcoming events list removed per request; events continue to show in the month grid and can be searched/highlighted. */}
       </div>
     </div>
   )
}
