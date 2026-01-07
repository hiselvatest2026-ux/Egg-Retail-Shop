# MVP (filing-capable) — what you asked to include

You said the MVP must include what competitors typically provide. This doc converts that into a **minimal, doable MVP scope** (not “everything”, but enough to claim GST filing software).

---

## 1) Direct GSTN/GSP integration (required)

### MVP must include
- Connect a company GSTIN to GSTN via **GSP** (approved integration route).
- Auto-fetch **GSTR-2B** for a selected month.
- Prepare return data and **file**:
  - **GSTR-1** (at least B2B invoices + credit/debit notes)
  - **GSTR-3B** (summary values + ITC totals from reconciled purchases)
- Show filing status:
  - submitted / filed / error
  - error message + next action
- Store acknowledgements / reference IDs.

### MVP “minimal” choices (to keep it doable)
- Start with **monthly** filing only (quarterly later).
- Start with **one GSTIN per company** in MVP (multi-GSTIN can be V1 if needed).

---

## 2) E-invoice + e-way bill (minimal)

### MVP must include (only for businesses that need it)
- E-invoice:
  - Generate IRN for eligible invoices
  - Cancel IRN
- E-way bill:
  - Generate EWB
  - Cancel EWB

### MVP “minimal” choices
- Build for one invoice type first (standard B2B tax invoice).
- Logs + retries + idempotency (avoid duplicate IRN/EWB).

---

## 3) Broader GST coverage (minimal)

### MVP must include
- Purchases and Sales invoices (B2B focus first)
- Credit note / Debit note support (basic)
- Exports/SEZ and RCM:
  - store flags and show in reports
  - if required for filing, include the basic fields needed

### MVP “minimal” choices
- Defer complex edge cases until you have real customer examples.

---

## 4) Stronger reconciliation engine (MVP+)

### MVP must include
- Matching purchases vs **2B** with:
  - exact match + fallback match
  - clear mismatch reasons (invoice no/date/value/tax)
- Bulk actions:
  - mark as accepted / pending vendor / mismatch confirmed
- Vendor compliance report:
  - top vendors missing invoices

---

## 5) Connectors (minimal “real-world usable”)

### MVP must include
- Import templates that match common exports:
  - **Tally export template** (Excel/CSV)
  - Generic purchase/sales register template

### MVP “minimal” choices
- Avoid deep API connectors in MVP; do templates first.
- Add Zoho/SAP connectors in V1/V2 after MVP traction.

---

## 6) CA practice management (minimal)

### MVP must include
- Multi-company dashboard for CA orgs:
  - pending uploads
  - pending review
  - pending filing
  - filed status
- Maker-checker:
  - Preparer drafts
  - Reviewer locks + files
- Reminders (simple):
  - “upload pending” / “review pending” / “filing due”

---

## 7) Enterprise-grade controls (MVP minimum)

### MVP must include
- Tenant isolation (org/company separation)
- Roles (admin/preparer/reviewer/read-only)
- Audit log for:
  - uploads
  - edits
  - duplicate overrides
  - filing actions
- Backups + retention policy (basic)

---

## Important reality check (non-negotiable dependency)
If MVP includes filing, you need:
- a **GSP partner** (or equivalent approved route),
- stable GSTN integration handling (rate limits, downtimes),
- strong support workflows for filing errors.

