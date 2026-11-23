import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this project (silences the "multiple lockfiles" warning).
  outputFileTracingRoot: path.resolve(process.cwd()),
  // Prisma's query engine must not be bundled into the server build.
  serverExternalPackages: ["@prisma/client", "prisma"],
  poweredByHeader: false,
};

export default nextConfig;
