import React from 'react'

export default function Home() {
  return (
    <div className="page home">
      <h1>Welcome to Strangford Regattas</h1>
      <section className="home-content">
        <h3>Welcome to the Strangford Lough Regatta's web-site.</h3>
        <h4>
          Welcome to the web-site, dedicated to providing sailors who compete in the
          Strangford Lough Regattas with the most up-to-date news and information
          required for Racing.
        </h4>

        <p>
          Strangford Lough is a large shallow sea lough situated on the East Coast of
          County Down, Northern Ireland. The Lough's northern tip is only about 6km
          from the outskirts of Belfast. Strangford Lough Regattas are run by the
          Yacht Clubs situated around Strangford Lough, and managed by the Strangford
          Lough Regatta Conference.
        </p>

        {/* Quick Links removed as requested */}

        {/* WhatsApp QR code (put the image at public/whatsapp-qr.jpg) */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginTop:20}}>
          <img
            src="/whatsapp-qr.jpg"
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
