/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Mirrors the production nginx: /api/* is forwarded to the API with the prefix stripped,
  // so dev has the same single origin and the refresh cookie stays same-origin.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:8081";
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
