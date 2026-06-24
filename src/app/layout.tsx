import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/theme";
import { GoogleAnalytics, MetaPixel } from "@/components/analytics";

// Tipografía del brand (dirección Corriente): Space Grotesk (display),
// IBM Plex Sans (cuerpo/UI), IBM Plex Mono (datos).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Cauce — Automatización con IA para tu negocio",
    template: "%s · Cauce",
  },
  description:
    "Cualquier empresa, cualquier proceso, resuelto con mínimos clicks. No vendemos horas: vendemos procesos que se manejan solos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
        {/* Analytics: se activan solos cuando existan las envs en Vercel. */}
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  );
}
