import { useState, useRef, type FormEvent } from 'react'
import { useTaskStore } from '../store/useTaskStore'

export function TaskInput() {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTaskStore((s) => s.addTask)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please enter a task')
      return
    }
    setError('')
    addTask(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 p-4">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => { setText(e.target.value); if (error) setError('') }}
        placeholder="Add a task..."
        aria-label="New task"
        autoFocus
        aria-invalid={!!error || undefined}
        aria-describedby="input-error"
        className={`flex-1 rounded-lg border px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'}`}
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Add
      </button>
      <p id="input-error" role="alert" className="sr-only">{error}</p>
    </form>
  )
}
