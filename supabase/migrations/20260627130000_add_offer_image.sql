-- Optional product/brand image for an offer. Rendered in the offer cards and
-- on the offer detail page in the slot previously used by the discount chip.
alter table public.offers
  add column if not exists image_url text;

-- Public storage bucket for offer images uploaded from the admin panel.
-- Uploads happen server-side with the service role key (bypasses RLS),
-- while public read access lets the images render on the public site.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  true,
  4194304,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Offer images are publicly readable" on storage.objects;
create policy "Offer images are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'offer-images');
