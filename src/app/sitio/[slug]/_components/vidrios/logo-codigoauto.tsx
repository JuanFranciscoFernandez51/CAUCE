"use client";

import { useId } from "react";

/**
 * Logotipo de Código Auto en SVG: la palabra en condensada itálica con las
 * rayas horizontales en la mitad de arriba, como el cartel del local.
 * Vectorial y sin fondo: sirve igual en web, en el boleto impreso y en el panel.
 */
export function LogoCodigoAuto({
  alto = 44,
  color = "#ffffff",
  bajada = true,
}: {
  /** Alto del wordmark en px. */
  alto?: number;
  color?: string;
  /** Muestra la bajada "Parabrisas · Autopartes · Venta y colocación". */
  bajada?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  // Caja del wordmark en unidades del viewBox (la tipografía se ajusta sola).
  const W = 1000;
  const H = 190;
  const corte = H * 0.47; // dónde terminan las rayas y arranca el macizo
  const fuente = {
    fontFamily: "var(--font-archivo), 'Archivo', 'Arial Narrow', system-ui, sans-serif",
    fontSize: 165,
    fontWeight: 900,
    fontStyle: "italic" as const,
    fontStretch: "62.5%",
    letterSpacing: "-2",
  };

  return (
    <span className="inline-flex flex-col" style={{ lineHeight: 1 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ height: alto, width: "auto", display: "block" }}
        role="img"
        aria-label="Código Auto"
      >
        <defs>
          {/* Las rayas del cartel */}
          <pattern id={`rayas-${uid}`} width="10" height="15" patternUnits="userSpaceOnUse">
            <rect width="10" height="7" fill={color} />
          </pattern>
          <clipPath id={`arriba-${uid}`}>
            <rect x="0" y="0" width={W} height={corte} />
          </clipPath>
          <clipPath id={`abajo-${uid}`}>
            <rect x="0" y={corte} width={W} height={H - corte} />
          </clipPath>
        </defs>

        {/* Mitad de abajo: macizo */}
        <text x="0" y="150" textLength={W} lengthAdjust="spacingAndGlyphs" fill={color} clipPath={`url(#abajo-${uid})`} style={fuente}>
          CODIGO AUTO
        </text>
        {/* Mitad de arriba: rayada */}
        <text
          x="0"
          y="150"
          textLength={W}
          lengthAdjust="spacingAndGlyphs"
          fill={`url(#rayas-${uid})`}
          clipPath={`url(#arriba-${uid})`}
          style={fuente}
        >
          CODIGO AUTO
        </text>
      </svg>

      {bajada ? (
        <span
          className="mt-1 font-semibold uppercase"
          style={{
            fontFamily: "var(--font-archivo)",
            fontStretch: "62.5%",
            fontSize: Math.max(7, Math.round(alto * 0.15)),
            letterSpacing: "0.16em",
            color,
            opacity: 0.72,
          }}
        >
          Parabrisas · Autopartes · Venta y colocación
        </span>
      ) : null}
    </span>
  );
}
