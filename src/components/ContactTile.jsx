import React from 'react'

export default function ContactTile({ name, role, phone, email, website }) {
   // normalize phone for tel: links (preserve leading +, strip other non-digits)
   const telHref = phone ? String(phone).replace(/[^\d+]/g, '') : null
   // ensure displayed phone shows a leading '+' for international format
   const displayPhone = phone ? String(phone).replace(/^\+?/, '+') : null
   // sanitize role to remove any leading '-' characters the user doesn't want shown
   const roleSanitized = role ? String(role).replace(/^\s*[-–—]\s*/, '') : role
   return (
     <article className="nor-tile contact-tile">
       <h3>{name}</h3>
      {roleSanitized && roleSanitized.toString().trim().toLowerCase() !== 'club' && <p className="muted">{roleSanitized}</p>}
       <div className="contact-details">
        {phone && <p className="muted">Phone: <a href={`tel:${telHref}`}>{displayPhone}</a></p>}
         {email && <p className="muted">Email: <a href={`mailto:${email}`}>{email}</a></p>}
         {website && <p className="muted">Website: <a href={website} target="_blank" rel="noreferrer">{website}</a></p>}
       </div>
     </article>
   )
 }
