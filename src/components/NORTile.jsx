import React from 'react'

export default function NORTile({ title, date, location, hwt, pdfUrl, colour, note, image }) {
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
      // store blended hex as backgroundColor (so we can layer an image on top)
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

  // If the caller provided an explicit image, use it as a pale background layer
  if (image) {
    try {
      const imgUrl = new URL(image, import.meta.url).href
      // If a background color was set above, keep it as backgroundColor and layer the image + pale overlay on top
      if (tileStyle.background && typeof tileStyle.background === 'string' && tileStyle.background.startsWith('#')) {
        tileStyle.backgroundColor = tileStyle.background
      }
      // Apply a gentle white overlay over the image so the image is pale and text remains readable
      tileStyle.backgroundImage = `linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url(${imgUrl})`
      tileStyle.backgroundRepeat = 'no-repeat'
      tileStyle.backgroundPosition = 'center'
      tileStyle.backgroundSize = 'contain'
      tileStyle.backgroundBlendMode = 'normal'
    } catch (err) {
      // ignore resolution errors in non-browser environments
    }
  }

  // If the event title contains "Leisure 17", layer a semi-transparent image behind the tile content
  try {
    const isLeisure17 = typeof title === 'string' && /leisure\s*17/i.test(title)
    if (isLeisure17) {
      // Resolve public asset URL (Vite-friendly)
      const leisureUrl = new URL('/Leisure_17.jpg', import.meta.url).href

      // Preserve any computed background color (hex) separately so we can layer the image on top
      const existingBg = tileStyle.background
      if (existingBg && typeof existingBg === 'string' && existingBg.startsWith('#')) {
        tileStyle.backgroundColor = existingBg
      } else if (existingBg && typeof existingBg === 'string' && existingBg.startsWith('linear-gradient')) {
        // if existing background is a gradient, clear it to avoid conflicts and instead use as backgroundImage layering
      }

      // Apply a gentle white overlay over the image so the image is pale and text remains readable
      // We set the backgroundImage to the overlay gradient plus the image. backgroundColor (if set) remains as base.
      tileStyle.backgroundImage = `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${leisureUrl})`
      tileStyle.backgroundRepeat = 'no-repeat'
      tileStyle.backgroundPosition = 'center'
      tileStyle.backgroundSize = 'contain'
      // ensure the image doesn't obscure border/spacing
      tileStyle.backgroundBlendMode = 'normal'
    }
  } catch (err) {
    // ignore any runtime issues resolving the image URL in non-browser environments
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

      {/* If a custom note is supplied, show it. Otherwise fall back to the existing availability note when no HWT or SI is available. */}
      {note ? (
        <p className="muted" style={Object.assign({ marginTop: 8 }, tileTextColor ? { color: tileTextColor } : undefined)}>
          {note}
        </p>
      ) : ((!hwt || !siAvailable) && (
        <p className="muted" style={Object.assign({ marginTop: 8 }, tileTextColor ? { color: tileTextColor } : undefined)}>
          <strong>Note:</strong> The SI is not yet available for this event
        </p>
      ))}

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
