import { render, screen } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import App from './App'

// Mock fetch for fetchTasks call on mount
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockReturnValue(
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
  )
})

describe('App', () => {
  it('renders the Donezo heading', () => {
    render(<App />)
    expect(screen.getByText('Donezo')).toBeInTheDocument()
  })
})
