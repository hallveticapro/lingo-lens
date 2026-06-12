# LingoLens Implementation Roadmap

Source audit: `AUDIT-2026-06-12.md`

This roadmap intentionally does **not** modify app code. It converts the audit into an efficient implementation sequence. Work is grouped by priority and phase, with P0 first, then P1, then P2/P3. Related findings are combined where one implementation can close several issues.

## Execution Rules

- Treat each task as one PR unless noted otherwise.
- Finish P1 phases before starting P2/P3 polish.
- Do not re-implement safe fixes already completed in the audit unless tests reveal regressions.
- Prefer small, reversible changes with clear validation.
- Prefer existing validation commands until new scripts are added: `pnpm lint`, `pnpm exec tsc --noEmit --pretty false`, `pnpm build`, and `pnpm audit --audit-level low`.
- Do not ship schema or deployment changes without a disposable database rehearsal.
- Do not add paid third-party services or change env var names without migration notes.
- Do not require README/AGENTS/UPDATES changes unless behavior, commands, deployment, or project rules actually change.
- Do not require CI/GHCR verification for documentation-only changes.

---

## Phase 0 — P0 Critical Blocker Gate

The audit found **no confirmed P0 issues**. Keep this phase as a release gate: if new work reveals data loss, a production crash, a security breach, or a major privacy issue, pause lower-priority work and handle it here first.

- **Acceptance:** No newly discovered P0 issue remains open before any lower-priority PR is merged.
- **Evidence:** PR description or review notes explicitly state whether new P0 risks were discovered; if none, no code or documentation change is required.

---

## Phase 1 — P1 Production Data Safety and Release Gates

### Task 1.1 — Replace runtime schema push with migrations

- **Goal:** Stop mutating production schema/data on every app start. Move from `prisma db push` to reviewed Prisma migrations and explicit seed/bootstrap behavior.
- **Files likely involved:**
  - `Dockerfile`
  - `docker-compose.yml`
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
  - `package.json`
  - deployment docs only if startup commands or first-run behavior change
- **Implementation notes:**
  - Generate an initial migration from the current Prisma schema.
  - Replace production startup `pnpm prisma:push` with `pnpm prisma migrate deploy` or the repo’s equivalent script.
  - Keep admin bootstrap explicit and safe.
  - Make sample seed data opt-in for development or first-run setup, not automatic on every production boot.
  - Preserve the existing Unraid/Docker `DATA_DIR` behavior.
  - Rehearse migration deploy against a disposable Postgres database before touching production-like data.
- **Acceptance:**
  - `Dockerfile` no longer runs `prisma db push`, `pnpm prisma:push`, or unconditional sample seeding during production startup.
  - A `prisma/migrations/` directory exists with an initial migration matching the current schema.
  - Production startup applies migrations with `prisma migrate deploy` or a script that wraps it.
  - Sample seed behavior is opt-in and cannot silently mutate production data on every restart.
  - Existing `DATA_DIR` bind-mount behavior remains unchanged.
- **Evidence:**
  - File check: `rg "prisma:push|db push|pnpm seed" Dockerfile package.json docker-compose.yml` shows no unsafe production startup path; any seed reference is clearly dev/opt-in.
  - Command: `pnpm prisma generate` passes.
  - Command: `pnpm build` passes.
  - If Docker is available, command: `docker compose config` passes.
  - If a disposable DB is available, command: `pnpm prisma migrate deploy` or the app’s migration deploy script succeeds against it.
  - 2026-06-12: Implemented migration-based startup (`pnpm prisma:deploy`), added `prisma.config.ts`, generated initial migration `20260612161000_initial`, and removed production runtime seed/db-push path. `pnpm prisma generate` and `pnpm build` passed; `docker compose config` could not run because Docker is unavailable.
- **Validation command:**
  ```bash
  pnpm prisma generate && pnpm build
  ```
  If Docker is available:
  ```bash
  docker compose config
  ```
  If a disposable database is available:
  ```bash
  pnpm prisma migrate deploy
  ```

### Task 1.2 — Add production config, dependency, and CI quality gates

- **Goal:** Make production configuration reproducible and fail-closed before image publishing.
- **Files likely involved:**
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `prisma.config.ts`
  - `.github/workflows/publish-image.yml`
  - `lib/auth.ts`
  - `lib/generation.ts`
  - `lib/media.ts`
  - RSS route files using public base URL env values
  - new `lib/env.ts` or similar server-only env module
