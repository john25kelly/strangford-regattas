import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/export?format=csv&gid=437404464'

export default function Competitors() {
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(SHEET_CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Network error: ${res.status}`)
        return res.text()
      })
      .then(csv => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
        if (parsed.errors && parsed.errors.length) {
          console.warn('PapaParse errors', parsed.errors)
        }
        if (!cancelled) {
          setHeaders(parsed.meta.fields || [])
          setRows(parsed.data || [])
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    return rows.filter(r =>
      headers.some(h => {
        const v = (r[h] || '').toString().toLowerCase()
        return v.includes(q)
      })
    )
  }, [rows, headers, query])

  return (
    <div className="page competitors">
      <h1>Competitors</h1>
      <p className="muted">The competitor list below is fetched from a public Google Sheet and displayed here.</p>

      <section>
        <div className="competitors-controls">
          <input
            type="text"
            placeholder="Search competitors..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search competitors"
            className="search-input"
          />

          <a className="btn-link" href="https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/edit?gid=437404464" target="_blank" rel="noreferrer">Open original sheet</a>
        </div>

        {loading && <p>Loading competitor list…</p>}
        {error && <p className="muted">Error loading sheet: {error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="competitors-table">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map(h => (
                      <td key={h}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="muted">No results match your search.</p>}
          </div>
        )}
      </section>

      <p className="note">If the sheet is private the list cannot be fetched — make sure the Google Sheet is published or shared publicly.</p>
    </div>
  )
}
