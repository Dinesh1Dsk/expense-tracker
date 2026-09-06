# Play Store listing copy (V1)

Ready-to-paste text for Play Console. Matches **offline V1** of **Expense Tracker** (`com.dineshkumar.expensetracker`, version `1.0.0`).

Do not invent features. If a later build adds cloud, login, or family, rewrite this file before you publish that build.

Build and privacy-URL steps stay in [PLAY_STORE.md](PLAY_STORE.md).

---

## Store listing identity

| Play field | Value |
| --- | --- |
| App name | `Expense Tracker` (30-character limit; this is 15) |
| Package name | `com.dineshkumar.expensetracker` |
| Default language | English (India) — `en-IN` |
| App category | Finance |
| Tags (optional) | expense tracker, budget, INR, offline |
| Contact email | Replace `dinesh@example.com` before publish |
| Privacy policy URL | Public HTTPS URL of [privacy-policy.md](privacy-policy.md) (see [PLAY_STORE.md](PLAY_STORE.md)) |

---

## 1. Short description

Play limit: **80 characters**. Count includes spaces and punctuation.

```
Personal offline INR tracker. No cloud. Data stays on this phone.
```

Character count: **65**.

Backup if you want “expense” in the first line (72 characters):

```
Track INR expenses offline. Accounts, budgets, reports. No cloud backup.
```

---

## 2. Full description

Play limit: **4000 characters**. Paste the block below as-is.

```
Expense Tracker is a personal, offline money tracker for Indian rupees (INR). Version 1.0.0 keeps your ledger on this phone. There is no account server, no login or password, and no cloud backup.

WHAT YOU CAN DO

• Start with a display name only. No email or password.
• Add accounts you actually use: cash, bank, wallet, credit card, savings, and loan. Set an opening balance.
• See available balance on Home. Available balance is current balance minus pending upcoming payments.
• Record income and expenses with account, category, amount, date, and optional note. Amounts are shown in INR.
• Reverse a mistake. V1 does not edit or delete a posted transaction; it adds a reversal entry so the ledger stays complete.
• Manage categories from Settings.
• Set a monthly budget limit per category and see how much you have used.
• Track upcoming payments: one-time, recurring, and EMI. Mark paid, skip, or remove. Home shows upcoming items for the current month.
• Optional local reminders for due dates you set. These are scheduled on the device. You can refuse notification permission; the rest of the app still works.
• Open Reports for a month: income, expense, savings (income minus spend), and totals by category.
• Export a JSON copy of this device’s data from Settings (you choose where to save or share it).
• Erase all local data from Settings (two confirms). Uninstalling the app also removes local data.

WHAT STAYS ON THE DEVICE

Your display name, accounts, categories, transactions, budgets, and upcoming payments are saved in a local file on this phone. V1 does not upload that file to a backend we run. There is no cloud copy for us to restore if you lose the phone, erase data, or uninstall.

If you use Export, you create the copy. We do not upload it. If you send that file to another app or person, their rules apply.

WHAT THIS VERSION DOES NOT DO

V1 is personal and offline. It does not sync a family, back up to the cloud, connect to your bank, read SMS, import UPI statements, or use AI for reports. It does not create an online account.

WHO IT IS FOR

Anyone who wants a simple INR ledger on one phone, without signing in.
```

---

## 3. What’s new / release notes (1.0.0)

Play release-notes limit: **500 characters**.

```
1.0.0 — first public V1

Personal offline INR tracker. Data stays on this phone. No login, no cloud backup.

• Accounts with available balance (minus pending upcoming)
• Income and expenses; reverse mistakes instead of editing
• Monthly category budgets
• Upcoming: one-time, recurring, EMI, optional local reminders
• Monthly reports (income, expense, savings, by category)
• Export JSON or erase all local data in Settings
```

Shorter option if Play trims the field:

```
First release: personal offline INR tracker. Accounts, transactions (reverse, not edit), budgets, upcoming payments, monthly reports, export, and erase. No login or cloud backup. Data stays on this phone.
```

---

## 4. Data safety form answers

Play’s definition of **collected** is data the app **sends off the device**. On-device storage alone is not collection. V1 writes a local JSON file and a local session flag. It does not include an analytics, crash-reporting, or advertising SDK. Export only happens when the user starts it and uses the system share sheet.

