# api-cloudflare

A serverless JSON API for `https://api.thanejoss.com/api`, built with Cloudflare Workers, Wrangler, Hono, and TypeScript.

## Endpoints

- `GET /api/health`
- `GET /api/services`
- `GET /api/apps`
- `POST /api/contact`

## Commands

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run deploy`

## Environment

- `CORS_ALLOW_ORIGIN`
  - Default: `https://thanejoss.com`
  - Supports comma-separated values for multiple allowed origins

## Deploy

1. Install dependencies with `npm install`
2. Authenticate Wrangler with `npx wrangler login`
3. Deploy with `npm run deploy`
