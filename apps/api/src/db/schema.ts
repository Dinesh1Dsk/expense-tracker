import {
  pgTable, uuid, text, integer, boolean,
  timestamp, pgEnum, date
} from 'drizzle-orm/pg-core'

export const accountTypeEnum = pgEnum('account_type', [
  'cash',
  'bank',
  'wallet',
  'credit_card',
  'savings',
  'loan',
])
export const transactionTypeEnum = pgEnum('transaction_type', ['DEBIT', 'CREDIT'])
export const upcomingPaymentTypeEnum = pgEnum('upcoming_payment_type', ['one_time', 'recurring', 'emi'])
export const upcomingPaymentStatusEnum = pgEnum('upcoming_payment_status', ['pending', 'paid', 'overdue'])
export const goalTypeEnum = pgEnum('goal_type', ['emergency_fund', 'goal'])
export const familyRoleEnum = pgEnum('family_role', ['owner', 'member'])

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull(),
  inviteToken: text('invite_token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  familyId: uuid('family_id').references(() => families.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const familyMembers = pgTable('family_members', {
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').notNull().references(() => families.id),
  role: familyRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: accountTypeEnum('type').notNull(),
  openingBalance: integer('opening_balance').notNull().default(0),
  accountOrder: integer('account_order').notNull().default(0),
  color: text('color'),
  institutionName: text('institution_name'),
  creditLimit: integer('credit_limit'),
  outstandingBalance: integer('outstanding_balance'),
  isArchived: boolean('is_archived').notNull().default(false),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color').notNull().default('#1D9E75'),
  type: text('type').notNull().default('expense'),
  sortOrder: integer('sort_order').notNull().default(0),
  parentCategoryId: uuid('parent_category_id'),
  isSystem: boolean('is_system').default(false),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').references(() => families.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  amount: integer('amount').notNull(),
  type: transactionTypeEnum('type').notNull(),
  note: text('note'),
  isReversal: boolean('is_reversal').notNull().default(false),
  referenceId: uuid('reference_id'),
  transferGroupId: uuid('transfer_group_id'),
  transactedAt: timestamp('transacted_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').references(() => families.id),
  categoryId: uuid('category_id').references(() => categories.id),
  month: text('month').notNull(),
  monthlyLimit: integer('monthly_limit').notNull(),
  dailyLimit: integer('daily_limit'),
  weeklyLimit: integer('weekly_limit'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const salaries = pgTable('salaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  grossAmount: integer('gross_amount').notNull(),
  pfDeduction: integer('pf_deduction').notNull().default(0),
  taxDeduction: integer('tax_deduction').notNull().default(0),
  otherDeductions: integer('other_deductions').notNull().default(0),
  payDay: integer('pay_day').notNull(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  effectiveFrom: date('effective_from').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

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
  recurrenceDay: integer('recurrence_day'),
  emiTotalMonths: integer('emi_total_months'),
  emiPaidMonths: integer('emi_paid_months').default(0),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: goalTypeEnum('type').notNull(),
  targetAmount: integer('target_amount').notNull(),
  savedAmount: integer('saved_amount').notNull().default(0),
  deadline: date('deadline'),
  accountId: uuid('account_id').references(() => accounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