Use these answers. Do not declare Financial information as “collected” unless a later build uploads it.

### Overview

| Question | Answer | Notes |
| --- | --- | --- |
| Does your app collect or share any of the required user data types? | **No** | Nothing is transmitted to a developer-operated server. Local JSON is on-device only. |
| Is data shared with third parties? | **No** | Do not list ad networks, analytics, or crash SDKs. V1 does not ship them. |
| Is all user data collected by the app encrypted in transit? | **Not applicable** | Shown only if you answered that you collect data. V1 does not collect, so skip. Do not invent HTTPS collection. |
| Can users request that their data is deleted? | **Yes** (if Play still asks) | Settings → **Erase all local data**, or uninstall. There is no cloud copy for the developer to delete. An export the user already saved is theirs to delete. |

### Financial information (do not add this data type)

| Topic | Answer |
| --- | --- |
| Financial info / purchase history / credit score / etc. | **Not collected.** The user may type account names, opening balances, and transactions. That stays on the device. The developer does not receive it. |
| If you accidentally added “Financial info” | Remove it, or set Collected = No and Shared = No. Prefer removing the type so the form matches “does not collect.” |

### Other data types (do not add)

| Type | Why not |
| --- | --- |
| Name | Display name is stored on-device only. Not collected. |
| Email / account credentials | V1 does not ask for email or password. |
| Location, contacts, photos, SMS, calendar | Not used. |
| App interactions / crash logs (developer) | No analytics or crash SDK in this V1 build. Google Play may still collect install/crash data under Google’s policies — that is Google’s collection, not yours. |
| Device or other IDs | Not collected by this app. |

### Approximate location of answers in Play Console

1. **App content → Data safety** → Start / edit questionnaire.
2. Overview: **Does your app collect or share any of the required user data types?** → **No**.
3. Save. Preview the Data safety section; it should say the app does not collect user data (wording varies).
4. **App content → Privacy policy** → paste the public HTTPS URL.
5. **App content → Account deletion** (separate form): the app **does not allow account creation**. Users erase local data in Settings or uninstall.

Google Play itself may show install and crash figures in Play Console. That is Play’s telemetry, not this app declaring collection.

---

## 5. Closed testing checklist

Do these in Play Console. None of them can be finished from this repo.

**If this is a personal developer account created after 13 November 2023**, Play requires a **closed** test (not internal) with **at least 12 testers opted in continuously for 14 days** before you can apply for production. Organization accounts and older personal accounts may skip that rule — trust what Play Console shows on your dashboard.

### A. One-time account and app

- [ ] Pay the Play Console developer registration fee (one-time, currently **US $25**).
- [ ] Create the app: name **Expense Tracker**, package **`com.dineshkumar.expensetracker`**, default language **en-IN**, category **Finance**.
- [ ] Complete App content declarations that apply (privacy policy, Data safety, target audience, news/COVID/ads/IAP as **No** where true). V1 has **no ads** and **no in-app products**.

### B. Privacy and Data safety (before testers)

- [ ] Host [privacy-policy.md](privacy-policy.md) on HTTPS ([PLAY_STORE.md](PLAY_STORE.md)).
- [ ] Replace `dinesh@example.com` in that hosted page if you want a real contact address.
- [ ] Play Console → App content → **Privacy policy** → paste the URL.
- [ ] Play Console → App content → **Data safety** → answers in section 4 above.

### C. Store listing draft (needed to start a track)

- [ ] Paste short description, full description, and (when you have a release) what’s new.
- [ ] Upload phone screenshots from the shot list below (Play needs **at least 2**).
- [ ] Upload icon / feature graphic if Console asks (app icon is already in `apps/mobile/assets/`; feature graphic is a separate 1024×500 Play asset you still have to export).
- [ ] Do not write claims from the **Do not claim** list.

### D. Upload the production AAB

- [ ] Finish Expo login + `eas init` + production keystore ([PLAY_STORE.md](PLAY_STORE.md)).
- [ ] Build: from `apps/mobile`, `pnpm dlx eas-cli build -p android --profile production` (or `pnpm run build:android`).
- [ ] Download the **`.aab`** from the Expo dashboard.
- [ ] Play Console → Testing → **Closed testing** → create a release → upload that AAB (`versionName` 1.0.0, `versionCode` 1).
- [ ] Do **not** upload a preview APK to Play. Play wants the production App Bundle.

