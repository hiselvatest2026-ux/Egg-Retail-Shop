# GST filing software in India — landscape + doable product directions

This note is **not** about RetailShop. It’s a standalone analysis of the Indian GST-filing software landscape, and some **doable** product directions for building a GST app.

> Scope: GST compliance workflows (GSTR-1/3B, reconciliations, e-invoicing/e-way bill, vendor/customer ITC matching), plus the “distribution model” (CA/tax pro, SMB self-serve, enterprise).

---

## 1) Market landscape: major categories of GST software

### A) SMB accounting suites that include GST
These products win on **“accounting + GST in one place”**, low learning curve, and end-to-end invoicing → return prep.

- **Zoho Books / Zoho Finance**
  - **Typical strengths**: invoicing, inventory (tiers), multi-channel integrations, solid UX, ecosystem (CRM/payments).
  - **GST angle**: GST-ready invoices, returns assistance, reports, often positioned as “small business cloud accounting”.
  - **Differentiation**: ecosystem + integrations + cloud-first.

- **Tally (TallyPrime family)**
  - **Typical strengths**: massive installed base, offline-first workflows, accountant familiarity, speed on local machines.
  - **GST angle**: GST reports/returns workflows, heavy adoption via CAs/bookkeepers.
  - **Differentiation**: distribution + familiarity + “works without internet” mindset.

- **BUSY, Marg ERP, other SMB ERPs**
  - **Typical strengths**: India-specific trading workflows, inventory + billing, strong channel partners.
  - **GST angle**: returns prep, GST reports, often deep local compliance features.
  - **Differentiation**: price + local partner network + features for traders/distributors.

**Implication:** Competing head-on here means you need either (1) a wedge feature they don’t do well, or (2) a distribution advantage (CA network, integrations, vertical focus).

---

### B) “Pure GST” compliance platforms (filing + reconciliation first)
These tools sell **GST workbench** experiences: import invoices, reconcile with 2A/2B, generate returns, manage notices, etc.

- **Clear (ClearTax / ClearGST)**
  - **Typical strengths**: reconciliation UX, automation, enterprise offerings, multi-GSTIN management, API/ERP integrations.
  - **Differentiation**: automation at scale; brand.

- **Masters India (and similar compliance-focused players)**
  - **Typical strengths**: e-invoice + e-way bill + GST compliance, integrations, also sold via APIs.
  - **Differentiation**: “compliance rails” + API-first options.

- **IRIS GST / other tax-tech suites**
  - **Typical strengths**: enterprise + mid-market compliance, deeper controls, multi-entity.
  - **Differentiation**: controls, auditability, large org features.

**Implication:** The competitive moat is usually **reconciliation accuracy**, workflow/approvals, audit trail, and integration breadth.

---

### C) ERPs with GST as a module (mid-market / enterprise)
They win on being the system-of-record: procurement, order-to-cash, finance—GST becomes one compliance module.

- **SAP / Oracle / Microsoft ecosystem + partners**
  - **Typical strengths**: enterprise controls, approvals, master data, integrations, scalability.
  - **GST angle**: compliance connectors + reporting.
  - **Differentiation**: enterprise footprint and governance.

**Implication:** As a startup, you usually don’t replace ERP; you **integrate** and become the “compliance layer”.

---

### D) API rails: GST Suvidha Providers (GSP) + e-invoice / e-way bill service providers
Many products don’t connect to GSTN directly; they use a **GSP** (GST Suvidha Provider) for authenticated APIs and reliability.

- **What they enable**:
  - GST return filing APIs (where available), data fetch, status checks
  - E-invoice IRP integration, e-way bill APIs
  - Better uptime, throttling management, credential handling patterns

**Implication:** A realistic product plan often starts with selecting a GSP partner and building a robust workflow around that.

---

## 2) What “GST filing” really means in practice (jobs-to-be-done)

### The core workflows customers pay for
- **Invoice → Return prep**
  - Prepare outward supplies summary (GSTR-1) from invoices/billing data.
  - Prepare monthly summary return (GSTR-3B) from sales/purchases and eligible ITC.

