# Accounts Module — UX/UI Design Requirements

**Project:** Expense Tracker (Personal + Family)
**Module:** Accounts
**Version:** 1.0
**Date:** April 21, 2026
**Platform:** Android + iOS (React Native)

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Account Types](#2-account-types)
3. [User Stories](#3-user-stories)
4. [User Flows](#4-user-flows)
5. [Screen Specifications](#5-screen-specifications)
   - 5.1 Home Screen — Accounts Section
   - 5.2 Accounts List Screen
   - 5.3 Add Account Screen
   - 5.4 Account Detail Screen
   - 5.5 Edit Account Screen
   - 5.6 Delete Account Confirmation
   - 5.7 Onboarding — Account Setup Step
6. [Component Specifications](#6-component-specifications)
7. [UX Writing](#7-ux-writing)
8. [Business Logic Rules](#8-business-logic-rules)
9. [Accessibility Notes](#9-accessibility-notes)

---

## 1. Module Overview

| Field | Detail |
|-------|--------|
| Module Purpose | Create and manage financial accounts. Track balances, available funds after upcoming payments, and net worth across all accounts. |
| Entry Points | Home screen (+) button, Accounts screen, Settings, Onboarding wizard |
| Exit Points | Home screen, Transactions screen (filtered by account), Upcoming Payments screen |
| Platforms | Android + iOS (React Native / Expo) |
| Auth Required | Yes — all screens require login |

---

## 2. Account Types

| Type | Icon | Special Fields | Notes |
|------|------|----------------|-------|
| Cash | 💵 | — | Day-to-day physical cash |
| Bank Account | 🏦 | Bank name (optional) | Savings / current account |
| Wallet | 👛 | Wallet provider name (optional) | GPay, PhonePe, Paytm etc. |
| Credit Card | 💳 | Credit limit (required) | Shows used amount + available credit |
| Savings Account | 🏛️ | Interest rate (optional) | Separate from bank for clarity |
| Loan Account | 🔴 | Outstanding balance | Tracks what you owe; negative net worth |

---

## 3. User Stories

### Primary — Happy Path
> As a user, I want to create a Bank Account with an opening balance of ₹45,000 so that I can start tracking my transactions from today.

> As a user, I want to see all my accounts on the home screen with their available balance (after upcoming payments are deducted) so that I know exactly how much I can actually spend.

> As a user, I want to add a Credit Card with a ₹1,00,000 limit so that I can track how much credit I have used and how much is remaining.

> As a user, I want to drag and reorder my accounts on the home screen so that my most-used account (Cash) appears first.

> As a user, I want to toggle between my personal accounts and family view so that I can see combined household finances when needed.

### Edge Cases
> As a user who has no accounts yet, I want to see a clear empty state with a prompt to add my first account so that I understand how to get started.

> As a user, I want to be warned before deleting an account that has existing transactions, so that I don't accidentally lose history.

> As a user, I want the app to prevent me from deleting an account if it has pending upcoming payments linked to it, so that my forecast stays accurate.

> As a user, I want to set a Loan Account with ₹3,50,000 outstanding balance so that my net worth calculation reflects what I owe.

### Android-Specific
> As an Android user, I want to use the FAB (+) button on the Accounts screen to quickly add a new account without navigating through menus.

> As an Android user, I want to long-press an account card to reveal Edit and Delete options (contextual action menu).

### iOS-Specific
> As an iOS user, I want to swipe left on an account card to reveal Edit and Delete actions following iOS conventions.

> As an iOS user, I want to tap the (+) in the top-right navigation bar to add a new account.

---

## 4. User Flows

### 4.1 Create Account Flow

```
Entry Points:
  [Home screen + button]
  [Accounts screen + button / FAB]
  [Settings > Accounts > Add Account]
  [Onboarding Step 2: Add your accounts]
        ↓
[Add Account Screen]
  → Select account type (icon grid)
  → Enter account name
  → Enter opening balance
  → [If Credit Card] Enter credit limit
  → [If Loan] Enter outstanding balance
  → Choose icon color
  → Tap "Create Account"
        ↓
  [Validation]
  ├── Errors → Show inline field errors, stay on screen
  └── Valid →
        ↓
  [Success]
  → Toast: "Account created successfully"
  → Navigate back to Accounts screen / Home screen
  → New account card visible
```

### 4.2 View Account Balance Flow

```
[Home Screen]
  → See account cards (per account + total net worth)
  → Personal / Family toggle (top of screen)
        ↓
[Tap account card]
  → [Account Detail Screen]
  → See current balance, pending upcoming deductions, available balance
  → See recent transactions for this account
  → Tap "View all transactions" → Transactions screen (filtered)
```

### 4.3 Reorder Accounts Flow

```
[Home Screen or Accounts Screen]
  → Long press account card (Android) / Hold and drag (iOS)
  → Drag handle appears on all cards
  → Drag card to new position
  → Release → order saved automatically
  → Toast: "Order saved"
```

### 4.4 Edit Account Flow

```
[Account Detail Screen > Edit button]
  OR [Long press card > Edit (Android)]
  OR [Swipe left > Edit (iOS)]
        ↓
[Edit Account Screen]
  → Can change: name, icon color, credit limit (credit card), bank name
  → Cannot change: account type, opening balance (locked after creation)
        ↓
  → Tap "Save Changes"
  → Toast: "Account updated"
  → Back to Account Detail Screen
```

### 4.5 Delete Account Flow

```
[Account Detail Screen > Delete]
  OR [Long press > Delete (Android)]
  OR [Swipe left > Delete (iOS)]
        ↓
[Check: has transactions?]
  ├── Yes → Show warning dialog:
  │         "This account has X transactions.
  │          Deleting will permanently remove the account.
  │          Transactions history will be lost."
  │         [Cancel] [Delete Anyway]
  └── No → Show confirmation dialog:
            "Delete this account? This cannot be undone."
            [Cancel] [Delete]
        ↓
  [Check: has pending upcoming payments linked?]
  ├── Yes → Block deletion:
  │         "Cannot delete — X upcoming payments are linked to this account.
  │          Remove or reassign them first."
  │         [OK]
  └── No → Proceed with delete
        ↓
  → Account removed
  → Toast: "Account deleted"
  → Navigate to Accounts screen / Home screen
```

---

## 5. Screen Specifications

---

### 5.1 Home Screen — Accounts Section

| Property | Detail |
|----------|--------|
| Purpose | Show all user accounts with balances at a glance. Quick access to add account. |
| Route | `/(tabs)/index` |
| Access | Authenticated users only |

#### Layout Description

**Top bar:**
- Left: App name / logo
- Right: Notification bell icon + Profile avatar

**Personal / Family toggle:**
- Segmented control below top bar
- Two options: "Personal" | "Family"
- Default: Personal
- Family option visible only if user is part of a family

**Net Worth Summary card:**
- Full-width card
- Label: "Net Worth"
- Value: Total of all account balances (assets minus liabilities)
- Sub-label: "As of today"
- Tapping opens Accounts List screen

**Accounts horizontal scroll (or vertical list):**
- Each account shown as a card (see Account Card component)
- Drag handle visible when reorder mode is active
- Last card: "+ Add Account" card (dashed border, muted)

**Quick Add (+) FAB:**
- Bottom right (Android)
- Opens bottom action sheet: "Add Transaction" | "Add Account" | "Add Upcoming Payment"

---

### 5.2 Accounts List Screen

| Property | Detail |
|----------|--------|
| Purpose | Full list of all accounts with management options |
| Route | Accessible via Settings > Accounts or dedicated nav |
| Access | Authenticated users only |

#### Layout Description

**Header:**
- Title: "My Accounts"
- Android: Back arrow + title + (+) FAB bottom right
- iOS: Back chevron + title (centered) + (+) top right

**Account list:**
- Vertical scrollable list of Account Cards (full width)
- Each card: account name, type icon, current balance, available balance
- Drag handles on right for reordering (always visible on this screen)
- Long press (Android) / swipe left (iOS) → Edit | Delete actions

**Empty state:**
- Icon: wallet illustration
- Heading: "No accounts yet"
- Subtext: "Add your first account to start tracking your finances."
- CTA Button: "Add Account"

**Section grouping (optional):**
- Group by type: Assets (Cash, Bank, Wallet, Savings) | Liabilities (Credit Card, Loan)
- Section headers: "Assets" | "Liabilities"
- Section totals shown in header

---

### 5.3 Add Account Screen

| Property | Detail |
|----------|--------|
| Purpose | Create a new financial account |
| Route | `/accounts/new` or modal |
| UI | Full screen form |
| Access | Authenticated users only |

#### Layout Description

**Header:**
- Android: Back arrow + "Add Account"
- iOS: "Cancel" (left) + "Add Account" (centered) + disabled "Create" (right, enables when form valid)

**Form sections:**

**Section 1 — Account Type (required)**
- Label: "Account Type"
- UI: Icon grid, 2 columns × 3 rows
- Each cell: icon + label
- Selected state: teal border + teal background tint
- Options: Cash | Bank Account | Wallet | Credit Card | Savings Account | Loan Account

**Section 2 — Account Details**

| Field | Type | Required | Placeholder | Validation | Error |
|-------|------|----------|-------------|------------|-------|
| Account Name | Text input | Yes | e.g. "SBI Savings", "HDFC Credit Card" | 1–50 chars | "Please enter an account name" |
| Opening Balance | Number input | Yes | "0.00" | ≥ 0, numeric | "Please enter a valid amount" |
| Credit Limit | Number input | Only for Credit Card | "e.g. 100000" | > 0, numeric | "Please enter your credit limit" |
| Outstanding Balance | Number input | Only for Loan | "e.g. 350000" | > 0, numeric | "Please enter outstanding balance" |
| Bank / Provider Name | Text input | No | "e.g. SBI, HDFC, GPay" | 0–50 chars | — |

> Note: Opening balance is in ₹ (rupees). Stored as paise internally. Show ₹ prefix on input.

**Section 3 — Appearance**
- Label: "Icon Color"
- Color picker: horizontal scroll of 8 color swatches
- Colors: Teal (#1D9E75), Blue (#378ADD), Amber (#BA7517), Coral (#D85A30), Purple (#7F77DD), Pink (#D4537E), Green (#639922), Gray (#888780)
- Selected color shown with checkmark

**Bottom action:**
- Primary button: "Create Account" (full width, teal)
- Disabled until: Account type selected + Account name filled + Opening balance filled

---

### 5.4 Account Detail Screen

| Property | Detail |
|----------|--------|
| Purpose | Show full balance breakdown + recent transactions for one account |
| Route | `/accounts/:id` |
| Access | Account owner only |

#### Layout Description

**Header:**
- Android: Back arrow + account name + edit icon (top right)
- iOS: Back chevron + account name (centered) + "Edit" text button (top right)

**Balance summary card (top):**
- Account name + type icon + color indicator
- Row 1 — Current Balance: ₹XX,XXX
- Row 2 — Upcoming Payments: − ₹X,XXX (shown in amber/warning)
- Divider
- Row 3 — Available Balance: ₹XX,XXX (shown in teal, larger font)
- For Credit Card: additionally show "Credit Used: ₹X,XXX / ₹1,00,000" with a progress bar

**Recent Transactions section:**
- Section header: "Recent Transactions" + "View All" link
- Last 10 transactions for this account
- Each row: category icon + name + date + amount (red for debit, green for credit)
- Empty state: "No transactions yet. Add your first transaction."

**Action buttons:**
- "Add Transaction" — primary teal button
- "Edit Account" — secondary outlined button
- "Delete Account" — danger text button (bottom, destructive red)

---

### 5.5 Edit Account Screen

| Property | Detail |
|----------|--------|
| Purpose | Modify account name, color, or type-specific fields |
| Route | `/accounts/:id/edit` |
| Access | Account owner only |

#### Layout Description

Same layout as Add Account Screen with these differences:

- Header title: "Edit Account"
- Account type: **disabled / read-only** (cannot change after creation)
- Opening balance: **disabled / read-only** (locked after first transaction)
  - If no transactions yet: editable, with note "You can change opening balance until your first transaction"
- Pre-filled with existing values
- Bottom button: "Save Changes"
- Show "Last updated: [date]" below form

---

### 5.6 Delete Account Confirmation

Two dialog variants:

**Variant A — Account has transactions:**

| Element | Content |
|---------|---------|
| Title | "Delete Account?" |
| Body | "This account has [X] transactions. Deleting will permanently remove this account and all its transaction history. This cannot be undone." |
| Cancel button | "Cancel" (secondary) |
| Confirm button | "Delete Permanently" (destructive red) |

**Variant B — Account has no transactions:**

| Element | Content |
|---------|---------|
| Title | "Delete Account?" |
| Body | "Are you sure you want to delete '[Account Name]'? This cannot be undone." |
| Cancel button | "Cancel" |
| Confirm button | "Delete" (destructive red) |

**Variant C — Blocked (has pending upcoming payments):**

| Element | Content |
|---------|---------|
| Title | "Cannot Delete Account" |
| Body | "'[Account Name]' has [X] upcoming payment(s) linked to it. Please remove or reassign them before deleting this account." |
| Single button | "OK" |

---

### 5.7 Onboarding — Account Setup Step

| Property | Detail |
|----------|--------|
| Purpose | First-time user sets up their accounts during onboarding |
| Route | `/onboarding/accounts` (Step 2 of onboarding) |
| Trigger | First login, after name/email setup |

#### Layout Description

**Progress indicator:** Step 2 of 4 (dots or progress bar at top)

**Header:**
- Title: "Add your accounts"
- Subtitle: "Add the accounts you use to track your money. You can always add more later."

**Accounts added so far:**
- List of accounts already added in this session (empty at start)
- Each row: type icon + name + opening balance + delete (X) icon

**Add Account inline form:**
- Compact version of Add Account form
- Account type icon grid (same as full screen)
- Account name field
- Opening balance field
- "Add Account" button → adds to list above, clears form for next

**Empty state (no accounts added yet):**
- Prompt: "Add at least one account to continue"

**Bottom navigation:**
- "Skip for now" — text link (left)
- "Continue" button — disabled until at least 1 account added (right)

---

## 6. Component Specifications

### 6.1 Account Card

Used on: Home screen, Accounts List screen

| Property | Detail |
|----------|--------|
| Type | Card |
| Size | Full width (list) or 280px wide (horizontal scroll on home) |

**Content:**
- Top row: Account type icon (colored per account color) + Account name (bold)
- Middle: Account type label (muted, small)
- Balance row: "Available" label + balance amount (large, teal)
- Sub-balance row: "Current: ₹X,XXX" (muted) + "Upcoming: −₹X,XXX" (amber)
- For Credit Card: Progress bar showing credit used %
- For Loan: Label "Outstanding" in red

**States:**

| State | Appearance |
|-------|------------|
| Default | White card, 1px border, subtle shadow |
| Pressed | Slight scale down (0.98), darker border |
| Reorder active | Elevated shadow, drag handle visible on right |
| Selected (reorder) | Teal border highlight |

---

### 6.2 Account Type Icon Grid

Used on: Add Account screen, Edit Account screen

| Property | Detail |
|----------|--------|
| Type | Grid selector |
| Layout | 2 columns × 3 rows |
| Cell size | ~150px wide |

**Each cell:**
- Large icon (32px) centered
- Account type label below (13px)
- Default: white background, light gray border
- Selected: teal background tint (#E1F5EE), teal border (#1D9E75), checkmark badge

---

### 6.3 Color Picker

Used on: Add Account screen, Edit Account screen

| Property | Detail |
|----------|--------|
| Type | Horizontal scroll swatch row |
| Swatch size | 36×36px, circular |
| Count | 8 colors |

**States:**
- Default: color circle
- Selected: color circle + white checkmark in center

---

### 6.4 Balance Summary Card

Used on: Account Detail screen

| Property | Detail |
|----------|--------|
| Type | Card with rows |
| Background | Light teal (#E1F5EE) |

**Rows:**
1. Current Balance — black, 16px
2. Upcoming Payments (with − sign) — amber (#BA7517), 14px
3. Divider line
4. Available Balance — teal (#1D9E75), 22px bold

**Credit Card additional row:**
- "Credit Used" label + "₹X,XXX of ₹X,XX,XXX"
- Linear progress bar (red fill when > 80% used)

---

### 6.5 Net Worth Summary Card

Used on: Home screen

| Property | Detail |
|----------|--------|
| Type | Full-width card |
| Background | Teal (#1D9E75) |
| Text color | White |

**Content:**
- Label: "Net Worth" (small, white 70% opacity)
- Amount: ₹XX,XX,XXX (large, white, bold)
- Sub-label: "Assets ₹X — Liabilities ₹X" (small, white 70% opacity)
- Positive net worth: teal background
- Negative net worth: red background (#E24B4A)

---

### 6.6 Personal / Family Toggle

Used on: Home screen

| Property | Detail |
|----------|--------|
| Type | Segmented control |
| Options | "Personal" \| "Family" |
| Visibility | Only shown when user is part of a family |

**States:**
- Personal selected: left segment active (teal fill, white text)
- Family selected: right segment active (teal fill, white text)
- Inactive segment: white fill, teal text

---

## 7. UX Writing

### Add Account Screen

| Element | Text |
|---------|------|
| Screen title | Add Account |
| Section: type | Account Type |
| Section: details | Account Details |
| Section: appearance | Icon Color |
| Name placeholder | e.g. SBI Savings, HDFC Credit Card |
| Balance placeholder | 0.00 |
| Credit limit placeholder | e.g. 1,00,000 |
| Outstanding placeholder | e.g. 3,50,000 |
| Bank name placeholder | e.g. SBI, HDFC, GPay |
| Name error | Please enter an account name |
| Balance error | Please enter a valid amount |
| Credit limit error | Please enter your credit limit |
| CTA button | Create Account |
| Success toast | Account created successfully |

### Account Detail Screen

| Element | Text |
|---------|------|
| Balance label | Current Balance |
| Upcoming label | Upcoming Payments |
| Available label | Available to Spend |
| Credit used label | Credit Used |
| No transactions | No transactions yet. Tap "Add Transaction" to get started. |
| View all link | View All Transactions |
| Edit button | Edit Account |
| Delete button | Delete Account |

### Delete Confirmation

| Element | Text |
|---------|------|
| Title (with transactions) | Delete Account? |
| Body (with transactions) | This account has [X] transactions. Deleting will permanently remove this account and all transaction history. This cannot be undone. |
| Title (no transactions) | Delete Account? |
| Body (no transactions) | Are you sure you want to delete '[Name]'? This cannot be undone. |
| Cancel | Cancel |
| Confirm (destructive) | Delete Permanently |
| Blocked title | Cannot Delete Account |
| Blocked body | '[Name]' has [X] upcoming payment(s) linked to it. Remove or reassign them before deleting. |
| Blocked button | OK |

### Empty States

| Screen | Heading | Subtext | CTA |
|--------|---------|---------|-----|
| Accounts list | No accounts yet | Add your first account to start tracking your finances. | Add Account |
| Home (no accounts) | Welcome! Let's set up your accounts | Add your cash, bank, or wallet accounts to get started. | Add Account |
| Account detail (no transactions) | No transactions yet | Add your first transaction to start tracking this account. | Add Transaction |

### Onboarding

| Element | Text |
|---------|------|
| Step title | Add your accounts |
| Step subtitle | Add the accounts you use to track your money. You can add more later. |
| Skip link | Skip for now |
| Continue button | Continue |
| Minimum account note | Add at least one account to continue |

### General

| Element | Text |
|---------|------|
| Error toast | Something went wrong. Please try again. |
| Network error | No internet connection. Please check your connection. |
| Loading | Loading accounts… |
| Save success | Changes saved |
| Reorder saved | Account order saved |

---

## 8. Business Logic Rules

### Balance Calculation
- **Current Balance** = Opening Balance + SUM(all CREDIT transactions) − SUM(all DEBIT transactions)
- **Available Balance** = Current Balance − SUM(all pending + overdue upcoming payments linked to this account)
- **Net Worth** = SUM(all asset account balances) − SUM(all loan account outstanding balances)
- Balance always recalculated from ledger — never stored as a field in DB

### Credit Card
- **Credit Used** = SUM(DEBIT transactions this billing cycle)
- **Available Credit** = Credit Limit − Credit Used
- Credit card balance shown as negative (liability) in net worth calculation
- Warning indicator when credit used > 80% of limit

### Loan Account
- Opening balance = outstanding loan amount at time of creation
- Balance increases as payments are made (CREDIT = loan repayment = reduces outstanding)
- Shown as liability in net worth (negative contribution)

### Opening Balance
- Set once at account creation
- Locked (read-only) after the first transaction is posted to this account
- Before first transaction: editable in Edit Account screen

### Delete Rules
- **Blocked if:** account has pending/overdue upcoming payments linked to it
- **Warning if:** account has any transactions (show count)
- **Free delete if:** no transactions, no upcoming payments

### Reorder
- Drag order persisted per user in backend (`accountOrder` field or separate table)
- Family toggle switches between personal order and family order (separate saved orders)

### Family Toggle
- Personal view: show only current user's accounts
- Family view: show all family members' accounts grouped by member name
- Net worth card in family view: combined household net worth
- Family view only visible if user belongs to a family space

---

## 9. Accessibility Notes

| Requirement | Detail |
|-------------|--------|
| Touch targets | All buttons and cards minimum 44×44pt |
| Color contrast | All text on colored backgrounds must meet WCAG AA (4.5:1 ratio) |
| Screen reader | Account cards must have accessible label: "[Account name], [type], Available balance [amount]" |
| Color alone | Never use color alone to convey balance status — always pair with label/icon |
| Amount formatting | Screen reader should read "Forty five thousand rupees" not "45000" — use Intl.NumberFormat |
| Drag reorder | Provide alternative to drag — "Move up / Move down" buttons accessible via screen reader |
| Error messages | All form errors announced via accessibility announcements, not just visual |
| Loading states | Loading spinner must have accessible label "Loading accounts" |
| Delete confirmation | Focus must move to confirmation dialog when opened |
| iOS | Support Dynamic Type — all text sizes must scale with system font size setting |
| Android | Support TalkBack — all interactive elements have content descriptions |

---

## 10. Additional Recommendations (Implementation Safety)

### 10.1 Account Identity & Lifecycle Fields

Add optional fields to reduce future migrations and improve real-world usability:

| Field | Type | Required | Purpose |
|------|------|----------|---------|
| `institutionName` | text | No | Bank/provider name for bank/wallet/credit card |
| `last4` | text(4) | No | Last 4 digits for card/account recognition |
| `isArchived` | boolean | Yes (default false) | Archive account instead of hard delete |
| `archivedAt` | timestamp | No | Track archive time for audit/history |

> Recommendation: prefer **archive/unarchive** over physical delete in production.

### 10.2 Transfer Rules (Critical)

Define transfer behavior explicitly:

- Transfer between user accounts must create two linked ledger rows:
  - Row A: DEBIT from source account
  - Row B: CREDIT to destination account
- Both rows share a transfer reference id.
- Transfers must **not** affect net worth (only move funds between accounts).

### 10.3 Credit Card Billing Clarifications

Add missing behavior details:

- Billing cycle start/end date
- Statement due date
- Minimum due amount
- Late fee handling
- Definition of `Credit Used`:
  - either current cycle spend
  - or rolling outstanding

### 10.4 Loan Repayment Clarifications

Split loan payment into:

- Principal component (reduces liability)
- Interest component (expense category)

This ensures correct net worth and reporting.

### 10.5 Data Integrity & Concurrency

Add backend safeguards:

- Idempotency key for account create/update actions
- Duplicate submit protection (client + server)
- Optimistic locking or updated-at check for concurrent edits

### 10.6 Performance & Pagination

For scale readiness:

- Paginate account detail transaction list
- Keep home summary query lightweight (aggregated endpoint)
- Lazy-load extended account insights

### 10.7 Security & Privacy UX

Optional but high-value:

- Toggle to hide/show balances on home and account screens
- App lock (PIN/biometric)
- Masked account labels in sensitive contexts

### 10.8 Acceptance Test Matrix (Recommended)

For each major story, add Given/When/Then test cases:

- Account creation validations (type-specific fields)
- Opening balance lock behavior
- Delete blocked by pending upcoming payments
- Reorder persistence across app relaunch
- Personal vs Family data isolation
- Transfer neutrality in net worth

---

## 11. Implementation Enhancements (Standardized)

This section aligns Accounts module execution with the same release discipline used in Categories and Transactions docs.

### 11.1 Scope Phasing

**MVP**
- Add/Edit/Delete account (with existing guard rules)
- Accounts list grouping (Assets/Liabilities)
- Home balance summary + account detail balance card
- Reorder accounts with persisted `accountOrder`

**Phase-2**
- Family view grouping by member
- Account insights (monthly trend, credit utilization trend)
- Archive/unarchive lifecycle UX (if enabled)

### 11.2 Data Integrity Rules (Backend Enforcement)

- Opening balance immutability after first transaction should be enforced in API layer (not only UI).
- Account type immutability after creation should be enforced in API layer.
- Deletion guard checks should execute in strict order:
  1) pending/overdue upcoming payments (block)
  2) transactions existence (warning path/archive path)
  3) finalize delete/archive

### 11.3 Balance Semantics Contract

To avoid downstream reporting inconsistencies, define one source of truth:

- `currentBalance` = opening + ledger net
- `pendingUpcoming` = sum of linked pending + overdue upcoming items
- `availableBalance` = `currentBalance - pendingUpcoming`

All clients (Home, Accounts, Upcoming, Budget) should use these server-calculated values, not local recomputation.

### 11.4 Performance & Query Strategy

- Add lightweight summary endpoint for Home (`net worth + account cards`) to reduce over-fetching.
- Paginate account detail transaction previews when history grows.
- Index recommendations:
  - `accounts(user_id, account_order)`
  - `transactions(account_id, transacted_at desc)`
  - `upcoming_payments(account_id, status, due_date)`

### 11.5 Testing Release Gate

Minimum automated checks before release:

**API**
- opening balance cannot change after first transaction
- account type cannot change
- delete blocked when pending upcoming exists
- reorder persists and remains user-scoped

**UI/E2E**
- add account flows for all account types
- credit card fields validation
- loan outstanding behavior in net worth
- reorder persistence after app relaunch
