# UAT Matrix

## Auth
- Register with valid input -> success
- Register with duplicate email -> conflict
- Login with valid credentials -> success
- Login with invalid credentials -> error

## Accounts
- Create account (all supported types)
- Edit mutable fields
- Delete blocked when pending upcoming payments exist
- Archive account and ensure it disappears from active lists
- Reorder accounts and verify persistence

## Transactions
- Create debit and credit transactions
- Filter by account and month
- Reverse transaction and verify balance neutrality
- Transfer between accounts and verify net worth neutrality

## Budget
- Create monthly budget for category
- Update existing monthly budget
- Verify spent/remaining/percent calculations

## Salary
- Create salary configuration
- Verify computed net value in response

## Upcoming Payments
- Create one-time payment
- Create recurring payment and mark paid (next generated)
- Create EMI and mark paid (next generated until total months)

## Family
- Create family
- Fetch invite token
- Join via token
- View family dashboard member summary

## Reports
- Monthly summary returns income/expense/savings
- Category summary returns grouped totals

## Goals
- Create goal
- Update goal progress
- Verify saved amount reflects in list

## Notifications
- Grant permission
- Schedule reminder
- Open notification and confirm app opens correctly
