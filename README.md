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
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

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