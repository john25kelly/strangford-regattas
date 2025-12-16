import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'

const SHEET_ID = '1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA'
const DEFAULT_GID = '437404464'

export default function Competitors() {
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  // sheet selection state
  const [sheetNames, setSheetNames] = useState([])
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState(null)
  const [selectedSheet, setSelectedSheet] = useState(null)
  const [manualPaste, setManualPaste] = useState('')

  // fetching-all progress / throttling state
  const [fetchingAll, setFetchingAll] = useState(false)
  const [fetchIndex, setFetchIndex] = useState(0)
  const [fetchTotal, setFetchTotal] = useState(0)
  const [fetchName, setFetchName] = useState('')

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  // sorting & pagination state
  const [sortBy, setSortBy] = useState(null) // header key
  const [sortDir, setSortDir] = useState('asc') // or 'desc'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Load list of sheet names (public worksheets feed). Choose "Impala" by default when present.
  useEffect(() => {
    let cancelled = false
    async function loadSheetNames() {
      setSheetsLoading(true)
      setSheetsError(null)
      try {
        const url = `https://spreadsheets.google.com/feeds/worksheets/${SHEET_ID}/public/full?alt=json`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Network error: ${res.status}`)
        const data = await res.json()
        const entries = (data && data.feed && data.feed.entry) || []
        const names = entries.map(e => (e && e.title && e.title.$t) || '').filter(Boolean)
        if (!cancelled) {
          setSheetNames(names)
          // default to 'Impala' tab if present (case-insensitive), otherwise first tab
          const impalaMatch = names.find(n => n && n.toLowerCase() === 'impala')
          const defaultSheet = impalaMatch || (names[0] || null)
          setSelectedSheet(defaultSheet)
        }
      } catch (err) {
        if (!cancelled) setSheetsError(err.message || String(err))
      } finally {
        if (!cancelled) setSheetsLoading(false)
      }
    }
    loadSheetNames()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCsv() {
      setLoading(true)
      setError(null)
      try {
        // always fetch the single selected sheet (or default gid fallback)
        let csvUrl
        if (selectedSheet) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(selectedSheet)}`
        } else {
          csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DEFAULT_GID}`
        }

        const res = await fetch(csvUrl)
        if (!res.ok) throw new Error(`Network error: ${res.status}`)
        const csv = await res.text()
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
        if (parsed.errors && parsed.errors.length) console.warn('PapaParse errors', parsed.errors)
        if (!cancelled) {
          setHeaders(parsed.meta.fields || [])
          setRows(parsed.data || [])
        }

       } catch (err) {
         if (!cancelled) setError(err.message || String(err))
       } finally {
         if (!cancelled) setLoading(false)
       }
     }
     loadCsv()

     return () => { cancelled = true }
  }, [selectedSheet, sheetNames])

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

            {/* Sheet selector: only show available tab names. Default opens 'Impala' if present. */}
            {sheetsLoading ? (
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <svg width="18" height="18" viewBox="0 0 50 50" aria-hidden="true">
                  <path fill="currentColor" d="M25 5A20 20 0 1 0 45 25" opacity="0.25"/>
                  <path fill="currentColor" d="M25 5A20 20 0 0 1 45 25">
                    <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </path>
                </svg>
                <select disabled aria-label="Select sheet/tab" className="sheet-select">
                  <option>Loading sheets…</option>
                </select>
              </div>
            ) : (
              <select
                aria-label="Select sheet/tab"
                className="sheet-select"
                value={selectedSheet || ''}
                onChange={e => {
                  setSelectedSheet(e.target.value)
                }}
              >
                {sheetNames && sheetNames.length ? (
                  sheetNames.map(name => <option key={name} value={name}>{name}</option>)
                ) : (
                  <option value={`DEFAULT`}>Default tab (gid {DEFAULT_GID})</option>
                )}
              </select>
            )}

            <a className="btn-link" href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer">Open original sheet</a>

            {/* Fallback: allow pasting comma-separated tab names when auto-fetch fails */}
            {(!sheetsLoading && (!sheetNames || sheetNames.length === 0)) && (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginLeft:12}}>
                <div style={{fontSize:'0.9rem',color:'var(--muted)'}}>If your sheet is private or the worksheets feed is unavailable you can paste tab names here (comma separated):</div>
                {sheetsError && <div style={{fontSize:'0.85rem',color:'var(--muted)'}}>Auto-fetch error: {sheetsError}</div>}
                <textarea
                  aria-label="Paste sheet tab names (comma separated)"
                  placeholder="Impala, IRC, Flying 15, Leisure 17"
                  value={manualPaste}
                  onChange={e => setManualPaste(e.target.value)}
                  style={{width:320,height:64}}
                />
                <div style={{display:'flex',gap:8}}>
                  <button className="btn" onClick={() => {
                    const list = (manualPaste || '').split(',').map(s=>s.trim()).filter(Boolean)
                    if (list.length) {
                      setSheetNames(list)
                      const defaultSheet = list.find(n => n.toLowerCase() === 'impala') || list[0]
                      setSelectedSheet(defaultSheet)
                      setManualPaste('')
                    }
                  }}>Use pasted names</button>
                  <button className="btn-link" onClick={() => setManualPaste('')}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {sheetsError && <p className="muted">Could not load sheet list automatically: {sheetsError}.</p>}

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
