/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export in production build
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  trailingSlash: true,
};

export default nextConfig;
