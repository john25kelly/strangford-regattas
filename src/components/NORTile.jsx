import React from 'react'

export default function NORTile({ title, date, location, pdfUrl }) {
  return (
    <article className="nor-tile">
      <h3>{title}</h3>
      {date && <p className="muted">{date}</p>}
      {location && <p className="muted">{location}</p>}
      <div className="tile-actions">
        <button
          onClick={() => {
            if (pdfUrl) window.open(pdfUrl, '_blank')
          }}
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

