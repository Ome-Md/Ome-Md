# Dr. Commerce Academy

Read the relevant version-matched Next.js guide in `node_modules/next/dist/docs/` before changing framework code. This project uses Next.js 16 App Router, PostgreSQL, and server-side authorization.

Use the existing isolated checkout. Do not create a Git worktree unless the user requests one. Preserve existing data and source changes. Generated local credentials and PostgreSQL files belong in ignored `.academy-data/` and `.env.local`, never in source or logs.

Keep all training fixtures explicitly synthetic. A checklist or quiz cannot grant operational approval. Review decisions require authorized trainers and traceable evidence. Final certification requires all 45 daily milestones, the competency gates, a passing weighted assessment, and no unresolved critical failures.

Validate with `npm run check`, `npm test`, the real HTTP acceptance suite, and browser checks. Do not run acceptance tests against a production database. See the README for installation and deployment.
