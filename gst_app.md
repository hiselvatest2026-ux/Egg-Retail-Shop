# GST App (MVP) — simple plan in layman English

## What we are building (MVP)
A web app where **many companies** can connect a **Google Drive folder** and simply **drop their purchase/sales bills** there.  
The app will read those files, make a **company-wise dashboard**, and create **GST-ready reports**.

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
- Admin links a Drive folder for each company:
  - Purchases folder
  - Sales folder
- When new files are added/updated, the app picks them up automatically.

### 3) Read invoices/bills from files (basic extraction)
- Support these first:
  - **PDF with selectable text**
  - **Excel/CSV**
- Extract key fields:
  - supplier/customer GSTIN
  - invoice number + date
  - taxable value + GST amounts (IGST/CGST/SGST)
  - total value
- Put uncertain items into a **“Needs review”** queue.

### 4) Centralized dashboard (company-wise)
- Purchases total + Sales total by month.
- Counts:
  - total documents found
  - processed ok
  - needs review
  - duplicates suspected
- Simple filters: month, supplier/customer, status.

### 5) “Official verification” (MVP version)
Because direct government verification usually needs **GSP/GSTN APIs**, MVP will start with a simpler method:
- User downloads **GSTR-2B** (official) and uploads the JSON/PDF into Drive (or directly into the app).
- App matches purchase invoices against 2B and marks:
  - Matched
  - Not in 2B (follow up vendor)
  - Mismatch (value/date/invoice no issue)

### 6) Outputs (what user gets)
- Downloadable reports:
  - Vendor follow-up list (missing in 2B)
  - Mismatch list
  - Month summary (purchases/sales)
- “Return-ready” data exports (format to be decided per target user):
  - CSV/Excel summary for CA review
  - Later: JSON for portal upload (after we confirm exact formats)

### 7) Audit trail (minimum)
- Track who changed what (match/unmatch, edits in review, approvals).
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

### Phase 1 — Core SaaS + Drive ingestion (1–2 weeks)
- Org/Company/GSTIN setup
- Users + roles
- Connect Drive folders
- File pickup + processing pipeline

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

