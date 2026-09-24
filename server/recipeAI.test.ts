import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it, vi } from 'vitest'
import { generateRecipe, handleGenerate, parseRequest, RecipeGenerationError } from './recipeAI.ts'

const request = {
  fridge: [{ id: 'oeufs', qty: 6, days: 1 }],
  prefs: { diet: 'Végétarien' as const, allergies: [], cuisines: [], portions: 2 },
  wish: '',
}
const good = {
  name: 'Œufs brouillés',
  cuisine: 'Française',
  course: 'Plat',
  minutes: 8,
  servings: 2,
  ingredients: [{ id: 'oeufs', qty: 4 }],
  steps: ['Bats les œufs.', 'Cuis à feu doux en remuant.'],
  photoQuery: 'scrambled eggs',
}

/** Fake client returning the given parsed outputs one after the other. */
function fakeClient(...outputs: unknown[]) {
  const parse = vi.fn()
  for (const o of outputs) parse.mockResolvedValueOnce({ stop_reason: 'end_turn', content: [], parsed_output: o })
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, parse }
}

describe('parseRequest', () => {
  it('accepts a valid body and rejects junk', () => {
    expect(parseRequest(request)).toEqual(request)
    expect(() => parseRequest({ ...request, prefs: { ...request.prefs, diet: 'Carnivore' } })).toThrow()
    expect(() => parseRequest({ ...request, wish: 'x'.repeat(201) })).toThrow()
  })
})

describe('generateRecipe', () => {
  it('returns a valid draft and sends the fridge in the prompt', async () => {
    const { client, parse } = fakeClient(good)
    await expect(generateRecipe(client, request)).resolves.toEqual(good)
    const params = parse.mock.calls[0][0]
    expect(params.model).toBe('claude-opus-5')
    expect(params.messages[0].content).toContain("oeufs (Œufs) : 6, périme dans 1 j")
    expect(params.messages[0].content).toContain('Régime : Végétarien.')
  })

  it('asks once more when the draft breaks the diet, then gives up', async () => {
    const withBacon = { ...good, ingredients: [{ id: 'oeufs', qty: 4 }, { id: 'lardons', qty: 100 }] }
    const retry = fakeClient(withBacon, good)
    await expect(generateRecipe(retry.client, request)).resolves.toEqual(good)
    expect(retry.parse.mock.calls[1][0].messages.at(-1).content).toContain('ne respecte pas le régime')

    const stubborn = fakeClient(withBacon, withBacon)
    await expect(generateRecipe(stubborn.client, request)).rejects.toBeInstanceOf(RecipeGenerationError)
  })
})

describe('handleGenerate', () => {
  it('answers 503 without an API key and 400 on a bad body', async () => {
    expect(await handleGenerate(request, undefined)).toEqual({ status: 503, json: { error: 'not_configured' } })
    expect(await handleGenerate({ nope: true }, 'key')).toEqual({ status: 400, json: { error: 'bad_request' } })
  })
})
