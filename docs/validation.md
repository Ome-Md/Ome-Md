# Validation record

Validated in the supplied cloud workspace with Node.js 24.19.0, Next.js 16.4.0 and pinned PostgreSQL 17. Remote Supabase/Vercel, email delivery, live marketplaces and fresh-task snapshot restoration were not tested.

## Automated checks

- TypeScript: strict `npm run check`.
- Domain/RLS suite: 10 tests cover ROI/fees/break-even, strict supplier thresholds, weighted selection, curriculum, synthetic order variants, password hashing and actual database role isolation/direct-write denial.
- HTTP acceptance: all 12 requested demonstrations, 15 operational forms and 45 approved daily milestones, with no skipped demonstrations. A fresh learner must finish foundation practicals and the quiz before Day 8. Evidence, corrections, version history, linked sourcing/costing/listing/orders, critical-failure rejection, final certification and logout/login persistence are exercised through the actual server/database.
- Additional HTTP cases: management-only assessed-result override, critical-failure certificate suspension and reinstatement after remediation; versioned editing of full lesson sections/rubrics/private instructor content; invalid rubric rejection.
- Browser: eight scenarios cover private login/dashboard, checklists/forms/evidence/submission, live corrections and approved parent-to-child data, navigation draft flushing, all 13 learner views, 375px touch navigation, trainer presentation/assignment and management cohort/branding controls. No browser page exceptions in the passing run.
- Hosted seed logic: isolated local PostgreSQL verification confirms 45 lessons/109 assignments, zero invented profiles/credentials/approvals/completions, and a repeat seed that preserves records. This verifies the seed branch, not remote Supabase connectivity.

Acceptance/browser databases are uniquely named, local-only and removed after verification. Development data is preserved. Results, screenshots and server diagnostics are retained in ignored `.academy-data/tests/` directories; their generated credentials/evidence must remain private.

## Deliberate boundaries

Production uses Next.js's supported Webpack build. Turbopack production file tracing failed while inspecting the protected local PostgreSQL data directory. Local database files, credentials, test fixtures and logs are excluded from deployment traces; development still uses Turbopack.

Original brand files must be uploaded through management settings. The logos seen in the conversation are reference assets; no replacement official logo was invented. Videos and proprietary screenshots require authorized assets. Seeded teaching material is editable and classified pending management review; fictional examples are explicitly labeled.

Live listing publication, purchasing, refunds, carrier integration and automatic bank verification are not connected. Server endpoints reject unauthorized live actions. Manual fee entries state their verification status. Training approval/certification does not grant permission to act on a client's live account.

Offline navigation displays an explanation; it does not claim a record was saved. Private API data, account pages and evidence are excluded from service-worker caches. CSV exports and printable competency views work; spreadsheet import, native Excel workbooks and PDF generation are not implemented.

The application is a functional initial release. Hosted credentials, SMTP, original assets, content approval and production load/backup configuration are required before live enrollment. See [deployment instructions](deployment.md).
