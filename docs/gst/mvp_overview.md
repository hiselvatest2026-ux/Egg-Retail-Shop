# GST App MVP — 1 page overview (layman English)

## Goal
Let any company log in, upload GST bills (purchase/sales), see **what is uploaded so far**, and stop **duplicate bills**. Then reconcile purchases using **official GSTR-2B**, prepare returns, and (if we enable it) **file GSTR-1 and GSTR-3B via a GSP**.

## What users can do in MVP (filing-capable version)
- Create/select a company (GSTIN + state).
- Upload bills (Purchases or Sales).
- See upload history (search invoice no / GSTIN / month).
- Get duplicate warning/block when uploading.
- Fix extracted invoice details in a “Needs review” screen.
- Connect GSTIN (via GSP) and fetch **GSTR-2B**, or upload 2B export (fallback).
- Reconcile purchases (Matched / Not in 2B / Mismatch) with clear mismatch reasons + bulk actions.
- Download reports (vendor follow-up, mismatches, monthly totals).
- Prepare **GSTR-1 + GSTR-3B** data and submit/file (via GSP) with status + error handling.
- (If required) generate **e-invoice IRN** and **e-way bill** for eligible invoices (minimal).

## What MVP will NOT do
- No automatic “clicking GST portal” or scraping.
- No high-accuracy OCR for scanned images (later).
- No full accounting (only document + invoice extraction + reconciliation + reporting).

## Supported uploads (MVP)
- PDF with selectable text
- Excel / CSV

## Duplicate prevention (MVP)
Duplicates are checked **within the selected company**:
- Same file uploaded again → blocked (file hash)
- Same invoice again → blocked (supplier GSTIN + invoice number + invoice date)
- Fallback duplicate check → warn/block (supplier GSTIN + invoice number + amount match)

## Success metrics (simple)
- Upload success rate (no parsing errors)
- % invoices auto-extracted without manual correction
- Duplicate prevention works (false duplicates kept low)
- Time saved in reconciliation (exceptions list is useful)

