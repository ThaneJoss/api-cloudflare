import type { MiddlewareHandler } from 'hono'

import { jsonError } from './api-response'
import type { AppBindings } from './types'

const DEFAULT_ALLOWED_ORIGINS = ['https://thanejoss.com']
const ALLOWED_METHODS = 'GET,POST,OPTIONS'

function resolveAllowedOrigins(configuredOrigins?: string): string[] {
  const parsedOrigins = configuredOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (parsedOrigins && parsedOrigins.length > 0) {
    return parsedOrigins
  }

  return DEFAULT_ALLOWED_ORIGINS
}

function applyCorsHeaders(
  headers: Headers,
  origin: string | null,
  allowedOrigins: string[],
  requestedHeaders: string | null,
) {
  headers.set('Vary', 'Origin')
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
  headers.set(
    'Access-Control-Allow-Headers',
    requestedHeaders?.trim() || 'Content-Type',
  )

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
}

export function corsMiddleware(): MiddlewareHandler<{ Bindings: AppBindings }> {
  return async (c, next) => {
    const origin = c.req.header('Origin') ?? null
    const allowedOrigins = resolveAllowedOrigins(c.env.CORS_ALLOW_ORIGIN)

    if (c.req.method === 'OPTIONS') {
      if (origin && !allowedOrigins.includes(origin)) {
        const response = jsonError(c, 403, {
          code: 'CORS_ORIGIN_DENIED',
          message: 'Origin is not allowed.',
        })

        response.headers.set('Vary', 'Origin')
        return response
      }

      const headers = new Headers()
      applyCorsHeaders(
        headers,
        origin,
        allowedOrigins,
        c.req.header('Access-Control-Request-Headers') ?? null,
      )

      return new Response(null, { status: 204, headers })
    }

    await next()

    applyCorsHeaders(
      c.res.headers,
      origin,
      allowedOrigins,
      c.req.header('Access-Control-Request-Headers') ?? null,
    )
  }
}
