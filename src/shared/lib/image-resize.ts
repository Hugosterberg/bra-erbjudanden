type ResizeOptions = {
  // Longest edge of the output image in pixels.
  maxDimension: number;
  // WebP quality between 0 and 1.
  quality?: number;
};

// Raster formats we can safely redraw on a canvas. Vector (SVG) and icon
// formats are tiny already and are passed through untouched.
const RESIZABLE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function getExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  return normalized.includes(".") ? (normalized.split(".").pop() ?? "") : "";
}

function isResizable(file: File) {
  const type = file.type.toLowerCase();

  if (type.startsWith("image/")) {
    return ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(type);
  }

  return RESIZABLE_EXTENSIONS.has(getExtension(file.name));
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Kunde inte läsa bilden."));
    image.src = url;
  });
}

// Downscales and re-encodes an image to WebP in the browser before upload, so
// stored images stay small and fast. Falls back to the original file for
// unsupported formats or if anything goes wrong.
export async function resizeImageFile(
  file: File,
  { maxDimension, quality = 0.92 }: ResizeOptions,
): Promise<File> {
  if (typeof document === "undefined" || !isResizable(file)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const largestEdge = Math.max(image.width, image.height);
    const scale = Math.min(1, maxDimension / largestEdge);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );

    if (!blob) {
      return file;
    }

    // Keep the original if compression somehow produced a larger file and we
    // did not need to downscale.
    if (scale === 1 && blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
