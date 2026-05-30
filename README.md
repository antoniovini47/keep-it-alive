# Keep it Alive!!!

Pings your projects (and other URLs) on a schedule so free-tier services stay active.

## Recommended: GitHub Actions (free, reliable)

GitHub runs the job on a schedule — no server that can sleep on you.

### Setup

1. Create a new GitHub repo and push this folder.
2. Copy `config.example.json` → `config.json` and add your projects (see below).
3. In the repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `REPO_SECRET`
   - Value: open your local `config.json`, **select all**, copy, and paste the **entire file** — no minifying, no editing. Pretty-printed JSON with line breaks is fine.

   ```json
   {
     "targets": [ ... ]
   }
   ```

4. Push `.github/workflows/keepalive.yml` — workflows run automatically on the default branch.

5. **Actions** tab → open **Keep services alive** → **Run workflow** once to test.

GitHub may delay the first scheduled run by a few minutes; `workflow_dispatch` is for manual tests.

### Ping interval

The schedule lives in **`.github/workflows/keepalive.yml`**, not in `config.json`. Edit the `cron` line to change how often targets are pinged:

```yaml
on:
  schedule:
    - cron: "*/10 * * * *"   # every 10 minutes (default)
```

Examples (UTC):

| Cron | Frequency |
|------|-----------|
| `*/5 * * * *` | Every 5 minutes (GitHub minimum) |
| `*/10 * * * *` | Every 10 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Once per hour |

GitHub uses **UTC** for cron. Scheduled runs can drift a few minutes under load — normal for free-tier Actions.

### What to ping for Supabase

| Endpoint | Purpose |
|----------|---------|
| `https://<ref>.supabase.co/auth/v1/health` | Lightweight auth health check |
| `https://<ref>.supabase.co/rest/v1/` | Touches PostgREST (DB/API path) |

Use your project **anon** key in `apikey` and `Authorization: Bearer <anon>` for REST. Keys in GitHub Secrets are not exposed in logs when used as `REPO_SECRET`.

Also ping your **frontend/API** URLs (Vercel, Netlify, etc.) if those free tiers pause too.

---

## Local test

```bash
cp config.example.json config.json
# edit config.json with real URLs and keys
npm run ping
```

---

## Optional: always-on server

```bash
npm start
```

Pings every **10 minutes** by default. Override with env:

```bash
PING_INTERVAL_SECONDS=300 npm start
```

Deploy to Render/Railway/Fly with `npm start` and env `REPO_SECRET` (paste full `config.json`) or mount `config.json`.

**Caveat:** many free web hosts **sleep** when idle, so internal `setInterval` may not fire. GitHub Actions avoids that.

---

## Other free schedulers

- [cron-job.org](https://cron-job.org) — HTTP GET to a small endpoint you host, or call Supabase URLs directly.
- **Cloudflare Workers** — Cron Triggers (always-on edge, generous free tier).

---

## Config reference

Top-level shape:

```json
{
  "targets": [ ... ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `targets` | yes | Array of URLs to ping (see below). |

Each target:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Label in logs |
| `url` | yes | Full URL to request |
| `method` | no | Default `GET` |
| `headers` | no | e.g. Supabase `apikey` |
| `body` | no | JSON object for POST |
