"use client";

/**
 * FondoDither — el agua de Cauce: olas azules en movimiento con trama retro.
 * Cuatro capas CSS puras, sin assets ni canvas (mobile-friendly):
 *  1. fd-paisaje: el agua (profundidad azul + reflejo de luz).
 *  2. fd-olas:    tres capas de olas que derivan y se mecen a distinta velocidad.
 *  3. fd-brillo:  destello que recorre la superficie, como sol sobre el agua.
 *  4. fd-trama:   puntitos tipo halftone/dither (dos grillas desfasadas).
 *  5. fd-ruido:   grano de "revista escaneada" (SVG feTurbulence en data URI).
 *  6. fd-oscuro:  velo que baja el brillo cuando el sitio está en modo oscuro.
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
      <div className="fd-olas fd-olas-3" />
      <div className="fd-olas fd-olas-2" />
      <div className="fd-olas fd-olas-1" />
      <div className="fd-brillo" />
      <div className="fd-trama" />
      <div className="fd-ruido" />
      <div className="fd-oscuro" />
    </div>
  );
}
