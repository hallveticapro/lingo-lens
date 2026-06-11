# GUIDANCE.md — Codex Build Instructions for LingoLens

Use this file together with `PRD.md` and the Stitch design export in `lingo-lens-design/`. The PRD is the product/data source of truth. The Stitch export is the visual source of truth. This file is the implementation checklist and operating guidance.

## Project Identity

- App name: **LingoLens**
- Repo name: `lingo-lens`
- Initial target locale: `es-419` Latin American Spanish
- First source locale seed: `en-US`
- Core model: `source content + target locale + reading level = adaptation`

## Required Design-First Workflow

Before creating or modifying app code, inspect the Stitch export.

1. Verify these exist in the project root:
   - `PRD.md`
   - `GUIDANCE.md`
   - `lingo-lens-design/`
2. If `lingo-lens-design/` is missing but `lingo-lens-design.zip` exists, unzip it to `lingo-lens-design/`.
3. If neither the folder nor zip exists, stop and report that the required design source is missing.
4. Read `lingo-lens-design/lingolens_design_system/DESIGN.md`.
5. Inspect these screenshots before scaffolding UI:
   - `lingo-lens-design/lingolens_home_2/screen.png`
   - `lingo-lens-design/lingolens_reader_2/screen.png`
   - `lingo-lens-design/admin_dashboard_2/screen.png`
   - `lingo-lens-design/admin_new_content/screen.png`
   - `lingo-lens-design/admin_review_versions/screen.png`
6. Build the product to match the Stitch direction as closely as practical while preserving PRD functionality.

Do not build a generic SaaS dashboard and call it done. LingoLens should feel like a premium editorial reading app: calm, literary, modern, adult, trustworthy, and learner-friendly.

## Stitch Design System Requirements

Implement the core tokens from `DESIGN.md` in the app styling system. CSS variables are preferred; Tailwind is acceptable only if the tokens are mapped clearly.

### Colors

- Background / paper: `#FAF9F6`
- Main text: `#1A1C1A`
- Muted text: `#45474D`
- Primary navy: `#1B263B`
- Deep primary: `#051125`
- Terracotta accent family: use `#9A442D`, `#E07A5F`, or Stitch-provided equivalents for RSS/discovery/destructive accents
- Sage accent family: use `#81B29A` or Stitch-provided equivalents for success/subtle positive states
- Borders: soft gray/outline variants from the design export
- Cards: white or near-white surfaces with thin borders and very soft shadows

### Typography

- Headlines: Playfair Display or closest available serif fallback
- Long-form reading body: Source Serif 4 or closest readable serif fallback
- UI labels, buttons, nav, metadata, forms: Inter or closest sans-serif fallback
- Reading body should target comfortable 65–75 character line lengths on desktop
- Use generous whitespace and strong article hierarchy

Use `next/font/google` when practical. If font fetching is unavailable in the build environment, use robust fallback stacks and document the limitation.

### Component Style

- Cards: white surface, subtle border, 16px radius, soft ambient shadow
- Buttons and inputs: 8px radius, clear focus state, accessible contrast
- Badges/chips: pill shape, understated color, not loud
- Level switcher: prominent pill-style control on reading pages
- Admin nav: left sidebar matching Stitch screenshots
- Avoid neon colors, cartoon mascots, heavy shadows, excessive gradients, or gamified visuals

## Required Screens and Visual References

### Public Homepage

Follow `lingolens_home_2/screen.png`.

Must include:

- LingoLens top nav
- Hero: “Read the world in Spanish at your level.”
- Primary CTA: Start Reading
- Secondary CTA: Subscribe by RSS
- How-it-works section
- Latest adapted articles grid
- Source labels and level chips on article cards
- Footer

### Public Reading Page

Follow `lingolens_reader_2/screen.png`.

Route: `/read/[locale]/[level]/[slug]`

Must include:

- Top nav and breadcrumb
- Locale/level badges
- Large editorial title
- Summary/dek
- Source metadata
- Header image and caption
- Pill-style level switcher
- Comfortable Markdown body
- Right sidebar on desktop with vocabulary, comprehension, and RSS cards
- Clean stacked layout on mobile

### Admin Dashboard

Follow `admin_dashboard_2/screen.png`.

Must include:

- Left admin sidebar
- Content Management header
- New Content button
- Summary cards: Published, Drafts, Needs Review, Failed Generations
- Recent content table with search/filter affordances and action column
- Useful empty state when no content exists

### Admin New/Edit Content

Follow `admin_new_content/screen.png`.

Use a full page, not a modal.

Must include:

- Source title
- Source language
- Content type
- Citation details
- Source text textarea
- Header image fields from PRD
- Internal notes
- Target locale
- Levels to generate card grid
- Save Draft and Generate Versions actions

Rights fields exist in the backend but remain hidden in this MVP UI.

### Admin Review Versions

Follow `admin_review_versions/screen.png`.

Must include:

- Review title
- Level tabs: Super Beginner, Beginner, Intermediate, Natural
- Editable title, summary, and body
- Vocabulary editor
- Comprehension questions editor
- QA notes side panel
- Regenerate This Level, Save Edits, Publish This Level, Publish All Reviewed

### RSS / Feeds Page

No Stitch screenshot exists. Design it consistently with the editorial public style.

Must include:

- Language selector, initially `es-419`
- Reading-level feed cards or rows
- Copyable feed URLs
- Links to `/feeds/es-419/super-beginner.xml`, `/feeds/es-419/beginner.xml`, `/feeds/es-419/intermediate.xml`, `/feeds/es-419/natural.xml`

## Repo and GitHub