- **Implementation notes:**
  - Add discoverable scripts for `typecheck`, `test` once a test harness exists, `format:check` only if a formatter is configured, and `audit`.
  - Add a server-only Zod env parser for required production values and shared defaults.
  - Keep the existing production `AUTH_SECRET` guard, but centralize it with other env validation.
  - Pin direct dependencies instead of using broad `latest` ranges.
  - Resolve or intentionally document the ESLint peer mismatch reported by `pnpm peers check`.
  - Add CI steps before Docker image publish: install, Prisma generate, lint, typecheck, tests when available, build, audit.
  - Add `prisma.config.ts` to address Prisma’s deprecation warning around `package.json#prisma`.
- **Acceptance:**
  - `package.json` has a working `typecheck` script that runs TypeScript without emitting files.
  - `package.json` has an `audit` script equivalent to `pnpm audit --audit-level low`.
  - Direct dependency versions are pinned to concrete ranges rather than broad `latest` values.
  - Production env validation fails closed for missing/placeholder secrets and validates shared URL/media/API settings in one server-only module.
  - Prisma config warning is resolved by moving Prisma config to `prisma.config.ts` or the current Prisma-recommended equivalent.
  - CI workflow runs repo validation before image build/publish; no GHCR push verification is required beyond workflow syntax and local validation.
  - Existing PostCSS override remains effective or is removed only if upstream dependency resolution stays patched.
