# Budget Module — Complete Requirements

**Project:** Expense Tracker (Personal + Family)
**Module:** Budget
**Version:** 1.0
**Date:** April 22, 2026
**Platform:** Android + iOS (React Native / Expo) + Hono API + PostgreSQL

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [User Stories](#2-user-stories)
3. [User Flows](#3-user-flows)
4. [Screen Specifications](#4-screen-specifications)
   - 4.1 Budget Tab Screen
   - 4.2 Set Budget Screen
   - 4.3 Budget Detail Screen
   - 4.4 Home Screen — Budget Summary Card
   - 4.5 Month Rollover Dialog
5. [Component Specifications](#5-component-specifications)
6. [UX Writing](#6-ux-writing)
7. [Backend — API Design](#7-backend--api-design)
   - 7.1 API Routes
   - 7.2 Request / Response Schemas
   - 7.3 Burn Rate Calculation Logic
   - 7.4 Full Router Implementation
8. [Frontend — State Management](#8-frontend--state-management)
9. [DB Schema](#9-db-schema)
10. [Business Logic Rules](#10-business-logic-rules)
11. [Error Handling](#11-error-handling)
12. [Accessibility Notes](#12-accessibility-notes)

---

## 1. Module Overview

| Field | Detail |
|-------|--------|
| Module Purpose | Set and track monthly spending budgets at overall and category level with daily/weekly sub-limits. Show burn rate, projection, and suggested daily spend. |
| Entry Points | Budget tab (full detail), Home screen summary card |
| Exit Points | Transactions screen (filtered by category), Alerts settings |
| Platforms | Android + iOS (React Native / Expo) |
| Auth Required | Yes — JWT Bearer token |
| Scope | Personal budget + Family shared budget (separate) |

**Budget tiers:**
```
Tier 1 — Overall monthly limit       e.g. ₹30,000/month total
Tier 2 — Category monthly limit      e.g. ₹8,000/month for Food
Tier 3 — Category daily sub-limit    e.g. ₹300/day for Food
          Category weekly sub-limit  e.g. ₹2,000/week for Food
```

**Burn rate display (all 3):**
```
Burn rate:       "Spending ₹1,383/day avg"
Projection:      "At this pace → ₹42,000 by month end ⚠️"
                 OR "On track → ₹28,000 by month end ✅"
Suggested daily: "Spend max ₹1,950/day to stay within budget"
```

**Alerts:**
- 80% of any limit reached → warning push notification
- 100% exceeded → alert push notification

**Monthly rollover:**
- Start of new month → ask user: "Copy last month's budget?" or "Start fresh"

---

## 2. User Stories

### Primary — Happy Path

> As a user, I want to set an overall monthly budget of ₹30,000 so that I have a total spending limit for the month.

> As a user, I want to set a category limit of ₹8,000 for Food & Dining so that I can control my food spending separately.

> As a user, I want to see my burn rate and projection so that I know if I'm on track to stay within budget this month.

> As a user, I want to see the suggested daily spend so that I know how much I can spend per day for the rest of the month.

> As a user, I want to set a daily limit of ₹300 for Food so that I don't overspend on food on any single day.

> As a user, I want to be notified when I reach 80% of my budget so that I can slow down spending before exceeding it.

> As a user, at the start of a new month, I want to be asked if I want to copy last month's budget so that I don't have to re-enter everything.

> As a user, I want to see a family shared budget dashboard so that my household spending is tracked collectively.

### Edge Cases

> As a user with no budget set, I want a clear empty state prompting me to set a budget so that I understand the feature.

> As a user who has exceeded a category budget, I want to see it clearly marked in red with the overspend amount so that I take action.

> As a user, I want to delete a category budget limit without affecting my transactions so that I can remove limits I no longer need.

> As a user in a family, I want personal and family budgets kept completely separate so that I don't confuse household limits with my personal limits.

### Android-Specific

> As an Android user, I want a FAB (+) on the Budget screen to quickly set a new budget limit.

> As an Android user, I want to long-press a budget card to reveal Edit and Delete options.

### iOS-Specific

> As an iOS user, I want to swipe left on a budget row to reveal Edit and Delete actions.

> As an iOS user, I want a (+) in the navigation bar to add a new budget limit.

---

## 3. User Flows

### 3.1 Set Overall Budget Flow

```
Budget Tab
  → No budget set → Empty state → "Set Budget" CTA
  OR
  → FAB (+) [Android] / (+) nav bar [iOS]
  → Set Budget Screen
      → Toggle: Personal | Family
      → Type: Overall (default selected)
      → Enter monthly limit (₹ amount)
      → Toggle daily/weekly sub-limits ON (optional)
          → Enter daily limit
          → Enter weekly limit
      → Tap "Save Budget"
          ↓
  [API: POST /budgets (upsert)]
  ├── Error → Toast: "Failed to save. Try again."
  └── Success →
        → Toast: "Budget set"
        → Budget tab refreshes
        → Home screen budget card updates
```

### 3.2 Set Category Budget Flow

```
Budget Tab
  → Tap "+ Add category limit"
  OR FAB (+) → select "Category limit"
  → Set Budget Screen
      → Type: Category (selected)
      → Category picker → select category
      → Enter monthly limit
      → Toggle daily limit ON (optional) → enter amount
      → Toggle weekly limit ON (optional) → enter amount
      → Tap "Save Budget"
  → Category budget card appears in list
```

### 3.3 View Budget Progress Flow

```
Budget Tab (default: current month)
  → Overall budget card (top):
      → Spent / Limit progress bar
      → Burn rate + projection + suggested daily
  → Category budget cards (list below):
      → Each card: category icon + name + progress bar + spent/limit
      → Tap card → Budget Detail Screen
          → Full breakdown: daily/weekly sub-limits
          → Recent transactions for this category
          → "View all transactions" link
```

### 3.4 Month Rollover Flow

```
[User opens app on 1st of new month]
  → Check: does previous month budget exist?
  ├── No → No dialog, show empty state
  └── Yes →
        → Month Rollover Dialog appears
            → "New month! Copy April's budget to May?"
            → [Start Fresh] [Copy Budget]
                ↓
        [Copy Budget]
          → API: POST /budgets/rollover
          → All budget limits copied to new month
          → Toast: "Budget copied from April"
          → Budget tab shows new month's limits
                ↓
        [Start Fresh]
          → Dialog closes
          → Empty state for new month
```

### 3.5 Edit Budget Flow

```
Budget card
  → Long press [Android] / Swipe left [iOS] → Edit
  OR Tap card → Budget Detail → Edit button
  → Set Budget Screen (pre-filled)
  → Modify amounts
  → Tap "Save Changes"
  → Toast: "Budget updated"
```

### 3.6 Delete Budget Flow

```
Budget card
  → Long press [Android] / Swipe left [iOS] → Delete
  → Confirmation: "Remove this budget limit? Transactions won't be affected."
  → [Cancel] [Remove]
  → Toast: "Budget limit removed"
```

### 3.7 Family Budget Flow

```
Budget Tab
  → Toggle: Personal | Family (top of screen)
  → Family tab:
      → Family overall budget card
      → Category budgets (shared for all family members)
      → Each member's contribution shown per category
  → Set family budget: same flow as personal
      → Only family owner can set family budgets
      → Members can view but not edit family budget
```

---

## 4. Screen Specifications

---

### 4.1 Budget Tab Screen

| Property | Detail |
|----------|--------|
| Purpose | Full budget overview — overall + category limits with burn rate |
| Route | `/(tabs)/budget` |
| Access | Authenticated users |

#### Layout

**Header:**
- Android: "Budget" title + (+) FAB bottom right
- iOS: "Budget" (centered) + (+) top right

**Personal / Family toggle:**
- Segmented control: "Personal" | "Family"
- Default: Personal
- Family visible only if user is in a family space

**Month selector:**
- Left/right arrows + "April 2026" center
- Tap month text → month picker

**Overall Budget card (top, full width):**
- See Component 5.1

**Category limits section:**
- Section header: "Category Limits" + "+ Add limit" link
- List of category budget cards (see Component 5.2)
- Each card tappable → Budget Detail Screen

**Empty state (no budget set):**
- Icon: wallet with progress bar illustration
- Heading: "No budget set for April"
- Subtext: "Set a monthly limit to start tracking your spending."
- CTA: "Set Budget"

**Empty category limits (overall set but no category limits):**
- Muted row: "+ Add category limit to track specific spending"

---

### 4.2 Set Budget Screen

| Property | Detail |
|----------|--------|
| Purpose | Create or edit a budget limit |
| Route | `/budget/set` or `/budget/:id/edit` |
| UI | Full screen form |
| Access | Authenticated users (family budget: owner only) |

#### Layout

**Header:**
- Android: Back arrow + "Set Budget" / "Edit Budget"
- iOS: "Cancel" (left) + "Set Budget" (centered) + "Save" (right, disabled until valid)

**Form:**

**Field 1 — Budget type (required)**
- Segmented: "Overall" | "Category"
- If editing: disabled (cannot change type)

**Field 2 — Category (shown only when type = Category)**
- Label: "Category"
- Tap to open category picker
- Shows parent categories only (no subcategories for budget)
- Error: "Please select a category"

**Field 3 — Monthly limit (required)**
- Label: "Monthly limit"
- ₹ prefix + numeric input
- Placeholder: "e.g. 8,000"
- Error: "Please enter a valid amount"

**Field 4 — Daily limit (optional toggle)**
- Toggle row: "Set daily limit" + switch (off by default)
- When ON: ₹ input appears below
- Placeholder: "e.g. 300"
- Hint: "Alert when daily spend exceeds this amount"

**Field 5 — Weekly limit (optional toggle)**
- Toggle row: "Set weekly limit" + switch (off by default)
- When ON: ₹ input appears below
- Placeholder: "e.g. 2,000"

**Validation hint (when both monthly + daily set):**
- Muted text: "Daily limit × 30 = ₹9,000 — higher than monthly limit ₹8,000"
- Warning, not blocking

**Bottom:**
- "Save Budget" button (full width, teal)
- Disabled until: type selected + monthly limit filled (+ category if type = Category)

---

### 4.3 Budget Detail Screen

| Property | Detail |
|----------|--------|
| Purpose | Full breakdown of one category budget with sub-limits and recent transactions |
| Route | `/budget/:id` |
| Access | Owner only |

#### Layout

**Header:**
- Android: Back arrow + category name
- iOS: Back chevron + category name (centered) + "Edit" top right

**Budget summary card:**
- Category icon (large, colored) + name
- Monthly: spent / limit + progress bar + % used
- Daily: today's spend / daily limit (if set) + mini progress bar
- Weekly: this week's spend / weekly limit (if set) + mini progress bar
- Burn rate section: all 3 metrics (burn rate + projection + suggested daily)

**Transactions section:**
- Header: "Transactions this month" + "View all" link
- Last 5 transactions for this category
- Tap row → Transaction Detail Screen

**Action buttons:**
- "Edit Budget" — secondary outlined
- "Remove Budget" — danger text button

---

### 4.4 Home Screen — Budget Summary Card

| Property | Detail |
|----------|--------|
| Purpose | Quick budget health check on home screen |
| Location | Home screen, below accounts section |

#### Layout

**Card content:**
- Header: "Budget — April" + "Details" link (→ Budget tab)
- Overall: progress bar (full width) + "₹12,450 of ₹30,000 (41%)"
- Burn rate line: "Spending ₹1,383/day · On track ✅" OR "⚠️ At risk of overspend"
- Suggested daily: "Max ₹1,950/day remaining"

**States:**

| State | Indicator |
|-------|-----------|
| Under 80% | Teal progress bar, green "On track" |
| 80–99% | Amber progress bar, amber "⚠️ Slow down" |
| 100%+ exceeded | Red progress bar, red "Budget exceeded" |
| No budget set | Muted card, "Set a budget →" CTA |

---

### 4.5 Month Rollover Dialog

| Property | Detail |
|----------|--------|
| Trigger | User opens app on 1st of new month, previous month budget exists |
| Type | Center modal dialog |
| Frequency | Once per month (dismissed state saved locally) |

#### Content

- Icon: calendar with arrow
- Title: "New month — May 2026"
- Body: "You had a budget set for April. Would you like to copy it to May?"
- Previous budget summary: "₹30,000 overall · 5 category limits"
- Button 1: "Start Fresh" (secondary)
- Button 2: "Copy Budget" (primary teal)

---

## 5. Component Specifications

### 5.1 Overall Budget Card

Used on: Budget Tab Screen, Home Screen

| Property | Detail |
|----------|--------|
| Type | Full-width card |
| Background | White with teal left border (4px) |

**Content rows:**

```
[Overall Budget — April 2026]

Spent          ₹12,450
Limit          ₹30,000
Progress bar   ████████░░░░░░░  41%

─────────────────────────────
Burn rate      ₹1,383/day avg
Projection     ₹41,490 by Apr 30  ⚠️
Suggested      Max ₹1,950/day to stay on track
─────────────────────────────
Days left      9 days remaining
```

**Progress bar states:**

| Usage % | Bar color | Status label |
|---------|-----------|--------------|
| 0–79% | #1D9E75 teal | "On track" |
| 80–99% | #BA7517 amber | "Slow down" |
| 100%+ | #E24B4A red | "Exceeded by ₹X,XXX" |

---

### 5.2 Category Budget Card

Used on: Budget Tab Screen

| Property | Detail |
|----------|--------|
| Height | 72px |
| Left | Category icon circle (36px, colored) |
| Content | Category name (13px bold) + "₹X,XXX of ₹X,XXX" (11px muted) |
| Right | % label (13px bold, colored) |
| Bottom | Progress bar (full width of card) |

**Sub-limit indicators (small pills below progress bar):**
- "Daily: ₹280/₹300" (green if under, red if over)
- "Weekly: ₹1,800/₹2,000" (green if under, red if over)
- Only shown if daily/weekly limits are set

**States:**

| State | Bar color | % color |
|-------|-----------|---------|
| < 80% | Teal | #1D9E75 |
| 80–99% | Amber | #BA7517 |
| 100%+ | Red | #E24B4A |
| Exceeded | Red + "Exceeded" badge | #E24B4A |

---

### 5.3 Burn Rate Section

Used on: Overall Budget Card, Budget Detail Screen

| Row | Content | Color |
|-----|---------|-------|
| Burn rate | "₹1,383/day avg" | #6B7280 |
| Projection (on track) | "On track — ₹28,000 by Apr 30 ✅" | #1D9E75 |
| Projection (at risk) | "At this pace → ₹42,000 by Apr 30 ⚠️" | #BA7517 |
| Projection (exceeded) | "Already exceeded budget ❌" | #E24B4A |
| Suggested daily | "Spend max ₹1,950/day for remaining 9 days" | #185FA5 |

---

### 5.4 Progress Bar

Used throughout Budget module

| Property | Detail |
|----------|--------|
| Height | 6px (list cards), 10px (overall card), 4px (sub-limits) |
| Background | #F3F4F6 |
| Fill | Colored based on usage % |
| Border radius | 3px |
| Animation | Fill animates on screen load (300ms ease) |
| Overflow | Cap at 100% width even if exceeded (color turns red) |

---

## 6. UX Writing

### Budget Tab

| Element | Text |
|---------|------|
| Screen title | Budget |
| Toggle: personal | Personal |
| Toggle: family | Family |
| Section header | Category Limits |
| Add limit link | + Add category limit |
| Empty heading | No budget set for [Month] |
| Empty subtext | Set a monthly limit to start tracking your spending. |
| Empty CTA | Set Budget |
| No category limits | + Add category limits to track specific spending |
| Loading | Loading budget… |

### Set Budget Screen

| Element | Text |
|---------|------|
| Screen title (new) | Set Budget |
| Screen title (edit) | Edit Budget |
| Type label | Budget Type |
| Type: overall | Overall |
| Type: category | Category |
| Category label | Category |
| Category placeholder | Select a category |
| Category error | Please select a category |
| Monthly label | Monthly Limit |
| Monthly placeholder | e.g. 8,000 |
| Monthly error | Please enter a valid amount |
| Daily toggle label | Set daily limit |
| Daily placeholder | e.g. 300 |
| Daily hint | Alert when daily spend exceeds this |
| Weekly toggle label | Set weekly limit |
| Weekly placeholder | e.g. 2,000 |
| Warning (daily > monthly) | Daily limit × 30 = ₹[X] — higher than monthly limit |
| Save button (new) | Save Budget |
| Save button (edit) | Save Changes |
| Success toast (new) | Budget set |
| Success toast (edit) | Budget updated |
| Error toast | Failed to save. Please try again. |

### Budget Detail Screen

| Element | Text |
|---------|------|
| Edit button | Edit Budget |
| Remove button | Remove Budget Limit |
| Transactions header | Transactions this month |
| View all link | View all transactions |
| No transactions | No transactions this month |

### Delete Confirmation

| Element | Text |
|---------|------|
| Title | Remove Budget Limit? |
| Body | This will remove the limit for [Category]. Your transactions won't be affected. |
| Cancel | Cancel |
| Confirm | Remove |
| Success toast | Budget limit removed |

### Overall Budget Card

| Element | Text |
|---------|------|
| Card title | Budget — [Month] |
| Spent label | Spent |
| Limit label | Limit |
| Status: on track | On track ✅ |
| Status: slow down | Slow down ⚠️ |
| Status: exceeded | Budget exceeded ❌ |
| Burn rate label | [₹X,XXX]/day avg |
| Projection: on track | On track — ₹[X] by [date] |
| Projection: at risk | At this pace → ₹[X] by [date] ⚠️ |
| Projection: exceeded | Already exceeded budget |
| Suggested daily | Spend max ₹[X]/day for [N] days remaining |
| Days left | [N] days remaining |

### Month Rollover Dialog

| Element | Text |
|---------|------|
| Title | New month — [Month Year] |
| Body | You had a budget set for [Last Month]. Copy it to [This Month]? |
| Summary | ₹[X] overall · [N] category limits |
| Start fresh | Start Fresh |
| Copy button | Copy Budget |
| Copy success toast | Budget copied from [Last Month] |

### Home Budget Card

| Element | Text |
|---------|------|
| Card title | Budget — [Month] |
| Details link | Details → |
| No budget | Set a budget to track your spending |
| No budget CTA | Set Budget → |

---

## 7. Backend — API Design

### 7.1 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/budgets` | Yes | List all budgets with spent + burn rate for a month |
| POST | `/api/v1/budgets` | Yes | Create or update (upsert) a budget limit |
| GET | `/api/v1/budgets/:id` | Yes | Get single budget detail with sub-limits + transactions |
| PATCH | `/api/v1/budgets/:id` | Yes | Update budget limits |
| DELETE | `/api/v1/budgets/:id` | Yes | Remove a budget limit |
| POST | `/api/v1/budgets/rollover` | Yes | Copy last month's budgets to new month |
| GET | `/api/v1/budgets/summary` | Yes | Home screen summary (overall budget health) |

---

### 7.2 Request / Response Schemas

#### POST /budgets — Create / Upsert Budget

**Request body:**
```json
{
  "categoryId": null,
  "month": "2026-04",
  "monthlyLimit": 3000000,
  "dailyLimit": 150000,
  "weeklyLimit": null,
  "isFamily": false
}
```

**Validation rules:**
| Field | Rule |
|-------|------|
| categoryId | null = overall budget, uuid = category budget |
| month | Required, format YYYY-MM |
| monthlyLimit | Required, integer > 0 (paise) |
| dailyLimit | Optional, integer > 0 (paise) |
| weeklyLimit | Optional, integer > 0 (paise) |
| isFamily | boolean, default false |

**Upsert logic:** If budget for same `userId + categoryId + month + isFamily` exists → update. Else → insert.

**Response 200/201:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "categoryId": null,
  "month": "2026-04",
  "monthlyLimit": 3000000,
  "dailyLimit": 150000,
  "weeklyLimit": null,
  "isFamily": false,
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

---

#### GET /budgets — List Budgets with Spend Data

**Query params:**
| Param | Default | Description |
|-------|---------|-------------|
| month | current month | Format: YYYY-MM |
| isFamily | false | true = family budgets |

**Response 200:**
```json
{
  "month": "2026-04",
  "overall": {
    "id": "uuid",
    "monthlyLimit": 3000000,
    "dailyLimit": 150000,
    "weeklyLimit": null,
    "spent": 1245000,
    "todaySpent": 45000,
    "thisWeekSpent": 280000,
    "percentUsed": 41,
    "burnRate": {
      "dailyAvg": 138333,
      "projectedMonthEnd": 4149990,
      "suggestedDailyRemaining": 195000,
      "daysRemaining": 9,
      "isOnTrack": false
    }
  },
  "categories": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "categoryName": "Food & Dining",
      "categoryIcon": "🍽️",
      "categoryColor": "#D85A30",
      "monthlyLimit": 800000,
      "dailyLimit": 30000,
      "weeklyLimit": null,
      "spent": 420000,
      "todaySpent": 45000,
      "thisWeekSpent": 180000,
      "percentUsed": 52,
      "burnRate": {
        "dailyAvg": 46666,
        "projectedMonthEnd": 1399980,
        "suggestedDailyRemaining": 42222,
        "daysRemaining": 9,
        "isOnTrack": false
      }
    }
  ]
}
```

---

#### GET /budgets/summary — Home Screen Card

**Query params:** `month=YYYY-MM`

**Response 200:**
```json
{
  "month": "2026-04",
  "hasOverallBudget": true,
  "monthlyLimit": 3000000,
  "spent": 1245000,
  "percentUsed": 41,
  "status": "on_track",
  "dailyAvg": 138333,
  "suggestedDaily": 195000,
  "daysRemaining": 9,
  "projectedMonthEnd": 4149990,
  "isOnTrack": false,
  "projectionLabel": "At this pace → ₹41,500 by Apr 30"
}
```

Status values: `"on_track"` | `"warning"` (≥80%) | `"exceeded"` (≥100%)

---

#### POST /budgets/rollover — Copy Budget to New Month

**Request body:**
```json
{
  "fromMonth": "2026-04",
  "toMonth": "2026-05"
}
```

**Server logic:**
```
1. Fetch all budgets for userId + fromMonth
2. For each budget, insert copy with toMonth
3. Skip if budget for toMonth already exists (don't overwrite)
4. Return count of copied budgets
```

**Response 200:**
```json
{
  "copiedCount": 6,
  "month": "2026-05"
}
```

---

### 7.3 Burn Rate Calculation Logic

```ts
// apps/api/src/utils/budget.engine.ts

import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, differenceInDays } from 'date-fns'

export interface BurnRate {
  dailyAvg: number           // paise — average daily spend so far
  projectedMonthEnd: number  // paise — projected total spend by end of month
  suggestedDailyRemaining: number // paise — max daily spend to stay within limit
  daysRemaining: number      // calendar days left in month
  isOnTrack: boolean         // true if projected < limit
}

export function calculateBurnRate(
  monthlyLimit: number,
  totalSpent: number,
  month: string  // 'YYYY-MM'
): BurnRate {
  const now = new Date()
  const monthStart = startOfMonth(new Date(`${month}-01`))
  const monthEnd = endOfMonth(new Date(`${month}-01`))

  const daysElapsed = Math.max(1, differenceInDays(now, monthStart) + 1)
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
  const daysRemaining = Math.max(0, differenceInDays(monthEnd, now))

  // Average daily spend so far
  const dailyAvg = Math.round(totalSpent / daysElapsed)

  // Projected spend at end of month (linear projection)
  const projectedMonthEnd = Math.round(dailyAvg * daysInMonth)

  // Remaining budget / remaining days = max daily spend
  const remainingBudget = Math.max(0, monthlyLimit - totalSpent)
  const suggestedDailyRemaining = daysRemaining > 0
    ? Math.round(remainingBudget / daysRemaining)
    : 0

  const isOnTrack = projectedMonthEnd <= monthlyLimit

  return { dailyAvg, projectedMonthEnd, suggestedDailyRemaining, daysRemaining, isOnTrack }
}

export function getProjectionLabel(
  projectedMonthEnd: number,
  monthlyLimit: number,
  isOnTrack: boolean,
  monthEndDate: string
): string {
  const fmt = (p: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(p / 100)

  if (isOnTrack) {
    return `On track — ${fmt(projectedMonthEnd)} by ${monthEndDate}`
  } else if (projectedMonthEnd >= monthlyLimit * 1.5) {
    return `At this pace → ${fmt(projectedMonthEnd)} by ${monthEndDate} ⚠️`
  } else {
    return `At this pace → ${fmt(projectedMonthEnd)} by ${monthEndDate}`
  }
}
```

---

### 7.4 Full Router Implementation

```ts
// apps/api/src/modules/budget/budget.router.ts

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { SetBudgetSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { budgets, transactions } from '../../db/schema.js'
import { eq, and, gte, lte, sql, isNull } from 'drizzle-orm'
import { startOfMonth, endOfMonth, startOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { calculateBurnRate } from '../../utils/budget.engine.js'

export const budgetRouter = new Hono()
budgetRouter.use('*', authMiddleware)

// GET /budgets?month=YYYY-MM&isFamily=false
budgetRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const isFamily = c.req.query('isFamily') === 'true'

  const start = startOfMonth(new Date(`${month}-01`))
  const end = endOfMonth(new Date(`${month}-01`))
  const todayStart = startOfDay(new Date())
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  // Fetch all budgets for this user + month
  const budgetList = await db.query.budgets.findMany({
    where: and(
      eq(budgets.userId, userId),
      eq(budgets.month, month)
    ),
    with: { category: true },
  })

  // Fetch monthly spend per category
  const monthlySpend = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<number>`SUM(amount)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'DEBIT'),
      eq(transactions.isReversal, false),
      gte(transactions.transactedAt, start),
      lte(transactions.transactedAt, end)
    ))
    .groupBy(transactions.categoryId)

  // Today's spend per category
  const todaySpend = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<number>`SUM(amount)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'DEBIT'),
      eq(transactions.isReversal, false),
      gte(transactions.transactedAt, todayStart)
    ))
    .groupBy(transactions.categoryId)

  // This week's spend per category
  const weekSpend = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<number>`SUM(amount)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'DEBIT'),
      eq(transactions.isReversal, false),
      gte(transactions.transactedAt, weekStart),
      lte(transactions.transactedAt, weekEnd)
    ))
    .groupBy(transactions.categoryId)

  const monthlyMap = Object.fromEntries(monthlySpend.map(s => [s.categoryId, Number(s.total)]))
  const todayMap = Object.fromEntries(todaySpend.map(s => [s.categoryId, Number(s.total)]))
  const weekMap = Object.fromEntries(weekSpend.map(s => [s.categoryId, Number(s.total)]))

  const totalMonthlySpend = Object.values(monthlyMap).reduce((a, v) => a + v, 0)

  const overall = budgetList.find(b => !b.categoryId)
  const categories = budgetList.filter(b => b.categoryId)

  const enrichBudget = (b: any, spent: number, todaySpent: number, thisWeekSpent: number) => ({
    ...b,
    spent,
    todaySpent,
    thisWeekSpent,
    percentUsed: b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0,
    burnRate: calculateBurnRate(b.monthlyLimit, spent, month),
  })

  return c.json({
    month,
    overall: overall
      ? enrichBudget(overall, totalMonthlySpend, Object.values(todayMap).reduce((a,v) => a+v, 0), Object.values(weekMap).reduce((a,v) => a+v, 0))
      : null,
    categories: categories.map(b => enrichBudget(
      b,
      monthlyMap[b.categoryId!] ?? 0,
      todayMap[b.categoryId!] ?? 0,
      weekMap[b.categoryId!] ?? 0
    )),
  })
})

// POST /budgets — upsert
budgetRouter.post('/', zValidator('json', SetBudgetSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, userId),
      eq(budgets.month, body.month),
      body.categoryId
        ? eq(budgets.categoryId, body.categoryId)
        : isNull(budgets.categoryId)
    ),
  })

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({ monthlyLimit: body.monthlyLimit, dailyLimit: body.dailyLimit, weeklyLimit: body.weeklyLimit })
      .where(eq(budgets.id, existing.id))
      .returning()
    return c.json(updated)
  }

  const [created] = await db
    .insert(budgets)
    .values({ ...body, userId })
    .returning()
  return c.json(created, 201)
})

