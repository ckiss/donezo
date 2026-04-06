// Identity-agnostic task model.
// To support multi-user in v2: add `userId: string` field and user context to the store.
// No structural redesign needed — only additive changes required (FR-10).
export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string // ISO 8601 from API (Fastify JSON serializes Date → string)
}
