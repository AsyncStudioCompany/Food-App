import { useMemo } from 'react'
import { useAllRecipes } from './recipes'
import { useStore } from './store'

export interface ListView {
  id: string
  name: string
  recipeIds: string[]
  /** Built from the likes, not editable. */
  auto?: 'fav' | 'generated'
}

export const FAV_LIST = 'fav'
export const GENERATED_LIST = 'ia'

/** "Coups de cœur" (liked recipes), then the user's lists, then "Inventées pour toi" once the AI made one. */
export function useLists(): ListView[] {
  const recipes = useAllRecipes()
  const liked = useStore((s) => s.liked)
  const lists = useStore((s) => s.lists)
  const generated = useStore((s) => s.generated)
  return useMemo(() => {
    const favIds = recipes.filter((r) => liked[r.id]).map((r) => r.id)
    const all: ListView[] = [{ id: FAV_LIST, name: 'Coups de cœur', recipeIds: favIds, auto: 'fav' }, ...lists]
    if (generated.length) all.push({ id: GENERATED_LIST, name: 'Inventées pour toi', recipeIds: generated.map((r) => r.id), auto: 'generated' })
    return all
  }, [recipes, liked, lists, generated])
}
