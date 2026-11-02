import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Docker builds have no .git (see .dockerignore), so CI passes BUILD_NUMBER (commit count) as a build arg.
function buildNumber() {
  if (process.env.BUILD_NUMBER) return process.env.BUILD_NUMBER.trim();
  try {
    return execSync("git rev-list --count HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_NUMBER: buildNumber(),
  },
  // Mirrors the production nginx: /api/* is forwarded to the API with the prefix stripped,
  // so dev has the same single origin and the refresh cookie stays same-origin.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:8081";
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
