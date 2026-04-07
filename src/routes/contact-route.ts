import { Hono } from 'hono'

import { jsonError, jsonSuccess } from '../lib/api-response'
import {
  contactPayloadSchema,
  type ContactPayload,
} from '../lib/contact-schema'
import { storeContactSubmission } from '../lib/contact-submission-store'
import type { AppBindings } from '../lib/types'

export const contactRoute = new Hono<{ Bindings: AppBindings }>()

contactRoute.post('/', async (c) => {
  const database = c.env.CONTACT_DB

  if (!database) {
    return jsonError(c, 500, {
      code: 'DATABASE_UNAVAILABLE',
      message: 'Contact database is not configured.',
    })
  }

  let payload: ContactPayload

  try {
    const body = await c.req.json()
    const result = contactPayloadSchema.safeParse(body)

    if (!result.success) {
      return jsonError(c, 400, {
        code: 'VALIDATION_ERROR',
        message: 'name, email, and message are required and must be valid.',
      })
    }

    payload = result.data
  } catch {
    return jsonError(c, 400, {
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON.',
    })
  }

  try {
    const receipt = await storeContactSubmission(database, payload)

    return jsonSuccess(c, receipt, 202)
  } catch (error) {
    console.error(error)

    return jsonError(c, 500, {
      code: 'DATABASE_WRITE_FAILED',
      message: 'Failed to store contact submission.',
    })
  }
})
