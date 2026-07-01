import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canonical host is the apex (no www): redirect www.* to dynastycardvault.com.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dynastycardvault.com" }],
        destination: "https://dynastycardvault.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
