# braerbjudanden.se

## Vision

braerbjudanden.se hjälper svenska konsumenter att hitta de bästa erbjudandena på internet.

Fokus ligger på:

- Rabattkoder
- Kampanjer
- Prisnedsättningar
- Cashback
- Affiliateerbjudanden
- Begränsade kampanjer
- Redaktionellt utvalda erbjudanden

Webbplatsen ska kännas trovärdig, snabb och enkel att använda.

Vi prioriterar användarens förtroende framför kortsiktig intäkt.

---

# Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Vercel
- Zod
- React Hook Form
- Server Components by default
- Server Actions where appropriate

---

# Architecture

Use Vertical Slice Architecture.

Never organize code by technical layers.

Prefer:

features/
    deals/
    stores/
    coupons/
    campaigns/
    search/
    tracking/
    admin/

Each feature owns:

- UI
- queries
- actions
- types
- validation
- business rules

Shared code only belongs in shared/ if used by multiple slices.

---

# Naming

All source code is written in English.

Examples:

Deal
Store
Campaign
Coupon
Category
AffiliateClick

Functions:

createDeal()

publishDeal()

trackAffiliateClick()

findActiveDeals()

Database tables are English.

Variables are English.

Comments are English.

Commit messages are English.

---

# Public website

The website language is Swedish.

Routes should be Swedish.

Examples:

/

erbjudanden/

rabattkoder/

butiker/

kampanjer/

kategorier/

Content is Swedish.

SEO metadata is Swedish.

---

# Design Principles

Always prefer:

- SOLID
- Composition
- Explicit dependencies
- Type safety
- Small components
- Small functions
- Readability over cleverness

Avoid:

- God classes
- Generic Services folders
- Huge Utils folders
- Premature abstractions
- Business logic inside UI

---

# Database

Supabase is the single source of truth.

Use generated types.

Enable Row Level Security.

Keep database access server-side.

---

# SEO

Every public page should support:

- title
- description
- canonical
- OpenGraph
- structured data
- metadata

SEO is a first-class concern.

---

# Affiliate

Affiliate links should never be hardcoded inside UI.

Tracking should be centralized.

Affiliate disclosure must always be visible.

Never make misleading claims.

Never display expired deals as active.

---

# UI

Design should feel:

- modern
- trustworthy
- Scandinavian
- clean
- premium
- mobile first

Avoid spammy affiliate aesthetics.

---

# AI Rules

Whenever implementing a feature:

1. Determine the correct vertical slice.
2. Update the database if required.
3. Create schemas.
4. Create types.
5. Create queries/actions.
6. Create UI.
7. Add validation.
8. Add SEO.
9. Update documentation if necessary.

Never restructure the project unless explicitly instructed.

Never introduce new libraries without explaining why.

Always prefer existing patterns over inventing new ones.

Consistency is more important than cleverness.