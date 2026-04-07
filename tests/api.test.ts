import { env, exports } from 'cloudflare:workers'
import {
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import worker from '../src/index'

interface SuccessEnvelope<T> {
  success: true
  data: T
}

interface ErrorEnvelope {
  success: false
  error: {
    code: string
    message: string
  }
}

interface HealthPayload {
  status: 'ok'
  service: string
  timestamp: string
}

interface ContactReceipt {
  submissionId: string
  receivedAt: string
  status: 'queued'
}

interface StoredContactSubmission {
  submission_id: string
  name: string
  email: string
  message: string
  status: 'queued'
  received_at: string
}

describe('API contract', () => {
  it('GET /api/health returns 200', async () => {
    const response = await exports.default.fetch('http://example.com/api/health')
    const body = (await response.json()) as SuccessEnvelope<HealthPayload>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        service: 'api.thanejoss.com',
      },
    })
    expect(typeof body.data.timestamp).toBe('string')
  })

  it('GET /api/services returns 200', async () => {
    const response = await exports.default.fetch(
      'http://example.com/api/services',
    )
    const body = (await response.json()) as SuccessEnvelope<unknown[]>

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('GET /api/apps returns 200', async () => {
    const response = await exports.default.fetch('http://example.com/api/apps')
    const body = (await response.json()) as SuccessEnvelope<unknown[]>

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('POST /api/contact returns 202 for valid payloads', async () => {
    const requestPayload = {
      name: 'Thane Joss',
      email: 'thane@example.com',
      message: 'Need help with a serverless backend.',
    }
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: env.CORS_ALLOW_ORIGIN,
        },
        body: JSON.stringify(requestPayload),
      }),
    )
    const body = (await response.json()) as SuccessEnvelope<ContactReceipt>
    const storedSubmission =
      await env.CONTACT_DB.prepare(
        `
          SELECT
            submission_id,
            name,
            email,
            message,
            status,
            received_at
          FROM contact_submissions
          WHERE submission_id = ?
        `,
      )
        .bind(body.data.submissionId)
        .first<StoredContactSubmission>()

    expect(response.status).toBe(202)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      env.CORS_ALLOW_ORIGIN,
    )
    expect(body).toMatchObject({
      success: true,
      data: {
        status: 'queued',
      },
    })
    expect(typeof body.data.submissionId).toBe('string')
    expect(typeof body.data.receivedAt).toBe('string')
    expect(storedSubmission).toMatchObject({
      submission_id: body.data.submissionId,
      name: requestPayload.name,
      email: requestPayload.email,
      message: requestPayload.message,
      status: body.data.status,
      received_at: body.data.receivedAt,
    })
  })

  it('POST /api/contact returns 400 for invalid JSON', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"broken"',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json<ErrorEnvelope>()).resolves.toEqual({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON.',
      },
    })
  })

  it('POST /api/contact returns 400 for validation failures', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: 'not-an-email',
          message: '',
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json<ErrorEnvelope>()).resolves.toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'name, email, and message are required and must be valid.',
      },
    })
  })

  it('returns 404 for unknown /api routes', async () => {
    const response = await exports.default.fetch(
      'http://example.com/api/unknown-route',
    )

    expect(response.status).toBe(404)
    await expect(response.json<ErrorEnvelope>()).resolves.toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API route not found.',
      },
    })
  })

  it('handles CORS for https://thanejoss.com', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://thanejoss.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }),
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://thanejoss.com',
    )
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
      'POST',
    )
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type',
    )
    expect(response.headers.get('Vary')).toContain('Origin')
  })

  it('supports comma-separated CORS_ALLOW_ORIGIN values', async () => {
    const request = new Request('http://example.com/api/health', {
      headers: {
        Origin: 'https://admin.thanejoss.com',
      },
    })
    const ctx = createExecutionContext()
    const response = await worker.fetch(
      request,
      {
        ...env,
        CORS_ALLOW_ORIGIN:
          'https://thanejoss.com, https://admin.thanejoss.com',
      },
      ctx,
    )

    await waitOnExecutionContext(ctx)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://admin.thanejoss.com',
    )
  })
})
