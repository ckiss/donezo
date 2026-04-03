import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Task } from '../types'
import { STORAGE_KEY } from '../constants'

interface TaskStore {
  tasks: Task[]
  isHydrated: boolean
  hasError: boolean
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  clearError: () => void
}

// Safe localStorage wrapper that catches write errors (e.g., QuotaExceededError)
const safeLocalStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      useTaskStore.setState({ hasError: true })
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}

// All task state lives here. No component should hold task state locally.
// To support multi-user in v2: add userId to addTask and filter by user context.
export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      isHydrated: false,
      hasError: false,

      // Guard: rejects empty/whitespace text (FR-01, AC-2)
      addTask: (text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: crypto.randomUUID(),
              text: trimmed,
              completed: false,
              createdAt: Date.now(),
            },
          ],
        }))
      },

      // Immutable toggle — spreads task and flips completed (FR-03)
      toggleTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }))
      },

      // Immutable delete — filters out matching id (FR-04)
      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      clearError: () => set({ hasError: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ tasks: state.tasks }), // only persist tasks — exclude isHydrated, hasError
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          useTaskStore.setState({ hasError: true, isHydrated: true })
        }
      },
    }
  )
)

// Set isHydrated after persist middleware finishes rehydration from localStorage
if (useTaskStore.persist.hasHydrated()) {
  useTaskStore.setState({ isHydrated: true })
} else {
  useTaskStore.persist.onFinishHydration(() => {
    useTaskStore.setState({ isHydrated: true })
  })
}
