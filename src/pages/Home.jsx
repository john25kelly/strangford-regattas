import React from 'react'

export default function Home() {
  // ensure the public asset path respects Vite's base (works in dev and production)
  const imgSrc = (import.meta && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/') + 'whatsapp-qr.jpg'

  return (
    <div className="page home">
      <h1>Welcome to Strangford Regattas</h1>
      <section className="home-content">
        <p>
          Welcome to the Strangford Lough Regatta website. Discover one of Northern
          Ireland’s most distinctive and rewarding sailing venues. This website is
          your central hub for everything related to the Strangford Lough Regattas,
          bringing together the latest news, race information, and essential
          updates for sailors of all levels.
        </p>

        <p>
          Set on the east coast of County Down, Strangford Lough is a vast and
          beautiful shallow sea lough, just 6 km from the outskirts of Belfast. Its
          unique tidal waters, stunning scenery, and challenging conditions make it
          a truly exceptional place to race.
        </p>

        <p>
          The Strangford Lough Regattas are proudly organised by the yacht clubs
          around the Lough and coordinated by the Strangford Lough Regatta
          Conference, delivering a full programme of competitive and enjoyable
          racing throughout the season. Join us on the water and be part of the
          tradition, competition, and camaraderie that define sailing on Strangford
          Lough.
        </p>

        {/* Quick Links removed as requested */}

        {/* WhatsApp QR code (put the image at public/whatsapp-qr.jpg) */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginTop:20}}>
          <img
            src={imgSrc}
            alt="WhatsApp group QR code for Strangford Lough Regatta"
            style={{maxWidth:360,width:'100%',height:'auto',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.1)'}}
          />
          <p className="muted" style={{textAlign:'center',maxWidth:600}}>
            This QR code joins the Strangford Lough Regatta WhatsApp group — scan it with your phone to join the group.
          </p>
        </div>

       </section>
    </div>
  )
}
