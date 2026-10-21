/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', '@node-rs/argon2', 'archiver'],
  experimental: {},
};

export default nextConfig;
