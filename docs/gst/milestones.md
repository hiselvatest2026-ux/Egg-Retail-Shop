# Milestones — MVP build plan (filing-capable)

## Week 0 (1–2 days): confirm scope + integrations
- Target user: CA firm vs business owner (or both)
- Upload types: PDF text + Excel/CSV only for MVP
- Duplicate policy: block by default; allow override with reason?
- Decide “official data” route:
  - **GSP integration** (preferred) for 2B fetch + filing, or
  - manual 2B upload as fallback
- If e-invoice/e-way is needed for target customers, confirm it is in MVP.

## Weeks 1–2: foundation
- Multi-company + multi-user login
- Company setup (GSTIN + state)
- Upload bills (purchase/sale) + file storage
- Upload history page (what’s uploaded so far)

## Weeks 3–5: extraction + review + duplicates
- Extract fields from PDF text + Excel/CSV
- Needs-review queue + edit form
- Implement duplicate detection (file hash + invoice match + fallback)
- Audit events for edits and duplicate blocks/overrides

## Weeks 6–7: accounting-lite foundation (Stage 1)
- Chart of Accounts templates + party masters
- Voucher entry screens (sale/purchase/receipt/payment/journal)
- Auto-posting rules (double-entry)
- Reports: trial balance + basic P&L

## Weeks 8–9: 2B + reconciliation (official verification)
- GSP: fetch 2B (plus fallback: upload 2B export)
- Matching engine + mismatch reasons
- Reco dashboard + exception lists

## Weeks 10–12: filing flows (GSTR-1 + 3B) + status handling
- Generate return payloads (minimal supported sections first)
- Submit/file via GSP
- Status polling + error resolution UX (what failed and how to fix)
- Store acknowledgements/reference IDs

## Weeks 13–14: e-invoice/e-way (only if required) + hardening
- IRN generate/cancel (minimal)
- EWB generate/cancel (minimal)
- Reliability: retries, idempotency, rate limit handling

## Weeks 15–16: pilot launch
- Pilot with 2–5 companies, fix top issues near filing deadlines

