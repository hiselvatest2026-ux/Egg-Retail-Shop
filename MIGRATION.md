## Migration plan (cost-optimized v2) — zero downtime

Scope: Move backend to autosuspend-friendly host with Neon Postgres; serve frontend as static site, keep current live stack untouched until cutover.

Branches
- migration: implementation work for v2 infra/config (no feature changes)
- staging: optional branch to validate deployments before cutover

Infra (v2)
- DB: Neon Postgres (serverless). Create project and database, enable pooled connection string
- Backend: Deploy from migration branch with autosuspend (Render free or Cloudflare Workers/Pages Functions). Use DATABASE_URL from Neon; tune pg Pool keep-alive and timeouts
- Frontend: Deploy static build (Netlify/Cloudflare Pages/Render static) pointing to backend v2 URL

Data import
1) Export current Postgres: pg_dump --no-owner --no-acl $LIVE_DATABASE_URL > dump.sql
2) Import to Neon: psql $NEON_DATABASE_URL -f dump.sql

App configuration
- backend/models/db.js: prefer process.env.DATABASE_URL; enable ssl=true; reduce idleTimeoutMillis; keepAlive true
- render.v2.yaml: define separate services (zeroegg-backend-v2, zeroegg-frontend-v2) with autoDeploy disabled and autosuspend

Validation (staging)
- Smoke test: /dashboard, Walk-in sale create, regular sale create, MIS CSV, collections
- Compare key metrics between live and v2 for last 7 days

Cutover (DNS)
1) Approve cutover window
2) Flip frontend DNS to v2 static host
3) Monitor logs and metrics for 30–60 min

Rollback
- Repoint DNS to current live frontend
- If DB writes were performed during v2 window and need to keep, capture delta and re-apply to live DB or keep Neon as primary henceforth

Notes
- Do not merge migration to main until post-cutover bake period completes
- Keep live Render services running and autoDeploy on main only

