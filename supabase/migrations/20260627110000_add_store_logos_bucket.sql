-- Public storage bucket for store logos uploaded from the admin panel.
-- Uploads happen server-side with the service role key (bypasses RLS),
-- while public read access lets the logos render on the public site.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-logos',
  'store-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Store logos are publicly readable" on storage.objects;
create policy "Store logos are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'store-logos');
