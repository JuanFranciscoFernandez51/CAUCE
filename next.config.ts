import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos servidas optimizadas (WebP/AVIF, tamaños) desde Cloudinary y el
    // placeholder de demo. El control de acceso lo pone la app, no el CDN.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
