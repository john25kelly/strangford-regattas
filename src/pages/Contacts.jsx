import React from 'react'
import ContactTile from '../components/ContactTile'

// Contacts extracted from the 'Our Contacts' section of the original site (converted to structured data).
const contacts = [
  { id: 1, name: 'Down Cruising Club', role: 'Club', phone: '02897 541663', email: null, website: 'http://www.downcruisingclub.co.uk/' },
  { id: 2, name: 'East Down Yacht Club', role: 'Club', phone: '02844 826375', email: null, website: 'http://www.edyc.co.uk/' },
  { id: 3, name: 'Killyleagh Yacht Club', role: 'Club', phone: '', email: null, website: 'http://www.killyleaghyachtclub.co.uk/' },
  { id: 4, name: 'Kircubbin Sailing Club', role: 'Club', phone: '02842 738422', email: null, website: 'http://kircubbinsailing.club' },
  { id: 5, name: 'Portaferry Sailing Club', role: 'Club', phone: '02842 728770', email: null, website: 'http://www.portaferrysailingclub.com/' },
  { id: 6, name: 'Quoile Yacht Club', role: 'Club', phone: '', email: null, website: 'http://www.quoileyc.com/' },
  { id: 7, name: 'Strangford Lough Yacht Club', role: 'Club', phone: '02897 541883', email: null, website: 'http://www.slyc.co.uk' },
  { id: 8, name: 'Strangford Sailing Club', role: 'Club', phone: '02844 881404', email: null, website: 'https://www.strangfordsailingclub.com' },
  { id: 9, name: 'Newtownards Sailing Club', role: 'Club', phone: '07527 391464', email: null, website: 'https://www.newtownardssailingclub.co.uk' },
  { id: 10, name: 'Ringhaddy Cruising Club', role: 'Club', phone: '02897 541044', email: null, website: null }
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
