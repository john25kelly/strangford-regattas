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
import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'

const SHEET_ID = '1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA'
                  className="sheet-select"
const DEFAULT_GID = '437404464'
// We will build the CSV URL dynamically depending on the selected sheet/tab.

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
  const [manualSheet, setManualSheet] = useState('') // fallback manual sheet name or gid
  const [showAll, setShowAll] = useState(false)
  const [manualMode, setManualMode] = useState(false)
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

  // Load list of sheet names (public worksheets feed). If this fails (CORS or not public), user can enter a sheet name/gid manually.
  useEffect(() => {
    let cancelled = false
    async function loadSheetNames() {
      setSheetsLoading(true)
                    <input className="sheet-input" type="text" placeholder="Sheet gid (numeric) or sheet name" value={manualSheet} onChange={e => setManualSheet(e.target.value)} aria-label="Sheet gid or name" />
      try {
        const url = `https://spreadsheets.google.com/feeds/worksheets/${SHEET_ID}/public/full?alt=json`
                )}
                {/* Fetching progress when showAll active and fetching is in-flight */}
                {showAll && fetchingAll && (
                  <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:8}}>
                    <svg width="18" height="18" viewBox="0 0 50 50" aria-hidden="true">
                      <path fill="currentColor" d="M25 5A20 20 0 1 0 45 25" opacity="0.25"/>
                      <path fill="currentColor" d="M25 5A20 20 0 0 1 45 25">
                        <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    <div style={{fontSize:'0.9rem',color:'var(--muted)'}}>Fetching {fetchIndex}/{fetchTotal}: {fetchName}</div>
                  </div>
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Network error: ${res.status}`)
        const data = await res.json()
        const entries = (data && data.feed && data.feed.entry) || []
        const names = entries.map(e => (e && e.title && e.title.$t) || '').filter(Boolean)
        if (!cancelled) {
          setSheetNames(names)
          setSelectedSheet(names[0] || null)
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
    // build CSV URL for the currently selected sheet/tab.
    let cancelled = false
    async function loadCsv() {
      setLoading(true)
      setError(null)
      try {
        // If showAll is requested and we have sheetNames, fetch each sheet and combine
        if (showAll && sheetNames && sheetNames.length) {
          // Sequentially fetch each sheet to avoid flooding the network
          setFetchingAll(true)
          setFetchTotal(sheetNames.length)
          const results = []
          for (let i = 0; i < sheetNames.length; i++) {
            if (cancelled) break
            const name = sheetNames[i]
            setFetchIndex(i + 1)
            setFetchName(name)
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
            const r = await fetch(url)
            if (!r.ok) throw new Error(`Network error fetching sheet "${name}": ${r.status}`)
            const txt = await r.text()
            const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true })
            results.push({ name, parsed })
            // small delay between fetches to reduce burst pressure
            await delay(150)
          }

          if (!cancelled) {
            // build union of headers, keep order from first sheet followed by new ones
            const headerSet = []
            results.forEach(({ parsed }) => {
              (parsed.meta.fields || []).forEach(f => { if (!headerSet.includes(f)) headerSet.push(f) })
            })
            // add an explicit Sheet column to indicate origin
            if (!headerSet.includes('Sheet')) headerSet.push('Sheet')

            // combine rows, adding Sheet column
            const combinedRows = []
            results.forEach(({ name, parsed }) => {
              (parsed.data || []).forEach(r => {
                const rowCopy = { ...r }
                rowCopy['Sheet'] = name
                combinedRows.push(rowCopy)
              })
            })

            setHeaders(headerSet)
            setRows(combinedRows)
          }
          setFetchingAll(false)
          setFetchIndex(0)
          setFetchTotal(0)
          setFetchName('')
        } else {
          let csvUrl
          if (selectedSheet) {
            // prefer gviz CSV output with a sheet name parameter (works for public sheets)
            csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(selectedSheet)}`
          } else if (manualSheet) {
            // allow manual sheet name or numeric gid fallback
            // if it looks numeric, use gid export, otherwise attempt gviz with sheet name
            if (/^\d+$/.test(manualSheet)) {
              csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${manualSheet}`
            } else {
              csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(manualSheet)}`
            }
          } else {
            // final fallback to the original hard-coded gid
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
        }
      } catch (err) {
        if (!cancelled) setError(err.message || String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCsv()

    return () => { cancelled = true }
  }, [selectedSheet, manualSheet, showAll, sheetNames])

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

            {/* Sheet selector: show a dropdown populated with sheet tab names when available.
                The dropdown also includes options to show all tabs or enter a gid manually. */}
            {sheetsLoading ? (
              <div style={{display:'flex',alignItems:'center',gap:8}}>
            ) : (
              <>
                <select
                  aria-label="Select sheet/tab"
                  value={manualMode ? 'MANUAL' : (showAll ? 'ALL' : (selectedSheet || ''))}
                  onChange={e => {
                    const v = e.target.value
                    if (v === 'ALL') {
                      setShowAll(true)
                      setSelectedSheet(null)
                      setManualMode(false)
                      setManualSheet('')
                    } else if (v === 'MANUAL') {
                      setManualMode(true)
                      setShowAll(false)
                      setSelectedSheet(null)
                    } else {
                      setSelectedSheet(v)
                      setShowAll(false)
                      setManualMode(false)
                    }
                  }}
                >
                  {sheetNames && sheetNames.length ? (
                    sheetNames.map(name => <option key={name} value={name}>{name}</option>)
                  ) : (
                    <option value={`DEFAULT`}>Default tab (gid {DEFAULT_GID})</option>
                  )}
                  <option value="ALL">-- Show all tabs --</option>
                  <option value="MANUAL">-- Enter gid manually --</option>
                </select>

                {/* Keep the old quick action button for convenience */}
                {sheetNames && sheetNames.length && !showAll && (
                  <button className="btn-link" onClick={() => { setShowAll(true); setSelectedSheet(null); setManualSheet(''); setManualMode(false) }}>Show all tabs</button>
                )}

                {/* When the user chooses manual mode, reveal the manual gid input */}
                {manualMode && (
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="text" placeholder="Sheet gid (numeric) or sheet name" value={manualSheet} onChange={e => setManualSheet(e.target.value)} aria-label="Sheet gid or name" />
                    <button onClick={() => { /* manualSheet is bound; change will trigger fetch effect */ }} className="btn-link">Load</button>
                  </div>
                )}
              </>
            )}

             <a className="btn-link" href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer">Open original sheet</a>
           </div>
         </div>

        {sheetsError && <p className="muted">Could not load sheet list automatically: {sheetsError}. You can enter a sheet name or numeric gid above.</p>}

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
