-- Fix RLS UPDATE policies — add missing WITH CHECK clause
-- Run this in Supabase SQL Editor

do $$
declare
  _tbl text;
begin
  for _tbl in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename in (
        'accounts','categories','payment_cycles','people','recurring_rules',
        'transactions','payment_obligations','budgets','monthly_closings',
        'shopping_lists','products','shopping_categories',
        'subscriptions','games','watchlist_items',
        'document_folders','documents',
        'inventory_items','pets','vehicles',
        'tags','reminders','notifications','app_settings'
      )
  loop
    execute format('drop policy if exists "select own household" on public.%I;', _tbl);
    execute format('drop policy if exists "insert own household" on public.%I;', _tbl);
    execute format('drop policy if exists "update own household" on public.%I;', _tbl);
    execute format('drop policy if exists "delete own household" on public.%I;', _tbl);
    execute format('create policy "select own household" on public.%I for select using (is_household_member(household_id));', _tbl);
    execute format('create policy "insert own household" on public.%I for insert with check (is_household_member(household_id));', _tbl);
    execute format('create policy "update own household" on public.%I for update using (is_household_member(household_id)) with check (is_household_member(household_id));', _tbl);
    execute format('create policy "delete own household" on public.%I for delete using (is_household_member(household_id));', _tbl);
  end loop;
end;
$$;

-- households: PK is id, not household_id
drop policy if exists "select own household" on public.households;
drop policy if exists "insert own household" on public.households;
drop policy if exists "update own household" on public.households;
drop policy if exists "delete own household" on public.households;
create policy "select own household" on public.households for select using (is_household_member(id));
create policy "insert own household" on public.households for insert with check (is_household_member(id));
create policy "update own household" on public.households for update using (is_household_member(id)) with check (is_household_member(id));
create policy "delete own household" on public.households for delete using (is_household_member(id));
