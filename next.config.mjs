/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'argon2', '@node-rs/argon2', 'archiver'],
  experimental: {},
};

export default nextConfig;
