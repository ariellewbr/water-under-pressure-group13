import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import {
  countries,
  indicatorOrder,
  indicators,
  sources,
  type CountryCode,
  type IndicatorKey,
} from './data/countries'
import {
  defaultWeights,
  investmentThemes,
  rankCountries,
  scoreBand,
  scoreColor,
  topDrivers,
  type RankedCountry,
  type Weights,
} from './scoring'
type CountryFeatureProperties = { iso_a3?: CountryCode; name?: string }
type CountryFeature = { properties?: CountryFeatureProperties }
type CountryFeatureCollection = { type: 'FeatureCollection'; features: unknown[] }

const countryCenters: Record<CountryCode, [number, number]> = {
  ITA: [42.6, 12.7],
  ESP: [40.2, -3.7],
  GRC: [39.1, 22.9],
  PRT: [39.6, -8.0],
  FRA: [46.4, 2.2],
  DEU: [51.2, 10.4],
}

const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

function MapFocus({ target }: { target: CountryCode | 'ALL' }) {
  const map = useMap()
  useEffect(() => {
    if (target === 'ALL') {
      map.flyTo([41, 8], 4, { duration: 0.7 })
      return
    }
    map.flyTo(countryCenters[target], target === 'PRT' ? 5.2 : 5, { duration: 0.7 })
  }, [target, map])
  return null
}

function formatRaw(country: RankedCountry, key: IndicatorKey) {
  switch (key) {
    case 'scarcity': return `${number.format(country.raw.scarcity)}% WEI+`
    case 'drought': return `${number.format(country.raw.drought)} / 100`
    case 'production': return `${number.format(country.raw.production)}k tonnes`
    case 'area': return `${number.format(country.raw.area)}k hectares`
    case 'yieldGap': return `${number.format(country.raw.yield)} t/ha yield`
    case 'abstraction': return `${number.format(country.raw.abstraction)}m m³`
    case 'economic': return `$${number.format(country.raw.economic)}m`
  }
}