### E. Testers

- [ ] Create an email list (or Google Group) of testers.
- [ ] Copy the **opt-in link** from the closed testing track. Testers must open that link and accept — being on the list is not enough.
- [ ] Testers install from Play (internal testing does **not** count toward the 12 / 14-day rule).
- [ ] Ask testers to walk the shot-list flows: start with a name, add an account, add a transaction, reverse it, set a budget, add an upcoming payment, open Reports, export, (optional) erase on a throwaway profile.
- [ ] Confirm: available balance subtracts pending upcoming; reverse does not edit the original row; erase returns to the welcome screen.
- [ ] Keep **12+ opted-in** testers for **14 consecutive days** if your account requires it. If someone opts out, the clock for that seat resets.
- [ ] Promote to **production only after testers say the build is OK**, and only after Play lets you **apply for production access** (new personal accounts).

### F. Production (after testers OK)

- [ ] Apply for production access if the dashboard still blocks it; answer Play’s questions honestly (offline personal tracker, closed-test feedback).
- [ ] Create a production release with the **same** AAB (or a newer versionCode if you rebuilt).
- [ ] Do not claim family, cloud, or bank features in the public listing.

---

## 6. Screenshot shot list

Capture on a real Android phone, portrait, dark theme, with **sample** data (not real bank balances). No status-bar secrets. Play phone screenshots: JPEG or 24-bit PNG, between 320px and 3840px on each side.

| # | Screen | What to show | Why |
| --- | --- | --- | --- |
| 1 | Welcome | “Your money stays on this phone” and name field — **no email/password** | Honest first impression |
| 2 | Home | Available balance + upcoming this month + quick actions | Core overview |
| 3 | Accounts | Two or three accounts (e.g. cash + bank) with balances | Account types exist |
| 4 | Add transaction | Amount, debit/credit, account, category | Main daily action |
| 5 | Transactions list | A few INR rows, filters visible if they fit | Ledger, not a bank feed |
| 6 | Transaction detail | Reverse action visible | Corrections are reversals |
| 7 | Budget | Monthly category limit and spent | Personal budgets only |
| 8 | Upcoming | One EMI or recurring row, pending/due | Upcoming module |
| 9 | Reports | One month: income, expense, savings, category bars | On-device totals, not AI |
| 10 | Settings | Export data + Erase all local data | Data control |

Minimum for a valid listing: **1, 2, 4, 9**. Prefer **2, 4, 7, 8, 9, 10**.

Do **not** screenshot a family share sheet, a login/password form, a bank-connect screen, or a cloud backup toggle — those screens do not exist in V1.

**Feature graphic** (Play: 1024 × 500): short line such as “Offline INR tracker — data stays on this phone.” Do not put “sync,” “AI,” or “bank connect” on it.

---

## 7. Do not claim

Do not put any of the following in the title, short description, full description, what’s new, screenshots, feature graphic, or Data safety notes.

| Do not claim | V1 reality |
| --- | --- |
| Family sync, shared wallet, family budgets | Personal only. Family is not shipped. |
| Cloud backup, Google Drive / iCloud sync, multi-device | Local JSON on one phone. Lose the phone or erase → data is gone unless the user exported. |
| Login, email, password, OTP, social sign-in | Display name only. |
| Bank connect, UPI collect, SMS/email import, automatic bank feed | User types amounts. No bank API. |
| Reports AI, insights engine, predictions | Monthly sums and category bars from the local ledger. |
| Goals, investments, net-worth dashboard | Not in V1. |
| Dedicated salary product | “Salary” is only a seeded **category**, not a payroll module. |
| Ads, subscriptions, in-app purchases | None in V1. |
| Developer collects financial data | On-device only; Play Data safety = does not collect. |
| Encrypted in transit / “bank-level encryption” | No network collection to encrypt. Do not claim a vault or E2E backup. |
| Push notifications from our servers | Local reminders only. |
| Works without storing anything | The app **does** store a local file; it does not send it to us. |

---

## After you paste

1. Preview the Play Store listing and Data safety section.
2. Re-read section 7 against every field and image.
3. Keep this file in sync if V1 behavior changes.
