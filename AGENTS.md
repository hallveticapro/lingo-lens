# AGENTS.md

## Project Purpose

LingoLens is a Next.js App Router app that turns source texts into multilingual, leveled reading experiences. The MVP target locale is Latin American Spanish (`es-419`), but the system must stay multilingual by structure.

The core model is:

```text
source content + target locale + reading level = adaptation
```

## Sources Of Truth

- `references/PRD.md` defines product behavior, data model, and acceptance criteria.
- `references/GUIDANCE.md` defines implementation checklist and final validation commands.
- `references/PRODUCT.md` summarizes users, positioning, anti-references, and design principles.
- `references/DESIGN.md` is the root design-system summary.
- `references/lingo-lens-design/` is the detailed visual source of truth. Keep it in the repo, but do not serve it publicly.
- `references/AUDIT-2026-06-12.md` records the full baseline audit.
- `references/ROADMAP.md` tracks remaining roadmap work.
- `references/UPDATES.md` records compact historical checkpoints.

## Stack

- Package manager: `pnpm`.
- App: Next.js App Router, React, TypeScript.
- Data: PostgreSQL with Prisma migrations.
- Validation: Zod.
- AI: official OpenAI Node SDK, server-side only.
- Content rendering: sanitized Markdown.
- Tests: Vitest and Playwright.
- Deployment: Docker and Docker Compose, with Unraid-friendly persistent data.

## Key Directories

- `app/` contains public routes, admin routes, API-like route handlers, and global styles.
- `components/` contains shared public/admin UI components.
- `lib/` contains server helpers, generation, RSS, auth, media, validation, and environment logic.
- `prisma/` contains schema, migrations, and seed logic.
- `scripts/` contains operational scripts such as workers and admin bootstrap helpers.
- `tests/` contains Playwright E2E coverage.
- `public/` contains served static assets.
- `references/` contains product docs, audit/history docs, and reference design assets.

## Design Direction

LingoLens should feel like a premium editorial reading app, not a generic SaaS dashboard or gamified language app. Preserve:

- soft off-white background `#FAF9F6`
- navy primary UI
- terracotta and sage accents
- Playfair-style display headings
- Source Serif-style reading body
- Inter-style UI text
- subtle bordered cards and pill level controls

Before changing UI, inspect `references/DESIGN.md` and the relevant Stitch reference in `references/lingo-lens-design/`.

## Implementation Rules

- Do not add Spanish-specific database columns.
- Model generated readings as `source content + target locale + reading level = adaptation`.
- Keep OpenAI API keys server-side only.
- Validate form/API input with Zod.
- Sanitize rendered Markdown.
- Keep rights fields in the backend but hidden from admin UI until the rights workflow is designed.
- Keep generated content reviewable before publication.
- Preserve locale-aware `lang` and `dir` behavior on reader surfaces.
- Keep Docker Compose friendly to Unraid with `DATA_DIR` controlling host-side persistent data.
- Keep examples generic; do not commit machine-specific appdata paths.

## Environment And Secrets

- Copy `.env.example` to `.env` for local development.
- Required production secrets include `AUTH_SECRET`, database password/URL, admin bootstrap credentials, and `OPENAI_API_KEY` when real generation is enabled.
- `ADMIN_PASSWORD` is temporary bootstrap input; remove it after confirming login.
- If `OPENAI_API_KEY` is missing or placeholder, the app uses deterministic mock generation.
- Do not expose rights workflow fields in admin UI unless the product workflow is explicitly designed.

## Common Commands

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm seed
pnpm bootstrap-admin
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm audit --audit-level low
```

For Docker validation:

```bash
docker compose config
docker compose build
```

If Docker is unavailable, say that clearly and report the non-Docker validation that passed.

## Validation Policy

- Docs-only changes: run `git diff --check`; use targeted `rg` reference checks when deleting or renaming docs.
- UI changes: run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and use browser/Playwright smoke checks for changed screens.
- Server or data changes: add or update focused tests, then run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Prisma schema changes: create a migration, run `pnpm prisma generate`, and rehearse migration deploy against a disposable database when available.
- Deployment changes: also run `docker compose config` and `docker compose build` when Docker is available.

Before handing off significant work, the full gate is:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level low
docker compose config
docker compose build
```

## Current Workflow Notes

- Production startup should use Prisma migrations, not `prisma db push`.
- Generation runs through durable `GenerationJob` records and a worker path.
- Admin login has DB-backed throttling and baseline security headers are configured.
- Remote image ingestion includes SSRF, MIME, redirect, timeout, and byte-limit protections.
- Public query/image rendering, RSS metadata, reader comfort mode, and accessibility polish have already been improved from the baseline audit.
- Remaining roadmap work lives in `references/ROADMAP.md`; do not re-implement completed audit fixes unless tests reveal a regression.
