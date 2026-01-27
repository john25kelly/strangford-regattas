import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import NORTile from '../components/NORTile'

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

// Best-effort date parser to produce YYYY-MM-DD (copied from calendar page)
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

export default function NOR() {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1aJbtVHiTU1XrvAq1aW7ZJ2kxeRPzdDFi29Xq55htjg4/edit?usp=sharing'
  const csvUrl = normalizeToCsvUrl(SHEET_URL)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
          const location = norm['location'] || norm['club'] || ''
          const hwt = norm['hwt'] || norm['time'] || ''
          const pdfUrl = norm['pdfurl'] || norm['pdf url'] || norm['si'] || norm['url'] || ''
          // support optional color/colour column (case-insensitive)
          const colour = norm['colour'] || norm['color'] || ''

          const iso = parseDateToIso(dateRaw)
          if (!iso || !name) continue
          eventsOut.push({ date: iso, name, location, hwt: hwt || undefined, pdfUrl: pdfUrl || undefined, colour: colour || undefined })
        }

        // sort chronologically ascending (earliest first)
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

  return (
    <div className="page nor">
      <h1>NOR and Sailing Instructions</h1>

      {loading && <p className="muted">Loading events …</p>}
      {error && <p className="muted">Error loading sheet: {error}</p>}

      <section className="nor-grid">
        {/* Hardcoded tile for General Sailing Instructions (not in the spreadsheet) */}
        <NORTile
          key="general-si"
          title="General Sailing Instructions"
          pdfUrl={undefined}
          note="Note: the general SI are not yet available."
          image="/new-logo.jpg"
        />
        {events.map((e, idx) => (
          <NORTile
            key={`${e.date}-${idx}`}
            title={`${e.name} - ${formatDateWithOrdinal(e.date)}`}
            date={formatDateWithOrdinal(e.date)}
            location={e.location}
            hwt={e.hwt}
            pdfUrl={e.pdfUrl}
            colour={e.colour}
          />
        ))}
      </section>

    </div>
  )
}
