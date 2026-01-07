# Tally gap & strategy — what to build if you want users to stop using Tally

Companies use Tally for much more than GST filing. If you want them to stop using Tally, you need either:
1) **Full accounting replacement** (big scope), or  
2) A **hybrid**: keep GST + compliance in your app, but add the *minimum accounting features* that remove the daily need for Tally.

---

## 1) Why companies keep Tally (what you’re competing with)

### A) Core accounting (the real reason)
- Ledgers + Chart of Accounts
- Vouchers: Sales, Purchase, Receipt, Payment, Journal, Contra
- Daybook + audit trail
- Trial balance, Balance sheet, **P&L**
- Outstanding receivables/payables, ageing
- Bank reconciliation

### B) Billing + inventory (common in trading)
- Item master, stock in/out, valuation
- GST invoices from sales orders
- Purchase orders, delivery challan, credit/debit notes
- Price lists, discounts

### C) Operations + ecosystem
- Offline-first speed, works with low internet
- Accountant familiarity + shortcuts
- Multi-company, year-end closing
- Imports/exports to Excel; integration with CA workflows

**Reality:** Replacing Tally fully is closer to building an ERP.

---

## 2) What “P&L feature” really requires

P&L isn’t just a report screen; it needs correct accounting data underneath:
- Chart of accounts (Income, Expense, Assets, Liabilities)
- Double-entry postings from vouchers
- Period closing rules
- Adjustments/journals

If you only want *basic P&L*, you can still do it with a limited scope (below).

---

## 3) Minimum “Tally-replacement” feature set (doable path)

### Stage 1: Accounting-lite (enough for most SMB reporting)
Goal: users can do daily entries and get P&L without Tally.

MVP+ Accounting features:
- Chart of accounts templates (Trading, Service, Manufacturing-light)
- Party ledgers (Customer/Supplier)
- Voucher entry (limited):
  - Sales (GST invoice)
  - Purchase
  - Receipt (customer payment)
  - Payment (supplier payment)
  - Journal (adjustments)
- Auto-posting rules:
  - Sales → Revenue + GST output + Debtor
  - Purchase → Expense/Inventory + GST input + Creditor
- Reports:
  - **Profit & Loss**
  - Trial balance (basic)
  - Ledger report (per party)
  - Outstanding receivables/payables + ageing

This alone removes a lot of “I still need Tally daily” usage.

### Stage 2: Inventory-lite (only if your segment needs it)
- Item/HSN masters
- Stock movement based on sales/purchase
- Basic valuation method (FIFO/Avg) (pick one)

### Stage 3: Full replacement (big scope, later)
- Advanced inventory, job-work, manufacturing, payroll, multi-branch, cost centers
- Deep customizations and offline desktop

---

## 4) The fastest switching strategy: “Tally import + parity on the top 20%”

### Must-have: Tally data import
To avoid manual migration pain:
- Import masters:
  - Ledgers, stock items (optional), GSTINs
- Import transactions:
  - Sales/purchase vouchers
  - Receipts/payments

### Why this matters
Even if your features are good, customers won’t switch if migration is painful.

---

## 5) Features you likely need (commonly demanded by Tally users)

### A) Day-to-day visibility
- Cash/bank summary
- Party outstanding and ageing
- Daily sales/purchase summaries

### B) Controls
- Maker-checker for entries and filing
- Audit log
- Period lock and year closing

### C) Printing & formats
- GST invoice print templates (logo, terms, QR if e-invoice)

### D) Performance + UX
- Bulk upload / bulk edit
- Keyboard-first data entry (Tally users love speed)

---

## 6) Recommendation (practical)

If your goal is “don’t use Tally at all”:
- Start with **Accounting-lite + GST filing** (Stage 1) and nail:
  - P&L
  - Outstanding
  - Voucher entry speed
  - Tally import

If your goal is “GST compliance product”:
- Don’t try to replace Tally early.
- Build **connectors** so users keep accounting in Tally but do GST compliance + reconciliation + filing in your app.

