import type { NextConfig } from "next";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/webapp" : "");

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
};

export default nextConfig;
