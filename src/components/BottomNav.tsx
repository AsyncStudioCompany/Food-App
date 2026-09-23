import { NavLink } from 'react-router'

const TABS = [
  { to: '/', label: 'Cuisiner', icon: '🍳' },
  { to: '/recettes', label: 'Recettes', icon: '📖' },
  { to: '/frigo', label: 'Mon frigo', icon: '🧊' },
  { to: '/profil', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive ? 'text-green-700' : 'text-stone-500'
                }`
              }
            >
              <span aria-hidden="true" className="text-xl">
                {tab.icon}
              </span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
