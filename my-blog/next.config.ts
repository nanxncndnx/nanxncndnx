import type { NextConfig } from "next";

const basePath = '/nanxncndnx';

const nextConfig: NextConfig = {
    output: 'export',
    basePath,
    // plain links (like the PDF files) need the base path added by hand
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    images: {
      unoptimized: true,
  },
};

export default nextConfig;
