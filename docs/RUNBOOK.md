# Mama Lucica — Production Runbook

## 1. Backup & Restore

### Automated backups (Lovable Cloud / Supabase)
- **Frequency**: Daily PITR (Point-in-Time Recovery) — managed automatically by Supabase, retained **7 days** on Pro plan.
- **Verification**: Check via Cloud → Database → Backups (last successful backup timestamp).

### On-demand backup (before risky migrations)
```bash
# Replace with project ref
SUPABASE_DB_URL="$SUPABASE_DB_URL" pg_dump --no-owner --no-privileges \
  --schema=public --data-only \
  -f "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Restore procedure (TESTED)
1. **Stop write traffic**: Enable maintenance mode (Admin → System → Mentenanță → ON).
2. **Identify recovery point**: Note the exact timestamp (UTC) you want to restore to.
3. **PITR via Cloud UI**: Database → Backups → "Restore to a point in time" → enter timestamp.
4. **Verify**: After restore (~5–15 min), run smoke checks:
   - `SELECT count(*) FROM orders WHERE created_at::date = CURRENT_DATE;`
   - `SELECT count(*) FROM products WHERE stock > 0;`
   - Visit homepage + a product page + admin dashboard.
5. **Disable maintenance mode**.
6. **Audit**: Insert a manual `audit_log` entry documenting reason + operator + timestamp.

### Restore test cadence
- **Quarterly**: Restore latest backup to a separate Supabase project, run smoke checks, document timing.
- **Last successful test**: _to be filled by ops team_.

---

## 2. Incident response

### Severity levels
| Level | Definition | Response time |
|---|---|---|
| SEV-1 | Site down / payments broken | < 15 min |
| SEV-2 | Major feature degraded (cart, login) | < 1h |
| SEV-3 | Minor bug, single page affected | < 24h |

### Detection signals
- **Health check failure** (admin notification "🚨 Health check DOWN") — see `/admin/system/observability`.
- **Error spike** (>100 errors / 5 min in `error_log`).
- **Uptime check fail** (`uptime_log.is_healthy = false` 2× consecutive).
- **External**: UptimeRobot/BetterStack alert email/SMS.

### SEV-1 playbook
1. Acknowledge alert.
2. Open Admin → Observability — check which check is failing.
3. Check Lovable Cloud status: https://status.lovable.dev
4. Check edge function logs: Cloud → Functions → `health-check` → Logs.
5. If DB issue: enable maintenance mode, contact Lovable support.
6. If specific function: redeploy via Lovable, then re-run health check.
7. Post-mortem within 48h.

---

## 3. External services & fallbacks

| Service | Purpose | Failure mode | Fallback |
|---|---|---|---|
| **Netopia** | Card payments | Gateway 5xx → `payment_status = failed` | Customer sees retry CTA + offer of Bank Transfer or Cash on Delivery |
| **Mokka / PayPo** | BNPL installments | Provider down | Hidden from checkout (admin toggle) |
| **Resend** | Transactional email | API quota / 5xx | Order completes; email queue retries via `send-email` edge fn (3 attempts, exp backoff) |
| **Twilio / SMSO** | SMS notifications | Provider down | Skipped silently; logged in `sms_log` with `status=failed` |
| **Sameday / DPD / Cargus** | AWB generation | Carrier API down | AWB generation deferred; admin manual trigger from order detail |
| **SmartBill** | Invoicing | API down | Invoice generation queued; manual retry from `/admin/orders/invoices` |
| **ANAF lookup** | CUI validation | API down | Falls back to manual CUI entry (validation skipped) |
| **Lovable AI Gateway** | Product description AI | API down | Form remains editable manually |

---

## 4. Monitoring stack

### Internal (active)
- `error_log` — all front-end + back-end errors, viewable at `/admin/system/observability`.
- `uptime_log` — populated by `health-check` edge fn, scheduled via `pg_cron` every 5 min.
- `health_check_results` — per-check granular status.
- `admin_notifications` — alert delivery to admin UI bell.

### External (recommended setup)
1. **UptimeRobot** (free tier): monitor `https://your-domain.lovable.app/` every 5 min. Alert webhook → admin email.
2. **BetterStack / Sentry** (paid): inject Sentry snippet via Admin → Custom Scripts. `errorReporter.ts` will auto-forward to `window.Sentry` if loaded.
3. **Status page**: BetterStack public status page linked from footer.

### Activate UptimeRobot
1. Sign up at uptimerobot.com (free).
2. Add monitor → HTTP(s) → `https://<your-domain>/` → 5 min interval.
3. Add monitor → keyword → `https://<your-domain>/admin` should NOT contain "Eroare".
4. Alert contacts: ops email + SMS.

### Activate Sentry (optional)
1. Create Sentry project (Browser JS).
2. Admin → Conținut → Custom Scripts → Add new:
   ```html
   <script src="https://browser.sentry-cdn.com/7.x/bundle.tracing.min.js" crossorigin="anonymous"></script>
   <script>
     Sentry.init({
       dsn: "YOUR_DSN_HERE",
       release: "mamalucica@" + (window.__APP_VERSION__ || "1.0.0"),
       tracesSampleRate: 0.1,
     });
   </script>
   ```
3. Set Location = `<head>`, Pages = `all`.
4. `errorReporter.ts` will forward all errors automatically.

---

## 5. Cron jobs

Scheduled via `pg_cron` (Cloud → Database → Extensions → enabled):

| Job | Schedule | Purpose |
|---|---|---|
| `health-check` | `*/5 * * * *` | Probe DB + storage + error rate |
| `recover-abandoned-carts` | `0 */6 * * *` | Email recovery sequence |
| `check-tracking` | `0 */2 * * *` | Update AWB statuses |
| `cleanup_old_observability_logs()` | `0 3 * * *` | Retention 30/90 days |
| `cleanup_old_chatbot_conversations()` | `0 4 * * *` | 30-day chatbot retention |

To inspect: `SELECT * FROM cron.job;`

---

## 6. Release process

1. PR → CI passes (lint + typecheck + tests + audit + build).
2. Merge to main → auto-deploy to preview.
3. Smoke test preview manually (5 critical flows).
4. Click "Update" in Lovable → live.
5. Tag commit `vX.Y.Z` for release tracking in `errorReporter`.
6. Watch `/admin/system/observability` for 30 min post-deploy.

---

## 7. Disaster recovery RTO / RPO

| Metric | Target | Actual |
|---|---|---|
| **RTO** (Recovery Time Objective) | 1h | ~30 min (PITR restore) |
| **RPO** (Recovery Point Objective) | 5 min | ~1 min (continuous WAL) |
| **Backup retention** | 7 days | Lovable Pro default |
| **Restore tested** | Quarterly | _next test due: _ |
