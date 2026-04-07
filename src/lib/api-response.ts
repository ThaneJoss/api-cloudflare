import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

interface ApiErrorPayload {
  code: string
  message: string
}

export function jsonSuccess<T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
) {
  return c.json(
    {
      success: true as const,
      data,
    },
    status,
  )
}

export function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  error: ApiErrorPayload,
) {
  return c.json(
    {
      success: false as const,
      error,
    },
    status,
  )
}
