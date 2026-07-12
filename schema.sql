-- ============================================================================
-- HouseManagement — Complete Supabase Schema
-- Run this in Supabase SQL Editor (fresh project) to set up everything.
-- ============================================================================

-- ░░ Extensions
create extension if not exists "uuid-ossp";

-- ░░ Helper functions

-- Auto-set created_by / updated_by on INSERT and UPDATE
create or replace function public.set_audit_fields ()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
  elsif TG_OP = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

-- Check if the current user belongs to a household
create or replace function public.is_household_member (h_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid()
  );
end;
$$;

-- Get current user's role in a household
create or replace function public.household_role_of (h_id uuid)
returns text
language plpgsql
security definer
as $$
begin
  return (
    select role from public.household_members
    where household_id = h_id and user_id = auth.uid()
    limit 1
  );
end;
$$;

-- Check if current user is admin of a household
create or replace function public.is_household_admin (h_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.household_members
    where household_id = h_id and user_id = auth.uid() and role = 'admin'
  );
end;
$$;

-- Compute account balance from all paid, non-deleted transactions
create or replace function public.compute_account_balance (acc uuid)
returns numeric(14,2)
language plpgsql
security definer
as $$
declare
  opening numeric(14,2) := 0;
  txs     numeric(14,2) := 0;
begin
  select opening_balance into opening from public.accounts where id = acc;

  select coalesce(sum(
    case
      when type = 'income'  then amount
      when type = 'expense' then -amount
      when type = 'transfer' and transfer_direction = 'in'  then amount
      when type = 'transfer' and transfer_direction = 'out' then -amount
      else 0
    end
  ), 0) into txs
  from public.transactions
  where account_id = acc and paid = true and deleted_at is null;

  return opening + txs;
end;
$$;

-- Compute delta (balance minus opening) for an account
create or replace function public.compute_account_delta (acc uuid)
returns numeric(14,2)
language plpgsql
security definer
as $$
begin
  return public.compute_account_balance(acc)
       - (select opening_balance from public.accounts where id = acc);
end;
$$;

-- ============================================================================
-- ░░ TABLES
-- ============================================================================

-- ── 1. Identity & Access ──

