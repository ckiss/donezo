// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildApp } from '../app.ts'

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const app = await buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })

    await app.close()
  })
})
