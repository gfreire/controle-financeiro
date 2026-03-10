

# AI Code Generation Rules

This document defines the **rules that AI code generators must follow** when creating or modifying code in this project.

The purpose is to ensure that generated code remains:

- consistent
- maintainable
- predictable
- aligned with the architecture

This file must be read **together with**:

ARCHITECTURE.md  
AI_CONTEXT.md  

---

# General Principles

AI must generate code that respects the system architecture and financial domain rules.

Never invent new architectural patterns that are not defined in the documentation.

Always follow:

- folder structure
- service layer
- DTO definitions
- domain rules

---

# Folder Structure Rules

All files must follow the defined structure.

```
src
 ├ lib
 ├ services
 ├ features
 ├ components
 └ types
```

Additional internal layers exist inside `src/lib`:

src/lib
 ├ supabase
 ├ utils
 └ validations

Rules:

- **utils contain pure helper functions**
- **validations contain schema and input validation logic**
- utils must never depend on services or database queries
- utils must remain reusable by both server and UI layers

Rules:

- **Services handle data access**
- **Features contain business UI**
- **Components contain reusable UI**
- **Types contain DTOs and shared types**

Do not create alternative structures.

---

# Database Access Rules

Supabase access must follow these rules:

1. Database queries must exist only inside **services**.
2. UI components must never query Supabase directly.
3. Pages must call services instead of writing queries.
4. Services must return DTOs.

Example flow:

```
page
 → service
 → supabase query
 → DTO
 → component
```

Never write database queries inside:

- React components
- pages
- hooks

---

# Service Layer Rules

Services must:

- encapsulate all Supabase queries
- return DTOs defined in `ARCHITECTURE.md`
- contain financial aggregation logic

Services must NOT:

- contain UI logic
- depend on React components

Example:

```
dashboard.service.ts
transactions.service.ts
accounts.service.ts
```

---

# DTO Rules

DTOs defined in `ARCHITECTURE.md` are the **source of truth**.

AI must not modify DTO structure unless explicitly instructed.

UI components must only consume DTOs.

Never expose raw database rows to the UI.

---

# Chart Rules

Charts must follow these rules:

Charts use **Recharts**.

Charts must receive **aggregated data from services**.

Charts must never calculate totals.

Forbidden patterns:

```
reduce()
map() aggregation
manual totals in UI
```

All aggregation must happen in SQL queries inside services.

Example SQL patterns:

```
SUM(amount)
GROUP BY month
GROUP BY category
```

Analytics queries must aggregate data from the correct financial sources.

Primary analytics tables:

transactions  
card_installments  

Important rule:

Credit card analytics must use **card_installments competence dates**, not purchase dates.

Example:

purchase date: Feb 28  
installments: Mar, Apr, May  

Analytics must count values in March, April and May, not February.

The table `card_purchases` should be treated as **purchase metadata**, not as the financial source for analytics charts.

---

# Dashboard Interaction Rules

Dashboard must be **filter driven**.

Shared filter state controls:

- charts
- transaction explorer
- summary cards

Filter structure:

```
type DashboardFilters = {
  periodStart: string
  periodEnd: string
  accounts?: string[]
  categories?: string[]
  subcategories?: string[]
  transactionType?: "income" | "expense"
}
```

Charts must update filters when clicked.

Example interaction:

```
click category in chart
 → update filter
 → reload data
 → update UI
```

---

# UI Component Rules

UI components must be:

- small
- reusable
- stateless when possible

Components must receive data through **props**.

Components must not fetch data directly.

---

# Styling Rules

Styling must follow these rules:

- Use **TailwindCSS**
- Use **shadcn/ui components**
- Do not write inline CSS
- Do not use style attributes
- Avoid custom CSS files when possible

Forbidden:

```
style={{}}
inline CSS
custom CSS blocks inside components
```

Preferred:

```
Tailwind utility classes
shadcn/ui components
```

---

# State Management Rules

Local component state may be used for UI interactions.

Global state must be avoided unless necessary.

Dashboard shared filters may be implemented using:

- React context
- shared state hook

---

# Server Architecture Rules

The application uses **Next.js App Router with Server Components**.

Data loading pattern:

page.tsx (server component)  
→ calls service  
→ service performs Supabase query  
→ DTO returned  
→ UI component renders

API routes should not be generated unless strictly necessary.

Data fetching must occur in:

- server components
- services

Mutations must be implemented using **Server Actions** which call services.

---

# Form Rules

Forms must use:

- controlled inputs
- validation
- clear error states

Forms must allow:

- creating categories from inside transaction forms
- creating subcategories from inside forms

Users must never be forced to leave the form to create categories.

---

# Domain Rules Enforcement

AI must respect the financial domain rules defined in `AI_CONTEXT.md`.

Important examples:

Reservoir is NOT real money.

Reservoir must not affect:

```
balances
income
expense
analytics
```

Credit card analytics must use **installment competence date**, not purchase date.

Debts do not automatically create transactions.

Financial calculations must avoid floating point precision errors.

Money storage in the database uses:

numeric(14,2)

Whenever possible, calculations should use helper utilities located in:

src/lib/utils/money.ts

Installment generation must apply rounding differences to the **first installment** so the sum of installments matches the original purchase value.

---

# Linked Records Consistency

Some operations create linked records.

Examples:

Card purchase → creates installments  
Reservoir withdrawal → may create transactions  

When editing linked entities, consistency must be maintained.

AI must implement logic to prevent inconsistent states.

---

# Code Quality Rules

Generated code must follow these guidelines:

- clear function names
- small functions
- readable structure
- no duplicated logic

Avoid extremely long files.

Prefer reuse of existing utilities over re‑implementing logic.

If functionality already exists inside:

src/lib/utils

the AI should import and reuse it rather than rewriting formatting, normalization, or numeric helpers.

---

# Performance Rules

Services must minimize data transfer.

Prefer:

- aggregated SQL
- filtered queries
- pagination when needed

Avoid returning large datasets when not necessary.

---

# Final Goal

The system should remain:

- modular
- AI-readable
- easy to extend
- predictable

All generated code must follow the rules in this document.