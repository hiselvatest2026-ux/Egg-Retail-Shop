# Data model (simple) — MVP

This is the minimum set of “things” we store so uploads, duplicates, review, and reconciliation work.

## Org / Tenant
- `org`: id, name, plan, created_at

## Users + access
- `user`: id, org_id, name, email, password_hash, status
- `membership`: user_id, org_id, role (admin/preparer/reviewer/readonly)
- (Optional) `company_membership`: user_id, company_id, role override

## Company & GSTIN
- `company`: id, org_id, name, primary_gstin, state_code
- `gstin`: id, company_id, gstin, state_code

## Uploads (raw files)
- `document`: id, company_id, gstin_id (optional), type (purchase|sale|2b), filename, mime_type, size_bytes
- `document`: storage_key, sha256_hash, uploaded_by, uploaded_at, status (processing|processed|needs_review|blocked_duplicate)

## Extracted invoices (normalized)
- `invoice`: id, company_id, gstin_id (optional), direction (purchase|sale)
- `invoice`: supplier_gstin, customer_gstin, invoice_no_raw, invoice_no_norm, invoice_date
- `invoice`: taxable_value, igst, cgst, sgst, cess, total_value, currency
- `invoice`: source_document_id, extraction_confidence, created_by, created_at

## Duplicate tracking
- Unique constraints (MVP):
  - `document.company_id + document.sha256_hash` (same file uploaded again)
  - `invoice.company_id + invoice.supplier_gstin + invoice.invoice_no_norm + invoice.invoice_date` (same invoice again)
- `duplicate_event`: id, company_id, document_id, matched_invoice_id, action (blocked|overridden), reason, actor_user_id, created_at

## 2B upload + reconciliation
- `gstr2b_import`: id, company_id, gstin_id, period (YYYY-MM), source_document_id, imported_at
- `gstr2b_invoice`: id, gstr2b_import_id, supplier_gstin, invoice_no_norm, invoice_date, taxable_value, igst, cgst, sgst, total_value
- `reco_result`: id, invoice_id, gstr2b_invoice_id (nullable), status (matched|not_in_2b|mismatch), mismatch_reason

## Audit trail
- `audit_event`: id, org_id, company_id, actor_user_id, entity_type, entity_id, action, before_json, after_json, created_at

