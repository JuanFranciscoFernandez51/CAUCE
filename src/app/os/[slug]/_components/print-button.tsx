"use client";

/** Botón de imprimir (Cmd/Ctrl+P programático). Se oculta al imprimir. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print fixed bottom-5 right-5 z-50 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
    >
      🖨️ Imprimir / PDF
    </button>
  );
}
