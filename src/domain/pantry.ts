/**
 * Links the free-text pantry lines of recipes ("graines de cumin", "huile d'olive"…) to the
 * "Épices & condiments" of the catalog, so the recipe page can say which ones you lack.
 * Pantry items never count as missing ingredients: this is only a reminder.
 */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Catalog spice id → words that name it in a pantry line (without accents). Order matters: first match wins. */
const SPICES: [id: string, pattern: RegExp][] = [
  ['huile_olive', /huile d'olive/],
  ['huile', /\bhuile\b(?! de sesame)/],
  ['sel', /^(gros )?sel\b|\bsel (fin|de mer)\b|fleur de sel/],
  ['poivre', /\bpoivre\b(?! du sichuan)/],
  ['vinaigre', /vinaigre/],
  ['sauce_soja', /sauce soja/],
  ['moutarde', /moutarde/],
  ['miel', /\bmiel\b/],
  ['sucre', /\bsucre\b(?! glace)|cassonade/],
  ['cumin', /cumin/],
  ['paprika', /paprika/],
  ['curry', /\bcurry\b(?! vert| rouge)|garam masala/],
  ['cannelle', /cannelle/],
  ['herbes_provence', /herbes de provence/],
  ['piment', /\bpiment\b|cayenne/],
  ['levure', /levure chimique/],
  ['bouillon', /bouillon|cube de/],
  ['concentre_tomate', /concentre de tomate/],
]

/** The catalog spice a pantry line names, if any. */
export function pantrySpice(line: string): string | null {
  const t = norm(line)
  return SPICES.find(([, re]) => re.test(t))?.[0] ?? null
}

/** Spices a recipe needs from the pantry, as catalog ids, without duplicates. */
export function pantrySpices(lines: string[]): string[] {
  return [...new Set(lines.map(pantrySpice).filter((id): id is string => id != null))]
}
