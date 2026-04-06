import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskInput } from './TaskInput'
import { useTaskStore } from '../store/useTaskStore'

// Mock fetch for async store actions
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response)
}

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isLoading: false, error: null })
  mockFetch.mockReset()
})

describe('TaskInput', () => {
  it('adds a task on valid submit', async () => {
    const task = { id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }
    mockFetch.mockReturnValueOnce(jsonResponse(task, 201))

    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('Buy milk')
  })

  it('clears input after valid submit', async () => {
    const task = { id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }
    mockFetch.mockReturnValueOnce(jsonResponse(task, 201))

    const user = userEvent.setup()
    render(<TaskInput />)
    const input = screen.getByPlaceholderText('Add a task...')
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(input).toHaveValue('')
  })

  it('does not add task on empty submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('does not add task on whitespace-only submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('submits on Enter key', async () => {
    const task = { id: '1', text: 'Walk dog', completed: false, createdAt: new Date().toISOString() }
    mockFetch.mockReturnValueOnce(jsonResponse(task, 201))

    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Walk dog{Enter}')

    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('Walk dog')
  })
})
