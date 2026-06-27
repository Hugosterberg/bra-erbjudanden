-- Adds an optional human-readable terms/conditions line to offers
-- (e.g. "Vid köp över 500 kr"). Shown publicly next to the offer.
alter table public.offers
  add column if not exists terms text;
