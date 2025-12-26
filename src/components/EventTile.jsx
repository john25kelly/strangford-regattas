import React from 'react'

// Small reusable EventTile component used on Home and Calendar pages.
// Props:
// - ev: event object which may contain { name, date, location, hwt, tide, pdfUrl, colour, color }
// - onClick: function to call when tile activated
// - className: additional class names
// - style: additional style overrides
// - dateLabel: optional preformatted date string to show instead of ev.date
export default function EventTile({ ev, onClick, className = '', style = {}, dateLabel }) {
  const tileStyle = {}
  let tileTextColor = null
  const rawColour = String(ev.colour || ev.color || '').trim()

  if (rawColour) {
    const hexMatch = rawColour.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (hexMatch) {
      let hex = hexMatch[1]
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
      const r = parseInt(hex.slice(0,2), 16)
      const g = parseInt(hex.slice(2,4), 16)
      const b = parseInt(hex.slice(4,6), 16)
      const blendFactor = 0.9
      const br = Math.round(r + (255 - r) * blendFactor)
      const bg = Math.round(g + (255 - g) * blendFactor)
      const bb = Math.round(b + (255 - b) * blendFactor)
      const blendedHex = '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('')
      tileStyle.background = blendedHex
      const luminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
      tileTextColor = luminance < 0.6 ? '#ffffff' : 'var(--muted)'
      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
    } else {
      tileStyle.background = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), ${rawColour}`
      tileTextColor = 'var(--muted)'
      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
    }
  } else {
    // fallback by location (simple map)
    const locationColorMap = {
      QYC: '#0b3d91',
      EDYC: '#1e6fb8',
      KYC: '#0b6b4a',
      KSC: '#b84e1e',
      NSC: '#6b3d9a',
      SSC: '#0b5a91',
      PSC: '#b88f1e',
      SLYC: '#1e6fb8'
    }
    const locationKey = (ev.location || '').toUpperCase()
    const fallbackColor = locationColorMap[locationKey] || null
    if (fallbackColor) {
      let hex = fallbackColor.replace('#', '')
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
      const r = parseInt(hex.slice(0,2), 16)
      const g = parseInt(hex.slice(2,4), 16)
      const b = parseInt(hex.slice(4,6), 16)
      const blendFactor = 0.9
      const br = Math.round(r + (255 - r) * blendFactor)
      const bg = Math.round(g + (255 - g) * blendFactor)
      const bb = Math.round(b + (255 - b) * blendFactor)
      const blendedHex = '#' + [br, bg, bb].map(v => v.toString(16).padStart(2, '0')).join('')
      tileStyle.background = blendedHex
      const luminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
      tileTextColor = luminance < 0.6 ? '#ffffff' : 'var(--muted)'
      tileStyle.border = '1px solid rgba(0,0,0,0.04)'
    } else {
      tileStyle.background = '#ffffff'
      tileStyle.border = '1px solid rgba(0,0,0,0.06)'
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`event-tile ${className}`}
      onClick={() => onClick && onClick(ev)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(ev) } }}
      style={{
        minWidth:160,
        maxWidth:220,
        padding:12,
        borderRadius:8,
        boxShadow:'0 6px 18px rgba(0,0,0,0.04)',
        cursor:'pointer',
        display:'flex',
        flexDirection:'column',
        alignItems:'flex-start',
        gap:6,
        ...tileStyle,
        ...style
      }}
    >
      <div style={tileTextColor ? { color: tileTextColor, fontWeight:700 } : { fontWeight:700 }}>{ev.name}</div>
      <div className="muted" style={tileTextColor ? { color: tileTextColor } : undefined}>{dateLabel || ev.date || ''}</div>
    </div>
  )
}