1. Create a new GitHub repository named `lingo-lens` using the available GitHub connector, GitHub CLI, or GitHub API.
2. Default visibility: private unless blocked by account/org settings.
3. If the repo already exists, use it.
4. If repo creation is blocked, initialize locally and include this exact fallback command in the final response:

```bash
gh repo create lingo-lens --private --source=. --remote=origin --push
```

5. Initialize git, commit checkpoints, and push all completed work.
6. Keep `lingo-lens-design/` in the repo if present, but do not serve it publicly from the app.

## Required Stack

Use this unless a serious blocker exists:

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod validation
- Official OpenAI Node SDK
- Markdown rendering with sanitization
- Docker multi-stage build
- Docker Compose for Unraid deployment
- Server-side admin auth using env-based credentials and secure cookies

## Required Files

Create and maintain:

- `PRD.md`
- `GUIDANCE.md`
- `README.md`
- `AGENTS.md`
- `.env.example`
- `.gitignore`
- `.dockerignore`
- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- lockfile
- `prisma/schema.prisma`
- `prisma/seed.ts`
- app source files

## Docker and Unraid Requirements

The app must run on Unraid through Docker Compose.

Implement:

- `app` service for the web app
- `db` service for PostgreSQL
- `restart: unless-stopped`
- configurable host port, default `3000`
- persistent Postgres bind mount: `./data/postgres:/var/lib/postgresql/data`
- persistent uploads bind mount: `./data/uploads:/app/uploads`
- PostgreSQL healthcheck
- `.env.example` with every required value
- README section named `Deploy on Unraid`

Compose should work with:

```bash
docker compose --env-file .env up -d --build
```

## Required `.env.example` Keys

```env
NODE_ENV=production
APP_URL=http://localhost:3000
PORT=3000
AUTH_SECRET=change-me
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=replace-with-generated-hash
REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH=false
POSTGRES_USER=lingo_lens
POSTGRES_PASSWORD=change-me
POSTGRES_DB=lingo_lens
DATABASE_URL=postgresql://lingo_lens:change-me@db:5432/lingo_lens
OPENAI_API_KEY=sk-replace-me
OPENAI_MODEL=gpt-5.1
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_MB=10
RSS_MAX_ITEMS=25
```

Keep `OPENAI_MODEL` configurable. If the configured model is unavailable, document how to change it.

## First MVP Vertical Slice

Build a working proof of concept, not a mock shell.

### Public Reader

- Homepage lists published readings.
- Public reading route: `/read/[locale]/[level]/[slug]`.
- Level switcher for the same content item.
- Display source metadata.
- Display vocabulary and comprehension questions when available.
- Apply locale-aware `lang` and text direction.
- Render Markdown safely with sanitization.

### RSS

- Endpoint: `/feeds/[locale]/[level].xml`.
- Generate RSS from published adaptations.
- Stable GUID format: `content:{content_item_id}:locale:{bcp47_tag}:level:{reading_level_key}`.
- Use app publication date as RSS `pubDate`.

### Admin

- Admin login.
- Protected admin area.
- Content item list.
- Create/edit source content.
- Automatically create hidden backend rights metadata with unreviewed statuses.
- Generate adaptations for `es-419` across four levels.
- Review adaptations.
- Edit adaptations.
- Regenerate one adaptation.
- Publish/archive adaptations.

### AI Generation

- Use server-side OpenAI integration only.
- Generate a fact bank from the source content.
- Generate each level from `source content + fact bank`, never from another generated level.
- Validate model output with Zod.
- Store generation jobs, model, prompt version, token counts when available, QA status, and output.
- Include a development-safe mock generation path when `OPENAI_API_KEY` is missing.

### Database

Implement the PRD model using Prisma:

- `Locale`
- `ReadingLevel`
- `LocaleLevelProfile`
- `ContentItem`
- `MediaAsset`
- `ContentRightsRecord`
- `FactBank`
- `Adaptation`
- `GenerationJob`
- `PromptTemplate`
- `AdaptationRevision`
- `RssFeedConfig`

Seed:

- `en-US`
- `es-419`
- four reading levels
- four `es-419` level profiles
- four Spanish RSS feed configs
- one sample source content item with published sample adaptations for all four levels

## Implementation Quality Rules

- Keep OpenAI API keys server-side only.
- Validate admin inputs with Zod.
- Sanitize Markdown before rendering.
- Avoid language-specific database columns.
- Keep generation modular so a worker can be added later.
- Use clear status enums or typed constants.
- Provide useful empty/error states.
- Do not expose rights fields in the admin UI yet.
- Implement `REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH`; default is false.
- Add a script to generate `ADMIN_PASSWORD_HASH`.
- Add scripts for dev, build, start, lint, Prisma generate/migrate/seed, and Docker usage.
- Document assumptions in `README.md` and agent guidance in `AGENTS.md`.
- Maintain visual consistency with the Stitch export throughout public and admin UI.

## Acceptance Checks

Run and fix issues from:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm build
```

Also validate Docker files:

```bash
docker compose config
docker compose build
```

If Docker is unavailable, state that Docker execution could not be performed and confirm static validation instead.

## Final Response Requirements

Return:

1. GitHub repo URL.
2. Branch name.
3. What was built.
4. How the Stitch design was analyzed and applied.
5. How to run locally.
6. How to deploy on Unraid.
7. Environment variables that must be changed before deployment.
8. Test/build results.
9. Known limitations and recommended next tasks.

## Do Not Do Yet

Do not build learner accounts, payments, classroom rostering, automated scraping, mobile apps, audio generation, spaced repetition, comments, country-specific dialect UIs, or full rights-management frontend. Backend rights storage is required now; frontend rights workflow comes later.
