// Identity-agnostic task model.
// To support multi-user in v2: add `userId: string` field and user context to the store.
// No structural redesign needed — only additive changes required (FR-10).
export interface Task {
  id: string        // crypto.randomUUID() — never sequential integers
  text: string      // trimmed before storage; never empty string
  completed: boolean
  createdAt: number // milliseconds since epoch — Date.now()
}
