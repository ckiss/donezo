import './App.css'
import { TaskInput } from './components/TaskInput'
import { TaskList } from './components/TaskList'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="text-blue-700 text-2xl font-bold mb-4">Donezo</h1>
        <TaskInput />
        <ErrorBoundary>
          <TaskList />
        </ErrorBoundary>
      </div>
    </main>
  )
}

export default App
