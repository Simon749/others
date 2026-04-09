/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your image config (keep this)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/avif', 'image/webp'],
  },

  // React strict mode (good for catching bugs)
  reactStrictMode: true,

  // Compress only in production
  compress: process.env.NODE_ENV === 'production',

  // Turbopack config (empty for now - silences the error)
  turbopack: {},

  // Logging cleanup
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig