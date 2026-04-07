import { Hono } from 'hono'

import { jsonSuccess } from '../lib/api-response'
import type { AppBindings } from '../lib/types'

export const healthRoute = new Hono<{ Bindings: AppBindings }>()

healthRoute.get('/', (c) => {
  return jsonSuccess(c, {
    status: 'ok',
    service: 'api.thanejoss.com',
    timestamp: new Date().toISOString(),
  })
})
