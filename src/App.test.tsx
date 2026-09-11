import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ type: 'FeatureCollection', features: [] }),
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  GeoJSON: () => <div data-testid="country-layer" />,
  useMap: () => ({ flyTo: vi.fn() }),
}))

describe('investment dashboard', () => {
  it('shows the decision, six-country ranking, and methodology', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /where should Europe invest/i })).toBeInTheDocument()
    expect(screen.getByText('Ranking under current priorities')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThanOrEqual(3)

    fireEvent.click(screen.getByRole('button', { name: 'Methodology' }))
    expect(screen.getByRole('dialog', { name: 'Sources & methodology' })).toBeInTheDocument()
  })

  it('synchronizes a comparison-card selection with country analysis', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Portugal.*priority score/i }))
    expect(screen.getByRole('heading', { level: 2, name: /Portugal/ })).toBeInTheDocument()
    expect(screen.getAllByText('Tejo & Mondego focus')).toHaveLength(2)
  })

  it('shows a recovery action when every indicator weight is zero', () => {
    render(<App />)
    for (const slider of screen.getAllByRole('slider')) {
      fireEvent.change(slider, { target: { value: '0' } })
    }
    expect(screen.getByRole('alert')).toHaveTextContent('Add at least one investment priority')
    expect(screen.getByRole('button', { name: 'Restore defaults' })).toBeInTheDocument()
  })
})
