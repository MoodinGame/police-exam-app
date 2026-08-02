/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows an isolated verification build while one or more local dev servers are open.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
