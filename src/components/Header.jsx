import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/">
          <img src="https://www.strangfordloughregattas.co.uk/favicon.ico" alt="Strangford" />
          <span>Strangford Regattas</span>
        </a>
        <nav>
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
          <NavLink to="/nor" className={({isActive}) => isActive ? 'active' : ''}>NOR and SIs</NavLink>
          <NavLink to="/results" className={({isActive}) => isActive ? 'active' : ''}>Results</NavLink>
          <NavLink to="/competitors" className={({isActive}) => isActive ? 'active' : ''}>Competitors</NavLink>
        </nav>
      </div>
    </header>
  )
}

