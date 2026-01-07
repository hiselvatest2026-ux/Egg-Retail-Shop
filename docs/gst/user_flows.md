# User flows (screens) — MVP

## 1) Login
- User logs in.
- User sees list of companies they can access.

## 2) Company switcher
- User selects a company (and GSTIN if multiple).
- App context becomes: **this company only**.

## 3) Upload bills (Purchases / Sales)
- Choose: Purchases or Sales.
- Upload one or multiple files.
- While uploading:
  - app runs duplicate checks
  - app shows result per file: Accepted / Blocked duplicate / Needs review

### Duplicate modal (when detected)
- Show why it is a duplicate (file hash match or invoice fields match).
- Show link to the existing record.
- Optional (Admin setting): “Upload anyway” requires reason.

## 4) Upload history (“what was uploaded so far”)
Table with:
- Uploaded time, uploaded by
- Purchase/Sale
- Supplier/Customer GSTIN (if extracted)
- Invoice no, date, total/tax (if extracted)
- Status: Processing / Processed / Needs review / Duplicate blocked
Filters:
- Month, supplier/customer GSTIN, invoice number, status

## 5) Needs review queue
- List of files with low-confidence extraction or missing required fields.
- Clicking opens a review form to edit:
  - GSTINs, invoice no/date, amounts
- Save creates/updates the invoice record and re-runs duplicate check if needed.

## 6) Dashboard
- Monthly totals: Purchases vs Sales.
- Counts: uploaded, processed, needs review, duplicate blocked.
- Drill-down into month → invoices list.

## 7) GSTR-2B upload + reconciliation (purchases)
- Upload GSTR-2B file (JSON/PDF as supported).
- App matches purchases to 2B and shows:
  - Matched
  - Not in 2B (vendor follow-up)
  - Mismatch (reason shown)

## 8) Reports & downloads
- Vendor follow-up list
- Mismatch list
- Monthly totals

## 9) Admin settings (company)
- Manage users + roles
- Configure duplicate policy (block vs allow override + reason)

