# Milestones — MVP build plan (6–10 weeks)

## Week 0 (1–2 days): confirm scope
- Target user: CA firm vs business owner (or both)
- Upload types: PDF text + Excel/CSV only for MVP
- Duplicate policy: block by default; allow override with reason?
- 2B format: JSON upload first (PDF later if needed)

## Weeks 1–2: foundation
- Multi-company + multi-user login
- Company setup (GSTIN + state)
- Upload bills (purchase/sale) + file storage
- Upload history page (what’s uploaded so far)

## Weeks 3–5: extraction + review
- Extract fields from PDF text + Excel/CSV
- Needs-review queue + edit form
- Implement duplicate detection (file hash + invoice match + fallback)
- Audit events for edits and duplicate blocks/overrides

## Weeks 6–7: 2B upload + reconciliation
- Upload 2B export
- Matching engine + mismatch reasons
- Reco dashboard + exception lists

## Weeks 8–10: hardening + pilot
- Improve validations, error handling, retries
- Performance tuning for bulk uploads
- Pilot with 2–5 companies, fix top issues

