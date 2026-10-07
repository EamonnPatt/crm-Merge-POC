-- Add-Impact Sales Platform: core schema.
-- Mirrors the data the web-app demo keeps in DemoDataContext, plus the production tables from NEXT_STEPS.md §4
-- (sales_orders, ingest_batches, rep/customer aliases). Row Level Security matches the access matrix in
-- web-app/src/data/mockData.ts (accessLevelMatrix) and web-app/src/context/RoleContext.tsx.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('super_user', 'management', 'account_manager', 'assistant', 'csr');
create type public.source_system as enum ('ASI SmartBooks', 'Facilis Syncore');
create type public.account_source as enum ('ASI SmartBooks', 'Facilis Syncore', 'Created in app');
create type public.account_priority as enum ('A', 'B', 'Prospect');
create type public.pipeline_stage as enum ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won');
create type public.order_status as enum ('paid', 'pending', 'overdue');
create type public.issue_severity as enum ('low', 'medium', 'high');
create type public.issue_status as enum ('open', 'in_progress', 'resolved');
create type public.project_status as enum ('researching', 'active', 'on_hold', 'won', 'lost');
create type public.user_status as enum ('active', 'invited');
create type public.partner_status as enum ('active', 'inactive');
create type public.sync_status as enum ('connected', 'attention');

-- Human-readable ids (U-01, C-2001, OI-501 ...) match the ids the UI already shows.
create sequence public.app_user_seq start 13;
create sequence public.customer_seq start 2009;
create sequence public.prospect_seq start 3006;
create sequence public.deal_seq start 1010;
create sequence public.partner_seq start 4005;
create sequence public.order_issue_seq start 508;
create sequence public.project_seq start 7;
create sequence public.budget_seq start 1;
create sequence public.audit_seq start 9009;

-- Helpers live in a schema PostgREST does not expose, so they cannot be called as RPCs.
create schema private;
grant usage on schema private to authenticated;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
-- Staff are pre-created here (invited). The first time a person confirms a Supabase Auth login with the same
-- email, private.link_auth_user() attaches auth.users.id and flips the status to active.
create table public.app_users (
  id text primary key default ('U-' || lpad(nextval('public.app_user_seq')::text, 2, '0')),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  role public.app_role not null,
  status public.user_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index app_users_email_key on public.app_users (lower(email));
create trigger app_users_touch before update on public.app_users for each row execute function private.touch_updated_at();

-- Which Account Managers an Assistant supports (Settings → Team Access).
create table public.assistant_supports (
  assistant_id text not null references public.app_users (id) on delete cascade,
  account_manager_id text not null references public.app_users (id) on delete cascade,
  primary key (assistant_id, account_manager_id)
);

-- An Account Manager's Sales Dashboard shared read-only with one assistant. This is what grants the assistant access.
create table public.dashboard_shares (
  owner_id text not null references public.app_users (id) on delete cascade,
  assistant_id text not null references public.app_users (id) on delete cascade,
  shared_at timestamptz not null default now(),
  primary key (owner_id, assistant_id)
);

-- ---------------------------------------------------------------------------
-- Access helpers (used by the policies below)
-- ---------------------------------------------------------------------------
create function private.my_id() returns text
language sql stable security definer set search_path = '' as $$
  select id from public.app_users where auth_user_id = (select auth.uid())
$$;

create function private.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.app_users where auth_user_id = (select auth.uid())
$$;

create function private.is_management() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('management', 'super_user') from public.app_users where auth_user_id = (select auth.uid())), false)
$$;

create function private.is_super_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'super_user' from public.app_users where auth_user_id = (select auth.uid())), false)
$$;

