-- POLREADY: public storage bucket for the bank QR code shown on the payment page.
-- The QR code itself isn't sensitive (equivalent to a shop's printed QR code), so a
-- public bucket is used to avoid minting signed URLs on every membership page load.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-assets', 'payment-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
