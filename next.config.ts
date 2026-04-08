import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://main.d37d9ht7n6b9zl.amplifyapp.com",
  },
};

export default nextConfig;
