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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // Sheet options mapped to the specific gids you provided
  const sheetOptions = [
    { label: 'Impala', gid: '437404464' },
    { label: 'IRC', gid: '1322535714' },
    { label: 'Flying 15', gid: '1846775727' },
    { label: 'YTC1', gid: '1573447540' },
    { label: 'YTC2', gid: '1552739936' },
    { label: 'YTC RS1', gid: '648508331' },
    { label: 'YTC RS2', gid: '312713610' },
    { label: 'SONATA', gid: '628627199' },
    { label: 'Leisure 17', gid: '1839015274' },
    { label: 'Glen', gid: '1847637110' },
    { label: 'River', gid: '149257250' },
    { label: 'Squib', gid: '1609112658' },
    { label: 'Dinghy HCAP 1135 and under', gid: '1372506781' },
    { label: 'Wayfarer', gid: '2078214300' },
    { label: 'Topper', gid: '563295138' },
    { label: 'Waverley', gid: '1305022950' },
    { label: 'Dinghy HCAP 1136 and over', gid: '117611637' },
    { label: 'Mirror', gid: '1009796840' },
    { label: 'Visitors', gid: '460745798' }
  ]

  // selectedLabel and selectedSheet (gid) — initialize to stored label if present
  const getInitialLabel = () => {
    try {
      const stored = localStorage.getItem('competitorsSelectedLabel')
      if (stored && sheetOptions.some(s => s.label === stored)) return stored
    } catch (e) {}
    return sheetOptions[0].label
  }

  const [selectedLabel, setSelectedLabel] = useState(getInitialLabel)
  const [selectedSheet, setSelectedSheet] = useState(() => {
    const found = sheetOptions.find(s => s.label === getInitialLabel())
    return found ? found.gid : sheetOptions[0].gid
  })

  // Keep selectedSheet in sync when the label changes
  useEffect(() => {
    const found = sheetOptions.find(s => s.label === selectedLabel)
    setSelectedSheet(found ? found.gid : DEFAULT_GID)
  }, [selectedLabel])

  // Persist last selected label so the page re-opens the same tab on return
  useEffect(() => {
    try { localStorage.setItem('competitorsSelectedLabel', selectedLabel) } catch (e) {}
  }, [selectedLabel])

  // Header display aliases: map raw header keys (lowercased) to friendly labels
  const columnAliases = {
    'sailno': 'Sail No',
    'sail no': 'Sail No',
    'sail': 'Sail No',
    'boatname': 'Boat Name',
    'boat name': 'Boat Name',
    'name': 'Boat Name',
    'type': 'Type',
    'class': 'Class',
    'helm': 'Helm',
    'crew': 'Crew',
    'club': 'Club',
    'hcap': 'Handicap',
    'handicap': 'Handicap',
    'owner': 'Owner'
  }

  const [headerDisplay, setHeaderDisplay] = useState({})
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchCsv() {
      setLoading(true)
      setError(null)
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${selectedSheet}`
        // diagnostic log for easier debugging when running locally
        console.debug('Competitors: fetching sheet', { csvUrl, selectedSheet })
        const res = await fetch(csvUrl)
        if (!res.ok) {
          const msg = `Network error: ${res.status} fetching ${csvUrl}`
          console.error('Competitors fetch failed', { status: res.status, url: csvUrl })
          throw new Error(msg)
        }
        const text = await res.text()

        // Parse without header so we can inspect row 2 (index 1)
        const parsed = Papa.parse(text, { header: false, skipEmptyLines: false })
        if (parsed.errors && parsed.errors.length) {
          console.warn('PapaParse errors', parsed.errors)
        }

        const rawRows = parsed.data || []
        const cellText = val => (val === null || val === undefined) ? '' : String(val).trim()

        let finalHeaders = []
        let finalRows = []

        // Simple behavior: use row 2 (index 1) as header when it exists and has at least one non-empty cell
        if (rawRows.length > 1) {
          const candidate = Array.isArray(rawRows[1]) ? rawRows[1] : Object.values(rawRows[1])
          const hasData = candidate && candidate.some(c => cellText(c) !== '')
          if (hasData) {
            const headerRow = candidate
            finalHeaders = headerRow.map((c, idx) => {
              let t = cellText(c)
              if (!t) return `Column ${idx + 1}`
              t = t.replace(/^unnamed:?\s*/i, '')
              t = t.replace(/[_\-]\d+$/g, '')
              t = t.replace(/^[_\-\s]+/, '')
              t = t.replace(/\s+/g, ' ').trim()
              if (!t || /^\d+$/.test(t)) return `Column ${idx + 1}`
              return t
            })

            for (let i = 2; i < rawRows.length; i++) {
              const row = Array.isArray(rawRows[i]) ? rawRows[i] : Object.values(rawRows[i])
              if (!row || !row.some(c => cellText(c) !== '')) continue
              const obj = {}
              for (let j = 0; j < finalHeaders.length; j++) {
                obj[finalHeaders[j]] = cellText(row[j])
              }
              finalRows.push(obj)
            }

            // set debug info for diagnostics
            if (!cancelled) setDebugInfo({ headerSource: 'row2', headerRowRaw: headerRow, finalHeaders })
          }
        }

        // Fallback: let Papa parse with header:true (in case row2 isn't usable)
        if (finalHeaders.length === 0) {
          const fallback = Papa.parse(text, { header: true, skipEmptyLines: true })
          finalHeaders = fallback.meta?.fields || []
          finalRows = fallback.data || []
          if (!cancelled) setDebugInfo({ headerSource: 'fallback', finalHeaders })
        }

        if (!cancelled) {
          setHeaders(finalHeaders)
          const displayMap = {}
          for (const h of finalHeaders) {
            const key = (h || '').toString().trim()
            const lookup = key.toLowerCase()
            displayMap[key] = columnAliases[lookup] || key.replace(/\s+/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
          }
          setHeaderDisplay(displayMap)

          setRows(finalRows)
          setPage(1)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCsv()
    return () => { cancelled = true }
  }, [selectedSheet])

  // reset page when query, rows, pageSize change
  useEffect(() => setPage(1), [query, rows.length, pageSize])

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

  const sorted = useMemo(() => {
    if (!sortBy) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = ((a[sortBy] || '') + '').toString().trim()
      const vb = ((b[sortBy] || '') + '') .toString().trim()
      const na = parseFloat(va.replace(/[^0-9.\-]/g, ''))
      const nb = parseFloat(vb.replace(/[^0-9.\-]/g, ''))
      const aIsNum = !isNaN(na) && va !== ''
      const bIsNum = !isNaN(nb) && vb !== ''
      if (aIsNum && bIsNum) return (na - nb) * dir
      return va.localeCompare(vb) * dir
    })
  }, [filtered, sortBy, sortDir])

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

            <label style={{fontSize:'0.9rem',color:'var(--muted)'}}>Class:</label>
            <select
              aria-label="Select Class"
              value={selectedLabel}
              onChange={e => setSelectedLabel(e.target.value)}
            >
              {sheetOptions.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>

            <a
              className="btn-link"
              style={{marginLeft:8}}
              href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${selectedSheet}`}
              target="_blank"
              rel="noreferrer"
            >Open selected tab</a>
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
                        <span>{headerDisplay[h]}</span>
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

        <div className="info-panel" role="note" aria-live="polite">
          <p className="muted" style={{margin:0}}>
            It is extremely important that your boat is on the lists below if you wish to race in the Strangford Lough Regattas during the year. All information must be up-to-date or you risk not getting a place in the race. If a boat is not on the list the owner (inside lough boats) should contact his/her Club Sailing Sec who will give them a handicap etc. The Club Sailing Sec will contact the SLRC Boat List Coordinator with the alteration and the web shall be updated. If a boat from outside the lough wants to race then the owner should contact the Sailing Sec of the club who is organising the event with boat details and handicap. Proof may be required.
          </p>
        </div>
      </section>

      {/* Debug info panel (temporary) */}
      {showDebug && debugInfo && (
        <div className="debug-panel">
          <h2>Debug Info</h2>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <button onClick={() => setShowDebug(false)}>Close</button>
        </div>
      )}
    </div>
  )
}
