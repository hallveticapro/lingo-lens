# AGENTS.md

## Product Source Of Truth

- `PRD.md` defines product behavior, data model, and acceptance criteria.
- `GUIDANCE.md` defines the build checklist and final validation commands.
- `lingo-lens-design/` is the visual source of truth. Keep it in the repo, but do not serve it publicly.

## Design Direction

LingoLens should feel like a premium editorial reading app, not a generic SaaS dashboard. Preserve:

- soft off-white background `#FAF9F6`
- navy primary UI
- terracotta and sage accents
- Playfair-style display headings
- Source Serif-style reading body
- Inter-style UI text
- subtle bordered cards and pill level controls

## Implementation Rules

- Do not add Spanish-specific database columns.
- Model generated readings as `source content + target locale + reading level = adaptation`.
- Keep OpenAI API keys server-side only.
- Validate form/API input with Zod.
- Sanitize rendered Markdown.
- Keep rights fields in the backend but hidden from admin UI until the rights workflow is designed.
- Keep Docker Compose friendly to Unraid with `DATA_DIR` controlling host-side persistent data. Default it to `/mnt/user/appdata/lingo-lens`, with `${DATA_DIR}/postgres` and `${DATA_DIR}/uploads` mounted into the containers.

## Validation

Before handing off significant work, run:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm build
docker compose config
docker compose build
```

If Docker is not available, state that clearly.
