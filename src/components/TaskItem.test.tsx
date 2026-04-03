import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskList } from './TaskList'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isHydrated: true, hasError: false })
  localStorage.clear()
})

describe('TaskItem interactions', () => {
  it('toggles task completed state when checkbox clicked', async () => {
    const user = userEvent.setup()
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }],
    })
    render(<TaskList />)
    await user.click(screen.getByRole('checkbox', { name: /mark "Buy milk"/i }))
    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
    expect(screen.getByText('Buy milk').className).toContain('line-through')
  })

  it('removes task from store and DOM when delete clicked', async () => {
    const user = userEvent.setup()
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }],
    })
    render(<TaskList />)
    await user.click(screen.getByRole('button', { name: /delete "Buy milk"/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(0)
    expect(screen.queryByText('Buy milk')).toBeNull()
  })

  it('toggles completed task back to incomplete', async () => {
    const user = userEvent.setup()
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: true, createdAt: Date.now() }],
    })
    render(<TaskList />)
    await user.click(screen.getByRole('checkbox', { name: /mark "Buy milk"/i }))
    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).not.toBeChecked()
    expect(screen.getByText('Buy milk').className).not.toContain('line-through')
  })
})
