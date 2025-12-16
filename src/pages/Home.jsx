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

        <p>
          <a href="/about" className="link">Read More</a>
        </p>

        {/* Quick Links removed as requested */}

        <p className="note">To replace or extend this text: edit <code>src/pages/Home.jsx</code> and paste the homepage text into this section.</p>
      </section>
    </div>
  )
}
