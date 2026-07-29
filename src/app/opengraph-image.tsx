import { ImageResponse } from "next/og";

/** Imagen que se ve al compartir el link (WhatsApp, IG, Twitter, Slack…). */
export const alt = "Cauce — Que tu negocio fluya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #182337 0%, #0B1220 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Isologo: tres corrientes que convergen en el punto cian */}
        <svg width="150" height="150" viewBox="0 0 48 48">
          <path d="M9 15 C21 15 22 24 36 24" stroke="#2E6BFF" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M9 24 C21 24 22 24 36 24" stroke="#5E8CFF" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M9 33 C21 33 22 24 36 24" stroke="#9DB6FF" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="24" r="4.6" fill="#7FE8FF" />
        </svg>

        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#F4F7FC", letterSpacing: -3, marginTop: 8 }}>
          Cauce
        </div>
        <div style={{ display: "flex", fontSize: 42, color: "#DDE7F5", marginTop: 10 }}>
          Que tu negocio fluya
        </div>
        <div style={{ display: "flex", fontSize: 27, color: "#7FE8FF", marginTop: 30, fontWeight: 600 }}>
          Software hecho 100% a la medida de tu negocio
        </div>
      </div>
    ),
    size
  );
}
