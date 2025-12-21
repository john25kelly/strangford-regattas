import React from 'react'

export default function NORTile({ title, date, location, hwt, pdfUrl }) {
  const siAvailable = !!pdfUrl

  return (
    <article className="nor-tile">
      <h3>{title}</h3>
      {date && <p className="muted">{date}</p>}
      {location && <p className="muted">{location}</p>}
      {hwt && <p><strong>HWT:</strong> {hwt}</p>}

      {(!hwt || !siAvailable) && (
        <p className="muted" style={{ marginTop: 8 }}>
          <strong>Note:</strong> The SI is not yet available for this event
        </p>
      )}

      <div className="tile-actions">
        <button
          onClick={() => { if (pdfUrl) window.open(pdfUrl, '_blank') }}
          disabled={!pdfUrl}
        >
          View
        </button>
        <a
          className={pdfUrl ? 'btn-link' : 'btn-link disabled'}
          href={pdfUrl || '#'}
          target="_blank"
          rel="noreferrer"
          download
          aria-disabled={!pdfUrl}
        >
          Download
        </a>
      </div>
    </article>
  )
}
