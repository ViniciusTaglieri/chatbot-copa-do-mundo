import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.upload.wikimedia.org" },
      { protocol: "https", hostname: "*.google.com" },
      { protocol: "https", hostname: "*.gstatic.com" },
    ],
  },
};

export default nextConfig;
