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

  const key = event.location || event.name || ''
  const url = siMap[key] || siMap[(key || '').toUpperCase()] || event.pdfUrl || null

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
        </div>
        <div className="modal-actions">
          {url ? (
            <>
              <a href={url} target="_blank" rel="noreferrer" className="btn-link" style={{marginRight:8}}>View SI</a>
              <a href={url} download className="btn-link">Download SI</a>
            </>
          ) : (
            <>
              <button className="btn-link disabled" disabled style={{marginRight:8}}>View SI</button>
              <button className="btn-link disabled" disabled>Download SI</button>
            </>
          )}

          <button className="btn-link" onClick={() => onClose()} style={{marginLeft:12}}>Close</button>
        </div>
      </div>
    </div>
  )
}

