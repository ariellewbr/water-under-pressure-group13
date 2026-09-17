# Rice Under Pressure — final implementation plan

## Product title

**Rice Under Pressure: Where Should Europe Invest in Sustainable Rice Production?**

## Product definition

Rice Under Pressure is a country-level investment-screening platform for a European sustainability fund supporting climate-resilient agriculture. It compares Italy, Spain, Greece, and Portugal and answers one decision: **which country should receive priority investment to make rice production more water-efficient and resilient?**

The product is a prioritisation aid, not a hydrological forecast, farm-level diagnosis, or guarantee of investment returns.

## Target user and decision

- **Primary user:** an investment manager or programme officer at a European sustainability fund.
- **Decision:** which of the four countries should move first into investment due diligence.
- **Outcome:** a ranked recommendation with a transparent score, supporting evidence, suggested interventions, and clear limitations.

## MVP experience

The application opens on a familiar zoomable map of southern Europe. Italy, Spain, Greece, and Portugal are filled according to their current Rice Water Investment Priority Score. A side panel explains the selected country, and four comparison cards make the ranking visible without requiring map interaction.

Users can:

1. Click or keyboard-select a country on the map.
2. Compare all four country cards.
3. Inspect the score, rank, raw indicator values, data years, and score contributions.
4. Adjust indicator weights and see the map, ranking, cards, and recommendation update immediately.
5. Reset the weights to the evidence-based default.
6. Read recommended investment themes and the evidence behind them.
7. Open the methodology, source links, and limitations.

## Data model

Use dated, committed data snapshots rather than live runtime API calls. This avoids API keys, rate limits, and demo failures while preserving reproducibility. Each record must include the source, retrieval date, observation year, unit, transformation, and any data-quality flag.

### Independent score indicators

| Indicator | Definition used in the MVP | Primary source | Default weight | Direction |
| --- | --- | --- | ---: | --- |
| Seasonal water scarcity | Mean of Q2 and Q3 country-level WEI+ for the latest common year | EEA seasonal WEI+ | 20% | Higher scarcity raises priority |
| Drought exposure | Area-weighted share of the country in EDO Watch, Warning, and Alert classes for one dated CDI snapshot | European Drought Observatory | 15% | Greater exposure raises priority |
| Rice production | Three-year mean harvested rice production, thousand tonnes | Eurostat `apro_cpsh1`, crop `C2000` | 15% | More production raises scalable impact |
| Rice-growing area | Three-year mean rice area, thousand hectares | Eurostat `apro_cpsh1`, crop `C2000` | 10% | Larger area raises scalable impact |
| Yield per hectare | Three-year mean tonnes per hectare, converted to a yield-gap score relative to the best of the four countries | Eurostat `apro_cpsh1`, crop `C2000` | 10% | A larger yield gap raises improvement opportunity |
| Agricultural water abstraction | Agricultural freshwater abstraction per hectare of utilised agricultural area for the latest comparable year; show total abstraction alongside it | EEA Waterbase plus Eurostat land area | 15% | Greater intensity raises priority |
| Economic importance of rice | Three-year mean gross value of rice production in constant prices | FAOSTAT Value of Agricultural Production | 15% | Greater value raises protected economic impact |

Default weights total 100%. In the interface, slider values act as relative weights and are automatically normalised, so users do not have to make them add to exactly 100. If all weights are zero, ranking is disabled and a clear validation message appears.

### Derived core indicator

**Potential for water-efficiency improvements** is displayed as a core indicator but is not given a separate weight, because doing so would double-count its components.

`improvement potential = 40% agricultural abstraction intensity + 35% yield gap + 25% rice-growing area scale`

It is labelled as a model-derived screening proxy, not an official statistic. Its component values are shown wherever the indicator appears.

### Data fallbacks

- Use the latest year common to all four countries for a metric; do not compare mismatched years without an explicit warning.
- If agricultural abstraction intensity cannot be calculated consistently, use agriculture's share of total freshwater abstraction and label the substitution.
- If a country lacks a metric, display it as unavailable. Redistribute that country's active weights proportionally across available indicators and show a missing-data warning; never convert missing data to zero.
- Keep Eurostat observation flags such as estimated or provisional values in the processed metadata and surface them in the methodology.

## Score calculation

Each independent indicator is transformed to a 0–100 priority contribution:

- **Seasonal scarcity:** apply an absolute WEI+ scale anchored to the EEA stress thresholds; cap extreme values at a documented upper bound.
- **Drought exposure:** `0.25 × Watch share + 0.60 × Warning share + 1.00 × Alert share`.
- **Production, area, abstraction intensity, and economic value:** use a documented log min-max transformation across the fixed four-country comparison to prevent the largest country overwhelming the score.
- **Yield:** `100 × (highest three-year yield − country yield) / highest three-year yield`.

For active weights `w` and normalised indicator scores `s`:

`priority score = Σ(wᵢ × sᵢ) / Σ(wᵢ)`

Display score bands as interface guidance only:

- 0–39: Lower priority
- 40–59: Moderate priority
- 60–74: High priority
- 75–100: Very high priority

The ranking, rather than the band, is the primary recommendation. The application must state that the score is a comparative model created for this prototype and is not an official EU rating.

## Recommendation logic

The highest-scoring country under the current weights becomes the recommended first country for due diligence. The explanation is deterministic and assembled from the largest score contributions, not generated from unsupported claims.

Each recommendation explains:

1. Why the country ranks first under the current weights.
2. Which two or three indicators contribute most.
3. What economic or production scale could be protected.
4. Which assumptions or missing data could change the result.
5. How the result changed from the default weights, if the user adjusted them.

Investment themes are rule-based:

- High scarcity or drought: investigate controlled irrigation scheduling, alternate wetting and drying where agronomically suitable, storage, and resilient varieties.
- High abstraction: investigate metering, conveyance-loss reduction, field levelling, reuse, and precision water management.
- Large rice area or economic importance: prioritise scalable regional pilots, shared infrastructure, and grower training.
- Large yield gap: investigate agronomy, soil management, suitable varieties, and demonstration programmes before assuming water technology alone will solve the gap.

Recommendations use language such as **investigate**, **pilot**, or **finance due diligence**, not promises of savings or returns.

## Interface specification

### Header

- Product title and one-sentence decision statement.
- Data freshness badge.
- Methodology and data-source controls.

### Main map

- Familiar pan-and-zoom basemap using OpenStreetMap tiles with visible attribution.
- Local GeoJSON boundaries for the four countries.
- Accessible colour scale from lower to very high priority.
- Hover/focus tooltip with country, score, and rank.
- Click/Enter/Space selection.
- Zoom, reset-view, and legend controls.
- Country-outline fallback if map tiles cannot load.

### Country detail panel

- Country name, rank, priority score, and score band.
- Seven raw values and normalised contributions.
- Improvement-potential proxy and its components.
- Three-year rice trend summary.
- Top score drivers.
- Recommended investment themes.
- Source years, links, quality flags, and limitations.

### Comparison cards and ranking

- Four consistently structured cards shown in rank order.
- Score, rank, key rice statistic, main water-pressure statistic, and top driver.
- Clicking a card selects and zooms to the country.
- Ranking updates immediately when weights change.

### Weight controls

- Seven labelled sliders with current effective percentages.
- Plain-language explanation of what increasing each weight means.
- Live total/normalisation feedback.
- Reset-to-default button.
- All-zero validation state.
- A note that custom weights represent the fund's priorities, not a change in the underlying data.

### Recommendation summary

- A prominent statement naming the current first-ranked country.
- A concise explanation based on score contributions.
- A short due-diligence checklist.
- A sensitivity note showing whether small weight changes alter the winner.

## Visual direction

- Professional investment-dashboard styling rather than a scientific GIS interface.
- Map-first layout with warm neutral surfaces, deep blue typography, and a colour-blind-safe priority palette.
- Clear hierarchy, generous spacing, and restrained charts.
- Responsive layouts for desktop, tablet, and mobile.
- Never rely on colour alone: always pair colour with labels, rank, and numeric score.
- Desktop composition: compact decision header, dominant map, persistent selected-country panel, and a clearly separated comparison-and-ranking section below.
- Mobile composition: recommendation first, map second, horizontally scrollable comparison cards, then weights and methodology; no squeezed desktop sidebar.
- Use one consistent card system with subtle borders, restrained shadows, aligned metrics, and a single spacing scale.
- Reserve the strongest accent colour for the recommended country and primary actions; keep data colours consistent between the map, cards, ranking, and detail panel.
- Add short, purposeful transitions for country selection, rank changes, and score updates while respecting reduced-motion preferences.
- Design empty, loading, error, and map-fallback states to look intentional rather than unfinished.