function ScoreRing({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
  const rounded = Math.round(score)
  return (
    <div
      className={`score-ring score-ring--${size}`}
      style={{ '--score': rounded, '--ring-color': scoreColor(score) } as React.CSSProperties}
      aria-label={`Priority score ${rounded} out of 100`}
    >
      <strong>{rounded}</strong>
      <span>/100</span>
    </div>
  )
}

function App() {
  const [weights, setWeights] = useState<Weights>(defaultWeights)
  const ranked = useMemo(() => rankCountries(weights), [weights])
  const [selectedCode, setSelectedCode] = useState<CountryCode>('ITA')
  const [mapTarget, setMapTarget] = useState<CountryCode | 'ALL'>('ALL')
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [tileErrors, setTileErrors] = useState(0)
  const [countryBoundaries, setCountryBoundaries] = useState<CountryFeatureCollection | null>(null)
  const [boundaryError, setBoundaryError] = useState(false)
  const closeModalButton = useRef<HTMLButtonElement>(null)

  const selected = ranked.find((country) => country.code === selectedCode) ?? ranked[0]
  const leader = ranked[0]
  const runnerUp = ranked[1]
  const weightTotal = indicatorOrder.reduce((sum, key) => sum + weights[key], 0)
  const defaultLeader = useMemo(() => rankCountries(defaultWeights)[0], [])
  const weightsAreDefault = indicatorOrder.every((key) => weights[key] === defaultWeights[key])

  useEffect(() => {
    if (ranked.length && !ranked.some((country) => country.code === selectedCode)) {
      setSelectedCode(ranked[0].code)
    }
  }, [ranked, selectedCode])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/countries.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Country boundaries unavailable')
        return response.json() as Promise<CountryFeatureCollection>
      })
      .then(setCountryBoundaries)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setBoundaryError(true)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!methodologyOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMethodologyOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    closeModalButton.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previousFocus?.focus()
    }
  }, [methodologyOpen])

  const selectCountry = (code: CountryCode) => {
    setSelectedCode(code)
    setMapTarget(code)
  }

  const mapStyle = (feature?: CountryFeature): PathOptions => {
    const code = feature?.properties?.iso_a3
    const item = ranked.find((country) => country.code === code)
    const isSelected = code === selectedCode
    return {
      fillColor: item ? scoreColor(item.totalScore) : '#adb8b2',
      fillOpacity: isSelected ? 0.92 : 0.76,
      color: isSelected ? '#122f35' : '#ffffff',
      weight: isSelected ? 3.5 : 1.7,
      opacity: 1,
    }
  }

  const onEachCountry = (
    feature: CountryFeature,
    layer: Layer,
  ) => {
    const code = feature.properties?.iso_a3
    const item = ranked.find((country) => country.code === code)
    if (!code || !item) return
    layer.bindTooltip(`<strong>${item.name}</strong><br/>#${item.rank} · ${Math.round(item.totalScore)}/100`, {
      sticky: true,
      direction: 'top',
      className: 'country-tooltip',
    })
    layer.on({ click: () => selectCountry(code) })
    const element = (layer as Layer & { getElement?: () => HTMLElement | undefined }).getElement?.()
    if (element) {
      element.tabIndex = 0
      element.setAttribute('role', 'button')
      element.setAttribute('aria-label', `Select ${item.name}, rank ${item.rank}, score ${Math.round(item.totalScore)} out of 100`)
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          selectCountry(code)
        }
      })
    }
  }

  const updateWeight = (key: IndicatorKey, value: number) => {
    setWeights((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Rice Under Pressure home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>Rice Under Pressure</span>
        </a>
        <div className="header-actions">
          <span className="freshness"><span /> Data snapshot · Aug 2026</span>
          <button className="button button--ghost" onClick={() => setMethodologyOpen(true)}>Methodology</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow">Investment intelligence · Southern Europe</div>
          <h1>Where should Europe invest in <em>sustainable rice?</em></h1>
          <p>
            Compare water pressure, production scale and economic importance across six European rice-growing countries—then
            tune the priorities to match your fund&apos;s mandate.
          </p>
        </section>

        {leader ? (
          <section className="decision-grid" aria-label="Investment recommendation and priority map">
            <article className="recommendation-card">
              <div className="recommendation-card__topline">
                <span className="pill pill--accent">Recommended first look</span>
                <span className="rank-note">#1 of 6</span>
              </div>
              <div className="recommendation-heading">
                <div>
                  <span className="country-flag" aria-hidden="true">{leader.flag}</span>
                  <h2>{leader.name}</h2>
                  <p>{leader.region}</p>
                </div>
                <ScoreRing score={leader.totalScore} />
              </div>
              <p className="recommendation-copy">
                {leader.name} rises to the top because <strong>{topDrivers(leader, 2).map((driver) => driver.label.toLowerCase()).join(' and ')}</strong> create the largest weighted case for scalable water-resilience investment.
              </p>
              <div className="driver-list" aria-label="Top score drivers">
                {topDrivers(leader).map((driver) => (
                  <div className="driver" key={driver.key}>
                    <span>{driver.label}</span>
                    <div className="driver-track"><i style={{ width: `${Math.min(100, driver.value * 5)}%` }} /></div>
                    <strong>+{driver.value.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
              <div className="sensitivity-note">
                <span aria-hidden="true">↗</span>
                <p><strong>{leader.totalScore - runnerUp.totalScore >= 8 ? 'Stable lead' : 'Weight-sensitive lead'}</strong><br />{(leader.totalScore - runnerUp.totalScore).toFixed(1)} points ahead under current priorities. {!weightsAreDefault && (leader.name === defaultLeader.name ? 'The default winner is unchanged.' : `This differs from the default winner, ${defaultLeader.name}.`)}</p>
              </div>
            </article>

            <article className="map-card">
              <div className="map-card__header">
                <div>
                  <span className="section-kicker">Priority geography</span>
                  <h2>Investment landscape</h2>
                </div>
                <div className="map-legend" aria-label="Priority score legend">
                  <span><i className="legend-low" /> Lower</span>
                  <span><i className="legend-mid" /> Moderate</span>
                  <span><i className="legend-high" /> High</span>
                </div>
              </div>
              <div className="map-wrap">
                {tileErrors > 3 && <div className="map-warning">Basemap unavailable · country layer remains interactive</div>}
                <MapContainer center={[41, 8]} zoom={4} minZoom={3} maxZoom={8} scrollWheelZoom className="map">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{ tileerror: () => setTileErrors((count) => count + 1) }}
                  />
                  {countryBoundaries && (
                    <GeoJSON
                      key={`${selectedCode}-${ranked.map((item) => Math.round(item.totalScore)).join('-')}`}
                      data={countryBoundaries as never}
                      style={mapStyle as never}
                      onEachFeature={onEachCountry as never}
                    />
                  )}
                  <MapFocus target={mapTarget} />
                </MapContainer>
                {!countryBoundaries && (
                  <div className="map-layer-status" role="status">
                    {boundaryError ? 'Country outlines unavailable · use the comparison cards below' : 'Loading country outlines…'}
                  </div>
                )}
                <div className="map-instruction">Select a country to investigate</div>
                <button className="map-reset" type="button" onClick={() => setMapTarget('ALL')}>Reset view</button>
              </div>
            </article>
          </section>
        ) : (
          <section className="zero-state" role="alert">
            <span>0%</span>
            <h2>Add at least one investment priority</h2>
            <p>All indicator weights are set to zero. Adjust a slider below or restore the default model.</p>
            <button className="button button--primary" onClick={() => setWeights(defaultWeights)}>Restore defaults</button>
          </section>
        )}

        <section className="section comparison-section" aria-labelledby="comparison-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Four-country comparison</span>
              <h2 id="comparison-title">Ranking under current priorities</h2>
            </div>
            <p>Scores update instantly as you rebalance the fund&apos;s mandate.</p>
          </div>
          <div className="country-cards">
            {ranked.map((country) => {
              const band = scoreBand(country.totalScore)
              const top = topDrivers(country, 1)[0]
              return (
                <button
                  className={`country-card ${selectedCode === country.code ? 'is-selected' : ''}`}
                  key={country.code}
                  onClick={() => selectCountry(country.code)}
                  aria-pressed={selectedCode === country.code}
                >
                  <div className="country-card__head">
                    <span className="country-card__rank">{String(country.rank).padStart(2, '0')}</span>
                    <span className="country-flag" aria-hidden="true">{country.flag}</span>
                    <div><h3>{country.name}</h3><span>{country.region}</span></div>
                    <ScoreRing score={country.totalScore} size="small" />
                  </div>
                  <div className="country-card__bar"><i style={{ width: `${country.totalScore}%`, background: scoreColor(country.totalScore) }} /></div>
                  <div className="country-card__meta">
                    <span className={`status status--${band.tone}`}>{band.label}</span>
                    <span>Top driver · {top.label}</span>
                  </div>
                  <div className="country-card__metrics">
                    <div><span>Rice output</span><strong>{number.format(country.raw.production)}k t</strong></div>
                    <div><span>Summer WEI+</span><strong>{number.format(country.raw.scarcity)}%</strong></div>
                    <div><span>Improvement</span><strong>{Math.round(country.improvementPotential)}/100</strong></div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="analysis-grid section" aria-label="Scenario controls and selected country analysis">
          <article className="weights-card">
            <div className="weights-card__header">
              <div><span className="section-kicker">Scenario builder</span><h2>Set your investment lens</h2></div>
              <button className="text-button" onClick={() => setWeights(defaultWeights)}>Reset defaults</button>
            </div>
            <p className="helper-copy">Move any slider. We convert relative importance into effective percentages automatically.</p>
            <div className="weight-list">
              {indicatorOrder.map((key) => {
                const effective = weightTotal ? (weights[key] / weightTotal) * 100 : 0
                return (
                  <label className="weight-control" key={key}>
                    <span className="weight-control__label"><strong>{indicators[key].label}</strong><span>{effective.toFixed(0)}%</span></span>
                    <span className="weight-control__description">{indicators[key].description}</span>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={weights[key]}
                      onChange={(event) => updateWeight(key, Number(event.target.value))}
                      aria-label={`${indicators[key].label} weight`}
                      style={{ '--range-position': `${(weights[key] / 40) * 100}%` } as React.CSSProperties}
                    />
                  </label>
                )
              })}
            </div>
          </article>

          {selected && (
            <article className="country-analysis">
              <div className="country-analysis__header">
                <div><span className="section-kicker">Country due-diligence view</span><h2>{selected.flag} {selected.name}</h2><p>{selected.region}</p></div>
                <div className="rank-lockup"><span>Current rank</span><strong>#{selected.rank}</strong></div>
              </div>
              <div className="metric-grid">
                {indicatorOrder.map((key) => (
                  <div className="metric" key={key}>
                    <div className="metric__top"><span>{indicators[key].shortLabel}</span><strong>{Math.round(selected.scores[key])}/100</strong></div>
                    <div className="metric__track"><i style={{ width: `${selected.scores[key]}%` }} /></div>
                    <div className="metric__bottom"><span>{formatRaw(selected, key)}</span><span>+{selected.contributions[key].toFixed(1)} pts · {indicators[key].sourceYear}</span></div>
                  </div>
                ))}
              </div>
              <div className="trend-summary">
                <span className="section-kicker">Three-year rice profile</span>
                <p><strong>{number.format(selected.raw.production)} thousand tonnes</strong> average annual output from <strong>{number.format(selected.raw.area)} thousand hectares</strong> in 2022–2024, at <strong>{number.format(selected.raw.yield)} tonnes per hectare</strong>.</p>
              </div>
              <div className="improvement-card">
                <div className="improvement-score"><strong>{Math.round(selected.improvementPotential)}</strong><span>/100</span></div>
                <div><span className="section-kicker">Derived opportunity signal</span><h3>Water-efficiency improvement potential</h3><p>Combines abstraction scale (40%), yield gap (35%) and rice-growing area (25%). It is a screening proxy—not an official statistic.</p></div>
              </div>
              <div className="themes">
                <span className="section-kicker">Recommended investment themes</span>
                {investmentThemes(selected).map((theme, index) => (
                  <div className="theme" key={theme.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h3>{theme.title}</h3><p>{theme.body}</p></div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <section className="closing-callout section">
          <div><span className="section-kicker">Decision discipline</span><h2>Use the ranking to decide where to investigate—not where to write a cheque.</h2></div>
          <p>Country-level indicators reveal scale and pressure. Final allocation still requires basin, irrigation-district, farm, water-rights and project-economics due diligence.</p>
          <button className="button button--light" onClick={() => setMethodologyOpen(true)}>Review evidence & limits</button>
        </section>
      </main>

      <footer>
        <div className="brand"><span className="brand-mark" aria-hidden="true">R</span><span>Rice Under Pressure</span></div>
        <p>Investment screening prototype · Italy, Spain, Greece & Portugal</p>
        <button className="text-button" onClick={() => setMethodologyOpen(true)}>Sources & methodology</button>
      </footer>

      {methodologyOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMethodologyOpen(false)}>
          <section className="methodology-modal" role="dialog" aria-modal="true" aria-labelledby="methodology-title" aria-describedby="methodology-summary" onMouseDown={(event) => event.stopPropagation()}>
            <div className="methodology-modal__header">
              <div><span className="section-kicker">Evidence room</span><h2 id="methodology-title">Sources & methodology</h2></div>
              <button ref={closeModalButton} className="close-button" onClick={() => setMethodologyOpen(false)} aria-label="Close methodology">×</button>
            </div>
            <p className="method-intro" id="methodology-summary">The score compares six countries using dated public-data snapshots. France and Germany are working estimates pending matching country snapshots. It supports screening, not hydrological or financial forecasting.</p>
            <div className="formula-card"><span>Priority score</span><strong>Σ (indicator score × relative weight)</strong><p>Each input is normalised to 0–100. Volume indicators use logarithmic min–max scaling; WEI+ uses the EEA severe-stress threshold; yield is shown as the gap from the highest observed three-year average.</p></div>
            <h3>Public sources</h3>
            <div className="source-list">
              {sources.map((source) => (
                <a href={source.href} target="_blank" rel="noreferrer" key={source.name}>
                  <span><strong>{source.name}</strong><small>{source.detail}</small></span><b aria-hidden="true">↗</b>
                </a>
              ))}
            </div>
            <h3>Important limits</h3>
            <ul className="limit-list">
              <li>National averages can conceal large differences between rice-growing basins and farms.</li>
              <li>Agricultural abstraction covers agriculture, forestry and fishing—not rice alone.</li>
              <li>FAOSTAT values are current-price observations and are not adjusted for inflation.</li>
              <li>The drought score is a single dated CDI snapshot and is not a forecast.</li>
              <li>Suggested interventions require local agronomic, legal and financial validation.</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
