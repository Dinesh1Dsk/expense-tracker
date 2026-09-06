# Categories Module — UX/UI Design Requirements

**Project:** Expense Tracker (Personal + Family)
**Module:** Categories
**Version:** 1.0
**Date:** April 22, 2026
**Platform:** Android + iOS (React Native / Expo)

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [System Categories — Pre-loaded Data](#2-system-categories--pre-loaded-data)
3. [User Stories](#3-user-stories)
4. [User Flows](#4-user-flows)
5. [Screen Specifications](#5-screen-specifications)
   - 5.1 Categories List Screen (Settings)
   - 5.2 Add Category Screen
   - 5.3 Edit Category Screen
   - 5.4 Category Picker Bottom Sheet (Transaction Entry)
6. [Component Specifications](#6-component-specifications)
7. [UX Writing](#7-ux-writing)
8. [Business Logic Rules](#8-business-logic-rules)
9. [DB Schema Notes](#9-db-schema-notes)
10. [Accessibility Notes](#10-accessibility-notes)

---

## 1. Module Overview

| Field | Detail |
|-------|--------|
| Module Purpose | Manage expense and income categories with subcategories. Used in transaction entry, budget limits, and reports. |
| Entry Points | Settings → Categories (management), Transaction entry → Category field (picker) |
| Exit Points | Settings screen, Add Transaction screen |
| Platforms | Android + iOS (React Native / Expo) |
| Auth Required | Yes |
| Type | Support module — serves Transactions, Budget, Reports |

**Category types:**
- **Expense** — debit transactions (Food, Transport, Shopping etc.)
- **Income** — credit transactions (Salary, Freelance, Rental etc.)
- **Both** — applicable for both (e.g. Transfers, Adjustments)

**Category levels:**
- **Parent category** — top-level (e.g. Food & Dining)
- **Subcategory** — one level under parent (e.g. Groceries, Dining Out)
- Max depth: 1 level only (Category → Subcategory)

**System vs Custom:**
- **System categories** — pre-loaded, fixed, cannot be edited or deleted
- **Custom categories** — user created, fully editable and deletable

**Subcategory rules:**
- Subcategories inherit parent's icon and color
- Subcategories can only be created under a parent (not under another subcategory)
- System parent → user can add subcategories under it
- Custom parent → user can add subcategories under it

---

## 2. System Categories — Pre-loaded Data

### Expense Categories

| Icon | Name | Suggested Subcategories (user creates) |
|------|------|----------------------------------------|
| 🍽️ | Food & Dining | Groceries, Dining Out, Swiggy/Zomato, Snacks |
| 🚗 | Transport | Fuel, Auto/Cab, Bus/Train, Vehicle Maintenance |
| 🛍️ | Shopping | Clothing, Electronics, Online Shopping, Household |
| 🎬 | Entertainment | Movies, OTT Subscriptions, Events, Games |
| 💊 | Health & Medical | Doctor, Medicines, Lab Tests, Gym |
| 📚 | Education | School Fees, Books, Courses, Stationery |
| 💡 | Utilities | Electricity, Water, Gas, Internet, Mobile Recharge |
| 🏠 | Housing | Rent, Maintenance, Home Repairs, Furniture |
| ✈️ | Travel | Hotels, Flights, Holidays, Visa |
| 👨‍👩‍👧 | Family & Kids | Baby Products, Toys, School Supplies |
| 🎁 | Gifts & Donations | Gifts, Charity, Religious |
| 📦 | Others | Miscellaneous |

### Income Categories

| Icon | Name | Suggested Subcategories (user creates) |
|------|------|----------------------------------------|
| 💰 | Salary | Basic Pay, Bonus, Incentive, Arrears |
| 💻 | Freelance | Project Payment, Consulting |
| 🏘️ | Rental Income | House Rent, Shop Rent |
| 📈 | Investment Returns | Dividends, FD Interest, MF Returns |
| 🎁 | Gifts Received | Cash Gift, Festival Gift |
| 📦 | Other Income | Refunds, Cashback, Miscellaneous |

### Both (Expense + Income)

| Icon | Name |
|------|------|
| 🔄 | Transfer |
| ⚖️ | Adjustment |

---

## 3. User Stories

### Primary — Happy Path

> As a user, I want to see all my expense and income categories in Settings so that I can manage and customise them.

> As a user, I want to create a custom category "Pet Care" under Expense with a 🐾 icon and pink color so that I can track my pet expenses separately.

> As a user, I want to add a subcategory "Groceries" under "Food & Dining" so that I can track grocery spends separately from dining out.

> As a user, when adding a transaction, I want a bottom sheet category picker with search so that I can quickly find and select the right category.

> As a user, I want to see my recently used categories at the top of the picker so that I don't have to scroll every time.

### Edge Cases

> As a user, I want to be prevented from deleting a category that has existing transactions so that my transaction history stays intact.

> As a user, I want system categories to be clearly marked as locked so that I don't try to edit them and get confused.

> As a user, when I search "food" in the category picker, I want to see both "Food & Dining" and its subcategories in the results so that I can select the right level.

> As a user creating a subcategory, I want the icon and color to automatically match the parent so that the visual hierarchy is clear.

> As a user, I want to see an empty state when I have no custom categories so that I understand I can add my own.

### Android-Specific

> As an Android user, I want a FAB (+) button on the Categories screen to add a new category.

> As an Android user, I want to long-press a custom category to reveal Edit and Delete options.

### iOS-Specific

> As an iOS user, I want to swipe left on a custom category row to reveal Edit and Delete actions.

> As an iOS user, I want the (+) button in the top-right navigation bar to add a new category.

---

## 4. User Flows

### 4.1 View Categories Flow

```
Settings
  → Tap "Categories"
  → Categories List Screen
  → Default tab: Expense
  → Tap "Income" tab → switch to income categories
  → Tap parent category → expand / collapse subcategories
```

### 4.2 Add Custom Category Flow

```
Categories List Screen
  → Tap FAB (+) [Android] / (+) top right [iOS]
  → Add Category Screen
      → Select type: Expense | Income | Both
      → Select parent (optional — leave empty for top-level)
      → Tap icon from emoji grid → selected
      → Enter category name
      → Select color from color swatches
      → Tap "Save Category"
          ↓
  [Validation]
  ├── Name empty → "Please enter a category name"
  └── Valid →
        → Toast: "Category created"
        → Back to Categories List
        → New category visible in list
```

### 4.3 Add Subcategory (Inline) Flow

```
Categories List Screen
  → Tap parent category row → expands
  → Tap "+ Add subcategory" (inline under parent)
  → Inline text field appears
  → Type subcategory name
  → Tap "Add" / press return
      ↓
  [Validation]
  ├── Empty → field shakes, focus stays
  └── Valid →
        → Subcategory appears under parent
        → Inherits parent icon + color
        → Toast: "Subcategory added"
```

### 4.4 Edit Custom Category Flow

```
Categories List Screen
  → Long press [Android] / Swipe left [iOS] on custom category
  → Tap "Edit"
  → Edit Category Screen (pre-filled)
      → Change name / icon / color
      → Cannot change: type (expense/income/both), parent
      → Tap "Save Changes"
  → Toast: "Category updated"
  → Back to Categories List
```

### 4.5 Delete Category Flow

```
Categories List Screen
  → Long press [Android] / Swipe left [iOS] on custom category
  → Tap "Delete"
      ↓
  [Check: has transactions?]
  ├── Yes → Blocked dialog:
  │         "Cannot delete — this category has [X] transactions.
  │          You cannot delete a category with existing transactions."
  │         [OK]
  └── No →
      [Check: has subcategories?]
      ├── Yes → Warning dialog:
      │         "Deleting '[Name]' will also delete its [X] subcategories.
      │          Continue?"
      │         [Cancel] [Delete All]
      └── No → Confirmation dialog:
                "Delete '[Name]'? This cannot be undone."
                [Cancel] [Delete]
              → Toast: "Category deleted"
              → Removed from list
```

### 4.6 Category Picker Flow (Transaction Entry)

```
Add Transaction Screen
  → Tap "Category" field
  → Category Picker Bottom Sheet slides up
      ├── Search bar (auto-focused)
      ├── Recent row: last 5 used categories
      └── Grouped expandable list
              ↓
  [If typing in search]
  → Flat filtered list: "Food > Groceries", "Food & Dining" etc.
  → Tap result → selected, sheet closes
              ↓
  [If browsing list]
  → Tap parent → expands subcategories
  → Tap subcategory → selected, sheet closes
  → Tap parent directly (without expanding) → long tap selects parent
              ↓
  → Selected category shown in transaction form
  → Sheet dismissed
```

---

## 5. Screen Specifications

---

### 5.1 Categories List Screen

| Property | Detail |
|----------|--------|
| Purpose | View, manage all system and custom categories |
| Entry | Settings → Categories |
| Route | `/settings/categories` |
| Access | Authenticated users |

#### Layout Description

**Header:**
- Android: Back arrow + "Categories" title + (+) FAB bottom right
- iOS: Back chevron + "Categories" (centered) + (+) top right

**Tab bar (below header):**
- Two tabs: "Expense" | "Income"
- Default: Expense tab active
- Tab indicator: teal underline

**Category list (Expense tab):**

Grouped into two sections:

**Section 1 — System Categories** (header: "Default Categories")
- Each row: icon (colored) + category name + lock icon (right)
- Tap row → expand/collapse subcategories
- Subcategory rows: indented, smaller text, inherited icon
- Under each parent: "+ Add subcategory" inline option (last row of expanded group)
- System rows: no swipe / long press actions

**Section 2 — My Categories** (header: "My Categories")
- Each row: icon (colored) + category name + subcategory count badge
- Tap row → expand/collapse subcategories
- Android: long press → Edit | Delete context menu
- iOS: swipe left → Edit (blue) | Delete (red)
- Under each parent: "+ Add subcategory" inline option
- Empty state (no custom categories): "No custom categories yet. Tap + to add one."

**Income tab:**
- Same layout, income system categories + user income categories

---

### 5.2 Add Category Screen

| Property | Detail |
|----------|--------|
| Purpose | Create a new custom category or subcategory |
| Route | `/settings/categories/new` |
| UI | Full screen form |
| Access | Authenticated users |

#### Layout Description

**Header:**
- Android: Back arrow + "Add Category"
- iOS: "Cancel" (left) + "Add Category" (centered) + "Save" (right, disabled until valid)

**Form:**

**Field 1 — Type (required)**
- Label: "Category Type"
- Segmented control: "Expense" | "Income" | "Both"
- Default: Expense

**Field 2 — Parent Category (optional)**
- Label: "Parent Category"
- Sub-label: "Leave empty to create a top-level category"
- Dropdown / picker — shows existing parent categories of selected type
- If selected: this becomes a subcategory (icon + color auto-inherited, fields disabled)
- If empty: this is a top-level category

**Field 3 — Icon (required)**
- Label: "Icon"
- Emoji grid: 4 columns, scrollable
- Pre-selected: first emoji in grid
- Selected state: teal border + teal background tint
- Disabled + auto-filled when parent is selected

**Field 4 — Category Name (required)**
- Label: "Category Name"
- Text input
- Placeholder: "e.g. Pet Care, Side Income"
- Max: 30 characters
- Character counter: "0/30" (shown after 20 chars)
- Error: "Please enter a category name"

**Field 5 — Color (required)**
- Label: "Color"
- Horizontal swatch row: 8 colors
- Default: first color (teal)
- Disabled + auto-filled when parent is selected

**Bottom:**
- "Save Category" button — full width, teal, disabled until name filled

---

### 5.3 Edit Category Screen

| Property | Detail |
|----------|--------|
| Purpose | Edit name, icon, or color of a custom category |
| Route | `/settings/categories/:id/edit` |
| UI | Full screen form |
| Access | Owner only (custom categories) |

#### Layout Description

Same as Add Category Screen with these differences:

- Header title: "Edit Category"
- **Type field: disabled** — cannot change after creation
- **Parent field: disabled** — cannot change after creation
- Pre-filled with current values
- If subcategory: icon + color shown as inherited (read-only)
- Bottom button: "Save Changes"
- "Created on [date]" shown below form in muted text

---

### 5.4 Category Picker Bottom Sheet

| Property | Detail |
|----------|--------|
| Purpose | Select a category when adding or editing a transaction |
| Trigger | Tapping "Category" field on Add/Edit Transaction screen |
| UI | Bottom sheet (slides up, 75% screen height, draggable) |
| Dismiss | Tap outside or drag down |

#### Layout Description

**Handle bar:** small pill at top center (drag indicator)

**Header row:**
- Title: "Select Category"
- Close (X) button right

**Search bar:**
- Auto-focused when sheet opens
- Placeholder: "Search categories…"
- Clears on tap X inside field
- Results update live as user types

**Recent Categories row** (shown when search is empty):
- Label: "Recent" (small, muted)
- Horizontal scroll row of up to 5 recent category chips
- Each chip: icon + name, teal border
- Tap chip → select immediately, sheet closes

**Grouped list** (shown when search is empty):

Two sections — Expense | Income (based on transaction type being added):
- If adding expense → show expense + both categories
- If adding income → show income + both categories

Each parent row:
- Icon (colored) + Name + chevron right (▶ collapsed / ▼ expanded)
- Tap → expands to show subcategories
- Long tap → selects parent category directly

Each subcategory row (indented):
- Inherited icon (smaller) + Name
- Tap → select, sheet closes

**Search results** (shown when typing):
- Flat list, no grouping
- Each row: icon + "Parent Name > Subcategory Name" or just "Parent Name"
- Highlight matched text in teal
- No results: "No categories found for '[search term]'" + "Add as new category" link

**No category option:**
- Bottom of list: "None / Uncategorized" option
- Muted, italic

---

## 6. Component Specifications

### 6.1 Category Row (List)

Used on: Categories List Screen

| Property | Detail |
|----------|--------|
| Height | 52px (parent), 44px (subcategory) |
| Left | Colored icon circle (32px) |
| Middle | Category name (16px bold for parent, 14px for subcategory) |
| Right | Lock icon (system) or chevron + subcategory count (custom parent) |

**States:**

| State | Appearance |
|-------|------------|
| Default | White background |
| Pressed | Light gray background (#F3F4F6) |
| Expanded | Teal left border (2px) |
| Subcategory row | Indented 20px, lighter text |

---

### 6.2 Inline Add Subcategory Row

Used on: Categories List Screen (expanded parent)

| Property | Detail |
|----------|--------|
| Appearance | Dashed border row, "+ Add subcategory" in teal |
| Tap | Text field appears inline, keyboard opens |
| Field | Single line text, "Subcategory name…" placeholder |
| Actions | "Add" button (teal) + "Cancel" link |
| On add | Row inserts above inline field, field clears for another |

---

### 6.3 Emoji Icon Grid

Used on: Add / Edit Category Screen

| Property | Detail |
|----------|--------|
| Layout | 4 columns, scrollable vertically |
| Cell size | 52×52px |
| Icon size | 28px emoji |
| Selected | Teal border (2px) + teal background tint (#E1F5EE) |
| Rows shown | 3 rows visible, scroll for more |

**Emoji set (suggested — 40 icons):**
🍽️ 🍕 🛒 🚗 🚌 ✈️ 🛍️ 👗 💊 🏥 📚 🎓 💡 🏠 🎬 🎮 💰 💻 🏘️ 📈 🎁 👶 🐾 ⚽ 🎵 📱 💳 🔄 ⚖️ 🌿 ☕ 🏋️ 💈 🔧 🚿 🌙 🎉 🧴 🧹 📦

---

### 6.4 Color Swatch Row

Used on: Add / Edit Category Screen

| Property | Detail |
|----------|--------|
| Layout | Horizontal scroll row |
| Swatch size | 36×36px circular |
| Count | 8 colors |

| Color | Hex |
|-------|-----|
| Teal | #1D9E75 |
| Blue | #378ADD |
| Amber | #BA7517 |
| Coral | #D85A30 |
| Purple | #7F77DD |
| Pink | #D4537E |
| Green | #639922 |
| Gray | #888780 |

**Selected state:** White checkmark in center of swatch

---

### 6.5 Category Chip (Recent Row)

Used on: Category Picker Bottom Sheet

| Property | Detail |
|----------|--------|
| Shape | Rounded pill |
| Content | Icon (16px) + category name |
| Border | 1px teal (#1D9E75) |
| Background | Light teal (#E1F5EE) |
| Text | Teal (#0F6E56), 13px |
| Max width | 120px, truncate with ellipsis |

---

### 6.6 Category Search Result Row

Used on: Category Picker Bottom Sheet (search mode)

| Property | Detail |
|----------|--------|
| Left | Colored icon circle (28px) |
| Text | "Parent > Subcategory" or "Parent" — 14px |
| Highlight | Matched text in teal, bold |
| Right | Type badge: "Expense" / "Income" / "Both" (small pill) |

---

## 7. UX Writing

### Categories List Screen

| Element | Text |
|---------|------|
| Screen title | Categories |
| Section header (system) | Default Categories |
| Section header (custom) | My Categories |
| Lock tooltip | System category — cannot be edited |
| Empty state heading | No custom categories yet |
| Empty state subtext | Add your own categories to better track your spending. |
| Empty state CTA | Add Category |
| Tab: expense | Expense |
| Tab: income | Income |

### Add Category Screen

| Element | Text |
|---------|------|
| Screen title | Add Category |
| Type label | Category Type |
| Parent label | Parent Category |
| Parent sub-label | Leave empty to create a top-level category |
| Icon label | Icon |
| Name label | Category Name |
| Name placeholder | e.g. Pet Care, Side Income |
| Name error | Please enter a category name |
| Name max error | Category name must be under 30 characters |
| Color label | Color |
| CTA button | Save Category |
| Success toast | Category created |
| Subcategory note | Icon and color are inherited from parent category |

### Edit Category Screen

| Element | Text |
|---------|------|
| Screen title | Edit Category |
| CTA button | Save Changes |
| Success toast | Category updated |
| Type disabled note | Category type cannot be changed |
| Parent disabled note | Parent category cannot be changed |

### Delete Flow

| Element | Text |
|---------|------|
| Blocked title | Cannot Delete Category |
| Blocked body | '[Name]' has [X] transactions. You cannot delete a category with existing transactions. |
| Blocked button | OK |
| Subcategory warning title | Delete Category? |
| Subcategory warning body | Deleting '[Name]' will also delete its [X] subcategories. This cannot be undone. |
| Subcategory warning cancel | Cancel |
| Subcategory warning confirm | Delete All |
| Simple confirm title | Delete Category? |
| Simple confirm body | Are you sure you want to delete '[Name]'? This cannot be undone. |
| Simple confirm cancel | Cancel |
| Simple confirm confirm | Delete |
| Success toast | Category deleted |

### Inline Add Subcategory

| Element | Text |
|---------|------|
| Add row label | + Add subcategory |
| Input placeholder | Subcategory name… |
| Add button | Add |
| Cancel link | Cancel |
| Success toast | Subcategory added |
| Empty error | Please enter a name |

### Category Picker Bottom Sheet

| Element | Text |
|---------|------|
| Sheet title | Select Category |
| Search placeholder | Search categories… |
| Recent label | Recent |
| No results heading | No categories found |
| No results subtext | No results for '[search term]' |
| No results CTA | Add as new category |
| No category option | None / Uncategorized |
| Loading | Loading categories… |

---

## 8. Business Logic Rules

### Category Type
- Expense categories — only appear when adding a DEBIT transaction
- Income categories — only appear when adding a CREDIT transaction
- Both — appear for all transaction types

### Subcategory Rules
- Max 1 level deep — no subcategory under a subcategory
- Subcategory inherits parent's icon and color (not editable on subcategory)
- Subcategory type = parent type (auto-assigned, not selectable)
- System parent categories can have user-created subcategories
- Subcategory count shown on parent row

### Delete Rules
- **Blocked:** category has any transactions linked (system or custom)
- **Warning:** category has subcategories — show count, confirm bulk delete
- **Free delete:** no transactions, no subcategories
- Deleting parent → deletes all its subcategories (cascade)
- Subcategory with transactions → individually blocked

### System Categories
- `isSystem: true` in DB — locked from edit and delete
- User cannot rename, recolor, or change icon
- User can add subcategories under system parents
- System categories always appear above custom categories in list

### Recent Categories
- Track last 5 distinct categories used in transactions (per user)
- Stored in local state / async storage — no API call needed
- Updated every time a transaction is saved

### Search Behaviour
- Search matches on: category name, subcategory name
- Results show: matching parent + all its subcategories, or matching subcategory with parent name prefix
- Minimum 1 character to trigger search
- Case insensitive

### Budget Link
- Categories used in budget module (category-wise limits)
- If a category is used in an active budget, show "Used in budget" badge on category row
- Cannot delete category linked to active budget — show blocked message

---

## 9. DB Schema Notes

Current schema needs one addition — `parentId` field:

```sql
-- Add to categories table
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN type VARCHAR CHECK (type IN ('expense', 'income', 'both')) DEFAULT 'expense';
ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
```

**Full categories table:**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| userId | uuid | null = system category |
| parentId | uuid | null = top-level, uuid = subcategory |
| name | text | Category name |
| icon | text | Emoji character |
| color | text | Hex color code |
| type | enum | 'expense' \| 'income' \| 'both' |
| isSystem | boolean | true = locked, false = user created |
| sortOrder | integer | Display order |
| isHidden | boolean | Soft hide (future use) |

**Drizzle schema update:**
```ts
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  parentId: uuid('parent_id'),  // self-reference — add after table definition
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📦'),
  color: text('color').notNull().default('#1D9E75'),
  type: text('type').notNull().default('expense'), // 'expense' | 'income' | 'both'
  isSystem: boolean('is_system').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**API routes needed:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/categories` | List all (system + user), grouped by type |
| GET | `/categories?type=expense` | Filter by type |
| POST | `/categories` | Create custom category or subcategory |
| PATCH | `/categories/:id` | Edit custom category |
| DELETE | `/categories/:id` | Delete (if no transactions) |
| GET | `/categories/recent` | Last 5 used categories for picker |

---

## 10. Accessibility Notes

| Requirement | Detail |
|-------------|--------|
| Touch targets | All category rows minimum 44px height |
| Screen reader | Category row reads: "[Icon] [Name], [type], [system/custom]" |
| Lock icon | Accessible label: "System category, cannot be edited" |
| Subcategory indent | Screen reader announces "Subcategory of [Parent Name]" |
| Color swatches | Each swatch has accessible label: "[Color name], selected/not selected" |
| Emoji grid | Each emoji cell has accessible label: "[Emoji description]" |
| Search field | Accessible label: "Search categories" |
| Bottom sheet | Focus moves to sheet when opened; returns to trigger when closed |
| Expand/collapse | Announce state: "[Category name], expanded/collapsed, [X] subcategories" |
| Delete confirmation | Focus moves to dialog; trap focus inside until dismissed |
| iOS | Support Dynamic Type for all text |
| Android | Support TalkBack content descriptions on all interactive elements |

---

## 11. Implementation Enhancements (Recommended)

This section adds delivery safeguards so Categories can ship reliably with Transactions/Budget dependencies.

### 11.1 Scope Phasing

**MVP**
- Categories management list (system + custom)
- Create parent and subcategory
- Edit custom category (respect immutable fields)
- Delete guard rails (transactions/budget/subcategories)
- Category picker with search + recent

**Phase-2**
- Full inline validation animations (shake/focus retention)
- Advanced accessibility announcements (expanded/collapsed, inherited markers)
- Reorder/sort management UI for custom categories

### 11.2 Data Integrity & Constraint Hardening

- Enforce max depth = 1 in backend (reject subcategory-of-subcategory attempts).
- Enforce parent inheritance in backend:
  - subcategory `type = parent.type`
  - subcategory `icon/color` derived from parent
- Restrict system category mutation:
  - block patch/delete where `is_system = true`
- Add unique constraint per scope/type/parent for clean naming:

```sql
-- Example (case-insensitive) uniqueness for user-owned categories
CREATE UNIQUE INDEX IF NOT EXISTS uniq_categories_user_parent_type_name
  ON categories (COALESCE(user_id::text, 'system'), COALESCE(parent_category_id::text, 'root'), type, lower(name));
```

### 11.3 Search & Picker Behavior Contract

Define exact picker behavior to avoid ambiguity:

- Search triggers at 1+ char, case-insensitive.
- Results include:
  - parent match + children context
  - direct subcategory match with parent prefix (`Parent > Subcategory`)
- In DEBIT transaction mode: show `expense + both`
- In CREDIT transaction mode: show `income + both`

### 11.4 Delete Semantics (Deterministic)

Deletion checks should execute in this order:
1) linked transactions (block)
2) linked active budgets (block)
3) has subcategories:
   - if any subcategory has transactions/budget links -> block
   - else require "Delete All" confirmation and cascade delete
4) no links/no children -> simple confirm delete

### 11.5 Performance & Indexing

Recommended indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_categories_user_type_parent_sort
  ON categories(user_id, type, parent_category_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_system_type
  ON categories(is_system, type);
```

For frequent name search:

```sql
-- Optional, if scale demands fuzzy search
CREATE INDEX IF NOT EXISTS idx_categories_name_lower
  ON categories (lower(name));
```

### 11.6 Testing Release Gate

**API**
- create parent vs create subcategory inheritance
- block edit/delete for system categories
- block delete when linked transactions exist
- block delete when linked budgets exist
- cascade delete only when safe

**UI/E2E**
- expense/income tab switching
- inline subcategory add flow + validation
- iOS swipe and Android long-press action parity
- picker search/recent/select and no-result state
