import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'jsonresume-theme-elegant',
    'jsonresume-theme-stackoverflow',
    'jsonresume-theme-kendall',
    'jsonresume-theme-flat',
    'jsonresume-theme-macchiato',
    'jsonresume-theme-class',
    'jsonresume-theme-onepage',
    'pdf-parse',
  ],
};

export default nextConfig;