- **Reconciliation & ITC**
  - Match purchase register vs **GSTR-2B** (and sometimes 2A), detect missing invoices, mismatches, duplicates.
  - Generate vendor follow-up lists and “actionable exceptions”.

- **Multi-entity management**
  - Multiple GSTINs, branches, roles, approvals, and standardized reports.

- **Compliance “ops”**
  - Tracking filing status, deadlines, interest/late fee cues, notice management, audit trail.

### The usual pain points (opportunities)
- **Data ingestion**: Excel chaos, inconsistent invoice formats, ERP exports.
- **Reconciliation accuracy**: false positives/negatives, rule tuning, partial matches.
- **Multi-month continuity**: amendments, credit/debit notes, carry-forward issues.
- **Role workflow**: maker-checker approvals, CA/client handoffs.
- **Support**: compliance is stressful; “human help” matters.

---

## 3) Competitive differentiation patterns (what actually wins)

### Common “moats”
- **Distribution moat**
  - CA/tax pro channels, partner programs, reseller networks (very strong in India).
- **Integration moat**
  - Plug-and-play connectors for Tally/Zoho/SAP + standardized import templates.
- **Workflow moat**
  - Multi-GSTIN control tower, approvals, audit logs, exception management.
- **Accuracy moat**
  - Reco engine with explainable rules + low manual cleanup.
- **Support moat**
  - Fast resolution during filing deadlines; guided flows.

### Common reasons products lose
- Too hard to onboard (data import pain).
- Reco is noisy (trust breaks quickly).
- Weak handling of edge cases (amendments, notes, exports/SEZ, RCM scenarios).
- Slow/unclear status during GSTN outages.

---

## 4) Doable product directions (pick a wedge)

Below are **doable** options that don’t require you to beat incumbents at everything on day one.

### Option 1: “Reco-first” app for SMB + CAs (Excel in, actionable out)
**Positioning:** “Fastest way to reconcile purchase register vs 2B and generate vendor action list.”

- **MVP scope (6–10 weeks, realistic)**
  - Import purchase register (Excel/CSV templates + mapping UI)
  - Fetch/ingest GSTR-2B (via GSP integration or upload JSON)
  - Matching engine: exact match + fuzzy match rules (GSTIN, invoice no, date tolerances, taxable value, tax amounts)
  - Exceptions dashboard + downloadable vendor follow-up report
  - Audit trail: who marked what as matched/accepted

- **Why it can win**
  - Many accounting suites do filing, but **reco & vendor chasing** remains painful.

- **Risks**
  - Needs very good UX for imports + rule explainability.

---

### Option 2: “CA Practice” control center (multi-client GST ops)
**Positioning:** “One place to run GST compliance for 50–500 clients with maker-checker workflow.”

- **MVP scope**
  - Client/GSTIN directory + task calendar
  - Standardized data import templates per return period
  - Notes/communication log per client (what’s pending from whom)
  - Status tracking + reminders + simple approvals
  - Basic reports: filing status, pending list, ITC mismatch summary

- **Why it can win**
  - CAs care about **workflow and visibility** more than fancy invoicing.

- **Risks**
  - Adoption depends on relationship selling and support quality.

---

### Option 3: “E-invoice + e-way bill + GST bridge” (API-first)
**Positioning:** “Compliance rails” for billing products/ERPs to become GST-ready without building everything.

- **MVP scope**
  - API to generate IRN (e-invoice) and e-way bill via provider integration
  - Webhooks/status callbacks, retries, idempotency keys
  - Minimal UI for logs, errors, and reprocessing
  - Export formats for GST returns (or direct filing if supported)

- **Why it can win**
  - B2B SaaS vendors want to outsource compliance complexity.

- **Risks**
  - Needs strong reliability engineering and support; sales cycles can be longer.

---

### Option 4: Vertical GST app (narrow niche, deep fit)
Pick a niche with consistent patterns (e.g., pharma distribution, jewelry, restaurants, transport/logistics, manufacturing job-work).

- **MVP scope**
  - Prebuilt invoice templates + HSN mapping defaults
  - Niche-specific reconciliations and reports
  - Simple filing assistance + compliance calendar

- **Why it can win**
  - You avoid generic competition and win on “this fits my business”.

