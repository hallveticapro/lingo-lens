# Product Requirements Document: LingoLens

**Version:** 0.1  
**Status:** Draft for MVP build  
**Primary target language for MVP:** Latin American Spanish (`es-419`)  
**Future target languages:** Designed for multilingual expansion  
**Working repo name:** `lingo-lens`

---

## 1. Product Summary

LingoLens is a web app that turns manually provided source texts into learner-friendly reading experiences across multiple difficulty levels and target languages.

The MVP starts with Latin American Spanish because that is the first learning target, but the system must be designed from the beginning to support many future languages, locales, scripts, and proficiency frameworks.

The app is not merely a translation tool. It is a **graded reading adaptation system**. For lower levels, the source text may need to be simplified, shortened, scaffolded, and restructured while preserving the core facts or story. For higher levels, the output should be closer to a natural target-language version of the original.

The reader-facing promise:

> Read real-world texts in the language you are learning, at a level you can actually understand.

---

## 2. Problem Statement

Language learners often struggle to find interesting reading material that is both authentic and comprehensible. Real news articles, essays, and stories are usually too difficult for beginners. Traditional beginner content is often boring, artificial, or disconnected from real-world topics.

This product solves that by letting an admin provide a source article or story once, then generating multiple target-language adaptations at different reading levels.

---

## 3. Goals

### 3.1 MVP Goals

1. Allow an admin to manually add a source article, short story, public-domain story, original text, or lesson text.
2. Generate four Latin American Spanish reading versions:
   - Super Beginner
   - Beginner
   - Intermediate
   - Natural
3. Store generated versions in the database.
4. Let an admin review, edit, regenerate, publish, archive, and unpublish generated adaptations.
5. Let readers browse and read published adaptations without logging in.
6. Let readers switch reading levels for the same source item.
7. Provide RSS feeds by target locale and reading level.
8. Build backend rights metadata now, but do not expose rights-management UI during proof of concept.
9. Use a database design that supports future languages without schema rewrites.
10. Package the app for deployment on Unraid using Docker, `docker-compose.yml`, and `.env.example`.

### 3.2 Non-Goals for MVP

Do not build these in the initial version:

- Automated article scraping or RSS ingestion.
- Public user accounts.
- Paid subscriptions.
- Classroom rostering.
- Student progress tracking.
- Spaced repetition.
- Audio narration.
- Mobile app.
- Full rights-management frontend.
- Multiple public target languages.
- Country-specific language variants beyond `es-419`.
- Automated publishing without admin review.
- Complex analytics dashboards.

---

## 4. Product Positioning

### 4.1 Working Description

LingoLens transforms source texts into multilingual, leveled reading experiences for language learners. Each content item can have many adaptations, where each adaptation is tied to a target locale and reading level.

### 4.2 Core Mental Model

```text
source content
+ target locale
+ reading level
= adaptation
```

Example:

```text
Source content: "Scientists Discover New Frog Species"

Adaptations:
- es-419 + super_beginner
- es-419 + beginner
- es-419 + intermediate
- es-419 + natural

Future adaptations:
- fr-FR + beginner
- ja + super_beginner
- ko-KR + intermediate
```

---

## 5. Users and Personas

### 5.1 Reader

A reader wants to read interesting material in a target language at a difficulty level that feels manageable.

Reader needs:

- Browse latest published readings.
- Choose a target language.
- Choose a reading level.
- Switch levels while reading.
- Subscribe to a level-specific RSS feed.
- Read without creating an account.

### 5.2 Admin / Content Editor

An admin manually adds source texts, generates adaptations, reviews AI output, edits when needed, and publishes.

Admin needs:

- Create source content quickly.
- Provide title, body, source, publication date, and image metadata.
- Generate all configured levels for a target locale.
- Review and edit generated versions.
- Regenerate one level without losing other versions.
- Publish only after review.
- See generation errors clearly.

### 5.3 Future Language Editor

A future editor may manage French, Japanese, Korean, Arabic, Mandarin, or other target languages.

Future language editor needs:

- Configure a locale.
- Configure level behavior for that locale.
- Use language-specific scaffolds such as furigana, romanization, right-to-left rendering, or script variants.
- Avoid code changes for every new language.

---

## 6. Reading Levels

The app should use internal reading-level keys, not only CEFR levels. CEFR is useful for Spanish, French, and other European languages, but other languages may use frameworks like JLPT, TOPIK, or HSK.

