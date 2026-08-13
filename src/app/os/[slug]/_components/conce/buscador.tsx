"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Spinner } from "@/components/ui";

export type OpcionBuscador = {
  id: string;
  etiqueta: string;
  /** Segunda línea (teléfono, dominio, precio…). */
  detalle?: string;
};

/**
 * Select con buscador, sin librerías: un input que filtra contra una API y una
 * lista desplegable. Se usa para elegir el cliente y el vehículo en el alta de
 * mandatos, boletos y permutas.
 *
 * Si ya hay algo elegido muestra el chip con la opción de soltarlo y volver a
 * escribir a mano — nunca bloquea la carga manual.
 */
export function Buscador({
  placeholder,
  buscar,
  elegido,
  onElegir,
  onSoltar,
  vacio = "No encontramos nada con eso.",
}: {
  placeholder: string;
  buscar: (q: string) => Promise<OpcionBuscador[]>;
  elegido?: OpcionBuscador | null;
  onElegir: (opcion: OpcionBuscador) => void;
  onSoltar: () => void;
  vacio?: string;
}) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [opciones, setOpciones] = useState<OpcionBuscador[]>([]);
  const caja = useRef<HTMLDivElement>(null);

  // Cerramos al hacer click afuera.
  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  // Búsqueda con respiro de 250 ms para no castigar la API en cada tecla.
  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    setCargando(true);
    const t = setTimeout(async () => {
      try {
        const res = await buscar(q.trim());
        if (vivo) setOpciones(res);
      } catch {
        if (vivo) setOpciones([]);
      } finally {
        if (vivo) setCargando(false);
      }
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // `buscar` se recrea en cada render del padre: la dependencia real es el texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, abierto]);

  if (elegido) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary-soft/40 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{elegido.etiqueta}</p>
          {elegido.detalle ? (
            <p className="truncate text-xs text-muted-foreground">{elegido.detalle}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setQ("");
            onSoltar();
          }}
          className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
        >
          cambiar
        </button>
      </div>
    );
  }

  return (
    <div ref={caja} className="relative">
      <Input
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-card shadow-lg">
          {cargando ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Buscando…
            </div>
          ) : opciones.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">{vacio}</p>
          ) : (
            opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onElegir(o);
                  setAbierto(false);
                  setQ("");
                }}
                className="block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-muted"
              >
                <span className="block truncate text-sm">{o.etiqueta}</span>
                {o.detalle ? (
                  <span className="block truncate text-xs text-muted-foreground">{o.detalle}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