- **Risks**
  - TAM is smaller per niche; may require multiple verticals later.

---

## 5) A pragmatic MVP recommendation (if you want “doable” + differentiated)

If the goal is to build something valuable quickly without becoming a full accounting system:

### Recommended MVP: **Reco-first + CA-friendly**
- Start with **GSTR-2B reconciliation** and exception workflows.
- Add **GSTR-1 data prep** later via invoice imports / connectors.
- Treat filing as a later milestone; many users still value “ready-to-file outputs” and clean reconciled books.

**Why this is practical:** reconciliation is where time is spent, and it’s where incumbents still frustrate users when data is messy.

---

## 5.1) Your idea: Google Drive “dropbox” for bills + centralized GST dashboard

### What you described (restated as a product)
- Companies upload **purchase/sales bills** into a **shared Google Drive** (or shared folders).
- The GST software auto-reads those documents, creates a **centralized dashboard** (company-wise, purchases vs sales).
- It then **verifies** invoices with official GST data (government sources).
- Finally it helps **prepare/submit** return data for filing (through official channels).

### Key feasibility notes (important)
- **“Verify with government official site”** is feasible **only via approved API routes** (typically through a **GSP**) or via **official exports** (e.g., 2B JSON) that users upload.
  - Automating the GST portal via scraping/robot steps is fragile and usually violates ToS; product-grade solutions use **GSP/GSTN APIs**.
- **“Upload bills into GST portal”** depends on what you mean:
  - GST filing is submission of **structured return payloads** (invoice/summary data), not uploading PDFs of bills.
  - You *can* still store PDFs internally as “evidence” and for audits/support.

### Recommended twist: “Drive as the ingestion layer” (wedge)
This is a strong wedge because onboarding becomes: **“just drop files”**.
- Drive folder becomes the source for documents.
- Your app becomes the compliance workbench, reconciliation engine, and audit trail.

---

## 5.2) How to implement the Drive-based workflow (doable design)

### A) Folder structure (multi-company without data leakage)
Even if you call it a “shared drive”, isolate tenants:
- **Best practice**: one Shared Drive per company, or at least one top-level folder per company with strict permissions.
- Your system uses a **service account** (or OAuth) that has access only to that company’s drive/folder.

Suggested folder convention:
- `/<CompanyName-GSTIN>/Purchases/2026-01/`
- `/<CompanyName-GSTIN>/Sales/2026-01/`
- `/<CompanyName-GSTIN>/CreditNotes/`
- `/<CompanyName-GSTIN>/DebitNotes/`
- `/<CompanyName-GSTIN>/Exports-SEZ/` (optional)

### B) Ingestion
- Monitor Drive for new/changed files using:
  - **Drive API change notifications** (preferred), plus periodic reconciliation jobs.
- When a file arrives:
  - Store immutable metadata: `drive_file_id`, hash, uploader, timestamps, folder path.
  - Copy file to your controlled storage (for durability and processing), or process in-place then cache derived artifacts.

### C) Document understanding (two lanes)
- **Lane 1 (fast MVP): structured sources**
  - PDFs that already contain selectable text + Excel/CSV invoices.
  - Extraction by template mapping + heuristics (GSTIN, invoice no, date, taxable value, IGST/CGST/SGST, HSN).
- **Lane 2 (later): scanned images**
  - OCR + layout parsing.
  - Higher error rates; require human review UI.

### D) Normalization into a common invoice schema
Regardless of source, normalize into:
- Parties: supplier/buyer GSTIN, trade/legal name
- Invoice header: number, date, place of supply, invoice type (B2B/B2C/Export/SEZ), reverse charge flag
- Tax lines: taxable value, tax rates, IGST/CGST/SGST/Cess
- Items (optional for MVP): HSN/SAC, quantity, taxable values

### E) Dashboard + workflow
Central dashboard per company/GSTIN:
- Purchases vs sales totals by month
- Missing fields / extraction confidence
- “Needs review” queue (maker-checker)
- Vendor/customer-wise summaries
- Reconciliation status (Matched / Not in 2B / Mismatch / Duplicate)

---

## 5.3) Verification with “official” GST data (practical options)

