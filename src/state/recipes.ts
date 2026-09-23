import { useMemo } from 'react'
import { INGREDIENTS, RECIPES } from '../data/catalog'
import { isoDay } from '../domain/expiry'
import { indexIngredients, rankAll, type MatchContext } from '../domain/matching'
import type { Recipe } from '../domain/types'
import { useStore } from './store'

export const BY_ID = indexIngredients(INGREDIENTS)

export const today = () => isoDay(new Date())

/** Catalog recipes plus the ones the AI invented for this user. */
export function useAllRecipes(): Recipe[] {
  const generated = useStore((s) => s.generated)
  return useMemo(() => [...generated, ...RECIPES], [generated])
}

export function useMatchContext(): MatchContext {
  const fridge = useStore((s) => s.fridge)
  const prefs = useStore((s) => s.prefs)
  const day = today()
  return useMemo(() => ({ fridge, prefs, byId: BY_ID, today: day }), [fridge, prefs, day])
}

/** Eligible recipes, best first. */
export function useRanking() {
  const recipes = useAllRecipes()
  const ctx = useMatchContext()
  return useMemo(() => rankAll(recipes, ctx), [recipes, ctx])
}