create table public.households (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  base_currency text not null default 'MXN',
  timezone      text not null default 'America/Mexico_City',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin','member')),
  display_name text,
  joined_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  full_name            text,
  avatar_url           text,
  default_household_id uuid references public.households(id) on delete set null,
  preferences          jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── 2. Finance ──

create table public.accounts (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households(id) on delete cascade,
  name                text not null,
  account_type        text not null check (account_type in ('cash','bank','savings','credit_card')),
  institution         text,
  opening_balance     numeric(14,2) not null default 0,
  current_balance     numeric(14,2) not null default 0,
  currency            text not null default 'MXN',
  color               text,
  is_archived         boolean not null default false,
  include_in_net_worth boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id)
);

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id    uuid references public.categories(id) on delete set null,
  name         text not null,
  kind         text not null check (kind in ('income','expense','transfer')),
  icon         text,
  color        text,
  sort_order   integer not null default 0,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.payment_cycles (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  cycle_type   text not null check (cycle_type in ('fixed_dates','monthly','interval')),
  config       jsonb not null default '{}'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.people (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  relationship text check (relationship in ('self','spouse','family','friend','other')),
  color        text,
  notes        text,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.recurring_rules (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id   uuid not null references public.accounts(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  type         text not null check (type in ('income','expense','transfer')),
  amount       numeric(14,2) not null,
  frequency    text not null check (frequency in ('daily','weekly','monthly','yearly')),
  interval     integer not null default 1,
  day_of_month integer,
  next_run     date,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  account_id        uuid not null references public.accounts(id) on delete cascade,
  category_id       uuid references public.categories(id) on delete set null,
  type              text not null check (type in ('income','expense','transfer')),
  amount            numeric(14,2) not null,
  transfer_direction text check (transfer_direction in ('in','out')),
  currency          text not null default 'MXN',
  date              date not null,
  payment_cycle_id  uuid references public.payment_cycles(id) on delete set null,
  paid              boolean not null default false,
  paid_at           timestamptz,
  transfer_pair_id  uuid references public.transactions(id) on delete set null,
  person_id         uuid references public.people(id) on delete set null,
  description       text,
  notes             text,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

create table public.transaction_splits (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category_id    uuid not null references public.categories(id) on delete cascade,
  amount         numeric(14,2) not null,
  note           text
);

create table public.payment_obligations (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households(id) on delete cascade,
  direction             text not null check (direction in ('owed_to_us','owed_by_us')),
  person_id             uuid not null references public.people(id) on delete cascade,
  description           text,
  total_amount          numeric(14,2) not null,
  paid_amount           numeric(14,2) not null default 0,
  status                text not null default 'open' check (status in ('open','partially_paid','settled','cancelled')),
  due_date              date,
  payment_cycle_id      uuid references public.payment_cycles(id) on delete set null,
  source_transaction_id uuid references public.transactions(id) on delete set null,
  settled_at            timestamptz,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id)
);

create table public.obligation_payments (
  id             uuid primary key default gen_random_uuid(),
  obligation_id  uuid not null references public.payment_obligations(id) on delete cascade,
  amount         numeric(14,2) not null,
  paid_date      date not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id)
);

create table public.budgets (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  name              text not null,
  period_month      date not null,
  scope             text not null default 'household' check (scope in ('household','account','person')),
  scope_account_id  uuid references public.accounts(id) on delete set null,
  scope_person_id   uuid references public.people(id) on delete set null,
  recurrence        text,
  recurrence_start  date,
  is_general        boolean not null default false,
  total_amount      numeric(14,2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

create table public.budget_lines (
  id             uuid primary key default gen_random_uuid(),
  budget_id      uuid not null references public.budgets(id) on delete cascade,
  category_id    uuid not null references public.categories(id) on delete cascade,
  planned_amount numeric(14,2) not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id)
);

create table public.monthly_closings (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  period_month date not null,
  closed_at    timestamptz not null,
  closed_by    uuid references auth.users(id),
  notes        text,
  unique (household_id, period_month)
);

-- ── 3. Shopping ──

create table public.shopping_categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  icon         text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.shopping_lists (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  kind         text not null default 'custom' check (kind in ('grocery','custom')),
  status       text not null default 'open' check (status in ('open','shopping','completed','cancelled')),
  due_date     date,
  store        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households(id) on delete cascade,
  name                text not null,
  default_unit        text,
  default_category_id uuid references public.shopping_categories(id) on delete set null,
  last_price          numeric(10,2),
  barcode             text,
  favorite            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id)
);

create table public.shopping_list_items (
  id              uuid primary key default gen_random_uuid(),
  list_id         uuid not null references public.shopping_lists(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  name            text not null,
  quantity        numeric(10,2) not null default 1,
  unit            text,
  category_id     uuid references public.shopping_categories(id) on delete set null,
  estimated_price numeric(10,2),
  purchased       boolean not null default false,
  purchased_at    timestamptz,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id)
);

-- ── 4. Entertainment ──

create table public.subscription_services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon_url    text,
  default_url text
);

create table public.subscriptions (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  service_id       uuid references public.subscription_services(id) on delete set null,
  name             text not null,
  kind             text not null default 'other' check (kind in ('streaming','gaming','software','other')),
  monthly_price    numeric(10,2) not null default 0,
  price            numeric(10,2) not null default 0,
  billing_cycle    text not null default 'monthly' check (billing_cycle in ('weekly','monthly','quarterly','yearly')),
  currency         text not null default 'MXN',
  renewal_date     date,
  account_id       uuid references public.accounts(id) on delete set null,
  payment_cycle_id uuid references public.payment_cycles(id) on delete set null,
  username         text,
  password_encrypted text,
  pin_encrypted    text,
  notes            text,
  status           text not null default 'active' check (status in ('active','paused','cancelled')),
  auto_renew       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id),
  updated_by       uuid references auth.users(id)
);

