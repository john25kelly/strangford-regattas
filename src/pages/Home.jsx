import React, { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import EventTile from '../components/EventTile'
import EventModal from '../components/EventModal'

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
  return `${ordinal(day)} ${month}${year ? ' ' + year : ''}`
}

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

export default function Home() {
  // ensure the public asset path respects Vite's base (works in dev and production)
  const imgSrc = (import.meta && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/') + 'whatsapp-qr.jpg'

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1aJbtVHiTU1XrvAq1aW7ZJ2kxeRPzdDFi29Xq55htjg4/edit?usp=sharing'
  const csvUrl = normalizeToCsvUrl(SHEET_URL)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

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

        const eventsOut = []
        for (const r of data) {
          const norm = {}
          for (const k of Object.keys(r)) norm[k.trim().toLowerCase()] = (r[k] || '').toString().trim()

          const dateRaw = norm['date'] || norm['day'] || norm['event date'] || norm['start date'] || ''
          const name = norm['name'] || norm['event'] || norm['title'] || ''

          const iso = parseDateToIso(dateRaw)
          if (!iso || !name) continue
          // Keep additional fields for modal (location, hwt, tide, pdfUrl)
          eventsOut.push({
            date: iso,
            name,
            location: norm['location'] || norm['venue'] || '',
            hwt: norm['hwt'] || norm['hwt time'] || '',
            tide: norm['tide'] || '',
            pdfUrl: norm['pdfurl'] || norm['pdf'] || norm['si'] || ''
          })
        }

        eventsOut.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

        if (!cancelled) setEvents(eventsOut)
      } catch (err) {
        if (!cancelled) setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCsv()
    return () => { cancelled = true }
  }, [csvUrl])

  // compute next 4 upcoming events (date >= today)
  const upcoming = useMemo(() => {
    const today = new Date()
    const filtered = events.filter(e => {
      const d = new Date(e.date + 'T00:00:00')
      return d >= new Date(today.getFullYear(), today.getMonth(), today.getDate())
    })
    return filtered.slice(0, 4)
  }, [events])

  // countdown to earliest upcoming event
  useEffect(() => {
    let timer = null
    function updateCountdown() {
      if (!upcoming || upcoming.length === 0) { setCountdown('No upcoming events'); return }
      const first = upcoming[0]
      const target = new Date(first.date + 'T00:00:00')
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) { setCountdown('Today!'); return }
      // show only days (rounded up so a partial day counts as 1 day)
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      // singular/plural handling: '1 day!!!' vs 'N days!!!'
      setCountdown(days === 1 ? '1 day!!!' : `${days} days!!!`)
    }
    updateCountdown()
    timer = setInterval(updateCountdown, 1000)
    return () => { if (timer) clearInterval(timer) }
  }, [upcoming])

  return (
    <div className="page home">
      <h1>Welcome to Strangford Lough Regattas</h1>
      <section className="home-content">

        {/* Upcoming events section: countdown above 4 small event tiles */}
        <div className="nor-tile" style={{marginBottom:16}}>
          <h3>Upcoming Events</h3>
          <p className="muted">Get ready — racing season is coming! Here are the next events:</p>

          {loading && <p className="muted">Loading events…</p>}
          {error && <p className="muted">Error loading events: {error}</p>}

          {!loading && !error && (
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
              {upcoming.length === 0 && <div className="muted">No upcoming events found</div>}
              {upcoming.map((ev, i) => (
                <EventTile
                  key={`${ev.date}-${i}`}
                  ev={ev}
                  dateLabel={formatDateWithOrdinal(ev.date)}
                  className="full-width-mobile"
                  onClick={(e) => setSelectedEvent({ ...e })}
                />
              ))}
            </div>
          )}

          <div style={{marginTop:12, fontWeight:700}}>Countdown to the next event: <span style={{color:'var(--accent)'}}>{countdown}</span></div>
        </div>

        {/* WhatsApp QR code (put the image at public/whatsapp-qr.jpg) */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginTop:20}}>
          <a
            href="https://chat.whatsapp.com/KztLCaVYPuN2cM0ha25xHE"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join WhatsApp group"
            title="Join the Strangford Lough Regatta WhatsApp group"
          >
            <img
              src={imgSrc}
              alt="WhatsApp group QR code for Strangford Lough Regatta"
              style={{maxWidth:360,width:'100%',height:'auto',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.1)'}}
            />
          </a>
          <p className="muted" style={{textAlign:'center',maxWidth:600}}>
            Scan or click the QR code to join the WhatsApp group
          </p>
        </div>

        {/* Social media tile: WhatsApp QR, Instagram and Facebook links */}
        <div className="nor-tile" style={{marginTop:16,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <h3>Follow us on social media</h3>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            {/* Removed the QR from this tile per request; WhatsApp QR remains above. */}

            <div style={{display:'flex',gap:20,alignItems:'center'}}>
              <a href="https://www.instagram.com/strangfordloughregattas?igsh=dmg3YnN5bWJuYnZv&utm_source=qr" target="_blank" rel="noopener noreferrer" title="Instagram">
                <img src={import.meta.env.BASE_URL + 'instagram.svg'} alt="Instagram" style={{width:56,height:56}} />
              </a>

              <a href="https://www.facebook.com/groups/873119219900371" target="_blank" rel="noopener noreferrer" title="Facebook">
                <img src={import.meta.env.BASE_URL + 'facebook.svg'} alt="Facebook" style={{width:56,height:56}} />
              </a>
            </div>
          </div>
        </div>

        {/* Use shared EventModal component for details */}
        {selectedEvent && (
          <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}

       </section>
     </div>
   )
 }
