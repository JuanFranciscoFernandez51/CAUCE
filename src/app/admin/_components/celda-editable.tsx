"use client";

import { useState } from "react";

/**
 * Celda editable inline (regla de oro Cauce): click en el valor → input →
 * Enter o blur guarda, Esc cancela. Sin entrar a la ficha.
 */
export function CeldaEditable({
  valor,
  onGuardar,
  placeholder = "—",
  tipo = "text",
  className = "",
}: {
  valor: string | number | null;
  onGuardar: (nuevo: string) => void | Promise<void>;
  placeholder?: string;
  tipo?: "text" | "number" | "tel" | "email";
  className?: string;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  function abrir() {
    setBorrador(valor === null || valor === undefined ? "" : String(valor));
    setEditando(true);
  }

  async function guardar() {
    setEditando(false);
    const actual = valor === null || valor === undefined ? "" : String(valor);
    if (borrador.trim() !== actual.trim()) await onGuardar(borrador.trim());
  }

  if (editando) {
    return (
      <input
        autoFocus
        type={tipo}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={() => void guardar()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void guardar();
          if (e.key === "Escape") setEditando(false);
        }}
        className={`w-full min-w-24 rounded border border-primary bg-card px-1.5 py-0.5 text-sm outline-none ${className}`}
      />
    );
  }

  const vacio = valor === null || valor === undefined || String(valor).trim() === "";
  return (
    <button
      type="button"
      onClick={abrir}
      title="Click para editar"
      className={`cursor-text rounded px-0.5 text-left hover:bg-primary-soft/60 ${
        vacio ? "text-muted-foreground/60 italic" : ""
      } ${className}`}
    >
      {vacio ? placeholder : String(valor)}
    </button>
  );
}
