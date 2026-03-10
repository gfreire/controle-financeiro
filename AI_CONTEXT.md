# Financial Control System — AI Context

This document explains the **domain rules and business logic** of the financial control system.

While `ARCHITECTURE.md` describes the **technical architecture**, this file explains **how the financial domain works** so that an AI code generator (Codex / GPT) can correctly implement system behavior.

The goal is to prevent the AI from making incorrect assumptions about financial flows.

---

# System Purpose

This application is a **personal financial management system** focused on:

- understanding spending behavior
- analyzing financial patterns
- exploring financial data through charts

The system is not only for recording transactions but for **financial analysis and insights**.

---

# Core Concepts

The system revolves around these core entities:

Accounts  
Transactions  
Credit Cards  
Card Purchases  
Reservoirs  
Debts  
Categories  
Subcategories  

Each entity has a specific role in financial behavior.

---

# Accounts

Accounts represent **real money locations**.

Examples:

- bank account
- cash wallet
- digital wallet

Accounts are used to store real balances and receive transactions.

Account types:

```
CASH
BANK
CREDIT_CARD
```

Credit cards behave differently and generate **installments instead of transactions**.

---

# Transactions

Transactions represent **real money movement**.

Transaction types:

```
INCOME
EXPENSE
TRANSFER
CREDIT_CARD_PAYMENT
```

Examples:

Income

```
salary
freelance payment
refund
```

Expense

```
food
rent
transport
```

Transfer

```
moving money between accounts
```

Credit card payment

```
paying a credit card bill
```

Transactions are the **primary financial records** used in analytics.

---

# Credit Card Purchases

Credit cards do not create regular transactions.

Instead they generate:

```
card_purchases
card_installments
```

Example:

Purchase:

```
Laptop
$1200
6 installments
```

System generates 6 rows in `card_installments`.

Each installment has a **competence month**.

Example:

```
Jan
Feb
Mar
Apr
May
Jun
```

Financial analytics must use **installment competence date**, not purchase date.

---

# Credit Card Payments

Paying a credit card creates a transaction:

```
type = CREDIT_CARD_PAYMENT
```

Money leaves an account and pays the credit card.

---

# Categories and Subcategories

Categories represent broad spending areas.

Example:

```
Food
Housing
Transport
```

Subcategories provide detailed analysis.

Example:

Food:

```
Groceries
Restaurants
Coffee
```

Subcategories are **very important for financial insights**.

Analytics must always allow filtering by:

```
category
subcategory
```

---

# Default Categories

The system contains **default system categories**.

These categories are stored without a user_id.

When a user signs up, the system should allow them to **select which default categories they want to use**.

During the first login flow:

1. show system default categories
2. user selects which categories apply to their life
3. system copies selected categories to the user account
4. related subcategories are copied as well

This ensures users start with a useful financial structure.

---

# Creating Categories from Transaction Forms

Users may create categories and subcategories **directly while creating transactions**.

Example flow:

User opens transaction form  
→ category dropdown  
→ chooses "create new category"  

System allows creation without leaving the form.

Same behavior must exist for:

```
transactions
card purchases
```

This prevents workflow interruptions.

---

# Reservoir (Cofre)

Reservoir represents **accumulated value that is not yet real money movement**.

Examples:

- money expected from work
- shared expenses accumulating before payment
- tracked value not yet received

Reservoir does NOT represent real account balance.

Reservoir must NOT affect:

```
account balances
income totals
expense totals
dashboard analytics
```

Reservoir only becomes real money when **withdrawn**.

Withdrawal flow:

Reservoir withdrawal  
→ creates real transaction  

Possible cases:

```
income generated
expense generated
card purchase generated
```

---

# Reservoir Transactions

Reservoir contains its own ledger:

```
reservoir_transactions
```

These transactions track:

- accumulation
- withdrawals
- adjustments

Reservoir withdrawals may create linked records in:

```
transactions
card_purchases
```

Editing a reservoir transaction must maintain consistency with linked records.

---

# Debts

Debts represent **money owed or money to receive**.

Types:

```
PAYABLE
RECEIVABLE
```

Debts do NOT automatically create transactions.

They are informational until a real payment happens.

Example:

Loan to friend

```
receivable
```

When payment happens:

```
transaction is created
```

Debt values must not automatically affect dashboard totals.

---

# Editing Linked Records

Some entities create linked records.

Example cases:

Reservoir withdrawal → creates transaction  
Card purchase → creates installments  

When editing these records, the system must maintain consistency.

Example:

Editing a purchase amount must update:

```
purchase
installments
```

Linked records must never become inconsistent.

---

# Dashboard Behavior

The dashboard is **interactive and analytical**.

Charts and tables respond to shared filters.

Filters include:

```
periodStart
periodEnd
accounts
categories
subcategories
transactionType
```

Clicking charts must update filters.

Example:

Click category in chart  
→ filter dashboard  
→ update charts  
→ update transaction explorer

The dashboard may operate over **flexible time ranges**.

Examples of supported periods:

single month  
custom month range  
last 3 months  
last 6 months  
last 12 months  
full year  

Example:

March 2026  
March → August 2026  
Year 2025  

Charts adapt depending on the selected range.

Monthly charts aggregate results per month.  
Category charts typically analyze **one selected month within the range**.

---

# Financial Calculations

Financial charts must use **aggregated data from services**.

Example metrics:

Monthly income  
Monthly expense  
Balance evolution  
Category distribution  

Aggregations must be calculated in SQL queries.

Analytics must aggregate data from the correct financial sources.

Primary analytics tables:

transactions  
card_installments  

Important rule:

Credit card purchases must be analyzed using **installment competence dates**, not purchase dates.

Example:

Purchase date: Feb 28  
Installments generated: Mar, Apr, May  

Analytics must count these expenses in:

March  
April  
May  

NOT February.

The table `card_purchases` represents purchase metadata only.  
Financial analytics must rely on the **card_installments** table.

---

# Money Reality Rules

Only these affect financial totals:

```
transactions
card installments
card payments
```

These values correspond to real financial events that affect account balances and financial reports.

The following do NOT affect totals:

```
reservoir
debts
```

Reservoirs and debts may appear in informational panels in the interface, but they must never distort analytics or financial totals.

They may appear in informational sections but must not distort analytics.

---

# Money Precision

Financial systems must avoid floating point precision errors.

The database stores monetary values using:

numeric(14,2)

Money calculations should use helper utilities located in:

src/lib/utils/money.ts

Typical responsibilities of these helpers include:

safe addition of money values  
safe subtraction  
rounding logic for installment generation  

Example rule used in the system:

When generating credit card installments, rounding differences must be applied to the **first installment** so that the total sum matches the original purchase value.

Example:

Purchase = 100  
Installments = 3

33.34  
33.33  
33.33  

Total = 100.00

---

# Design Goal

The system should allow the user to answer questions like:

Where am I spending the most?  
How did my spending evolve over time?  
Which categories are growing?  
What changed compared to last month?  

The system is therefore designed for **financial exploration and insight**.