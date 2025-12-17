import React from 'react'
import NORTile from '../components/NORTile'

const programs = [
  {
    id: 1,
    title: 'Newtownards SC',
    date: '14th June',
    location: 'Newtownards',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/NSC2025.pdf'
  },
  {
    id: 2,
    title: 'Quoile YC',
    date: '21st June',
    location: 'Quoile',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/QYC2025.pdf'
  },
  {
    id: 3,
    title: 'Kircubbin SC',
    date: '28th June',
    location: 'Kircubbin',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/KSC2025.pdf'
  },
  {
    id: 4,
    title: 'Bar Buoy',
    date: '10th July',
    location: 'Bar Buoy',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/BarBuoy2025.pdf'
  },
  {
    id: 5,
    title: 'Strangford SC',
    date: '11th July',
    location: 'Strangford',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/SSC2025.pdf'
  },
  {
    id: 6,
    title: 'Portaferry Town',
    date: '12th July',
    location: 'Portaferry',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/PTR2025.pdf'
  },
  {
    id: 7,
    title: 'Portaferry SC',
    date: '13th July',
    location: 'Portaferry',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/PSC2025.pdf'
  },
  {
    id: 8,
    title: 'Killyleagh YC',
    date: '26th July',
    location: 'Killyleagh',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/KYC2025.pdf'
  },
  {
    id: 9,
    title: 'East Down YC',
    date: '2nd August',
    location: 'East Down',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/EDYC2025v2.pdf'
  },
  {
    id: 10,
    title: 'Strangford Lough YC',
    date: '9th August',
    location: 'Strangford Lough YC',
    pdfUrl: 'https://www.strangfordloughregattas.co.uk/documents/slycv52025.pdf'
  }
]

export default function NOR() {
  return (
    <div className="page nor">
      <h1>NOR and Sailing Instructions</h1>
      <p className="muted">Regatta Programs 2025 — click View to open or Download to save the PDF.</p>

      <section className="nor-grid">
        {programs.map(p => (
          <NORTile key={p.id} title={`${p.title} - ${p.date}`} date={p.date} location={p.location} pdfUrl={p.pdfUrl} />
        ))}
      </section>

    </div>
  )
}
