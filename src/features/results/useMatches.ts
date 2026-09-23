import { useMemo } from 'react'
import { useFridge } from '../../data/fridgeStore'
import { usePreferences } from '../../data/preferencesStore'
import { ingredientIndex, recipes } from '../../data/seed'
import { matchRecipes, type RecipeMatch } from '../../domain/matching'

export function useMatches(): RecipeMatch[] {
  const fridge = useFridge()
  const preferences = usePreferences()
  return useMemo(() => matchRecipes(recipes, fridge, ingredientIndex, preferences), [fridge, preferences])
}

/** Recettes à proposer : faisables d'abord, puis celles où il manque 1 ou 2 ingrédients. */
export function suggestable(matches: RecipeMatch[]): RecipeMatch[] {
  return [
    ...matches.filter((match) => match.group === 'ready'),
    ...matches.filter((match) => match.group === 'almost'),
  ]
}
