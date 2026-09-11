import { countries, indicatorOrder, indicators, type CountryDatum, type IndicatorKey } from './data/countries'

export type Weights = Record<IndicatorKey, number>
export type Scores = Record<IndicatorKey, number>

export interface RankedCountry extends CountryDatum {
  scores: Scores
  contributions: Scores
  totalScore: number
  improvementPotential: number
  rank: number
}

export const defaultWeights = Object.fromEntries(
  indicatorOrder.map((key) => [key, indicators[key].defaultWeight]),
) as Weights

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const logMinMax = (value: number, values: number[]) => {
  const transformed = values.map((item) => Math.log1p(item))
  const low = Math.min(...transformed)
  const high = Math.max(...transformed)
  if (high === low) return 50
  return ((Math.log1p(value) - low) / (high - low)) * 100
}

export function indicatorScores(country: CountryDatum): Scores {
  const highestYield = Math.max(...countries.map((item) => item.raw.yield))

  return {
    scarcity: clamp((country.raw.scarcity / 40) * 100),
    drought: clamp(country.raw.drought),
    production: logMinMax(country.raw.production, countries.map((item) => item.raw.production)),
    area: logMinMax(country.raw.area, countries.map((item) => item.raw.area)),
    yieldGap: clamp(((highestYield - country.raw.yield) / highestYield) * 100),
    abstraction: logMinMax(country.raw.abstraction, countries.map((item) => item.raw.abstraction)),
    economic: logMinMax(country.raw.economic, countries.map((item) => item.raw.economic)),
  }
}

export function rankCountries(weights: Weights): RankedCountry[] {
  const weightTotal = indicatorOrder.reduce((sum, key) => sum + Math.max(0, weights[key]), 0)
  if (weightTotal === 0) return []

  return countries
    .map((country) => {
      const scores = indicatorScores(country)
      const contributions = Object.fromEntries(
        indicatorOrder.map((key) => [key, (scores[key] * Math.max(0, weights[key])) / weightTotal]),
      ) as Scores
      const totalScore = indicatorOrder.reduce((sum, key) => sum + contributions[key], 0)
      const improvementPotential =
        scores.abstraction * 0.4 + scores.yieldGap * 0.35 + scores.area * 0.25

      return { ...country, scores, contributions, totalScore, improvementPotential, rank: 0 }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((country, index) => ({ ...country, rank: index + 1 }))
}

export function scoreBand(score: number) {
  if (score >= 75) return { label: 'Very high priority', tone: 'very-high' }
  if (score >= 60) return { label: 'High priority', tone: 'high' }
  if (score >= 40) return { label: 'Moderate priority', tone: 'moderate' }
  return { label: 'Lower priority', tone: 'lower' }
}

export function scoreColor(score: number) {
  if (score >= 75) return '#9f3a35'
  if (score >= 60) return '#cb6042'
  if (score >= 40) return '#dda83f'
  return '#3d8b78'
}

export function topDrivers(country: RankedCountry, limit = 3) {
  return indicatorOrder
    .map((key) => ({ key, value: country.contributions[key], label: indicators[key].shortLabel }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function investmentThemes(country: RankedCountry) {
  const themes: { title: string; body: string }[] = []
  const driverKeys = new Set(topDrivers(country, 4).map((item) => item.key))

  if (driverKeys.has('scarcity') || driverKeys.has('drought')) {
    themes.push({
      title: 'Climate-smart irrigation',
      body: 'Pilot controlled irrigation scheduling and alternate wetting and drying where local agronomy and water rights allow.',
    })
  }
  if (driverKeys.has('abstraction')) {
    themes.push({
      title: 'Measure and reduce losses',
      body: 'Finance metering, conveyance audits, field levelling and precision water management before large infrastructure commitments.',
    })
  }
  if (driverKeys.has('production') || driverKeys.has('area') || driverKeys.has('economic')) {
    themes.push({
      title: 'Scale through regional platforms',
      body: 'Use shared infrastructure, grower training and outcome-linked pilot finance to reach a meaningful share of the rice sector.',
    })
  }
  if (driverKeys.has('yieldGap')) {
    themes.push({
      title: 'Close the evidence gap',
      body: 'Test varieties, soil practices and irrigation changes together; lower yield alone does not prove inefficient water use.',
    })
  }

  return themes.slice(0, 3)
}

export function decisionBrief(ranked: RankedCountry[], weights: Weights) {
  const leader = ranked[0]
  const runnerUp = ranked[1]
  if (!leader || !runnerUp) return null

  const weightTotal = indicatorOrder.reduce((sum, key) => sum + Math.max(0, weights[key]), 0)
  const activePriorities = indicatorOrder
    .filter((key) => weights[key] > 0)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, 3)
    .map((key) => `${indicators[key].shortLabel} (${Math.round((weights[key] / weightTotal) * 100)}%)`)
  const drivers = topDrivers(leader, 2).map((driver) => driver.label.toLowerCase()).join(' and ')
  const nextStep = investmentThemes(leader)[0]?.title ?? 'Local due diligence'

  return {
    headline: `Prioritise ${leader.name} for first-stage due diligence`,
    summary: `${leader.name} ranks #1 with a ${leader.totalScore.toFixed(1)}/100 priority score, ${(
      leader.totalScore - runnerUp.totalScore
    ).toFixed(1)} points ahead of ${runnerUp.name}.`,
    rationale: `The current lens places the greatest emphasis on ${activePriorities.join(', ')}. ${leader.name}'s strongest weighted signals are ${drivers}.`,
    nextStep: `Validate “${nextStep}” at basin and irrigation-district level before allocating capital.`,
  }
}
