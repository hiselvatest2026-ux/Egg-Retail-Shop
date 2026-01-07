# GST App — MVP plan + implementation (step by step)

This is a **single simple document** that covers the MVP you want:
- multi-company + multi-user
- upload bills inside the app (company specific)
- show what is uploaded so far
- block duplicates
- GST compliance calendar + status
- GSTR‑2B reconciliation + “official status” view
- GST filing flows (GSTR‑1 + GSTR‑3B) via approved integration (GSP)
- Stage 1 Accounting‑lite (P&L etc.) so users don’t need Tally daily
- payments/subscriptions model

---

## 1) MVP goal (in simple words)
One app where a company can:
- upload purchase/sales bills,
- avoid uploading the same bill twice,
- see dashboard + due dates + filing status,
- reconcile purchases with GSTR‑2B,
- prepare and file GSTR‑1 and GSTR‑3B,
- and also get basic accounting reports like **Profit & Loss** (Stage 1) so they don’t use Tally daily.

---

## 2) MVP scope (what we build)

### A) Login + company setup (SaaS)
- Org (tenant) signup/login
- Create companies (name, GSTIN, state)
- Add users and roles:
  - Admin
  - Preparer
  - Reviewer
  - Read-only

### B) Upload bills inside the app
- Select company → upload into:
  - Purchases
  - Sales
- Upload history (“what was uploaded so far”):
  - file name, date/time, uploaded by
  - purchase/sale
  - extracted invoice no/date/GSTIN/amount
  - status: processing / processed / needs review / blocked duplicate
  - filters: month, supplier/customer GSTIN, invoice number, status

### C) Duplicate bill prevention (company specific)
Check duplicates **within the selected company** (and GSTIN if you separate by GSTIN).

**MVP duplicate rules**
1) Same file duplicate (strong): `sha256(file)` already exists → block  
2) Same invoice duplicate (strong): same `supplier GSTIN + invoice number + invoice date` (normalized) → block  
3) Fallback duplicate: same `supplier GSTIN + invoice number` AND amounts match within tolerance → warn/block

**Behavior**
- Default: block upload and show link to existing record
- Optional: Admin can allow “Upload anyway”, but user must enter reason (saved to audit log)

### D) Invoice extraction (basic)
Supported in MVP:
- PDF with selectable text
- Excel/CSV templates (including Tally-style export template)

Extract:
- supplier/customer GSTIN
- invoice number + date
- taxable value + IGST/CGST/SGST + total

If missing/uncertain → goes to **Needs Review** queue for manual correction.

### E) Compliance calendar + status (due dates + progress)
Per GSTIN, per month:
- Due dates:
  - GSTR‑1 due date
  - GSTR‑3B due date
- Status per return:
  - not started / draft / pending review / ready / submitted / filed / error

### F) GSTR‑2B reconciliation (“official verification”)
Important: **2B is not “filed” by the taxpayer**. It is auto-generated.  
What users want is “2B available + last fetched + mismatch list”.

MVP provides:
- Fetch 2B via GSP (preferred) or allow upload of 2B export (fallback)
- Match purchases vs 2B:
  - matched
  - not in 2B (vendor follow-up)
  - mismatch (clear reason)
- Bulk actions + vendor compliance report

### G) GST filing (minimal but real “filing software”)
Via approved integration route (typically **GSP**):
- Prepare GSTR‑1 (start with B2B invoices + credit/debit notes)
- Prepare GSTR‑3B (summary values + ITC)
- Submit/file with:
  - acknowledgements / reference IDs
  - status polling
  - error resolution screen (“what failed and how to fix”)

### H) Stage 1 Accounting‑lite (so users stop using Tally daily)
Minimum accounting features:
- Chart of Accounts templates (Trading + Service)
- Party masters (customers/suppliers)
- Vouchers:
  - Sales, Purchase, Receipt, Payment, Journal
- Auto-posting (double-entry)
- Reports:
  - Profit & Loss
  - Trial balance (basic)
  - Ledger report
  - Outstanding receivables/payables + ageing
  - Daybook

### I) Payments (subscription model)
Billing per Org (tenant). MVP supports:
- Plans (Starter, Pro/CA)
- Pay → activate subscription → renew
- Invoice/receipt download
- Simple enforcement:
  - limit GSTIN/users/docs by plan
  - grace period after payment failure

---

## 3) What we will NOT build in MVP (to keep it realistic)
- No portal scraping / robot clicking.
- No advanced inventory (stock valuation, batches, manufacturing).
- No payroll, cost centers, complex year-end.
- No high-accuracy OCR for scanned images (later).
- E-invoice/e-way bill only if your target segment requires it (otherwise V1).

---

## 4) Implementation plan (step by step)

### Step 0 (1–2 days): freeze decisions
- Target customer: CA firm / business / both
- Filing required in MVP: Yes (GSTR‑1 + 3B)
- 2B source: GSP fetch preferred + upload fallback
- E-invoice/e-way bill in MVP: yes/no (only if required)
- Subscription model: per GSTIN per month (recommended)

### Step 1 (week 1–2): foundation
- Auth + Org + roles
- Company/GSTIN setup
- File storage for uploads
- Upload history screen

### Step 2 (week 3–4): extraction + review + duplicates
- PDF text + Excel/CSV parsers
- Normalization rules (GSTIN/invoice no/date)
- Duplicate detection + override flow
- Needs review queue + edit screen
- Audit log for edits and duplicate actions

### Step 3 (week 5–6): accounting-lite base (Stage 1)
- Chart of Accounts templates + party masters
- Voucher entry + auto-posting
- Reports: P&L + trial balance + ledger + outstanding

### Step 4 (week 7–8): 2B reconciliation + compliance calendar
- Fetch/upload 2B
- Matching engine + mismatch reasons + bulk actions
- Due dates + status dashboard per GSTIN/month

### Step 5 (week 9–12): filing flows (GSTR‑1 + 3B)
- Build return payload generator (minimal supported sections first)
- Submit/file via GSP
- Status polling + error handling UI
- Store acknowledgements

### Step 6 (week 13–14): payments + pilot
- Subscription plans + payment gateway integration
- Enforce plan limits + grace period
- Pilot with 2–5 companies near filing deadline and fix issues

---

## 5) Minimum data we must store (simple list)
- Org, User, Role, Company, GSTIN
- Uploaded documents + file hash (for duplicates)
- Invoices (normalized fields)
- Duplicate events (blocked/overridden + reason)
- 2B imports + reconciliation results
- Return status (GSTR‑1/3B) + due dates + acknowledgements
- Accounting: accounts, parties, vouchers, voucher lines (double-entry)
- Billing: plan, subscription, payments, invoices/receipts
- Audit log (who changed what)


