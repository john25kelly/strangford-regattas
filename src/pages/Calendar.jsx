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

  const [current, setCurrent] = useState(new Date(2026, 3, 1))
  const [events] = useState(eventsData)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const modalCloseRef = useRef(null)
  const previouslyFocused = useRef(null)

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of events) {
      ;(map[e.date] = map[e.date] || []).push(e)
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

                {dayEvents.map((ev, i) => (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    className="calendar-event clickable"
                    onClick={() => setSelectedEvent({ ...ev })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedEvent({ ...ev }) }}
                  >
                    <div className="ev-name">{ev.name}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <p className="muted note" style={{marginTop:12}}>Viewing months for the year 2026. Use the Prev/Next buttons or the month buttons above to navigate. Events are read from <code>src/data/events.json</code>.</p>

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
