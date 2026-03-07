/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @solana/web3.js dan @coral-xyz/anchor butuh polyfill untuk modul Node.js
    // yang tidak tersedia di lingkungan browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
