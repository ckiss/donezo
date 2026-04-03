import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowingChild(): never {
  throw new Error('Test render error')
}

function GoodChild() {
  return <p>All good</p>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>)
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders error fallback when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
    expect(screen.queryByText('Test render error')).toBeNull()
    spy.mockRestore()
  })

  it('does not show stack trace to user', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>)
    expect(screen.queryByText(/stack/i)).toBeNull()
    expect(screen.queryByText(/at ThrowingChild/i)).toBeNull()
    spy.mockRestore()
  })

  it('resets error on Try Again click', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true

    function ConditionalChild() {
      if (shouldThrow) throw new Error('Conditional error')
      return <p>Recovered</p>
    }

    render(<ErrorBoundary><ConditionalChild /></ErrorBoundary>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    shouldThrow = false
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('Recovered')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).toBeNull()
    spy.mockRestore()
  })
})
