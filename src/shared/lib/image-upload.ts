const EXTENSION_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export type ResolvedImageUpload =
  | { ok: true; mime: string; extension: string }
  | { ok: false; message: string };

function extensionFromFileName(fileName: string) {
  const normalized = fileName.trim().toLowerCase();

  if (!normalized.includes(".")) {
    return "";
  }

  return normalized.split(".").pop() ?? "";
}

// Browsers on Windows often send an empty type or image/jpg. Supabase buckets
// reject application/octet-stream, so we derive a supported MIME from the name.
export function resolveUploadedImage(
  file: File,
  allowedExtensions: string[],
): ResolvedImageUpload {
  const extensionFromName = extensionFromFileName(file.name);
  let mime = file.type.trim().toLowerCase();

  if (mime === "image/jpg") {
    mime = "image/jpeg";
  }

  if (!mime || mime === "application/octet-stream") {
    mime = EXTENSION_TO_MIME[extensionFromName] ?? "";
  }

  const extension =
    MIME_TO_EXTENSION[mime] ??
    (allowedExtensions.includes(extensionFromName) ? extensionFromName : "");

  if (!mime || !extension || !allowedExtensions.includes(extension)) {
    return {
      ok: false,
      message: `Filformatet stöds inte. Använd ${allowedExtensions
        .map((value) => value.toUpperCase())
        .join(", ")}.`,
    };
  }

  return { ok: true, mime, extension };
}
