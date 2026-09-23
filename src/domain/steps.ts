export type StepKind = 'oven' | 'cut' | 'rest' | 'pot' | 'pan' | 'plate' | 'mix'

/** Picks the step illustration from the step text. Order matters: the first match wins. */
export function stepKind(text: string): StepKind {
  const s = text.toLowerCase()
  if (/four|préchauff/.test(s)) return 'oven'
  if (/émince|coupe|hache|râpe|quartiers|dés/.test(s)) return 'cut'
  if (/repos/.test(s)) return 'rest'
  if (/eau|pâtes|riz|mijote|bain-marie|mixe|lance/.test(s)) return 'pot'
  if (/poêle|revenir|dor|saisi|compot|saute|sue|blondir|feu|cuis/.test(s)) return 'pan'
  if (/sers|prêt|plie|garnis/.test(s)) return 'plate'
  return 'mix'
}
