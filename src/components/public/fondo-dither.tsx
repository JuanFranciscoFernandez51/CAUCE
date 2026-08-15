"use client";

/**
 * FondoDither — paisaje generativo con trama retro (home "exclusiva", ago-2026).
 * Cuatro capas CSS puras, sin assets ni canvas (mobile-friendly):
 *  1. fd-paisaje: cielo + montañas en tonos verde/oliva con radial-gradients.
 *  2. fd-trama:   puntitos tipo halftone/dither (dos grillas desfasadas).
 *  3. fd-ruido:   grano de "revista escaneada" (SVG feTurbulence en data URI).
 *  4. fd-oscuro:  velo que baja el brillo cuando el sitio está en modo oscuro.
 * Los bordes se difuminan con mask-image para que el contenido respire encima.
 * Estilos en globals.css (bloque HOME "EXCLUSIVA").
 */
export function FondoDither({
  className = "",
  invertida = false,
}: {
  className?: string;
  /** true = el paisaje asoma desde arriba (para secciones de cierre). */
  invertida?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`fondo-dither ${invertida ? "fondo-dither-invertida" : ""} ${className}`}
    >
      <div className="fd-paisaje" />
      <div className="fd-trama" />
      <div className="fd-ruido" />
      <div className="fd-oscuro" />
    </div>
  );
}