- **Evidence:**
  - File check: `cat package.json` shows `typecheck` and `audit` scripts and no direct `latest` dependency ranges.
  - File check: `test -f prisma.config.ts` passes, if Prisma config is moved there.
  - Command: `pnpm install` passes.
  - Command: `pnpm prisma generate` no longer emits the `package.json#prisma` deprecation warning.
  - Command: `pnpm lint` passes.
  - Command: `pnpm typecheck` passes after the script is added.
  - Command: `pnpm build` passes.
  - Command: `pnpm audit --audit-level low` or `pnpm audit` passes.
  - Command: `pnpm peers check` either passes or has a documented, intentional exception in the PR.
  - 2026-06-12: Added `typecheck` and `audit` scripts, pinned direct dependencies, centralized server env parsing in `lib/env.ts`, removed the Prisma package config warning path, and added validation steps before Docker publish. `pnpm install`, `pnpm prisma generate`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm audit`, and `pnpm peers check` passed; lint still reports the known raw-image warnings scheduled for Phase 5.
- **Validation command:**
  ```bash
  pnpm install && pnpm prisma generate && pnpm lint && pnpm typecheck && pnpm build && pnpm audit --audit-level low && pnpm peers check
  ```

---

## Phase 2 — P1 Durable Generation and Job Correctness

### Task 2.1 — Move generation out of detached server actions

- **Goal:** Make content generation durable, retryable, and observable instead of relying on `void Promise.allSettled(...)` after a server action returns.
- **Files likely involved:**
  - `app/admin/actions.ts`
  - `lib/generation.ts`
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
  - new worker entry point such as `scripts/generation-worker.ts`
  - `Dockerfile`
  - `docker-compose.yml`
  - admin dashboard/review components showing job status
- **Implementation notes:**
  - Update admin actions so they create queued `GenerationJob` rows and return quickly.
  - Add a worker command that claims queued jobs in a transaction, marks them `running`, executes generation, writes adaptations/revisions, then marks jobs `succeeded` or `failed`.
  - Add stale-running-job recovery and bounded retry behavior.
  - Keep OpenAI calls server-side only.
  - Avoid external queues unless the deployment decision changes; Docker can run a second app image process as the worker.
  - Add admin retry controls and make failed/running/queued states visible.
  - Preserve structured error details instead of deleting them when the admin clears visible warnings.
- **Acceptance:**
  - `queueGeneration()` or its replacement no longer starts detached in-request background work with `void Promise...`.
  - Creating a generation request writes queued `GenerationJob` rows and returns without running the provider call inline.
  - Worker claims jobs atomically so two workers cannot process the same job at the same time.
  - Successful jobs create/update adaptations and mark jobs `succeeded` with timestamps.
  - Failed jobs store bounded, safe error details and mark jobs `failed` without leaving content permanently stuck in `generating`.
  - Stale `running` jobs can be retried or marked failed by a clear recovery path.
  - Admin UI distinguishes queued, running, failed, and retryable states.
- **Evidence:**
  - File check: `rg "void Promise|Promise.allSettled" app/admin/actions.ts lib/generation.ts` does not show detached generation execution.
  - Tests: job transition tests cover queued → running → succeeded, queued → running → failed, stale running recovery, and retry behavior.
  - Command after test harness exists: `pnpm test -- generation` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: admin generation request shows queued/running status, and retry appears after a forced failure.
  - 2026-06-12: Replaced detached server-action generation with queued `GenerationJob` rows, added a generation worker command/service, atomic Postgres job claiming, stale-running recovery, bounded retry fields, retry action, and admin queue status display. `rg "void Promise|Promise.allSettled" app/admin/actions.ts lib/generation.ts` is clean. Focused `pnpm test -- generation`, `pnpm prisma generate`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed; lint/build still report the known raw-image/NFT warnings scheduled for later phases.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After Phase 4 adds tests:
  ```bash
  pnpm test -- generation
  ```

### Task 2.2 — Validate generation inputs and provider failures

- **Goal:** Prevent false-success generation states and make OpenAI/provider failures actionable for admins.
- **Files likely involved:**
  - `lib/generation.ts`
  - `app/admin/actions.ts`
  - admin failure display in `app/admin/page.tsx`
  - `lib/parsers.ts` or new generation normalization helpers
  - tests added in Phase 4
- **Implementation notes:**
  - Compare requested reading-level keys with database results; fail clearly if any requested level does not exist.
  - Classify errors into validation, provider, rate-limit, network, and unknown categories.
  - Store safe, bounded error details without logging huge raw model responses.
  - Keep flexible fact-bank parsing if needed, but make adaptation output strict enough to catch bad generation quality.
  - Add retry guidance in the admin UI.
- **Acceptance:**
  - Unknown or missing requested reading-level keys fail the job/action with a clear validation message and do not create a false `needs_review` state.
  - Provider/network/rate-limit/schema failures are classified into stable categories.
  - Stored failure payloads are bounded and do not include huge raw provider responses or secrets.
  - Admin failure UI shows the category, safe message, and retry guidance.
  - Existing mock-generation behavior still works when OpenAI is intentionally unavailable for development.
- **Evidence:**
  - Tests: invalid level key fails cleanly; mocked malformed JSON fails as provider/schema error; mocked rate-limit produces rate-limit category.
  - Command after test harness exists: `pnpm test -- generation parsers` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: forced provider failure appears in admin without exposing raw payloads.
  - 2026-06-12: Added de-duplicated missing-level validation, stable failure categories for validation/schema/provider/rate-limit/network/unknown failures, bounded JSON-safe failure payloads with retry guidance, and admin display of category/guidance. Focused `pnpm test -- generation` covered invalid level keys, malformed JSON/schema errors, and rate limits. `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed with known raw-image/NFT warnings.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After Phase 4 adds tests:
  ```bash
  pnpm test -- generation parsers
  ```

---

## Phase 3 — P1 Security and Privacy Hardening

### Task 3.1 — Harden remote image ingestion against SSRF and abuse

- **Goal:** Finish the media security work beyond the already-implemented `http`/`https` URL validation.
- **Files likely involved:**
  - `lib/media.ts`
  - `lib/validators.ts`
  - `components/ContentForm.tsx`
  - media-related tests
- **Implementation notes:**
  - Resolve DNS and reject localhost, private, loopback, link-local, multicast, and cloud metadata IP ranges.
  - Re-check the destination after redirects and cap the redirect count.
  - Use `AbortController` timeouts.
  - Reject non-image MIME types.
  - Cap `Content-Length` when present and cap actual bytes read while streaming.
  - Keep logs useful without leaking sensitive URLs or internal destination details.
  - Use `MAX_UPLOAD_MB` or a dedicated env value for remote-image byte limits.
