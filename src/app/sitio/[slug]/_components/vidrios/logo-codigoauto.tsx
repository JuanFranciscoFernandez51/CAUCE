/**
 * Logotipo de Código Auto: la palabra en condensada itálica con las rayas
 * horizontales en la mitad de arriba, como el cartel del local. Es
 * tipográfico y vectorial, así que no tiene fondo y sirve en cualquier
 * tamaño: web, boleto impreso y panel.
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
  // Dos capas recortadas contra el texto: abajo el color macizo, arriba las
  // rayas. El grosor de la raya acompaña el tamaño del logo.
  const paso = Math.max(3, Math.round(alto * 0.1));
  const linea = Math.max(1.5, paso * 0.42);
  const relleno = [
    `linear-gradient(180deg, transparent 0 45%, ${color} 45% 100%)`,
    `repeating-linear-gradient(180deg, ${color} 0 ${linea}px, transparent ${linea}px ${paso}px)`,
  ].join(", ");

  return (
    <span className="inline-flex flex-col" style={{ lineHeight: 1 }}>
      <span
        aria-label="Código Auto"
        className="select-none font-black uppercase italic"
        style={{
          fontFamily: "var(--font-archivo)",
          fontStretch: "62.5%",
          fontSize: alto,
          letterSpacing: "-0.02em",
          backgroundImage: relleno,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        Codigo Auto
      </span>
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
