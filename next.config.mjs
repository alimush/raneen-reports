/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['taxi-app-najaf3.s3.me-south-1.amazonaws.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'odbc'];
    }
    return config;
  },
}

export default nextConfig;
