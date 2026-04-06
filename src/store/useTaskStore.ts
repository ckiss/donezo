import { create } from 'zustand'
import type { Task } from '../types'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  addTask: (text: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

// All task state lives here. No component should hold task state locally.
// Store actions are async — each calls the API via fetch with relative URLs.
// Pessimistic updates: await API response before updating local state.
// To support multi-user in v2: add userId to actions and filter by user context.
export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  // Fetch all tasks from API — used on app mount
  fetchTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const tasks: Task[] = await res.json()
      set({ tasks, isLoading: false })
    } catch {
      set({ error: 'Unable to reach server. Please try again.', isLoading: false })
    }
  },

  // Create a task — client trims + rejects empty, then calls POST
  addTask: async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    set({ error: null })
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) {
        const err = await res.json()
        set({ error: err.message ?? 'Failed to add task' })
        return
      }
      const task: Task = await res.json()
      set((state) => ({ tasks: [...state.tasks, task] }))
    } catch {
      set({ error: 'Unable to reach server. Please try again.' })
    }
  },

  // Toggle completion — sends desired state, replaces with API response
  toggleTask: async (id: string) => {
    const current = get().tasks.find((t) => t.id === id)
    if (!current) return
    set({ error: null })
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !current.completed }),
      })
      if (!res.ok) {
        const err = await res.json()
        set({ error: err.message ?? 'Failed to update task' })
        return
      }
      const updated: Task = await res.json()
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }))
    } catch {
      set({ error: 'Unable to reach server. Please try again.' })
    }
  },

  // Delete task — removes from local state after 204 confirmed
  deleteTask: async (id: string) => {
    set({ error: null })
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        set({ error: err.message ?? 'Failed to delete task' })
        return
      }
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    } catch {
      set({ error: 'Unable to reach server. Please try again.' })
    }
  },
}))
