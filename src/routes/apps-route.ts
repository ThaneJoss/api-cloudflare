import { Hono } from 'hono'

import { apps } from '../data/apps'
import { jsonSuccess } from '../lib/api-response'
import type { AppBindings } from '../lib/types'

export const appsRoute = new Hono<{ Bindings: AppBindings }>()

appsRoute.get('/', (c) => {
  return jsonSuccess(c, apps)
})