| Internal Key | Display Label | Spanish MVP Mapping | Description |
|---|---|---:|---|
| `super_beginner` | Super Beginner | A0-A1-ish | Very short, heavily adapted, highly scaffolded |
| `beginner` | Beginner | A1-A2-ish | Simple sentences and common vocabulary |
| `intermediate` | Intermediate | B1-B2-ish | More natural, more complete detail |
| `natural` | Natural | C1-C2-ish / fluent | Natural target-language version |

Use `natural` internally instead of `native`. “Native” is not a stable proficiency level and can become awkward across languages. The product can always display a friendlier label later.

---

## 7. Locale and Language Requirements

### 7.1 Locale Tags

Use BCP 47-style locale tags throughout the system.

Examples:

- `en-US`
- `es-419`
- `es-MX`
- `fr-FR`
- `fr-CA`
- `ja`
- `ko-KR`
- `zh-Hans`
- `zh-Hant`
- `ar`

### 7.2 Locale Must Not Be Hardcoded

Do not create language-specific database columns such as:

```text
title_es
body_es
title_fr
body_fr
```

Instead, every generated reading should be an adaptation row with:

```text
target_locale_id
reading_level_id
title
body_markdown
```

### 7.3 Locale Metadata

Each locale should store:

- BCP 47 tag.
- Language code.
- Script code, optional.
- Region code, optional.
- English display name.
- Native display name.
- Text direction: `ltr` or `rtl`.
- Segmentation strategy.
- Whether ruby/furigana-style annotations are supported.
- Whether romanization is supported.
- Whether the locale can be used as a source.
- Whether the locale can be used as a target.
- Whether the locale is public.

---

## 8. Functional Requirements

## 8.1 Public Reader Experience

### Requirements

Readers can:

1. View a homepage with latest published readings.
2. Filter or browse by target locale.
3. Filter or browse by reading level.
4. Open a published reading.
5. Switch levels for the same source item.
6. Access a language-level RSS feed.

Article pages display:

- Localized/adapted title.
- Optional subtitle/dek.
- Header image, if available.
- Target locale.
- Reading level.
- Source name.
- Original source URL, if available.
- Original publication date, if available.
- App publication date.
- Last updated date.
- Body text.
- Vocabulary list, if generated.
- Comprehension questions, if generated.
- Content warning, if applicable.

### URL Structure

Use locale and level in public URLs from day one.

```text
/read/es-419/super-beginner/:slug
/read/es-419/beginner/:slug
/read/es-419/intermediate/:slug
/read/es-419/natural/:slug
```

Future examples:

```text
/read/fr-FR/beginner/:slug
/read/ja/super-beginner/:slug
/read/ko-KR/intermediate/:slug
```

### HTML and Accessibility

- Set the page `lang` attribute based on the target locale.
- Set text direction based on locale metadata.
- Require alt text for uploaded/header images when feasible.
- Render Markdown safely.
- Use semantic headings.

---

## 8.2 Admin Content Creation

### UI Recommendation

Use a full admin page, not a modal. A modal will become too cramped for long source text, source metadata, image handling, generation status, review tabs, and error handling.

### Visible MVP Fields

Admin can enter:

- Source title.
- Source subtitle, optional.
- Source body.
- Source locale, default `en-US`.
- Content type:
  - `news_article`
  - `public_domain_story`
  - `original_story`
  - `lesson_text`
  - `other`
- Source name.
- Source URL.
- Original author, optional.
- Original publication date.
- Header image upload or image URL.
- Image alt text.
- Internal notes.
- Target locale, default `es-419` for MVP.
- Levels to generate, default all public active levels.

### Backend-Only Rights Fields for POC

The backend must support rights metadata now, but the admin frontend should not expose it yet.

Backend rights fields:

- Text rights status.
- Image rights status.
- License name.
- License URL.
- Attribution text.
- Rights notes.
- Reviewed by.
- Reviewed at.

Default behavior during proof of concept:

- `text_rights_status = unreviewed`
- `image_rights_status = unreviewed`
- Publishing is allowed even when rights are unreviewed.

Use a feature flag:

```text
REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH=false
```

Later, this can be changed to:

```text
REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH=true
```

When enabled, the backend should block publishing if rights are unreviewed, unknown, rejected, or missing.

