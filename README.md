# Link Shortener + WhatsApp Click Tracking

Generates short links tied to a mobile number, redirects clicks, and logs
every click for reporting on a built-in dashboard. Built with Next.js
(App Router) so it deploys on Vercel with zero server config, using
Supabase (Postgres) as the database.

## 1. Set up Supabase

1. Create a free project at https://supabase.com.
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → run it.
   This creates the `links` and `clicks` tables.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → this is `SUPABASE_URL`
   - `service_role` secret key → this is `SUPABASE_SERVICE_ROLE_KEY`
     (⚠️ never expose this key to the browser — it's only used in API
     routes, which run server-side)

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Visit http://localhost:3000/dashboard.

## 3. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

Or via the Vercel dashboard: "Add New Project" → import this repo →
in **Environment Variables** add:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL` (optional — set once you know your production
  domain, e.g. `https://links.yourbrand.com`; if left blank the app
  infers it from the incoming request)

Deploy. That's it — no other config needed.

## 4. Create a short link (API)

```
POST /api/create
Content-Type: application/json

{
  "long_url": "https://example.com/offer?utm=campaign1",
  "mobile_number": "+919876543210",
  "label": "Diwali offer batch 1"   // optional, just for your own reference
}
```

Response:

```json
{
  "short_url": "https://your-app.vercel.app/aB3xQ9k",
  "code": "aB3xQ9k",
  "long_url": "https://example.com/offer?utm=campaign1",
  "mobile_number": "+919876543210",
  "label": "Diwali offer batch 1",
  "created_at": "2026-07-24T10:00:00.000Z"
}
```

Send `short_url` in your WhatsApp message. When the recipient taps it,
they're redirected to `long_url` and the click is logged (timestamp, IP,
approximate location from Vercel's geo headers, referrer, device/user-agent).

Example (curl):

```bash
curl -X POST https://your-app.vercel.app/api/create \
  -H "Content-Type: application/json" \
  -d '{"long_url":"https://example.com/offer","mobile_number":"+919876543210"}'
```

## 5. View the dashboard

Go to `/dashboard` on your deployed app. It lists every link with:
- mobile number
- short link (with copy button)
- destination URL
- total clicks / unique clicks (by IP)
- last click time
- created date

Click any row to expand it and see every individual click (timestamp,
IP, location, referrer, device).

Search by mobile number using the search box — it calls
`GET /api/links?mobile=...` under the hood.

**Note:** the dashboard currently has no login/password, as requested.
If you want to lock it down later, the easiest options are:
- Vercel's built-in "Password Protection" (Pro plan feature), or
- adding simple HTTP Basic Auth in middleware.js (ask and I'll add it).

## How it works / project structure

```
app/
  api/create/route.js   POST -> creates a link, returns short_url
  api/links/route.js    GET  -> returns links + click stats (used by dashboard)
  [code]/route.js       GET  -> catch-all: logs the click, redirects to long_url
  dashboard/page.js      the reporting UI
lib/supabaseClient.js    Supabase server client (service role key)
supabase-schema.sql      run this in Supabase once
```

Because `[code]` is a dynamic route at the root, it only ever matches
paths that aren't one of your real routes (`/dashboard`, `/api/*`, `/`),
so there's no conflict — Next.js always prefers explicit routes over
the dynamic catch-all.

## Notes & things you may want to extend later

- **Duplicate mobile numbers**: each call to `/api/create` makes a new
  short code even for the same mobile number, so you can send the same
  person multiple different links over time — all trackable individually.
- **Click counting caveat**: some link previews (WhatsApp, iMessage)
  briefly fetch a URL to generate a preview card, which can register as
  an extra "click" before the real one. This is a known limitation of
  all URL shorteners on messaging apps; not something to fully solve
  server-side, but worth knowing when reading the numbers.
- **Rate limiting**: `/api/create` has no rate limit yet — fine for
  internal use, but add one (e.g. Upstash Ratelimit) before exposing it
  publicly.
