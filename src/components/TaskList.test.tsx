import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskList } from './TaskList'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isLoading: false, error: null })
})

describe('TaskList', () => {
  it('renders loading indicator when isLoading is true', () => {
    useTaskStore.setState({ isLoading: true })
    render(<TaskList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('No tasks yet')).toBeNull()
  })

  it('renders empty state when no tasks and not loading', () => {
    render(<TaskList />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first task above')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('renders a single task with all controls', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete "Buy milk"/i })).toBeInTheDocument()
  })

  it('renders multiple tasks', () => {
    useTaskStore.setState({
      tasks: [
        { id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() },
        { id: '2', text: 'Walk dog', completed: false, createdAt: new Date().toISOString() },
      ],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })

  it('shows checkbox checked and line-through for completed task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Done task', completed: true, createdAt: new Date().toISOString() }],
    })
    render(<TaskList />)
    const checkbox = screen.getByRole('checkbox', { name: /mark "Done task"/i })
    expect(checkbox).toBeChecked()
    const text = screen.getByText('Done task')
    expect(text.className).toContain('line-through')
  })

  it('shows checkbox unchecked for incomplete task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Open task', completed: false, createdAt: new Date().toISOString() }],
    })
    render(<TaskList />)
    const checkbox = screen.getByRole('checkbox', { name: /mark "Open task"/i })
    expect(checkbox).not.toBeChecked()
    const text = screen.getByText('Open task')
    expect(text.className).not.toContain('line-through')
  })

  it('displays createdAt as human-readable timestamp', () => {
    const iso = '2026-04-02T10:00:00.000Z'
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Timed task', completed: false, createdAt: iso }],
    })
    render(<TaskList />)
    expect(screen.getByText('Timed task')).toBeInTheDocument()
    const formatted = new Date(iso).toLocaleString()
    expect(formatted).not.toBe('Invalid Date')
    expect(screen.getAllByText(formatted)).toHaveLength(2)
  })

  it('shows error message when error is set', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: new Date().toISOString() }],
      error: 'Unable to reach server. Please try again.',
    })
    render(<TaskList />)
    expect(screen.getByText('Unable to reach server. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument() // tasks preserved
  })

  it('shows error with empty task list', () => {
    useTaskStore.setState({ tasks: [], error: 'Unable to reach server. Please try again.' })
    render(<TaskList />)
    expect(screen.getByText('Unable to reach server. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })
})
