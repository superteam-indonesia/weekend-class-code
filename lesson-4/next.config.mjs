/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @solana/web3.js butuh polyfill untuk modul Node.js yang tidak ada di browser
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
