# Transactions Module — Complete Requirements

**Project:** Expense Tracker (Personal + Family)
**Module:** Transactions
**Version:** 1.0
**Date:** April 22, 2026
**Platform:** Android + iOS (React Native / Expo) + Hono API + PostgreSQL

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [User Stories](#2-user-stories)
3. [User Flows](#3-user-flows)
4. [Screen Specifications](#4-screen-specifications)
   - 4.1 Transactions List Screen
   - 4.2 Add Transaction Bottom Sheet
   - 4.3 Transaction Detail Screen
   - 4.4 Reversal Confirmation Dialog
   - 4.5 Home Screen Quick Add Button
5. [Component Specifications](#5-component-specifications)
6. [UX Writing](#6-ux-writing)
7. [Backend — API Design](#7-backend--api-design)
   - 7.1 API Routes
   - 7.2 Request / Response Schemas
   - 7.3 Balance Calculation Logic
   - 7.4 Reversal Logic
8. [Frontend — State Management](#8-frontend--state-management)
   - 8.1 Zustand Store
   - 8.2 API Client Calls
9. [DB Schema](#9-db-schema)
10. [Business Logic Rules](#10-business-logic-rules)
11. [Error Handling](#11-error-handling)
12. [Accessibility Notes](#12-accessibility-notes)

---

## 1. Module Overview

| Field | Detail |
|-------|--------|
| Module Purpose | Record income and expense transactions. View ledger grouped by date with running balance. Correct entries via reversal only. |
| Entry Points | FAB (+) on Transactions screen, Swipe-up bottom sheet, Home screen quick add button |
| Exit Points | Home screen, Account Detail, Budget screen, Reports screen |
| Platforms | Android + iOS (React Native / Expo) |
| Auth Required | Yes — JWT Bearer token |
| Ledger Type | Append-only — no UPDATE or DELETE ever. Corrections via reversal row only. |

**Core principles:**
- All amounts stored as **integer paise** — ₹1 = 100 paise. No floats.
- Running balance recalculated from ledger on every fetch — never stored.
- Reversal = new row with `isReversal: true` + `referenceId` pointing to original.
- Reversed transactions shown as strikethrough / muted in UI.

---

## 2. User Stories

### Primary — Happy Path
> As a user, I want to add an expense of ₹450 for "Dining Out" from SBI Savings so that my balance updates immediately.

> As a user, I want to add a salary credit of ₹85,000 to my Bank account so that my available balance reflects the income.

> As a user, I want to see transactions grouped by date (Today, Yesterday, Apr 20…) with running balance per row so that I can follow my account like a passbook.

> As a user, I want to filter transactions by month so that I can review what I spent in a specific month.

> As a user, I want to filter by account and category together so that I can see "SBI Savings + Food" spends only.

> As a user, I want to search by note/amount so that I can find a specific transaction quickly.

> As a user, I want to tap a transaction to see full details including balance after, note, and transaction ID.

> As a user, I want to reverse a wrong transaction with one tap so that my ledger stays accurate.

### Edge Cases
> As a user with no transactions this month, I want a clear empty state so that I understand no activity has been recorded.

> As a user, I want reversed transactions to appear visually muted with a strikethrough in the list so that I can tell at a glance which entries were corrected.

> As a user, I want to be prevented from reversing a reversal entry so that I don't create double corrections.

> As a user, when filtering shows no results, I want to see a clear "no results" state and be able to clear filters easily.

### Android-Specific
> As an Android user, I want a FAB (+) always visible at bottom-right of the Transactions screen.

> As an Android user, I want to swipe up from the bottom edge to open the Add Transaction sheet.

### iOS-Specific
> As an iOS user, I want a (+) in the top-right nav bar to add a transaction.

> As an iOS user, I want to swipe left on a transaction row to reveal a "Reverse" quick action.

---

## 3. User Flows

### 3.1 Add Transaction Flow

```
Entry Points:
  [FAB (+) on Transactions screen]
  [Home screen quick add button]
  [Swipe up gesture]
        ↓
[Add Transaction Bottom Sheet opens]
  → Toggle: Expense (default) | Income
  → Enter amount (numeric keyboard opens auto)
  → Select Category → Category Picker Bottom Sheet
      → Search or browse
      → Select parent or subcategory
      → Sheet closes, category filled
  → Select Account
      → Account picker (list of user accounts)
      → Select account
  → Date (default: today, tap to change)
  → Note (optional, text field)
  → Tap "Save Transaction"
        ↓
  [Validation]
  ├── Amount = 0 or empty → "Please enter an amount"
  ├── No category → "Please select a category"
  ├── No account → "Please select an account"
  └── Valid →
        ↓
  [API: POST /transactions]
  ├── Error → Toast: "Failed to save. Try again."
  └── Success →
        → Sheet closes
        → Toast: "Transaction saved"
        → Transactions list refreshes
        → Account balance updates
```

### 3.2 View Transactions Flow

```
[Transactions Tab]
  → Default: current month, all accounts, all categories
  → Grouped by date (Today / Yesterday / Apr 20 / Apr 19...)
  → Each group shows date header + transactions + running balance per row
  → Monthly summary bar: Income total | Expense total | Savings
        ↓
  [Filter]
  → Tap month chip → month picker (scroll months)
  → Tap "All accounts" chip → account picker
  → Tap "All categories" chip → category picker
  → Tap search icon → search bar appears (search by note/amount)
  → Active filters shown as chips with X to remove
        ↓
  [Load more]
  → Infinite scroll / "Load more" button
  → Paginated: 30 per page
```

### 3.3 View Transaction Detail Flow

```
[Transactions List]
  → Tap any transaction row
  → [Transaction Detail Screen]
      → Category icon + amount (colored)
      → Account, Date & Time, Balance after, Note, Transaction ID
      → If reversal: show "This is a reversal of [original ID]"
      → If reversed: show "This transaction was reversed"
        ↓
  [Reverse option]
  → Tap "Reverse Transaction"
  → [Reversal Confirmation Dialog]
      → "This will post a ₹450 credit to cancel this entry."
      → [Cancel] [Confirm Reversal]
        ↓
  [API: POST /transactions/:id/reverse]
  ├── Error → Toast: "Failed to reverse. Try again."
  └── Success →
        → Toast: "Transaction reversed"
        → Navigate back to list
        → Both original + reversal visible (original muted)
```

### 3.4 Search Flow

```
[Transactions screen]
  → Tap search icon (top right)
  → Search bar appears, keyboard opens
  → Type note text or amount
  → Results filter live (debounced 300ms)
  → Shows matching transactions across all months
  → Tap result → Transaction Detail Screen
  → Tap X or back → search clears, return to normal list
```

---

## 4. Screen Specifications

---

### 4.1 Transactions List Screen

| Property | Detail |
|----------|--------|
| Purpose | View all transactions grouped by date with monthly summary and filters |
| Route | `/(tabs)/transactions` |
| Access | Authenticated users |

#### Layout

**Header:**
- Android: "Transactions" title + search icon + filter icon (top right)
- iOS: "Transactions" (centered) + search icon + filter icon (top right)

**Filter chips row (horizontal scroll):**
- Chip 1: Month (default: "Apr 2026") — tap → month picker modal
- Chip 2: Account (default: "All accounts") — tap → account picker
- Chip 3: Category (default: "All categories") — tap → category picker
- Active filter: teal background + white text
- Inactive filter: gray background + gray text
- X icon on active chip to clear that filter

**Monthly summary bar:**
- Background: light teal (#E1F5EE)
- Three columns: Income (teal) | Expense (red) | Savings (blue)
- Each: label + amount (13px bold)
- Tapping income/expense column applies that type filter

**Transactions grouped list:**

Date group header:
- "TODAY — Apr 22" / "YESTERDAY — Apr 21" / "APR 20" etc.
- Font: 11px, gray, uppercase

Transaction row (see Component 5.1):
- Category icon circle (colored) + category name + subcategory + account + amount + running balance

Reversal row (muted):
- Same layout but 50% opacity + amount has strikethrough
- Small red "Reversed" badge on right

**Empty state:**
- Illustration: empty ledger
- Heading: "No transactions yet"
- Subtext: "Tap + to add your first transaction."
- CTA: "Add Transaction"

**No filter results:**
- Heading: "No transactions found"
- Subtext: "Try changing the filters or search term."
- Link: "Clear all filters"

**FAB:** (+) bottom right, teal, 56px circle (Android)

---

### 4.2 Add Transaction Bottom Sheet

| Property | Detail |
|----------|--------|
| Purpose | Quick entry for expense or income |
| Trigger | FAB tap, swipe up, home quick add |
| UI | Bottom sheet, 80% screen height, draggable |
| Dismiss | Drag down or tap overlay |

#### Layout

**Drag handle:** pill at top center

**Expense / Income toggle:**
- Segmented control: "Expense" | "Income"
- Default: Expense
- Expense selected: red tint (#FEF2F2), red text
- Income selected: teal tint (#E1F5EE), teal text

**Amount input:**
- Large centered display: ₹ prefix + amount (36px bold)
- Underline only (no box border)
- Teal underline when focused
- Numeric keyboard opens automatically
- Placeholder: "0"
- Color: red for expense, teal for income

**Date row:**
- Right-aligned, small
- Default: "Today" → tap → inline date picker
- Shows: "Apr 22, 2026"

**Form fields (card rows):**

| Field | Left | Content | Right |
|-------|------|---------|-------|
| Category | Category icon (or placeholder) | Category name + subcategory | › chevron |
| Account | Account type icon | Account name + balance | › chevron |
| Note | Pencil icon | "Add a note (optional)" | — |

Each field: tap → opens respective picker or text input

**Save button:**
- Full width, teal, rounded (12px)
- Label: "Save Transaction"
- Disabled when: amount = 0 OR no category OR no account
- Loading state: spinner in button

---

### 4.3 Transaction Detail Screen

| Property | Detail |
|----------|--------|
| Purpose | View full details of a single transaction |
| Route | `/transactions/:id` |
| Access | Transaction owner only |

#### Layout

**Header:**
- Android: Back arrow + "Transaction Detail"
- iOS: Back chevron + "Transaction Detail" (centered)

**Detail card:**

Top section (colored bg based on type):
- Expense: light red (#FEF2F2)
- Income: light teal (#E1F5EE)
- Center: category icon circle (52px) + amount (22px bold, colored) + category name + subcategory

Info rows (below divider):
| Label | Value |
|-------|-------|
| Account | Account name |
| Date & Time | Apr 22, 2026 · 7:30 PM |
| Type | Expense / Income badge |
| Balance after | ₹44,550 |
| Note | Note text (or "—" if none) |
| Added by | User name (shows family member name if family) |
| Transaction ID | txn_xxx... (small, muted, monospace) |

**Reversal info section (if this IS a reversal):**
- Blue info box: "This is a reversal of transaction #[short ID]"
- Link: "View original transaction"

**Reversed info section (if this was REVERSED):**
- Amber warning box: "This transaction was reversed on [date]"
- Link: "View reversal entry"

**Reverse transaction section (if neither reversed nor is a reversal):**
- Red warning box:
  - Heading: "Wrong entry?"
  - Body: "Transactions cannot be edited. Reverse this entry to correct your balance."
  - Button: "Reverse Transaction" (outlined red)

---

### 4.4 Reversal Confirmation Dialog

| Element | Detail |
|---------|--------|
| Trigger | Tap "Reverse Transaction" on detail screen |
| Type | Modal dialog (center overlay) |

**Content:**
- Title: "Reverse Transaction?"
- Body: "This will post a [+/−]₹[amount] [credit/debit] to [Account Name] to cancel this entry. Both entries will remain in your ledger for audit."
- Cancel button: "Cancel" (secondary)
- Confirm button: "Yes, Reverse" (red, destructive)

---

### 4.5 Home Screen — Quick Add Button

| Property | Detail |
|----------|--------|
| Location | Home screen, below accounts section |
| UI | Full-width teal outlined button or pill row |

**Content:**
- Icon: (+) + Label: "Add Transaction"
- Tap → opens Add Transaction bottom sheet
- Pre-selects first/default account

---

## 5. Component Specifications

### 5.1 Transaction Row

Used on: Transactions List Screen

| Property | Detail |
|----------|--------|
| Height | 60px |
| Left | Colored icon circle (36px) with category emoji |
| Middle top | Category name (13px, 500 weight) |
| Middle bottom | Subcategory · Account name (11px, muted) |
| Right top | Amount (13px, 600 weight) — red for expense, teal for income |
| Right bottom | "Bal: ₹XX,XXX" (10px, muted) — running balance |

**States:**

| State | Appearance |
|-------|------------|
| Default | White background |
| Pressed | #F9FAFB background |
| Reversed | 50% opacity, amount strikethrough, "Reversed" red badge |
| Is reversal | Purple tint, "Reversal" badge |

**iOS swipe left actions:**
- "Reverse" (red) — opens reversal confirmation

---

### 5.2 Monthly Summary Bar

Used on: Transactions List Screen

| Property | Detail |
|----------|--------|
| Background | #E1F5EE (light teal) |
| Height | 44px |
| Layout | Three equal columns |

| Column | Label color | Amount color |
|--------|-------------|--------------|
| Income | #0F6E56 | #0F6E56 bold |
| Expense | #993C1D | #D85A30 bold |
| Savings | #185FA5 | #185FA5 bold |

---

### 5.3 Filter Chip

Used on: Transactions List Screen

| State | Background | Text | Border |
|-------|------------|------|--------|
| Inactive | #F3F4F6 | #6B7280 | none |
| Active | #1D9E75 | #fff | none |
| Active (with X) | #1D9E75 | #fff | none, X icon right |

---

### 5.4 Date Group Header

Used on: Transactions List Screen

| Property | Detail |
|----------|--------|
| Format | "TODAY — Apr 22" / "YESTERDAY — Apr 21" / "APR 20" |
| Font | 11px, 600 weight, #6B7280, uppercase |
| Background | #F9FAFB |
| Padding | 8px 16px |

---

### 5.5 Amount Display (Add Transaction)

| State | Color | Size |
|-------|-------|------|
| Empty (placeholder) | #D1D5DB | 36px |
| Expense | #E24B4A | 36px bold |
| Income | #1D9E75 | 36px bold |

---

## 6. UX Writing

### Transactions List

| Element | Text |
|---------|------|
| Screen title | Transactions |
| Empty heading | No transactions yet |
| Empty subtext | Tap + to record your first expense or income. |
| Empty CTA | Add Transaction |
| No results heading | No transactions found |
| No results subtext | Try a different filter or search term. |
| No results link | Clear all filters |
| Loading | Loading transactions… |
| Summary label: income | Income |
| Summary label: expense | Expense |
| Summary label: savings | Savings |

### Add Transaction Sheet

| Element | Text |
|---------|------|
| Toggle: expense | Expense |
| Toggle: income | Income |
| Amount placeholder | 0 |
| Category placeholder | Select category |
| Account placeholder | Select account |
| Note placeholder | Add a note (optional) |
| Date default | Today |
| Save button | Save Transaction |
| Amount error | Please enter an amount |
| Category error | Please select a category |
| Account error | Please select an account |
| Success toast | Transaction saved |
| Error toast | Failed to save. Please try again. |

### Transaction Detail

| Element | Text |
|---------|------|
| Screen title | Transaction Detail |
| Label: account | Account |
| Label: date | Date & Time |
| Label: type | Type |
| Label: balance after | Balance after |
| Label: note | Note |
| Label: added by | Added by |
| Label: ID | Transaction ID |
| No note | — |
| Reversal info heading | This is a reversal entry |
| Reversal info body | This entry cancels transaction #[ID]. |
| Reversed warning heading | This transaction was reversed |
| Reversed warning body | A reversal was posted on [date]. |
| Cannot edit heading | Wrong entry? |
| Cannot edit body | Transactions cannot be edited. Reverse this entry to correct your balance. |
| Reverse button | Reverse Transaction |

### Reversal Confirmation

| Element | Text |
|---------|------|
| Title | Reverse Transaction? |
| Body | This will post a [+/−]₹[amount] [credit/debit] to [Account] to cancel this entry. Both entries will remain in your ledger. |
| Cancel | Cancel |
| Confirm | Yes, Reverse |
| Success toast | Transaction reversed |
| Error toast | Failed to reverse. Please try again. |

---

## 7. Backend — API Design

### 7.1 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/transactions` | Yes | List transactions with filters + running balance |
| POST | `/api/v1/transactions` | Yes | Create new transaction |
| GET | `/api/v1/transactions/:id` | Yes | Get single transaction detail |
| POST | `/api/v1/transactions/:id/reverse` | Yes | Post reversal entry |
| GET | `/api/v1/transactions/summary` | Yes | Monthly income/expense/savings totals |

---

### 7.2 Request / Response Schemas

#### POST /transactions — Create Transaction

**Request body:**
```json
{
  "accountId": "uuid",
  "categoryId": "uuid",
  "amount": 45000,
  "type": "DEBIT",
  "note": "Dinner with family",
  "transactedAt": "2026-04-22T19:30:00.000Z"
}
```

**Validation rules:**
| Field | Rule |
|-------|------|
| accountId | Required, valid UUID, must belong to user |
| categoryId | Required, valid UUID, must exist |
| amount | Required, integer, > 0 (paise) |
| type | Required, enum: "DEBIT" or "CREDIT" |
| note | Optional, max 200 chars |
| transactedAt | Required, valid ISO datetime, not in future by more than 1 min |

**Response 201:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "accountId": "uuid",
  "categoryId": "uuid",
  "amount": 45000,
  "type": "DEBIT",
  "note": "Dinner with family",
  "isReversal": false,
  "referenceId": null,
  "transactedAt": "2026-04-22T19:30:00.000Z",
  "createdAt": "2026-04-22T19:30:05.000Z"
}
```

---

#### GET /transactions — List Transactions

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| month | string | current month | Format: YYYY-MM |
| accountId | uuid | null | Filter by account |
| categoryId | uuid | null | Filter by category |
| type | string | null | "DEBIT" or "CREDIT" |
| search | string | null | Search in note field |
| page | number | 1 | Pagination |
| limit | number | 30 | Per page |

**Response 200:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": 45000,
      "type": "DEBIT",
      "note": "Dinner with family",
      "isReversal": false,
      "referenceId": null,
      "transactedAt": "2026-04-22T19:30:00.000Z",
      "runningBalance": 4455000,
      "category": {
        "id": "uuid",
        "name": "Food & Dining",
        "icon": "🍽️",
        "color": "#D85A30",
        "parentName": null
      },
      "account": {
        "id": "uuid",
        "name": "SBI Savings",
        "type": "bank"
      }
    }
  ],
  "summary": {
    "totalIncome": 8500000,
    "totalExpense": 1245000,
    "savings": 7255000
  },
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 45,
    "hasMore": true
  }
}
```

**Running balance calculation (server-side):**
```ts
// For each transaction in the result set,
// calculate running balance = account opening balance
// + sum of all CREDIT transactions up to and including this one
// - sum of all DEBIT transactions up to and including this one
// Order: oldest first for calculation, then reverse for display
```

---

#### GET /transactions/:id — Single Transaction

**Response 200:**
```json
{
  "id": "uuid",
  "amount": 45000,
  "type": "DEBIT",
  "note": "Dinner with family",
  "isReversal": false,
  "referenceId": null,
  "isReversed": false,
  "reversalId": null,
  "transactedAt": "2026-04-22T19:30:00.000Z",
  "createdAt": "2026-04-22T19:30:05.000Z",
  "runningBalance": 4455000,
  "category": { "id": "uuid", "name": "Food & Dining", "icon": "🍽️", "color": "#D85A30", "parentName": null },
  "account": { "id": "uuid", "name": "SBI Savings", "type": "bank" },
  "addedBy": { "id": "uuid", "name": "Rajesh" }
}
```

> Note: `isReversed` and `reversalId` are computed fields — check if any transaction has `referenceId = this transaction's id` and `isReversal = true`.

---

#### POST /transactions/:id/reverse — Reversal

**Request body:** none (no body needed)

**Server logic:**
```ts
1. Fetch original transaction by id
2. Verify belongs to user
3. Check NOT already reversed:
   - Query: SELECT * FROM transactions WHERE reference_id = :id AND is_reversal = true
   - If found → return 409: "Transaction already reversed"
4. Check is NOT itself a reversal:
   - If original.isReversal = true → return 400: "Cannot reverse a reversal"
5. Insert reversal row:
   {
     userId: original.userId,
     familyId: original.familyId,
     accountId: original.accountId,
     categoryId: original.categoryId,
     amount: original.amount,
     type: original.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
     isReversal: true,
     referenceId: original.id,
     note: `Reversal of transaction ${original.id.slice(0, 8)}`,
     transactedAt: new Date()
   }
6. Return reversal row
```

**Response 201:**
```json
{
  "id": "uuid",
  "amount": 45000,
  "type": "CREDIT",
  "isReversal": true,
  "referenceId": "original-uuid",
  "transactedAt": "2026-04-22T20:15:00.000Z"
}
```

**Error responses:**
| Status | Error | Condition |
|--------|-------|-----------|
| 404 | "Transaction not found" | ID not found or not owned by user |
| 400 | "Cannot reverse a reversal" | Original is itself a reversal |
| 409 | "Transaction already reversed" | Reversal already exists |

---

#### GET /transactions/summary — Monthly Summary

**Query params:** `month=YYYY-MM` (default: current month)

**Response 200:**
```json
{
  "month": "2026-04",
  "totalIncome": 8500000,
  "totalExpense": 1245000,
  "savings": 7255000,
  "transactionCount": 45
}
```

---

### 7.3 Balance Calculation Logic

```ts
// apps/api/src/utils/balance.engine.ts

export async function getRunningBalances(
  accountId: string,
  transactions: Transaction[]
): Promise<Map<string, number>> {
  // Get account opening balance
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId)
  })

  // Sort oldest first for running calculation
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transactedAt).getTime() - new Date(b.transactedAt).getTime()
  )

  // Get all transactions up to start of our window for base balance
  const windowStart = sorted[0]?.transactedAt
  const baseResult = await db
    .select({ net: sql<number>`COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.accountId, accountId),
      lt(transactions.transactedAt, windowStart)
    ))

  let runningBalance = account.openingBalance + Number(baseResult[0]?.net ?? 0)
  const balanceMap = new Map<string, number>()

  for (const tx of sorted) {
    if (tx.type === 'CREDIT') {
      runningBalance += tx.amount
    } else {
      runningBalance -= tx.amount
    }
    balanceMap.set(tx.id, runningBalance)
  }

  return balanceMap
}
```

---

### 7.4 Full Router Implementation

```ts
// apps/api/src/modules/transactions/transactions.router.ts

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { CreateTransactionSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { transactions, accounts } from '../../db/schema.js'
import { eq, and, gte, lte, desc, asc, ilike, sql } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'

export const transactionsRouter = new Hono()
transactionsRouter.use('*', authMiddleware)

// GET /transactions
transactionsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const { month, accountId, categoryId, type, search, page = '1', limit = '30' } = c.req.query()

  const targetMonth = month ?? new Date().toISOString().slice(0, 7)
  const start = startOfMonth(new Date(`${targetMonth}-01`))
  const end = endOfMonth(new Date(`${targetMonth}-01`))

  const conditions = [
    eq(transactions.userId, userId),
    gte(transactions.transactedAt, start),
    lte(transactions.transactedAt, end),
  ]

  if (accountId) conditions.push(eq(transactions.accountId, accountId))
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  if (type) conditions.push(eq(transactions.type, type as 'DEBIT' | 'CREDIT'))
  if (search) conditions.push(ilike(transactions.note, `%${search}%`))

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum

  const list = await db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: [desc(transactions.transactedAt)],
    limit: limitNum,
    offset,
    with: { category: true, account: true },
  })

  // Monthly summary
  const summary = await db
    .select({
      type: transactions.type,
      total: sql<number>`SUM(amount)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.transactedAt, start),
      lte(transactions.transactedAt, end),
    ))
    .groupBy(transactions.type)

  const totalIncome = summary.find(s => s.type === 'CREDIT')?.total ?? 0
  const totalExpense = summary.find(s => s.type === 'DEBIT')?.total ?? 0

  return c.json({
    transactions: list,
    summary: { totalIncome, totalExpense, savings: totalIncome - totalExpense },
    pagination: { page: pageNum, limit: limitNum, hasMore: list.length === limitNum }
  })
})

// POST /transactions
transactionsRouter.post('/', zValidator('json', CreateTransactionSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  // Verify account belongs to user
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, body.accountId), eq(accounts.userId, userId))
  })
  if (!account) return c.json({ error: 'Account not found' }, 404)

  const [tx] = await db
    .insert(transactions)
    .values({ ...body, userId, transactedAt: new Date(body.transactedAt) })
    .returning()

  return c.json(tx, 201)
})

// GET /transactions/:id
transactionsRouter.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
    with: { category: true, account: true },
  })
  if (!tx) return c.json({ error: 'Transaction not found' }, 404)

  // Check if reversed
  const reversal = await db.query.transactions.findFirst({
    where: and(eq(transactions.referenceId, id), eq(transactions.isReversal, true))
  })

  return c.json({ ...tx, isReversed: !!reversal, reversalId: reversal?.id ?? null })
})

// POST /transactions/:id/reverse
transactionsRouter.post('/:id/reverse', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const original = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId))
  })
  if (!original) return c.json({ error: 'Transaction not found' }, 404)
  if (original.isReversal) return c.json({ error: 'Cannot reverse a reversal' }, 400)

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.referenceId, id), eq(transactions.isReversal, true))
  })
  if (existing) return c.json({ error: 'Transaction already reversed' }, 409)

  const [reversal] = await db.insert(transactions).values({
    userId,
    familyId: original.familyId,
    accountId: original.accountId,
    categoryId: original.categoryId,
    amount: original.amount,
    type: original.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
    isReversal: true,
    referenceId: original.id,
    note: `Reversal of ${original.id.slice(0, 8)}`,
    transactedAt: new Date(),
  }).returning()

  return c.json(reversal, 201)
})
```

---

## 8. Frontend — State Management

### 8.1 Zustand Store

```ts
// apps/mobile/src/stores/transaction.store.ts

import { create } from 'zustand'
import { apiRequest } from '../api/client'

interface Transaction {
  id: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  note: string | null
  isReversal: boolean
  referenceId: string | null
  transactedAt: string
  runningBalance: number
  category: { id: string; name: string; icon: string; color: string; parentName: string | null }
  account: { id: string; name: string; type: string }
}

interface Summary {
  totalIncome: number
  totalExpense: number
  savings: number
}

interface Filters {
  month: string
  accountId: string | null
  categoryId: string | null
  type: 'DEBIT' | 'CREDIT' | null
  search: string
}

interface TransactionState {
  transactions: Transaction[]
  summary: Summary
  filters: Filters
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  page: number

  fetchTransactions: () => Promise<void>
  loadMore: () => Promise<void>
  setFilter: (key: keyof Filters, value: any) => void
  clearFilters: () => void
  createTransaction: (data: {
    accountId: string
    categoryId: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
    note?: string
    transactedAt: string
  }) => Promise<void>
  reverseTransaction: (id: string) => Promise<void>
}

const defaultFilters: Filters = {
  month: new Date().toISOString().slice(0, 7),
  accountId: null,
  categoryId: null,
  type: null,
  search: '',
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: { totalIncome: 0, totalExpense: 0, savings: 0 },
  filters: defaultFilters,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  page: 1,

  fetchTransactions: async () => {
    const { filters } = get()
    set({ isLoading: true, page: 1 })

    const params = new URLSearchParams({
      month: filters.month,
      page: '1',
      limit: '30',
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.search && { search: filters.search }),
    })

    const res = await apiRequest<{ transactions: Transaction[]; summary: Summary; pagination: any }>(
      `/transactions?${params}`
    )
    set({
      transactions: res.transactions,
      summary: res.summary,
      hasMore: res.pagination.hasMore,
      isLoading: false,
    })
  },

  loadMore: async () => {
    const { filters, page, transactions, hasMore, isLoadingMore } = get()
    if (!hasMore || isLoadingMore) return
    set({ isLoadingMore: true })

    const nextPage = page + 1
    const params = new URLSearchParams({
      month: filters.month,
      page: String(nextPage),
      limit: '30',
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
    })

    const res = await apiRequest<{ transactions: Transaction[]; pagination: any }>(
      `/transactions?${params}`
    )
    set({
      transactions: [...transactions, ...res.transactions],
      hasMore: res.pagination.hasMore,
      page: nextPage,
      isLoadingMore: false,
    })
  },

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }))
    get().fetchTransactions()
  },

  clearFilters: () => {
    set({ filters: defaultFilters })
    get().fetchTransactions()
  },

  createTransaction: async (data) => {
    const tx = await apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }))
    get().fetchTransactions()
  },

  reverseTransaction: async (id) => {
    const reversal = await apiRequest<Transaction>(`/transactions/${id}/reverse`, {
      method: 'POST',
    })
    get().fetchTransactions()
  },
}))
```

---

### 8.2 Grouped Transactions Helper

```ts
// apps/mobile/src/utils/groupTransactions.ts

import { format, isToday, isYesterday } from 'date-fns'

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { label: string; date: string; transactions: Transaction[] }[] = []
  const map = new Map<string, Transaction[]>()

  for (const tx of transactions) {
    const date = format(new Date(tx.transactedAt), 'yyyy-MM-dd')
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(tx)
  }

  for (const [date, txs] of map.entries()) {
    const d = new Date(date)
    let label: string
    if (isToday(d)) label = 'Today'
    else if (isYesterday(d)) label = 'Yesterday'
    else label = format(d, 'MMM d')
    groups.push({ label, date, transactions: txs })
  }

  return groups
}
```

---

### 8.3 Money Formatting

```ts
// apps/mobile/src/utils/money.ts

export const toPaise = (rupees: number): number => Math.round(rupees * 100)
export const toRupees = (paise: number): number => paise / 100

export const formatINR = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)

// For amount input display: "450" → 45000 paise
export const inputToPaise = (input: string): number => {
  const rupees = parseFloat(input) || 0
  return Math.round(rupees * 100)
}
```

---

## 9. DB Schema

No schema changes needed — transactions table already defined. Verify these fields exist:

```ts
// apps/api/src/db/schema.ts — transactions table (already in schema)

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').references(() => families.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  amount: integer('amount').notNull(),           // paise, always positive
  type: transactionTypeEnum('type').notNull(),   // 'DEBIT' | 'CREDIT'
  note: text('note'),
  isReversal: boolean('is_reversal').notNull().default(false),
  referenceId: uuid('reference_id'),             // null unless reversal
  transactedAt: timestamp('transacted_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Indexes to add for performance:**

```sql
-- Filter by user + date range (most common query)
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, transacted_at DESC);

-- Filter by account
CREATE INDEX idx_transactions_account
  ON transactions(account_id, transacted_at DESC);

-- Find reversals of a transaction
CREATE INDEX idx_transactions_reference
  ON transactions(reference_id)
  WHERE reference_id IS NOT NULL;
```

**Drizzle index definition:**
```ts
import { index } from 'drizzle-orm/pg-core'

export const transactions = pgTable('transactions', {
  // ... existing fields
}, (t) => ({
  userDateIdx: index('idx_transactions_user_date').on(t.userId, t.transactedAt),
  accountIdx: index('idx_transactions_account').on(t.accountId, t.transactedAt),
  referenceIdx: index('idx_transactions_reference').on(t.referenceId),
}))
```

---

## 10. Business Logic Rules

### Amount Rules
- Always stored as integer paise (₹1 = 100 paise)
- Amount always positive in DB — type (DEBIT/CREDIT) determines direction
- Display: DEBIT → show as −₹XXX (red), CREDIT → show as +₹XXX (teal)
- User input in rupees → convert to paise before API call: `Math.round(rupees * 100)`

### Append-Only Rules
- NEVER UPDATE or DELETE from transactions table
- Wrong entry → POST /transactions/:id/reverse
- Reversal creates opposite transaction (DEBIT↔CREDIT, same amount)
- Both original + reversal remain visible in ledger
- Reversed entries: shown muted + strikethrough in UI

### Running Balance Rules
- Calculated server-side per transaction row
- Formula: openingBalance + SUM(CREDIT up to this tx) − SUM(DEBIT up to this tx)
- Includes reversal rows in calculation (they cancel each other correctly)
- Displayed as "Bal: ₹XX,XXX" below each row

### Family Transactions
- When user is in a family: transaction has `familyId` set
- Family members can see all transactions in family view
- Personal view: show only own transactions
- "Added by" field shown in transaction detail for family context

### Filter Rules
- Month filter: required, always active (default: current month)
- Multiple filters: AND condition (account AND category AND type)
- Search: searches note field, case-insensitive, min 1 char
- Search overrides month filter — searches across all months

### Date Rules
- `transactedAt` = when the transaction actually happened (user can set past dates)
- `createdAt` = when the record was inserted (system, immutable)
- Transactions shown ordered by `transactedAt DESC`, not `createdAt`
- Future dates not allowed (max 1 min ahead for timezone tolerance)

---

## 11. Error Handling

### API Errors

| Scenario | HTTP Status | Error message |
|----------|-------------|---------------|
| Account not found / not owned | 404 | "Account not found" |
| Category not found | 404 | "Category not found" |
| Transaction not found / not owned | 404 | "Transaction not found" |
| Reverse a reversal | 400 | "Cannot reverse a reversal" |
| Already reversed | 409 | "Transaction already reversed" |
| Invalid amount (0 or negative) | 422 | "Amount must be greater than 0" |
| Future date | 422 | "Transaction date cannot be in the future" |
| Unauthorized | 401 | "Unauthorized" |

### Mobile Error Handling

```ts
// In store methods — wrap with try/catch
createTransaction: async (data) => {
  try {
    set({ isLoading: true })
    const tx = await apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    // success
  } catch (error: any) {
    throw new Error(error.message ?? 'Failed to save transaction')
  } finally {
    set({ isLoading: false })
  }
}
```

```tsx
// In screen — show toast on error
const handleSave = async () => {
  try {
    await createTransaction(formData)
    Toast.show({ text: 'Transaction saved', type: 'success' })
    bottomSheetRef.current?.close()
  } catch (e: any) {
    Toast.show({ text: e.message, type: 'error' })
  }
}
```

---

## 12. Accessibility Notes

| Requirement | Detail |
|-------------|--------|
| Transaction row | Accessible label: "[Category] [subcategory], [amount], [account], [date]. Balance after: [balance]" |
| Expense/Income toggle | Role: switch. Announces "Expense selected" / "Income selected" |
| Amount input | Label: "Amount in rupees". Announces current value |
| Reversed row | Announces "Reversed transaction" before reading content |
| Reversal badge | Accessible label: "This transaction was reversed" |
| Date group header | Role: heading level 3 |
| FAB button | Accessible label: "Add new transaction" |
| Reverse button | Accessible label: "Reverse this transaction" |
| Filter chips | Announces filter name + active/inactive state |
| Search field | Label: "Search transactions" |
| Empty state | Announces heading + hint text |
| iOS | Support Dynamic Type for all text sizes |
| Android | TalkBack content descriptions on all interactive elements |
| Touch targets | All rows and buttons minimum 44×44pt |

---

## 13. Implementation Enhancements (Recommended)

This section captures high-impact improvements to make implementation safer, faster, and easier to ship without regressions.

### 13.1 Scope Phasing (MVP vs Phase-2)

To avoid partially delivered UX, implement in phases:

**MVP (must ship first):**
- Create transaction (`POST /transactions`)
- Monthly transactions list (`GET /transactions?month=YYYY-MM`)
- Basic filters (month, account, category)
- Reverse transaction (`POST /transactions/:id/reverse`)
- Empty/no-results states

**Phase-2 (after MVP stabilization):**
- Search across all months
- Running balance per row
- Transaction detail deep links (original ↔ reversal)
- iOS swipe row action for reverse
- Infinite scroll pagination (`page`, `limit`)

### 13.2 Data Integrity Hardening

#### A) Enforce append-only at DB level

In addition to app-level rules, prevent accidental updates/deletes directly in DB:

- Application role should not have `UPDATE`/`DELETE` permission on `transactions`
- Optional DB trigger to reject update/delete attempts

#### B) Enforce reversal uniqueness in DB

Prevent race conditions where two reverse requests are processed simultaneously:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_reversal_reference
  ON transactions(reference_id)
  WHERE is_reversal = true AND reference_id IS NOT NULL;
```

Keep API-level conflict check, but DB unique index is the source of truth.

#### C) Add deterministic ordering for balance calculations

When two rows have same `transactedAt`, order must be deterministic:
- `ORDER BY transacted_at ASC, created_at ASC, id ASC` for running balance calculation
- `ORDER BY transacted_at DESC, created_at DESC, id DESC` for display list

### 13.3 Validation Enhancements

Add server-side rule for category/type compatibility:

- `DEBIT` allows categories of `expense` or `both`
- `CREDIT` allows categories of `income` or `both`

Reject mismatch with `422`:
- `"Selected category is not valid for this transaction type"`

Also validate:
- `accountId` ownership
- `categoryId` visibility (user-owned or system)
- future date tolerance max 1 minute

### 13.4 Running Balance Clarification

Running balance should be explicitly defined as:

- **Account-scoped value** (never mixed across accounts)
- Computed from:
  - account opening balance
  - net sum before page window
  - then row-by-row accumulation in deterministic order
- Includes reversal rows (so original+reversal net effect remains correct)

### 13.5 Search & Filter Behavior Contract

To avoid ambiguous UI behavior, define exact rule:

- Normal mode: month filter is mandatory
- Search mode (`search.length >= 1`):
  - searches across all months
  - still respects account/category/type filters
  - month chip remains visible but marked inactive during search

### 13.6 Performance Enhancements

Recommended indexes (in addition to existing):

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_id
  ON transactions(user_id, transacted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_account_date
  ON transactions(user_id, account_id, transacted_at DESC);
```

Optional for large note-search datasets:

```sql
-- Requires pg_trgm extension
CREATE INDEX IF NOT EXISTS idx_transactions_note_trgm
  ON transactions USING gin (note gin_trgm_ops);
```

### 13.7 Testing Enhancements (Release Gate)

Minimum required automated tests before release:

**API tests**
- create debit/income success
- reject invalid amount and invalid date
- reject category/type mismatch
- reverse success flow
- reverse conflict when already reversed
- reject reversing a reversal
- ownership checks for account/category/transaction

**UI/E2E smoke**
- add transaction -> appears in list
- reverse transaction -> original muted + reversal row visible
- filter and clear filter flows
- empty/no-result states render correct CTA copy
