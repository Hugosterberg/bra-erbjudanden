import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const cases = [
  { label: "empty content-type", contentType: "" },
  { label: "image/jpg", contentType: "image/jpg" },
  { label: "application/octet-stream", contentType: "application/octet-stream" },
];

const EXTENSION_TO_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function resolveMime(fileName, rawType) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  let mime = rawType?.toLowerCase() ?? "";
  if (mime === "image/jpg") mime = "image/jpeg";
  if (!mime || mime === "application/octet-stream") {
    mime = EXTENSION_TO_MIME[ext] ?? "";
  }
  return mime;
}

for (const bucket of ["offer-images", "store-logos"]) {
  console.log(`\n=== ${bucket} (with MIME resolution) ===`);
  for (const testCase of cases) {
    const path = `test/${randomUUID()}.png`;
    const mime = resolveMime("photo.png", testCase.contentType);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, png, { contentType: mime, upsert: false });

    console.log(
      testCase.label,
      error ? `FAIL: ${error.message}` : `OK (sent ${mime})`,
    );
    if (!error) await supabase.storage.from(bucket).remove([path]);
  }
}
