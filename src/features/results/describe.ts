import { ingredientIndex } from '../../data/seed'
import type { RecipeMatch } from '../../domain/matching'
import { formatQuantity } from '../../domain/units'

function lowerName(ingredientId: string): string {
  const name = ingredientIndex.get(ingredientId)?.name ?? ingredientId
  return name.charAt(0).toLocaleLowerCase('fr') + name.slice(1)
}

/** « champignons, œuf (2 / 3) » ; chaîne vide si rien ne manque. */
export function describeMissing(match: RecipeMatch): string {
  const missing = match.missing.map((check) => lowerName(check.line.ingredientId))
  const insufficient = match.insufficient.map((check) => {
    const unit = check.line.unit
    const detail =
      unit && check.needed !== undefined
        ? ` (${formatQuantity(Math.round((check.available ?? 0) * 100) / 100, unit)} / ${formatQuantity(check.needed, unit)})`
        : ''
    return `${lowerName(check.line.ingredientId)}${detail}`
  })
  return [...missing, ...insufficient].join(', ')
}
