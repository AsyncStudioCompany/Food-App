export type StepKind =
  | 'oven'
  | 'chill'
  | 'fry'
  | 'grill'
  | 'blend'
  | 'whisk'
  | 'dough'
  | 'cut'
  | 'drain'
  | 'rest'
  | 'pot'
  | 'pan'
  | 'season'
  | 'plate'
  | 'mix'

/** Picks the step illustration from the step text. Order matters: the first match wins. */
export function stepKind(text: string): StepKind {
  const s = text.toLowerCase()
  if (/\bfour\b|préchauff|enfourne/.test(s)) return 'oven'
  if (/au frais|frigo|réfrigér|congél/.test(s)) return 'chill'
  if (/\bfri(re|s|t|ts|te|tes)\b|friture|huile chaude|air fryer/.test(s)) return 'fry'
  if (/\bgrill|barbecue|plancha/.test(s)) return 'grill'
  if (/\bmixe|mixeur|blender|robot/.test(s)) return 'blend'
  if (/repos/.test(s)) return 'rest'
  if (/fouet|\bbats\b|monte les blancs|en neige|mousser/.test(s)) return 'whisk'
  if (/pétri|étale|abaisse|\bsable\b|rouleau|\bfonce\b/.test(s)) return 'dough'
  if (/émince|coupe|hache|râpe|quartiers|dés\b|cisèle|épluche/.test(s)) return 'cut'
  if (/égoutte|passoire|essore|rince/.test(s)) return 'drain'
  if (/eau|pâtes|riz|mijote|bain-marie|lance/.test(s)) return 'pot'
  if (/poêle|revenir|dor|saisi|compot|saute|sue|blondir|feu|cuis/.test(s)) return 'pan'
  if (/assaisonne|\bsale\b|parsème|saupoudre/.test(s)) return 'season'
  if (/sers|prêt|plie|garnis/.test(s)) return 'plate'
  return 'mix'
}

/**
 * First duration of a step, in minutes, for its timer: "10 min" → 10, "1 h 30" → 90,
 * "20 à 30 min" → 20 (check early, add more if needed). Null when there is none, or beyond 4 h.
 */
export function stepMinutes(text: string): number | null {
  const m = /(\d+)\s*h(?:\s*(\d+))?(?!\w)|(\d+)(?:\s*(?:à|-)\s*\d+)?\s*min\b/.exec(text.replace(/ /g, ' '))
  if (!m) return null
  const minutes = m[1] != null ? Number(m[1]) * 60 + Number(m[2] ?? 0) : Number(m[3])
  return minutes > 0 && minutes <= 240 ? minutes : null
}

/** Oven temperature of a recipe ("180 °C"), from its first step that heats the oven. */
export function ovenTemperature(steps: string[]): number | null {
  for (const s of steps) {
    const m = /(\d{2,3})\s*°\s*C/.exec(s)
    if (m && /four|préchauff|enfourne/i.test(s)) return Number(m[1])
  }
  return null
}

/** Kitchen tools named in the steps, in a fixed order. */
const UTENSILS: [label: string, pattern: RegExp][] = [
  ['Four', /\bfour\b|enfourne|préchauff/],
  ['Air fryer', /air fryer/],
  ['Poêle', /poêle/],
  ['Casserole', /casserole/],
  ['Cocotte', /cocotte|faitout|marmite/],
  ['Wok', /\bwok\b/],
  ['Mixeur', /\bmixe|mixeur|blender|robot/],
  ['Fouet', /fouet|\bbats\b|monte les blancs|en neige/],
  ['Saladier', /saladier|\bbol\b/],
  ['Moule', /\bmoule|ramequin/],
  ['Plaque du four', /\bplaque\b/],
  ['Plat à gratin', /\bplat\b(?! principal)/],
  ['Passoire', /passoire|égoutte|tamis/],
  ['Râpe', /râpe/],
  ['Rouleau à pâtisserie', /étale|abaisse|rouleau/],
  ['Barbecue ou gril', /barbecue|\bgril\b|grill/],
  ['Cuit-vapeur', /vapeur/],
  ['Gaufrier', /gaufrier/],
]

export function utensils(steps: string[]): string[] {
  const text = steps.join(' ').toLowerCase()
  return UTENSILS.filter(([, re]) => re.test(text)).map(([label]) => label)
}
