# Competitor gap checklist — what’s missing vs typical GST software (India)

This compares your **current MVP concept** (login + company-wise upload + duplicate checks + basic extraction + 2B upload + reconciliation reports) against what most competitors offer.

## A) “Table-stakes” features most competitors have (you don’t, yet)

### 1) Direct GSTN/GSP connectivity (big one)
- **Auto-fetch GSTR-2B/2A** (no manual upload)
- **Return preparation + filing** via approved routes (usually through a **GSP**)
- **Filing status, acknowledgements, error codes, retries**

Why it matters: users expect “software that files” to reduce portal work.

### 2) E-invoicing + e-way bill (for applicable businesses)
- Generate IRN, cancel IRN, print QR
- Generate e-way bill, extend/cancel, track validity

Why it matters: many B2B segments pick tools based on e-invoice/e-way support.

### 3) Wider GST scope coverage
- More return/transaction types: amendments, credit/debit notes, exports/SEZ, RCM, ISD (as needed), HSN summaries, etc.
- Multi-GSTIN control center (branch-wise)

Why it matters: edge cases are where generic tools break and churn happens.

### 4) Strong reconciliation engine (quality = moat)
- Higher accuracy matching + fewer false mismatches
- Explainable mismatch reasons + bulk actions
- Vendor compliance tracking (who is missing invoices repeatedly)

### 5) Data connectors (reduce onboarding pain)
- Tally import connectors (or standard Tally export templates)
- Zoho/SAP/other accounting exports
- Email/WhatsApp invoice ingestion (some competitors offer this)

Why it matters: “upload PDFs one-by-one” is hard at scale.

### 6) Practice management for CA firms
- Client tasks, reminders, maker-checker, workload dashboard
- Client document request + tracking

### 7) Audit-grade controls & security posture
- Strong audit logs, role policies, approvals
- Backups, retention, encryption, tenant isolation proof
- SOC2/ISO posture for larger customers (later stage)

---

## B) Where your MVP can win (good wedge)

### 1) Best-in-class “duplicate prevention + evidence locker”
Competitors often allow duplicates because data comes from many sources.
- Your upload-time duplicate block + override reason + audit trail can be a strong differentiator for CAs.

### 2) Simple “what’s uploaded so far” visibility
Make it extremely clear:
- what’s missing,
- what’s pending review,
- what’s ready for reconciliation/return prep.

### 3) Faster onboarding for messy SMBs
If you make upload + review extremely simple, you can win SMBs who hate ERP-style setups.

---

## C) Roadmap (practical order to close the gaps)

### Step 1: Make your MVP “sticky” (before filing)
- Great upload UX (bulk upload, drag-drop, progress, retry)
- Strong duplicate detection (file + invoice + fallback)
- Review queue that is fast (keyboard-first edits, bulk edits)
- High-quality reports (vendor follow-up, mismatch reasons)

### Step 2: Integrate official data (verification upgrade)
- **GSP integration** to fetch 2B automatically (removes manual uploads)
- Better matching rules + explainability

### Step 3: Add filing (become a “GST filing software”)
- GSTR-1 + 3B payload generation
- Submission via GSP (with status, retries, error resolution workflows)

### Step 4: Add e-invoice/e-way (if your target segment needs it)
- IRN + e-way workflows

### Step 5: Add connectors + CA practice management
- Tally/Zoho connectors
- CA control center (multi-client operations)

---

## D) Quick self-check: are you selling “reco & control” or “filing”?
- If you market as **filing software**, Step 3 becomes mandatory.
- If you market as **reconciliation + document control**, you can still sell well before Step 3 (especially to CA firms), then upsell filing later.

