import React, { useEffect, useMemo, useState, useRef } from 'react'
import Papa from 'papaparse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import localEvents from '../data/events.json'
import { SHEET_URL } from '../config' // const SHEET_URL imported from centralized config

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

// Best-effort date parser to produce YYYY-MM-DD
function parseDateToIso(str) {
  if (!str) return null
  let s = String(str).trim()
  s = s.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = Math.floor(Number(s))
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const dt = new Date(epoch.getTime() + n * 24 * 60 * 60 * 1000)
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const dtAuto = new Date(s)
  if (!isNaN(dtAuto.getTime())) {
    const y = dtAuto.getFullYear()
    const m = String(dtAuto.getMonth() + 1).padStart(2, '0')
    const d = String(dtAuto.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m1) {
    const a = parseInt(m1[1], 10)
    const b = parseInt(m1[2], 10)
    const yr = parseInt(m1[3], 10)
    function buildIso(year, month1based, day) {
      if (month1based < 1 || month1based > 12) return null
      if (day < 1 || day > 31) return null
      const dt = new Date(year, month1based - 1, day)
      if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month1based || dt.getDate() !== day) return null
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${year}-${mm}-${dd}`
    }
    if (a > 12 && b <= 12) return buildIso(yr, b, a)
    if (b > 12 && a <= 12) return buildIso(yr, a, b)
    let tryIso = buildIso(yr, a, b)
    if (tryIso) return tryIso
    tryIso = buildIso(yr, b, a)
    if (tryIso) return tryIso
  }
  return null
}

export default function Calendar() {
  // Use the provided share URL (user-supplied) and normalize it to a CSV export URL

  function normalizeToCsvUrl(url) {
    if (!url) return url
    try {
      if (/\/export\?/i.test(url)) return url
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      const id = m ? m[1] : null
      const gidMatch = url.match(/[?&]gid=(\d+)/)
      const gid = gidMatch ? gidMatch[1] : '0'
      if (id) return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
      return url
    } catch (err) {
      return url
    }
  }

  const csvUrl = normalizeToCsvUrl(SHEET_URL)
  const MIN = new Date(2026, 0, 1)
  const MAX = new Date(2026, 11, 1)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const [current, setCurrent] = useState(() => {
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
    } catch (err) {}
    return new Date(2026, 3, 1)
  })

  const [selectedEvent, setSelectedEvent] = useState(null)
  const modalCloseRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    try {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      localStorage.setItem('calendar:current', `${y}-${m}`)
    } catch (err) {}
  }, [current])

  useEffect(() => {
    let cancelled = false
    async function fetchCsv() {
      setLoading(true)
      setError(null)
      try {
        let text
        try {
          text = await fetchWithTimeout(csvUrl, 10000)
        } catch (fetchErr) {
          // fallback to local events if remote fetch fails/times out
          if (!cancelled) {
            // ensure banner state is set before rendering rows
            console.debug('Calendar: falling back to local events.json')
            setUsingFallback(true)
            setRows(localEvents.map(e => ({
              date: parseDateToIso(e.date) || '',
              name: e.name || '',
              location: e.location || '',
              hwt: e.hwt || '',
              tide: e.tide || '',
              pdfUrl: e.pdfUrl || ''
            })).filter(ev => ev.date && ev.name))
          }
           setLoading(false)
           return
         }

        let parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        let data = parsed.data || []

        const firstHeader = (parsed.meta && parsed.meta.fields && parsed.meta.fields[0]) || ''
        const looksLikeDateHeader = /^(\d{1,2}(st|nd|rd|th)?\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/i.test(firstHeader)
        if (data.length === 0 || looksLikeDateHeader) {
          const parsedNoHeader = Papa.parse(text, { header: false, skipEmptyLines: true })
          const rowsArr = parsedNoHeader.data || []
          data = rowsArr.map(r => ({
            date: (r[0] || '').toString(),
            name: (r[1] || '').toString(),
            location: (r[2] || '').toString(),
            hwt: (r[3] || '').toString(),
            tide: (r[4] || '').toString(),
            pdfUrl: (r[5] || '').toString()
          }))
        }

        const events = []
        for (const r of data) {
          const norm = {}
          for (const k of Object.keys(r)) {
            norm[k.trim().toLowerCase()] = (r[k] || '').toString().trim()
          }

          const dateRaw = norm['date'] || norm['day'] || norm['event date'] || norm['start date'] || ''
          const name = norm['name'] || norm['event'] || norm['title'] || ''
          const location = norm['location'] || norm['club'] || ''
          const hwt = norm['hwt'] || norm['time'] || ''
          const tide = norm['tide'] || ''
          const pdfUrl = norm['pdfurl'] || norm['pdf url'] || norm['si'] || norm['url'] || ''

          const iso = parseDateToIso(dateRaw)
          if (!iso || !name) continue

          events.push({ date: iso, name, location, hwt, tide: tide || undefined, pdfUrl: pdfUrl || undefined })
        }

        if (!cancelled) setRows(events)
      } catch (err) {
        if (!cancelled) setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCsv()
    return () => { cancelled = true }
  }, [csvUrl])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of rows) {
      ;(map[e.date] = map[e.date] || []).push(e)
    }
    return map
  }, [rows])

  const todayKey = useMemo(() => {
    const t = new Date()
    const y = t.getFullYear()
    const m = String(t.getMonth() + 1).padStart(2, '0')
    const d = String(t.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
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

  // Compute whether the selected event actually contains a PDF URL (spreadsheet cell provided)
  // Normalize the selected event's pdfUrl (if any) to either a trimmed string or null.
  const selectedEventPdfUrl = (() => {
    if (!selectedEvent) return null
    try {
      const trimmed = String(selectedEvent.pdfUrl || '').trim()
      return trimmed.length ? trimmed : null
    } catch (err) {
      return null
    }
  })()

  return (
    <div className="page calendar-page">
      <h1>Calendar</h1>

      {/* Show unobtrusive fallback banner immediately under the page title so it's always visible */}
      {usingFallback && (
        <div className="fallback-banner" role="status" aria-live="polite">
          Using local cached event data because the remote spreadsheet could not be reached.
          <small>Data may be out-of-date.</small>
        </div>
      )}

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <strong className="muted">Jump to month:</strong>
          {Array.from({ length: 12 }).map((_, m) => (
            <button key={m} type="button" onClick={() => setCurrent(new Date(2026, m, 1))} className="btn-link">{monthTitle(new Date(2026, m, 1))}</button>
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
          {[ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].map((wd, idx) => (
            <div key={wd} className={`calendar-weekday ${idx === 5 || idx === 6 ? 'weekend' : ''}`}>{wd}</div>
          ))}

          {cells.map((c, idx) => {
            if (c === null) {
              return <div key={idx} className="calendar-day blank" />
            }
            const iso = dateKeyFromParts(year, month, c)
            const isToday = iso === todayKey
            const isSelected = selectedEvent && selectedEvent.date === iso
            const dayEvents = eventsByDate[iso] || []
            const eventCount = dayEvents.length

            return (
              <div key={idx} className="calendar-day" data-today={isToday ? 'true' : undefined}>
                <div className="calendar-day-inner">
                  <div className="calendar-date">{c}</div>
                  {eventCount > 0 && (
                    <div className="calendar-events" aria-hidden={isSelected}>
                      {dayEvents.slice(0, 2).map((ev, evIdx) => {
                        const pdfUrl = ev.pdfUrl ? String(ev.pdfUrl).trim() : null
                        const hasPdf = pdfUrl && pdfUrl !== '#'
                        const isFirst = evIdx === 0
                        const isLast = evIdx === dayEvents.length - 1
                        return (
                          <div key={ev.date + ev.name} className={`calendar-event ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''} ${hasPdf ? 'has-pdf' : ''}`} style={{}}>
                            <div className="calendar-event-name">{ev.name}</div>
                            <div className="calendar-event-details">
                              {ev.location && <div className="calendar-event-location">{ev.location}</div>}
                              {ev.hwt && <div className="calendar-event-time">{ev.hwt}</div>}
                              {ev.tide && <div className="calendar-event-tide">{ev.tide}</div>}
                            </div>
                            {hasPdf && (
                              <div className="calendar-event-pdf">
                                <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-pdf">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h8v5h5v11z"/></svg>
                                  <span className="btn-pdf-text">PDF</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {eventCount > 2 && (
                        <div className="calendar-event-more">
                          +{eventCount - 2} more
                        </div>
                      )}
                    </div>
                  )}
                  {isSelected && (
                    <div className="calendar-event-selected">
                      <div className="calendar-event-name">{selectedEvent.name}</div>
                      <div className="calendar-event-details">
                        {selectedEvent.location && <div className="calendar-event-location">{selectedEvent.location}</div>}
                        {selectedEvent.hwt && <div className="calendar-event-time">{selectedEvent.hwt}</div>}
                        {selectedEvent.tide && <div className="calendar-event-tide">{selectedEvent.tide}</div>}
                      </div>
                      {selectedEvent.pdfUrl && (
                        <div className="calendar-event-pdf">
                          <a href={selectedEvent.pdfUrl} target="_blank" rel="noreferrer" className="btn-pdf">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h8v5h5v11z"/></svg>
                            <span className="btn-pdf-text">PDF</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="banner-error">
          Error: {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}

      {loading && (
        <div className="banner-loading">
          Loading events...
        </div>
      )}

      <div className="calendar-modal-wrapper">
        {selectedEvent && (
          <div className="calendar-modal">
            <div className="calendar-modal-content">
              <div className="calendar-modal-header">
                <h2 className="calendar-modal-title">{selectedEvent.name}</h2>
                <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)} aria-label="Close">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="calendar-modal-body">
                {selectedEvent.location && (
                  <div className="calendar-modal-location">
                    <strong>Location:</strong> {selectedEvent.location}
                  </div>
                )}
                {selectedEvent.hwt && (
                  <div className="calendar-modal-time">
                    <strong>Time:</strong> {selectedEvent.hwt}
                  </div>
                )}
                {selectedEvent.tide && (
                  <div className="calendar-modal-tide">
                    <strong>Tide:</strong> {selectedEvent.tide}
                  </div>
                )}
                {selectedEvent.pdfUrl && (
                  <div className="calendar-modal-pdf">
                    <a href={selectedEvent.pdfUrl} target="_blank" rel="noreferrer" className="btn-pdf">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h8v5h5v11z"/></svg>
                      <span className="btn-pdf-text">PDF</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
