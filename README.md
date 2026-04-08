# api-cloudflare

这是一个部署在 `https://api.thanejoss.com/api` 下的 Serverless JSON API，基于 Cloudflare Workers、Wrangler、Hono 和 TypeScript 构建。

## 接口列表

- `GET /api/health`
- `POST /api/contact`

当前 API 只保留真正需要服务端承载的能力：

- `GET /api/health`
  - 用于验活和基础排障
- `POST /api/contact`
  - 校验 `name`、`email`、`message`
  - 把提交内容写入 Cloudflare D1
  - 返回排队回执

## 数据存储

- `POST /api/contact` 会把提交内容写入 Cloudflare D1
- D1 绑定名为 `CONTACT_DB`
- 绑定定义写在 `wrangler.toml`，作为 Worker 配置的一部分统一管理

## 常用命令

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## 环境变量

- `CORS_ALLOW_ORIGIN`
  - 默认值：`https://thanejoss.com`
  - 支持用逗号分隔多个允许的来源

## 部署方式

部署由 Cloudflare 通过已连接的 GitHub 仓库自动完成。

`wrangler.toml` 仍然是 Worker 名称、路由、自定义域名、环境变量和运行时配置的唯一配置来源。
