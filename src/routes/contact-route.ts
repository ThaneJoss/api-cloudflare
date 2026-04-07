import { Hono } from 'hono'

import { jsonError, jsonSuccess } from '../lib/api-response'
import {
  contactPayloadSchema,
  type ContactPayload,
} from '../lib/contact-schema'
import type { AppBindings } from '../lib/types'

export const contactRoute = new Hono<{ Bindings: AppBindings }>()

contactRoute.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const result = contactPayloadSchema.safeParse(body as ContactPayload)

    if (!result.success) {
      return jsonError(c, 400, {
        code: 'VALIDATION_ERROR',
        message: 'name, email, and message are required and must be valid.',
      })
    }
  } catch {
    return jsonError(c, 400, {
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON.',
    })
  }

  return jsonSuccess(
    c,
    {
      submissionId: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      status: 'queued',
    },
    202,
  )
})
