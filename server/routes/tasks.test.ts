// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildApp } from '../app.ts'
import { prisma } from '../db.ts'

beforeEach(async () => {
  await prisma.task.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/tasks', () => {
  it('creates a task and returns 201', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { text: 'Buy groceries' },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.text).toBe('Buy groceries')
    expect(body.completed).toBe(false)
    expect(body.id).toBeTruthy()
    expect(body.createdAt).toBeTruthy()

    // Verify persisted in database
    const dbTask = await prisma.task.findUnique({ where: { id: body.id } })
    expect(dbTask).not.toBeNull()
    expect(dbTask!.text).toBe('Buy groceries')

    await app.close()
  })

  it('trims text before storage', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { text: '  Walk the dog  ' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().text).toBe('Walk the dog')
    await app.close()
  })

  it('rejects empty text with 400', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { text: '' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Task text is required',
    })
    await app.close()
  })

  it('rejects whitespace-only text with 400', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { text: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Task text is required',
    })
    await app.close()
  })

  it('rejects text exceeding max length with 400', async () => {
    const app = await buildApp()
    const longText = 'a'.repeat(501)
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: { text: longText },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toBe('VALIDATION_ERROR')
    await app.close()
  })
})

describe('GET /api/tasks', () => {
  it('returns empty array when no tasks exist', async () => {
    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/api/tasks' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
    await app.close()
  })

  it('returns all tasks ordered by createdAt descending', async () => {
    await prisma.task.create({ data: { text: 'First' } })
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
    await prisma.task.create({ data: { text: 'Second' } })

    const app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/api/tasks' })

    expect(response.statusCode).toBe(200)
    const tasks = response.json()
    expect(tasks).toHaveLength(2)
    expect(tasks[0].text).toBe('Second')
    expect(tasks[1].text).toBe('First')
    await app.close()
  })
})

describe('PATCH /api/tasks/:id', () => {
  it('updates completed status and returns 200', async () => {
    const task = await prisma.task.create({ data: { text: 'Test' } })

    const app = await buildApp()
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${task.id}`,
      payload: { completed: true },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().completed).toBe(true)

    // Verify in database
    const updated = await prisma.task.findUnique({ where: { id: task.id } })
    expect(updated!.completed).toBe(true)
    await app.close()
  })

  it('returns 404 for non-existent task', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/tasks/00000000-0000-0000-0000-000000000000',
      payload: { completed: true },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: 'NOT_FOUND',
      message: 'Task not found',
    })
    await app.close()
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('deletes task and returns 204', async () => {
    const task = await prisma.task.create({ data: { text: 'To delete' } })

    const app = await buildApp()
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/tasks/${task.id}`,
    })

    expect(response.statusCode).toBe(204)
    expect(response.body).toBe('')

    // Verify removed from database
    const deleted = await prisma.task.findUnique({ where: { id: task.id } })
    expect(deleted).toBeNull()
    await app.close()
  })

  it('returns 404 for non-existent task', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/tasks/00000000-0000-0000-0000-000000000000',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      error: 'NOT_FOUND',
      message: 'Task not found',
    })
    await app.close()
  })
})
