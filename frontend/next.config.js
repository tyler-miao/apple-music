/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || process.env.RAILWAY_SERVICE_BACKEND_URL || 'http://backend.railway.internal:8080'}/api/:path*`,
      },
    ]
  },
  env: {
    NEXT_PUBLIC_API_HOST: process.env.NEXT_PUBLIC_API_HOST || '',
  },
}

module.exports = nextConfig
