import { describe, expect, it } from 'vitest'
import { nameMatches, photoBg, smallPhoto } from './photos'

describe('photos', () => {
  it('accepts a TheMealDB dish only when its name has every word of the query', () => {
    expect(nameMatches('Jamaican Curry Chicken Recipe', 'chicken curry')).toBe(true)
    expect(nameMatches('Thai Green Curry', 'chicken curry')).toBe(false)
    expect(nameMatches('Crêpes Suzette', 'crepes')).toBe(true)
  })

  it('uses smaller files for thumbnails', () => {
    expect(smallPhoto('https://www.themealdb.com/images/media/meals/x.jpg')).toBe('https://www.themealdb.com/images/media/meals/x.jpg/preview')
    expect(smallPhoto('https://live.staticflickr.com/1/2_abc_b.jpg')).toBe('https://live.staticflickr.com/1/2_abc_q.jpg')
    expect(smallPhoto('https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/A.jpg/960px-A.jpg')).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/A.jpg/250px-A.jpg')
    expect(photoBg(undefined)).toContain('repeating-linear-gradient')
  })
})
