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
| `npm run check:secrets` | Scan tracked files for committed Stripe API keys |
| `npm run start`| Run production server    |
| `npm run deploy`| Deploy to Cloudflare Workers (API token — see below) |
| `npm run deploy:cf` | Same, loads `CLOUDFLARE_*` from `.env.local` (Windows) |
| `npm run lint` | Run ESLint               |

## Stripe key handling

`/order` and `POST /api/checkout` are intentionally mock-only in this repo. Do not add hardcoded Stripe keys or real charge code until the live checkout integration is designed and reviewed.

When live checkout is added:

- Store Stripe credentials in server-side secrets such as `STRIPE_API_KEY`; never commit key values.
- Prefer a restricted API key with only the permissions the checkout server needs.
- Rotate any Stripe key that was pasted into source, chat, logs, or a review thread.
- Run `npm run check:secrets` before pushing payment-related changes.

## Public deploy (Grok / external access)

**Production URL (Cloudflare):** `https://hai-verify.workers.dev`  
After deploy: `/order`, `/api/health`, `POST /api/verify`

### Option A — Cloudflare (repo default)

**Recommended: API token (no `wrangler login`, no OAuth timeout)**

1. [Create API token](https://dash.cloudflare.com/profile/api-tokens) → template **Edit Cloudflare Workers**
2. Copy **Account ID** from [Cloudflare dashboard](https://dash.cloudflare.com/) (home → right sidebar)
3. Add to `.env.local`:
   ```
   CLOUDFLARE_API_TOKEN=your_token
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   ```
4. Deploy:
   ```bash
   npm run deploy:cf
   ```
   Or set env vars and run `npm run deploy`.

**Or: Git push (no local Cloudflare setup)**

Push to `main` with GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` → Actions deploys automatically.

~~`npx wrangler login`~~ — OAuth popup often times out in IDE; use API token instead.

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