create table public.subscription_shared_users (
  id                  uuid primary key default gen_random_uuid(),
  subscription_id     uuid not null references public.subscriptions(id) on delete cascade,
  name                text,
  is_household_member boolean not null default false,
  user_id             uuid references auth.users(id) on delete set null
);

create table public.games (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  title         text not null,
  platform      text check (platform in ('pc','ps5','xbox','switch','mobile','other')),
  status        text not null default 'owned' check (status in ('owned','wishlist','playing','finished')),
  purchase_date date,
  purchase_price numeric(10,2),
  cover_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table public.watchlist_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title        text not null,
  kind         text not null default 'movie' check (kind in ('movie','tv')),
  status       text not null default 'pending' check (status in ('pending','watching','watched')),
  rating       integer check (rating between 0 and 10),
  notes        text,
  poster_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

-- ── 5. Documents ──

create table public.document_folders (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id    uuid references public.document_folders(id) on delete cascade,
  name         text not null,
  icon         text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  folder_id     uuid references public.document_folders(id) on delete set null,
  name          text not null,
  kind          text not null default 'other' check (kind in ('bill','warranty','contract','important','other')),
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint,
  entity_type   text,
  entity_id     uuid,
  expires_at    date,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- ── 6. Home Inventory ──

create table public.inventory_items (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households(id) on delete cascade,
  name                text not null,
  category            text check (category in ('appliance','furniture','electronics','other')),
  location            text,
  brand               text,
  model               text,
  serial              text,
  purchase_date       date,
  purchase_price      numeric(10,2),
  estimated_value     numeric(10,2),
  warranty_expires_at date,
  notes               text,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id)
);

create table public.inventory_maintenance (
  id                uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  performed_at      date not null,
  description       text not null,
  cost              numeric(10,2),
  provider          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

-- ── 7. Pets ──

create table public.pets (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  species       text not null default 'dog' check (species in ('dog','cat','bird','fish','rodent','reptile','other')),
  breed         text default '',
  color         text default '',
  birth_date    date,
  weight_kg     numeric(5,2),
  microchip_id  text default '',
  vet_name      text default '',
  vet_phone     text default '',
  notes         text default '',
  photo_url     text default '',
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table public.pet_medical_records (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  date          date not null,
  description   text not null,
  vet_name      text default '',
  cost          numeric(10,2),
  notes         text default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table public.pet_vaccinations (
  id                uuid primary key default gen_random_uuid(),
  pet_id            uuid not null references public.pets(id) on delete cascade,
  vaccine_name      text not null,
  date_administered date not null,
  next_due_date     date,
  vet_name          text default '',
  batch_number      text default '',
  notes             text default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

-- ── 8. Vehicles ──

create table public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households(id) on delete cascade,
  name                text not null,
  brand               text default '',
  model               text default '',
  year                integer,
  plate               text default '',
  vin                 text default '',
  color               text default '',
  fuel_type           text not null default 'gasoline' check (fuel_type in ('gasoline','diesel','electric','hybrid','other')),
  insurance_company   text default '',
  insurance_policy    text default '',
  insurance_expires_at date,
  purchase_date       date,
  purchase_price      numeric(12,2),
  notes               text default '',
  photo_url           text default '',
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id)
);

create table public.vehicle_service_records (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  date          date not null,
  description   text not null,
  mileage       integer,
  cost          numeric(10,2),
  provider      text default '',
  notes         text default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- ── 9. Cross-cutting ──

create table public.tags (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  slug         text not null,
  color        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  unique (household_id, slug)
);

create table public.taggings (
  id          uuid primary key default gen_random_uuid(),
  tag_id      uuid not null references public.tags(id) on delete cascade,
  entity_type text not null,
  entity_id   uuid not null,
  unique (tag_id, entity_type, entity_id)
);

create table public.attachments (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  entity_type  text not null,
  entity_id    uuid not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  kind         text not null default 'file' check (kind in ('receipt','photo','file')),
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

create table public.reminders (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  title         text not null,
  entity_type   text,
  entity_id     uuid,
  due_at        timestamptz not null,
  recurrence    text not null default 'none' check (recurrence in ('none','daily','weekly','monthly','yearly')),
  status        text not null default 'pending' check (status in ('pending','done','snoozed')),
  snoozed_until timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  body         text,
  kind         text not null default 'info' check (kind in ('reminder','info','warning')),
  link         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create table public.audit_log (
  id           bigint generated always as identity primary key,
  household_id uuid references public.households(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  changes      jsonb,
  created_at   timestamptz not null default now()
);

create table public.app_settings (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade unique,
  preferences  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ============================================================================
-- ░░ INDEXES
-- ============================================================================

-- Finance
create index idx_accounts_household        on public.accounts(household_id);
create index idx_categories_household       on public.categories(household_id);
create index idx_payment_cycles_household   on public.payment_cycles(household_id);
create index idx_people_household           on public.people(household_id);
create index idx_recurring_rules_household  on public.recurring_rules(household_id);
create index idx_transactions_household_date  on public.transactions(household_id, date);
create index idx_transactions_account_date    on public.transactions(account_id, date);
create index idx_transactions_category        on public.transactions(category_id);
create index idx_transactions_cycle_paid      on public.transactions(payment_cycle_id, paid);
create index idx_transactions_transfer_pair   on public.transactions(transfer_pair_id);
create index idx_obligations_household        on public.payment_obligations(household_id);
create index idx_obligation_payments_obl      on public.obligation_payments(obligation_id);
create index idx_budgets_household            on public.budgets(household_id);
create index idx_budget_lines_budget          on public.budget_lines(budget_id);
create index idx_monthly_closings_hh          on public.monthly_closings(household_id);

-- Shopping
create index idx_shopping_lists_household  on public.shopping_lists(household_id);
create index idx_shopping_list_items_list  on public.shopping_list_items(list_id);
create index idx_products_household        on public.products(household_id);
create index idx_shopping_cats_household   on public.shopping_categories(household_id);

-- Entertainment
create index idx_subscriptions_household   on public.subscriptions(household_id);
create index idx_games_household           on public.games(household_id);
create index idx_watchlist_household       on public.watchlist_items(household_id);

-- Documents
create index idx_document_folders_household  on public.document_folders(household_id);
create index idx_documents_household         on public.documents(household_id);

-- Home Inventory
create index idx_inventory_items_household   on public.inventory_items(household_id);
create index idx_inventory_maint_item        on public.inventory_maintenance(inventory_item_id);

-- Pets
create index idx_pets_household              on public.pets(household_id);
create index idx_pet_medical_records_pet     on public.pet_medical_records(pet_id);
create index idx_pet_vaccinations_pet        on public.pet_vaccinations(pet_id);

-- Vehicles
create index idx_vehicles_household                    on public.vehicles(household_id);
create index idx_vehicle_service_records_vehicle       on public.vehicle_service_records(vehicle_id);

-- Cross-cutting
create index idx_tags_household          on public.tags(household_id);
create index idx_taggings_tag            on public.taggings(tag_id);
create index idx_attachments_entity      on public.attachments(entity_type, entity_id);
create index idx_reminders_household     on public.reminders(household_id);
create index idx_notifications_user      on public.notifications(household_id, user_id);

-- ============================================================================
-- ░░ AUDIT TRIGGERS (auto-set created_at/updated_at/created_by/updated_by)
-- ============================================================================

create trigger trg_households_audit        before update on public.households        for each row execute function set_audit_fields();
create trigger trg_household_members_audit before update on public.household_members for each row execute function set_audit_fields();
create trigger trg_profiles_audit          before update on public.profiles          for each row execute function set_audit_fields();
create trigger trg_accounts_audit          before update on public.accounts          for each row execute function set_audit_fields();
create trigger trg_categories_audit        before update on public.categories        for each row execute function set_audit_fields();
create trigger trg_payment_cycles_audit    before update on public.payment_cycles    for each row execute function set_audit_fields();
create trigger trg_people_audit            before update on public.people            for each row execute function set_audit_fields();
create trigger trg_recurring_rules_audit   before update on public.recurring_rules   for each row execute function set_audit_fields();
create trigger trg_transactions_audit      before update on public.transactions      for each row execute function set_audit_fields();
create trigger trg_obligations_audit       before update on public.payment_obligations for each row execute function set_audit_fields();
create trigger trg_obligation_payments_audit before update on public.obligation_payments for each row execute function set_audit_fields();
create trigger trg_budgets_audit           before update on public.budgets           for each row execute function set_audit_fields();
create trigger trg_budget_lines_audit      before update on public.budget_lines      for each row execute function set_audit_fields();
create trigger trg_shopping_lists_audit    before update on public.shopping_lists    for each row execute function set_audit_fields();
create trigger trg_shopping_items_audit    before update on public.shopping_list_items for each row execute function set_audit_fields();
create trigger trg_products_audit          before update on public.products          for each row execute function set_audit_fields();
create trigger trg_shopping_cats_audit     before update on public.shopping_categories for each row execute function set_audit_fields();
create trigger trg_subscriptions_audit     before update on public.subscriptions     for each row execute function set_audit_fields();
create trigger trg_games_audit             before update on public.games             for each row execute function set_audit_fields();
create trigger trg_watchlist_audit         before update on public.watchlist_items   for each row execute function set_audit_fields();
create trigger trg_doc_folders_audit       before update on public.document_folders  for each row execute function set_audit_fields();
create trigger trg_documents_audit         before update on public.documents         for each row execute function set_audit_fields();
create trigger trg_inventory_audit         before update on public.inventory_items   for each row execute function set_audit_fields();
create trigger trg_inventory_maint_audit   before update on public.inventory_maintenance for each row execute function set_audit_fields();
create trigger trg_pets_audit              before update on public.pets              for each row execute function set_audit_fields();
create trigger trg_pet_med_recs_audit      before update on public.pet_medical_records for each row execute function set_audit_fields();
create trigger trg_pet_vaccinations_audit  before update on public.pet_vaccinations  for each row execute function set_audit_fields();
create trigger trg_vehicles_audit          before update on public.vehicles          for each row execute function set_audit_fields();
create trigger trg_vehicle_svc_audit       before update on public.vehicle_service_records for each row execute function set_audit_fields();
create trigger trg_tags_audit              before update on public.tags              for each row execute function set_audit_fields();
create trigger trg_reminders_audit         before update on public.reminders         for each row execute function set_audit_fields();
create trigger trg_app_settings_audit      before update on public.app_settings      for each row execute function set_audit_fields();

-- ============================================================================
-- ░░ ACCOUNT BALANCE TRIGGER
-- ============================================================================

create or replace function public.update_account_balance()
returns trigger
language plpgsql
security definer
as $$
declare
  acc_id uuid;
begin
  if TG_OP = 'DELETE' then
    acc_id := old.account_id;
  else
    acc_id := new.account_id;
  end if;

  update public.accounts
  set current_balance = public.compute_account_balance(acc_id)
  where id = acc_id;

  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger trg_txn_balance
  after insert or update or delete on public.transactions
  for each row execute function update_account_balance();

-- ============================================================================
-- ░░ ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all data tables
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.payment_cycles enable row level security;
alter table public.people enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.payment_obligations enable row level security;
alter table public.obligation_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;
alter table public.monthly_closings enable row level security;
alter table public.shopping_categories enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.products enable row level security;
alter table public.subscription_services enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_shared_users enable row level security;
alter table public.games enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.document_folders enable row level security;
alter table public.documents enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_maintenance enable row level security;
alter table public.pets enable row level security;
alter table public.pet_medical_records enable row level security;
alter table public.pet_vaccinations enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_service_records enable row level security;
alter table public.tags enable row level security;
alter table public.taggings enable row level security;
alter table public.attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.app_settings enable row level security;

-- Helper: generate RLS policies for a direct-household table
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
    execute format('create policy "select own household" on public.%I for select using (is_household_member(household_id));', _tbl);
    execute format('create policy "insert own household" on public.%I for insert with check (is_household_member(household_id));', _tbl);
    execute format('create policy "update own household" on public.%I for update using (is_household_member(household_id)) with check (is_household_member(household_id));', _tbl);
    execute format('create policy "delete own household" on public.%I for delete using (is_household_member(household_id));', _tbl);
  end loop;
end;
$$;

-- households: PK is id, not household_id — uses id directly
create policy "select own household" on public.households for select using (is_household_member(id));
create policy "insert own household" on public.households for insert with check (is_household_member(id));
create policy "update own household" on public.households for update using (is_household_member(id)) with check (is_household_member(id));
create policy "delete own household" on public.households for delete using (is_household_member(id));

-- Sub-tables: scope via parent
create policy "select via pet" on public.pet_medical_records for select
  using (exists (select 1 from public.pets where pets.id = pet_medical_records.pet_id and is_household_member(pets.household_id)));
create policy "insert via pet" on public.pet_medical_records for insert
  with check (exists (select 1 from public.pets where pets.id = pet_medical_records.pet_id and is_household_member(pets.household_id)));
create policy "update via pet" on public.pet_medical_records for update
  using (exists (select 1 from public.pets where pets.id = pet_medical_records.pet_id and is_household_member(pets.household_id)));
create policy "delete via pet" on public.pet_medical_records for delete
  using (exists (select 1 from public.pets where pets.id = pet_medical_records.pet_id and is_household_member(pets.household_id)));

create policy "select via pet" on public.pet_vaccinations for select
  using (exists (select 1 from public.pets where pets.id = pet_vaccinations.pet_id and is_household_member(pets.household_id)));
create policy "insert via pet" on public.pet_vaccinations for insert
  with check (exists (select 1 from public.pets where pets.id = pet_vaccinations.pet_id and is_household_member(pets.household_id)));
create policy "update via pet" on public.pet_vaccinations for update
  using (exists (select 1 from public.pets where pets.id = pet_vaccinations.pet_id and is_household_member(pets.household_id)));
create policy "delete via pet" on public.pet_vaccinations for delete
  using (exists (select 1 from public.pets where pets.id = pet_vaccinations.pet_id and is_household_member(pets.household_id)));

create policy "select via vehicle" on public.vehicle_service_records for select
  using (exists (select 1 from public.vehicles where vehicles.id = vehicle_service_records.vehicle_id and is_household_member(vehicles.household_id)));
create policy "insert via vehicle" on public.vehicle_service_records for insert
  with check (exists (select 1 from public.vehicles where vehicles.id = vehicle_service_records.vehicle_id and is_household_member(vehicles.household_id)));
create policy "update via vehicle" on public.vehicle_service_records for update
  using (exists (select 1 from public.vehicles where vehicles.id = vehicle_service_records.vehicle_id and is_household_member(vehicles.household_id)));
create policy "delete via vehicle" on public.vehicle_service_records for delete
  using (exists (select 1 from public.vehicles where vehicles.id = vehicle_service_records.vehicle_id and is_household_member(vehicles.household_id)));

create policy "select via parent" on public.inventory_maintenance for select
  using (exists (select 1 from public.inventory_items where inventory_items.id = inventory_maintenance.inventory_item_id and is_household_member(inventory_items.household_id)));
create policy "insert via parent" on public.inventory_maintenance for insert
  with check (exists (select 1 from public.inventory_items where inventory_items.id = inventory_maintenance.inventory_item_id and is_household_member(inventory_items.household_id)));
create policy "update via parent" on public.inventory_maintenance for update
  using (exists (select 1 from public.inventory_items where inventory_items.id = inventory_maintenance.inventory_item_id and is_household_member(inventory_items.household_id)));
create policy "delete via parent" on public.inventory_maintenance for delete
  using (exists (select 1 from public.inventory_items where inventory_items.id = inventory_maintenance.inventory_item_id and is_household_member(inventory_items.household_id)));

create policy "select via transaction" on public.transaction_splits for select
  using (exists (select 1 from public.transactions where transactions.id = transaction_splits.transaction_id and is_household_member(transactions.household_id)));
create policy "insert via transaction" on public.transaction_splits for insert
  with check (exists (select 1 from public.transactions where transactions.id = transaction_splits.transaction_id and is_household_member(transactions.household_id)));
create policy "update via transaction" on public.transaction_splits for update
  using (exists (select 1 from public.transactions where transactions.id = transaction_splits.transaction_id and is_household_member(transactions.household_id)));
create policy "delete via transaction" on public.transaction_splits for delete
  using (exists (select 1 from public.transactions where transactions.id = transaction_splits.transaction_id and is_household_member(transactions.household_id)));

create policy "select via obligation" on public.obligation_payments for select
  using (exists (select 1 from public.payment_obligations where payment_obligations.id = obligation_payments.obligation_id and is_household_member(payment_obligations.household_id)));
create policy "insert via obligation" on public.obligation_payments for insert
  with check (exists (select 1 from public.payment_obligations where payment_obligations.id = obligation_payments.obligation_id and is_household_member(payment_obligations.household_id)));
create policy "update via obligation" on public.obligation_payments for update
  using (exists (select 1 from public.payment_obligations where payment_obligations.id = obligation_payments.obligation_id and is_household_member(payment_obligations.household_id)));
create policy "delete via obligation" on public.obligation_payments for delete
  using (exists (select 1 from public.payment_obligations where payment_obligations.id = obligation_payments.obligation_id and is_household_member(payment_obligations.household_id)));

create policy "select via budget" on public.budget_lines for select
  using (exists (select 1 from public.budgets where budgets.id = budget_lines.budget_id and is_household_member(budgets.household_id)));
create policy "insert via budget" on public.budget_lines for insert
  with check (exists (select 1 from public.budgets where budgets.id = budget_lines.budget_id and is_household_member(budgets.household_id)));
create policy "update via budget" on public.budget_lines for update
  using (exists (select 1 from public.budgets where budgets.id = budget_lines.budget_id and is_household_member(budgets.household_id)));
create policy "delete via budget" on public.budget_lines for delete
  using (exists (select 1 from public.budgets where budgets.id = budget_lines.budget_id and is_household_member(budgets.household_id)));

create policy "select via list" on public.shopping_list_items for select
  using (exists (select 1 from public.shopping_lists where shopping_lists.id = shopping_list_items.list_id and is_household_member(shopping_lists.household_id)));
create policy "insert via list" on public.shopping_list_items for insert
  with check (exists (select 1 from public.shopping_lists where shopping_lists.id = shopping_list_items.list_id and is_household_member(shopping_lists.household_id)));
create policy "update via list" on public.shopping_list_items for update
  using (exists (select 1 from public.shopping_lists where shopping_lists.id = shopping_list_items.list_id and is_household_member(shopping_lists.household_id)));
create policy "delete via list" on public.shopping_list_items for delete
  using (exists (select 1 from public.shopping_lists where shopping_lists.id = shopping_list_items.list_id and is_household_member(shopping_lists.household_id)));

create policy "select via subscription" on public.subscription_shared_users for select
  using (exists (select 1 from public.subscriptions where subscriptions.id = subscription_shared_users.subscription_id and is_household_member(subscriptions.household_id)));
create policy "insert via subscription" on public.subscription_shared_users for insert
  with check (exists (select 1 from public.subscriptions where subscriptions.id = subscription_shared_users.subscription_id and is_household_member(subscriptions.household_id)));
create policy "update via subscription" on public.subscription_shared_users for update
  using (exists (select 1 from public.subscriptions where subscriptions.id = subscription_shared_users.subscription_id and is_household_member(subscriptions.household_id)));
create policy "delete via subscription" on public.subscription_shared_users for delete
  using (exists (select 1 from public.subscriptions where subscriptions.id = subscription_shared_users.subscription_id and is_household_member(subscriptions.household_id)));

create policy "select via tag" on public.taggings for select
  using (exists (select 1 from public.tags where tags.id = taggings.tag_id and is_household_member(tags.household_id)));
create policy "insert via tag" on public.taggings for insert
  with check (exists (select 1 from public.tags where tags.id = taggings.tag_id and is_household_member(tags.household_id)));
create policy "update via tag" on public.taggings for update
  using (exists (select 1 from public.tags where tags.id = taggings.tag_id and is_household_member(tags.household_id)));
create policy "delete via tag" on public.taggings for delete
  using (exists (select 1 from public.tags where tags.id = taggings.tag_id and is_household_member(tags.household_id)));

-- Tables without household_id (scoped via auth.uid directly)
create policy "select own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

create policy "select own memberships" on public.household_members for select using (auth.uid() = user_id);

-- subscription_services is public catalog
create policy "select all" on public.subscription_services for select using (true);

-- audit_log: admins can view their household's log
create policy "select own audit" on public.audit_log for select
  using (household_id is null or is_household_member(household_id));

-- ============================================================================
-- ░░ VIEWS
-- ============================================================================

create or replace view public.v_net_worth as
select
  a.household_id,
  sum(a.current_balance) as net_worth
from public.accounts a
where a.include_in_net_worth = true and a.is_archived = false
group by a.household_id;

create or replace view public.v_monthly_by_category as
select
  t.household_id,
  date_trunc('month', t.date)::date as month,
  t.category_id,
  sum(t.amount) as total
from public.transactions t
where t.deleted_at is null and t.paid = true
group by t.household_id, date_trunc('month', t.date)::date, t.category_id;

create or replace view public.v_upcoming_reminders as
select *
from public.reminders
where status = 'pending' and due_at >= now();

create or replace view public.v_renewals as
select
  s.id,
  s.household_id,
  s.name,
  s.renewal_date,
  s.status,
  s.monthly_price
from public.subscriptions s
where s.renewal_date is not null and s.status = 'active';

create or replace view public.v_open_obligations as
select
  household_id,
  direction,
  count(*) as count,
  sum(total_amount - paid_amount) as outstanding
from public.payment_obligations
where deleted_at is null and status in ('open','partially_paid')
group by household_id, direction;

-- ============================================================================
-- ░░ SEED: subscription_services catalog
-- ============================================================================

insert into public.subscription_services (name, default_url) values
  ('Netflix', 'https://netflix.com'),
  ('Spotify', 'https://spotify.com'),
  ('Disney+', 'https://disneyplus.com'),
  ('HBO Max', 'https://max.com'),
  ('Amazon Prime', 'https://primevideo.com'),
  ('YouTube Premium', 'https://youtube.com/premium'),
  ('Apple Music', 'https://music.apple.com'),
  ('Apple TV+', 'https://tv.apple.com'),
  ('Crunchyroll', 'https://crunchyroll.com'),
  ('Xbox Game Pass', 'https://xbox.com/gamepass'),
  ('PlayStation Plus', 'https://playstation.com/ps-plus'),
  ('Nintendo Online', 'https://nintendo.com/switch/online'),
  ('Microsoft 365', 'https://microsoft365.com'),
  ('Google One', 'https://one.google.com'),
  ('iCloud+', 'https://icloud.com'),
  ('Dropbox', 'https://dropbox.com'),
  ('Notion', 'https://notion.so'),
  ('Figma', 'https://figma.com'),
  ('GitHub Copilot', 'https://github.com/features/copilot'),
  ('Adobe Creative Cloud', 'https://adobe.com/creativecloud')
on conflict do nothing;
