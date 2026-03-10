import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode for development
  reactStrictMode: true,
  devIndicators: false,
  
  // Configure image optimization
  images: {
    domains: ['localhost'], // Add your image domains here
  }, 
  // Configure build output directory (optional)
   distDir: 'dist',
  
};

export default nextConfig;