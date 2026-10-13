# Cloud startup: Dr. Commerce Academy

Use the existing isolated checkout at `/workspace/Ome-Md`. Do not create a Git worktree or scaffold the project again. The app is Dr. Commerce Academy; its remote remains Ome-Md/Ome-Md. The checkout began with an unborn branch and the source files are retained locally.

Node.js 24 is required (tested 24.19.0). In this cloud runtime activate it with:

```sh
export PATH="/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
cd /workspace/Ome-Md
node --version
```

Source, lockfile, dependencies and database bind files can be retained in the snapshot. Running processes/connections must restart. Preserve `.env.local`, `.academy-data/postgres.env`, database files and private evidence. Never print credentials or reset existing data. If dependency installation is needed, use `npm ci --cache /workspace/.cache/npm --no-audit --no-fund`; do not modify source or lockfiles during setup.

1. Start/validate the Docker daemon supplied by this environment. Run from the project root:

```sh
npm run db:setup
npm run db:migrate
npm run db:seed
```

The helper starts only `dr-commerce-postgres`, using the pinned image, loopback port 54329 and the retained bind directory. Setup/migrations/seed are repeatable and preserve existing data. This is the local development workflow; if an explicit hosted configuration exists, preserve it and follow `docs/deployment.md` instead of substituting local credentials.

2. Start `npm run dev` in a persistent terminal with `tty:true` so it can be stopped as a process group. Next.js uses port 3000. If that port is occupied, verify whether it is this app and reuse an appropriate existing server; do not terminate unrelated services.

3. Inspect startup logs, then request:

```sh
curl --fail --silent --show-error http://127.0.0.1:3000/api/health
```

Expect status `ok`, database `PostgreSQL`, and local authentication. Check the login page renders in a browser. Do not create user-facing localhost preview links; this onboarding UI does not support them.

4. Perform a private local functional smoke check. Python Playwright and `/usr/bin/chromium` are supplied by this runtime:

```sh
python3 - <<'PY'
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
credentials=json.loads(Path('.academy-data/demo-credentials.json').read_text())['student']
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:3000/',wait_until='domcontentloaded')
    expect(page.get_by_role('heading',name='Let’s keep moving forward.')).to_be_visible(timeout=30000)
    page.get_by_label('Email address',exact=True).fill(credentials['email'])
    page.get_by_label('Password',exact=True).fill(credentials['password'])
    page.get_by_role('button',name='Sign in to Academy',exact=True).click()
    expect(page.get_by_role('heading',name='Welcome back, Ayesha.')).to_be_visible(timeout=30000)
    data=page.request.get('http://127.0.0.1:3000/api/bootstrap').json()
    assert data['user']['role']=='student' and len(data['lessons'])==45
    assert not errors,errors
    browser.close()
print('Local login, scoped curriculum and rendered dashboard passed.')
PY
```

This smoke check reads ignored generated credentials internally and prints no values. If the seeded fixture has deliberately been disabled/renamed, use the isolated browser suite rather than recreating/resetting it.

5. After relevant edits, run `npm run check`, `npm test` and `npm run build`. For workflow changes run `npm run test:acceptance`; for UI changes run `npm run test:browser`. Isolated runners use a separate local database/server and refuse hosted connections. Stop only servers you started. For production startup, stop this app's dev process, build, then run `npm start` in a persistent terminal and repeat the readiness/functional checks.

Hosted deployment needs a new Supabase project and credentials entered securely, as documented in `docs/deployment.md`. No hosted credentials are required for this local environment. Cloud draft saving and filesystem validation do not publish the environment or prove restoration in a fresh task.
