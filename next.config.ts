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
  async rewrites() {
    return [
      // Ave Fénix quiso conservar su web tal cual: se sirve el sitio original
      // desde public/avefenix, sin tocar una línea.
      { source: "/sitio/avefenix", destination: "/avefenix/index.html" },
      { source: "/sitio/avefenix/", destination: "/avefenix/index.html" },
      // El sitio usa rutas relativas (logo.png, css/…): se mapea todo el árbol.
      { source: "/sitio/avefenix/:ruta*", destination: "/avefenix/:ruta*" },
    ];
  },
};

export default nextConfig;
