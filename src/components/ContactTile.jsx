import React from 'react'

export default function ContactTile({ name, role, phone, email, website, heading }) {
    // normalize phone for tel: links (preserve leading +, strip other non-digits)
    const telHref = phone ? String(phone).replace(/[^\d+]/g, '') : null
    // ensure displayed phone shows a leading '+' only when appropriate:
    // - if the phone already starts with '+' keep it
    // - if the phone starts with country code '44' (optionally with spaces) prefix '+'
    // - otherwise show the phone as provided (to avoid turning '07...' into '+07...')
    let displayPhone = null
    if (phone) {
      const s = String(phone).trim()
      if (s.startsWith('+')) {
        displayPhone = s
      } else if (/^44\b|^44\s|^44\d/.test(s)) {
        displayPhone = `+${s}`
      } else {
        displayPhone = s
      }
    }
    // sanitize role to remove any leading '-' characters the user doesn't want shown
    const roleSanitized = role ? String(role).replace(/^\s*[-–—]\s*/, '') : role
    return (
      <article className="nor-tile contact-tile">
      {/* If a heading prop is provided, use it as the main title and show the name below */}
      {heading ? (
        <>
          <h3>{heading}</h3>
          <p className="muted" style={{marginTop:4}}>{name}</p>
        </>
      ) : (
        <>
          <h3>{name}</h3>
          {roleSanitized && roleSanitized.toString().trim().toLowerCase() !== 'club' && <p className="muted">{roleSanitized}</p>}
        </>
      )}
      <div className="contact-details">
       {phone && <p className="muted">Phone: <a href={`tel:${telHref}`}>{displayPhone}</a></p>}
        {email && <p className="muted">Email: <a href={`mailto:${email}`}>{email}</a></p>}
        {website && <p className="muted">Website: <a href={website} target="_blank" rel="noreferrer">{website}</a></p>}
      </div>
    </article>
  )
 }
