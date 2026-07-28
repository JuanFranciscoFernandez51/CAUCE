"use client";

/** Botón "Descargar PDF": imprime la ficha (Cmd/Ctrl+P programático). */
export function PrintFicha() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-medium transition hover:bg-black/5"
    >
      🖨️ Descargar ficha en PDF
    </button>
  );
}
