# Financial Control System — Architecture

This document defines the architecture, data flow, UI structure, and coding rules for the financial control system.

The goal of this document is to allow AI tools (Codex / GPT) to generate most of the application code consistently.

This system is designed as a **personal financial control system with analytics dashboard**, focused on understanding spending patterns and financial evolution.

---

# Tech Stack

Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts

Backend

- Supabase
- PostgreSQL

Authentication

- Supabase Auth

---

# Architectural Principles

1. UI must never query Supabase directly.
2. All database access must go through **services**.
3. Services are responsible for queries and aggregations.
4. UI consumes **DTO objects returned by services**.
5. Charts must receive **aggregated data**, never raw transactions.
6. Dashboard must be **interactive and filter-driven**.

---

# Data Fetching Strategy

The application uses **Next.js App Router with Server Components**.

Pages fetch data **directly from services on the server**, instead of calling API routes.

Standard data flow:

page.tsx  
→ service  
→ Supabase query  
→ DTO  
→ UI component  

Example pattern:

page.tsx (Server Component)  
→ calls service function  
→ service queries Supabase  
→ returns DTO  
→ component renders UI  

API routes should **not be created unless strictly necessary**.

Reasons:

- fewer network requests
- lower latency
- simpler architecture
- easier for AI code generation

---

# Mutations

Operations that modify data must use **Server Actions**.

Examples

createTransaction  
updateTransaction  
deleteTransaction  
createCardPurchase  
registerCardPayment  

Flow

Server Action  
→ service  
→ Supabase query  
→ database updated

---

# Project Structure

src

lib  
 supabase  
  client.ts  
  server.ts  

 auth  
  getUser.ts  

 utils  
  cn.ts  
  currency.ts  
  date.ts  
  id.ts  
  money.ts  
  normalize.ts  
  number.ts  
  string.ts  

 validations  

services  
 accounts.service.ts  
 transactions.service.ts  
 cards.service.ts  
 reservoirs.service.ts  
 dashboard.service.ts  

features  

 dashboard  
  components  
   summary-cards.tsx  
   monthly-chart.tsx  
   category-pie.tsx  
   category-bars.tsx  
   transaction-explorer.tsx  
   dashboard-filters.tsx  

 transactions  
  components  
   transaction-table.tsx  
   transaction-form.tsx  

 accounts  
  components  
   account-card.tsx  
   account-form.tsx  

 cards  
  components  
   card-list.tsx  
   purchase-form.tsx  

 reservoirs  
  components  
   reservoir-list.tsx  
   reservoir-form.tsx  

components  

 ui  
  button.tsx  
  input.tsx  
  card.tsx  
  dialog.tsx  

 layout  
  app-layout.tsx  
  sidebar.tsx  
  header.tsx  
  bottom-navigation.tsx  

types  
 database.ts

---

# Utility Functions

Utility functions are located in:

src/lib/utils

Utilities contain **pure reusable helper logic**.

They must:

- not access the database
- not contain UI logic
- be deterministic and side‑effect free

Examples:

money calculations  
text normalization  
date formatting  
currency formatting  
ID generation  
string manipulation  

Examples of utilities:

normalizeText()  
formatCurrency()  
formatDate()  
formatMonthLabel()  
generateId()  
formatMoney()  

Validation schemas are located in:

src/lib/validations

---

## Utility Layer Philosophy

The `utils` directory acts as a **pure utility layer** shared across the entire application.

These utilities support:

formatting  
normalization  
data safety  
numeric precision  
identifier generation  

Utilities should never depend on:

services  
database access  
React components  

They must remain **framework‑agnostic helpers** that can be reused in both:

server logic  
UI components  

Example responsibilities:

money.ts → safe money calculations  
currency.ts → currency formatting helpers  
date.ts → date manipulation helpers  
normalize.ts → input normalization  
id.ts → id generation helpers  
string.ts / number.ts → low level helpers  

The file `src/lib/utils.ts` may act as a **barrel export** for commonly used utilities.

---

# Routing

src/app

(auth)  
 login/page.tsx  
 signup/page.tsx  

(app)  
 dashboard/page.tsx  
 transactions/page.tsx  
 accounts/page.tsx  
 cards/page.tsx  
 reservoirs/page.tsx  
 budgets/page.tsx  
 debts/page.tsx  

---

# Navigation

Mobile (Bottom Navigation)

Dashboard  
Transactions  
Accounts  
Cards  
More  

More menu

Reservoirs  
Budgets  
Debts  
Settings  

Desktop (Sidebar)

Dashboard  
Transactions  
Accounts  
Cards  
Reservoir  
Budgets  
Debts  
Settings  

---

# Dashboard Philosophy

The dashboard is the **central feature of the system**.

The system is not focused only on recording transactions but on **analyzing financial behavior**.

Therefore the dashboard is designed as an **exploratory analytics interface**.

User flow

open dashboard  
→ view summary  
→ interact with charts  
→ filter data  
→ inspect transactions

---

# Dashboard Period

Dashboard analytics support **flexible time ranges**.

