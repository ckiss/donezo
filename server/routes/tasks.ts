// Identity-agnostic API routes (FR-10).
// All tasks returned regardless of user. No auth middleware, no user context.
// To support multi-user in v2: add userId column, auth middleware, filter by user.
import type { FastifyInstance, FastifyError } from 'fastify'
import { prisma } from '../db.ts'

const MAX_TEXT_LENGTH = 500

const createTaskSchema = {
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string' },
    },
  },
}

const updateTaskSchema = {
  body: {
    type: 'object',
    required: ['completed'],
    properties: {
      completed: { type: 'boolean' },
    },
  },
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  },
}

const deleteTaskSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  },
}

export async function taskRoutes(app: FastifyInstance) {
  // GET /api/tasks — list all tasks ordered by createdAt descending
  app.get('/api/tasks', async () => {
    return prisma.task.findMany({ orderBy: { createdAt: 'desc' } })
  })

  // POST /api/tasks — create a task
  app.post('/api/tasks', { schema: createTaskSchema }, async (request, reply) => {
    const { text } = request.body as { text: string }
    const trimmed = text.trim()

    if (!trimmed) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Task text is required',
      })
    }

    if (trimmed.length > MAX_TEXT_LENGTH) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: `Task text must not exceed ${MAX_TEXT_LENGTH} characters`,
      })
    }

    const task = await prisma.task.create({
      data: { text: trimmed },
    })

    return reply.status(201).send(task)
  })

  // PATCH /api/tasks/:id — update task (set completed state)
  app.patch('/api/tasks/:id', { schema: updateTaskSchema }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { completed } = request.body as { completed: boolean }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Task not found',
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: { completed },
    })

    return reply.status(200).send(task)
  })

  // DELETE /api/tasks/:id — delete a task
  app.delete('/api/tasks/:id', { schema: deleteTaskSchema }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'Task not found',
      })
    }

    await prisma.task.delete({ where: { id } })

    return reply.status(204).send()
  })

  // Global error handler for unhandled errors
  app.setErrorHandler(async (error: FastifyError, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })
}
