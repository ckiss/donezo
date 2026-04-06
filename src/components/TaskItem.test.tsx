import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskList } from './TaskList'
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

function emptyResponse(status = 204) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(null),
  } as Response)
}

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isLoading: false, error: null })
  mockFetch.mockReset()
})

describe('TaskItem interactions', () => {
  it('toggles task completed state when checkbox clicked', async () => {
    const task = { id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }
    useTaskStore.setState({ tasks: [task] })

    const updatedTask = { ...task, completed: true }
    mockFetch.mockReturnValueOnce(jsonResponse(updatedTask))

    const user = userEvent.setup()
    render(<TaskList />)
    await user.click(screen.getByRole('checkbox', { name: /mark "Buy milk"/i }))

    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
  })

  it('removes task from store and DOM when delete clicked', async () => {
    const task = { id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }
    useTaskStore.setState({ tasks: [task] })

    mockFetch.mockReturnValueOnce(emptyResponse(204))

    const user = userEvent.setup()
    render(<TaskList />)
    await user.click(screen.getByRole('button', { name: /delete "Buy milk"/i }))

    expect(useTaskStore.getState().tasks).toHaveLength(0)
    expect(screen.queryByText('Buy milk')).toBeNull()
  })

  it('toggles completed task back to incomplete', async () => {
    const task = { id: '1', text: 'Buy milk', completed: true, createdAt: new Date().toISOString() }
    useTaskStore.setState({ tasks: [task] })

    const updatedTask = { ...task, completed: false }
    mockFetch.mockReturnValueOnce(jsonResponse(updatedTask))

    const user = userEvent.setup()
    render(<TaskList />)
    await user.click(screen.getByRole('checkbox', { name: /mark "Buy milk"/i }))

    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).not.toBeChecked()
  })
})
