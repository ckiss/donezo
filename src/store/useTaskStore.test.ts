import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTaskStore } from './useTaskStore'

// Mock fetch for API calls
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

describe('fetchTasks', () => {
  it('fetches tasks from API and sets them in store', async () => {
    const tasks = [
      { id: '1', text: 'Task A', completed: false, createdAt: '2026-04-06T00:00:00.000Z' },
    ]
    mockFetch.mockReturnValueOnce(jsonResponse(tasks))

    await useTaskStore.getState().fetchTasks()

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks')
    expect(useTaskStore.getState().tasks).toEqual(tasks)
    expect(useTaskStore.getState().isLoading).toBe(false)
  })

  it('sets isLoading during fetch', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse([]))

    const promise = useTaskStore.getState().fetchTasks()
    expect(useTaskStore.getState().isLoading).toBe(true)
    await promise
    expect(useTaskStore.getState().isLoading).toBe(false)
  })

  it('sets error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

    await useTaskStore.getState().fetchTasks()

    expect(useTaskStore.getState().error).toBe('Unable to reach server. Please try again.')
    expect(useTaskStore.getState().isLoading).toBe(false)
  })
})

describe('addTask', () => {
  it('calls POST and appends returned task', async () => {
    const newTask = { id: '1', text: 'Buy milk', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    mockFetch.mockReturnValueOnce(jsonResponse(newTask, 201))

    await useTaskStore.getState().addTask('Buy milk')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'Buy milk' }),
    }))
    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0]).toEqual(newTask)
  })

  it('trims text before sending', async () => {
    const task = { id: '1', text: 'Walk dog', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    mockFetch.mockReturnValueOnce(jsonResponse(task, 201))

    await useTaskStore.getState().addTask('  Walk dog  ')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      body: JSON.stringify({ text: 'Walk dog' }),
    }))
  })

  it('rejects empty string without calling API', async () => {
    await useTaskStore.getState().addTask('')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('rejects whitespace-only string without calling API', async () => {
    await useTaskStore.getState().addTask('   ')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sets error on API failure', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ error: 'VALIDATION_ERROR', message: 'Task text is required' }, 400))

    await useTaskStore.getState().addTask('test')

    expect(useTaskStore.getState().error).toBe('Task text is required')
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('sets error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

    await useTaskStore.getState().addTask('test')

    expect(useTaskStore.getState().error).toBe('Unable to reach server. Please try again.')
  })
})

describe('toggleTask', () => {
  it('sends PATCH with opposite completed state and replaces task', async () => {
    const task = { id: '1', text: 'Test', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    useTaskStore.setState({ tasks: [task] })

    const updated = { ...task, completed: true }
    mockFetch.mockReturnValueOnce(jsonResponse(updated))

    await useTaskStore.getState().toggleTask('1')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    }))
    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
  })

  it('only updates the matching task', async () => {
    const taskA = { id: '1', text: 'A', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    const taskB = { id: '2', text: 'B', completed: false, createdAt: '2026-04-06T00:01:00.000Z' }
    useTaskStore.setState({ tasks: [taskA, taskB] })

    mockFetch.mockReturnValueOnce(jsonResponse({ ...taskA, completed: true }))

    await useTaskStore.getState().toggleTask('1')

    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
    expect(useTaskStore.getState().tasks[1].completed).toBe(false)
  })

  it('does nothing for non-existent task', async () => {
    await useTaskStore.getState().toggleTask('nonexistent')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('deleteTask', () => {
  it('calls DELETE and removes task from store after 204', async () => {
    const task = { id: '1', text: 'Test', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    useTaskStore.setState({ tasks: [task] })

    mockFetch.mockReturnValueOnce(emptyResponse(204))

    await useTaskStore.getState().deleteTask('1')

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' })
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('preserves other tasks when one is deleted', async () => {
    const taskA = { id: '1', text: 'A', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    const taskB = { id: '2', text: 'B', completed: false, createdAt: '2026-04-06T00:01:00.000Z' }
    useTaskStore.setState({ tasks: [taskA, taskB] })

    mockFetch.mockReturnValueOnce(emptyResponse(204))

    await useTaskStore.getState().deleteTask('1')

    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('B')
  })

  it('sets error on API failure', async () => {
    const task = { id: '1', text: 'Test', completed: false, createdAt: '2026-04-06T00:00:00.000Z' }
    useTaskStore.setState({ tasks: [task] })

    mockFetch.mockReturnValueOnce(jsonResponse({ error: 'NOT_FOUND', message: 'Task not found' }, 404))

    await useTaskStore.getState().deleteTask('1')

    expect(useTaskStore.getState().error).toBe('Task not found')
    // Task should still be in store since delete failed
    expect(useTaskStore.getState().tasks).toHaveLength(1)
  })
})
