import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Logo } from './Logo'

const iconButton =
  'flex size-10 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-200 active:bg-stone-800'

/** `backTo` : chemin de retour, ou `-1` pour revenir à l'écran précédent. */
export function AppHeader({ backTo }: { backTo?: string | -1 }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-stone-950/90 px-4 pt-[calc(var(--safe-top)+0.75rem)] pb-3 backdrop-blur">
      {backTo !== undefined && (
        <button type="button" aria-label="Retour" className={iconButton} onClick={() => (backTo === -1 ? navigate(-1) : navigate(backTo))}>
          <ChevronLeft className="size-5" />
        </button>
      )}
      <Logo />
      <div className="ml-auto flex gap-2">
        <Link to="/recherche" aria-label="Rechercher une recette" className={iconButton}>
          <Search className="size-4.5" />
        </Link>
        <Link to="/preferences" aria-label="Préférences" className={iconButton}>
          <SlidersHorizontal className="size-4.5" />
        </Link>
      </div>
    </header>
  )
}
