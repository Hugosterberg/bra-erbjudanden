import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Rabattkoder was a subset of Erbjudanden; consolidated into one page.
        source: "/rabattkoder",
        destination: "/erbjudanden",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
