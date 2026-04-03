import { useTaskStore } from '../store/useTaskStore'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const isHydrated = useTaskStore((s) => s.isHydrated)
  const hasError = useTaskStore((s) => s.hasError)
  const clearError = useTaskStore((s) => s.clearError)

  if (!isHydrated) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {hasError && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-800">Changes may not be saved — storage error occurred</p>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-amber-600 underline hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No tasks yet</p>
          <p className="mt-1 text-xs text-gray-500">Add your first task above</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </>
  )
}
