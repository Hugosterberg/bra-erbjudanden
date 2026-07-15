# braerbjudanden.se

A modern Swedish affiliate platform built with Next.js, TypeScript and Supabase.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Configure these variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side click inserts and admin CRUD
- `SUPABASE_DB_PASSWORD` for Supabase CLI migration commands
- `CLICK_HASH_SALT` for privacy-conscious IP hashing
- `ADMIN_PASSWORD` for password-only admin login at `/admin`
- `CRON_SECRET` for securing the nightly affiliate import cron job
- Affiliate network credentials (enable only the networks you are approved on):
  - `ADDREVENUE_API_TOKEN` + `ADDREVENUE_CHANNEL_ID`
  - `ADTRACTION_API_TOKEN` + `ADTRACTION_CHANNEL_ID`
  - `ADRECORD_API_KEY` + `ADRECORD_CHANNEL_ID`
  - `AWIN_ACCESS_TOKEN` + `AWIN_PUBLISHER_ID` (+ optional `AWIN_REGION_CODE`, default `SE`)
  - `TRADEDOUBLER_VOUCHERS_TOKEN`

Affiliate imports run on a schedule via Vercel Cron and can be triggered manually from `/admin/import`.

```bash
npm run test:import
```

## Data persistence

All persistent application data is stored in Supabase. Admin forms submit through
server actions, and click tracking writes to `click_events` server-side. Do not
use `localStorage`, `sessionStorage` or IndexedDB for offers, stores,
categories, clicks or admin-managed content.

Apply the SQL migration in `supabase/migrations/20260626120000_initial_schema.sql`
to create stores, categories, offers, click events, indexes and RLS policies.

## Supabase CLI

The project is initialized for Supabase CLI commands. The linked remote project
is `bra-erbjudanden`.

Add your database password to `.env.local`:

```env
SUPABASE_DB_PASSWORD=
```

You can find it in Supabase Dashboard under database connection settings. If you
do not know it, reset the database password in Supabase and update `.env.local`.

Run:

```bash
npm run db:list
npm run db:push
```

For any other Supabase command:

```bash
npm run supabase -- status
npm run supabase -- db pull
```

## Purpose

The goal is to help Swedish consumers discover high-quality offers while maintaining transparency and trust.

Revenue comes from:

- Affiliate links
- Discount codes
- Cashback partnerships
- Sponsored campaigns

The platform prioritizes:

- Fast performance
- Excellent SEO
- Strong UX
- Trustworthy recommendations

## Tech Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Supabase
- Vercel

## Architecture

Vertical Slice Architecture

Each feature owns its own:

- components
- actions
- queries
- types
- validation

Shared functionality belongs in shared/.

## Principles

- Mobile First
- Server Components by default
- SEO First
- Accessibility
- Clean Code
- Type Safety
