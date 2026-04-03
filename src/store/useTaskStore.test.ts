import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from './useTaskStore'
import { STORAGE_KEY } from '../constants'

beforeEach(() => {
  // Reset in-memory store state and clear localStorage between tests
  useTaskStore.setState({ tasks: [], isHydrated: true, hasError: false })
  localStorage.clear()
})

describe('addTask', () => {
  it('creates a task with correct shape', () => {
    useTaskStore.getState().addTask('Buy milk')
    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({
      text: 'Buy milk',
      completed: false,
    })
    expect(tasks[0].id).toBeTruthy()
    expect(typeof tasks[0].createdAt).toBe('number')
  })

  it('rejects empty string', () => {
    useTaskStore.getState().addTask('')
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('rejects whitespace-only string', () => {
    useTaskStore.getState().addTask('   ')
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('trims text before storage', () => {
    useTaskStore.getState().addTask('  Walk dog  ')
    expect(useTaskStore.getState().tasks[0].text).toBe('Walk dog')
  })

  it('generates unique ids for multiple tasks', () => {
    useTaskStore.getState().addTask('Task A')
    useTaskStore.getState().addTask('Task B')
    const { tasks } = useTaskStore.getState()
    expect(tasks[0].id).not.toBe(tasks[1].id)
  })
})

describe('toggleTask', () => {
  it('flips completed from false to true', () => {
    useTaskStore.getState().addTask('Test task')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().toggleTask(id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
  })

  it('flips completed from true back to false', () => {
    useTaskStore.getState().addTask('Test task')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().toggleTask(id)
    useTaskStore.getState().toggleTask(id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
  })

  it('only toggles the matching task', () => {
    useTaskStore.getState().addTask('Task A')
    useTaskStore.getState().addTask('Task B')
    const idA = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().toggleTask(idA)
    const { tasks } = useTaskStore.getState()
    expect(tasks[0].completed).toBe(true)
    expect(tasks[1].completed).toBe(false)
  })
})

describe('deleteTask', () => {
  it('removes the matching task', () => {
    useTaskStore.getState().addTask('Task A')
    useTaskStore.getState().addTask('Task B')
    const idA = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().deleteTask(idA)
    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].text).toBe('Task B')
  })

  it('leaves an empty array when the last task is deleted', () => {
    useTaskStore.getState().addTask('Only task')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().deleteTask(id)
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })
})

describe('localStorage persistence', () => {
  it('writes tasks to localStorage after addTask', () => {
    useTaskStore.getState().addTask('Persisted task')
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    // Zustand persist stores: { state: { tasks: [...] }, version: 0 }
    const parsed = JSON.parse(raw!)
    expect(parsed.state.tasks[0].text).toBe('Persisted task')
  })

  it('reflects deleteTask in localStorage', () => {
    useTaskStore.getState().addTask('To be deleted')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().deleteTask(id)
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw!)
    expect(parsed.state.tasks).toHaveLength(0)
  })
})
