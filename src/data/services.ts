import type { ServiceItem } from '../lib/types'

export const services: ServiceItem[] = [
  {
    id: 'api-design',
    name: 'API Design',
    category: 'consulting',
    description: 'Contract-first JSON API design for product and platform work.',
    status: 'active',
  },
  {
    id: 'platform-build',
    name: 'Platform Build',
    category: 'engineering',
    description: 'Serverless backend implementation, deployment, and integration.',
    status: 'active',
  },
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    category: 'operations',
    description: 'Internal tooling and automation for repeatable delivery tasks.',
    status: 'planned',
  },
]
