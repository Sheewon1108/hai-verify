# HAI Verify

Enterprise AI output verification — hallucination risk scoring, human review routing, and audit-ready summaries.

**Human + Heart + AI + Law = Verification**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server (LAN: `0.0.0.0`) |
| `npm run tunnel` | Public URL for Grok (localtunnel) |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run deploy`| Deploy to Cloudflare Workers (requires `wrangler login`) |
| `npm run lint` | Run ESLint               |

## Public deploy (Grok / external access)

**Production URL (Cloudflare):** `https://hai-verify.workers.dev`  
After deploy: `/order`, `/api/health`, `POST /api/verify`

### Option A — Cloudflare (repo default)

```bash
npx wrangler login
npm run deploy
```

Or push to `main` with GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### Option B — Vercel

Import [github.com/Sheewon1108/hai-verify](https://github.com/Sheewon1108/hai-verify) at [vercel.com/new](https://vercel.com/new) — zero config for Next.js.

### Grok quick links (after deploy)

- Order: `https://hai-verify.workers.dev/order`
- Health: `https://hai-verify.workers.dev/api/health`

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript

## Planning (mock phase)

Product and API specs — **no live integrations yet**:

| Folder | Contents |
|--------|----------|
| [`api-plan/`](./api-plan/) | `POST /api/verify`, `/api/audit-report`, `/api/intake` |
| [`cli-plan/`](./cli-plan/) | `hai-verify` CLI commands and workflows |
| [`karam-api/`](./karam-api/) | KARAM API brand, Idea API, versioning |
| [`revenue-system/`](./revenue-system/) | $300 / $1,500 / $5,000/mo sales flows (mock) |