- **Acceptance:**
  - `file:`, `ftp:`, `data:`, and other non-HTTP(S) URLs remain rejected by validation.
  - `localhost`, loopback, private network, link-local, multicast, and metadata-service destinations are rejected after DNS resolution.
  - Redirects are limited, and each redirected destination is revalidated.
  - Non-image MIME responses are rejected before image processing.
  - Missing or dishonest `Content-Length` cannot bypass the actual byte cap.
  - Slow responses time out.
  - Logs do not expose secrets or unnecessary internal network details.
- **Evidence:**
  - Tests: validators reject non-http(s); media fetch rejects localhost/private/metadata IPs, redirect-to-private, non-image MIME, oversized response, and timeout.
  - Command after test harness exists: `pnpm test -- media validators` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - File check: `rg "127\\.0\\.0\\.1|169\\.254\\.169\\.254|private|Content-Length|AbortController" lib/media.ts` shows explicit protections or equivalent helper usage.
  - 2026-06-12: Hardened remote image downloads with DNS/IP blocking for private/local/link-local/multicast destinations, redirect revalidation and limits, `AbortController` timeouts, image MIME enforcement, declared and streamed byte caps from `MAX_UPLOAD_MB`, and redacted URL hashes in logs. Focused `pnpm test -- media validators`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed with known raw-image/NFT warnings.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After Phase 4 adds tests:
  ```bash
  pnpm test -- media validators
  ```

### Task 3.2 — Add admin rate limiting and baseline security headers

- **Goal:** Reduce brute-force, clickjacking, MIME-sniffing, permission, and referrer risks before public exposure.
- **Files likely involved:**
  - `app/admin/actions.ts`
  - `lib/auth.ts`
  - new `lib/rate-limit.ts` or database-backed throttle helper
  - `next.config.ts`
  - `app/globals.css` or font setup if CSP/font policy changes are needed
- **Implementation notes:**
  - Add IP/email-based throttling to admin login attempts.
  - Keep behavior Docker-friendly; do not require Redis unless the deployment model changes.
  - Add baseline headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
  - Add CSP carefully. Start with a compatible policy or `Content-Security-Policy-Report-Only` if inline styles/fonts need cleanup first.
  - Confirm Markdown sanitization still works with the headers.
- **Acceptance:**
  - Repeated failed admin login attempts are throttled by IP and/or identifier with a clear, safe error message.
  - Legitimate login still succeeds after the throttle window or with a non-throttled account/IP.
  - Baseline security headers are present on public and admin responses.
  - CSP is either compatible and enforced or intentionally report-only with a follow-up noted; it must not break fonts, Markdown rendering, images, RSS, or admin pages.
  - Rate limiting does not introduce a required Redis/external service dependency.
- **Evidence:**
  - Tests: auth/rate-limit helper covers allowed attempts, blocked attempts, and reset/window behavior.
  - Command after test harness exists: `pnpm test -- auth rate-limit` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser/curl smoke after local run: `curl -I http://localhost:3000/admin/login` shows expected headers.
  - Browser smoke: repeated failed login attempts eventually show a throttled message without crashing the page.
  - 2026-06-12: Added DB-backed admin login throttling keyed by email and hashed IP, wired failed/success login accounting, added pure rate-limit tests, and configured baseline `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and report-only CSP headers. Focused `pnpm test -- auth rate-limit`, `pnpm prisma generate`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed. Local `PORT=3001 pnpm start` plus `curl -I http://localhost:3001/admin/login` showed the expected headers.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After Phase 4 adds tests:
  ```bash
  pnpm test -- auth rate-limit
  ```
  After running locally:
  ```bash
  curl -I http://localhost:3000/admin/login
  ```

---

## Phase 4 — P1/P2 Regression Test Harness

### Task 4.1 — Add Vitest and core regression tests

- **Goal:** Create fast coverage for the app’s highest-risk server logic and safe fixes already implemented in the audit.
- **Files likely involved:**
  - `package.json`
  - `vitest.config.ts` or equivalent
  - `lib/*.test.ts`
  - `app/admin/actions.ts` helper extractions
  - RSS route tests
  - validator/media tests
- **Implementation notes:**
  - Add `test` and `test:watch` scripts.
  - Test slug normalization and level slug conversion.
  - Test URL validators reject `file:`, `ftp:`, `data:`, localhost/private targets after media hardening lands.
  - Test `publishAllAction` cannot publish zero-adaptation content.
  - Test rights gating checks image rights.
  - Test source-locale preservation on edit helper/data shape.
  - Test RSS XML escaping, channel image, Media RSS tags, and local-image enclosure behavior.
  - Test generation rejects unknown level keys.
  - Extract pure helpers from server-action modules where needed rather than over-mocking the framework.
