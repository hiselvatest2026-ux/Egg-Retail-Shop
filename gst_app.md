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

