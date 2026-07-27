"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fmtPrecio, PEDIDO_ESTADO_LABEL, type PedidoEstado } from "@/lib/bazar";
import { BZ } from "./bazar-shell";

/**
 * Mi cuenta del bazar: registro (con 10% primera compra), login con JWT propio
 * del sitio y "Mis pedidos" con estados y seguimiento.
 */

type Me = {
  cuenta: {
    nombre: string;
    email: string;
    telefono: string | null;
    usoDescuento: boolean;
  };
  pedidos: {
    numero: number;
    fecha: string;
    total: number;
    estado: string;
    seguimiento: string | null;
    retiroEnLocal: boolean;
  }[];
};

const ESTADO_COLOR: Record<string, string> = {
  NUEVO: "#9CA3AF",
  PAGADO: "#3FA9A5",
  PREPARANDO: "#F59E0B",
  DESPACHADO: "#2C6E8A",
  ENTREGADO: "#16A34A",
  CANCELADO: "#DC2626",
};

export function CuentaPage({ slug }: { slug: string }) {
  const base = `/sitio/${slug}`;
  const [me, setMe] = useState<Me | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [recienRegistrado, setRecienRegistrado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/sitio/${slug}/cuenta`);
      if (res.ok) {
        const data = (await res.json()) as Me | { cuenta: null };
        setMe(data.cuenta ? (data as Me) : null);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    } finally {
      setCargando(false);
    }
  }, [slug]);

  // Cargar la sesión al montar (fetch async: el setState llega en el callback).
  useEffect(() => {
    queueMicrotask(() => void cargar());
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (tab === "registro" && !form.nombre.trim()) return setError("Decinos tu nombre");
    if (!form.email.trim()) return setError("Ingresá tu email");
    if (form.password.length < 6) return setError("La contraseña necesita al menos 6 caracteres");
    setEnviando(true);
    try {
      const res = await fetch(`/api/public/sitio/${slug}/cuenta/${tab === "login" ? "login" : "registro"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo completar");
      if (tab === "registro") setRecienRegistrado(true);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  async function salir() {
    await fetch(`/api/public/sitio/${slug}/cuenta/salir`, { method: "POST" }).catch(() => null);
    setMe(null);
    setRecienRegistrado(false);
  }

  const campo =
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#3FA9A5]";

  if (cargando) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-gray-400">
        Cargando tu cuenta…
      </div>
    );
  }

  // ── Logueado: datos + mis pedidos ───────────────────────────────────────
  if (me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: BZ.azul }}>
              Hola, {me.cuenta.nombre.split(" ")[0]} 🐚
            </h1>
            <p className="mt-1 text-sm text-gray-500">{me.cuenta.email}</p>
          </div>
          <button
            type="button"
            onClick={salir}
            className="rounded-full border px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            style={{ borderColor: BZ.aquaClaro }}
          >
            Cerrar sesión
          </button>
        </div>

        {!me.cuenta.usoDescuento ? (
          <div
            className="mt-6 rounded-2xl p-5 text-center"
            style={{ backgroundColor: BZ.arena, border: `2px dashed ${BZ.aqua}` }}
          >
            <p className="text-lg font-bold" style={{ color: BZ.azul }}>
              🎁 ¡Tenés 10% OFF en tu primera compra!
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Se aplica solo en el carrito. No acumulable con otros cupones (siempre aplica el
              mayor).
            </p>
            <Link
              href={`${base}/tienda`}
              className="mt-3 inline-block rounded-full px-6 py-2.5 font-semibold text-white"
              style={{ backgroundColor: BZ.aqua }}
            >
              Usarlo ahora
            </Link>
          </div>
        ) : null}

        <h2 className="mt-10 text-xl font-bold" style={{ color: BZ.azul }}>
          Mis pedidos
        </h2>
        {me.pedidos.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed p-8 text-center text-sm text-gray-400">
            Todavía no hiciste ningún pedido.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {me.pedidos.map((p) => (
              <li
                key={p.numero}
                className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
                style={{ borderColor: "#E8F2F1" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold" style={{ color: BZ.azul }}>
                    Pedido #{p.numero}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(p.fecha).toLocaleDateString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                    {" · "}
                    {p.retiroEnLocal ? "Retiro por el local" : "Envío a domicilio"}
                    {p.seguimiento ? ` · Seguimiento: ${p.seguimiento}` : ""}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: ESTADO_COLOR[p.estado] ?? "#9CA3AF" }}
                >
                  {PEDIDO_ESTADO_LABEL[p.estado as PedidoEstado] ?? p.estado}
                </span>
                <span className="font-bold">{fmtPrecio(p.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── No logueado: login / registro ───────────────────────────────────────
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {recienRegistrado ? (
        <div
          className="mb-6 rounded-2xl p-5 text-center"
          style={{ backgroundColor: BZ.arena, border: `2px dashed ${BZ.aqua}` }}
        >
          <p className="font-bold" style={{ color: BZ.azul }}>
            🎉 ¡Cuenta creada! Tenés 10% OFF en tu primera compra.
          </p>
        </div>
      ) : null}

      <h1 className="text-center text-3xl font-extrabold tracking-tight" style={{ color: BZ.azul }}>
        Mi cuenta
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Creá tu cuenta y llevate <strong>10% OFF</strong> en tu primera compra. 🐚
      </p>

      <div
        className="mt-6 flex rounded-full border p-1 text-sm font-semibold"
        style={{ borderColor: BZ.aquaClaro }}
      >
        {(["login", "registro"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setError("");
            }}
            className="flex-1 rounded-full py-2 transition-colors"
            style={tab === t ? { backgroundColor: BZ.aqua, color: "#fff" } : {}}
          >
            {t === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-5 space-y-3">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}
        {tab === "registro" ? (
          <>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre y apellido *"
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Teléfono / WhatsApp"
              inputMode="tel"
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
          </>
        ) : null}
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email *"
          type="email"
          required
          className={campo}
          style={{ borderColor: BZ.aquaClaro }}
        />
        <input
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Contraseña *"
          type="password"
          required
          className={campo}
          style={{ borderColor: BZ.aquaClaro }}
        />
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BZ.aqua }}
        >
          {enviando ? "Un segundo…" : tab === "login" ? "Ingresar" : "Crear mi cuenta"}
        </button>
      </form>
    </div>
  );
}
