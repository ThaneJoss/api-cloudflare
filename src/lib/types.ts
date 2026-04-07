export interface AppBindings {
  CORS_ALLOW_ORIGIN?: string
  CONTACT_DB?: D1Database
}

export interface ServiceItem {
  id: string
  name: string
  category: string
  description: string
  status: 'active' | 'planned'
}

export interface AppItem {
  id: string
  name: string
  url: string
  description: string
  status: 'active' | 'beta'
}
