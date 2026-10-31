import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Docker builds have no .git (see .dockerignore), so CI passes GIT_SHA as a build arg.
function gitSha() {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_GIT_SHA: gitSha(),
  },
  // Mirrors the production nginx: /api/* is forwarded to the API with the prefix stripped,
  // so dev has the same single origin and the refresh cookie stays same-origin.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:8081";
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