// DELETE /budgets/:id
budgetRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const budget = await db.query.budgets.findFirst({
    where: and(eq(budgets.id, id), eq(budgets.userId, userId))
  })
  if (!budget) return c.json({ error: 'Budget not found' }, 404)

  await db.delete(budgets).where(eq(budgets.id, id))
  return c.json({ success: true })
})

// POST /budgets/rollover
budgetRouter.post('/rollover', async (c) => {
  const userId = c.get('userId')
  const { fromMonth, toMonth } = await c.req.json()

  const source = await db.query.budgets.findMany({
    where: and(eq(budgets.userId, userId), eq(budgets.month, fromMonth))
  })

  const existing = await db.query.budgets.findMany({
    where: and(eq(budgets.userId, userId), eq(budgets.month, toMonth))
  })
  const existingKeys = new Set(existing.map(b => b.categoryId ?? 'overall'))

  const toInsert = source
    .filter(b => !existingKeys.has(b.categoryId ?? 'overall'))
    .map(({ id, createdAt, month, ...rest }) => ({ ...rest, month: toMonth }))

  if (toInsert.length > 0) {
    await db.insert(budgets).values(toInsert)
  }

  return c.json({ copiedCount: toInsert.length, month: toMonth })
})

// GET /budgets/summary
budgetRouter.get('/summary', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)

  const start = startOfMonth(new Date(`${month}-01`))
  const end = endOfMonth(new Date(`${month}-01`))

  const overall = await db.query.budgets.findFirst({
    where: and(eq(budgets.userId, userId), eq(budgets.month, month), isNull(budgets.categoryId))
  })
  if (!overall) return c.json({ hasOverallBudget: false, month })

  const spendResult = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'DEBIT'),
      eq(transactions.isReversal, false),
      gte(transactions.transactedAt, start),
      lte(transactions.transactedAt, end)
    ))

  const spent = Number(spendResult[0]?.total ?? 0)
  const percentUsed = Math.round((spent / overall.monthlyLimit) * 100)
  const burnRate = calculateBurnRate(overall.monthlyLimit, spent, month)
  const status = percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'on_track'

  return c.json({
    month, hasOverallBudget: true,
    monthlyLimit: overall.monthlyLimit,
    spent, percentUsed, status,
    ...burnRate,
  })
})
```

---

## 8. Frontend — State Management

```ts
// apps/mobile/src/stores/budget.store.ts

