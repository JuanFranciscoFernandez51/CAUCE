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
  const MX = 26; // aire lateral: la itálica se escapa a la derecha
  const MY = 16;
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
        viewBox={`${-MX / 2} ${-MY / 2} ${W + MX} ${H + MY}`}
        style={{ height: alto, width: "auto", display: "block" }}
        role="img"
        aria-label="Código Auto"
      >
        <defs>
          {/* Las rayas del cartel */}
          <pattern id={`rayas-${uid}`} width="10" height="15" patternUnits="userSpaceOnUse" patternTransform="translate(0 2)">
            <rect width="10" height="7" fill={color} />
          </pattern>
          <clipPath id={`arriba-${uid}`}>
            <rect x={-MX} y={-MY} width={W + MX * 2} height={corte + MY} />
          </clipPath>
          <clipPath id={`abajo-${uid}`}>
            <rect x={-MX} y={corte} width={W + MX * 2} height={H - corte + MY} />
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
