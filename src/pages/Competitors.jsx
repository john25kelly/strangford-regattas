import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/export?format=csv&gid=437404464'

export default function Competitors() {
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  // sorting & pagination state
  const [sortBy, setSortBy] = useState(null) // header key
  const [sortDir, setSortDir] = useState('asc') // or 'desc'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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

  // reset page when query, rows, or pageSize change
  useEffect(() => {
    setPage(1)
  }, [query, rows.length, pageSize])

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

  // sorting helper
  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    const sortedCopy = [...filtered].sort((a, b) => {
      const va = (a[sortBy] || '').toString().trim()
      const vb = (b[sortBy] || '').toString().trim()
      // prefer numeric compare when possible
      const na = parseFloat(va.replace(/[^0-9.\-]/g, ''))
      const nb = parseFloat(vb.replace(/[^0-9.\-]/g, ''))
      const aIsNum = !isNaN(na) && va !== ''
      const bIsNum = !isNaN(nb) && vb !== ''
      if (aIsNum && bIsNum) {
        return (na - nb) * dir
      }
      // fallback to locale compare
      return va.localeCompare(vb) * dir
    })
    return sortedCopy
  }, [filtered, sortBy, sortDir])

  // pagination
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  function toggleSort(h) {
    if (sortBy === h) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(h)
      setSortDir('asc')
    }
  }

  // simple page number window
  function pageNumbers() {
    const maxButtons = 7
    const pages = []
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    let end = start + maxButtons - 1
    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxButtons + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

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

          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <label style={{fontSize:'0.9rem',color:'var(--muted)'}} htmlFor="pageSize">Rows:</label>
            <select id="pageSize" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="page-size-select">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <a className="btn-link" href="https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/edit?gid=437404464" target="_blank" rel="noreferrer">Open original sheet</a>
          </div>
        </div>

        {loading && <p>Loading competitor list…</p>}
        {error && <p className="muted">Error loading sheet: {error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="competitors-table">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h}>
                      <button className="th-button" onClick={() => toggleSort(h)} aria-label={`Sort by ${h}`}>
                        <span>{h}</span>
                        {sortBy === h && (
                          <span aria-hidden="true"> {sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map(h => (
                      <td key={h}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && <p className="muted">No results match your search.</p>}

            <div className="pagination">
              <div className="pagination-left">
                <button onClick={() => setPage(1)} disabled={page === 1}>« First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
              </div>

              <div className="pagination-center">
                {pageNumbers().map(pn => (
                  <button key={pn} className={pn === page ? 'active' : ''} onClick={() => setPage(pn)}>{pn}</button>
                ))}
              </div>

              <div className="pagination-right">
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last »</button>
              </div>
            </div>

            <p className="muted" style={{marginTop:8}}>Showing {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} of {total} entries</p>
          </div>
        )}
      </section>

      <p className="note">If the sheet is private the list cannot be fetched — make sure the Google Sheet is published or shared publicly.</p>
    </div>
  )
}
