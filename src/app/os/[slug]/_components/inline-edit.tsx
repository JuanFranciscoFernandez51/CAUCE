"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Endpoint a PATCHear (ej: /api/os/mi-negocio/cash/abc123) */
  endpoint: string;
  /** Nombre del campo a actualizar (body: { [field]: valor }) */
  field: string;
  /** Valor actual */
  value: string | number | null;
  /** Tipo de input */
  type?: "text" | "number" | "date";
  /** Opciones para un <select> (en vez de input libre) */
  options?: { value: string; label: string }[];
  /** Cómo se muestra cuando NO se está editando */
  display?: (v: string | number | null) => React.ReactNode;
  /** Alinear a la derecha (números) */
  alignRight?: boolean;
  placeholder?: string;
  /** Campos extra que van en el mismo PATCH (ej: { id }) */
  extraBody?: Record<string, unknown>;
};

/**
 * Celda editable inline (estilo planilla): un click muestra el input,
 * Enter o salir del foco guarda con PATCH. Esc cancela. Si falla, revierte
 * y marca la celda en rojo un instante.
 */
export function InlineEdit({
  endpoint,
  field,
  value,
  type = "text",
  options,
  display,
  alignRight,
  placeholder = "—",
  extraBody,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(value == null ? "" : String(value));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Estado derivado: si el valor de afuera cambió (router.refresh), re-sincronizamos.
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setVal(value == null ? "" : String(value));
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) inputRef.current.select();
    }
  }, [editing]);

  async function guardar() {
    const original = value == null ? "" : String(value);
    if (val === original) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const parsedVal =
        type === "number" ? (val === "" ? null : Number(val)) : val;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(extraBody ?? {}), [field]: parsedVal }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      setVal(original);
      setEditing(false);
      setFailed(true);
      setTimeout(() => setFailed(false), 1600);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();
    const cls = `h-8 w-full min-w-20 rounded border border-primary bg-card px-1.5 text-sm focus-visible:outline-none ${alignRight ? "text-right" : ""}`;
    if (options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={val}
          disabled={saving}
          onClick={stop}
          onChange={(e) => setVal(e.target.value)}
          onBlur={guardar}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setVal(value == null ? "" : String(value));
              setEditing(false);
            }
          }}
          className={cls}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={val}
        disabled={saving}
        onClick={stop}
        onChange={(e) => setVal(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") {
            setVal(value == null ? "" : String(value));
            setEditing(false);
          }
        }}
        className={cls}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title={failed ? "No se pudo guardar" : "Click para editar"}
      className={[
        "group/inline -mx-1 inline-flex items-center gap-1 rounded px-1 text-left hover:bg-primary-soft",
        alignRight ? "w-full justify-end" : "",
        failed ? "bg-destructive/15 text-destructive" : "",
      ].join(" ")}
    >
      <span>
        {display
          ? display(value)
          : value === null || value === "" ? (
              <span className="text-muted-foreground/50">{placeholder}</span>
            ) : (
              value
            )}
      </span>
      <span
        aria-hidden
        className="shrink-0 text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover/inline:opacity-100"
      >
        ✎
      </span>
    </button>
  );
}