import { create } from 'zustand'
import { apiRequest } from '../api/client'

interface BurnRate {
  dailyAvg: number
  projectedMonthEnd: number
  suggestedDailyRemaining: number
  daysRemaining: number
  isOnTrack: boolean
}

interface BudgetItem {
  id: string
  categoryId: string | null
  categoryName?: string
  categoryIcon?: string
  categoryColor?: string
  monthlyLimit: number
  dailyLimit: number | null
  weeklyLimit: number | null
  spent: number
  todaySpent: number
  thisWeekSpent: number
  percentUsed: number
  burnRate: BurnRate
}

interface BudgetState {
  overall: BudgetItem | null
  categories: BudgetItem[]
  summary: any
  selectedMonth: string
  isLoading: boolean

  fetchBudgets: (month?: string) => Promise<void>
  fetchSummary: () => Promise<void>
  setMonth: (month: string) => void
  createBudget: (data: {
    categoryId: string | null
    month: string
    monthlyLimit: number
    dailyLimit?: number
    weeklyLimit?: number
  }) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  rolloverBudget: (fromMonth: string, toMonth: string) => Promise<number>
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  overall: null,
  categories: [],
  summary: null,
  selectedMonth: new Date().toISOString().slice(0, 7),
  isLoading: false,

  fetchBudgets: async (month) => {
    const m = month ?? get().selectedMonth
    set({ isLoading: true })
    const res = await apiRequest<{ overall: BudgetItem; categories: BudgetItem[] }>(
      `/budgets?month=${m}`
    )
    set({ overall: res.overall, categories: res.categories, isLoading: false })
  },

