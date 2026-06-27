/**
 * Verifies Supabase Storage uploads for offer-images and store-logos buckets.
 * Run: node --env-file=.env.local scripts/test-storage-upload.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1x1 transparent PNG
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function testBucket(bucket) {
  const path = `test/${randomUUID()}.png`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, png, { contentType: "image/png", upsert: false });

  if (error) {
    console.error(`FAIL upload [${bucket}]:`, error.message, error);
    return false;
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log(`OK upload [${bucket}]:`, data?.path);
  console.log(`   public URL:`, publicUrl.publicUrl);

  const res = await fetch(publicUrl.publicUrl, { method: "HEAD" });
  console.log(`   HEAD ${res.status} ${res.statusText}`);

  await supabase.storage.from(bucket).remove([path]);
  console.log(`   cleaned up test file`);
  return res.ok;
}

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("FAIL listBuckets:", error.message);
    return;
  }
  console.log(
    "Buckets:",
    data.map((b) => `${b.id} (public=${b.public})`).join(", ") || "(none)",
  );
}

await listBuckets();

let ok = true;
for (const bucket of ["offer-images", "store-logos"]) {
  const result = await testBucket(bucket);
  ok &&= result;
}

process.exit(ok ? 0 : 1);
