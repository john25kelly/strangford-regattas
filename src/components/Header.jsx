import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export default function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const toggleRef = useRef(null)
  const navRef = useRef(null)
  const previouslyFocused = useRef(null)

  // determine whether we should use the "mobile" (hamburger) UI
  const [isMobile, setIsMobile] = useState(() => {
    try {
      const touch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:coarse)').matches
      const small = typeof window !== 'undefined' && window.innerWidth <= 720
      const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : ''
      const uaMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua)
      return !!(touch || small || uaMobile)
    } catch (err) {
      return false
    }
  })

  const close = () => setOpen(false)

  // Close menu on route change
  useEffect(() => {
    close()
  }, [location.pathname])

  // detect device capability (update on resize/orientation change)
  useEffect(() => {
    function detectMobile() {
      const touch = window.matchMedia && window.matchMedia('(pointer:coarse)').matches
      const small = window.innerWidth <= 720
      const ua = navigator.userAgent || ''
      const uaMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua)
      setIsMobile(!!(touch || small || uaMobile))
    }
    detectMobile()
    window.addEventListener('resize', detectMobile)
    window.addEventListener('orientationchange', detectMobile)
    return () => {
      window.removeEventListener('resize', detectMobile)
      window.removeEventListener('orientationchange', detectMobile)
    }
  }, [])

  // Close menu when viewport expands beyond mobile breakpoint *for non-touch* devices
  useEffect(() => {
    function onResize() {
      // if we're not considered mobile and the viewport is wide, ensure menu is closed
      if (!isMobile && window.innerWidth > 720 && open) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, isMobile])

  // Outside click handler + focus management + body scroll lock
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return
      const nav = navRef.current
      const toggle = toggleRef.current
      if (!nav) return
      if (nav.contains(e.target) || toggle === e.target || toggle.contains(e.target)) {
        return
      }
      setOpen(false)
    }

    function trapFocus(e) {
      if (!open) return
      if (e.key !== 'Tab') return
      const nav = navRef.current
      if (!nav) return
      const focusable = nav.querySelectorAll('a, button')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    if (open) {
      // save focused element to restore later
      previouslyFocused.current = document.activeElement
      // lock body scroll
      document.body.style.overflow = 'hidden'
      // focus first nav link
      setTimeout(() => {
        const nav = navRef.current
        if (nav) {
          const firstLink = nav.querySelector('a')
          if (firstLink) firstLink.focus()
        }
      }, 0)
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', trapFocus)
    } else {
      // restore body scroll
      document.body.style.overflow = ''
      // restore focus
      try {
        if (previouslyFocused.current && previouslyFocused.current.focus) previouslyFocused.current.focus()
      } catch (err) {
        // ignore
      }
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', trapFocus)
    }

    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={`site-header ${open ? 'mobile-open' : ''}`}>
      <div className="header-inner">
        <div className="brand">
          <img src="https://www.strangfordloughregattas.co.uk/favicon.ico" alt="Strangford" aria-hidden="true" />
          {/* make the brand title non-interactive */}
          <span className="brand-link" aria-hidden="true">Strangford Lough Regattas</span>
        </div>

        {/* mobile menu toggle (visible on small screens) */}
        <button
          ref={toggleRef}
          className="menu-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen(o => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="site-navigation"
          role="navigation"
          aria-label="Main Navigation"
          onClick={close}
          ref={navRef}
          aria-hidden={!open && isMobile}
        >
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
          <NavLink to="/nor" className={({isActive}) => isActive ? 'active' : ''}>NOR and SIs</NavLink>
          <NavLink to="/results" className={({isActive}) => isActive ? 'active' : ''}>Results</NavLink>
          <NavLink to="/calendar" className={({isActive}) => isActive ? 'active' : ''}>Calendar</NavLink>
          <NavLink to="/contacts" className={({isActive}) => isActive ? 'active' : ''}>Contacts</NavLink>
          <NavLink to="/competitors" className={({isActive}) => isActive ? 'active' : ''}>Competitors</NavLink>
        </nav>
      </div>
    </header>
  )
}