Supported selections

single month  
custom month range  
3 month window  
6 month window  
12 month window  
full year  

Examples

March 2026  
March → August 2026  
Year 2025  
Last 6 months  

Charts and analytics must adapt to the selected range.

Monthly charts aggregate data by month.

Category charts normally focus on **a selected month within the range**.

---

# Dashboard Filters

All charts and tables are controlled by shared filters.

Filters structure:

DashboardFilters

periodStart  
periodEnd  
accounts[]  
categories[]  
subcategories[]  
transactionType ("INCOME" | "EXPENSE")

These filters are passed to services.

---

# Dashboard Layout

1. Financial Summary Cards
2. Income vs Expense Chart
3. Monthly Evolution Chart
4. Category Distribution Chart
5. Category Comparison Chart
6. Transaction Explorer

---

# Charts

Charts must use **aggregated SQL data** returned by services.

Never compute totals in the UI.

Charts library

Recharts

Charts must visualize

income vs expense  
monthly evolution  
category distribution  
category comparison  

---

## Financial Summary

Cards displayed on top of the dashboard.

Values displayed:

Total Balance  
Monthly Income  
Monthly Expense  
Monthly Result  

These values are computed from aggregated queries returned by `dashboard.service.ts`.

The goal of these cards is to provide **a quick financial snapshot** for the selected period.

---

## Income vs Expense

Chart type

Bar Chart

Purpose

Compare total income and expenses within the selected period.

This chart helps answer questions such as:

"Did I spend more than I earned this month?"

or

"How did my income compare to expenses over the selected range?"

---

## Monthly Evolution

Chart type

Bar Chart

Purpose

Visualize financial evolution across months.

Each bar represents a month and shows:

income  
expense  

This chart is especially useful when a **range of months is selected**.

---

## Category Distribution

Chart type

Donut Chart

Purpose

Show percentage distribution of expenses by category.

Example question answered:

"Of the total spent in March, how much was spent in each category?"

This chart is focused on **relative distribution** rather than absolute values.

---

## Category Comparison

Chart type

Horizontal Bar Chart

Purpose

Compare absolute spending values between categories.

Example insight:

Which categories represent the largest spending amounts?

Horizontal bars work better when the number of categories increases.

---

# Transaction Explorer

The dashboard replaces the traditional “recent transactions” list with a **transaction explorer**.

The explorer shows transactions filtered by dashboard filters.

Filters

periodStart  
periodEnd  
accounts  
categories  
subcategories  
transactionType ("INCOME" | "EXPENSE")

Table fields

date  
description  
category  
subcategory  
account  
amount  

Charts must update explorer filters.

Example interaction

click category in chart  
→ filter category  
→ table updates automatically

---

# Service Layer

All database operations must be implemented inside services.

Service responsibilities:

dashboard.service → financial analytics and dashboard aggregations  

transactions.service → transaction creation, editing, deletion and listing  

accounts.service → account management and configuration  

cards.service → credit card purchases, installments and card payments  

reservoirs.service → reservoir logic and reservoir transactions

Example file

dashboard.service.ts

Functions

getFinancialSummary(filters)  
getMonthlyEvolution(filters)  
getCategoryDistribution(filters)  
getCategoryComparison(filters)  
getTransactionsFiltered(filters)

---

# Performance Rules

Charts must use aggregated SQL queries.

Example

SELECT category_id, SUM(amount)
FROM transactions
GROUP BY category_id

Never fetch raw transactions to compute totals in the frontend.

---

# State Management

Dashboard state is controlled through filters.

All dashboard components react to filter changes.

---

# Charts Library

Charts must use

Recharts

Reasons

React‑native components  
simple API  
lightweight  
easy for AI generation  

---

# UX Principles

Mobile-first design.

Desktop

Sidebar + Header layout.

Mobile

Header + Bottom Navigation.

Charts stack vertically on mobile.

---

# Domain Rules

Credit card expenses are counted by **installment competence date**, not purchase date.

Reservoir values are NOT considered real money yet.

Reservoir must not affect:

income  
expenses  
balance  

Reservoir and debts may appear in separate informational lists but must not affect dashboard calculations.

Credit card payments are stored as transactions with:

type = CREDIT_CARD_PAYMENT

These transactions represent paying the credit card bill and therefore
reduce the balance of the account used for the payment.

---

# Analytics Data Sources

Dashboard analytics do not read data directly from every table.

The analytics layer aggregates data primarily from:

transactions  
card_installments  

Important rule:

Credit card purchases must be analyzed using **installment competence dates**, not purchase dates.

This ensures that expenses appear in the correct financial month.

Example:

Purchase date: Feb 28  
Installments: Mar, Apr, May  

Analytics must count those values in:

March  
April  
May  

NOT February.

The table `card_purchases` represents purchase metadata, but **financial analytics must rely on `card_installments`**.

---

# Analytics Aggregation Model

Financial analytics combine two primary sources of financial events:

transactions  
card_installments  

Both represent real financial effects on the user's finances.

Analytics queries may aggregate or UNION these sources depending on
the chart or report being generated.

