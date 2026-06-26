# braerbjudanden.se

A modern Swedish affiliate platform built with Next.js, TypeScript and Supabase.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Required Supabase variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side click inserts
- `CLICK_HASH_SALT` for privacy-conscious IP hashing

Apply the SQL migration in `supabase/migrations/20260626120000_initial_schema.sql`
to create stores, categories, offers, click events, admin profiles, indexes and RLS
policies.

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
