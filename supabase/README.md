# Supabase database

Project: `oqkmiadbknizlzelgusz` (https://oqkmiadbknizlzelgusz.supabase.co). The Supabase MCP server is wired up in `.mcp.json` at the repo root.

| File | What it is |
|---|---|
| `migrations/20261007000001_core_schema.sql` | Tables, enums, helper functions and Row Level Security. Already applied. |
| `seed.sql` | The demo data (12 staff, 8 accounts, 243 sales orders incl. FY2025 for "vs LY", budgets, order issues, projects, audit log). Already loaded. |
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

## Status of the web app

`web-app/src/lib/supabase.ts` is the connected, typed client. The screens still read and write the in-browser demo store (`DemoDataContext`); switching them to Supabase means adding sign-in, then replacing the context's data calls with queries against these tables (NEXT_STEPS §4, Phase 1).
