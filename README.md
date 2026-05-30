# Keep it Alive!!!

Pings your projects (and other URLs) every **10 minutes** so free-tier services stay active.

## Recommended: GitHub Actions (free, reliable)

GitHub runs the job on a schedule — no server that can sleep on you.

### Setup

1. Create a new GitHub repo and push this folder.
2. Copy `config.example.json` → `config.json` and add your projects (see below).
3. In the repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `PING_TARGETS`
   - Value: the **entire** `targets` array from `config.json`, as one line of JSON, for example:

```json
[{"name":"project-a","url":"https://abc.supabase.co/auth/v1/health","method":"GET","headers":{"apikey":"eyJ..."}}]
```

4. Push `.github/workflows/keepalive.yml` — workflows run automatically on the default branch.
5. **Actions** tab → open **Keep services alive** → **Run workflow** once to test.

GitHub may delay the first scheduled run by a few minutes; `workflow_dispatch` is for manual tests.

### What to ping for Supabase

| Endpoint | Purpose |
|----------|---------|
| `https://<ref>.supabase.co/auth/v1/health` | Lightweight auth health check |
| `https://<ref>.supabase.co/rest/v1/` | Touches PostgREST (DB/API path) |

Use your project **anon** key in `apikey` and `Authorization: Bearer <anon>` for REST. Keys in GitHub Secrets are not exposed in logs when used as `secrets.PING_TARGETS`.

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
PING_INTERVAL_MINUTES=10 PING_TARGETS='[...]' npm start
```

Deploy to Render/Railway/Fly with `npm start` and env `PING_TARGETS` or mount `config.json`.

**Caveat:** many free web hosts **sleep** when idle, so internal `setInterval` may not fire. GitHub Actions avoids that.

---

## Other free schedulers

- [cron-job.org](https://cron-job.org) — HTTP GET to a small endpoint you host, or call Supabase URLs directly.
- **Cloudflare Workers** — Cron Triggers (always-on edge, generous free tier).

---

## Config reference

Each target:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Label in logs |
| `url` | yes | Full URL to request |
| `method` | no | Default `GET` |
| `headers` | no | e.g. Supabase `apikey` |
| `body` | no | JSON object for POST |
