declare module 'cloudflare:workers' {
  interface ProvidedEnv {
    CORS_ALLOW_ORIGIN: Env['CORS_ALLOW_ORIGIN']
  }
}
