# Dr. Commerce Academy

A working training and operations portal for Dr. Commerce, a subsidiary of NGB Consultancy. Built with Next.js App Router, TypeScript, React, Tailwind CSS, Lucide, Motion, Recharts and PostgreSQL. Hosted authentication and storage use Supabase; development uses local sessions and private files.

## Run locally

Requires Node.js 24, npm and a running Docker daemon. From this checkout:

```sh
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm run db:setup
npm run db:migrate
npm run db:seed
npm run dev
```

Setup starts the pinned PostgreSQL 17 container on loopback port 54329. It generates credentials in ignored `.env.local` and `.academy-data/` files with restricted permissions. Database files persist in `.academy-data/postgres/`. Repeating setup, migrations and seed preserves existing academy records. Do not delete the database directory to restart it.

The local seed contains four explicitly synthetic identities across two cohorts. With `DEMO_MODE=true`, login offers learner, trainer and management demonstrations. For private development set `DEMO_MODE=false`; generated passwords remain in `.academy-data/demo-credentials.json`. Never publish that file or copy its contents into logs. Demo sign-in is disabled in Supabase mode and on Vercel.

## Capabilities

- Role-scoped learner, trainer, management and auditor workspaces, with PostgreSQL row-level security and server authorization.
- 45 editable daily lessons, foundations plus the 14 operating stages, instructor scripts, presentation mode, checklists, personal notes and classroom assignments.
- 15 native operational forms, 50 research exercises, autosaved drafts, evidence uploads, linked records, version history, field-level corrections and reviewed progression.
- Seven competency gates, server-graded quizzes and weighted certification requiring all 45 milestones, a passing grade and no unresolved critical failure.
- Supplier qualification, variation mapping, listing previews, synthetic order/tracking scenarios, customer response practice and financial reconciliation.
- Consistent ROI and break-even calculations: the supplied stopwatch example produces **143.8% ROI**, with its unsupported 101% claim explained.
- Notifications, performance charts, cohort management, invitations, manual fee records, central branding, CSV exports and printable certification/report views.
- Responsive navigation, persisted themes and a PWA manifest with an offline explanation. Saving requires connectivity; private records/evidence are never cached offline.

Examples and carrier events are explicitly synthetic. Only authorized review can verify real evidence. No live eBay publishing, purchasing, tracking integration or bank payment verification is claimed. Videos, original logos and proprietary media await authorized uploads. Upload the original Dr. Commerce and NGB files through **Profile & Settings → Brand identity**. NGDL remains contextual institutional branding.

## Verify

```sh
npm run check
npm test
npm run test:acceptance
npm run test:browser
npm run build
npm start
```

Unit tests exercise domain behavior and actual PostgreSQL RLS using seeded local fixtures. Acceptance/browser runners create isolated temporary databases, start a separate server on port 3100, generate private fixtures, exercise real workflows and remove their databases. They refuse hosted/nonlocal databases and leave development data unchanged. Diagnostics remain in ignored `.academy-data/tests/`. Browser checks require Python Playwright and `/usr/bin/chromium`, provided in this cloud environment. See [validation notes](docs/validation.md).

## Deploy and develop

Follow [new Supabase project and Vercel instructions](docs/deployment.md). Hosted seed creates curriculum only. `npm run db:admin` maps the first administrator to a real Supabase Auth identity; hosted seeding creates no fake credentials or preapproved progress. Remote deployment needs your project credentials and has not been exercised without them.

`app/` contains routes; `src/components/` contains the interfaces; `src/lib/` contains authorization, workflows, forms, costing and storage; `supabase/` contains schema/RLS/storage policies; `scripts/` contains repeatable setup and verification; `tests/` contains domain, HTTP and browser checks. The [original brief](docs/project-brief.md) is retained.

The application uses the existing `Ome-Md/Ome-Md` checkout; its remote name remains unchanged. Read `AGENTS.md` before development. Never commit generated credentials, database files or private evidence.
