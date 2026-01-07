# Duplicate bill detection — MVP rules

## Where duplicates are checked
Duplicates are checked **within the selected company** (and GSTIN, if you separate by GSTIN).

## Rule 1: Same file duplicate (strongest)
- Compute `sha256` of the uploaded file bytes.
- If the same hash already exists for this company → **block**.

Why it helps: users often re-upload the same PDF again.

## Rule 2: Same invoice duplicate (strong)
After extracting invoice fields, normalize:
- `supplier_gstin`: uppercase, remove spaces
- `invoice_no_norm`: uppercase, remove spaces and common separators (`/`, `-`), trim
- `invoice_date`: normalize to ISO date

Then check:
- `company_id + supplier_gstin + invoice_no_norm + invoice_date`
- If match exists → **block** (already uploaded invoice).

## Rule 3: Fallback duplicate (when date missing or noisy)
If invoice date is missing/uncertain:
- Check `company_id + supplier_gstin + invoice_no_norm`
- And compare amounts:
  - total_value matches within a small tolerance (example: ±₹1 or ±0.5)
  - or tax breakup matches within tolerance

If match found → **warn** or **block** (configurable).

## What user sees
When duplicate detected, show:
- Duplicate reason (same file / same invoice fields)
- Link to existing invoice/document
- If admin allows override: user must enter a reason (saved in audit)

## MVP assumption (important)
- MVP works best when **one file = one invoice**.
- If a PDF contains many invoices (bundle), MVP should:
  - mark it as “Needs review”, and/or
  - require user to upload invoices separately