## Technical approach

- React, TypeScript, and Vite.
- Leaflet/React Leaflet for the map and OpenStreetMap for tiles.
- Local GeoJSON for country boundaries.
- Versioned JSON/CSV snapshots under `data/` with a small preprocessing script.
- Pure scoring functions separated from interface components.
- No backend, user account, paid map service, or API key in the MVP.
- Vitest for score and data tests; Testing Library for interactions; a browser-level smoke test for the complete flow.

## Local data workflow

1. Download only the required official source slices.
2. Preserve raw snapshots when reasonably small.
3. Transform them into one country-level dataset used by the interface.
4. Generate a machine-readable source manifest.
5. Validate country coverage, units, ranges, missing values, and three-year calculations.
6. Commit both processed data and documentation so the result is reproducible.

Proposed structure:

```text
data/
  raw/
  processed/country-metrics.json
  SOURCE_MANIFEST.md
src/
  components/
  data/
  scoring/
  recommendations/
  tests/
public/
  geo/countries.geojson
```

## Iteration and verification plan

### Gate 1 — data audit

- All four countries have comparable observations or an explicit fallback.
- Units, time periods, and flags are documented.
- Calculated indicators can be reproduced manually.
- No estimated value is presented as an official measured fact without its flag.

### Gate 2 — score audit

- Default weights sum to 100%.
- Every score remains within 0–100.
- Ranking is deterministic.
- Weight changes update all dependent views.
- Missing data is never treated as zero.
- Contribution totals reproduce the displayed final score.

### Gate 3 — product audit

- The map shows exactly Italy, Spain, Greece, and Portugal as scored countries.
- Every country can be selected by mouse and keyboard.
- Cards, map, ranking, and detail panel stay synchronised.
- The recommendation changes correctly with weights.
- Source and methodology information is reachable from every result.

### Gate 4 — resilience and accessibility

- Test empty data, malformed records, missing metrics, unavailable tiles, and all-zero weights.
- Test keyboard order, visible focus, contrast, non-colour labels, and screen sizes.
- Confirm no secrets or API keys are present.

### Gate 5 — visual quality

- Render and inspect the completed interface at representative desktop (1440×900), tablet (1024×768), and mobile (390×844) sizes.
- Check hierarchy, alignment, spacing, typography, colour consistency, chart legibility, map readability, and information density.
- Confirm there is no clipping, overflow, overlapping map controls, awkward empty space, or truncated source text.
- Review default, selected-country, adjusted-weight, missing-data, and map-failure states visually.
- Iterate after screenshot review until all three layouts feel intentional and presentation-ready.
- Confirm the most important decision—recommended country and why—is understandable within five seconds of opening the page.

### Gate 6 — final brief compliance

- One specific stakeholder and one decision are prominent.
- At least one real public source is used; the target is four official sources.
- The final README contains a short business-language description.
- Limitations clearly distinguish national screening from farm-level analysis.
- The student prompt log is complete and included.
- The local production build and test suite pass.

## Scope boundaries

Not included in the first release:

- Farm, field, or irrigation-district recommendations.
- Forecasting future drought or financial returns.
- Claims that all agricultural abstraction belongs to rice.
- Live API dependence, user accounts, or saved scenarios.
- Infrastructure cost estimates without reliable comparable source data.
- Automatic deployment before the team authorises it.

## GitHub workflow after authorisation

The existing public fork is `ariellewbr/water-under-pressure-group13`. Until upload is authorised, development and testing remain local.

When the team authorises GitHub work:

1. Verify that the connected GitHub account has write access.
2. Pull the latest `main` from the fork before starting remote integration.
3. Create a task branch, never commit directly to `main`.
4. Stage the application, data documentation, and only this student's prompt log.
5. Commit and verify that the commit exists on the remote branch.
6. Open a pull request into `main`.
7. Review the diff and test evidence.
8. Merge only after explicit team approval.

## Definition of done

The MVP is complete when a fund manager can open the locally running application, understand the decision in seconds, compare the four countries, alter investment priorities through weights, select any country on the map, trace the winning recommendation to real source data and transparent calculations, receive appropriate investment themes, and understand the model's limitations. All tests must pass, the prompt log must be current, and no GitHub upload or deployment occurs without explicit authorisation.
