#!/usr/bin/env bash
set -euo pipefail
cd /workspace/Ome-Md
export PATH="/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node -e "if (Number(process.versions.node.split('.')[0]) !== 24) { console.error('Dr. Commerce requires Node.js 24.'); process.exit(1); }"
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm run db:setup
npm run db:migrate
npm run db:seed
npm run check
npm test
npm run build
