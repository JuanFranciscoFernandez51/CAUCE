"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RC } from "./conce-shell";

/**
 * Chatbot flotante "¿Qué auto es para vos?" (esquina inferior derecha).
 * Pregunta uso/presupuesto/familia y recomienda 2-3 unidades REALES del stock
 * con link a la ficha. Server route con IA (Anthropic) o recomendador por
 * reglas si no hay API key — la demo anda igual.
 */

type Sugerencia = {
  slug: string;
  titulo: string;
  precio: string;
  foto: string | null;
};

type Msg = {
  rol: "user" | "bot";
  texto: string;
  sugerencias?: Sugerencia[];
};

const SALUDO: Msg = {
  rol: "bot",
  texto:
    "¡Hola! 👋 Soy el asesor de Ri Cars. Contame: ¿para qué lo vas a usar (ciudad, ruta, trabajo, familia)? ¿Y qué presupuesto tenés más o menos?",
};

export function Chatbot({ slug }: { slug: string }) {
  const base = `/sitio/${slug}`;
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([SALUDO]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando, abierto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || pensando) return;
    const nuevas: Msg[] = [...mensajes, { rol: "user", texto: t }];
    setMensajes(nuevas);
    setTexto("");
    setPensando(true);
    try {
      const res = await fetch(`/api/public/sitio/${slug}/asesor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: nuevas.slice(-10).map((m) => ({ rol: m.rol, texto: m.texto })),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        texto?: string;
        sugerencias?: Sugerencia[];
        error?: string;
      } | null;
      if (!res.ok || !data?.texto) {
        throw new Error(data?.error ?? "sin respuesta");
      }
      setMensajes((prev) => [
        ...prev,
        { rol: "bot", texto: data.texto!, sugerencias: data.sugerencias },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "bot",
          texto:
            "Uy, se me cruzaron los cables 😅. Probá de nuevo, o escribinos directo por WhatsApp al 291 503-8204.",
        },
      ]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full py-3 pl-4 pr-5 text-sm font-bold shadow-xl transition-transform hover:scale-105"
          style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
        >
          <span className="text-lg">🤖</span> ¿Qué auto es para vos?
        </button>
      ) : null}

      {/* Panel */}
      {abierto ? (
        <div
          className="fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          style={{ height: "min(560px, calc(100vh - 6rem))", border: `1px solid ${RC.borde}` }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: RC.negro }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: RC.dorado }}>
                🤖
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-white">Asesor Ri Cars</p>
                <p className="text-[11px]" style={{ color: RC.dorado }}>
                  Te ayudo a encontrar tu auto ideal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar"
              className="rounded-full px-2 py-1 text-lg text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" style={{ backgroundColor: RC.fondo }}>
            {mensajes.map((m, i) => (
              <div key={i} className={m.rol === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%] space-y-2">
                  <div
                    className="whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      m.rol === "user"
                        ? { backgroundColor: RC.negro, color: "#fff", borderBottomRightRadius: 6 }
                        : { backgroundColor: "#fff", border: `1px solid ${RC.borde}`, borderBottomLeftRadius: 6 }
                    }
                  >
                    {m.texto}
                  </div>
                  {m.sugerencias?.length ? (
                    <div className="space-y-1.5">
                      {m.sugerencias.map((s) => (
                        <Link
                          key={s.slug}
                          href={`${base}/vehiculo/${s.slug}`}
                          className="flex items-center gap-2.5 rounded-2xl bg-white p-2 shadow-sm transition-transform hover:scale-[1.01]"
                          style={{ border: `1px solid ${RC.borde}` }}
                        >
                          {s.foto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.foto} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <span className="flex h-12 w-16 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: RC.doradoSuave }}>🚗</span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold">{s.titulo}</p>
                            <p className="text-xs font-bold" style={{ color: RC.doradoTexto }}>
                              {s.precio}
                            </p>
                          </div>
                          <span className="pr-1 text-sm" style={{ color: RC.dorado }}>→</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {pensando ? (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm text-gray-500"
                  style={{ backgroundColor: "#fff", border: `1px solid ${RC.borde}` }}
                >
                  Buscando en el stock…
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={enviar} className="flex items-center gap-2 border-t bg-white p-3" style={{ borderColor: RC.borde }}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: algo familiar hasta 30 millones…"
              className="h-10 flex-1 rounded-full border px-4 text-sm outline-none focus:border-[#D18E00]"
              style={{ borderColor: RC.borde }}
            />
            <button
              type="submit"
              disabled={pensando}
              aria-label="Enviar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg disabled:opacity-50"
              style={{ backgroundColor: RC.dorado }}
            >
              ➤
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
