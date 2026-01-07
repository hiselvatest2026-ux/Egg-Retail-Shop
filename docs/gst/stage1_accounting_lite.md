# Stage 1 (Accounting‑lite) — the “stop using Tally daily” scope

You chose **Stage 1**. This stage adds just enough accounting so a business can run daily entries and see **P&L** without opening Tally.

---

## 1) What Stage 1 includes (feature list)

### A) Masters
- Chart of Accounts (COA)
  - Provide templates: Trading / Service (start with these two)
- Party masters
  - Customers
  - Suppliers
- (Optional) Simple “expense categories” (mapped to COA)

### B) Vouchers (minimal set)
- **Sales voucher** (GST invoice)
- **Purchase voucher**
- **Receipt voucher** (customer payment)
- **Payment voucher** (supplier payment / expenses)
- **Journal voucher** (adjustments)

### C) Auto-posting (double-entry rules)
When a user creates a voucher, the system automatically creates ledger postings:
- Sales:
  - Dr Debtors
  - Cr Sales (income)
  - Cr Output GST (IGST/CGST/SGST)
- Purchase:
  - Dr Purchases/Expense (or Inventory-lite later)
  - Dr Input GST (IGST/CGST/SGST)
  - Cr Creditors
- Receipt:
  - Dr Bank/Cash
  - Cr Debtors
- Payment:
  - Dr Creditors / Expense
  - Cr Bank/Cash
- Journal:
  - free-form Dr/Cr lines with validation (sum Dr == sum Cr)

### D) Reports (must-have)
- **Profit & Loss** (by month + date range)
- Trial balance (basic)
- Ledger report (per account / per party)
- Outstanding receivables/payables + ageing
- Daybook (voucher list by date)

### E) Migration / switching support
- Import:
  - Customers/Suppliers list
  - Opening balances for parties and key ledgers
  - (Optional) last 3–6 months vouchers via template

### F) UX (what makes Tally users accept it)
- Fast entry screens
- Bulk import + bulk edit
- Keyboard shortcuts (later, but plan for it)

---

## 2) What Stage 1 does NOT include (keeps scope under control)
- Advanced inventory (stock valuation, batch/serial, godown)
- Manufacturing/job-work
- Payroll
- Cost centers/projects
- Complex year-end features (can be basic “close year” later)

---

## 3) How Stage 1 connects to GST features
The accounting vouchers can become the **source of truth** for GST:
- Sales vouchers feed GSTR-1 preparation
- Purchase vouchers feed ITC and reconciliation
- Payment/receipt vouchers improve receivables/payables but don’t change GST directly

This is the best path to reduce dependence on Tally.

---

## 4) Success criteria for Stage 1
Businesses can do these without Tally:
- Enter sales and purchases daily
- Track who owes money (receivables) and whom they need to pay (payables)
- See P&L for the month
- Prepare/file GST from the same data