  fetchSummary: async () => {
    const month = get().selectedMonth
    const res = await apiRequest<any>(`/budgets/summary?month=${month}`)
    set({ summary: res })
  },

  setMonth: (month) => {
    set({ selectedMonth: month })
    get().fetchBudgets(month)
  },

  createBudget: async (data) => {
    await apiRequest('/budgets', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        monthlyLimit: Math.round(data.monthlyLimit * 100),
        dailyLimit: data.dailyLimit ? Math.round(data.dailyLimit * 100) : null,
        weeklyLimit: data.weeklyLimit ? Math.round(data.weeklyLimit * 100) : null,
      }),
    })
    await get().fetchBudgets()
    await get().fetchSummary()
  },

  deleteBudget: async (id) => {
    await apiRequest(`/budgets/${id}`, { method: 'DELETE' })
    await get().fetchBudgets()
    await get().fetchSummary()
  },

  rolloverBudget: async (fromMonth, toMonth) => {
    const res = await apiRequest<{ copiedCount: number }>(
      '/budgets/rollover',
      { method: 'POST', body: JSON.stringify({ fromMonth, toMonth }) }
    )
    await get().fetchBudgets(toMonth)
    return res.copiedCount
  },
}))
```

---

### 8.1 Burn Rate Formatter (Mobile)

```ts
// apps/mobile/src/utils/budget.ts

