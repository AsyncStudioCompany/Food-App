import { Refrigerator, Search, SlidersHorizontal } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'

const TABS = [
  { to: '/', label: 'Mon frigo', Icon: Refrigerator, matches: ['/', '/resultats'] },
  { to: '/recherche', label: 'Recherche', Icon: Search, matches: ['/recherche'] },
  { to: '/preferences', label: 'Préférences', Icon: SlidersHorizontal, matches: ['/preferences'] },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent px-4 pt-6 pb-[calc(var(--safe-bottom)+0.75rem)]"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-full border border-stone-800 bg-stone-900/90 p-1.5 shadow-2xl backdrop-blur">
        {TABS.map(({ to, label, Icon, matches }) => {
          const active = matches.includes(pathname)
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? 'bg-stone-50 text-stone-950' : 'text-stone-400'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
