-- Anyone with a Supabase Auth login could read the team list, settings and business days. Require the login to be
-- linked to a staff row (app_users) first, so an unlinked account sees nothing.
drop policy users_select on public.app_users;
create policy users_select on public.app_users for select to authenticated using ((select private.my_id()) is not null);

drop policy supports_select on public.assistant_supports;
create policy supports_select on public.assistant_supports for select to authenticated using ((select private.my_id()) is not null);

drop policy settings_select on public.app_settings;
create policy settings_select on public.app_settings for select to authenticated using ((select private.my_id()) is not null);

drop policy business_days_select on public.business_day_overrides;
create policy business_days_select on public.business_day_overrides for select to authenticated using ((select private.my_id()) is not null);

-- Order Excellence: CSRs log issues against customers they do not own, so they need the customer list (to pick the
-- customer and pre-fill its Account Manager). Read-only.
create policy customers_select_csr on public.customers for select to authenticated
  using ((select private.my_role()) = 'csr');
