// client/next.config.js - ADD this file if it doesn't exist

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle the Suspense issue
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Environment variables for runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_MAP_SERVICE_URL: process.env.NEXT_PUBLIC_MAP_SERVICE_URL || 'http://localhost:5001',
  },
  
  // Allow connection to backend container
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://caffis-backend:5000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig