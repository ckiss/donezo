import type { Task } from '../types'
import { useTaskStore } from '../store/useTaskStore'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const toggleTask = useTaskStore((s) => s.toggleTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  const formattedDate = new Date(task.createdAt).toLocaleString()

  return (
    <li className="flex items-start gap-3 p-4 border-b border-gray-100 sm:items-center">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTask(task.id)}
        className="h-5 w-5 shrink-0 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="min-w-0 flex-1">
        <span
          title={task.text}
          className={`block truncate text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
        >
          {task.text}
        </span>
        <span className="block text-xs text-gray-500 sm:hidden">{formattedDate}</span>
      </div>
      <span aria-hidden="true" className="hidden shrink-0 text-xs text-gray-500 sm:inline">{formattedDate}</span>
      <button
        onClick={() => deleteTask(task.id)}
        className="shrink-0 rounded px-3 py-2 text-xs text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        aria-label={`Delete "${task.text}"`}
      >
        Delete
      </button>
    </li>
  )
}
