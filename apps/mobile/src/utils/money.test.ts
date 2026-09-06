import { describe, expect, it } from 'vitest'
import { toPaise, toRupees } from './money'

describe('money utils', () => {
  it('converts rupees to paise', () => {
    expect(toPaise(10.5)).toBe(1050)
  })

  it('converts paise to rupees', () => {
    expect(toRupees(2500)).toBe(25)
  })
})
