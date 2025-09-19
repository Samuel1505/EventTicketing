/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ipfs.io'], // Allow image optimization for IPFS URLs
  },
};

export default nextConfig;