---

## 8.3 AI Generation

### Requirements

The app uses the OpenAI API to generate adaptations.

Generation must happen server-side only. The OpenAI API key must never be exposed to the browser.

Generated content should be stored in the database and served from the database. Do not generate on every page load.

### Generation Pipeline

1. Admin creates source content.
2. Backend stores source content as `draft`.
3. Backend automatically creates backend-only rights record as `unreviewed`.
4. Admin clicks Generate.
5. Backend creates a generation job.
6. Backend extracts a fact bank from the source content.
7. Backend generates one adaptation per selected target locale and reading level.
8. Backend runs a QA pass for each adaptation.
9. Adaptations are stored as `needs_review`.
10. Admin reviews and edits.
11. Admin publishes.

### Important Generation Principle

Do not cascade levels.

Bad:

```text
Original -> Natural -> Intermediate -> Beginner -> Super Beginner
```

Good:

```text
Original + fact bank -> Super Beginner
Original + fact bank -> Beginner
Original + fact bank -> Intermediate
Original + fact bank -> Natural
```

This reduces telephone-game drift.

### Fact Bank Requirements

Extract and store:

- People.
- Places.
- Organizations.
- Dates.
- Numbers.
- Key events.
- Cause/effect relationships.
- Direct quotes.
- Sensitive topics.
- Terms that should not be translated or changed.
- Possible ambiguity.
- Claims that require careful preservation.

### QA Requirements

For each adaptation, check:

- Essential facts preserved.
- No invented unsupported details.
- Names, dates, numbers, and places unchanged unless intentionally adapted.
- Correct target locale.
- Correct reading level.
- No unwanted dialect contamination.
- Direct quotes handled safely.
- Sensitive content flagged.
- Vocabulary list accurate.

---

## 8.4 RSS Feeds

Provide RSS feeds per target locale and reading level.

MVP feed URLs:

```text
/feeds/es-419/super-beginner.xml
/feeds/es-419/beginner.xml
/feeds/es-419/intermediate.xml
/feeds/es-419/natural.xml
```

Each RSS item represents one adaptation, not just one source content item.

### RSS Item Requirements

Each item should include:

- Title.
- Link to the public adaptation URL.
- Description or excerpt.
- App publication date as `pubDate`.
- Stable GUID.
- Category/content type.
- Source attribution, if available.
- Optional image enclosure only when safe and available.

Recommended GUID format:

```text
content:{content_item_id}:locale:{bcp47_tag}:level:{reading_level_key}
```

Do not change GUIDs when editing typos. RSS readers may treat a changed GUID as a new item.

Use the app publication date in RSS, not the original article date. A newly adapted older story should still appear as new to feed readers.

---

## 9. Database Requirements

Use PostgreSQL.

Use UUID primary keys.

Use JSONB for flexible generated scaffolds, language-specific constraints, vocabulary, QA reports, prompt payloads, and annotations.

The schema must support multilingual expansion without adding language-specific columns.

---

## 9.1 `locales`

Stores supported source and target locales.

Required fields:

- `id`
- `bcp47_tag`, unique
- `language_code`
- `script_code`, nullable
- `region_code`, nullable
- `display_name_en`
- `native_name`, nullable
- `direction`, default `ltr`
- `segmentation_strategy`, default `whitespace`
- `supports_ruby_annotations`, default false
- `supports_romanization`, default false
- `default_romanization_system`, nullable
- `is_enabled_as_source`, default true
- `is_enabled_as_target`, default false
- `is_public`, default false
- timestamps

MVP seed:

- `en-US`: source enabled
- `es-419`: source enabled, target enabled, public

Optional inactive seeds:

- `fr-FR`
- `ja`
- `ko-KR`
- `ar`
- `zh-Hans`

---

## 9.2 `reading_levels`

Stores global app-owned reading levels.

Required fields:

- `id`
- `key`, unique
- `display_name`
- `short_description`
- `sort_order`
- `is_active`
- `is_public`
- timestamps

MVP seed:

- `super_beginner`
- `beginner`
- `intermediate`
- `natural`

---

## 9.3 `locale_level_profiles`

Defines how a reading level behaves for a specific target locale.

Required fields:

- `id`
- `locale_id`
- `reading_level_id`
- `external_framework_mappings`, JSONB
- `generation_constraints`, JSONB
- `vocabulary_constraints`, JSONB
- `scaffold_config`, JSONB
- `is_generation_enabled`
- `is_public`
- timestamps

Unique constraint:

```text
locale_id + reading_level_id
```

Example Spanish beginner profile:

```json
{
  "external_framework_mappings": {
    "cefr_estimate": "A1-A2"
  },
  "generation_constraints": {
    "target_word_count_min": 250,
    "target_word_count_max": 500,
    "sentence_style": "short and direct",
    "allowed_tenses": ["present", "preterite", "near_future"],
    "avoid": ["vosotros", "regional slang", "dense idioms"],
    "locale_notes": "Use broadly neutral Latin American Spanish."
  },
  "vocabulary_constraints": {
    "max_terms": 8,
    "include_english_meanings": true,
    "include_example_sentences": true
  },
  "scaffold_config": {
    "include_summary": true,
    "include_comprehension_questions": true,
    "question_count": 4
  }
}
```

---

## 9.4 `content_items`

Stores the original source content and metadata.

Required fields:

- `id`
- `slug`, unique
- `content_type`
- `status`
- `source_locale_id`
- `source_title`
- `source_subtitle`, nullable
- `source_body`
- `source_name`, nullable
- `source_url`, nullable
- `original_author`, nullable
- `original_publication_date`, nullable
- `header_media_asset_id`, nullable
- `internal_notes`, nullable
- `created_by`, nullable for MVP
- `published_at`, nullable
- `archived_at`, nullable
- timestamps

Statuses:

- `draft`
- `generating`
- `needs_review`
- `published`
- `archived`

---

## 9.5 `media_assets`

Stores uploaded or externally referenced images.

Required fields:

- `id`
- `storage_provider`
- `storage_key`, nullable
- `public_url`, nullable
- `mime_type`, nullable
- `file_size_bytes`, nullable
- `alt_text`, nullable
- `caption`, nullable
- `source_url`, nullable
- `creator_name`, nullable
- `rights_status`, default `unreviewed`
- `license_name`, nullable
- `license_url`, nullable
- `attribution_text`, nullable
- `rights_notes`, nullable
- `created_by`, nullable
- timestamps

---

## 9.6 `content_rights_records`

Backend-only during proof of concept.

Required fields:

- `id`
- `content_item_id`, unique
- `text_rights_status`, default `unreviewed`
- `image_rights_status`, default `unreviewed`
- `license_name`, nullable
- `license_url`, nullable
- `attribution_text`, nullable
- `rights_notes`, nullable
- `reviewed_by`, nullable
- `reviewed_at`, nullable
- timestamps

Allowed text rights statuses:

- `unreviewed`
- `original_owned`
- `licensed`
- `public_domain_verified`
- `creative_commons_allowed`
- `government_work_verified`
- `summary_only`
- `rejected`
- `unknown`

Allowed image rights statuses:

- `unreviewed`
- `original_owned`
- `licensed`
- `public_domain_verified`
- `creative_commons_allowed`
- `rejected`
- `unknown`
- `not_applicable`

---

## 9.7 `fact_banks`

Stores extracted facts used to preserve accuracy across adaptations.

Required fields:

- `id`
- `content_item_id`, unique
- `facts`, JSONB
- `entities`, JSONB
- `dates`, JSONB
- `numbers`, JSONB
- `quotes`, JSONB
- `sensitive_topics`, JSONB
- `preservation_notes`, JSONB
- `generated_by_job_id`, nullable
- timestamps

---

## 9.8 `adaptations`

Stores each generated reading version.

Required fields:

- `id`
- `content_item_id`
- `target_locale_id`
- `reading_level_id`
- `status`
- `title`
- `subtitle`, nullable
- `summary`, nullable
- `body_markdown`
- `body_blocks`, JSONB
- `vocabulary`, JSONB
- `comprehension_questions`, JSONB
- `annotations`, JSONB
- `content_warning`, nullable
- `editor_notes`, nullable
- `estimated_reading_time_seconds`, nullable
- `estimated_difficulty`, JSONB
- `generation_job_id`, nullable
- `qa_status`
- `qa_report`, JSONB
- `reviewed_by`, nullable
- `reviewed_at`, nullable
- `published_at`, nullable
- `archived_at`, nullable
- timestamps

Unique constraint:

```text
content_item_id + target_locale_id + reading_level_id
```

