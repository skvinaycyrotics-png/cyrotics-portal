/** @type {import('next').NextConfig} */
const nextConfig = {
  // Portal is server-rendered — NOT output: 'export'
  // This allows server components and proper metadata
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['www.cyrotics.in'],
  },
};

module.exports = nextConfig;
