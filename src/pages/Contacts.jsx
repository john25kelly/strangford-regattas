import React from 'react'
import ContactTile from '../components/ContactTile'

// Updated contact list provided by the user. Website values are normalized to include https:// when missing.
const normalizeWebsite = (w) => {
  if (!w) return null
  const s = String(w).trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

const contacts = [
  // Top-priority contact per user request
  { id: 1, name: 'Ian Bogie', role: 'Secretary', phone: '+44 7968 858164', email: 'ian.bogie@btinternet.com', website: null },
  { id: 2, name: 'East Down Yacht Club', role: 'Club Rep: James Curran', phone: '+44 7887 707913', email: 'info@edyc.co.uk', website: normalizeWebsite('edyc.co.uk') },
  { id: 3, name: 'Killyleagh Yacht Club', role: 'Club Rep: Mike Spence', phone: '+44 7771 621582', email: 'michaelspence147@gmail.com', website: normalizeWebsite('killyleaghyachtclub.co.uk') },
  { id: 4, name: 'Kircubbin Sailing Club', role: 'Club Rep: Pete McDowell', phone: '+44 7877 081462', email: 'pete_mcd@aol.co.uk', website: normalizeWebsite('kircubbinsailing.club') },
  { id: 5, name: 'Newtownards Sailing Club', role: 'Club Rep: Jennifer Bryce', phone: '+44 7904 014141', email: 'jenniferbryce@gmail.com', website: normalizeWebsite('newtownardssailingclub.co.uk') },
  { id: 6, name: 'Portaferry Sailing Club', role: 'Club Rep: John McAlea', phone: '+44 7877 160234', email: 'jmcalea58@gmail.com', website: normalizeWebsite('portaferrysailingclub.org') },
  { id: 7, name: 'Quoile Yacht Club', role: 'Club Rep: Harry Crosby', phone: '+44 7734 866675', email: 'harryrcrosby@gmail.com', website: normalizeWebsite('quoileyachtclub.com') },
  { id: 8, name: 'Strangford Lough Yacht Club', role: 'Club Rep: Stuart Cranston', phone: '+44 7533 319877', email: 'scranston@btinternet.com', website: normalizeWebsite('slyc.co.uk') },
  { id: 9, name: 'Strangford Sailing Club', role: 'Club Rep: Colin Conway', phone: '+44 7815 812501', email: 'crconway@hotmail.com', website: normalizeWebsite('strangfordsailingclub.com') }
]

export default function Contacts() {
  return (
    <div className="page contacts">
      <h1>Contacts</h1>
      <section className="nor-grid">
        {contacts.map(c => (
          <ContactTile key={c.id} name={c.name} role={c.role} phone={c.phone} email={c.email} website={c.website} />
        ))}
      </section>

    </div>
  )
}
