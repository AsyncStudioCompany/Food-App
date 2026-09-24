import { searchRecipes, type SearchFilters } from '../domain/search'
import { COURSES, CUISINES } from '../domain/types'
import { useRanking } from '../state/recipes'
import { setState, useStore } from '../state/store'
import { COURSE_LABEL, plural } from '../ui/labels'
import { RecipeRow } from '../ui/RecipeCards'
import { useDragScroll } from '../ui/useDragScroll'

export function SearchScreen() {
  const ranked = useRanking()
  const query = useStore((s) => s.searchQuery)
  const f = useStore((s) => s.searchFilters)
  const rowRef = useDragScroll<HTMLDivElement>()
  const results = searchRecipes(ranked, query, f)
  const set = (patch: Partial<SearchFilters>) => setState((s) => ({ searchFilters: { ...s.searchFilters, ...patch } }))

  const filters: [label: string, on: boolean, tap: () => void][] = [
    ['Faisable maintenant', f.now, () => set({ now: !f.now })],
    ['20 min max', f.quick, () => set({ quick: !f.quick })],
    ...COURSES.map((c): [string, boolean, () => void] => [COURSE_LABEL[c], f.course === c, () => set({ course: f.course === c ? null : c })]),
    ...CUISINES.map((c): [string, boolean, () => void] => [c, f.cuisine === c, () => set({ cuisine: f.cuisine === c ? null : c })]),
  ]

  return (
    <div className="screen">
      <h1 className="title" style={{ marginBottom: 16 }}>
        Chercher
      </h1>
      <input
        className="input"
        style={{ marginBottom: 12 }}
        value={query}
        onChange={(e) => setState({ searchQuery: e.target.value })}
        placeholder="Une recette, un ingrédient…"
        aria-label="Chercher une recette ou un ingrédient"
      />
      <div ref={rowRef} className="hx" style={{ gap: 8, margin: '0 -20px 16px', padding: '0 20px' }}>
        {filters.map(([label, on, tap]) => (
          <button key={label} type="button" className="chip chip--filter" aria-pressed={on} onClick={tap}>
            {label}
          </button>
        ))}
      </div>
      <div className="muted" style={{ font: '600 13px var(--font)', marginBottom: 10 }}>
        {results.length ? `${plural(results.length, 'recette')} pour toi` : 'Rien trouvé. Essaie un autre ingrédient.'}
      </div>
      <div className="rows">
        {results.map((e) => (
          <RecipeRow key={e.recipe.id} e={e} line="status" />
        ))}
      </div>
    </div>
  )
}
