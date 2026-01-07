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

## 0) Confirmed decisions (from you) + pending decisions (need your choice)

### Confirmed by you
- Audience: **Both** (Businesses + CA firms)
- Company structure: **Multi‑GSTIN is required**
- GST scope: include **B2B, B2C, Exports/SEZ, Credit/Debit Notes, Amendments, RCM**
- Include corner cases:
  - GST: credit/debit notes, cancelled invoices, amendments, RCM, exports/SEZ, multi‑rate invoices, place‑of‑supply, HSN summary, nil returns, quarterly/IFF
  - 2B: timing/refresh issues, vendor late filing, partial/mismatched values, duplicates across months
  - Accounting‑lite: opening balances, partial payments/settlements, refunds/chargebacks, journal adjustments, year closing
  - Duplicates: invoice number reused across years/series, revised invoices, PDFs containing multiple invoices
- Source of truth: users **mostly upload PDFs/Excel** and we generate accounting automatically (Stage 1)

### Pending decisions (please answer; I will not assume)
1) **Duplicate policy**: you said “yes” to the duplicate question, but I need the exact rule:
   - **A)** Hard‑block always (no override), OR
   - **B)** Allow override only by Admin/Reviewer with mandatory reason
2) **E‑invoice & e‑way bill**: required, but what is the MVP scope?
   - **A)** Generate + cancel only (IRN/EWB) for B2B invoices, OR
   - **B)** Full workflow (generate, cancel, print, bulk, error retries), OR
   - **C)** Not in MVP, but in V1 (if you decide to reduce scope)

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
- Create companies (name, state)
- Add **multiple GSTINs** per company (multi‑GSTIN)
- Add users and roles:
  - Admin
  - Preparer
  - Reviewer
  - Read-only
 - CA mode:
   - one Org can manage multiple client companies
   - company-level access control per user (who can see which client)

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
- Pending decision: either hard‑block always OR allow override by Admin/Reviewer with reason (see section 0)

### D) Invoice extraction (basic)
Supported in MVP:
- PDF with selectable text
- Excel/CSV templates (including Tally-style export template)

Extract:
- supplier/customer GSTIN
- invoice number + date
- taxable value + IGST/CGST/SGST + total
 - invoice type classification (B2B/B2C/Export/SEZ/RCM/CN/DN/Amendment) based on fields and user selection

If missing/uncertain → goes to **Needs Review** queue for manual correction.

**Multi-invoice PDF corner case (confirmed in scope)**
- If one PDF contains multiple invoices:
  - MVP behavior: mark as **Needs Review** and require splitting into separate invoices inside the review screen (manual line-by-line creation), OR upload separately (you choose later).

### E) Compliance calendar + status (due dates + progress)
Per GSTIN, per month/quarter:
- Due dates:
  - GSTR‑1 due date
  - GSTR‑3B due date
  - IFF due date (for quarterly filers) when applicable
- Status per return:
  - not started / draft / pending review / ready / submitted / filed / error
 - Nil return handling: allow marking “Nil” with evidence/audit note

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
 - Handle timing issues:
   - show “2B last refreshed at”
   - show “vendor filed late” type explanations (where detectable)
   - prevent incorrect conclusions by keeping audit notes per period

### G) GST filing (minimal but real “filing software”)
Via approved integration route (typically **GSP**):
- Prepare GSTR‑1 to cover (confirmed in scope):
  - B2B, B2C (summary where applicable), Exports/SEZ, Credit/Debit notes, Amendments
- Prepare GSTR‑3B:
  - summary values + ITC
  - RCM classification support (at least capture + include in summaries)
- HSN summary support (at minimum for reporting and for return sections where required)
- Place‑of‑supply handling (capture + validate)
- Submit/file with:
  - acknowledgements / reference IDs
  - status polling
  - error resolution screen (“what failed and how to fix”)

**Quarterly/IFF + nil returns (confirmed in scope)**
- Support monthly and quarterly filing modes per GSTIN.
- Support IFF where applicable.

### H) Stage 1 Accounting‑lite (so users stop using Tally daily)
Minimum accounting features:
- Chart of Accounts templates (Trading + Service)
- Party masters (customers/suppliers)
- Auto-generated vouchers/postings primarily from uploaded invoices:
  - Sales invoice upload → Sales voucher postings
  - Purchase invoice upload → Purchase voucher postings
- Manual adjustments allowed:
  - Journal adjustments
  - Opening balances (start of migration)
  - Receipt/Payment entries for settlements (to support outstanding ageing)
  - Refund/chargeback adjustments (minimal)
- Auto-posting (double-entry) with validation
- Reports:
  - Profit & Loss
  - Trial balance (basic)
  - Ledger report
  - Outstanding receivables/payables + ageing
  - Daybook
 - Year closing (basic):
   - lock last financial year
   - carry forward opening balances

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
- E-invoice/e-way bill: included per your confirmation, but MVP depth is pending your choice (section 0).

---

## 4) Implementation plan (step by step)

### Step 0 (1–2 days): freeze decisions
- Confirm remaining pending decisions (section 0):
  - duplicates override policy
  - e‑invoice/e‑way depth
- Filing required in MVP: Yes (GSTR‑1 + 3B) with your confirmed scope
- 2B source: GSP fetch preferred + upload fallback
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
- Auto-generate vouchers from uploads + manual journal/receipt/payment/opening balance
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


