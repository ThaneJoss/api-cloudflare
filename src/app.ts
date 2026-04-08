import { Hono } from 'hono'

import { contactRoute } from './routes/contact-route'
import { healthRoute } from './routes/health-route'
import { jsonError } from './lib/api-response'
import { corsMiddleware } from './lib/cors'
import type { AppBindings } from './lib/types'

export function createApp() {
  const app = new Hono<{ Bindings: AppBindings }>()
  const api = new Hono<{ Bindings: AppBindings }>()

  api.use('*', corsMiddleware())
  api.route('/health', healthRoute)
  api.route('/contact', contactRoute)
  api.notFound((c) =>
    jsonError(c, 404, {
      code: 'NOT_FOUND',
      message: 'API route not found.',
    }),
  )

  app.route('/api', api)
  app.notFound((c) => {
    const message = c.req.path.startsWith('/api')
      ? 'API route not found.'
      : 'Route not found.'

    return jsonError(c, 404, {
      code: 'NOT_FOUND',
      message,
    })
  })
  app.onError((error, c) => {
    console.error(error)

    return jsonError(c, 500, {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error.',
    })
  })

  return app
}

export const app = createApp()