import { formatINR } from './money'
import { format, endOfMonth } from 'date-fns'

export function getProjectionLabel(
  projectedMonthEnd: number,
  monthlyLimit: number,
  month: string
): { text: string; color: string } {
  const monthEndDate = format(endOfMonth(new Date(`${month}-01`)), 'MMM d')

  if (projectedMonthEnd <= monthlyLimit) {
    return {
      text: `On track — ${formatINR(projectedMonthEnd)} by ${monthEndDate} ✅`,
      color: '#1D9E75',
    }
  } else {
    return {
      text: `At this pace → ${formatINR(projectedMonthEnd)} by ${monthEndDate} ⚠️`,
      color: '#BA7517',
    }
  }
}

export function getBudgetStatus(percentUsed: number): 'safe' | 'warning' | 'exceeded' {
  if (percentUsed >= 100) return 'exceeded'
  if (percentUsed >= 80) return 'warning'
  return 'safe'
}

export function getStatusColor(status: 'safe' | 'warning' | 'exceeded'): string {
  return { safe: '#1D9E75', warning: '#BA7517', exceeded: '#E24B4A' }[status]
}
```

---

## 9. DB Schema

### Existing Schema (verify)

```ts
// apps/api/src/db/schema.ts — budgets table

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  categoryId: uuid('category_id').references(() => categories.id),
  month: text('month').notNull(),           // 'YYYY-MM'
  monthlyLimit: integer('monthly_limit').notNull(),  // paise
  dailyLimit: integer('daily_limit'),                // paise, optional
  weeklyLimit: integer('weekly_limit'),              // paise, optional
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Required Schema Addition

