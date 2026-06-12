# Updates

2026-06-12: Completed baseline audit and converted findings into a phased implementation roadmap.
2026-06-12: Replaced production runtime schema push/seeding with Prisma migration deployment and added the initial migration path.
2026-06-12: Added production config, dependency, and CI quality gates, including typecheck/audit scripts, pinned dependencies, server env parsing, and Prisma config cleanup.
2026-06-12: Replaced detached generation work with durable `GenerationJob` queue processing, worker support, retry/status handling, and admin job visibility.
2026-06-12: Hardened generation failures with missing-level validation, stable error categories, bounded safe payloads, retry guidance, and focused tests.
2026-06-12: Hardened remote image ingestion against SSRF, private networks, redirects, non-image MIME responses, slow responses, and oversized downloads.
2026-06-12: Added admin login throttling, baseline security headers, and report-only CSP coverage.
2026-06-12: Added Vitest coverage for core server helpers plus Playwright smoke coverage for public, reader, feeds, admin login, and dashboard flows.
2026-06-12: Added database indexes, improved public listing queries, added article pagination, and moved audited public images to `next/image`.
2026-06-12: Restored Stitch MVP public UX requirements with the how-it-works section, article metadata chips, copyable feed URLs, and accessibility/nav polish.
2026-06-12: Split dense admin/generation modules, removed verified dead code/assets, moved fonts to `next/font`, and added local reader comfort mode.
2026-06-12: Cleaned docs by moving completed roadmap evidence into this compact history and reducing `ROADMAP.md` to remaining work.
