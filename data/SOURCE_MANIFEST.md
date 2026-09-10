# Rice Under Pressure — source manifest

This manifest documents the committed country-level values used by the prototype. The application reads the snapshot in `src/data/countries.ts`; it does not call public APIs at runtime.

## Snapshot metadata

| Metric | Source | Observation | Unit | Transformation in the app | Quality note |
| --- | --- | --- | --- | --- | --- |
| Seasonal scarcity | EEA seasonal WEI+ | Q2 and Q3 2023 | Percent | Q2–Q3 mean; score capped at 40% WEI+ | Country average |
| Drought exposure | Copernicus EDO CDI v4.1 | 11 Aug 2026 | Percent of national area | `0.25 × Watch + 0.60 × Warning + Alert` | Single raster snapshot; spatially aggregated |
| Rice production | Eurostat `apro_cpsh1`, `C2000` | 2022–2024 | Thousand tonnes | Three-year mean; log min-max score | Comparable period for all countries |
| Rice area | Eurostat `apro_cpsh1`, `C2000` | 2022–2024 | Thousand hectares | Three-year mean; log min-max score | Comparable period for all countries |
| Rice yield | Eurostat `apro_cpsh1`, `C2000` | 2022–2024 | Tonnes/hectare | Three-year mean; gap from highest country | Opportunity proxy, not inefficiency proof |
| Agricultural abstraction | EEA abstraction by sector | 2019 | Million cubic metres | Log min-max score | Agriculture, forestry, and fishing; not rice-only |
| Rice economic value | FAOSTAT Value of Agricultural Production | 2022–2024 | Million current USD | Three-year mean; log min-max score | Current prices; not inflation-adjusted |
| Boundaries | Natural Earth 1:110m cultural vectors | Snapshot | GeoJSON geometry | Simplified display geometry | Public-domain generalized boundaries |

## Values used

| Country | Q2 WEI+ | Q3 WEI+ | Drought score | Rice output (kt) | Rice area (kha) | Yield (t/ha) | Agricultural abstraction (Mm³) | Rice value (USDm) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Italy | 7.4 | 27.2 | 32.43 | 1,354.79 | 218.26 | 6.21 | 16,543.4 | 785.26 |
| Spain | 16.1 | 26.5 | 24.85 | 430.11 | 65.70 | 6.45 | 20,770.3 | 231.46 |
| Greece | 17.0 | 37.4 | 5.71 | 218.43 | 29.32 | 7.43 | 8,069.8 | 74.54 |
| Portugal | 17.7 | 30.7 | 22.01 | 168.84 | 27.64 | 6.11 | 3,820.2 | 87.10 |

## Source links

- [EEA seasonal WEI+](https://www.eea.europa.eu/en/datahub/datahubitem-view/bf73da3d-40dc-4f18-9ff0-2ccc7acb53ed)
- [Copernicus European Drought Observatory data service](https://drought.emergency.copernicus.eu/data/wcs-service)
- [Eurostat crop-production metadata](https://ec.europa.eu/eurostat/cache/metadata/en/apro_cp_esms.htm)
- [EEA water abstraction by economic sector](https://www.eea.europa.eu/en/analysis/maps-and-charts/water-abstraction-by-economic-sector-1)
- [FAOSTAT Value of Agricultural Production](https://data.fao.org/catalog/dataset/b1a04191-c86f-4972-a9d7-28b23568deba)
- [Natural Earth](https://www.naturalearthdata.com/)

## Reproducibility and caveats

The current snapshot preserves final country-level aggregates rather than every raw source file. The drought score can be reproduced from the Watch, Warning, and Alert shares stored in `src/data/countries.ts`; automated tests verify the formula. Eurostat and FAOSTAT figures are three-year means. Source pages and observation dates are displayed in the application. Any future refresh should update the stored values, observation labels, this manifest, and the associated tests together.
