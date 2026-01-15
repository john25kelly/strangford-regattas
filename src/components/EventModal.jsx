import React, { useEffect, useRef } from 'react'

// Simple accessible modal that shows event details and SI links.
// Props:
// - event: { name, date, location, hwt, tide, pdfUrl }
// - onClose: function to call to close the modal
export default function EventModal({ event, onClose }) {
  const modalCloseRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!event) {
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
  }, [event, onClose])

  if (!event) return null

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

  // Prefer explicit pdfUrl from the spreadsheet. If it's missing or empty, treat SIs as not available.
  const pdf = event.pdfUrl && String(event.pdfUrl).trim() ? String(event.pdfUrl).trim() : null
  // Validate URL: accept absolute (http/https) or relative URLs. If invalid, treat as unavailable.
  let url = null
  if (pdf) {
    try {
      // new URL(pdf, base) will parse relative URLs too
      const parsed = new URL(pdf, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      // only allow http(s) protocols
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') url = parsed.href
    } catch (err) {
      url = null
    }
  }

  // Debugging helper: log the computed pdf/url when modal opens so we can diagnose unexpected enabled links.
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('EventModal open:', { name: event.name, pdf: event.pdfUrl, computedUrl: url })
    } catch (err) {}
  }, [event, url])

  function openUrl(u) {
    if (!u) return
    try { window.open(u, '_blank', 'noopener') } catch (err) { /* ignore */ }
  }

  function downloadUrl(u) {
    if (!u) return
    try {
      const a = document.createElement('a')
      a.href = u
      a.download = ''
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) { /* ignore */ }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={() => onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-title" style={{margin:0}}>{event.name}</h3>
          <button ref={modalCloseRef} className="modal-close" aria-label="Close" onClick={() => onClose()}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>Date:</strong> {formatDateWithOrdinal(event.date)}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>{event.tide ? event.tide : 'HWT'}:</strong> {event.hwt}</p>
          {!url && (
            <p className="muted"><strong>Note:</strong> The SIs are not yet available for the {event.name}.</p>
          )}
        </div>
        <div className="modal-actions">
          <>
            <button
              type="button"
              className={`btn-link ${!url ? 'disabled' : ''}`}
              onClick={() => openUrl(url)}
              disabled={!url}
              style={{marginRight:8}}
            >
              View SI
            </button>
            <button
              type="button"
              className={`btn-link ${!url ? 'disabled' : ''}`}
              onClick={() => downloadUrl(url)}
              disabled={!url}
            >
              Download SI
            </button>
          </>

          <button className="btn-link" onClick={() => onClose()} style={{marginLeft:12}}>Close</button>
        </div>
      </div>
    </div>
  )
}
