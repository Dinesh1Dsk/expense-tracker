# Upcoming Payments Module — Complete Requirements

**Project:** Expense Tracker (Personal + Family)
**Module:** Upcoming Payments
**Version:** 1.0
**Date:** April 22, 2026
**Platform:** Android + iOS (React Native / Expo) + Hono API + PostgreSQL

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Payment Types](#2-payment-types)
3. [User Stories](#3-user-stories)
4. [User Flows](#4-user-flows)
5. [Screen Specifications](#5-screen-specifications)
   - 5.1 Upcoming Payments Tab Screen
   - 5.2 Add Payment Screen
   - 5.3 Edit Payment Screen
   - 5.4 Payment Detail Screen
   - 5.5 Mark as Paid Confirmation
   - 5.6 Home Screen — Committed Expenses Panel
6. [Component Specifications](#6-component-specifications)
7. [UX Writing](#7-ux-writing)
8. [Reminder & Notification Logic](#8-reminder--notification-logic)
9. [Backend — API Design](#9-backend--api-design)
10. [Frontend — State Management](#10-frontend--state-management)
11. [DB Schema](#11-db-schema)
12. [Business Logic Rules](#12-business-logic-rules)
13. [Error Handling](#13-error-handling)
14. [Accessibility Notes](#14-accessibility-notes)

---

## 1. Module Overview

| Field | Detail |
|-------|--------|
| Module Purpose | Track scheduled payments — EMIs, recurring bills, one-time fees. Remind users before due dates. Show committed expenses for awareness (no balance deduction). |
| Entry Points | Upcoming tab (bottom nav), Home screen committed panel (+), FAB |
| Exit Points | Home screen, Transactions screen (after mark paid) |
| Platforms | Android + iOS (React Native / Expo) |
| Auth Required | Yes — JWT Bearer token |
| Balance Impact | None — upcoming payments shown for awareness only, not deducted from balance |

**Core principle:**
Upcoming payments are **reminders + awareness**, not accounting entries. They become transactions only when user manually marks as paid (which creates a transaction). Balance is never pre-deducted.

---

## 2. Payment Types

| Type | Icon | Examples | Recurrence |
|------|------|----------|------------|
| One-time | 📅 | School fees, insurance premium, medical bill, travel booking | No recurrence |
| Recurring | 🔄 | Mobile recharge, OTT subscriptions, rent, electricity, gym | Monthly on fixed day |
| EMI | 🏦 | Home loan, car loan, personal loan, credit card EMI | Monthly, fixed months |

### Payment Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| Pending | Amber | Due in future, not yet paid |
| Due today | Orange | Due date is today |
| Overdue | Red | Past due date, not paid |
| Paid | Green | Marked as paid this cycle |

---

## 3. User Stories

### Primary — Happy Path

> As a user, I want to add my HDFC home loan EMI of ₹18,500 for 240 months so that I can track how many months I've paid and how many remain.

> As a user, I want to add my Airtel recharge of ₹599 recurring on the 28th of every month so that I never forget to recharge.

> As a user, I want to add my daughter's school fees of ₹45,000 due on April 30 as a one-time payment so that I'm reminded before the due date.

> As a user, I want to see all my upcoming payments grouped by type (EMI, Recurring, One-time) so that I can review them at a glance.

> As a user, I want to mark a payment as paid so that it moves out of pending and the next cycle generates automatically for recurring and EMI.

> As a user, I want to see a "Committed this month: ₹21,099" panel on the home screen so that I'm aware of upcoming spends.

> As a user, I want to configure reminders 3 days before due so that I get notified in time.

> As a user, I want to see an EMI progress bar showing "8 of 36 months paid" so that I know how far I am in my loan.

### Edge Cases

> As a user whose EMI is fully paid (36/36 months), I want the EMI to automatically mark as completed so that it disappears from active payments.

> As a user with an overdue payment, I want it to be clearly highlighted in red so that I take immediate action.

> As a user marking a recurring payment as paid, I want the next month's entry to auto-generate so that I don't have to re-add it every month.

> As a user, I want to skip a recurring payment for one month (e.g. no recharge needed) without deleting the recurring setup.

> As a user, I want to delete a recurring payment setup so that future reminders stop generating.

### Android-Specific

> As an Android user, I want a FAB (+) on the Upcoming screen to quickly add a new payment.

> As an Android user, I want to swipe right on a payment row to quickly mark it as paid.

### iOS-Specific

> As an iOS user, I want to swipe left on a payment row to reveal "Mark Paid" and "Delete" actions.

> As an iOS user, I want the (+) in the top-right nav bar to add a new upcoming payment.

---

## 4. User Flows

### 4.1 Add One-time Payment Flow

```
[Upcoming tab FAB (+)] or [Home panel +]
        ↓
[Add Payment Screen]
  → Select type: One-time
  → Enter payment name
  → Enter amount
  → Select category (optional)
  → Select account (optional — for awareness)
  → Set due date (date picker)
  → Set reminder days (1 / 3 / 7 / custom)
  → Note (optional)
  → Tap "Save Payment"
        ↓
  [Validation]
  ├── Name empty → error
  ├── Amount = 0 → error
  ├── No due date → error
  └── Valid → Save → Toast: "Payment added" → Back to list
```

### 4.2 Add Recurring Payment Flow

```
[Add Payment Screen]
  → Select type: Recurring
  → Enter payment name
  → Enter amount
  → Select category (optional)
  → Select account (optional)
  → Set recurrence day (1–31, day of month)
  → Set reminder days
  → Note (optional)
  → Tap "Save Payment"
        ↓
  → First due date auto-calculated:
      If today < recurrence day this month → due this month
      If today >= recurrence day → due next month
  → Save → Back to list
```

### 4.3 Add EMI Flow

```
[Add Payment Screen]
  → Select type: EMI
  → Enter loan/EMI name (e.g. "HDFC Home Loan")
  → Enter monthly EMI amount
  → Enter total months (tenure)
  → Enter months already paid (existing loan)
  → Select account (optional)
  → Set EMI due day (day of month)
  → Set reminder days
  → Note (optional)
  → Tap "Save Payment"
        ↓
  → Remaining months = total − paid
  → Next due date = next occurrence of due day
  → Save → Back to list
```

### 4.4 Mark as Paid Flow

```
[Upcoming list]
  → Swipe right [Android] / Swipe left → "Mark Paid" [iOS]
  OR tap payment row → Payment Detail → "Mark as Paid" button
        ↓
[Mark as Paid Confirmation dialog]
  → "Mark ₹[amount] [name] as paid?"
  → [Cancel] [Mark as Paid]
        ↓
  → Status: pending → paid
  → For Recurring:
      → Current entry status = paid
      → Auto-generate next month entry (same amount, next recurrence day)
  → For EMI:
      → emiPaidMonths += 1
      → If emiPaidMonths < emiTotalMonths → auto-generate next month entry
      → If emiPaidMonths = emiTotalMonths → mark EMI as "Completed"
  → For One-time:
      → Status = paid, no auto-generate
  → Toast: "[Name] marked as paid"
```

### 4.5 Skip Recurring Payment Flow

```
[Payment Detail Screen]
  → Tap "Skip this month"
        ↓
[Skip Confirmation]
  → "Skip [name] for [month]? Next reminder will be in [next month]."
  → [Cancel] [Skip]
        ↓
  → Current month entry status = skipped
  → Auto-generate next month entry
  → Toast: "Skipped for [month]"
```

### 4.6 Edit Payment Flow

```
[Payment row long press] or [Payment Detail → Edit]
        ↓
[Edit Payment Screen]
  → Pre-filled with current values
  → Can edit: name, amount, reminder days, note, account, category
  → Cannot edit: payment type (one-time/recurring/emi)
  → For EMI: can edit total months, months paid
  → Tap "Save Changes"
  → Toast: "Payment updated"
```

### 4.7 Delete Payment Flow

```
[Payment Detail → Delete] or [Swipe left → Delete (iOS)]
        ↓
  [Check: recurring or EMI?]
  ├── Yes → Dialog:
  │         "Delete '[name]' and stop all future reminders?"
  │         [Cancel] [Delete]
  └── No (one-time) → Dialog:
                       "Delete '[name]'?"
                       [Cancel] [Delete]
        ↓
  → Payment deleted (soft delete or hard delete — no transactions affected)
  → Toast: "Payment deleted"
```

---

## 5. Screen Specifications

---

### 5.1 Upcoming Payments Tab Screen

| Property | Detail |
|----------|--------|
| Purpose | View all upcoming payments grouped by type |
| Route | `/(tabs)/upcoming` |
| Access | Authenticated users |

#### Layout

**Header:**
- Android: "Upcoming Payments" + (+) FAB bottom right
- iOS: "Upcoming Payments" (centered) + (+) top right

**Month summary bar:**
- Background: light amber (#FAEEDA)
- "This month committed: ₹21,099" — amber text, centered
- Sub-label: "[X] payments pending · [Y] overdue"
- Tapping expands to show breakdown (optional)

**Grouped sections:**

**Section 1 — EMI** (header: "EMIs")
- Each row: EMI card with progress bar (see Component 6.1)
- Sorted by: due date ascending

**Section 2 — Recurring** (header: "Recurring")
- Each row: recurring payment row (see Component 6.2)
- Sorted by: due date ascending

**Section 3 — One-time** (header: "One-time")
- Each row: one-time payment row (see Component 6.3)
- Sorted by: due date ascending

**Section 4 — Paid this month** (header: "Paid", collapsed by default)
- Shows payments marked as paid this month
- Muted appearance, green checkmark

**Empty state (no payments):**
- Illustration: calendar with no events
- Heading: "No upcoming payments"
- Subtext: "Add bills, EMIs, and recurring payments to stay on top of your finances."
- CTA: "Add Payment"

---

### 5.2 Add Payment Screen

| Property | Detail |
|----------|--------|
| Purpose | Create a new upcoming payment of any type |
| Route | `/upcoming/new` |
| UI | Full screen form |
| Access | Authenticated users |

#### Layout

**Header:**
- Android: Back arrow + "Add Payment"
- iOS: "Cancel" (left) + "Add Payment" (centered) + disabled "Save" top right

**Type selector (top, prominent):**
- Three cards in a row: "One-time 📅" | "Recurring 🔄" | "EMI 🏦"
- Selected: teal border + teal background tint
- Tap to switch — form fields change based on type

---

**Fields for ALL types:**

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Payment Name | Text | Yes | e.g. School Fees, Airtel Recharge | 1–100 chars |
| Amount (₹) | Number | Yes | 0.00 | > 0, integer paise |
| Category | Picker | No | Select category | — |
| Account | Picker | No | Select account | — |
| Note | Text | No | Add a note | max 200 chars |

---

**Additional fields — One-time only:**

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Due Date | Date picker | Yes | Select date | Must be today or future |
| Reminder | Selector | Yes | 3 days before | 1 / 3 / 7 / Custom days |

**Custom reminder:** number input + "days before" label

---

**Additional fields — Recurring only:**

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Due day of month | Number | Yes | e.g. 28 | 1–31 |
| Reminder | Selector | Yes | 3 days before | 1 / 3 / 7 / Custom |

**Helper text below due day:**
"Next due: [calculated date shown here automatically]"

---

**Additional fields — EMI only:**

| Field | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| Total months (tenure) | Number | Yes | e.g. 36 | > 0 integer |
| Months already paid | Number | Yes | e.g. 0 | ≥ 0, < total months |
| EMI due day | Number | Yes | e.g. 5 | 1–31 |
| Reminder | Selector | Yes | 3 days before | 1 / 3 / 7 / Custom |

**Helper text below months:**
"Remaining: [total − paid] months · Ends: [calculated end month/year]"

---

**Bottom:**
- "Save Payment" button — full width, teal
- Disabled until required fields filled

---

### 5.3 Edit Payment Screen

Same as Add Payment Screen with:
- Header: "Edit Payment"
- Pre-filled values
- Type selector: **disabled** (cannot change type)
- Button: "Save Changes"

---

### 5.4 Payment Detail Screen

| Property | Detail |
|----------|--------|
| Purpose | View full details of an upcoming payment |
| Route | `/upcoming/:id` |
| Access | Owner only |

#### Layout

**Header:**
- Back arrow + payment name + Edit button (top right)

**Detail card:**

Top section (colored by status):
- Overdue: light red | Pending: light amber | Paid: light green
- Large icon (type icon) + Payment name + Amount (large bold)
- Status badge: "Overdue" / "Due Apr 25" / "Paid"

**Info rows:**

| Label | Value |
|-------|-------|
| Type | One-time / Recurring / EMI |
| Category | Category name + icon (if set) |
| Account | Account name (if set) |
| Due Date | Apr 25, 2026 |
| Reminder | 3 days before |
| Note | Note text or "—" |

**EMI section (EMI type only):**
- Progress bar: filled teal for paid months
- "8 of 36 months paid" label
- "28 months remaining"
- "Loan ends: Aug 2028"

**Action buttons:**
- "Mark as Paid" — primary teal button (hidden if already paid)
- "Skip this month" — secondary outlined button (recurring/EMI only)
- "Edit Payment" — outlined button
- "Delete Payment" — danger text button (bottom)

---

### 5.5 Mark as Paid Confirmation

| Element | Detail |
|---------|--------|
| Type | Bottom sheet or center dialog |
| Trigger | Swipe action or "Mark as Paid" button |

**Content:**
- Title: "Mark as Paid?"
- Body: "Mark ₹[amount] [name] as paid for [month]?"
- For recurring: "+ Next reminder set for [next date]"
- For EMI: "+ [X] months remaining after this"
- Cancel button: "Cancel"
- Confirm button: "Mark as Paid" (teal)

---

### 5.6 Home Screen — Committed Expenses Panel

| Property | Detail |
|----------|--------|
| Purpose | Show awareness of upcoming committed spends without affecting balance |
| Location | Home screen, below account cards |
| Visibility | Only shown when there are pending/overdue upcoming payments |

#### Layout

**Panel card:**
- Header row: "Upcoming this month" + "View all →" link
- Background: white card with amber left border (4px)

**Payment rows (max 3 shown):**
- Each row: payment name + due date + amount (right)
- Overdue rows: red amount + "Overdue" badge
- Due today: orange amount + "Today" badge

**Footer:**
- If more than 3: "+ [X] more payments"
- Total row: "Total committed: ₹21,099" (bold, amber)
- Sub-label: "For your awareness — not deducted from balance"

**Add button:**
- Small (+) link: "Add upcoming payment"

---

## 6. Component Specifications

### 6.1 EMI Row Card

Used on: Upcoming Payments screen (EMI section)

| Property | Detail |
|----------|--------|
| Height | 80px |
| Left | Type icon (🏦) in colored circle |
| Top row | EMI name (bold) + status badge |
| Middle | Progress bar — teal fill (paid) + gray empty (remaining) |
| Below bar | "8 / 36 months paid" (small, muted) |
| Right top | Amount (bold) |
| Right bottom | Due date |

**Status badge colors:**
| Status | Background | Text |
|--------|------------|------|
| Pending | #FAEEDA | #854F0B |
| Due today | #FEF3F2 | #991B1B |
| Overdue | #FEF2F2 | #DC2626 |
| Paid | #E1F5EE | #0F6E56 |

**Progress bar:**
- Height: 6px, border-radius: 3px
- Teal fill (#1D9E75) for paid portion
- Gray (#E5E7EB) for remaining

---

### 6.2 Recurring Payment Row

Used on: Upcoming Payments screen (Recurring section)

| Property | Detail |
|----------|--------|
| Height | 60px |
| Left | Type icon (🔄) in colored circle |
| Middle top | Payment name (bold 13px) |
| Middle bottom | "Every [day]th · [Category]" (11px muted) |
| Right top | Amount (bold, colored by status) |
| Right bottom | Due date |

**iOS swipe left:** "Mark Paid" (teal) | "Skip" (amber) | "Delete" (red)
**Android swipe right:** "Mark Paid" (teal)

---

### 6.3 One-time Payment Row

Used on: Upcoming Payments screen (One-time section)

| Property | Detail |
|----------|--------|
| Height | 60px |
| Left | Type icon (📅) in colored circle |
| Middle top | Payment name (bold) |
| Middle bottom | Category + Account (if set) |
| Right top | Amount (colored by status) |
| Right bottom | Due date |

---

### 6.4 Committed Expenses Panel Row

Used on: Home screen

| Property | Detail |
|----------|--------|
| Height | 44px |
| Left | Payment name (13px) |
| Middle | Due date (11px muted) |
| Right | Amount (13px, amber normal / red overdue) |

---

### 6.5 Reminder Selector

Used on: Add/Edit Payment Screen

| Property | Detail |
|----------|--------|
| Type | Segmented selector + custom input |
| Options | 1 day | 3 days | 7 days | Custom |
| Custom selected | Number input + "days before" label appears |
| Default | 3 days |

---

### 6.6 Type Selector Cards

Used on: Add Payment Screen

| Property | Detail |
|----------|--------|
| Layout | 3 equal cards in a row |
| Each card | Icon (24px) + type name (12px) |
| Default selected | One-time |
| Selected state | Teal border (2px) + teal tint (#E1F5EE) |

---

## 7. UX Writing

### Upcoming List Screen

| Element | Text |
|---------|------|
| Screen title | Upcoming Payments |
| Section: EMI | EMIs |
| Section: recurring | Recurring |
| Section: one-time | One-time |
| Section: paid | Paid this month |
| Summary bar | This month committed: ₹[amount] |
| Summary sub | [X] pending · [Y] overdue |
| Empty heading | No upcoming payments |
| Empty subtext | Add bills, EMIs, and recurring payments to stay on top of your finances. |
| Empty CTA | Add Payment |

### Add Payment Screen

| Element | Text |
|---------|------|
| Screen title | Add Payment |
| Type: one-time | One-time |
| Type: recurring | Recurring |
| Type: EMI | EMI |
| Name placeholder | e.g. School Fees, Airtel Recharge |
| Amount placeholder | 0.00 |
| Category placeholder | Select category (optional) |
| Account placeholder | Select account (optional) |
| Due date placeholder | Select date |
| Reminder label | Remind me |
| Reminder options | 1 day before / 3 days before / 7 days before / Custom |
| Recurrence day label | Due on day |
| Recurrence helper | Next due: [date] |
| EMI total label | Total months (tenure) |
| EMI paid label | Months already paid |
| EMI due day label | EMI due on day |
| EMI helper | Remaining: [X] months · Ends: [month year] |
| Save button | Save Payment |
| Name error | Please enter a payment name |
| Amount error | Please enter an amount |
| Due date error | Please select a due date |
| Success toast | Payment added |

### Mark as Paid

| Element | Text |
|---------|------|
| Dialog title | Mark as Paid? |
| Dialog body | Mark ₹[amount] [name] as paid for [month]? |
| Recurring note | Next reminder set for [date] |
| EMI note | [X] months remaining after this |
| Cancel | Cancel |
| Confirm | Mark as Paid |
| Success toast | [Name] marked as paid |
| EMI complete toast | [Name] fully paid — all [X] months complete! |

### Skip Payment

| Element | Text |
|---------|------|
| Dialog title | Skip this month? |
| Dialog body | Skip [name] for [month]? Next reminder will be set for [next month date]. |
| Cancel | Cancel |
| Confirm | Skip |
| Success toast | Skipped for [month] |

### Delete Payment

| Element | Text |
|---------|------|
| Recurring title | Delete recurring payment? |
| Recurring body | Delete '[name]' and stop all future reminders? |
| One-time title | Delete payment? |
| One-time body | Delete '[name]'? This cannot be undone. |
| Cancel | Cancel |
| Confirm | Delete |
| Success toast | Payment deleted |

### Home Panel

| Element | Text |
|---------|------|
| Panel title | Upcoming this month |
| View all link | View all |
| Total label | Total committed: ₹[amount] |
| Awareness note | For your awareness — not deducted from balance |
| Add link | + Add upcoming payment |
| Overdue badge | Overdue |
| Due today badge | Today |

### Notifications

| Element | Text |
|---------|------|
| Reminder title | Payment due [in X days / today] |
| Reminder body | [Name]: ₹[amount] due on [date] |
| Overdue title | Payment overdue |
| Overdue body | [Name]: ₹[amount] was due on [date] |

---

## 8. Reminder & Notification Logic

### Notification Schedule

```
When payment is created or updated:
  → Schedule push notification:
      trigger time = dueDate − reminderDays (at 9:00 AM)

If reminderDays = 3 and dueDate = Apr 25:
  → Notification fires: Apr 22 at 9:00 AM

If dueDate is today (same day):
  → Notification fires: today at 9:00 AM (or immediately if past 9 AM)
```

### Overdue Check (Cron Job)

```
Daily cron: runs at 00:01 AM every day

For each upcoming payment where:
  - status = 'pending'
  - dueDate < today

→ Update status to 'overdue'
→ Send overdue push notification
```

### Auto-generate Next Cycle (on Mark Paid)

```
On marking recurring payment as paid:
  currentEntry.status = 'paid'

  nextDueDate = next occurrence of recurrenceDay:
    if today < recurrenceDay this month → same month
    else → next month

  INSERT new upcoming_payment {
    ...same fields as current,
    dueDate: nextDueDate,
    status: 'pending',
    parentId: originalId  // links back to recurring setup
  }

On marking EMI as paid:
  emiPaidMonths += 1

  if emiPaidMonths < emiTotalMonths:
    → Generate next month entry (same as recurring logic)
  else:
    → Mark overall EMI as 'completed'
    → Send completion notification: "🎉 [Name] fully paid!"
```

### Push Token Registration

```
On login → register Expo push token:
  POST /notifications/token { expoPushToken: string }
  → Stored in users table or push_tokens table
```

---

## 9. Backend — API Design

### 9.1 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/upcoming-payments` | Yes | List all grouped + monthly committed total |
| POST | `/api/v1/upcoming-payments` | Yes | Create new payment |
| GET | `/api/v1/upcoming-payments/:id` | Yes | Get single payment detail |
| PATCH | `/api/v1/upcoming-payments/:id` | Yes | Edit payment |
| PATCH | `/api/v1/upcoming-payments/:id/mark-paid` | Yes | Mark as paid + auto-generate next |
| PATCH | `/api/v1/upcoming-payments/:id/skip` | Yes | Skip this month cycle |
| DELETE | `/api/v1/upcoming-payments/:id` | Yes | Delete payment |
| GET | `/api/v1/upcoming-payments/home-summary` | Yes | Home panel data (top 3 + total) |

---

### 9.2 Request / Response Schemas

#### POST /upcoming-payments — Create

**Request:**
```json
{
  "name": "Airtel Recharge",
  "amount": 59900,
  "type": "recurring",
  "categoryId": "uuid or null",
  "accountId": "uuid or null",
  "note": "Unlimited 84 days",
  "reminderDays": 3,
  "recurrenceDay": 28,
  "dueDate": null,
  "emiTotalMonths": null,
  "emiPaidMonths": null
}
```

**Validation:**

| Field | Rule |
|-------|------|
| name | Required, 1–100 chars |
| amount | Required, integer > 0 (paise) |
| type | Required, enum: one_time / recurring / emi |
| dueDate | Required if type = one_time, ISO datetime, today or future |
| recurrenceDay | Required if type = recurring or emi, 1–31 |
| emiTotalMonths | Required if type = emi, > 0 |
| emiPaidMonths | Required if type = emi, ≥ 0, < emiTotalMonths |
| reminderDays | Required, 1–30 |

**Response 201:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Airtel Recharge",
  "amount": 59900,
  "type": "recurring",
  "status": "pending",
  "dueDate": "2026-04-28T00:00:00.000Z",
  "recurrenceDay": 28,
  "reminderDays": 3,
  "emiTotalMonths": null,
  "emiPaidMonths": null,
  "createdAt": "2026-04-22T10:00:00.000Z"
}
```

---

#### GET /upcoming-payments — List

**Query params:**
| Param | Default | Description |
|-------|---------|-------------|
| month | current | YYYY-MM format |
| type | null | one_time / recurring / emi |
| status | null | pending / overdue / paid |

**Response 200:**
```json
{
  "emis": [...],
  "recurring": [...],
  "onetime": [...],
  "paid": [...],
  "summary": {
    "totalCommitted": 2109900,
    "pendingCount": 4,
    "overdueCount": 1
  }
}
```

---

#### PATCH /upcoming-payments/:id/mark-paid

**Request:** no body

**Server logic:**
```ts
1. Fetch payment by id, verify ownership
2. If status = 'paid' → 400: "Already paid"
3. Update status = 'paid'
4. If type = 'recurring':
   → Calculate nextDueDate (next occurrence of recurrenceDay)
   → INSERT new upcoming_payment (clone with new dueDate, status: pending)
5. If type = 'emi':
   → emiPaidMonths += 1
   → If emiPaidMonths < emiTotalMonths:
       → INSERT next month EMI entry
   → Else:
       → Mark as 'completed', send completion notification
6. Return { updated: payment, next: nextEntry | null }
```

**Response 200:**
```json
{
  "updated": { "id": "uuid", "status": "paid", ... },
  "next": { "id": "uuid", "dueDate": "2026-05-28T00:00:00.000Z", ... }
}
```

---

#### GET /upcoming-payments/home-summary

**Response 200:**
```json
{
  "topPayments": [
    { "id": "uuid", "name": "School Fees", "amount": 850000, "dueDate": "2026-04-25T00:00:00.000Z", "status": "pending" },
    { "id": "uuid", "name": "HDFC EMI", "amount": 1850000, "dueDate": "2026-04-30T00:00:00.000Z", "status": "overdue" },
    { "id": "uuid", "name": "Airtel Recharge", "amount": 59900, "dueDate": "2026-04-28T00:00:00.000Z", "status": "pending" }
  ],
  "totalCount": 5,
  "totalCommitted": 4109900,
  "overdueCount": 1
}
```

---

### 9.3 Full Router Implementation

```ts
// apps/api/src/modules/upcoming-payments/upcoming-payments.router.ts

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { CreateUpcomingPaymentSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { upcomingPayments } from '../../db/schema.js'
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm'
import { addMonths, setDate, startOfDay } from 'date-fns'

export const upcomingPaymentsRouter = new Hono()
upcomingPaymentsRouter.use('*', authMiddleware)

// GET /upcoming-payments
upcomingPaymentsRouter.get('/', async (c) => {
  const userId = c.get('userId')

  const all = await db.query.upcomingPayments.findMany({
    where: eq(upcomingPayments.userId, userId),
    orderBy: (u, { asc }) => asc(u.dueDate),
    with: { category: true, account: true },
  })

  const emis = all.filter(p => p.type === 'emi' && p.status !== 'paid')
  const recurring = all.filter(p => p.type === 'recurring' && p.status !== 'paid')
  const onetime = all.filter(p => p.type === 'one_time' && p.status !== 'paid')
  const paid = all.filter(p => p.status === 'paid')

  const totalCommitted = all
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0)

  const overdueCount = all.filter(p => p.status === 'overdue').length

  return c.json({
    emis, recurring, onetime, paid,
    summary: { totalCommitted, pendingCount: all.filter(p => p.status === 'pending').length, overdueCount }
  })
})

// POST /upcoming-payments
upcomingPaymentsRouter.post('/', zValidator('json', CreateUpcomingPaymentSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  let dueDate: Date

  if (body.type === 'one_time') {
    dueDate = new Date(body.dueDate!)
  } else {
    const day = body.recurrenceDay!
    const now = new Date()
    const thisMonth = setDate(now, day)
    dueDate = thisMonth > now ? thisMonth : setDate(addMonths(now, 1), day)
  }

  const [payment] = await db.insert(upcomingPayments).values({
    ...body,
    userId,
    dueDate,
    status: 'pending',
  }).returning()

  return c.json(payment, 201)
})

// GET /upcoming-payments/home-summary
upcomingPaymentsRouter.get('/home-summary', async (c) => {
  const userId = c.get('userId')

  const pending = await db.query.upcomingPayments.findMany({
    where: and(
      eq(upcomingPayments.userId, userId),
      inArray(upcomingPayments.status, ['pending', 'overdue'])
    ),
    orderBy: (u, { asc }) => asc(u.dueDate),
    limit: 3,
  })

  const all = await db.query.upcomingPayments.findMany({
    where: and(
      eq(upcomingPayments.userId, userId),
      inArray(upcomingPayments.status, ['pending', 'overdue'])
    ),
  })

  const totalCommitted = all.reduce((sum, p) => sum + p.amount, 0)
  const overdueCount = all.filter(p => p.status === 'overdue').length

  return c.json({
    topPayments: pending,
    totalCount: all.length,
    totalCommitted,
    overdueCount,
  })
})

// PATCH /upcoming-payments/:id/mark-paid
upcomingPaymentsRouter.patch('/:id/mark-paid', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId))
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.status === 'paid') return c.json({ error: 'Already paid' }, 400)

  const [updated] = await db
    .update(upcomingPayments)
    .set({ status: 'paid' })
    .where(eq(upcomingPayments.id, id))
    .returning()

  let next = null

  if (payment.type === 'recurring') {
    const day = payment.recurrenceDay!
    const nextDue = setDate(addMonths(new Date(), 1), day)
    const [nextEntry] = await db.insert(upcomingPayments).values({
      userId,
      name: payment.name,
      amount: payment.amount,
      type: 'recurring',
      status: 'pending',
      dueDate: nextDue,
      recurrenceDay: day,
      reminderDays: payment.reminderDays,
      accountId: payment.accountId,
      categoryId: payment.categoryId,
      note: payment.note,
    }).returning()
    next = nextEntry
  }

  if (payment.type === 'emi') {
    const newPaid = (payment.emiPaidMonths ?? 0) + 1
    await db.update(upcomingPayments).set({ emiPaidMonths: newPaid }).where(eq(upcomingPayments.id, id))

    if (newPaid < (payment.emiTotalMonths ?? 0)) {
      const day = payment.recurrenceDay!
      const nextDue = setDate(addMonths(new Date(), 1), day)
      const [nextEntry] = await db.insert(upcomingPayments).values({
        userId,
        name: payment.name,
        amount: payment.amount,
        type: 'emi',
        status: 'pending',
        dueDate: nextDue,
        recurrenceDay: day,
        reminderDays: payment.reminderDays,
        emiTotalMonths: payment.emiTotalMonths,
        emiPaidMonths: newPaid,
        accountId: payment.accountId,
        categoryId: payment.categoryId,
        note: payment.note,
      }).returning()
      next = nextEntry
    }
  }

  return c.json({ updated, next })
})

// PATCH /upcoming-payments/:id/skip
upcomingPaymentsRouter.patch('/:id/skip', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId))
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.type === 'one_time') return c.json({ error: 'Cannot skip one-time payments' }, 400)

  const [updated] = await db
    .update(upcomingPayments)
    .set({ status: 'skipped' as any })
    .where(eq(upcomingPayments.id, id))
    .returning()

  const day = payment.recurrenceDay!
  const nextDue = setDate(addMonths(new Date(), 1), day)
  const [next] = await db.insert(upcomingPayments).values({
    userId,
    name: payment.name,
    amount: payment.amount,
    type: payment.type,
    status: 'pending',
    dueDate: nextDue,
    recurrenceDay: day,
    reminderDays: payment.reminderDays,
    emiTotalMonths: payment.emiTotalMonths,
    emiPaidMonths: payment.emiPaidMonths,
    accountId: payment.accountId,
    categoryId: payment.categoryId,
    note: payment.note,
  }).returning()

  return c.json({ updated, next })
})

// DELETE /upcoming-payments/:id
upcomingPaymentsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId))
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)

  await db.delete(upcomingPayments).where(eq(upcomingPayments.id, id))

  return c.json({ deleted: true })
})
```

---

## 10. Frontend — State Management

### 10.1 Zustand Store

```ts
// apps/mobile/src/stores/upcomingPayment.store.ts

import { create } from 'zustand'
import { apiRequest } from '../api/client'

interface UpcomingPayment {
  id: string
  name: string
  amount: number
  type: 'one_time' | 'recurring' | 'emi'
  status: 'pending' | 'overdue' | 'paid'
  dueDate: string
  recurrenceDay: number | null
  reminderDays: number
  emiTotalMonths: number | null
  emiPaidMonths: number | null
  category?: { id: string; name: string; icon: string; color: string } | null
  account?: { id: string; name: string; type: string } | null
  note: string | null
}

interface UpcomingState {
  emis: UpcomingPayment[]
  recurring: UpcomingPayment[]
  onetime: UpcomingPayment[]
  paid: UpcomingPayment[]
  summary: { totalCommitted: number; pendingCount: number; overdueCount: number }
  homeSummary: { topPayments: UpcomingPayment[]; totalCount: number; totalCommitted: number; overdueCount: number }
  isLoading: boolean

  fetchPayments: () => Promise<void>
  fetchHomeSummary: () => Promise<void>
  createPayment: (data: any) => Promise<void>
  markAsPaid: (id: string) => Promise<void>
  skipPayment: (id: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

export const useUpcomingStore = create<UpcomingState>((set, get) => ({
  emis: [], recurring: [], onetime: [], paid: [],
  summary: { totalCommitted: 0, pendingCount: 0, overdueCount: 0 },
  homeSummary: { topPayments: [], totalCount: 0, totalCommitted: 0, overdueCount: 0 },
  isLoading: false,

  fetchPayments: async () => {
    set({ isLoading: true })
    const res = await apiRequest<any>('/upcoming-payments')
    set({ ...res, isLoading: false })
  },

  fetchHomeSummary: async () => {
    const res = await apiRequest<any>('/upcoming-payments/home-summary')
    set({ homeSummary: res })
  },

  createPayment: async (data) => {
    await apiRequest('/upcoming-payments', { method: 'POST', body: JSON.stringify(data) })
    await get().fetchPayments()
    await get().fetchHomeSummary()
  },

  markAsPaid: async (id) => {
    await apiRequest(`/upcoming-payments/${id}/mark-paid`, { method: 'PATCH' })
    await get().fetchPayments()
    await get().fetchHomeSummary()
  },

  skipPayment: async (id) => {
    await apiRequest(`/upcoming-payments/${id}/skip`, { method: 'PATCH' })
    await get().fetchPayments()
  },

  deletePayment: async (id) => {
    await apiRequest(`/upcoming-payments/${id}`, { method: 'DELETE' })
    await get().fetchPayments()
    await get().fetchHomeSummary()
  },
}))
```

---

## 11. DB Schema

### Schema Updates Needed

Add `reminderDays` and `recurrenceDay` fields (some may already exist):

```ts
// apps/api/src/db/schema.ts — update upcoming_payments table

export const upcomingPayments = pgTable('upcoming_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  type: upcomingPaymentTypeEnum('type').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: upcomingPaymentStatusEnum('status').notNull().default('pending'),
  accountId: uuid('account_id').references(() => accounts.id),
  categoryId: uuid('category_id').references(() => categories.id),
  recurrenceDay: integer('recurrence_day'),       // 1–31, for recurring + EMI
  reminderDays: integer('reminder_days').notNull().default(3),
  emiTotalMonths: integer('emi_total_months'),
  emiPaidMonths: integer('emi_paid_months').default(0),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Update enum to add 'skipped' status:**
```sql
ALTER TYPE upcoming_payment_status ADD VALUE 'skipped';
ALTER TYPE upcoming_payment_status ADD VALUE 'completed';
```

**Indexes:**
```sql
CREATE INDEX idx_upcoming_user_status ON upcoming_payments(user_id, status);
CREATE INDEX idx_upcoming_due_date ON upcoming_payments(due_date) WHERE status IN ('pending', 'overdue');
```

---

## 12. Business Logic Rules

### Amount Rules
- Stored as integer paise, always positive
- Displayed as ₹XX,XXX using `formatINR()`
- No balance deduction — awareness only

### Status Transitions
```
pending → paid (mark as paid)
pending → overdue (cron job, past due date)
pending → skipped (skip action, recurring/EMI only)
overdue → paid (mark as paid even when overdue)
paid → (terminal, no further transitions)
completed → (terminal, EMI fully paid)
```

### Recurring Auto-generate Rules
- On mark paid: always generate next month entry
- Next due date = next occurrence of `recurrenceDay`
- If today is before recurrenceDay this month → same month
- If today is on/after recurrenceDay → next month
- Skipped months: still generate next month entry (skip doesn't stop recurrence)

### EMI Rules
- `emiPaidMonths` increments on each mark paid
- `emiTotalMonths` − `emiPaidMonths` = remaining
- When `emiPaidMonths === emiTotalMonths` → status = 'completed', no next entry generated
- Progress % = `emiPaidMonths / emiTotalMonths × 100`
- End date = creation month + `emiTotalMonths` months

### Reminder Rules
- Notification scheduled at creation time
- Reschedule when payment edited (new due date or reminder days)
- Cancel notification when payment deleted or marked paid
- Send overdue notification if not paid by due date (cron at 00:01 AM)

### Home Panel Rules
- Show max 3 upcoming payments (sorted by due date)
- Show total committed amount (sum of all pending + overdue)
- Only show panel if there are pending/overdue payments
- Overdue payments shown in red
- "Due today" payments shown in orange

---

## 13. Error Handling

### API Errors

| Scenario | Status | Message |
|----------|--------|---------|
| Payment not found | 404 | "Payment not found" |
| Already paid | 400 | "Already paid" |
| Skip one-time payment | 400 | "Cannot skip one-time payments" |
| Invalid recurrence day | 422 | "Recurrence day must be between 1 and 31" |
| EMI paid months ≥ total | 422 | "Months already paid cannot exceed total months" |
| Past due date for one-time | 422 | "Due date must be today or in the future" |

### Mobile Error Handling

```tsx
const handleMarkPaid = async (id: string) => {
  try {
    await markAsPaid(id)
    Toast.show({ text: 'Marked as paid', type: 'success' })
  } catch (e: any) {
    Toast.show({ text: e.message ?? 'Failed to update', type: 'error' })
  }
}
```

---

## 14. Accessibility Notes

| Requirement | Detail |
|-------------|--------|
| Payment row | Label: "[Name], ₹[amount], due [date], [status]" |
| EMI progress bar | Accessible label: "[X] of [Y] months paid, [Z]% complete" |
| Status badge | Announces status change when updated |
| Swipe actions | Alternative: long press menu with keyboard accessible options |
| Mark paid button | Label: "Mark [name] as paid" |
| Skip button | Label: "Skip [name] for this month" |
| Type selector | Announces: "[Type] selected" on selection |
| Reminder selector | Label: "Remind me [X] days before due date" |
| Due date picker | Label: "Select due date" |
| Home panel | Announces: "[X] upcoming payments, total ₹[amount]" |
| Overdue items | Screen reader priority: announce overdue status prominently |
| Touch targets | All rows and buttons minimum 44×44pt |
| iOS | Support Dynamic Type |
| Android | TalkBack content descriptions on all interactive elements |

---

## 15. Implementation Enhancements (Recommended)

This section standardizes release-quality implementation details for Upcoming Payments across backend, mobile, data integrity, and QA.

### 15.1 MVP vs Phase-2 Scope

**MVP (must ship):**
- Full CRUD for one-time, recurring, and EMI upcoming payments
- Deterministic status model: `pending | overdue | paid`
- Mark-as-paid flow with next-cycle generation for recurring/EMI
- Skip flow for recurring/EMI (non-destructive)
- Home summary endpoint with top items + total committed
- Reminder scheduling + overdue daily job
- Awareness-only principle enforced (no automatic balance deduction)

**Phase-2 (after stabilization):**
- Dedicated series model for recurring/EMI plans (`series` + `entries`)
- Family-scope upcoming payments
- Advanced reminder templates and quiet hours
- Rich recurring controls (pause, resume, custom skip patterns)

---

### 15.2 Data Model Hardening (Series vs Entry)

To avoid lifecycle ambiguity, recurring and EMI should eventually use:
- **Series table** (master plan metadata)
  - type, amount, recurrenceDay, reminderDays, emiTotalMonths, emiPaidMonths, active/completed
- **Entry table** (actual due instances)
  - dueDate, status, paidAt, skippedAt, sourceSeriesId

MVP may keep a single-table model, but must enforce strict constraints so each cycle stays consistent.

---

### 15.3 Idempotency and Duplicate Prevention

Mark-paid and skip flows must be idempotent:
- Use DB transaction for:
  1) update current row status
  2) create next cycle row (if needed)
- Prevent duplicate future rows with unique cycle key:
  - e.g. `(user_id, parent_id_or_series_id, due_date)` unique index
- Repeated mark-paid requests should return success without duplicate generation.

---

### 15.4 Timezone and Date Semantics (Critical)

Define a single timezone policy for all due/reminder logic:
- User timezone (preferred) or fixed business timezone (`Asia/Kolkata`)
- Apply same policy to:
  - due-today/overdue classification
  - reminder trigger times
  - overdue cron transition
  - next-cycle due-date generation

Without this, due statuses and reminders will drift for cross-timezone usage.

---

### 15.5 Status Lifecycle Contract

Document transitions as strict state machine:
- `pending -> paid`
- `pending -> overdue`
- `pending -> skipped` (recurring/EMI only)
- `overdue -> paid`
- `paid/skipped` are terminal for that entry

If adding `completed` status for EMI, define whether it belongs to:
- series-level status (preferred), or
- final entry status (less clear)

Use one approach consistently.

---

### 15.6 Validation and Constraint Rules

Enforce at API + DB levels:
- `amount > 0`
- `name` length 1–100
- `reminderDays` between 1 and 30
- `recurrenceDay` between 1 and 31 for recurring/EMI
- EMI:
  - `emiTotalMonths > 0`
  - `emiPaidMonths >= 0`
  - `emiPaidMonths < emiTotalMonths`
- one-time due date must be today/future in chosen timezone

Add DB checks where feasible to prevent invalid writes from bypassing API.

---

### 15.7 Performance and Query Indexing

Add/verify indexes:
- `(user_id, status, due_date)` for list/home summary
- partial index on active states:
  - `WHERE status IN ('pending','overdue')`
- `(user_id, type, due_date)` for grouped section queries
- `(due_date, status)` for overdue cron scan

Keep list queries ordered by `dueDate ASC, id ASC` for deterministic output.

---

### 15.8 Reminder Job Reliability

Background jobs should be safe under retries:
- reminder schedule updates should cancel/replace prior job IDs
- overdue cron must be idempotent
- avoid duplicate push sends with notification event table:
  - unique `(paymentId, notificationType, dueDate)`

If app is offline or push token missing, preserve retry visibility through logs/queue.

---

### 15.9 Home Summary Contract

Standardize output behavior:
- show only pending/overdue entries
- capped top list sorted by nearest due date
- include deterministic fields for badges:
  - `isDueToday`, `isOverdue`
- keep `totalCommitted` as awareness metric only
- never mutate account balances from upcoming module.

---

### 15.10 QA and Release Gate

Minimum test coverage before release:
- Unit:
  - due-date generation (month-end, leap year, day 29/30/31)
  - EMI remaining/progress math
  - timezone-sensitive due classification
- Integration/API:
  - mark-paid idempotency under double request
  - skip flow behavior
  - duplicate prevention for recurring/EMI next cycles
  - overdue cron transition correctness
  - reminder schedule update/cancel behavior
- Mobile UAT:
  - create/edit/delete all 3 types
  - grouped list rendering + paid collapse behavior
  - swipe actions parity iOS/Android
  - home panel rendering and CTA navigation
  - accessibility labels and touch target checks