```ts
// Add isFamily field to budgets table
// Migration: npm run db:generate && npm run db:migrate

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').references(() => families.id),  // ADD THIS
  categoryId: uuid('category_id').references(() => categories.id),
  month: text('month').notNull(),
  monthlyLimit: integer('monthly_limit').notNull(),
  dailyLimit: integer('daily_limit'),
  weeklyLimit: integer('weekly_limit'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userMonthIdx: index('idx_budgets_user_month').on(t.userId, t.month),
  uniqueConstraint: unique('uniq_budget').on(t.userId, t.month, t.categoryId),
}))
```

### SQL Migration

```sql
ALTER TABLE budgets ADD COLUMN family_id UUID REFERENCES families(id);

CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

CREATE UNIQUE INDEX uniq_budget_personal
  ON budgets(user_id, month, category_id)
  WHERE family_id IS NULL;

CREATE UNIQUE INDEX uniq_budget_family
  ON budgets(family_id, month, category_id)
  WHERE family_id IS NOT NULL;
```

---

## 10. Business Logic Rules

### Amount Rules
- All budget amounts stored as integer paise
- Monthly limit must be > 0
- Daily limit: if set, should be < monthly limit / 28 (soft warning, not blocking)
- Weekly limit: if set, should be < monthly limit / 4 (soft warning, not blocking)

