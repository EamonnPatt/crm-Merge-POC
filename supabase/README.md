# Supabase database

Project: `oqkmiadbknizlzelgusz` (https://oqkmiadbknizlzelgusz.supabase.co). The Supabase MCP server is wired up in `.mcp.json` at the repo root.

| File | What it is |
|---|---|
| `migrations/20261007000001_core_schema.sql` | Tables, enums, helper functions and Row Level Security. Already applied. |
| `seed.sql` | The demo data (12 staff, 8 accounts, 243 sales orders incl. FY2025 for "vs LY", budgets, order issues, projects, audit log). Already loaded. |
| `functions/invite-user/index.ts` | Edge Function behind **Settings → Add User** and **Send invite**. Already deployed. |
| `generate-seed.mjs` | Rebuilds `seed.sql` from `web-app/src/data/mockData.ts`: `node supabase/generate-seed.mjs` |

## Tables

- **Users:** `app_users` (staff + role), `assistant_supports`, `dashboard_shares`
- **CRM:** `customers`, `prospects`, `pipeline_deals`, `referral_partners`
- **Sales:** `sales_orders` (one row per order from either source; `gross_profit` is computed as amount − cost), `ingest_batches`, `rep_aliases`, `customer_aliases`, and the view `rep_monthly_performance` (monthly sales, cost, GP, margin per rep)
- **Planning:** `budgets` (12 monthly GP$ and/or Sales$ targets), `business_day_overrides`
- **Operations:** `order_issues`, `project_tracker`, `audit_log` (append-only), `app_settings`, `data_sources`

## Who can see what (Row Level Security)

Enforced in Postgres, so it holds no matter what the browser sends. Mirrors the access matrix in `mockData.ts`.

| Role | Sales / performance | Accounts, deals | Budgets | Order issues | Project tracker | Audit log |
|---|---|---|---|---|---|---|
| Super User / Management | all | all | read + write | read + write | all | read |
| Account Manager | own | own | own (read) | own accounts (all if `am_see_all_order_issues`) | own, if `am_project_access` | – |
| Assistant | dashboards shared with them | – | – | shared dashboards' accounts | – | – |
| CSR | – | – | – | all (read + write) | – | – |

Anonymous (not signed in) requests are rejected. Checked on 2026-10-07 by impersonating Management, an Account Manager, an Assistant and a CSR.

## Logging in

Staff rows are pre-created with status `invited`. When someone signs in through Supabase Auth with the same email **and has confirmed it**, `private.link_auth_user()` attaches their login to that row and sets them active. Their role then comes from `app_users`.

Before real users sign in, in the Supabase dashboard (Authentication):
1. Turn **off** "Allow new users to sign up", so only invited emails can get in.
2. Configure the Microsoft 365 or Google provider (NEXT_STEPS §4, "Real login").
3. Replace the seeded `@add-impact.com` emails with the real staff list (NEXT_STEPS I-9).

## Secrets

- The browser only gets the URL and the **publishable** key (`web-app/.env.example`).
- The `service_role` key bypasses RLS: use it only in the backend loaders (Syncore/SmartBooks), never in a `VITE_` variable.
- ASI / Syncore API keys are not stored in tables. Keep them in Supabase Vault or Edge Function secrets.
- The database password in the root `.env` is only needed for direct `psql` / CLI access; `.env` is git-ignored.

## Changing the schema

Add a new file under `migrations/` (timestamp prefix), apply it (MCP `apply_migration` or `supabase db push`), then regenerate `web-app/src/lib/database.types.ts`.

## How the web app uses it

With `web-app/.env.local` present (see `web-app/.env.example`) the app asks for a sign-in. Without it, the app runs as the offline demo with its in-browser data and the "view as" switcher.

- **Sign-in:** email + password, or an emailed link (`AuthContext.tsx`, `AuthScreens.tsx`). A login whose confirmed email is not in `app_users` gets a "not set up" page and sees no data.
- **Role:** comes from `app_users`, not from the browser. The "view as" switcher is hidden when signed in.
- **Reading and writing:** `DemoDataContext` keeps the same screens and functions. When signed in it loads the data you are allowed to see from Supabase (`data/remote.ts`), shows changes immediately, saves the difference to the database, then reloads the touched tables to pick up database-assigned ids. If the database refuses a change, the screen reverts and a banner says why.
- **Sales figures:** the dashboards' actual and last-year numbers are now calculated from `sales_orders` (`lib/actuals.ts`) instead of generated dummy figures.
- **Not stored:** ASI / Syncore API keys typed into Settings stay in the browser session only.

## Creating employee accounts

Management and Super User add people in **Settings → Team Access → Add User**. The `invite-user` Edge Function checks the caller's role, adds the person to `app_users` (and `assistant_supports`), and emails them an invite. They click the link, choose a password, and land in the app with their role. Only a Super User can create another Super User. People already on the list with status Invited (for example the seeded ones) have a **Send invite** link instead.

Things to know:
- The function needs the `service_role` key, which Supabase injects into Edge Functions automatically. It never reaches the browser.
- Invite emails go through Supabase's built-in mailer until you add your own SMTP server (Authentication, SMTP Settings). The built-in one only sends a few emails per hour and is meant for testing.
- The invite link only returns to the app if its address is in Authentication, URL Configuration (Site URL / Redirect URLs).
- Anyone can also use "Forgot your password?" on the login page to get a link to choose a new one.

## First login

1. In `app_users`, set the email of the person who will be Super User / Management to their real work email (the seeded `@add-impact.com` addresses are placeholders):
   `update public.app_users set email = 'you@company.com' where id = 'U-01';`
2. Supabase dashboard, Authentication, Users, **Add user**: same email, set a password, tick auto-confirm. The link to `app_users` happens automatically.
3. Authentication, URL Configuration: set the Site URL to the deployed address (and add `http://localhost:5173` for local work), so emailed sign-in links come back to the app.
4. Authentication, Sign In / Providers: turn off "Allow new users to sign up".

## Known limits

- The app's "today" is still pinned to 2026-09-21 (`AS_OF` in `lib/calendar.ts`) so the seeded orders line up. Point it at the real clock once real data is loading.
- All visible orders for last year and this year are loaded into the browser and totalled there. Fine for a demo-sized dataset; move the totals into SQL (`rep_monthly_performance`) before loading a full order history.
- Two people saving at the exact same moment: the later save wins. There is no live sync between open browsers; data refreshes when the tab regains focus.
