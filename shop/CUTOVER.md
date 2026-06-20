# Cutover runbook — MongoDB/Express/CRA → unified Next.js on Vercel

The unified app lives in `shop/`. These are the hands-on steps to take it live on
Vercel and retire the old Heroku app. Steps marked **(you)** need your accounts.

## 1. Provision Postgres **(you)**
- Create a production Postgres DB (Neon, Vercel Postgres, Supabase, etc.).
- Note its connection string for `DATABASE_URL`.

## 2. Create the Vercel project **(you)**
- Import the repo; set the **Root Directory** to `shop`.
- Framework preset: Next.js. Build command/output are auto-detected.
- `vercel.json` already configures the daily `mark-overdue` cron.

## 3. Set environment variables in Vercel **(you)**
Use `shop/.env.example` as the checklist. Required:
`DATABASE_URL`, `AUTH_SECRET`, `APP_URL` + `NEXT_PUBLIC_APP_URL` (your domain),
Square (`SQUARE_*`, `NEXT_PUBLIC_SQUARE_APPLICATION_ID`), Resend
(`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), R2 (`R2_*`), and `CRON_SECRET`.

## 4. Apply the schema
```bash
cd shop
DATABASE_URL=<prod> npx prisma migrate deploy
```

## 5. Migrate data from Mongo (one-off)
```bash
cd shop
ATLAS_URI=<old mongo> DATABASE_URL=<prod> npm run migrate:mongo
```
Idempotent — safe to re-run. Carries customer bcrypt hashes (passwords keep
working), blog posts/comments, testimonials (as PUBLISHED), booking requests,
and quote requests. Verify counts in the output, then spot-check that a
migrated customer can log in at `/portal/login` with their old password.

## 6. Deploy & verify **(you)**
- Trigger the Vercel deploy. Then walk the smoke checklist:
  - Public: `/`, `/services`, `/services/brakes`, `/about`, `/contact`,
    `/blog`, `/testimonials` render.
  - Booking form on `/contact` creates a row visible in `/booking-requests` (admin).
  - Staff login → `/dashboard`, `/admin/blog`, `/admin/testimonials`.
  - Customer `/portal/login` → `/portal/dashboard` shows jobs/invoices/vehicles.

## 7. DNS cutover **(you)**
- Point the domain at Vercel; confirm HTTPS.
- **Cookie note:** `auth.config.ts` sets `useSecureCookies: false` and the
  session cookies are minted with `secure:false` (a dev/ngrok workaround). On a
  real HTTPS domain, switch these to secure cookies (`useSecureCookies: true`
  and `secure: true` in `login/actions.ts` + `lib/customer-auth.ts`) and set
  `AUTH_URL`/`NEXTAUTH_URL` to the production URL.

## 8. Decommission the old stack
Once the new site is verified live:
- Delete the Heroku app (or scale to 0). **(you)**
- Remove the retired code from the repo: `server/`, `client/`, root
  `package.json` + `Procfile`. (Ask Claude to do this in a final commit.)
- Remove the `mongodb` devDependency and `ATLAS_URI` once migration is done.

## Known follow-ups (pre-existing, flagged during migration)
- The existing admin `/api/*` routes (customers, work-orders, invoices, etc.)
  are **not** auth-guarded at the route level — the proxy only gates page
  routes, not `/api/*`. New routes added during this migration (`/api/posts`,
  `/api/testimonials`) DO check `auth()`. Consider adding `auth()` checks to the
  older admin API routes before go-live.