- **Acceptance:**
  - `package.json` includes working `test` and `test:watch` scripts.
  - Vitest config supports TypeScript and the app’s module aliases.
  - At least the following regression areas are covered: slug normalization, level conversion, URL validation, publish-all guard, image-rights gate, RSS XML/media tags, and unknown generation level handling.
  - Tests do not require production credentials or production data.
  - Server-action logic is tested through extracted pure helpers where direct framework testing would be brittle.
- **Evidence:**
  - Command: `pnpm test` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - File check: `rg "describe\\(|it\\(|test\\(" lib app tests` shows meaningful tests for the listed regression areas.
  - 2026-06-12: Added Vitest coverage for slug normalization, level conversion, parsers, URL/media validation, publish-all guard helper, image-rights gate helper, RSS XML/media helpers, rate limiting, and generation failure/unknown-level behavior. `pnpm test` passed with 9 files / 27 tests; `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed with known raw-image/NFT warnings.
- **Validation command:**
  ```bash
  pnpm test && pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  If Task 1.2 has added `typecheck`:
  ```bash
  pnpm test && pnpm lint && pnpm typecheck && pnpm build
  ```

### Task 4.2 — Add smoke E2E and accessibility checks

- **Goal:** Cover the core user/editor flows the audit identified as fragile or acceptance-critical.
- **Files likely involved:**
  - `package.json`
  - `playwright.config.ts`
  - `tests/e2e/*`
  - test seed/setup helpers
  - optional accessibility helper if added intentionally
- **Implementation notes:**
  - Add smoke tests for homepage, articles list, reader page, RSS feeds page, admin login, dashboard search, content creation validation, and review/publish guard behavior.
  - Include keyboard navigation checks for public/admin nav.
  - Include a reduced-motion check once CSS is updated.
  - Use a disposable test database or mocked route data; do not point tests at production data.
- **Acceptance:**
  - `package.json` includes a working `test:e2e` script if Playwright is added.
  - E2E setup uses disposable/mocked test data, never production data.
  - Smoke tests cover `/`, `/articles`, one reader page, `/feeds`, `/admin/login`, dashboard search, validation failure display, and publish guard behavior.
  - At least one keyboard navigation/current-page indicator check exists for public or admin nav.
  - Accessibility checks are practical and scoped; no broad paid or flaky external service is required.
- **Evidence:**
  - Command: `pnpm test:e2e` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Browser smoke: screenshots or Playwright traces show homepage, reader, feeds, and admin login loading from test data.
  - File check: `rg "test:e2e|playwright" package.json playwright.config.* tests` confirms setup.
  - 2026-06-12: Added Playwright with disposable local Postgres setup (`lingo_lens_e2e`), migration/seed/admin bootstrap, and smoke tests for homepage, articles, reader level switcher, feeds, admin login keyboard/error feedback, and dashboard search navigation. `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` passed with known raw-image/NFT warnings.
- **Validation command:**
  ```bash
  pnpm test:e2e
  ```
  Full gate after E2E exists:
  ```bash
  pnpm test && pnpm test:e2e && pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```

---

## Phase 5 — P2 Database, Query, and Rendering Performance

### Task 5.1 — Add indexes for public, RSS, admin, and job queries

- **Goal:** Prevent avoidable scans as content, adaptations, and generation jobs grow.
- **Files likely involved:**
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
  - public listing routes/pages
  - admin dashboard queries
  - RSS route queries
- **Implementation notes:**
  - Add compound indexes aligned with the audit recommendations:
    - `Adaptation(status, targetLocaleId, readingLevelId, publishedAt)`
    - `Adaptation(contentItemId, targetLocaleId, status)`
    - `ContentItem(status, updatedAt)`
    - `GenerationJob(status, finishedAt)`
  - Generate a migration rather than using `db push`.
  - Confirm index names and query plans against seeded volume if a database is available.
- **Acceptance:**
  - `prisma/schema.prisma` contains the recommended indexes or an equivalent set aligned to actual query filters/orderings.
  - A migration exists for the index changes; no `db push` workflow is used.
  - Public listing, RSS, admin dashboard, and failed-job queries still return the same functional results.
  - Query plan checks show index usage or a documented reason why the planner does not use an index on the available test data.
