"use client";

export function BotonImprimirJess() {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90"
      style={{ backgroundColor: "#1A1816" }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
