import React from 'react'

export default function ContactTile({ name, role, phone, email, website }) {
  return (
    <article className="nor-tile contact-tile">
      <h3>{name}</h3>
      {role && role.toString().trim().toLowerCase() !== 'club' && <p className="muted">{role}</p>}
      <div className="contact-details">
        {phone && <p className="muted">Phone: <a href={`tel:${phone}`}>{phone}</a></p>}
        {email && <p className="muted">Email: <a href={`mailto:${email}`}>{email}</a></p>}
        {website && <p className="muted">Website: <a href={website} target="_blank" rel="noreferrer">{website}</a></p>}
      </div>
    </article>
  )
}
