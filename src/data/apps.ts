import type { AppItem } from '../lib/types'

export const apps: AppItem[] = [
  {
    id: 'portfolio-site',
    name: 'Portfolio Site',
    url: 'https://thanejoss.com',
    description: 'Public website consuming metadata from this API.',
    status: 'active',
  },
  {
    id: 'contact-intake',
    name: 'Contact Intake',
    url: 'https://api.thanejoss.com/api/contact',
    description: 'D1-backed contact intake workflow for inbound messages.',
    status: 'beta',
  },
]
