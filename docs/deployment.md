# Create a new Supabase project

The local academy is already usable. These steps prepare a new hosted academy using your own Supabase project and hosting account.

1. Create an organization/project at https://supabase.com/dashboard. Choose your region and a strong database password. Save credentials in a password manager or deployment secret settings.
2. In **Connect**, copy a server PostgreSQL connection string. Use a direct connection or the **session-mode** pooler on port 5432. PostgreSQL `LISTEN` needs a session connection; do not select transaction-mode pooling for this configuration. Check your host's IPv4/IPv6 support.
3. Keep TLS certificate validation enabled. Follow the provider's project certificate/trust instructions and use a verified SSL connection string, such as `sslmode=verify-full`. Never use `rejectUnauthorized:false` to hide a connection error.
4. Obtain the project URL, public legacy `anon` key and server-only legacy `service_role` key from API settings. Never prefix the service role key with `NEXT_PUBLIC_`.

## Environment variables

Use an ignored `.env.local` on a trusted administration workstation and encrypted environment settings on the deployment platform. Fill the placeholders securely; do not paste credentials into chat, source or commands that print them.

| Variable                        | Purpose/value                                         |
| ------------------------------- | ----------------------------------------------------- |
| `AUTH_MODE`                     | `supabase`                                            |
| `DEMO_MODE`                     | `false`                                               |
| `DATABASE_URL`                  | Verified server PostgreSQL connection string; private |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project HTTPS URL                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public `anon` key                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only invitation/provisioning credential        |
| `NEXT_PUBLIC_SITE_URL`          | Exact deployed HTTPS origin                           |
| `ACADEMY_ADMIN_EMAIL`           | First administrator's email; provisioning only        |

Use a separate checkout/configuration for hosted administration to preserve the local demo. Commands operate on the database selected by `DATABASE_URL`; confirm the intended project without printing its credentials.

## Initialize schema and curriculum

From the project root with Node.js 24:

```sh
npm ci
npm run db:migrate
npm run db:seed
```

Migrations apply once in order. Hosted seed creates the organization, course, 45 editable lessons, 109 assignments, quizzes and classified resources. It creates **no** synthetic identities, local credentials, approvals or completed milestones. Existing organization data is preserved; edit existing curriculum through management controls.

Run the complete [storage policy script](../supabase/storage.sql) in Supabase SQL Editor. It creates public `academy-branding`, private learner/reviewer-scoped `academy-evidence`, and private organization-scoped `academy-resources`. Evidence requires authorization and uses short-lived signed URLs. The script is repeatable.

All application tables have RLS. Browser roles cannot directly write approvals, scores, profiles or financial records. The Next.js server performs authorized mutations through its private PostgreSQL connection. Do not grant browser roles direct table writes.

## Authentication and Vercel

1. Create a Vercel project for this Next.js checkout, select Node.js 24 and `npm run build`, and enter the variables above. Deploy the source; this workspace has not pushed or published it automatically.
2. In Supabase **Authentication → URL Configuration**, set Site URL to your deployed origin. Permit `https://YOUR_DOMAIN/auth/callback` and `https://YOUR_DOMAIN/reset-password`. Add only preview origins you intend to use.
3. Configure an email sender/SMTP suitable for your academy; Supabase's development sender has limits. Disable public self-signup for an invitation-only academy. Every Auth identity still needs an enabled academy profile.
4. With the correct project variables on your trusted administration machine, run:

```sh
npm run db:admin
```

The script finds the configured email's Auth identity or sends an invitation, then maps that exact ID to a nonsynthetic administrator profile. It refuses to change an existing different role/organization. New recipients accept the invitation and set a password; existing users keep their password. No password is fabricated or printed.

5. Sign in as management. Create a cohort, invite/assign trainers and learners, edit content/fees and upload original branding. Learners start with zero approved milestones. Trainers see assigned cohorts only.

Scoped server events provide immediate updates; ten-second polling continues if your host ends long-lived connections. Check function duration and database connection limits. Large-cohort load testing remains a deployment concern.

## Deployment verification

Use invited test users in a separate test cohort. Verify login/recovery, private evidence upload, checklist and practical submission, trainer correction/resubmission/approval, another-cohort denial and locked later lessons. Check notifications, CSV/report scope and original branding. Local acceptance runners reject Supabase mode and should never be pointed at live academy data.

No hosted Supabase/Vercel connection or email delivery was validated during this setup because no project credentials were provided. Local PostgreSQL workflows were validated separately. Configure appropriate hosted backup and retention before live enrollment.
