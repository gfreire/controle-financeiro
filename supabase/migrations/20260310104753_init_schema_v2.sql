-- =========================================
-- EXTENSIONS
-- =========================================

create extension if not exists "pgcrypto";

-- =========================================
-- ENUMS
-- =========================================

create type account_type_enum as enum (
  'CASH',
  'BANK',
  'CREDIT_CARD'
);

create type transaction_type_enum as enum (
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'CREDIT_CARD_PAYMENT'
);

create type category_type_enum as enum (
  'INCOME',
  'EXPENSE'
);

create type debt_side_enum as enum (
  'PAYABLE',
  'RECEIVABLE'
);

-- =========================================
-- PROFILES
-- =========================================

create table profiles (
  user_id uuid primary key references auth.users(id),

  name text,
  email text,
  phone text,

  created_at timestamptz default now()
);

-- =========================================
-- FINANCIAL INSTITUTIONS
-- =========================================

create table financial_institutions (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  color text,

  created_at timestamptz default now()
);

-- =========================================
-- ACCOUNTS
-- =========================================

create table accounts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  type account_type_enum not null,

  name text not null,

  institution_id uuid references financial_institutions(id),

  color text,

  active boolean default true,

  created_at timestamptz default now()
);

create index idx_accounts_user
on accounts(user_id);

-- =========================================
-- ACCOUNT TYPES
-- =========================================

create table cash_accounts (
  account_id uuid primary key references accounts(id),

  initial_balance numeric(14,2) default 0
);

create table bank_accounts (
  account_id uuid primary key references accounts(id),

  overdraft_limit numeric(14,2) default 0
);

create table credit_cards (
  account_id uuid primary key references accounts(id),

  closing_day int not null,
  due_day int not null
);

-- =========================================
-- CATEGORIES
-- =========================================

create table categories (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id),

  name text not null,

  type category_type_enum not null,

  color text not null,
  icon text,

  is_default boolean default false,
  is_system boolean default false,

  active boolean default true,

  created_at timestamptz default now()
);

create index idx_categories_user
on categories(user_id);

-- =========================================
-- SUBCATEGORIES
-- =========================================

create table subcategories (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  category_id uuid not null references categories(id),

  name text not null,

  active boolean default true,

  created_at timestamptz default now()
);

-- =========================================
-- TRANSACTIONS
-- =========================================

create table transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  type transaction_type_enum not null,

  origin_account_id uuid references accounts(id),
  destination_account_id uuid references accounts(id),

  amount numeric(14,2) not null,

  date date not null,

  description text,

  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),

  is_reservoir boolean default false,

  created_at timestamptz default now()
);

create index idx_transactions_user
on transactions(user_id);

create index idx_transactions_date
on transactions(date);

-- reservoir cannot generate transfer

alter table transactions
add constraint reservoir_not_transfer
check (
  not (is_reservoir = true and type = 'TRANSFER')
);

-- =========================================
-- CARD PURCHASES
-- =========================================

create table card_purchases (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  credit_card_id uuid not null references accounts(id),

  amount numeric(14,2) not null,

  purchase_date date not null,

  description text,

  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),

  installments int not null,

  is_reservoir boolean default false,

  created_at timestamptz default now()
);

-- =========================================
-- CARD INSTALLMENTS
-- =========================================

create table card_installments (
  id uuid primary key default gen_random_uuid(),

  purchase_id uuid not null references card_purchases(id),

  credit_card_id uuid not null references accounts(id),

  competence date not null,

  amount numeric(14,2) not null,

  created_at timestamptz default now()
);

create index idx_card_installments_card_competence
on card_installments(credit_card_id, competence);

-- =========================================
-- CARD PAYMENTS
-- =========================================

create table card_payments (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  credit_card_id uuid not null references accounts(id),

  account_id uuid not null references accounts(id),

  transaction_id uuid not null references transactions(id),

  amount numeric(14,2) not null,

  payment_date date not null,

  created_at timestamptz default now(),

  unique(transaction_id)
);

create index idx_card_payments_card
on card_payments(credit_card_id);

-- =========================================
-- DEBTS
-- =========================================

create table debts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  agent text not null,

  side debt_side_enum not null,

  initial_balance numeric(14,2) not null,

  active boolean default true,

  created_at timestamptz default now()
);

-- =========================================
-- RESERVOIRS
-- =========================================

create table reservoirs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  name text not null,

  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),

  created_at timestamptz default now()
);

-- =========================================
-- RESERVOIR TRANSACTIONS
-- =========================================

create table reservoir_transactions (
  id uuid primary key default gen_random_uuid(),

  reservoir_id uuid not null references reservoirs(id),

  amount numeric(14,2) not null,

  description text,

  linked_transaction_id uuid references transactions(id),
  linked_card_purchase_id uuid references card_purchases(id),

  created_at timestamptz default now()
);

create index idx_reservoir_transactions_reservoir
on reservoir_transactions(reservoir_id);

alter table reservoir_transactions
add constraint reservoir_link_check
check (
  not (
    linked_transaction_id is not null
    and linked_card_purchase_id is not null
  )
);

-- =========================================
-- BUDGETS
-- =========================================

create table budgets (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),

  amount numeric(14,2) not null,

  created_at timestamptz default now()
);

-- =========================================
-- FIXED EXPENSES
-- =========================================

create table fixed_expenses (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id),

  name text not null,

  amount numeric(14,2) not null,

  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),

  default_account_id uuid references accounts(id),

  due_day int not null,

  active boolean default true,

  created_at timestamptz default now()
);

-- =========================================
-- ENABLE RLS
-- =========================================

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table transactions enable row level security;
alter table card_purchases enable row level security;
alter table card_installments enable row level security;
alter table card_payments enable row level security;
alter table debts enable row level security;
alter table reservoirs enable row level security;
alter table reservoir_transactions enable row level security;
alter table budgets enable row level security;
alter table fixed_expenses enable row level security;

-- =========================================
-- POLICIES
-- =========================================

create policy "users own profiles"
on profiles
for all
using (user_id = auth.uid());

create policy "users own accounts"
on accounts
for all
using (user_id = auth.uid());

create policy "users own categories"
on categories
for all
using (user_id = auth.uid() or is_system = true);

create policy "users own subcategories"
on subcategories
for all
using (user_id = auth.uid());

create policy "users own transactions"
on transactions
for all
using (user_id = auth.uid());

create policy "users own card purchases"
on card_purchases
for all
using (user_id = auth.uid());

create policy "users own card installments"
on card_installments
for all
using (
  credit_card_id in (
    select id from accounts where user_id = auth.uid()
  )
);

create policy "users own card payments"
on card_payments
for all
using (user_id = auth.uid());

create policy "users own debts"
on debts
for all
using (user_id = auth.uid());

create policy "users own reservoirs"
on reservoirs
for all
using (user_id = auth.uid());

create policy "users own reservoir transactions"
on reservoir_transactions
for all
using (
  reservoir_id in (
    select id from reservoirs where user_id = auth.uid()
  )
);

create policy "users own budgets"
on budgets
for all
using (user_id = auth.uid());

create policy "users own fixed expenses"
on fixed_expenses
for all
using (user_id = auth.uid());