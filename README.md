# LingoLens

LingoLens is a Next.js App Router MVP for turning source texts into multilingual, leveled reading experiences. The first target locale is Spanish (Latin American) (`es-419`), but the data model uses locale and reading-level dimensions instead of language-specific columns.

## Stack

- Next.js App Router and TypeScript
- PostgreSQL with Prisma
- Zod input validation
- Official OpenAI Node SDK, server-side only
- Sanitized Markdown rendering
- Docker and Docker Compose for Unraid

## Local Setup

```bash
pnpm install
cp .env.example .env
```

Set `ADMIN_EMAIL`, set a temporary `ADMIN_PASSWORD`, then set `AUTH_SECRET` to a long random string. The first startup hashes `ADMIN_PASSWORD` into the database-backed admin account. After you verify login, remove `ADMIN_PASSWORD` from `.env`.

For local Postgres with Docker:

```bash
docker compose --env-file .env up -d db
pnpm prisma:push
pnpm seed
pnpm bootstrap-admin
pnpm dev
```

Open `http://localhost:3000`. Admin login is at `/admin/login`.

If you need to reset the admin password later, set `ADMIN_PASSWORD` to the new password and `BOOTSTRAP_ADMIN=true`, restart the app once, then remove `ADMIN_PASSWORD` and set `BOOTSTRAP_ADMIN=false`.

## Environment Variables To Change

- `AUTH_SECRET`: set to a long random value.
- `IMAGE_REPO`: set to the container image repository, such as `ghcr.io/<github-owner>/lingo-lens`.
- `IMAGE_TAG`: set to the image tag to run, usually `latest` for the MVP.
- `HOST_PORT`: set the host port exposed by Docker or Unraid.
- `APP_PORT`: set the internal container port for Next.js. Keep this as `3000` unless you also change the container port mapping.
- `ADMIN_EMAIL`: set to your admin email.
- `ADMIN_PASSWORD`: temporary bootstrap password. The app hashes this into Postgres on startup; remove it after verifying login.
- `BOOTSTRAP_ADMIN`: set `true` to reset the admin password from `ADMIN_PASSWORD` on startup, then set it back to `false`.
- `POSTGRES_PASSWORD`: set a strong database password.
- `DATABASE_URL`: match your database host and password.
- `APP_URL`: set to the public URL of your deployment.
- `OPENAI_API_KEY`: set a real key to enable OpenAI generation. Without it, the app uses mock generation.
- `OPENAI_MODEL`: defaults to `gpt-5.1`; change it if that model is unavailable to your account.
- `DATA_DIR`: host-side persistent data root. For Unraid, set this to the app's folder under your appdata share.

`REQUIRE_RIGHTS_APPROVAL_TO_PUBLISH=false` by default. The backend stores rights records, but rights fields are intentionally hidden from the MVP admin UI.

## Prisma

```bash
pnpm prisma:generate
pnpm prisma:push
pnpm seed
```

The seed creates:

- English (United States) and Spanish (Latin American)
- four reading levels
- four Spanish locale-level profiles
- four Spanish RSS feed configs
- one sample source item with all four published adaptations

## OpenAI Generation

Generation runs only on the server. The browser never receives `OPENAI_API_KEY`.

The pipeline is:

1. Store source content.
2. Automatically create a hidden rights record.
3. Extract or mock a fact bank.
4. Generate each selected adaptation from `source content + fact bank`.
5. Store reviewable adaptations with QA notes.

When `OPENAI_API_KEY` is missing or still set to `sk-replace-me`, deterministic mock Spanish adaptations are created so the whole workflow remains usable.

## Deploy on Unraid

1. Create an app folder under your Unraid appdata share.
2. Place this repo in that folder.
3. Create `.env` from `.env.example`.
4. Change the required secrets listed above.
5. Set the host-side data root:

```env
DATA_DIR=<your-appdata-path>/lingo-lens
UPLOAD_DIR=/app/uploads
HOST_PORT=3000
APP_PORT=3000
```

`DATA_DIR` controls where Postgres and uploads live on the Unraid host. `UPLOAD_DIR` is the immutable container's internal mount path and usually should stay `/app/uploads`. To expose the app on a different Unraid port, change `HOST_PORT` and leave `APP_PORT=3000`.

6. Make persistent folders:

```bash
mkdir -p <your-appdata-path>/lingo-lens/postgres <your-appdata-path>/lingo-lens/uploads
```

7. Start the stack:

```bash
docker compose --env-file .env up -d --build
```

To use a prebuilt GHCR image instead of building locally, set:

```env
IMAGE_REPO=ghcr.io/<github-owner>/lingo-lens
IMAGE_TAG=latest
```

The compose file uses:

- `${IMAGE_REPO}:${IMAGE_TAG}` for the app image name
- `${DATA_DIR}/postgres:/var/lib/postgresql/data`
- `${DATA_DIR}/uploads:/app/uploads`
- host port `${HOST_PORT:-3000}` mapped to container port `${APP_PORT:-3000}`
- `restart: unless-stopped`

On container start, the app runs `prisma db push`, seeds idempotent starter data, bootstraps the admin account when needed, then starts Next.js.

If the app logs say it is serving but the Unraid host port will not connect, check that the host port maps to container port `3000`. For example, use `HOST_PORT=4716` and `APP_PORT=3000`, not `PORT=4716`.

## Useful Routes

- `/` public homepage
- `/read/es-419/beginner/tradiciones-de-dia-de-muertos` sample reading
- `/feeds` feed directory
- `/feeds/es-419/beginner.xml` RSS feed
- `/admin/login` admin login
- `/admin` content dashboard

## Reference Docs

Product, roadmap, audit, guidance, and design reference materials live in `references/`. The detailed Stitch design export is kept at `references/lingo-lens-design/` and should not be served publicly.

## Notes

The MVP intentionally omits learner accounts, payments, classroom tools, scraping, audio, and full rights-management UI. Rights storage and publish gating support are present for later expansion.
