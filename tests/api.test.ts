import { env, exports } from 'cloudflare:workers'
import {
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import worker from '../src/index'

const isoTimestampSchema = z.string().refine((value) => {
  return !Number.isNaN(Date.parse(value))
}, 'Expected an ISO-compatible datetime string.')

const errorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .strict(),
  })
  .strict()

const healthEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        status: z.literal('ok'),
        service: z.literal('api.thanejoss.com'),
        timestamp: isoTimestampSchema,
      })
      .strict(),
  })
  .strict()

const contactReceiptEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        submissionId: z.uuid(),
        receivedAt: isoTimestampSchema,
        status: z.literal('queued'),
      })
      .strict(),
  })
  .strict()

function parseContract<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload)

  if (!result.success) {
    throw new Error(JSON.stringify(result.error.format(), null, 2))
  }

  return result.data
}

function expectJsonResponse(response: Response, status: number) {
  expect(response.status).toBe(status)
  expect(response.headers.get('Content-Type')).toContain('application/json')
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
  it('GET /api/health matches the public contract', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/health', {
        headers: {
          Origin: env.CORS_ALLOW_ORIGIN,
        },
      }),
    )
    const body = parseContract(healthEnvelopeSchema, await response.json())

    expectJsonResponse(response, 200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      env.CORS_ALLOW_ORIGIN,
    )
    expect(body.data.timestamp).toBe(new Date(body.data.timestamp).toISOString())
  })

  it('POST /api/contact matches the success receipt contract', async () => {
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
    const body = parseContract(
      contactReceiptEnvelopeSchema,
      await response.json(),
    )
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

    expectJsonResponse(response, 202)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      env.CORS_ALLOW_ORIGIN,
    )
    expect(body.data.status).toBe('queued')
    expect(storedSubmission).toMatchObject({
      submission_id: body.data.submissionId,
      name: requestPayload.name,
      email: requestPayload.email,
      message: requestPayload.message,
      status: body.data.status,
      received_at: body.data.receivedAt,
    })
  })

  it('POST /api/contact returns the invalid JSON error contract', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"broken"',
      }),
    )
    const body = parseContract(errorEnvelopeSchema, await response.json())

    expectJsonResponse(response, 400)
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON.',
      },
    })
  })

  it('POST /api/contact returns the validation error contract', async () => {
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
    const body = parseContract(errorEnvelopeSchema, await response.json())

    expectJsonResponse(response, 400)
    expect(body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'name, email, and message are required and must be valid.',
      },
    })
  })

  it('returns the not found error contract for unknown /api routes', async () => {
    const response = await exports.default.fetch(
      'http://example.com/api/unknown-route',
    )
    const body = parseContract(errorEnvelopeSchema, await response.json())

    expectJsonResponse(response, 404)
    expect(body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API route not found.',
      },
    })
  })

  it('returns the not found error contract for removed content endpoints', async () => {
    for (const path of ['/api/services', '/api/apps']) {
      const response = await exports.default.fetch(`http://example.com${path}`)
      const body = parseContract(errorEnvelopeSchema, await response.json())

      expectJsonResponse(response, 404)
      expect(body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API route not found.',
        },
      })
    }
  })

  it('handles the allowed CORS preflight contract', async () => {
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
    expect(await response.text()).toBe('')
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

  it('handles the denied CORS preflight contract', async () => {
    const response = await exports.default.fetch(
      new Request('http://example.com/api/contact', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.thanejoss.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }),
    )
    const body = parseContract(errorEnvelopeSchema, await response.json())

    expectJsonResponse(response, 403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(response.headers.get('Vary')).toContain('Origin')
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CORS_ORIGIN_DENIED',
        message: 'Origin is not allowed.',
      },
    })
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

    expectJsonResponse(response, 200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://admin.thanejoss.com',
    )
  })
})
