import { Hono } from 'hono'

import { services } from '../data/services'
import { jsonSuccess } from '../lib/api-response'
import type { AppBindings } from '../lib/types'

export const servicesRoute = new Hono<{ Bindings: AppBindings }>()

servicesRoute.get('/', (c) => {
  return jsonSuccess(c, services)
})
