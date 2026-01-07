# GST App (MVP) — simple plan in layman English

## What we are building (MVP)
A web app where **many companies** can log in and **upload their purchase/sales bills directly inside the app**.  
The app will show **what was uploaded so far** (company-wise) and prevent **duplicate bills** from being uploaded.

The app will also read those files (basic extraction), make a **company-wise dashboard**, and create **GST-ready reports**.

This is built as **multi-company + multi-user** (SaaS). Each company’s data stays separate.

---

## What the MVP will do (feature checklist)

### 1) Company + user setup
- Add a **new company** (name, GSTIN, state).
- Add **users** and roles:
  - Admin (manage settings/users)
  - Preparer (upload/review/reconcile)
  - Reviewer (approve/lock)
  - Read-only (view)

### 2) Google Drive “drop folder” connection
### 2) Upload bills inside the app (company specific)
- User selects a **company** and uploads bills to:
  - Purchases
  - Sales
- User can see an **Upload History**:
  - list of uploaded files with date/time, uploaded by, status (processed / needs review)
  - filters by month, supplier/customer GSTIN, invoice number

### 3) Duplicate bill check (at upload time)
When a user uploads a bill, the app checks for duplicates **within that company (and GSTIN if applicable)**.

**Duplicate detection rules (MVP):**
- **File duplicate**: same file hash (exact same file uploaded again)
- **Invoice duplicate (strong)**: same *supplier GSTIN + invoice number + invoice date* (after normalization)
- **Invoice duplicate (fallback)**: same *supplier GSTIN + invoice number* AND total/tax amounts match within a small tolerance

**What happens if duplicate is found:**
- Default: **block upload** and show the existing record link
- Optional (admin setting): allow “Upload anyway” with **mandatory reason** (kept in audit trail)

### 4) Read invoices/bills from files (basic extraction)
- Support these first:
  - **PDF with selectable text**
  - **Excel/CSV**
- Extract key fields:
  - supplier/customer GSTIN
  - invoice number + date
  - taxable value + GST amounts (IGST/CGST/SGST)
  - total value
- Put uncertain items into a **“Needs review”** queue.

### 5) Centralized dashboard (company-wise)
- Purchases total + Sales total by month.
- Counts:
  - total documents uploaded
  - processed ok
  - needs review
  - duplicate attempts blocked (or flagged)
- Simple filters: month, supplier/customer, status.

### 6) “Official verification” (MVP version)
Because direct government verification usually needs **GSP/GSTN APIs**, MVP will start with a simpler method:
- User downloads **GSTR-2B** (official) and uploads the JSON/PDF directly into the app.
- App matches purchase invoices against 2B and marks:
  - Matched
  - Not in 2B (follow up vendor)
  - Mismatch (value/date/invoice no issue)

### 7) Outputs (what user gets)
- Downloadable reports:
  - Vendor follow-up list (missing in 2B)
  - Mismatch list
  - Month summary (purchases/sales)
- “Return-ready” data exports (format to be decided per target user):
  - CSV/Excel summary for CA review
  - Later: JSON for portal upload (after we confirm exact formats)

### 8) Audit trail (minimum)
- Track who changed what (match/unmatch, edits in review, approvals).
- Track duplicate overrides (if enabled): who overrode + reason.
- Period “lock” so numbers don’t change after review.

---

## What the MVP will NOT do (to keep it doable)
- No automation by “clicking in GST portal” (no scraping/robot).  
- No full GST filing submission in MVP (that needs GSP/GSTN integration + more compliance work).
- No perfect OCR for scanned images in MVP (we can add later).
- No full accounting system (this is document ingestion + reconciliation + reporting).

---

## Phase plan (clear and doable)

### Phase 0 — Confirm decisions (1–2 days)
We must confirm:
- Who is the main user: **CA firms** or **business owners**?
- Data source: mostly **PDF + Excel** or also **scanned images**?
- Output expectation: CA-friendly reports only, or portal upload format?

### Phase 1 — Core SaaS + in-app upload (1–2 weeks)
- Org/Company/GSTIN setup
- Users + roles
- Upload UI + upload history
- File storage + processing pipeline

### Phase 2 — Invoice extraction + review queue (2–3 weeks)
- Parse PDF text + Excel/CSV
- Normalize invoices into a single standard format
- Needs-review UI (edit fields + approve)
- Duplicate detection (basic)

### Phase 3 — 2B upload + reconciliation (2–3 weeks)
- Upload/ingest GSTR-2B export
- Matching rules + mismatch reasons
- Exception dashboards + downloads
- Period lock + audit trail

### Phase 4 — Polishing + pilot launch (1–2 weeks)
- Faster processing + retries
- Better validations
- Simple onboarding guide + templates
- Pilot with 2–5 companies

Total MVP: **~6–10 weeks** depending on extraction complexity and UI polish.

---

## Next “confirm with you” checklist (so we don’t build the wrong thing)
Tell me your preference for each:
- Target customer: **CA firm** / **SMB** / both?
- MVP verification: **2B upload** only, or must have **GSP API** in MVP?
- File types: only **PDF text + Excel** in MVP? (scanned images later)
- Output: reports only, or must produce **portal upload JSON**?
- Pricing idea: per GSTIN, per company, or per user?