- **Evidence:**
  - File check: `rg "@@index" prisma/schema.prisma` shows indexes for `Adaptation`, `ContentItem`, and `GenerationJob`.
  - Command: `pnpm prisma generate` passes.
  - Command: `pnpm build` passes.
  - If a database is available, command: `pnpm prisma migrate deploy` succeeds against a disposable DB.
  - If seeded data is available, DB query plan output is attached or summarized in the PR.
  - 2026-06-12: Added compound indexes for content status/update date, public/RSS adaptation listing, content/locale adaptation lookups, and generation-job status/finish date. `rg "@@index" prisma/schema.prisma`, `pnpm prisma generate`, and `pnpm build` passed. Rehearsed all migrations against disposable local Postgres database `lingo_lens_migration_check` with `DATABASE_URL=postgresql://andrew@localhost:5432/lingo_lens_migration_check pnpm prisma migrate deploy`.
- **Validation command:**
  ```bash
  pnpm prisma generate && pnpm build
  ```
  With a disposable database available:
  ```bash
  pnpm prisma migrate deploy
  ```

### Task 5.2 — Fix public listing query shape and image rendering

- **Goal:** Make homepage/articles output consistent and reduce over-fetching/rendering waste.
- **Files likely involved:**
  - `app/page.tsx`
  - `app/articles/page.tsx`
  - `app/feeds/[locale]/[level].xml/route.ts`
  - `components/ArticleCard.tsx`
  - `app/read/[locale]/[level]/[slug]/page.tsx`
  - `next.config.ts`
- **Implementation notes:**
  - Query content items with published adaptations instead of fetching many adaptations and de-duping in memory.
  - Ensure homepage can reliably show the intended number of unique cards.
  - Add pagination or a clear limit strategy to `/articles`.
  - Migrate raw `<img>` usage to `next/image` where image dimensions/policies are known.
  - Define a safe remote image policy only if external images still need direct rendering.
- **Acceptance:**
  - Homepage query returns the intended number of unique content cards when enough published content exists.
  - `/articles` has pagination or a bounded, intentional limit strategy.
  - Public list pages no longer rely on unbounded adaptation fetch + in-memory de-dupe for primary behavior.
  - Next lint no longer reports `next/no-img-element` warnings for the audited image locations, or the PR documents why a raw `<img>` remains necessary.
  - RSS route output remains valid after any shared query changes.
