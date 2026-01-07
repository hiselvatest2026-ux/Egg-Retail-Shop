# Payments & billing model — MVP

This is about **how your app charges customers** (subscription), not GST payment by customers to vendors.

---

## 1) Who pays (billing account)
Billing is tied to an **Org (tenant)**:
- A business Org pays for its own companies/GSTINs.
- A CA Org can pay for multiple client companies (or you can bill per client company).

---

## 2) Plans (simple and workable)

### Plan A: Starter
Best for small businesses.
- Includes: 1 Company, 1 GSTIN, up to X users, monthly uploads up to Y docs
- Includes: 2B fetch, reconciliation, basic filing (GSTR-1 + 3B)

### Plan B: CA/Pro
Best for CA firms.
- Includes: multiple companies, up to N GSTINs, team roles, maker-checker, client dashboards
- Includes: filing workflows + reminders

### Add-ons (optional)
- Extra GSTINs
- Extra users
- E-invoice/e-way bill credits (if you implement those)
- Bulk OCR (if you add scanned image support later)

---

## 3) Pricing units (choose one)

### Option 1 (common): Per GSTIN / month
- Easy to understand.
- Matches value and compliance workload.

### Option 2: Per user / month
- Works if your main buyer is a CA firm and usage is team-driven.

### Option 3: Per document / month (usage-based)
- Works for high-volume businesses, but can create billing confusion.

Recommended for MVP: **Per GSTIN / month** + include a small number of users.

---

## 4) Payment flow in the app (MVP)

### MVP must include
- Choose plan → pay → activate
- Renewals (monthly/yearly)
- Payment success/failure status
- Download invoice/receipt

### Payment gateway (India)
Typical options:
- Razorpay / Cashfree / PayU / Stripe (India availability varies)

MVP can start with:
- Cards/UPI/Netbanking
- Automatic invoice generation

---

## 5) Minimum billing data to store
- `plan`: id, name, price, limits (GSTIN/users/docs)
- `subscription`: org_id, plan_id, status, start/end dates, renew_at
- `payment`: org_id, amount, currency, gateway_ref, status, created_at
- `invoice`: org_id, invoice_no, period, amount, tax, pdf_url, paid_at

---

## 6) Rules that avoid support issues
- Grace period after failure (e.g., 3–7 days) before locking filing features.
- Read-only access even when expired (so customers can download their data).
- Hard cap enforcement for plan limits with clear upgrade CTA.

