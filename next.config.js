/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iljysqrpapazahbihcwd.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'jhevxnqthntmxajogfne.supabase.co',
      },
    ],
  },
  */
  experimental: {
    serverComponentsExternalPackages: ['@supabase/auth-helpers-nextjs']
  }
}

module.exports = nextConfig 