Statuses:

- `draft`
- `generated`
- `needs_review`
- `published`
- `archived`

QA statuses:

- `not_checked`
- `passed`
- `warning`
- `failed`

---

## 9.9 `generation_jobs`

Tracks OpenAI generation work.

Required fields:

- `id`
- `content_item_id`
- `job_type`
- `status`
- `target_locale_id`, nullable
- `requested_reading_level_ids`, array or JSONB
- `provider`, default `openai`
- `model`, nullable
- `prompt_version`, nullable
- `input_tokens`, nullable
- `output_tokens`, nullable
- `estimated_cost_cents`, nullable
- `request_payload`, JSONB, nullable
- `response_payload`, JSONB, nullable
- `error_message`, nullable
- `started_at`, nullable
- `finished_at`, nullable
- `requested_by`, nullable
- timestamps

Job types:

- `fact_bank`
- `generate_adaptations`
- `qa_check`
- `regenerate_single_adaptation`

Statuses:

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`

---

## 9.10 `prompt_templates`

Stores versioned prompts.

Required fields:

- `id`
- `key`
- `version`
- `provider`, default `openai`
- `model_default`, nullable
- `system_instructions`
- `user_template`
- `output_schema`, JSONB
- `is_active`
- timestamps

Unique constraint:

```text
key + version
```

Prompt keys:

- `extract_fact_bank`
- `generate_adaptation`
- `qa_adaptation`

Do not edit active prompts in place. Create a new prompt version.

---

## 9.11 `adaptation_revisions`

Stores edit history for adaptations.

Required fields:

- `id`
- `adaptation_id`
- `revision_number`
- `title`
- `subtitle`, nullable
- `summary`, nullable
- `body_markdown`
- `body_blocks`, JSONB
- `vocabulary`, JSONB
- `comprehension_questions`, JSONB
- `annotations`, JSONB
- `change_reason`, nullable
- `changed_by`, nullable
- `created_at`

Unique constraint:

```text
adaptation_id + revision_number
```

---

## 9.12 `rss_feed_configs`

Stores feed settings.

Required fields:

- `id`
- `target_locale_id`
- `reading_level_id`
- `slug`, unique
- `title`
- `description`
- `is_enabled`
- `include_full_content`, default false
- `max_items`, default 25
- timestamps

Unique constraint:

```text
target_locale_id + reading_level_id
```

---

## 10. API Requirements

## 10.1 Public API

### Get latest readings

```http
GET /api/public/readings?locale=es-419&level=beginner
```

### Get one reading

```http
GET /api/public/readings/:slug?locale=es-419&level=beginner
```

Returns:

- Adaptation.
- Source metadata.
- Available levels for the same content item.
- Locale metadata.
- Reading level metadata.

### Get public locales

```http
GET /api/public/locales
```

### Get public levels for a locale

```http
GET /api/public/levels?locale=es-419
```

---

## 10.2 RSS Endpoints

```http
GET /feeds/:locale/:level.xml
```

Example:

```http
GET /feeds/es-419/beginner.xml
```

---

## 10.3 Admin API

### Create content item

```http
POST /api/admin/content-items
```

Creates:

- `content_items` row.
- `content_rights_records` row with unreviewed statuses.
- `media_assets` row if applicable.

### Update content item

```http
PATCH /api/admin/content-items/:id
```

### Generate all selected versions

```http
POST /api/admin/content-items/:id/generate
```

Example body:

```json
{
  "target_locale": "es-419",
  "reading_levels": [
    "super_beginner",
    "beginner",
    "intermediate",
    "natural"
  ]
}
```

### Regenerate one adaptation

```http
POST /api/admin/adaptations/:id/regenerate
```

### Edit adaptation

```http
PATCH /api/admin/adaptations/:id
```

### Publish adaptation

```http
POST /api/admin/adaptations/:id/publish
```

### Publish all reviewed adaptations for content item

```http
POST /api/admin/content-items/:id/publish
```

### Archive adaptation

```http
POST /api/admin/adaptations/:id/archive
```

### Archive content item

```http
POST /api/admin/content-items/:id/archive
```

---

## 11. Admin Workflow

## 11.1 Create Source Content

Admin enters source content and metadata.

Backend creates:

- Source content item.
- Backend-only rights record.
- Media asset, if image provided.

Initial status:

```text
content_items.status = draft
```

## 11.2 Generate

Admin clicks Generate.

Backend:

1. Sets content item status to `generating`.
2. Creates generation job.
3. Extracts fact bank.
4. Generates adaptations.
5. Runs QA.
6. Saves adaptations as `needs_review`.
7. Sets content item status to `needs_review`.

## 11.3 Review

Admin sees one tab/card per level:

```text
Super Beginner | Beginner | Intermediate | Natural
```

Each tab/card shows:

- Generated title.
- Subtitle.
- Summary.
- Body.
- Vocabulary.
- Questions.
- QA warnings.
- Editor notes.
- Regenerate button.
- Save button.
- Publish button.

## 11.4 Publish

Admin can publish one adaptation or all reviewed adaptations.

Once published:

- Public URL is available.
- Adaptation appears in public listing.
- RSS feed includes the adaptation.

---

## 12. AI Output Schema

The model should return valid JSON matching this shape for each adaptation:

```json
{
  "title": "string",
  "subtitle": "string or null",
  "summary": "string or null",
  "body_markdown": "string",
  "body_blocks": [
    {
      "type": "paragraph",
      "text": "string",
      "annotations": []
    }
  ],
  "vocabulary": [
    {
      "term": "string",
      "meaning_en": "string",
      "part_of_speech": "string or null",
      "example_sentence": "string or null",
      "pronunciation": "string or null",
      "romanization": "string or null",
      "notes": "string or null"
    }
  ],
  "comprehension_questions": [
    {
      "question": "string",
      "answer": "string",
      "difficulty": "string"
    }
  ],
  "content_warning": "string or null",
  "editor_notes": ["string"],
  "fact_preservation_notes": ["string"]
}
```

For Spanish, `pronunciation` and `romanization` are usually null.

For Japanese, Korean, Mandarin, or other future languages, those fields may become useful.

---

## 13. Prompt Requirements

## 13.1 Base Generation Rules

The generation prompt must instruct the model to:

- Act as a language-learning editor.
- Use the target locale exactly.
- Follow the locale-level profile.
- Preserve protected facts.
- Avoid inventing details.
- Simplify without changing meaning.
- Produce level-appropriate output.
- Return only JSON matching the schema.

## 13.2 Spanish MVP Rules

For `es-419`:

- Use neutral Latin American Spanish.
- Do not use `vosotros`.
- Avoid Spain-specific idioms.
- Avoid overly regional slang unless the source requires it.
- Keep names, dates, places, and numbers consistent.
- For Super Beginner, create an adapted mini-version, not a full translation.
- For lower levels, paraphrase direct quotes unless exact quote preservation is essential.

## 13.3 Future Language Examples

For Japanese:

- Configure kanji policy.
- Configure furigana support.
- Configure politeness level.
- Configure character count instead of word count.

For Korean:

- Configure speech level.
- Configure romanization policy.
- Configure Hangul-only handling.

For Arabic:

- Configure right-to-left rendering.
- Configure Modern Standard Arabic vs dialect.
- Configure diacritics policy.

---

## 14. Authentication and Authorization

### MVP Admin Auth

Implement basic admin authentication suitable for a private proof-of-concept deployment.

Requirements:

- Public readers do not need accounts.
- Admin pages require authentication.
- Admin API routes require authentication.
- Use environment variables for admin credentials.
- Prefer a hashed admin password over plaintext.
- Provide a script or command to generate an admin password hash.

Suggested env values:

```text
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=...
AUTH_SECRET=...
```

### Future Auth

Do not block future support for:

- Multiple admins.
- User accounts.
- OAuth.
- Classroom accounts.

But do not build those now.

---

## 15. Security Requirements

- Keep OpenAI API key server-side only.
- Do not expose raw generation payloads publicly.
- Protect admin routes.
- Rate-limit generation endpoints.
- Validate and sanitize Markdown before rendering.
- Validate image uploads.
- Restrict upload file types and sizes.
- Avoid logging secrets.
- Use CSRF protection or same-site cookies for admin actions.
- Do not expose unpublished adaptations publicly.
- Do not use hidden frontend fields as a security boundary.

---

## 16. Deployment Requirements

The project must be deployable on Unraid as a Dockerized application.

### Required Files

The repo must include:

- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `.dockerignore`
- `README.md`
- `PRD.md`

### Docker Compose Services

Minimum services:

1. `app`
   - Runs the web app.
   - Exposes configurable HTTP port.
   - Reads environment variables from `.env`.
   - Uses persistent upload volume.
   - Depends on database.

2. `db`
   - PostgreSQL.
   - Uses persistent volume.
   - Has healthcheck.

Optional later:

- `worker` for background generation jobs.
- `redis` for queues/rate limiting.

For MVP, generation can run inside the app process. This is simpler but should be isolated behind clean service functions so a worker can be added later.

### Unraid-Friendly Requirements

- Use bind-mounted folders under a project-local `./data` directory by default.
- Avoid requiring Kubernetes or cloud-specific services.
- Expose one configurable app port, default `3000`.
- Include `restart: unless-stopped`.
- Include clear `.env.example` values.
- Make uploads persistent.
- Make Postgres data persistent.
- Document setup steps in `README.md`.

Suggested volume layout:

```text
./data/postgres:/var/lib/postgresql/data
./data/uploads:/app/uploads
```

### Required Environment Variables

`.env.example` should include:

```text
# App
NODE_ENV=production
APP_URL=http://localhost:3000
PORT=3000
AUTH_SECRET=change-me
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=replace-with-generated-hash
REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH=false

# Database
POSTGRES_USER=lingo_lens
POSTGRES_PASSWORD=change-me
POSTGRES_DB=lingo_lens
DATABASE_URL=postgresql://lingo_lens:change-me@db:5432/lingo_lens

# OpenAI
OPENAI_API_KEY=sk-replace-me
OPENAI_MODEL=gpt-5.1

# Uploads
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_MB=10

# RSS
RSS_MAX_ITEMS=25
```

Use a current generally available OpenAI model when implementing. Keep the model name configurable through `OPENAI_MODEL`.

---

## 17. Recommended Technical Stack

Use a pragmatic full-stack TypeScript setup.

Recommended:

- Next.js App Router.
- TypeScript.
- PostgreSQL.
- Prisma ORM.
- Zod for validation.
- OpenAI official Node SDK.
- Server-side route handlers for API endpoints.
- Markdown renderer with sanitization.
- Docker multi-stage build.
- Node runtime in Docker.

This stack is recommended because it keeps the MVP small while supporting server-rendered public pages, protected admin routes, API endpoints, and Docker deployment.

---

## 18. UX Requirements

### 18.1 Public Homepage

Show:

- Product title.
- Short explanation.
- Language selector, initially only Spanish.
- Level selector.
- Latest readings.
- RSS feed links.

### 18.2 Public Reading Page

Show:

- Header image.
- Title.
- Subtitle.
- Source metadata.
- Level switcher.
- Body.
- Vocabulary.
- Comprehension questions.
- RSS link for the current level.

### 18.3 Admin Dashboard

Show:

- List of content items.
- Status badges.
- Create new content button.
- Quick actions:
  - Edit.
  - Generate.
  - Review.
  - Publish.
  - Archive.

### 18.4 Admin Editor

Show:

- Source content form.
- Generation controls.
- Adaptation tabs/cards.
- QA report.
- Edit fields.
- Save/regenerate/publish actions.

---

## 19. Error Handling Requirements

The app must handle:

- Missing OpenAI API key.
- OpenAI request failure.
- Invalid structured output.
- Generation timeout.
- Missing source body.
- Duplicate slug.
- Missing locale-level profile.
- Unsupported target locale.
- Unsupported reading level.
- Upload failure.
- Database connection failure.
- Unauthorized admin request.

Admin errors should be clear and actionable.

Public errors should be polite and non-technical.

---

## 20. Edge Cases

### 20.1 Language Edge Cases

- Some languages do not use spaces between words.
- Some languages are right-to-left.
- Some languages require script variants.
- Some languages use different proficiency frameworks.
- Some languages need reading aids such as furigana or romanization.
- Word count is not a universal difficulty measure.

### 20.2 Content Edge Cases

- Super Beginner cannot preserve every detail of complex news.
- Quotes can be distorted when simplified.
- Numbers and dates can be accidentally changed.
- Current news may change after adaptation.
- Source stories may have multiple public-domain and copyrighted versions.
- Header images may have separate rights from text.

### 20.3 RSS Edge Cases

- The same source content creates multiple feed items, one per level.
- Edited articles should not become duplicate feed items.
- Newly adapted old stories should still appear new in RSS.
- Feed readers may strip styling or cache aggressively.

### 20.4 AI Edge Cases

- Model may invent facts.
- Model may drift from target level.
- Model may use unwanted dialect.
- Model may output invalid JSON.
- Regeneration may produce inconsistent text.

Mitigations:

- Fact bank.
- QA pass.
- Human review.
- Prompt versioning.
- Structured outputs.
- Revision history.

---

## 21. Success Metrics

### 21.1 Content Production

- Number of source items created.
- Number of adaptations generated.
- Generation success rate.
- Average time from source creation to publish.
- Percentage of outputs requiring heavy edits.

### 21.2 Reader Engagement

- Article views.
- Level switches.
- Most-read levels.
- RSS requests.
- Return visits.

### 21.3 Quality

- QA pass rate.
- Fact preservation issues per article.
- Regeneration rate by level.
- Reported errors.

---

## 22. Acceptance Criteria

The MVP is complete when:

1. Admin can log in.
2. Admin can create source content.
3. Backend automatically creates hidden rights metadata.
4. Admin can generate four `es-419` adaptations.
5. Generated adaptations are stored in the database.
6. Admin can edit generated adaptations.
7. Admin can regenerate one adaptation.
8. Admin can publish adaptations.
9. Public readers can view published adaptations.
10. Public readers can switch levels for the same source content.
11. RSS feeds exist for each Spanish reading level.
12. Locale and reading level are separate database dimensions.
13. Future locales can be added by inserting locale/profile data, not schema columns.
14. OpenAI API key is server-side only.
15. Markdown is sanitized before rendering.
16. Prompt version and model are stored for generated content.
17. The app runs locally with Docker Compose.
18. The app can be deployed on Unraid using the included Docker files.
19. `.env.example` documents required configuration.
20. `README.md` includes setup, development, migration, seed, and Unraid deployment instructions.

---

## 23. Suggested Build Phases

### Phase 1: Project Foundation

- Initialize repo.
- Add Next.js + TypeScript.
- Add Dockerfile.
- Add docker-compose.yml.
- Add .env.example.
- Add Prisma + PostgreSQL.
- Add base schema.
- Add seed data.
- Add README.

### Phase 2: Admin Auth and CRUD

- Admin login.
- Protected admin layout.
- Content item CRUD.
- Media metadata support.
- Backend-only rights record creation.

### Phase 3: AI Generation

- OpenAI client.
- Prompt templates.
- Fact bank generation.
- Adaptation generation.
- QA pass.
- Generation jobs.
- Structured response validation.

### Phase 4: Admin Review

- Review screen.
- Level tabs/cards.
- Edit adaptation.
- Regenerate adaptation.
- Publish/archive.
- Revision history.

### Phase 5: Public Reading

- Public homepage.
- Public article page.
- Level switcher.
- Locale-aware routing.
- Vocabulary/questions display.

### Phase 6: RSS

- RSS feed configs.
- XML feed generation.
- Feed autodiscovery links.
- Stable GUIDs.

### Phase 7: Polish and Hardening

- Error handling.
- Loading states.
- Rate limiting.
- Upload validation.
- README improvements.
- Test fixtures.

---

## 24. Implementation Notes for Initial Build

- Prefer a working vertical slice over perfect architecture.
- Keep generation logic modular so a background worker can be added later.
- Keep rights fields hidden in frontend but represented in database and services.
- Keep language support generic from the first migration.
- Do not optimize for hundreds of languages yet; design so hundreds are possible later.
- Include at least one seed/example source content item and generated-looking placeholder adaptation data for local UI testing without requiring an OpenAI API call.
- Make the app useful even before OpenAI is configured by allowing manual editing/creation of adaptations.

---

## 25. Default MVP Labels and Copy

Product name can remain temporary.

Suggested names in code/docs:

- Product: `LingoLens`
- Repo: `lingo-lens`
- Database: `lingo_lens`
- Docker project: `lingo-lens`

Initial tagline:

> Real-world reading, leveled for language learners.

Initial homepage explanation:

> Choose your level and read real articles or stories in Spanish. Each reading is adapted to be understandable without losing the main idea.

---

## 26. Final Product Principle

The app should always optimize for this outcome:

> A learner reads something real in the target language and thinks, “I actually understood that.”
