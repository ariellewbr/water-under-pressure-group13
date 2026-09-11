import { describe, expect, it } from 'vitest'
import { countries, indicatorOrder } from './data/countries'
import {
  defaultWeights,
  decisionBrief,
  indicatorScores,
  investmentThemes,
  rankCountries,
  scoreBand,
  type Weights,
} from './scoring'

describe('country data', () => {
  it('contains one complete, finite record for each target country', () => {
    expect(countries.map((country) => country.code).sort()).toEqual(['ESP', 'GRC', 'ITA', 'PRT'])
    for (const country of countries) {
      expect(Object.values(country.raw).every(Number.isFinite)).toBe(true)
    }
  })

  it('reproduces each drought score from the published exposure shares', () => {
    for (const country of countries) {
      const expected = country.raw.droughtWatch * 0.25
        + country.raw.droughtWarning * 0.6
        + country.raw.droughtAlert
      expect(country.raw.drought).toBeCloseTo(expected, 1)
    }
  })
})

describe('priority scoring', () => {
  it('uses default weights that total 100', () => {
    expect(indicatorOrder.reduce((sum, key) => sum + defaultWeights[key], 0)).toBe(100)
  })

  it('keeps every normalized score and total within 0–100', () => {
    for (const country of countries) {
      for (const score of Object.values(indicatorScores(country))) {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      }
    }
    for (const country of rankCountries(defaultWeights)) {
      expect(country.totalScore).toBeGreaterThanOrEqual(0)
      expect(country.totalScore).toBeLessThanOrEqual(100)
    }
  })

  it('makes contribution totals reproduce the displayed priority score', () => {
    for (const country of rankCountries(defaultWeights)) {
      const sum = indicatorOrder.reduce((total, key) => total + country.contributions[key], 0)
      expect(sum).toBeCloseTo(country.totalScore, 10)
    }
  })

  it('updates the ranking deterministically when an investment lens changes', () => {
    const scarcityOnly = Object.fromEntries(indicatorOrder.map((key) => [key, key === 'scarcity' ? 40 : 0])) as Weights
    expect(rankCountries(scarcityOnly)[0].code).toBe('GRC')
    expect(rankCountries(scarcityOnly)).toEqual(rankCountries(scarcityOnly))
  })

  it('disables ranking when every weight is zero', () => {
    const empty = Object.fromEntries(indicatorOrder.map((key) => [key, 0])) as Weights
    expect(rankCountries(empty)).toEqual([])
  })

  it('uses the documented score band boundaries', () => {
    expect(scoreBand(39).label).toBe('Lower priority')
    expect(scoreBand(40).label).toBe('Moderate priority')
    expect(scoreBand(60).label).toBe('High priority')
    expect(scoreBand(75).label).toBe('Very high priority')
  })

  it('returns a bounded set of evidence-linked investment themes', () => {
    for (const country of rankCountries(defaultWeights)) {
      const themes = investmentThemes(country)
      expect(themes.length).toBeGreaterThan(0)
      expect(themes.length).toBeLessThanOrEqual(3)
    }
  })

  it('turns a scenario into an actionable and transparent decision brief', () => {
    const brief = decisionBrief(rankCountries(defaultWeights), defaultWeights)
    expect(brief?.headline).toMatch(/Prioritise Italy/)
    expect(brief?.summary).toMatch(/points ahead/)
    expect(brief?.rationale).toMatch(/Water scarcity/)
    expect(brief?.nextStep).toMatch(/basin and irrigation-district level/)
  })
})
