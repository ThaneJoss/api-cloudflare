# api-cloudflare

这是一个部署在 `https://api.thanejoss.com/api` 下的 Serverless JSON API，基于 Cloudflare Workers、Wrangler、Hono 和 TypeScript 构建。

## 接口列表

- `GET /api/health`
- `GET /api/services`
- `GET /api/apps`
- `POST /api/contact`

## 常用命令

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run deploy`

## 环境变量

- `CORS_ALLOW_ORIGIN`
  - 默认值：`https://thanejoss.com`
  - 支持用逗号分隔多个允许的来源

## 部署步骤

1. 使用 `npm install` 安装依赖
2. 使用 `npx wrangler login` 完成 Wrangler 登录
3. 使用 `npm run deploy` 部署到 Cloudflare Workers