- **Evidence:**
  - Tests after harness exists: homepage/articles query tests cover multiple adaptations per content item and assert unique cards.
  - Command: `pnpm lint` passes with no new warnings; ideally the existing raw image warnings are gone.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: `/`, `/articles`, and one `/read/...` page load with expected images and card counts.
  - 2026-06-12: Replaced homepage/articles adaptation over-fetch + in-memory de-dupe with bounded content-item queries via `lib/articles.ts`, added `/articles` pagination, moved audited card/reader images to `next/image`, and added pagination helper tests. Focused `pnpm test -- articles homepage rss`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` passed. Lint no longer reports `next/no-img-element`; build still reports the known Turbopack NFT warning.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After tests exist:
  ```bash
  pnpm test -- articles homepage rss
  ```

---

## Phase 6 — P2 UI, UX, and Accessibility Acceptance Gaps

### Task 6.1 — Restore Stitch MVP public UX requirements

- **Goal:** Close the public-facing UX gaps that affect first-time understanding and RSS subscription usability.
- **Files likely involved:**
  - `app/page.tsx`
  - `components/ArticleCard.tsx`
  - `app/feeds/page.tsx`
  - new copy button component if needed
  - `app/globals.css`
- **Implementation notes:**
  - Add the missing “How LingoLens Works” section on the homepage.
  - Show source and reading-level chips on article cards.
  - Add copyable feed URL actions using the Clipboard API with a graceful fallback.
  - Reuse or intentionally replace existing unused `.steps`, `.step-card`, `.badge`, and chip styles.
  - Keep copy short and learner-friendly.
- **Acceptance:**
  - Homepage contains a visible “How LingoLens Works” section with a clear source → levels → read/RSS flow.
  - Article cards show source and reading-level information without layout breakage on mobile.
  - Feeds page provides a copy action for each feed URL and gives success/failure feedback.
  - Clipboard fallback does not prevent users from manually copying the URL.
  - Updated UI uses existing styles where practical and does not leave newly orphaned CSS for the same feature.
- **Evidence:**
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: desktop and mobile screenshots of `/`, `/articles`, and `/feeds` show the new section, chips, and copy controls.
  - Browser smoke: clicking a feed copy button shows feedback and places the URL on the clipboard where the browser permits it.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  Manual check:
  ```bash
  # Capture desktop and mobile screenshots of /, /articles, and /feeds
  ```

### Task 6.2 — Improve navigation, forms, motion, and reader empty states

- **Goal:** Make the app clearer and more accessible without broad redesign.
- **Files likely involved:**
  - `components/PublicChrome.tsx`
  - `components/AdminChrome.tsx`
  - possible client nav wrappers using `usePathname`
  - `app/admin/content/[id]/review/page.tsx`
  - `components/ContentForm.tsx`
  - `app/read/[locale]/[level]/[slug]/page.tsx`
  - `components/DocumentLanguage.tsx`
  - `app/layout.tsx`
  - `app/globals.css`
- **Implementation notes:**
  - Set `aria-current="page"` for active public/admin navigation links.
  - Convert recoverable admin form validation failures from thrown parse errors to visible action-state errors.
  - Keep `required` attributes already added and pair them with field-level messages.
  - Add `prefers-reduced-motion` rules for transitions/animations.
  - Hide or explain empty vocabulary/comprehension panels on reader pages.
  - Keep article-level `lang`/`dir`; revisit full-page locale strategy only when more locales launch.
- **Acceptance:**
  - Active public/admin nav links set `aria-current="page"` on the current route.
  - Invalid admin form submissions show field/form messages without a framework error page.
  - Required review fields have visible and programmatic validation feedback.
  - Reduced-motion browser setting disables or substantially reduces nonessential animations/transitions.
  - Reader pages do not render blank vocabulary or comprehension cards; they are hidden or show intentional empty-state copy.
  - Existing article-level `lang`/`dir` behavior is preserved.
- **Evidence:**
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: inspect nav links on public/admin routes for `aria-current="page"`.
  - Browser smoke: submit invalid admin content/review forms and verify visible errors.
  - Browser smoke: emulate `prefers-reduced-motion` and verify motion is reduced.
  - Browser smoke or test fixture: adaptation with empty vocabulary/comprehension does not show blank panels.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  After E2E exists:
  ```bash
  pnpm test:e2e
  ```

---

## Phase 7 — P2/P3 Maintainability Cleanup and Product Readiness

### Task 7.1 — Split dense admin and generation modules after tests exist

- **Goal:** Reduce mutation-surface complexity without risky behavior changes.
- **Files likely involved:**
  - `app/admin/actions.ts`
  - `lib/generation.ts`
  - new modules such as `lib/admin/content-actions.ts`, `lib/admin/publishing.ts`, `lib/generation/schemas.ts`, `lib/generation/runner.ts`
  - tests from Phase 4
- **Implementation notes:**
  - Do this only after regression tests cover publishing, validation, generation, and RSS behavior.
  - Extract pure helpers first.
  - Keep public server-action signatures stable.
  - Avoid renaming routes or changing UX as part of the refactor.
- **Acceptance:**
  - `app/admin/actions.ts` is split so auth, content CRUD, publishing, and generation queue concerns are no longer all concentrated in one large file.
  - `lib/generation.ts` is split so schemas/normalization are separated from side-effectful job execution.
  - Public server-action names/signatures used by forms remain stable unless a migration is explicitly documented.
  - No user-visible behavior changes are included beyond what tests already cover.
  - Regression tests from Phase 4 still pass without major rewrites.
- **Evidence:**
  - Command: `pnpm test` passes.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - File check: new focused modules exist and imports from app routes still resolve.
  - Git diff check: route paths and form action exports are unchanged unless intentionally documented.
- **Validation command:**
  ```bash
  pnpm test && pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```

### Task 7.2 — Prune verified dead code and improve privacy polish

- **Goal:** Remove noise only after planned UI work has either used or replaced existing CSS/export affordances.
- **Files likely involved:**
  - `lib/level.ts`
  - `app/globals.css`
  - `public/brand/*`
  - `app/layout.tsx`
  - font setup using `next/font` if adopted
- **Implementation notes:**
  - Re-check references with `rg` before deleting `levelSlugs`, `ReadingLevelKey`, `labelInitials`, and unused CSS classes.
  - Do not delete `.steps`/`.step-card` until Phase 6 confirms whether they are reused.
  - Decide whether both OG image formats are needed before removing either.
  - Replace Google Fonts `@import` with `next/font` or self-hosted fonts if privacy/performance goals justify it.
- **Acceptance:**
  - Only symbols/classes/assets with no remaining references or planned near-term use are removed.
  - `.steps`/`.step-card` are either used by the homepage work or removed with confirmation they are no longer needed.
  - Any font-loading change preserves visual appearance closely enough and removes direct browser requests to Google Fonts if privacy polish is implemented.
  - No public UI regression appears on homepage, article cards, feeds, reader, or admin pages.
- **Evidence:**
  - File check before deletion: `rg "levelSlugs|ReadingLevelKey|labelInitials|btn-tertiary|step-card|chip-active|breadcrumb" .` confirms candidates.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: key public/admin pages still render correctly after cleanup.
  - Network check if font work is included: browser devtools shows no direct Google Fonts request from page load.
- **Validation command:**
  ```bash
  rg "levelSlugs|ReadingLevelKey|labelInitials|btn-tertiary|step-card|chip-active|breadcrumb" .
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```

### Task 7.3 — Add product-readiness features only after stability work

- **Goal:** Improve learner/editor value without distracting from production-risk fixes.
- **Files likely involved:**
  - reader page and reader components
  - admin dashboard/content pages
  - Prisma models/migrations if persistence is needed
  - CSS/theme files
  - RSS/feed components
- **Implementation notes:**
  - Prioritize reader accessibility mode, a rights review dashboard, and locale expansion readiness.
  - Keep each feature in a separate PR with a narrow acceptance test.
  - Avoid accounts, paid services, or large persistence changes unless the product decision is explicit.
- **Acceptance:**
  - Each product feature has a narrow PR scope, a user-facing goal, and its own acceptance test or browser smoke checklist.
  - Reader accessibility mode, if implemented, persists preference locally and visibly changes text/spacing/motion without requiring accounts.
  - Rights review dashboard, if implemented, shows text/image rights states and publish blockers without changing existing rights semantics unexpectedly.
  - Locale readiness work, if implemented, has fixtures or smoke tests for the selected locale concerns rather than generic placeholders.
  - No new paid service, account system, or large data model is introduced without an explicit product decision.
- **Evidence:**
  - Command: `pnpm test` passes if tests exist for the feature.
  - Command: `pnpm test:e2e` passes if E2E coverage is added for the feature.
  - Command: `pnpm lint` passes.
  - Command: `pnpm exec tsc --noEmit --pretty false` or `pnpm typecheck` passes.
  - Command: `pnpm build` passes.
  - Browser smoke: feature-specific screenshot or walkthrough demonstrates the acceptance behavior.
- **Validation command:**
  ```bash
  pnpm lint && pnpm exec tsc --noEmit --pretty false && pnpm build
  ```
  If test scripts exist for the feature:
  ```bash
  pnpm test && pnpm test:e2e
  ```

---

## Suggested PR Order

1. Production migrations and startup hardening.
2. Durable generation queue and retry/status UX.
3. Remote media SSRF/abuse hardening plus admin security headers/rate limiting.
4. Test harness and regression coverage for implemented safe fixes.
5. Database indexes, public query cleanup, pagination, and image rendering.
6. Stitch UI/accessibility acceptance pass.
7. Module refactors and verified dead-code cleanup.
8. Product-readiness features.

## Standard Validation Gate

Run this full gate before merging any roadmap PR once the missing scripts are added:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level low
```

Until `typecheck` and `test` scripts exist, use the existing commands:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm exec tsc --noEmit --pretty false
pnpm build
pnpm audit --audit-level low
```

For deployment-affecting PRs, also validate Docker and migrations against a disposable database when Docker is available:

```bash
docker compose config
docker compose build
docker compose up -d db
docker compose run --rm app pnpm prisma migrate deploy
```