### Option 1 (best): integrate via a GSP (GSTN APIs)
- Fetch **GSTR-2B** data for a GSTIN/period.
- (If in scope) fetch filing status, and other available views/status APIs.
- Build matching rules: invoice no/date/value/tax + tolerance windows.

### Option 2 (still workable): user uploads official exports
- Users download 2B/other data from the portal and upload the JSON/PDF to Drive.
- Your app parses and reconciles against their uploaded bills.

### Option 3 (e-invoice verification for applicable taxpayers)
- Where invoices have **IRN**, verify authenticity using e-invoice ecosystem integrations (via provider/GSP), improving trust for B2B supplies where e-invoicing applies.

---

## 5.4) “Upload to GST portal” — what the product should actually do

### What’s realistic and compliant
- Generate **return-ready payloads**:
  - GSTR-1 invoice summaries (B2B/CDNR/exports, etc. as supported in scope)
  - GSTR-3B values (taxable supplies, ITC eligible/ineligible, etc.)
- Either:
  - **Submit via GSP/GSTN APIs** (best), or
  - Provide **portal-friendly JSON/Excel outputs** + a guided checklist for manual upload (acceptable MVP).

### What you should store anyway
- Keep the original bill PDFs/images for audit: “document locker”.
- Link each return line back to its source document and review actions (audit trail).

---

## 5.5) Phased plan (so this stays doable)

### MVP (Drive ingestion + dashboard + reco outputs)
- Google Drive integration (folder-based company setup)
- File ingestion + parsing for common PDF/text + Excel invoices
- Normalized invoice store + “needs review” queue
- 2B import (via upload) + reconciliation + exception reports
- Exports: vendor follow-up list, month summaries, return-ready CSV/JSON

### V1 (official verification via GSP)
- GSP integration for 2B fetch + status checks
- Improved matching rules + explainability
- Role workflows (CA + client), locks/versioning by tax period

### V2 (filing)
- Generate and submit GSTR-1/3B payloads via GSP (as supported)
- Status polling, error handling, retry workflows, evidence logs

## 6) High-level architecture (implementation-neutral)

### Core components
- **Importer**
  - Excel/CSV ingestion, column mapping, validation, normalization
  - Master data: GSTIN list, vendor/customer directory, HSN/SAC lists (optional)

- **Reco engine**
  - Deterministic matching (exact keys)
  - Fuzzy matching (scoring + thresholds)
  - Explainability (“matched because invoice no + tax amount within tolerance”)

- **Compliance integrations**
  - GSP integration for GSTN data fetch where applicable
  - E-invoice/e-way bill integration if in scope

- **Workflow**
  - Roles, approvals, comments, audit log
  - Period locking and versioning (so numbers don’t drift)

- **Exports**
  - Return-ready summaries
  - Vendor action lists
  - CA-facing review packs (PDF/Excel)

### Non-functional must-haves
- **Security**: encryption at rest, strict access control, tenant isolation
- **Reliability**: retries, idempotency, clear “last sync” status
- **Supportability**: structured logs, “download debug pack” for support

---

## 7) Business model & pricing patterns (observed)

- **SMB self-serve**: low monthly/annual pricing, upsell via add-ons (extra GSTINs, advanced reco, e-invoice credits).
- **CA/practice**: per-client or per-GSTIN slabs + multi-user.
- **Enterprise**: per entity + integration fees + SLA/support contracts.

**Realistic early strategy:** start with CA/practice or reco-first SMB; enterprise later.

---

## 8) Open questions (to finalize the best option)

When you share your details, the best path depends on:
- Target users: **SMB owners vs accountants vs CA firms vs enterprises**
- Expected data sources: **Tally exports, Zoho, SAP, Excel only**
- Must-have scope: **only reconciliation vs also direct filing vs also e-invoicing/e-way bill**
- Distribution: **direct online vs CA channel vs integrations/API**

---

## 9) Next step

Send the “more details” you mentioned (target customer + must-have features + any constraints), and I’ll:
- pick the best option above (or propose a new hybrid),
- define an MVP feature list + milestones,
- outline the data model and screens/APIs at a practical level.

