# GitHub Copilot instructions

This repository is for `braerbjudanden.se`, a Swedish premium offers and affiliate deals website.

## Stack

Use Next.js App Router, React, TypeScript, Supabase, Vercel, Tailwind CSS and shadcn/ui.

## Architecture

Use vertical slice architecture. Prefer feature folders such as:

- `features/offers`
- `features/stores`
- `features/categories`
- `features/clicks`
- `features/admin`

Keep shared code in `shared/` only when it is genuinely reusable.

## Naming

- UI copy: Swedish.
- Code, file names and database names: English.

## Product behavior

- Offers are ranked manually by admin.
- Every outbound offer click should be tracked.
- Admin can create, edit, publish, archive and rank offers.
- Initial authentication is admin-only.
- Main discount types are percentage discount and fixed amount discount.
- Support discount codes and affiliate links.

## Avoid

- Customer accounts at launch.
- Payments at launch.
- User-submitted offers at launch.
- Overly complex filters.
- A cheap coupon-site feeling.
