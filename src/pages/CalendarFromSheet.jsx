import React, { useEffect, useMemo, useState, useRef } from 'react'
import Papa from 'papaparse'

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

  // Remove ordinal suffixes (e.g. '6th' -> '6') to improve parsing
  s = s.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, '$1')

  // 1) ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // 2) Numeric serial (Google Sheets/Excel) - treat as days since 1899-12-30
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = Math.floor(Number(s))
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const dt = new Date(epoch.getTime() + n * 24 * 60 * 60 * 1000)
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 3) Try letting JS parse it (handles many human formats like "June 14, 2026")
  const dtAuto = new Date(s)
  if (!isNaN(dtAuto.getTime())) {
    const y = dtAuto.getFullYear()
    const m = String(dtAuto.getMonth() + 1).padStart(2, '0')
    const d = String(dtAuto.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 4) Try explicit dd/mm/yyyy or mm/dd/yyyy with delimiters
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m1) {
    const a = parseInt(m1[1], 10)
    const b = parseInt(m1[2], 10)
    const yr = parseInt(m1[3], 10)

    // Helper to build ISO if values are valid
    function buildIso(year, month1based, day) {
      if (month1based < 1 || month1based > 12) return null
      if (day < 1 || day > 31) return null
      const dt = new Date(year, month1based - 1, day)
      if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month1based || dt.getDate() !== day) return null
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${year}-${mm}-${dd}`
    }

    // If first part > 12 it's definitely day-first (dd/mm)
    if (a > 12 && b <= 12) {
      return buildIso(yr, b, a)
    }
    // If second part > 12 it's definitely month-first (mm/dd)
    if (b > 12 && a <= 12) {
      return buildIso(yr, a, b)
    }

    // Ambiguous case: try month-first then day-first
    let tryIso = buildIso(yr, a, b)
    if (tryIso) return tryIso
    tryIso = buildIso(yr, b, a)
    if (tryIso) return tryIso
  }

  return null
}

export default function CalendarFromSheet() {
  // Use the provided share URL (user-supplied) and normalize it to a CSV export URL
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1aJbtVHiTU1XrvAq1aW7ZJ2kxeRPzdDFi29Xq55htjg4/edit?usp=sharing'

  function normalizeToCsvUrl(url) {
    if (!url) return url
    try {
      // If it's already an export URL, return unchanged
      if (/\/export\?/i.test(url)) return url
      // Try extract the sheet ID
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      const id = m ? m[1] : null
      // Try extract gid if provided
      const gidMatch = url.match(/[?&]gid=(\d+)/)
      const gid = gidMatch ? gidMatch[1] : '0'
      if (id) return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
      return url
    } catch (err) {
      return url
    }
  }

  const csvUrl = normalizeToCsvUrl(SHEET_URL)

  // Range for the calendar (clamp to 2026 months)
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

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // calendar state
  const [current, setCurrent] = useState(() => loadSavedCurrent())
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

  useEffect(() => {
    let cancelled = false
    async function fetchCsv() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(csvUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()

        let parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        let data = parsed.data || []

        // If parsing with header:true produced no data, or the inferred header looks like a date
        // (meaning the sheet likely doesn't include a header row), reparse as header:false
        // and map columns to expected fields.
        const firstHeader = (parsed.meta && parsed.meta.fields && parsed.meta.fields[0]) || ''
        const looksLikeDateHeader = /^(\d{1,2}(st|nd|rd|th)?\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/i.test(firstHeader)
        if (data.length === 0 || looksLikeDateHeader) {
          const parsedNoHeader = Papa.parse(text, { header: false, skipEmptyLines: true })
          const rowsArr = parsedNoHeader.data || []
          // Map rows arrays to objects
          data = rowsArr.map(r => ({
            date: (r[0] || '').toString(),
            name: (r[1] || '').toString(),
            location: (r[2] || '').toString(),
            hwt: (r[3] || '').toString(),
            tide: (r[4] || '').toString(),
            pdfurl: (r[5] || '').toString()
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
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = '' }
  }, [selectedEvent])

  function go(delta) {
    const next = new Date(current.getFullYear(), current.getMonth() + delta, 1)
    setCurrent(next)
  }

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay() // 0=Sun .. 6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  const leadingBlanks = (startDay + 6) % 7
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="page calendar-page">
      <h1>Events Calendar</h1>

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
            <button type="button" onClick={() => go(-1)} aria-label="Previous month">‹ Prev</button>
            <button type="button" onClick={() => go(1)} aria-label="Next month" style={{ marginLeft: 8 }}>Next ›</button>
          </div>
          <div className="calendar-title" aria-live="polite">{monthTitle(current)}</div>
        </div>

        <div className="calendar-grid">
          {[ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].map((wd, idx) => (
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

        {loading && <p className="muted">Loading events from sheet…</p>}
        {error && <p className="muted">Error loading sheet: {error}</p>}

        {/* Event detail modal (same layout as existing calendar) */}
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
                  const url = selectedEvent.pdfUrl || siMap[key] || siMap[(key || '').toUpperCase()] || null
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
