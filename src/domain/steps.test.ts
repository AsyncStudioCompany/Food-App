import { describe, expect, it } from 'vitest'
import { RECIPES } from '../data/catalog.ts'
import { ovenTemperature, stepKind, stepMinutes, utensils } from './steps.ts'
import { stepTechniques, TECHNIQUES } from './techniques.ts'

describe('step illustrations', () => {
  it('picks the new kinds', () => {
    expect(stepKind('Laisse prendre 4 h au frais.')).toBe('chill')
    expect(stepKind("Fais frire dans l'huile chaude.")).toBe('fry')
    expect(stepKind('Grille le poulet au barbecue.')).toBe('grill')
    expect(stepKind('Mixe les pois chiches et le tahini.')).toBe('blend')
    expect(stepKind('Monte les blancs en neige ferme.')).toBe('whisk')
    expect(stepKind('Étale la pâte et découpe des disques.')).toBe('dough')
    expect(stepKind('Égoutte les pâtes.')).toBe('drain')
    expect(stepKind('Parsème de persil.')).toBe('season')
    expect(stepKind('Mélange au fouet, puis ajoute le lait : la pâte doit être lisse.')).toBe('whisk')
    expect(stepKind('Chauffe une poêle et verse une louche de pâte.')).toBe('pan')
    // "fourchette" is not the oven.
    expect(stepKind('Égrène la semoule à la fourchette.')).not.toBe('oven')
  })
})

describe('timers', () => {
  it('reads the first duration of a step', () => {
    expect(stepMinutes('Laisse mijoter 10 min.')).toBe(10)
    expect(stepMinutes('Cuis 20 à 30 min.')).toBe(20)
    expect(stepMinutes('Enfourne 1 h 30.')).toBe(90)
    expect(stepMinutes('Laisse mariner 2 h au frais.')).toBe(120)
    expect(stepMinutes('Fais tremper une nuit.')).toBeNull()
    expect(stepMinutes('Laisse une nuit, au moins 8 h.')).toBeNull()
    expect(stepMinutes('Préchauffe le four à 180 °C.')).toBeNull()
  })
})

describe('before you start', () => {
  const steps = ['Préchauffe le four à 200 °C.', 'Fouette les œufs dans un saladier.', 'Égoutte les pâtes dans une passoire.', 'Verse dans un moule et enfourne.']
  it('finds the oven temperature and the tools', () => {
    expect(ovenTemperature(steps)).toBe(200)
    expect(ovenTemperature(['Fais revenir 5 min.'])).toBeNull()
    expect(utensils(steps)).toEqual(['Four', 'Fouet', 'Saladier', 'Moule', 'Passoire'])
  })
})

describe('techniques', () => {
  it('spots the techniques of a step', () => {
    expect(stepTechniques('Déglace au vin blanc et laisse réduire.').map((t) => t.id)).toEqual(['deglacer', 'reduire'])
    expect(stepTechniques('Monte les blancs en neige et incorpore-les.').map((t) => t.id)).toEqual(['neige', 'incorporer'])
    expect(stepTechniques('Sable la farine avec le beurre froid.').map((t) => t.id)).toEqual(['sabler'])
    expect(stepTechniques('Ajoute le sucre roux.')).toEqual([])
    expect(stepTechniques('Fonce un moule de 23 cm avec la pâte.').map((t) => t.id)).toContain('foncer')
  })
  it('has unique ids and complete texts', () => {
    expect(new Set(TECHNIQUES.map((t) => t.id)).size).toBe(TECHNIQUES.length)
    for (const t of TECHNIQUES) {
      expect(t.what.length).toBeGreaterThan(20)
      expect(t.tip.length).toBeGreaterThan(20)
    }
  })
  it('explains techniques in most catalog recipes', () => {
    const withOne = RECIPES.filter((r) => r.steps.some((s) => stepTechniques(s).length > 0))
    expect(withOne.length / RECIPES.length).toBeGreaterThan(0.5)
  })
})
