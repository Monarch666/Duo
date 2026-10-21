/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@node-rs/argon2', 'archiver'],
  experimental: {},
};

export default nextConfig;
