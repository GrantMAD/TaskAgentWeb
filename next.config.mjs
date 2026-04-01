/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ejpjdinrwxodpizgybui.supabase.co',
      },
    ],
  },
};

export default nextConfig;
