export type CountryCode = 'ITA' | 'ESP' | 'GRC' | 'PRT' | 'FRA' | 'DEU'

export type IndicatorKey =
  | 'scarcity'
  | 'drought'
  | 'production'
  | 'area'
  | 'yieldGap'
  | 'abstraction'
  | 'economic'

export interface CountryDatum {
  code: CountryCode
  name: string
  flag: string
  region: string
  dataQuality?: 'published' | 'working estimate'
  raw: {
    scarcity: number
    scarcityQ2: number
    scarcityQ3: number
    drought: number
    droughtWatch: number
    droughtWarning: number
    droughtAlert: number
    production: number
    area: number
    yield: number
    abstraction: number
    economic: number
  }
}

export const indicators: Record<IndicatorKey, {
  label: string
  shortLabel: string
  description: string
  defaultWeight: number
  sourceYear: string
}> = {
  scarcity: {
    label: 'Seasonal water scarcity',
    shortLabel: 'Water scarcity',
    description: 'Average Q2–Q3 WEI+ pressure on renewable water resources.',
    defaultWeight: 20,
    sourceYear: '2023',
  },
  drought: {
    label: 'Drought exposure',
    shortLabel: 'Drought',
    description: 'Weighted country area in Watch, Warning or Alert conditions.',
    defaultWeight: 15,
    sourceYear: '11 Aug 2026',
  },
  production: {
    label: 'Rice production',
    shortLabel: 'Production',
    description: 'Average annual harvested rice production over three years.',
    defaultWeight: 15,
    sourceYear: '2022–2024',
  },
  area: {
    label: 'Rice-growing area',
    shortLabel: 'Growing area',
    description: 'Average cultivated rice area over three years.',
    defaultWeight: 10,
    sourceYear: '2022–2024',
  },
  yieldGap: {
    label: 'Yield improvement gap',
    shortLabel: 'Yield gap',
    description: 'Distance from the highest three-year average yield in this comparison.',
    defaultWeight: 10,
    sourceYear: '2022–2024',
  },
  abstraction: {
    label: 'Agricultural water abstraction',
    shortLabel: 'Water abstraction',
    description: 'Freshwater abstracted by agriculture, forestry and fishing.',
    defaultWeight: 15,
    sourceYear: '2019',
  },
  economic: {
    label: 'Economic importance of rice',
    shortLabel: 'Economic value',
    description: 'Average annual gross rice-production value in current US dollars.',
    defaultWeight: 15,
    sourceYear: '2022–2024',
  },
}

export const indicatorOrder = Object.keys(indicators) as IndicatorKey[]

export const countries: CountryDatum[] = [
  {
    code: 'ITA',
    name: 'Italy',
    flag: '🇮🇹',
    region: 'Po Valley focus',
    raw: {
      scarcity: 17.3,
      scarcityQ2: 7.4,
      scarcityQ3: 27.2,
      drought: 32.43,
      droughtWatch: 24.64,
      droughtWarning: 30.23,
      droughtAlert: 8.13,
      production: 1354.79,
      area: 218.26,
      yield: 6.21,
      abstraction: 16543.4,
      economic: 785.26,
    },
  },
  {
    code: 'ESP',
    name: 'Spain',
    flag: '🇪🇸',
    region: 'Ebro & Guadalquivir focus',
    raw: {
      scarcity: 21.3,
      scarcityQ2: 16.1,
      scarcityQ3: 26.5,
      drought: 24.85,
      droughtWatch: 59.44,
      droughtWarning: 12.66,
      droughtAlert: 2.39,
      production: 430.11,
      area: 65.7,
      yield: 6.45,
      abstraction: 20770.3,
      economic: 231.46,
    },
  },
  {
    code: 'GRC',
    name: 'Greece',
    flag: '🇬🇷',
    region: 'Central Macedonia focus',
    raw: {
      scarcity: 27.2,
      scarcityQ2: 17,
      scarcityQ3: 37.4,
      drought: 5.71,
      droughtWatch: 0.69,
      droughtWarning: 8.21,
      droughtAlert: 0.61,
      production: 218.43,
      area: 29.32,
      yield: 7.43,
      abstraction: 8069.8,
      economic: 74.54,
    },
  },
  {
    code: 'PRT',
    name: 'Portugal',
    flag: '🇵🇹',
    region: 'Tejo & Mondego focus',
    raw: {
      scarcity: 24.2,
      scarcityQ2: 17.7,
      scarcityQ3: 30.7,
      drought: 22.01,
      droughtWatch: 56.43,
      droughtWarning: 9.01,
      droughtAlert: 2.5,
      production: 168.84,
      area: 27.64,
      yield: 6.11,
      abstraction: 3820.2,
      economic: 87.1,
    },
  },
  {
    code: 'FRA',
    name: 'France',
    flag: '🇫🇷',
    region: 'Camargue focus',
    dataQuality: 'working estimate',
    raw: {
      scarcity: 8.4,
      scarcityQ2: 6.1,
      scarcityQ3: 10.7,
      drought: 10.4,
      droughtWatch: 18.2,
      droughtWarning: 7.3,
      droughtAlert: 1.1,
      production: 86.2,
      area: 14.8,
      yield: 5.82,
      abstraction: 9100,
      economic: 49.8,
    },
  },
  {
    code: 'DEU',
    name: 'Germany',
    flag: '🇩🇪',
    region: 'Northern European benchmark',
    dataQuality: 'working estimate',
    raw: {
      scarcity: 4.9,
      scarcityQ2: 3.7,
      scarcityQ3: 6.1,
      drought: 6.2,
      droughtWatch: 12.8,
      droughtWarning: 4.1,
      droughtAlert: 0.4,
      production: 4.2,
      area: 0.7,
      yield: 6.0,
      abstraction: 11200,
      economic: 2.7,
    },
  },
]

export const sources = [
  {
    name: 'EEA seasonal WEI+',
    detail: 'Country-scale Q2 and Q3 water exploitation index, 2023.',
    href: 'https://www.eea.europa.eu/en/datahub/datahubitem-view/bf73da3d-40dc-4f18-9ff0-2ccc7acb53ed',
  },
  {
    name: 'Copernicus European Drought Observatory',
    detail: 'CDI v4.1 raster dated 11 August 2026, aggregated to country boundaries.',
    href: 'https://drought.emergency.copernicus.eu/data/wcs-service',
  },
  {
    name: 'Eurostat crop production',
    detail: 'Rice (C2000) area, production and yield; three-year average, 2022–2024.',
    href: 'https://ec.europa.eu/eurostat/cache/metadata/en/apro_cp_esms.htm',
  },
  {
    name: 'EEA water abstraction by sector',
    detail: 'Agriculture, forestry and fishing abstraction in million m³, 2019.',
    href: 'https://www.eea.europa.eu/en/analysis/maps-and-charts/water-abstraction-by-economic-sector-1',
  },
  {
    name: 'FAOSTAT value of agricultural production',
    detail: 'Gross rice-production value in current USD; three-year average, 2022–2024.',
    href: 'https://data.fao.org/catalog/dataset/b1a04191-c86f-4972-a9d7-28b23568deba',
  },
  {
    name: 'Natural Earth',
    detail: 'Public-domain country boundaries, 1:110m cultural vectors.',
    href: 'https://www.naturalearthdata.com/',
  },
  {
    name: 'France and Germany extension note',
    detail: 'France and Germany are added as working estimates until matching country snapshots are committed.',
    href: 'https://github.com/ariellewbr/water-under-pressure-group13/tree/feat/rice-under-pressure-dashboard',
  },
]
