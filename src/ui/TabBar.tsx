import { NavLink } from 'react-router'

const TABS: [to: string, label: string][] = [
  ['/', 'Frigo'],
  ['/recettes', 'Recettes'],
  ['/chercher', 'Chercher'],
  ['/listes', 'Listes'],
  ['/profil', 'Profil'],
]

/** Floating glass tab bar; the active tab is a light pill. */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === '/'} className="tab">
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