-- Own data, or a dashboard an Account Manager shared with this assistant. Management sees everyone.
create function private.can_see_rep(rep text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_management()
    or rep = private.my_id()
    or exists (
      select 1 from public.dashboard_shares s
      where s.owner_id = rep and s.assistant_id = private.my_id()
    )
$$;

grant execute on all functions in schema private to authenticated;

-- Attach a Supabase Auth login to the pre-created staff row. Only for confirmed emails, otherwise someone could sign
-- up with a colleague's address and inherit their role.
create function private.link_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.app_users
     set auth_user_id = new.id, status = 'active'
   where lower(email) = lower(new.email) and auth_user_id is null;
  return new;
end $$;

create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function private.link_auth_user();

-- ---------------------------------------------------------------------------
-- Settings and source systems
-- ---------------------------------------------------------------------------
-- One row. API keys for ASI / Syncore are NOT stored here: keep them in Supabase Vault or Edge Function secrets.
create table public.app_settings (
  id boolean primary key default true check (id),
  order_sheet_url text not null default '',
  order_sheet_embed_url text not null default '',
  -- Q-7: Account Managers can see and edit their own Project Tracker entries.
  am_project_access boolean not null default true,
  -- Q-8: Account Managers see every Account Manager's order issues (read-only).
  am_see_all_order_issues boolean not null default false,
  notifications jsonb not null default '{}',
  security jsonb not null default '{}',
  -- Per source: { method, schedule, location }. No secrets.
  integrations jsonb not null default '{}',
  updated_by_id text references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger app_settings_touch before update on public.app_settings for each row execute function private.touch_updated_at();

create table public.data_sources (
  name public.source_system primary key,
  status public.sync_status not null default 'connected',
  last_sync timestamptz,
  records_synced integer not null default 0,
  method text not null default ''
);

-- ---------------------------------------------------------------------------
-- CRM: accounts, prospects, pipeline, referral partners
-- ---------------------------------------------------------------------------
create table public.customers (
  id text primary key default ('C-' || nextval('public.customer_seq')),
  name text not null,
  company text not null,
  email text not null default '',
  phone text not null default '',
  total_orders integer not null default 0,
  lifetime_value numeric(14, 2) not null default 0,
  source public.account_source not null default 'Created in app',
  since date not null default current_date,
  account_manager_id text not null references public.app_users (id),
  priority public.account_priority not null default 'B',
  notes text not null default '',
  weekly_activity_logged boolean not null default false,
  monthly_activity_logged boolean not null default false,
  ly_gross_profit numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_account_manager_idx on public.customers (account_manager_id);
create trigger customers_touch before update on public.customers for each row execute function private.touch_updated_at();

create table public.prospects (
  id text primary key default ('P-' || nextval('public.prospect_seq')),
  name text not null,
  company text not null,
  stage public.pipeline_stage not null default 'lead',
  est_value numeric(14, 2) not null default 0,
  owner_id text not null references public.app_users (id),
  last_contact date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prospects_owner_idx on public.prospects (owner_id);
create trigger prospects_touch before update on public.prospects for each row execute function private.touch_updated_at();

create table public.pipeline_deals (
  id text primary key default ('D-' || nextval('public.deal_seq')),
  name text not null,
  company text not null,
  value numeric(14, 2) not null default 0,
  owner_id text not null references public.app_users (id),
  stage public.pipeline_stage not null default 'lead',
  close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pipeline_deals_owner_idx on public.pipeline_deals (owner_id);
create trigger pipeline_deals_touch before update on public.pipeline_deals for each row execute function private.touch_updated_at();

create table public.referral_partners (
  id text primary key default ('R-' || nextval('public.partner_seq')),
  name text not null,
  contact text not null default '',
  referrals_sent integer not null default 0,
  conversions integer not null default 0,
  commission_owed numeric(14, 2) not null default 0,
  status public.partner_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger referral_partners_touch before update on public.referral_partners for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Sales data
-- ---------------------------------------------------------------------------
-- A record of each load from ASI SmartBooks / Facilis Syncore (NEXT_STEPS §4, Phase 1).
create table public.ingest_batches (
  id bigint generated always as identity primary key,
  source public.source_system not null,
  kind text not null default 'sales_orders',
  file_name text,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  rows_loaded integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  loaded_by_id text references public.app_users (id) on delete set null
);

-- One row per order/invoice from either source. Gross profit and margin are calculated here, in one place, for both.
create table public.sales_orders (
  id bigint generated always as identity primary key,
  order_number text not null,
  source public.source_system not null,
  invoice_date date not null,
  customer_name text not null,
  customer_id text references public.customers (id) on delete set null,
  rep_id text not null references public.app_users (id),
  amount numeric(14, 2) not null,
  cost numeric(14, 2) not null,
  gross_profit numeric(14, 2) generated always as (amount - cost) stored,
  status public.order_status not null default 'pending',
  ingest_batch_id bigint references public.ingest_batches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, order_number)
);
create index sales_orders_rep_date_idx on public.sales_orders (rep_id, invoice_date);
create index sales_orders_customer_idx on public.sales_orders (customer_id);
create index sales_orders_batch_idx on public.sales_orders (ingest_batch_id);
create trigger sales_orders_touch before update on public.sales_orders for each row execute function private.touch_updated_at();

-- How each source spells a rep / customer, mapped to our users and accounts (Mapping admin screen).
create table public.rep_aliases (
  source public.source_system not null,
  alias text not null,
  user_id text not null references public.app_users (id) on delete cascade,
  primary key (source, alias)
);

create table public.customer_aliases (
  source public.source_system not null,
  alias text not null,
  customer_id text not null references public.customers (id) on delete cascade,
  primary key (source, alias)
);

-- Monthly actuals per rep. Runs as the caller, so it only returns months for reps the caller may see.
create view public.rep_monthly_performance with (security_invoker = true) as
select
  rep_id,
  extract(year from invoice_date)::int as fiscal_year,
  extract(month from invoice_date)::int as month,
  count(*)::int as order_count,
  sum(amount) as sales,
  sum(cost) as cost,
  sum(gross_profit) as gross_profit,
  case when sum(amount) = 0 then 0 else round(sum(gross_profit) / sum(amount) * 100, 2) end as margin_pct
from public.sales_orders
group by rep_id, extract(year from invoice_date), extract(month from invoice_date);

-- ---------------------------------------------------------------------------
-- Budgets and business days
-- ---------------------------------------------------------------------------
create table public.budgets (
  id text primary key default ('B-' || nextval('public.budget_seq')),
  rep_id text not null references public.app_users (id),
  fiscal_year integer not null,
  -- Jan–Dec targets. A budget can hold GP$, Sales$, or both (Q-1).
  gp_monthly numeric(14, 2)[] check (gp_monthly is null or array_length(gp_monthly, 1) = 12),
  sales_monthly numeric(14, 2)[] check (sales_monthly is null or array_length(sales_monthly, 1) = 12),
  notes text not null default '',
  updated_by_id text references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (rep_id, fiscal_year)
);
create trigger budgets_touch before update on public.budgets for each row execute function private.touch_updated_at();

-- Management's override of the holiday-aware business-day count per month.
create table public.business_day_overrides (
  fiscal_year integer primary key,
  monthly integer[] not null check (array_length(monthly, 1) = 12),
  updated_by_id text references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger business_day_overrides_touch before update on public.business_day_overrides for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Order Excellence, Project Tracker, audit trail
-- ---------------------------------------------------------------------------
create table public.order_issues (
  id text primary key default ('OI-' || nextval('public.order_issue_seq')),
  order_number text not null,
  customer_name text not null,
  account_manager_id text not null references public.app_users (id),
  issue_type text not null,
  severity public.issue_severity not null default 'medium',
  status public.issue_status not null default 'open',
  assigned_to_id text references public.app_users (id) on delete set null,
  in_hand_date date,
  opened_on date not null default current_date,
  resolved_on date,
  notes text not null default '',
  updated_by_id text references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index order_issues_am_idx on public.order_issues (account_manager_id);
create trigger order_issues_touch before update on public.order_issues for each row execute function private.touch_updated_at();

create table public.project_tracker (
  id text primary key default ('PT-' || lpad(nextval('public.project_seq')::text, 2, '0')),
  account_name text not null,
  account_manager_id text not null references public.app_users (id),
  plan_month text not null check (plan_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  target_value numeric(14, 2) not null default 0,
  historical_projects text not null default '',
  potential_projects text not null default '',
  status public.project_status not null default 'researching',
  notes text not null default '',
  -- [{ "label": "...", "url": "https://..." }]
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  updated_by_id text references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index project_tracker_am_idx on public.project_tracker (account_manager_id);
create trigger project_tracker_touch before update on public.project_tracker for each row execute function private.touch_updated_at();

-- Append-only: authenticated users can insert and (Management) read, never update or delete.
create table public.audit_log (
  id text primary key default ('AL-' || nextval('public.audit_seq')),
  occurred_at timestamptz not null default now(),
  actor_id text not null default private.my_id() references public.app_users (id),
  actor_name text not null,
  actor_role text not null,
  action text not null,
  entity text not null,
  details text not null default ''
);
create index audit_log_occurred_idx on public.audit_log (occurred_at desc);

-- ---------------------------------------------------------------------------
-- Grants (the Data API is signed-in users only)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke update, delete on public.audit_log from authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.app_users enable row level security;
alter table public.assistant_supports enable row level security;
alter table public.dashboard_shares enable row level security;
alter table public.app_settings enable row level security;
alter table public.data_sources enable row level security;
alter table public.customers enable row level security;
alter table public.prospects enable row level security;
alter table public.pipeline_deals enable row level security;
alter table public.referral_partners enable row level security;
alter table public.ingest_batches enable row level security;
alter table public.sales_orders enable row level security;
alter table public.rep_aliases enable row level security;
alter table public.customer_aliases enable row level security;
alter table public.budgets enable row level security;
alter table public.business_day_overrides enable row level security;
alter table public.order_issues enable row level security;
alter table public.project_tracker enable row level security;
alter table public.audit_log enable row level security;

-- Users: everyone signed in can see the team list (names appear across the app). Management manages it, but only a
-- Super User may create or promote a Super User.
create policy users_select on public.app_users for select to authenticated using (true);
create policy users_insert on public.app_users for insert to authenticated
  with check ((select private.is_management()) and (role <> 'super_user' or (select private.is_super_user())));
create policy users_update on public.app_users for update to authenticated
  using ((select private.is_management()) and (role <> 'super_user' or (select private.is_super_user())))
  with check ((select private.is_management()) and (role <> 'super_user' or (select private.is_super_user())));
create policy users_delete on public.app_users for delete to authenticated using ((select private.is_super_user()));

create policy supports_select on public.assistant_supports for select to authenticated using (true);
create policy supports_write on public.assistant_supports for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));

-- Dashboard shares: an Account Manager shares with an assistant that supports them.
create policy shares_select on public.dashboard_shares for select to authenticated
  using ((select private.is_management()) or owner_id = (select private.my_id()) or assistant_id = (select private.my_id()));
create policy shares_insert on public.dashboard_shares for insert to authenticated
  with check (
    owner_id = (select private.my_id())
    and exists (select 1 from public.assistant_supports s where s.assistant_id = dashboard_shares.assistant_id and s.account_manager_id = dashboard_shares.owner_id)
  );
create policy shares_delete on public.dashboard_shares for delete to authenticated
  using (owner_id = (select private.my_id()));

-- Settings and source systems.
create policy settings_select on public.app_settings for select to authenticated using (true);
create policy settings_update on public.app_settings for update to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));
create policy data_sources_select on public.data_sources for select to authenticated using ((select private.is_management()));
create policy data_sources_write on public.data_sources for all to authenticated
  using ((select private.is_super_user())) with check ((select private.is_super_user()));

-- Accounts: Management all; an Account Manager their own.
create policy customers_select on public.customers for select to authenticated
  using ((select private.is_management()) or account_manager_id = (select private.my_id()));
create policy customers_insert on public.customers for insert to authenticated with check ((select private.is_management()));
create policy customers_update on public.customers for update to authenticated
  using ((select private.is_management()) or account_manager_id = (select private.my_id()))
  with check ((select private.is_management()) or account_manager_id = (select private.my_id()));
create policy customers_delete on public.customers for delete to authenticated using ((select private.is_management()));

-- Prospects and deals: Management all; an Account Manager their own.
create policy prospects_select on public.prospects for select to authenticated
  using ((select private.is_management()) or owner_id = (select private.my_id()));
create policy prospects_insert on public.prospects for insert to authenticated
  with check ((select private.is_management()) or owner_id = (select private.my_id()));
create policy prospects_update on public.prospects for update to authenticated
  using ((select private.is_management()) or owner_id = (select private.my_id()))
  with check ((select private.is_management()) or owner_id = (select private.my_id()));
create policy prospects_delete on public.prospects for delete to authenticated using ((select private.is_management()));

create policy deals_select on public.pipeline_deals for select to authenticated
  using ((select private.is_management()) or owner_id = (select private.my_id()));
create policy deals_insert on public.pipeline_deals for insert to authenticated
  with check ((select private.is_management()) or owner_id = (select private.my_id()));
create policy deals_update on public.pipeline_deals for update to authenticated
  using ((select private.is_management()) or owner_id = (select private.my_id()))
  with check ((select private.is_management()) or owner_id = (select private.my_id()));
create policy deals_delete on public.pipeline_deals for delete to authenticated using ((select private.is_management()));

-- Referral partners: Management and Account Managers read; Management writes.
create policy partners_select on public.referral_partners for select to authenticated
  using ((select private.is_management()) or (select private.my_role()) = 'account_manager');
create policy partners_write on public.referral_partners for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));

-- Sales data: Management all; an Account Manager their own; an assistant the dashboards shared with them. Loads run
-- as service_role (which bypasses RLS) or by Management.
create policy sales_orders_select on public.sales_orders for select to authenticated using ((select private.can_see_rep(rep_id)));
create policy sales_orders_write on public.sales_orders for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));
create policy ingest_batches_all on public.ingest_batches for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));
create policy rep_aliases_all on public.rep_aliases for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));
create policy customer_aliases_all on public.customer_aliases for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));

