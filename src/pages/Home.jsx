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

        <h2>Quick Links</h2>
        <ul className="list">
          <li><strong><a href="https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/edit?pli=1#gid=1460438101" target="_blank" rel="noreferrer">Yacht Ratings</a></strong> — Yacht Ratings Handicaps.</li>
          <li><strong><a href="https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/edit?pli=1#gid=1460438101" target="_blank" rel="noreferrer">One Design Fleet</a></strong> — Rivers, Glens, Flying Fifteens.</li>
          <li><strong><a href="https://docs.google.com/spreadsheets/d/1e_laZm7dNU6CTKQS69__nv4Rckhp-NZYbuhKFdZCSMA/edit?pli=1#gid=1460438101" target="_blank" rel="noreferrer">Dinghy Fleet</a></strong> — Lasers, Toppers, Mirrors.</li>
          <li><strong><a href="/nor">Notice Of Race / SI's</a></strong> — Available to download.</li>
          <li><strong><a href="/results">Results</a></strong> — Regatta results in Strangford Lough.</li>
        </ul>

        <p className="note">To replace or extend this text: edit <code>src/pages/Home.jsx</code> and paste the homepage text into this section.</p>
      </section>
    </div>
  )
}
