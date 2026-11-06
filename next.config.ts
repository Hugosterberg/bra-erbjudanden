import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps the full path on our own /go links, so that revenue can be reported
  // per page, while other sites only see the domain.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Favicons go through the image optimizer so that visitors' browsers never
    // contact Google. See shared/ui/store-logo.tsx.
    remotePatterns: [{ protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons" }],
  },
  experimental: {
    // Image uploads run through Server Actions, whose request body defaults to
    // 1 MB. Raise it to fit logo (2 MB) and offer image (4 MB) uploads.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
