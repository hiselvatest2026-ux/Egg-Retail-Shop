# Compliance calendar + filing status — MVP

You asked for:
- due dates for all use cases
- whether “2B is filed or not” and clear status

Important note:
- **GSTR-2B is not “filed” by the taxpayer.** It is an **auto-generated statement** based on suppliers’ filings (mainly GSTR-1/IFF) and other sources.
- What users usually want is:
  1) **Return filing status** for *their* GSTIN (GSTR-1, GSTR-3B)
  2) **2B availability / last refreshed** and what is missing (vendor side compliance)

---

## 1) What the dashboard should show (per GSTIN, per period)

### A) Compliance calendar (due dates)
For each month/quarter show:
- **GSTR-1 due date**
- **GSTR-3B due date**
- (Optional) other forms later

Also show:
- Days left / overdue
- Late fee/interest warning (simple “may apply” message)

### B) Status for each return (simple states)
For each period:
- **Not started**
- **Draft ready** (data prepared, pending review)
- **Pending review** (maker-checker)
- **Ready to file**
- **Submitted**
- **Filed**
- **Error** (with reason + next step)

### C) “2B status” (what users mean)
Show:
- **2B fetched for period?** Yes/No
- **Last fetched at** timestamp
- **Invoice match summary**:
  - Matched
  - Not in 2B (vendor follow-up)
  - Mismatch

This answers “is 2B done/available” in a practical way.

---

## 2) How to get statuses (MVP)

### Preferred: via GSP/GSTN APIs
- Fetch filing status for GSTR-1 / 3B (per GSTIN, per period)
- Fetch 2B for period

### Fallback (if some APIs aren’t available)
- Allow user to upload:
  - 2B export (JSON/PDF)
  - acknowledgement / ARN details (manual entry) for filing proof

---

## 3) Due dates logic (MVP approach)

In MVP keep it simple:
- Store due dates in your system by **return type + period + taxpayer type** (monthly vs quarterly).
- Allow Admin to override due date for a GSTIN if needed (because due dates can vary by notifications).

Data to store:
- `due_date_rule`: return_type, frequency, period, due_date
- `gst_period_status`: gstin_id, period, return_type, status, last_checked_at, ack_ref

---

## 4) “All use cases” (what we cover in MVP vs later)

### MVP calendar covers
- GSTR-1 (monthly)
- GSTR-3B (monthly)

### Later (optional)
- Quarterly filers (IFF)
- Annual returns (GSTR-9/9C) if you choose
- Notices tracking

