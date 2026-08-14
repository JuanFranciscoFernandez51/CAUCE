"use client";

export function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="h-9 shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
    >
      Imprimir ticket
    </button>
  );
}
