"use client";

/** Botón "Descargar PDF": imprime la ficha (Cmd/Ctrl+P programático). */
export function PrintFicha() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
    >
      🖨️ Descargar ficha en PDF
    </button>
  );
}
