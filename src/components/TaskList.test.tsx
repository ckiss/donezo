import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskList } from './TaskList'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isHydrated: true, hasError: false })
  localStorage.clear()
})

describe('TaskList', () => {
  it('renders loading indicator when store is not hydrated', () => {
    useTaskStore.setState({ tasks: [], isHydrated: false })
    render(<TaskList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('No tasks yet')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('transitions from loading to empty state when hydration completes', () => {
    useTaskStore.setState({ tasks: [], isHydrated: false })
    render(<TaskList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Simulate hydration completing
    act(() => {
      useTaskStore.setState({ isHydrated: true })
    })
    expect(screen.queryByText('Loading...')).toBeNull()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders a single task with all controls', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete "Buy milk"/i })).toBeInTheDocument()
  })

  it('renders multiple tasks', () => {
    useTaskStore.setState({
      tasks: [
        { id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Walk dog', completed: false, createdAt: Date.now() },
      ],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })

  it('renders empty state when store has no tasks', () => {
    render(<TaskList />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first task above')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows checkbox checked and line-through for completed task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Done task', completed: true, createdAt: Date.now() }],
    })
    render(<TaskList />)
    const checkbox = screen.getByRole('checkbox', { name: /mark "Done task"/i })
    expect(checkbox).toBeChecked()
    const text = screen.getByText('Done task')
    expect(text.className).toContain('line-through')
  })

  it('shows checkbox unchecked for incomplete task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Open task', completed: false, createdAt: Date.now() }],
    })
    render(<TaskList />)
    const checkbox = screen.getByRole('checkbox', { name: /mark "Open task"/i })
    expect(checkbox).not.toBeChecked()
    const text = screen.getByText('Open task')
    expect(text.className).not.toContain('line-through')
  })

  it('displays createdAt as human-readable timestamp', () => {
    const ts = new Date('2026-04-02T10:00:00').getTime()
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Timed task', completed: false, createdAt: ts }],
    })
    render(<TaskList />)
    expect(screen.getByText('Timed task')).toBeInTheDocument()
    // Verify a timestamp element exists that is not "Invalid Date"
    const formatted = new Date(ts).toLocaleString()
    expect(formatted).not.toBe('Invalid Date')
    expect(screen.getAllByText(formatted)).toHaveLength(2)
  })

  it('shows storage error banner when hasError is true', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }],
      hasError: true,
    })
    render(<TaskList />)
    expect(screen.getByText(/storage error/i)).toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument() // tasks preserved
    expect(screen.getByText('Dismiss')).toBeInTheDocument()
  })

  it('shows storage error banner with empty state', () => {
    useTaskStore.setState({ tasks: [], hasError: true })
    render(<TaskList />)
    expect(screen.getByText(/storage error/i)).toBeInTheDocument()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })
})
