import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Image uploads run through Server Actions, whose request body defaults to
    // 1 MB. Raise it to fit logo (2 MB) and offer image (4 MB) uploads.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