Example cases:

Income and expense evolution → transactions + card_installments  
Category distribution → transactions + card_installments  
Monthly totals → aggregated financial events per competence month  

The `card_purchases` table should not be used directly for analytics
because purchases may span multiple competence months.

---

# Money Precision Rules

Financial values must avoid floating point errors.

Database storage uses:

numeric(14,2)

Money calculations should use helper functions located in:

src/lib/utils/money.ts

Examples of responsibilities:

safe addition of money values  
safe subtraction  
rounding rules for installment generation  

Example rule already used in the system:

When generating credit card installments, rounding differences must be applied to the **first installment** so that the total matches the original purchase amount.

Example:

Purchase = 100  
Installments = 3

33.34  
33.33  
33.33

Total = 100.00

This prevents cumulative rounding errors.

---

# DTO Definitions

DTOs represent the structures returned by services to the UI.

These objects allow the UI to remain simple and prevent business logic inside components.

---

## FinancialSummaryDTO

type FinancialSummaryDTO = {
balance: number
income: number
expense: number
result: number
}

---

## MonthlyEvolutionDTO

type MonthlyEvolutionDTO = {
month: string
income: number
expense: number
}

---

## CategoryDistributionDTO

type CategoryDistributionDTO = {
categoryId: string
categoryName: string
total: number
}

---

## CategoryComparisonDTO

type CategoryComparisonDTO = {
categoryName: string
total: number
}

---

## TransactionViewDTO

type TransactionViewDTO = {
id: string
date: string
description: string
category: string
subcategory: string
account: string
amount: number
}

---

# Code Generation Scope

When AI tools (Codex / GPT) generate code for this project, they should follow the architecture defined in this document and generate the following modules.

Services

dashboard.service.ts  
transactions.service.ts  
accounts.service.ts  
cards.service.ts  
reservoirs.service.ts  

Layout Components

app-layout.tsx  
sidebar.tsx  
header.tsx  
bottom-navigation.tsx  

Dashboard Components

summary-cards.tsx  
monthly-chart.tsx  
category-pie.tsx  
category-bars.tsx  
transaction-explorer.tsx  
dashboard-filters.tsx  

Core Pages

dashboard/page.tsx  
transactions/page.tsx  
accounts/page.tsx  
cards/page.tsx  
reservoirs/page.tsx  
budgets/page.tsx  
debts/page.tsx  

Forms

transaction-form.tsx  
account-form.tsx  
purchase-form.tsx  
reservoir-form.tsx  

Charts must be implemented using **Recharts** and must consume DTO data returned by services.

Charts must never compute financial totals inside UI components.

---

# Future Expansion

Potential future modules

investments  
loan tracking  
advanced analytics  

The architecture must remain **service-driven and DTO-based**.

---

# Service Contracts

Services define the boundary between the UI and the database.

UI components and pages must **only interact with services**, never directly with Supabase queries.

---

## dashboard.service.ts

Responsible for all analytics and dashboard data.

getFinancialSummary(filters) → FinancialSummaryDTO  
getMonthlyEvolution(filters) → MonthlyEvolutionDTO[]  
getCategoryDistribution(filters) → CategoryDistributionDTO[]  
getCategoryComparison(filters) → CategoryComparisonDTO[]  
getTransactionsFiltered(filters) → TransactionViewDTO[]

---

## transactions.service.ts

createTransaction(data)  
updateTransaction(id, data)  
deleteTransaction(id)  
getTransactions(filters)

---

## accounts.service.ts

getAccounts()  
createAccount(data)  
updateAccount(id, data)  
deleteAccount(id)

---

## cards.service.ts

createCardPurchase(data)  
getCardPurchases(cardId)  
getCardInstallments(cardId)  
registerCardPayment(data)

---

## reservoirs.service.ts

createReservoir(data)  
addReservoirTransaction(data)  
withdrawReservoir(data)  
getReservoirs()  
getReservoirTransactions(reservoirId)

---

# AI Generation Rules

The project is designed so that an AI code generator can generate most files automatically.

---

## Architecture Awareness

AI code generators must treat this document as the **authoritative architecture specification**.

Generated code must respect:

service boundaries  
DTO contracts  
dashboard analytics rules  
utility layer responsibilities  

When uncertain, AI should prefer:

service logic over UI logic  
aggregated SQL over frontend computation  
utility helpers over duplicated logic

---

## Data Access

1. UI must never query Supabase directly.
2. All database queries must exist inside services.
3. Services return DTOs.

---

## UI Rules

1. Pages call services.
2. Components receive DTOs via props.
3. Components must not contain business logic.
4. Charts must receive aggregated data only.

---

## Chart Rules

Charts must never calculate totals.

All aggregations must be done in SQL queries in services.

---

## SQL Guidelines

Queries must prioritize performance.

Preferred patterns:

- SUM aggregations
- GROUP BY for charts
- indexed filters

Never return unnecessary rows.

---

# Purpose of This Document

This document acts as the **source of truth for system architecture**.

AI tools should read this file before generating code.
