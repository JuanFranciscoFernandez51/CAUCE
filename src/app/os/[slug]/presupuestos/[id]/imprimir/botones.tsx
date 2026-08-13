"use client";

export function BotonesImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="h-9 rounded-lg px-4 text-sm font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: "#14201E" }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
