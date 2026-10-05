import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logo uploads are capped at 1MB by the action itself; leave headroom for
      // the multipart envelope and other form fields.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