-- Budgets: Management reads and writes everything; an Account Manager reads their own.
create policy budgets_select on public.budgets for select to authenticated
  using ((select private.is_management()) or rep_id = (select private.my_id()));
create policy budgets_write on public.budgets for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));
create policy business_days_select on public.business_day_overrides for select to authenticated using (true);
create policy business_days_write on public.business_day_overrides for all to authenticated
  using ((select private.is_management())) with check ((select private.is_management()));

-- Order Excellence: CSRs and Management read and write. Account Managers and assistants read their accounts (or all of
-- them when Q-8 is switched on in app_settings).
create policy order_issues_select on public.order_issues for select to authenticated
  using (
    (select private.is_management())
    or (select private.my_role()) = 'csr'
    or (select private.can_see_rep(account_manager_id))
    or ((select private.my_role()) = 'account_manager' and (select am_see_all_order_issues from public.app_settings))
  );
create policy order_issues_insert on public.order_issues for insert to authenticated
  with check ((select private.is_management()) or (select private.my_role()) = 'csr');
create policy order_issues_update on public.order_issues for update to authenticated
  using ((select private.is_management()) or (select private.my_role()) = 'csr')
  with check ((select private.is_management()) or (select private.my_role()) = 'csr');
create policy order_issues_delete on public.order_issues for delete to authenticated using ((select private.is_management()));

-- Project Tracker: Management all; Account Managers their own entries while app_settings.am_project_access is on (Q-7).
create policy project_tracker_select on public.project_tracker for select to authenticated
  using (
    (select private.is_management())
    or (account_manager_id = (select private.my_id()) and (select am_project_access from public.app_settings))
  );
create policy project_tracker_insert on public.project_tracker for insert to authenticated
  with check (
    (select private.is_management())
    or (account_manager_id = (select private.my_id()) and (select am_project_access from public.app_settings))
  );
create policy project_tracker_update on public.project_tracker for update to authenticated
  using (
    (select private.is_management())
    or (account_manager_id = (select private.my_id()) and (select am_project_access from public.app_settings))
  )
  with check (
    (select private.is_management())
    or (account_manager_id = (select private.my_id()) and (select am_project_access from public.app_settings))
  );
create policy project_tracker_delete on public.project_tracker for delete to authenticated using ((select private.is_management()));

-- Audit trail: anyone signed in can add an entry as themselves; only Management can read it.
create policy audit_select on public.audit_log for select to authenticated using ((select private.is_management()));
create policy audit_insert on public.audit_log for insert to authenticated with check (actor_id = (select private.my_id()));