### Upsert Rules
- Only one overall budget per user per month per scope (personal/family)
- Only one category budget per user per category per month
- POST always upserts — never creates duplicate

### Burn Rate Rules
```
daysElapsed   = days from month start to today (min 1)
dailyAvg      = totalSpent / daysElapsed
projected     = dailyAvg × daysInMonth
suggestedDaily = remainingBudget / daysRemaining
isOnTrack     = projected ≤ monthlyLimit
```

### Alert Rules
- 80% threshold: when `percentUsed >= 80 && percentUsed < 100` → send warning push
- 100% threshold: when `percentUsed >= 100` → send exceeded alert push
- Alert sent once per threshold per month per budget (not repeatedly)
- Check triggered: after every transaction POST (server-side)

### Monthly Rollover Rules
- Prompt shown: on first app open of new month if previous month budget exists
- User choice saved locally — don't show again that month
- Rollover copies: monthlyLimit, dailyLimit, weeklyLimit, categoryId
- Does NOT copy spent amounts (those come from transactions)
- Skip existing: if toMonth already has a budget for same category, skip (don't overwrite)

### Family Budget Rules
- Family budget: linked to `familyId`, not userId
- Only family owner can create/edit/delete family budget
- All family members can view family budget
- Family budget spend = sum of all family members' transactions (same familyId)
- Personal and family budgets are completely independent

---

## 11. Error Handling

### API Errors

| Scenario | HTTP Status | Error |
|----------|-------------|-------|
| Budget not found | 404 | "Budget not found" |
| Not owner of budget | 403 | "Forbidden" |
| Invalid month format | 422 | "Invalid month format. Use YYYY-MM" |
| Monthly limit ≤ 0 | 422 | "Monthly limit must be greater than 0" |
| Rollover: from month not found | 404 | "No budgets found for source month" |
| Family budget: not owner | 403 | "Only family owner can manage family budget" |

### Mobile Error Handling

```tsx
const handleSaveBudget = async () => {
  try {
    setIsSaving(true)
    await createBudget(formData)
    Toast.show({ text: 'Budget set', type: 'success' })
    router.back()
  } catch (e: any) {
    Toast.show({ text: e.message ?? 'Failed to save', type: 'error' })
  } finally {
    setIsSaving(false)
  }
}
```

---

## 12. Accessibility Notes

| Requirement | Detail |
|-------------|--------|
| Progress bar | Accessible label: "[Category] budget: [X]% used, ₹[spent] of ₹[limit]" |
| Status colors | Never rely on color alone — always pair with text label (On track / Warning / Exceeded) |
| Burn rate section | Each row has descriptive label read by screen reader |
| Budget card | Role: button when tappable, announces: "[Category], [%] used, [status]" |
| Progress bar fill | Use `accessibilityValue={{ min: 0, max: 100, now: percentUsed }}` |
| Daily/Weekly toggles | Role: switch, announces on/off state |
| Month rollover dialog | Focus moves to dialog, trapped inside until dismissed |
| Delete confirmation | Focus moves to dialog, announces destructive action warning |
| FAB (+) | Accessible label: "Add budget limit" |
| Edit/Delete actions | Accessible labels on swipe actions |
| Touch targets | All budget cards minimum 72px height, all buttons minimum 44px |
| iOS | Support Dynamic Type for all text |
| Android | TalkBack content descriptions on all interactive elements |

---

## 13. Implementation Enhancements (Recommended)

This section standardizes delivery expectations for the Budget module across backend, mobile, data integrity, and QA gates.

### 13.1 MVP vs Phase-2 Scope

**MVP (must ship):**
- Personal budget scope (`familyId = null`) with:
  - One monthly overall budget per month
  - One monthly category budget per category per month
  - Daily/weekly optional sub-limits
- Burn rate outputs for overall and category budgets:
  - `dailyAvg`, `projectedMonthEnd`, `suggestedDailyRemaining`, `daysRemaining`, `isOnTrack`
- Budget summary card endpoint for home screen
- Budget rollover endpoint with idempotent copy behavior (skip existing, no overwrite)
- Threshold alert triggering logic (80%, 100%) with dedupe persistence
- Full CRUD + list APIs with robust month validation (`YYYY-MM`)

**Phase-2 (after MVP stabilization):**
- Family budget scope with strict ownership and read-only member visibility
- Member-level contribution breakdown in family budget views
- Server-persisted monthly rollover decision (cross-device consistency)
- Advanced forecasting (seasonality/weekday weighting) beyond linear burn-rate

---

### 13.2 Canonical Scope Model (Avoid Ambiguity)

Use a single persistence model:
- `familyId IS NULL` => personal budget
- `familyId IS NOT NULL` => family budget

Avoid persisting `isFamily` as a separate source of truth.  
If API accepts `isFamily` in request/query for UX convenience, resolve it server-side into canonical `familyId`-based filters before DB access.

---

### 13.3 Data Integrity and Constraints

Enforce all of the following:
- Unique overall personal budget per month
  - `(user_id, month)` where `family_id IS NULL` and `category_id IS NULL`
- Unique category personal budget per month
  - `(user_id, month, category_id)` where `family_id IS NULL` and `category_id IS NOT NULL`
- Unique overall family budget per month
  - `(family_id, month)` where `family_id IS NOT NULL` and `category_id IS NULL`
- Unique category family budget per month
  - `(family_id, month, category_id)` where `family_id IS NOT NULL` and `category_id IS NOT NULL`
- `monthlyLimit > 0`; `dailyLimit` / `weeklyLimit` if present must be `> 0`
- `month` format strict regex: `^\d{4}-(0[1-9]|1[0-2])$`

**Recommendation:** use partial unique indexes in PostgreSQL for the four uniqueness paths above.

---

### 13.4 Time Semantics (Critical)

Budget windows must be deterministic and timezone-safe:
- Month window: based on selected budget month, not server local month
- Daily/weekly windows: computed in one declared timezone policy:
  - Either user timezone (preferred when user profile timezone exists), or
  - Fixed business timezone (e.g. `Asia/Kolkata`)

Do not mix server local timezone and client local timezone in spend window logic.

---

### 13.5 Alert Idempotency Contract

Budget alerts must be sent once per threshold per budget per month.

Add persistence for dedupe:
- Table example: `budget_alert_events`
  - `id`, `budgetId`, `month`, `threshold` (`80`, `100`), `sentAt`
  - unique key: `(budgetId, month, threshold)`

Flow:
1. Recompute usage after transaction write.
2. If threshold crossed and event absent, send push and insert event.
3. If event exists, skip sending.

---

### 13.6 API Contract Hardening

Standardize API behavior:
- `POST /budgets` behaves as upsert and returns consistent payload shape
- `GET /budgets` returns deterministic ordering:
  - `overall` first
  - `categories` sorted by category display name (or explicit category order)
- `POST /budgets/rollover` must be idempotent
  - repeated same request returns `copiedCount: 0` after first copy
- Error contracts:
  - `422` invalid month/amount inputs
  - `403` family ownership violations
  - `404` resource not found
  - `409` unique conflict when business rules disallow operation

---

### 13.7 Category Lifecycle Safety

Define behavior when a budget references a category that is later archived/renamed:
- Budgets should remain readable for historical month views
- Response should include safe display fallback if live category metadata missing
- Optionally denormalize snapshot fields (`categoryName`, `icon`, `color`) into budgets for immutable history rendering

---

### 13.8 Performance and Indexing

Add/verify indexes for production queries:
- Budgets:
  - `(user_id, month)`
  - `(family_id, month)`
  - partial unique indexes listed in 13.3
- Transactions aggregation paths:
  - `(user_id, transacted_at, type, is_reversal, category_id)`
  - `(family_id, transacted_at, type, is_reversal, category_id)` for family scope

Use `COALESCE(SUM(...), 0)` in aggregations to avoid null handling drift.

---

### 13.9 QA and Release Gate

Minimum test matrix before release:
- Unit tests:
  - burn-rate math across beginning/middle/end-of-month
  - projected/suggested daily edge cases (`daysRemaining = 0`)
- Integration/API tests:
  - upsert uniqueness paths (overall/category, personal/family)
  - rollover idempotency and skip-existing behavior
  - access control for family owner/member
  - alert dedupe (80% and 100% sent once)
  - timezone correctness for daily/weekly/monthly spend boundaries
- Mobile E2E/UAT:
  - create/edit/delete budget
  - empty states and no-category state
  - month switch + summary sync
  - rollover dialog behavior and persistence
  - accessibility labels on progress/status actions
