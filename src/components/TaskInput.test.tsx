import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskInput } from './TaskInput'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isHydrated: true, hasError: false })
  localStorage.clear()
})

describe('TaskInput', () => {
  it('adds a task on valid submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('Buy milk')
  })

  it('clears input and refocuses after valid submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    const input = screen.getByPlaceholderText('Add a task...')
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('does not add task on empty submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('does not add task on whitespace-only submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('submits on Enter key', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Walk dog{Enter}')
    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('Walk dog')
  })
})
