# LingoLens Remaining Roadmap

Source audit: `AUDIT-2026-06-12.md`

Most P1/P2 findings from the June 12 audit have been implemented. This plan tracks only remaining or recurring work so future agents do not have to sift through completed evidence. Historical checkpoints are summarized in `UPDATES.md`.

## Execution Rules

- Treat each task as one narrow PR unless the user asks otherwise.
- Do not re-implement completed audit fixes unless tests reveal regressions.
- Keep `source content + target locale + reading level = adaptation` as the data model.
- Do not add Spanish-specific database columns.
- Keep OpenAI keys server-side only.
- Do not expose rights-management fields in admin UI until the rights workflow is designed.
- Preserve Docker/Unraid behavior with `DATA_DIR` as the host-side persistent data root.
- Avoid README/AGENTS/UPDATES churn unless commands, deployment, behavior, or workflow guidance changes.

## Phase 0 - Release Gate

No confirmed P0 blocker is open from the audit.

- **Acceptance:** No newly discovered data-loss, production-crash, security-breach, or privacy P0 remains open before lower-priority work ships.
- **Evidence:** PR notes state whether a new P0 was found. If none, no code change is required.

## Phase 1 - Remaining Security And Operations Polish

### Task 1.1 - Retain Generation Failure Evidence

- **Goal:** Let admins clear noisy failure banners without deleting useful diagnostics.
- **Likely files:** `prisma/schema.prisma`, `prisma/migrations/*`, generation/admin failure display helpers, admin clear-error action.
- **Notes:** The audit flagged clearing errors by nulling `errorMessage` and `responsePayload`. Prefer an acknowledgement field such as `acknowledgedAt`/`acknowledgedBy` or an equivalent hidden-from-dashboard marker.
- **Acceptance:** Clearing visible failures preserves bounded error category/message/payload for later debugging.
- **Validation:** `pnpm prisma generate`, `pnpm test -- generation`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

### Task 1.2 - Constrain Public Media To Stored Assets

- **Goal:** Ensure `/media/...` only serves app-created public media, not arbitrary files under `UPLOAD_DIR`.
- **Likely files:** `app/media/[...path]/route.ts`, `lib/media.ts`, media tests.
- **Notes:** A `media/` prefix constraint exists; consider validating requested keys against `MediaAsset.storageKey` if future uploads share the same root.
- **Acceptance:** Public media requests cannot read non-media or non-recorded upload paths.
- **Validation:** `pnpm test -- media`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Phase 2 - Product Readiness Features

### Task 2.1 - Rights Review Dashboard

- **Goal:** Prepare for real third-party source/image workflows without exposing half-designed rights fields in existing edit forms.
- **Likely files:** admin rights route/components, `ContentRightsRecord`, `MediaAsset`, publishing helpers.
- **Notes:** Keep current publish semantics stable. Show blockers, text/image states, and review actions only once the workflow is explicit.
- **Acceptance:** Admins can review rights states and understand publish blockers without changing source/adaptation content.
- **Validation:** focused rights tests, `pnpm lint`, `pnpm typecheck`, `pnpm build`, admin browser smoke.

### Task 2.2 - Locale Expansion Readiness

- **Goal:** Safely launch the next target locale without schema rewrites.
- **Likely files:** `prisma/seed.ts`, locale/profile admin or config helpers, reader display components, tests.
- **Notes:** Pick a real next locale before building broad abstractions. Include script direction, segmentation, romanization/ruby needs, and feed URL behavior in fixtures.
- **Acceptance:** A selected second locale can be seeded/configured and rendered in public reader/RSS flows with correct locale metadata.
- **Validation:** locale-specific unit tests, E2E smoke for the chosen locale, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

### Task 2.3 - Reader Comfort Mode Iteration

- **Goal:** Refine the local reader comfort preference based on actual use.
- **Likely files:** reader components, reading tools/sidebar, `app/globals.css`, E2E tests.
- **Notes:** Keep the feature account-free. Avoid adding persistence beyond `localStorage` unless product direction changes.
- **Acceptance:** Preference remains keyboard-accessible, persists locally, and improves text/spacing/motion without harming normal reading.
- **Validation:** `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Phase 3 - Maintainability

### Task 3.1 - Continue Focused Module Splits

- **Goal:** Keep mutation-heavy server logic readable as features grow.
- **Likely files:** admin action modules, generation modules, publishing helpers, tests.
- **Notes:** Tests now exist, so small extractions are acceptable when they reduce real coupling. Do not rename route paths or public action exports casually.
- **Acceptance:** Auth, content CRUD, publishing, generation queue, schema/payload parsing, and side-effectful runner code remain clearly separated.
- **Validation:** `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

### Task 3.2 - Periodic Dead-Code And Asset Review

- **Goal:** Prevent design leftovers and obsolete assets from accumulating.
- **Likely files:** `app/globals.css`, `public/brand/*`, `lib/*`, docs.
- **Notes:** Use `rg` before removal. Keep classes/assets that are referenced by planned or current UI.
- **Acceptance:** Removed symbols/assets have no references and no near-term planned use.
- **Validation:** targeted `rg` checks, `git diff --check`, plus app validation when code/assets change.

## Standard Validation Gate

For most code changes:

```bash
pnpm install
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level low
```

For E2E-affecting UI work:

```bash
pnpm test:e2e
```

For deployment or Docker changes, when Docker is available:

```bash
docker compose config
docker compose build
```
