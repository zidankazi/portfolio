/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
    ],
  },
};

export default nextConfig;
