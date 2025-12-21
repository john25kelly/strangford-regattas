import React from 'react'

export default function NORTile({ title, date, location, hwt, pdfUrl, colour }) {
  const siAvailable = !!pdfUrl

  // prepare inline style if a colour is provided
  const tileStyle = {}
  let tileTextColor = null
  if (colour) {
    // If it's a hex colour, blend it with white to tone it down (less saturated/strong)
    const hexMatch = String(colour).trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (hexMatch) {
      let hex = hexMatch[1]
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)

      // blend with white by factor (0..1) where higher = more white (lighter)
      // increase blendFactor toward 1 to make the shade paler; 0.9 yields ~50% paler from previous 0.8
      const blendFactor = 0.9
      const br = Math.round(r + (255 - r) * blendFactor)
      const bg = Math.round(g + (255 - g) * blendFactor)
      const bb = Math.round(b + (255 - b) * blendFactor)

      // set the blended background color
      const blendedHex = '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('')
      tileStyle.background = blendedHex

      // recompute luminance on the blended color for readable text color
      const luminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
      tileTextColor = luminance < 0.6 ? '#ffffff' : 'var(--muted)'
      tileStyle.border = '1px solid rgba(0,0,0,0.06)'
    } else {
      // For non-hex values (named colors, rgb(), etc.) apply a white overlay to tone them down
      // Use CSS layered background: a semi-opaque white layer over the provided color.
      // increase overlay alpha to 0.9 to make non-hex colours 50% paler than prior setting
      tileStyle.background = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), ${colour}`
      // Use muted text color as safe default since we can't compute luminance reliably
      tileTextColor = 'var(--muted)'
      tileStyle.border = '1px solid rgba(0,0,0,0.06)'
    }
  }

  // action button/link styles to ensure contrast on coloured tiles
  const actionButtonStyle = {}
  const actionLinkStyle = {}
  if (tileTextColor === '#ffffff') {
    // on dark backgrounds, use white button backgrounds with accent-colored text
    actionButtonStyle.background = '#ffffff'
    actionButtonStyle.color = 'var(--accent)'
    actionButtonStyle.border = '1px solid rgba(0,0,0,0.06)'

    actionLinkStyle.background = '#ffffff'
    actionLinkStyle.color = 'var(--accent)'
    actionLinkStyle.border = '1px solid rgba(0,0,0,0.06)'
    actionLinkStyle.padding = '8px 10px'
    actionLinkStyle.borderRadius = '6px'
    actionLinkStyle.textDecoration = 'none'
    actionLinkStyle.display = 'inline-flex'
    actionLinkStyle.alignItems = 'center'
    actionLinkStyle.gap = '8px'
  }

  return (
    <article className="nor-tile" style={tileStyle}>
      <h3 style={tileTextColor ? { color: tileTextColor } : undefined}>{title}</h3>
      {date && <p className="muted" style={tileTextColor ? { color: tileTextColor } : undefined}>{date}</p>}
      {location && <p className="muted" style={tileTextColor ? { color: tileTextColor } : undefined}>{location}</p>}
      {hwt && <p style={tileTextColor ? { color: tileTextColor } : undefined}><strong>HWT:</strong> {hwt}</p>}

      {(!hwt || !siAvailable) && (
        <p className="muted" style={Object.assign({ marginTop: 8 }, tileTextColor ? { color: tileTextColor } : undefined)}>
          <strong>Note:</strong> The SI is not yet available for this event
        </p>
      )}

      <div className="tile-actions">
        <button
          onClick={() => { if (pdfUrl) window.open(pdfUrl, '_blank') }}
          disabled={!pdfUrl}
          style={actionButtonStyle}
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
          style={actionLinkStyle}
        >
          Download
        </a>
      </div>
    </article>
  )
}
